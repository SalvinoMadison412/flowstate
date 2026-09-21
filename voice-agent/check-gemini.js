// Does Gemini Live actually accept our setup? Run this BEFORE wiring any phone
// number — it needs only GEMINI_API_KEY, no Twilio, no ngrok, no money.
//
//   GEMINI_API_KEY=... node check-gemini.js
//
// Checks: the model name is valid, the voice exists, the tool declaration is
// accepted, and audio actually comes back. Falls back to agent.json's
// modelFallback if the primary model is rejected.
import { readFileSync } from "node:fs";
import { WebSocket } from "ws";

const cfg = JSON.parse(readFileSync(new URL("./agent.json", import.meta.url), "utf8"));
const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error("Set GEMINI_API_KEY");

const URL_ =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=" +
  key;

function tryModel(model) {
  return new Promise((resolve) => {
    const ws = new WebSocket(URL_);
    let audioBytes = 0;
    let setupOk = false;
    const done = (ok, note) => {
      try { ws.close(); } catch {}
      clearTimeout(timer);
      resolve({ ok, note, audioBytes });
    };
    const timer = setTimeout(() => done(false, "timed out after 25s"), 25000);

    ws.on("open", () =>
      ws.send(
        JSON.stringify({
          setup: {
            model,
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
                    description: "Hand the call to a person.",
                    parameters: {
                      type: "OBJECT",
                      properties: { reason: { type: "STRING" } },
                      required: ["reason"],
                    },
                  },
                ],
              },
            ],
          },
        }),
      ),
    );

    ws.on("message", (raw) => {
      let m;
      try { m = JSON.parse(raw.toString()); } catch { return; }

      if (m.setupComplete) {
        setupOk = true;
        console.log(`  setup accepted (model + voice + tool all valid)`);
        ws.send(
          JSON.stringify({
            clientContent: {
              turns: [{ role: "user", parts: [{ text: cfg.greetingTrigger }] }],
              turnComplete: true,
            },
          }),
        );
        return;
      }
      for (const p of m.serverContent?.modelTurn?.parts ?? []) {
        if (p.inlineData?.data) audioBytes += Buffer.from(p.inlineData.data, "base64").length;
      }
      if (m.serverContent?.turnComplete) {
        done(audioBytes > 0, audioBytes > 0 ? "spoke its greeting" : "turn completed but sent no audio");
      }
    });

    ws.on("error", (e) => done(false, e.message));
    ws.on("close", (code, reason) => {
      if (!setupOk) done(false, `closed ${code}: ${reason?.toString() || "model likely rejected"}`);
    });
  });
}

const models = [cfg.model, cfg.modelFallback].filter(Boolean);
for (const m of models) {
  console.log(`\nTrying ${m}`);
  const r = await tryModel(m);
  if (r.ok) {
    console.log(`  OK — ${r.note}, ${r.audioBytes} bytes of audio (24kHz PCM)`);
    console.log(`  ~${(r.audioBytes / 48000).toFixed(1)}s of speech\n`);
    if (m !== cfg.model) console.log(`Set "model" in agent.json to ${m}\n`);
    process.exit(0);
  }
  console.log(`  FAILED — ${r.note}`);
}
console.error("\nNo working model. Check the key, then check current model names at ai.google.dev/gemini-api/docs/live\n");
process.exit(1);
