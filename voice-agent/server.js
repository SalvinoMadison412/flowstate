// Inbound voice agent: Twilio PSTN call <-> Gemini Live (speech-to-speech).
//
// One process. No database, no CRM, no platform account. Config in agent.json.
//
//   caller -> Twilio number -> POST /voice  (returns <Connect><Stream>)
//                           -> WSS /media   (this file bridges the audio)
//                                        <-> Gemini Live
//
// Transfers use the Twilio REST API to redirect the live call, because <Connect>
// is terminal TwiML — you cannot "return" from a stream to a <Dial>.

import http from "node:http";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { WebSocketServer, WebSocket } from "ws";
import { twilioToGemini, geminiToTwilio } from "./audio.js";

const cfg = JSON.parse(readFileSync(new URL("./agent.json", import.meta.url), "utf8"));

const {
  GEMINI_API_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  PUBLIC_HOST, // e.g. voice.example.com — no scheme, no trailing slash
  PORT = 8080,
  SKIP_SIGNATURE_CHECK,
} = process.env;

for (const [k, v] of Object.entries({ GEMINI_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, PUBLIC_HOST }))
  if (!v) throw new Error(`Missing env: ${k}`);

const GEMINI_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=" +
  GEMINI_API_KEY;

// ── Twilio webhook signature (HMAC-SHA1 of URL + sorted params) ──────────────
function verifySignature(url, params, signature) {
  if (!signature) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = crypto.createHmac("sha1", TWILIO_AUTH_TOKEN).update(Buffer.from(data, "utf8")).digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

const xmlEscape = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

/** Redirect a live call to new TwiML. Used for transfer-to-human. */
async function redirectCall(callSid, twiml) {
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls/${callSid}.json`, {
    method: "POST",
    headers: {
      authorization: "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ Twiml: twiml }),
  });
  if (!res.ok) console.error("[transfer] failed", res.status, await res.text());
  return res.ok;
}

const transferTwiml = () =>
  `<Response><Say>${xmlEscape(cfg.transferMessage)}</Say><Dial>${xmlEscape(cfg.transferNumber)}</Dial></Response>`;

// ── HTTP: the TwiML webhook ─────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200).end("ok");
    return;
  }
  if (req.method !== "POST" || !req.url.startsWith("/voice")) {
    res.writeHead(404).end();
    return;
  }

  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const params = Object.fromEntries(new URLSearchParams(body));
    const url = `https://${PUBLIC_HOST}/voice`;
    if (SKIP_SIGNATURE_CHECK !== "true" && !verifySignature(url, params, req.headers["x-twilio-signature"])) {
      res.writeHead(403, { "content-type": "text/xml" });
      res.end(`<Response><Say>This call could not be verified.</Say><Hangup/></Response>`);
      return;
    }
    res.writeHead(200, { "content-type": "text/xml" });
    res.end(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Connect><Stream url="wss://${PUBLIC_HOST}/media"/></Connect></Response>`,
    );
  });
});

// ── WebSocket: the media bridge ─────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: "/media" });

wss.on("connection", (twilioWs) => {
  let streamSid = null;
  let callSid = null;
  let transferring = false;
  let hangupTimer = null;

  const gemini = new WebSocket(GEMINI_URL);
  const pending = []; // caller audio that arrives before Gemini's setup completes
  let geminiReady = false;

  const log = (...a) => console.log(`[${callSid ?? "?"}]`, ...a);

  /** Hand the call to a human and tear the bridge down. */
  const transfer = async (why) => {
    if (transferring || !callSid) return;
    transferring = true;
    log("transfer:", why);
    await redirectCall(callSid, transferTwiml());
    gemini.close();
    twilioWs.close();
  };

  const sendToTwilio = (ulaw) => {
    // 160 bytes = 20ms at 8kHz. Twilio buffers; no pacing needed on our side.
    for (let i = 0; i < ulaw.length; i += 160) {
      twilioWs.send(
        JSON.stringify({
          event: "media",
          streamSid,
          media: { payload: ulaw.subarray(i, i + 160).toString("base64") },
        }),
      );
    }
  };

  gemini.on("open", () => {
    gemini.send(
      JSON.stringify({
        setup: {
          model: cfg.model,
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: cfg.voice } } },
          },
          systemInstruction: { parts: [{ text: cfg.systemPrompt }] },
          tools: [
            {
              functionDeclarations: [
                {
                  name: "transfer_to_human",
                  description:
                    "Hand the call to a person. Call this whenever the caller asks for a human, is angry or confused, or asks anything you do not have a fact for. Never guess instead of calling this.",
                  parameters: {
                    type: "OBJECT",
                    properties: { reason: { type: "STRING", description: "Why you are transferring." } },
                    required: ["reason"],
                  },
                },
              ],
            },
          ],
        },
      }),
    );
  });

  gemini.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.setupComplete) {
      geminiReady = true;
      // Make the agent speak first.
      gemini.send(
        JSON.stringify({
          clientContent: {
            turns: [{ role: "user", parts: [{ text: cfg.greetingTrigger }] }],
            turnComplete: true,
          },
        }),
      );
      for (const chunk of pending.splice(0)) sendAudioToGemini(chunk);
      return;
    }

    if (msg.toolCall) {
      for (const call of msg.toolCall.functionCalls ?? []) {
        if (call.name !== "transfer_to_human") continue;
        // Acknowledge so the model doesn't hang waiting, then hand off.
        gemini.send(
          JSON.stringify({
            toolResponse: {
              functionResponses: [{ id: call.id, name: call.name, response: { ok: true } }],
            },
          }),
        );
        transfer(call.args?.reason ?? "model requested");
      }
      return;
    }

    const sc = msg.serverContent;
    if (!sc) return;

    // Barge-in: caller talked over the agent. Drop what Twilio has queued.
    if (sc.interrupted && streamSid) {
      twilioWs.send(JSON.stringify({ event: "clear", streamSid }));
      return;
    }

    for (const part of sc.modelTurn?.parts ?? []) {
      const b64 = part.inlineData?.data;
      if (b64) sendToTwilio(geminiToTwilio(Buffer.from(b64, "base64")));
    }
  });

  gemini.on("error", (e) => {
    log("gemini error", e.message);
    transfer("gemini error"); // a human beats a dead line
  });
  gemini.on("close", () => log("gemini closed"));

  // realtimeInput.mediaChunks is deprecated; the current field is realtimeInput.audio.
  const sendAudioToGemini = (pcm) =>
    gemini.send(
      JSON.stringify({
        realtimeInput: { audio: { mimeType: "audio/pcm;rate=16000", data: pcm.toString("base64") } },
      }),
    );

  twilioWs.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.event) {
      case "start":
        streamSid = msg.start.streamSid;
        callSid = msg.start.callSid;
        log("call started");
        hangupTimer = setTimeout(() => {
          log("max duration reached");
          twilioWs.close();
        }, cfg.maxCallSeconds * 1000);
        break;

      case "media": {
        const pcm = twilioToGemini(Buffer.from(msg.media.payload, "base64"));
        if (geminiReady) sendAudioToGemini(pcm);
        else pending.push(pcm);
        break;
      }

      case "dtmf":
        // The escape hatch the model cannot veto. Pressing 0 always reaches a human.
        if (msg.dtmf?.digit === "0") transfer("caller pressed 0");
        break;

      case "stop":
        log("call ended");
        break;
    }
  });

  twilioWs.on("close", () => {
    clearTimeout(hangupTimer);
    if (gemini.readyState === WebSocket.OPEN) gemini.close();
  });
});

server.listen(PORT, () => console.log(`voice agent on :${PORT} (public: ${PUBLIC_HOST})`));
