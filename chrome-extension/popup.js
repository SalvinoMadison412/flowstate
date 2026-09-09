import { DIALER_CONFIG, crmBaseUrl } from "./config.js";
import { COUNTRIES, DEFAULT_COUNTRY } from "./countries.js";
import {
  signIn,
  clearSession,
  currentEmail,
  searchContacts,
  lastCall,
  logCall,
  updateCallNotes,
} from "./lib/supabase-rest.js";

const $ = (id) => document.getElementById(id);
const send = (cmd, extra = {}) =>
  chrome.runtime.sendMessage({ type: "popup", cmd, ...extra }).catch(() => ({}));

let ui = {
  state: { phase: "idle" },
  selectedContact: null, // { id, name, company }
  country: DEFAULT_COUNTRY,
  dtmfMode: false,
  logHandled: false,
};
let tick = null;

// ── boot ───────────────────────────────────────────────────────────────────
init();

async function init() {
  buildCountrySelect();
  $("crmUrl").value = await crmBaseUrl();
  wireEvents();

  const email = await currentEmail();
  if (!email) {
    showView("auth");
    return;
  }
  $("settingsEmail").textContent = email;

  const res = await send("get-state");
  if (res?.state) applyState(res.state);
  showView("dialer");
  send("ensure-device");

  const { pendingDial } = await chrome.storage.session.get("pendingDial");
  if (pendingDial) {
    setNumberFromRaw(pendingDial);
    chrome.storage.session.remove("pendingDial");
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "state") applyState(msg.state);
  if (msg?.type === "log-error") flashError(msg.message);
});

// ── views ──────────────────────────────────────────────────────────────────
function showView(name) {
  $("viewAuth").hidden = name !== "auth";
  $("viewSettings").hidden = name !== "settings";
  $("viewDialer").hidden = name !== "dialer";
}

// ── state → UI ─────────────────────────────────────────────────────────────
function applyState(s) {
  ui.state = s;
  const { phase } = s;

  const dot = $("statusDot");
  dot.className =
    "dot " +
    ({ "on-call": "busy", dialing: "busy", "ringing-in": "busy", ready: "ok", "ended": "ok" }[
      phase
    ] || (phase === "device-error" ? "err" : ""));

  const inCall = phase === "dialing" || phase === "on-call";
  $("callPanel").hidden = !inCall;
  $("incomingPanel").hidden = phase !== "ringing-in";
  $("endedBar").hidden = phase !== "ended";
  $("callBtn").hidden = inCall || phase === "ringing-in";
  $("endBtn").hidden = !inCall;

  // lock the number/search fields during a call
  for (const el of [$("number"), $("search"), $("country")]) el.disabled = inCall || phase === "ringing-in";

  if (phase === "device-error" || s.error) flashError(s.error || "Dialer error");
  else $("dialerError").hidden = true;

  if (inCall) {
    $("callPhase").textContent =
      phase === "dialing" ? "Calling…" : s.held ? "On hold" : "Connected";
    $("callWho").textContent = describeParty(s);
    $("muteBtn").dataset.on = String(!!s.muted);
    $("holdBtn").dataset.on = String(!!s.held);
    startTimer(s.startedAt);
  } else {
    stopTimer();
  }

  if (phase === "ringing-in") {
    $("inWho").textContent = s.leadName || "Incoming call";
    $("inNumber").textContent = s.number || "";
  }

  if (phase === "ended" && !ui.logHandled) {
    ui.logHandled = true;
    handleEndedCall(s.lastEnded);
  }
  if (phase !== "ended") ui.logHandled = false;
}

function describeParty(s) {
  const who = s.leadName ? `${s.leadName} · ` : "";
  return `${who}${s.number || ""}`;
}

// ── timer ──────────────────────────────────────────────────────────────────
function startTimer(startedAt) {
  stopTimer();
  const render = () => {
    const secs = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    $("callTimer").textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  };
  render();
  if (startedAt) tick = setInterval(render, 1000);
}
function stopTimer() {
  if (tick) clearInterval(tick);
  tick = null;
}

// ── number handling ────────────────────────────────────────────────────────
function buildCountrySelect() {
  const sel = $("country");
  sel.innerHTML = "";
  for (const c of COUNTRIES) {
    const o = document.createElement("option");
    o.value = c.dial;
    o.textContent = `${c.flag} +${c.dial}`;
    o.title = c.name;
    sel.appendChild(o);
  }
  sel.value = DEFAULT_COUNTRY.dial;
}

/** Combine the country code + typed digits into an E.164 string. */
function resolvedE164() {
  const raw = $("number").value.trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return "+" + raw.slice(1).replace(/\D/g, "");
  const local = raw.replace(/\D/g, "").replace(/^0+/, "");
  const cc = $("country").value;
  return local ? `+${cc}${local}` : "";
}

function refreshResolved() {
  const e164 = resolvedE164();
  $("resolved").innerHTML = e164 ? `Will dial <b>${e164}</b>` : "";
  $("callBtn").disabled = !/^\+[1-9]\d{6,14}$/.test(e164);
}

function setNumberFromRaw(raw) {
  const digits = String(raw).replace(/[^\d+]/g, "");
  const match = digits.startsWith("+")
    ? [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((c) => digits.slice(1).startsWith(c.dial))
    : null;
  if (match) {
    $("country").value = match.dial;
    $("number").value = digits.slice(1 + match.dial.length);
  } else {
    $("number").value = digits;
  }
  refreshResolved();
}

// ── events ─────────────────────────────────────────────────────────────────
function wireEvents() {
  $("settingsBtn").onclick = () =>
    showView($("viewSettings").hidden ? "settings" : "dialer");
  $("closeSettingsBtn").onclick = () => showView("dialer");

  $("authForm").addEventListener("submit", onSignIn);
  $("signOutBtn").onclick = onSignOut;
  $("micBtn").onclick = onGrantMic;

  $("crmUrl").addEventListener("change", async () => {
    const v = $("crmUrl").value.trim().replace(/\/$/, "");
    await chrome.storage.local.set({ crmBaseUrl: v });
    send("ensure-device");
  });

  $("number").addEventListener("input", refreshResolved);
  $("country").addEventListener("change", refreshResolved);

  $("keypad").addEventListener("click", (e) => {
    const k = e.target.closest("button")?.dataset.k;
    if (!k) return;
    if (ui.state.phase === "on-call") {
      send("digits", { digits: k });
      return;
    }
    if (k === "0" && !$("number").value) {
      $("number").value = "+";
    } else {
      $("number").value += k;
    }
    refreshResolved();
  });

  $("search").addEventListener("input", debounce(onSearch, 250));
  $("search").addEventListener("focus", () => {
    if ($("results").children.length) $("results").hidden = false;
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrap")) $("results").hidden = true;
  });
  $("ccClear").onclick = clearContact;

  $("callBtn").onclick = onCall;
  $("endBtn").onclick = () => send("hangup");
  $("muteBtn").onclick = () => send("mute", { on: $("muteBtn").dataset.on !== "true" });
  $("holdBtn").onclick = () => send("hold", { on: $("holdBtn").dataset.on !== "true" });
  $("dtmfToggle").onclick = () => $("keypad").scrollIntoView({ behavior: "smooth" });

  $("acceptBtn").onclick = () => send("accept");
  $("rejectBtn").onclick = () => send("reject");

  $("saveNotesBtn").onclick = onSaveNotes;
}

async function onSignIn(e) {
  e.preventDefault();
  const btn = $("authSubmit");
  btn.disabled = true;
  $("authError").hidden = true;
  try {
    await signIn($("authEmail").value.trim(), $("authPassword").value);
    const email = await currentEmail();
    if (email?.toLowerCase() !== DIALER_CONFIG.OWNER_EMAIL.toLowerCase()) {
      await clearSession();
      throw new Error("That account has no access to this CRM.");
    }
    $("settingsEmail").textContent = email;
    showView("dialer");
    await send("signed-in");
  } catch (err) {
    $("authError").textContent = err.message;
    $("authError").hidden = false;
  } finally {
    btn.disabled = false;
  }
}

async function onSignOut() {
  await send("signed-out");
  await clearSession();
  showView("auth");
}

async function onGrantMic() {
  $("micHint").textContent = "Requesting…";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    $("micHint").textContent = "Microphone access granted ✓";
  } catch {
    $("micHint").textContent =
      "Denied. Enable it at chrome://settings/content/microphone for this extension.";
  }
}

async function onSearch() {
  const q = $("search").value.trim();
  const ul = $("results");
  if (q.length < 2) {
    ul.hidden = true;
    return;
  }
  try {
    const rows = await searchContacts(q);
    ul.innerHTML = "";
    if (!rows.length) {
      ul.innerHTML = `<li class="r-empty">No match — type a full number to dial it directly</li>`;
    } else {
      for (const r of rows) {
        const li = document.createElement("li");
        li.innerHTML = `<div class="r-name">${escapeHtml(r.name)}</div>
          <div class="r-sub">${escapeHtml([r.company, r.phone].filter(Boolean).join(" · "))}</div>`;
        li.onclick = () => selectContact(r);
        ul.appendChild(li);
      }
    }
    ul.hidden = false;
  } catch (err) {
    ul.innerHTML = `<li class="r-empty">${escapeHtml(err.message)}</li>`;
    ul.hidden = false;
  }
}

async function selectContact(r) {
  ui.selectedContact = { id: r.id, name: r.name, company: r.company };
  $("results").hidden = true;
  $("search").value = r.name;
  if (r.phone) setNumberFromRaw(r.phone);

  $("contactCard").hidden = false;
  $("ccName").textContent = r.name;
  $("ccCompany").textContent = r.company || "";
  $("ccLastCall").textContent = "Loading…";
  try {
    const lc = await lastCall(r.id);
    $("ccLastCall").textContent = lc
      ? `Last call ${new Date(lc.occurred_at).toLocaleDateString()} · ${lc.direction} · ${fmtDur(
          lc.duration_seconds,
        )}`
      : "No calls logged";
  } catch {
    $("ccLastCall").textContent = "";
  }
}

function clearContact() {
  ui.selectedContact = null;
  $("contactCard").hidden = true;
  $("search").value = "";
}

async function onCall() {
  const to = resolvedE164();
  if (!/^\+[1-9]\d{6,14}$/.test(to)) return;
  ui.logHandled = false;
  $("notes").value = "";
  await send("call", {
    to,
    leadId: ui.selectedContact?.id ?? null,
    leadName: ui.selectedContact?.name ?? null,
  });
}

// ── logging when a call ends ───────────────────────────────────────────────
async function handleEndedCall(summary) {
  if (!summary) return;
  const mins = fmtDur(summary.durationSeconds);
  $("endedText").textContent =
    summary.status === "completed"
      ? `Call ended · ${mins}`
      : `Call ${summary.status}`;
  // Tell the background to hold its fallback auto-log while the popup is open.
  await send("claim-log");
}

async function onSaveNotes() {
  const s = ui.state.lastEnded;
  if (!s) return;
  const btn = $("saveNotesBtn");
  btn.disabled = true;
  btn.textContent = "Saving…";
  const notes = $("notes").value.trim() || null;
  try {
    await logCall({
      contact_id: s.leadId || null,
      phone_number: s.number,
      direction: s.direction,
      duration_seconds: s.durationSeconds,
      status: s.status,
      notes,
      twilio_call_sid: s.callSid,
      timestamp: new Date(Date.now() - s.durationSeconds * 1000).toISOString(),
    });
    await send("logged");
    btn.textContent = "Saved ✓";
  } catch (err) {
    if (/\(409\)/.test(err.message) && s.callSid) {
      try {
        await updateCallNotes(s.callSid, notes);
        await send("logged");
        btn.textContent = "Saved ✓";
      } catch (e2) {
        flashError(e2.message);
        btn.disabled = false;
        btn.textContent = "Save to CRM";
        return;
      }
    } else {
      flashError(err.message);
      btn.disabled = false;
      btn.textContent = "Save to CRM";
      return;
    }
  }
  setTimeout(() => {
    send("reset-ended");
    $("endedBar").hidden = true;
    $("notes").value = "";
    btn.disabled = false;
    btn.textContent = "Save to CRM";
  }, 900);
}

// ── helpers ────────────────────────────────────────────────────────────────
function debounce(fn, ms) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}
function fmtDur(s) {
  s = Math.max(0, Math.round(s || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );
}
function flashError(msg) {
  const el = $("dialerError");
  el.textContent = msg || "Something went wrong";
  el.hidden = false;
}

refreshResolved();
