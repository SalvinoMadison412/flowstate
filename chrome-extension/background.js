// Service worker: coordinates the popup UI and the offscreen Twilio Device,
// owns the Twilio token lifecycle, raises incoming-call notifications, and is
// the fallback that logs a call if the popup isn't open when it ends.

import { crmBaseUrl } from "./config.js";
import {
  getAccessToken,
  currentEmail,
  contactByPhone,
  logCall,
} from "./lib/supabase-rest.js";

const OFFSCREEN_PATH = "offscreen.html";
const AUTO_LOG_DELAY_MS = 9000;

/** In-memory call state, mirrored to storage.session so a reopened popup resyncs. */
let state = {
  phase: "idle", // idle | signed-out | device-error | ready | dialing | ringing-in | on-call | ended
  direction: null,
  number: null,
  leadId: null,
  leadName: null,
  muted: false,
  held: false,
  startedAt: 0,
  error: null,
  lastEnded: null,
};

let pendingLog = null; // { summary, timer } waiting for the popup to claim it

async function setState(patch) {
  state = { ...state, ...patch };
  await chrome.storage.session.set({ callState: state });
  chrome.runtime.sendMessage({ type: "state", state }).catch(() => {});
}

// ── offscreen document ──────────────────────────────────────────────────────
async function hasOffscreen() {
  const ctxs = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });
  return ctxs.length > 0;
}

let creating = null;
async function ensureOffscreen() {
  if (await hasOffscreen()) return;
  if (!creating)
    creating = chrome.offscreen
      .createDocument({
        url: OFFSCREEN_PATH,
        reasons: ["USER_MEDIA", "WEB_RTC"],
        justification: "Runs the Twilio Voice Device for the softphone.",
      })
      .finally(() => (creating = null));
  await creating;
}

function toOffscreen(msg) {
  return chrome.runtime.sendMessage({ target: "offscreen", ...msg }).catch(() => {});
}

// ── Twilio token ────────────────────────────────────────────────────────────
async function fetchTwilioToken() {
  const supaToken = await getAccessToken();
  if (!supaToken) throw new Error("signed-out");
  const base = await crmBaseUrl();
  const res = await fetch(`${base}/api/twilio/token`, {
    headers: { Authorization: `Bearer ${supaToken}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Token request failed (${res.status})`);
  }
  return (await res.json()).token;
}

async function initDevice() {
  try {
    const token = await fetchTwilioToken();
    await ensureOffscreen();
    await toOffscreen({ cmd: "init", token });
  } catch (e) {
    if (e.message === "signed-out") await setState({ phase: "signed-out" });
    else await setState({ phase: "device-error", error: e.message });
  }
}

// ── device events (from offscreen) ──────────────────────────────────────────
async function onDeviceEvent(m) {
  switch (m.event) {
    case "offscreen-loaded":
      break;
    case "ready":
      if (["idle", "device-error", "signed-out", "ended"].includes(state.phase))
        await setState({ phase: "ready", error: null });
      break;
    case "tokenWillExpire":
      try {
        const token = await fetchTwilioToken();
        await toOffscreen({ cmd: "updateToken", token });
      } catch (e) {
        await setState({ phase: "device-error", error: e.message });
      }
      break;
    case "dialing":
      await setState({
        phase: "dialing",
        direction: "outbound",
        number: m.number,
        leadId: m.leadId ?? null,
        leadName: m.leadName ?? null,
        muted: false,
        held: false,
        startedAt: 0,
        error: null,
      });
      break;
    case "accept":
      await setState({ phase: "on-call", startedAt: Date.now(), direction: m.direction || state.direction });
      break;
    case "incoming": {
      const num = String(m.from || "").replace(/^client:/, "");
      let leadName = null;
      let leadId = null;
      try {
        const lead = await contactByPhone(num);
        if (lead) { leadName = lead.name; leadId = lead.id; }
      } catch {}
      await setState({
        phase: "ringing-in",
        direction: "inbound",
        number: num,
        leadId,
        leadName,
        muted: false,
        held: false,
        startedAt: 0,
      });
      await notifyIncoming(num, leadName);
      break;
    }
    case "incoming-cancel":
      await clearNotification();
      if (state.phase === "ringing-in") await setState({ phase: "ready" });
      break;
    case "mute":
      await setState({ muted: !!m.on });
      break;
    case "hold":
      await setState({ held: !!m.on });
      break;
    case "reconnecting":
      await setState({ error: "Reconnecting…" });
      break;
    case "reconnected":
      await setState({ error: null });
      break;
    case "disconnect":
      await clearNotification();
      await onCallEnded(m.summary);
      break;
    case "unregistered":
      // Try to bring it back unless we deliberately tore down.
      if (state.phase !== "idle") setTimeout(initDevice, 2000);
      break;
    case "needs-token":
      // Offscreen threw away a Device over a bad/expired token — rebuild it
      // with a fresh one.
      setTimeout(initDevice, 1500);
      break;
    case "error":
      await setState({
        phase: ["on-call", "dialing"].includes(state.phase) ? state.phase : "device-error",
        error: m.message,
      });
      break;
  }
}

async function onCallEnded(summary) {
  const merged = {
    ...summary,
    number: summary.number || state.number,
    leadId: state.leadId,
    leadName: state.leadName,
  };
  await setState({ phase: "ended", startedAt: 0, held: false, muted: false, lastEnded: merged });

  // Give the popup a window to save notes; otherwise log it ourselves.
  if (pendingLog?.timer) clearTimeout(pendingLog.timer);
  pendingLog = {
    summary: merged,
    timer: setTimeout(() => finalizeLog(null), AUTO_LOG_DELAY_MS),
  };
}

async function finalizeLog(notes) {
  const job = pendingLog;
  if (!job) return;
  pendingLog = null;
  clearTimeout(job.timer);
  try {
    await logCall({
      contact_id: job.summary.leadId || null,
      phone_number: job.summary.number,
      direction: job.summary.direction,
      duration_seconds: job.summary.durationSeconds,
      status: job.summary.status,
      notes: notes || null,
      twilio_call_sid: job.summary.callSid,
      timestamp: new Date(Date.now() - job.summary.durationSeconds * 1000).toISOString(),
    });
  } catch (e) {
    // 409 = the popup already logged it; anything else we surface once.
    if (!/\(409\)/.test(e.message))
      chrome.runtime.sendMessage({ type: "log-error", message: e.message }).catch(() => {});
  }
}

// ── notifications ───────────────────────────────────────────────────────────
const NOTIF_ID = "flow-state-incoming";
async function notifyIncoming(number, leadName) {
  try {
    await chrome.notifications.create(NOTIF_ID, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: leadName ? `Incoming call — ${leadName}` : "Incoming call",
      message: number,
      buttons: [{ title: "Accept" }, { title: "Reject" }],
      requireInteraction: true,
      priority: 2,
    });
  } catch {}
}
async function clearNotification() {
  try { await chrome.notifications.clear(NOTIF_ID); } catch {}
}
chrome.notifications.onButtonClicked.addListener(async (id, idx) => {
  if (id !== NOTIF_ID) return;
  await clearNotification();
  if (idx === 0) {
    await toOffscreen({ cmd: "accept" });
    try { await chrome.action.openPopup(); } catch {}
  } else {
    await toOffscreen({ cmd: "reject" });
  }
});
chrome.notifications.onClicked.addListener(async (id) => {
  if (id !== NOTIF_ID) return;
  try { await chrome.action.openPopup(); } catch {}
});

// ── messages from the popup ─────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.target === "background" && msg.type === "device-event") {
    onDeviceEvent(msg);
    return false;
  }
  if (msg?.type !== "popup") return false;

  (async () => {
    switch (msg.cmd) {
      case "get-state":
        sendResponse({ state, email: await currentEmail() });
        return;
      case "ensure-device":
        if (!(await hasOffscreen()) || ["idle", "device-error", "signed-out"].includes(state.phase))
          await initDevice();
        sendResponse({ ok: true });
        return;
      case "call": {
        await setState({ error: null });
        if (!(await hasOffscreen())) await initDevice();
        await ensureOffscreen();
        await toOffscreen({
          cmd: "call",
          to: msg.to,
          leadId: msg.leadId ?? null,
          leadName: msg.leadName ?? null,
        });
        sendResponse({ ok: true });
        return;
      }
      case "accept":
        await clearNotification();
        await toOffscreen({ cmd: "accept" });
        sendResponse({ ok: true });
        return;
      case "hangup":
      case "reject":
        await clearNotification();
        await toOffscreen({ cmd: msg.cmd === "reject" ? "reject" : "hangup" });
        sendResponse({ ok: true });
        return;
      case "mute":
        await toOffscreen({ cmd: "mute", on: msg.on });
        sendResponse({ ok: true });
        return;
      case "hold":
        await toOffscreen({ cmd: "hold", on: msg.on });
        sendResponse({ ok: true });
        return;
      case "digits":
        await toOffscreen({ cmd: "digits", digits: msg.digits });
        sendResponse({ ok: true });
        return;
      case "claim-log":
        // Popup is open and will handle notes — push the auto-log out.
        if (pendingLog?.timer) {
          clearTimeout(pendingLog.timer);
          pendingLog.timer = setTimeout(() => finalizeLog(null), 120000);
        }
        sendResponse({ ok: true, pending: pendingLog?.summary || null });
        return;
      case "logged":
        // Popup logged the call itself.
        if (pendingLog?.timer) clearTimeout(pendingLog.timer);
        pendingLog = null;
        sendResponse({ ok: true });
        return;
      case "reset-ended":
        if (state.phase === "ended") await setState({ phase: "ready", lastEnded: null });
        sendResponse({ ok: true });
        return;
      case "signed-in":
        await initDevice();
        sendResponse({ ok: true });
        return;
      case "signed-out":
        state = { ...state, phase: "signed-out" };
        await chrome.storage.session.set({ callState: state });
        await toOffscreen({ cmd: "teardown" });
        try {
          const ctxs = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
          if (ctxs.length) await chrome.offscreen.closeDocument();
        } catch {}
        sendResponse({ ok: true });
        return;
      default:
        sendResponse({ ok: false, error: "unknown command" });
    }
  })();
  return true; // async sendResponse
});

// ── lifecycle ──────────────────────────────────────────────────────────────
// The offscreen document outlives the service worker, so the Device keeps
// running (and can wake us for an inbound call) even after the worker is idle.
// We only (re)init on browser start, install/update, the keepalive alarm, or
// when the popup asks — not on every worker wake.
chrome.runtime.onStartup.addListener(() => initDevice());
chrome.runtime.onInstalled.addListener(() => initDevice());

// Keep the token fresh / device alive even while no popup is open.
chrome.alarms.create("keepalive", { periodInMinutes: 3 });
chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name !== "keepalive") return;
  if (state.phase === "signed-out") return;
  // initDevice() rebuilds the offscreen doc if gone, refreshes the token, and
  // re-registers a Device that dropped out — covers every stuck state.
  await initDevice();
});

// Wake path: a phone number clicked in the CRM (from content.js).
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "dial-from-page" && msg.number) {
    chrome.storage.session.set({ pendingDial: msg.number });
    // If the dialer is already open, fill it live; otherwise open it (it reads
    // pendingDial on load).
    chrome.runtime.sendMessage({ type: "prefill", number: msg.number }).catch(() => {});
    chrome.action.openPopup().catch(() => {
      chrome.windows.create({
        url: "popup.html",
        type: "popup",
        width: 360,
        height: 620,
      });
    });
  }
});

// First wake after the worker was evicted: bring the Device back only if the
// offscreen document isn't already carrying it.
(async () => {
  try {
    if (!(await hasOffscreen())) await initDevice();
  } catch {}
})();
