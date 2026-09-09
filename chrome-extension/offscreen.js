// Hosts the Twilio Voice Device. Runs in the offscreen document (a real DOM
// with WebRTC + microphone). All control comes from the service worker over
// chrome.runtime messaging; all call events go back the same way.

const Twilio = globalThis.Twilio;

let device = null;
let activeCall = null; // the connected/ringing call
let incoming = null; // an unanswered inbound call
let startedAt = 0;
let heldMuteWasOn = false;

function toBg(payload) {
  chrome.runtime.sendMessage({ target: "background", type: "device-event", ...payload });
}

function summarize(call, direction, number, status) {
  return {
    callSid: call?.parameters?.CallSid || call?.outboundConnectionId || null,
    direction,
    number,
    durationSeconds: startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0,
    status,
  };
}

function wireCall(call, direction, number) {
  activeCall = call;
  startedAt = 0;

  call.on("accept", () => {
    startedAt = Date.now();
    toBg({ event: "accept", callSid: call.parameters?.CallSid || null, direction, number });
  });

  call.on("disconnect", () => {
    toBg({ event: "disconnect", summary: summarize(call, direction, number, "completed") });
    if (activeCall === call) activeCall = null;
    startedAt = 0;
  });

  call.on("cancel", () => {
    toBg({ event: "disconnect", summary: summarize(call, direction, number, "canceled") });
    if (activeCall === call) activeCall = null;
  });

  call.on("reject", () => {
    toBg({ event: "disconnect", summary: summarize(call, direction, number, "no-answer") });
    if (activeCall === call) activeCall = null;
  });

  call.on("error", (e) => {
    toBg({ event: "error", message: e?.message || "Call error", code: e?.code });
    toBg({ event: "disconnect", summary: summarize(call, direction, number, "failed") });
    if (activeCall === call) activeCall = null;
  });

  call.on("reconnecting", () => toBg({ event: "reconnecting" }));
  call.on("reconnected", () => toBg({ event: "reconnected" }));
  call.on("mute", (isMuted) => toBg({ event: "mute", on: isMuted }));
}

/** Token errors that mean the current Device is dead — recreate, don't patch. */
const FATAL_TOKEN_CODES = new Set([20101, 20102, 20103, 20104, 20151, 31204]);

async function initDevice(token) {
  if (device && device.state !== "destroyed") {
    try {
      device.updateToken(token);
      // updateToken alone doesn't re-register a Device that fell out of
      // registration (e.g. after an expired/invalid token) — kick it.
      if (device.state !== "registered") await device.register();
      toBg({ event: "ready" });
      return;
    } catch {
      try { device.destroy(); } catch {}
      device = null;
    }
  }

  device = new Twilio.Device(token, {
    codecPreferences: ["opus", "pcmu"],
    logLevel: "error",
    closeProtection: true,
  });

  device.on("registered", () => toBg({ event: "ready" }));
  device.on("unregistered", () => toBg({ event: "unregistered" }));
  device.on("tokenWillExpire", () => toBg({ event: "tokenWillExpire" }));
  device.on("error", (e) => {
    toBg({ event: "error", message: e?.message || "Device error", code: e?.code });
    // A bad/expired token can't be salvaged in place — drop the Device so the
    // next init (from the keepalive alarm or a retry) builds a fresh one.
    if (FATAL_TOKEN_CODES.has(e?.code) && !activeCall) {
      try { device.destroy(); } catch {}
      device = null;
      toBg({ event: "needs-token" });
    }
  });

  device.on("incoming", (call) => {
    incoming = call;
    const from = call.parameters?.From || "Unknown";
    toBg({ event: "incoming", from, callSid: call.parameters?.CallSid || null });
    call.on("cancel", () => {
      if (incoming === call) incoming = null;
      toBg({ event: "incoming-cancel" });
    });
    call.on("disconnect", () => {
      if (incoming === call) incoming = null;
    });
  });

  try {
    await device.register();
  } catch (e) {
    toBg({ event: "error", message: e?.message || "Could not register device" });
  }
}

async function placeCall({ to, leadId, leadName }) {
  if (!device) {
    toBg({ event: "error", message: "Device not ready" });
    return;
  }
  try {
    const call = await device.connect({ params: { To: to } });
    wireCall(call, "outbound", to);
    toBg({ event: "dialing", number: to, leadId, leadName });
  } catch (e) {
    toBg({ event: "error", message: micErrorText(e) });
  }
}

function micErrorText(e) {
  const m = (e && (e.message || e.name)) || "Could not start the call";
  if (/permission|NotAllowed|denied/i.test(m))
    return "Microphone blocked. Open the dialer's settings and grant mic access.";
  if (/NotFound|Requested device/i.test(m)) return "No microphone found.";
  return m;
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.target !== "offscreen") return;
  switch (msg.cmd) {
    case "init":
      initDevice(msg.token);
      break;
    case "updateToken":
      if (device) try { device.updateToken(msg.token); } catch {}
      break;
    case "call":
      placeCall(msg);
      break;
    case "accept":
      if (incoming) {
        const call = incoming;
        incoming = null;
        wireCall(call, "inbound", call.parameters?.From || "");
        call.accept();
      }
      break;
    case "reject":
      if (incoming) { incoming.reject(); incoming = null; toBg({ event: "incoming-cancel" }); }
      break;
    case "hangup":
      if (activeCall) activeCall.disconnect();
      else if (incoming) { incoming.reject(); incoming = null; }
      break;
    case "mute":
      if (activeCall) activeCall.mute(!!msg.on);
      break;
    case "hold":
      // Soft hold: mute the mic so the other side hears silence. True hold needs
      // a server-side redirect to hold-music TwiML — see DIALER_SETUP.md.
      if (activeCall) {
        if (msg.on) {
          heldMuteWasOn = activeCall.isMuted();
          activeCall.mute(true);
        } else {
          activeCall.mute(heldMuteWasOn);
        }
        toBg({ event: "hold", on: !!msg.on });
      }
      break;
    case "digits":
      if (activeCall && msg.digits) activeCall.sendDigits(String(msg.digits));
      break;
    case "teardown":
      try { if (activeCall) activeCall.disconnect(); } catch {}
      try { if (device) device.destroy(); } catch {}
      device = null;
      activeCall = null;
      incoming = null;
      break;
  }
});

toBg({ event: "offscreen-loaded" });
