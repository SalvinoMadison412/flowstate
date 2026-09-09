// Minimal Supabase REST/Auth client for the extension — plain fetch, no bundle.
// Mirrors how the CRM's lib/leads.ts talks to PostgREST directly. Session lives
// in chrome.storage.local and is refreshed on demand.

import { DIALER_CONFIG as CFG } from "../config.js";

const AUTH = `${CFG.SUPABASE_URL}/auth/v1`;
const REST = `${CFG.SUPABASE_URL}/rest/v1`;
const KEY = CFG.SUPABASE_ANON_KEY;
const STORE_KEY = "supabaseSession";

async function readSession() {
  const { [STORE_KEY]: s } = await chrome.storage.local.get(STORE_KEY);
  return s || null;
}
async function writeSession(s) {
  await chrome.storage.local.set({ [STORE_KEY]: s });
}
export async function clearSession() {
  await chrome.storage.local.remove(STORE_KEY);
}

/** Sign in with the CRM owner's email + password. Throws on bad credentials. */
export async function signIn(email, password) {
  const res = await fetch(`${AUTH}/token?grant_type=password`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: KEY },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(body.error_description || body.msg || "Sign-in failed");
  const session = {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_at: Date.now() + (body.expires_in ?? 3600) * 1000,
    email: body.user?.email,
  };
  await writeSession(session);
  return session;
}

async function refresh(session) {
  const res = await fetch(`${AUTH}/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: KEY },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) {
    await clearSession();
    throw new Error("Session expired — sign in again");
  }
  const body = await res.json();
  const next = {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_at: Date.now() + (body.expires_in ?? 3600) * 1000,
    email: body.user?.email ?? session.email,
  };
  await writeSession(next);
  return next;
}

/** A valid access token, refreshing if it expires within 60s. Null if signed out. */
export async function getAccessToken() {
  let session = await readSession();
  if (!session) return null;
  if (Date.now() > session.expires_at - 60_000) session = await refresh(session);
  return session.access_token;
}

export async function currentEmail() {
  return (await readSession())?.email ?? null;
}

async function authed(path, init = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("Not signed in");
  const res = await fetch(`${REST}${path}`, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`CRM request failed (${res.status}) ${detail}`.trim());
  }
  return res;
}

const enc = encodeURIComponent;

/**
 * Search leads by name / company / phone. `q` can be a name fragment or a phone
 * number in any format — digits are matched against crm_leads.phone_digits.
 */
export async function searchContacts(q) {
  const term = q.trim();
  if (!term) return [];
  const like = term.replace(/[%,()*]/g, "");
  const digits = term.replace(/\D/g, "");
  const ors = [
    `name.ilike.*${like}*`,
    `company.ilike.*${like}*`,
    `email.ilike.*${like}*`,
  ];
  if (digits.length >= 3) ors.push(`phone_digits.ilike.*${digits}*`);
  const res = await authed(
    `/crm_leads?select=id,name,company,email,phone,country,channel&or=(${enc(
      ors.join(","),
    )})&limit=8`,
  );
  return res.json();
}

/** Find the lead that owns an inbound E.164 number, if any. */
export async function contactByPhone(e164) {
  const digits = e164.replace(/\D/g, "");
  if (digits.length < 6) return null;
  // Match on the last 9+ digits so country-code / trunk-prefix differences
  // between the caller ID and the stored number don't cause a miss.
  const tail = digits.slice(-Math.min(digits.length, 10));
  const res = await authed(
    `/crm_leads?select=id,name,company,email,phone,country&phone_digits=ilike.*${tail}*&limit=1`,
  );
  const rows = await res.json();
  return rows[0] || null;
}

export async function getContact(id) {
  const res = await authed(
    `/crm_leads?select=id,name,company,email,phone,country,category,status,next_followup_at,notes&id=eq.${enc(
      id,
    )}&limit=1`,
  );
  return (await res.json())[0] || null;
}

/** Most recent call for a lead (for the "last call" line in the dialer). */
export async function lastCall(leadId) {
  const res = await authed(
    `/crm_calls?select=occurred_at,direction,duration_seconds,status&lead_id=eq.${enc(
      leadId,
    )}&order=occurred_at.desc&limit=1`,
  );
  return (await res.json())[0] || null;
}

export async function callHistory(leadId) {
  const res = await authed(
    `/crm_calls?select=*&lead_id=eq.${enc(leadId)}&order=occurred_at.desc&limit=25`,
  );
  return res.json();
}

/**
 * Persist a finished call. Writes the rich record to crm_calls and, so the call
 * still counts toward the lead's follow-up stage, a matching crm_touches row.
 */
export async function logCall(call) {
  const {
    contact_id = null,
    phone_number,
    direction,
    duration_seconds = 0,
    status = "completed",
    notes = null,
    recording_url = null,
    twilio_call_sid = null,
    timestamp = new Date().toISOString(),
  } = call;

  await authed(`/crm_calls`, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      lead_id: contact_id,
      phone_number,
      direction,
      duration_seconds,
      status,
      notes,
      recording_url,
      twilio_call_sid,
      occurred_at: timestamp,
    }),
  });

  await maybeLogTouch(contact_id, direction, duration_seconds, status, notes, timestamp);
}

/** Update notes on an already-logged call (popup saved after the auto-log ran). */
export async function updateCallNotes(twilioCallSid, notes) {
  if (!twilioCallSid) return;
  await authed(`/crm_calls?twilio_call_sid=eq.${enc(twilioCallSid)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ notes: notes || null }),
  });
}

async function maybeLogTouch(contact_id, direction, duration_seconds, status, notes, timestamp) {
  if (contact_id) {
    const mins = Math.round(duration_seconds / 60);
    const outcome =
      status === "completed"
        ? direction === "inbound"
          ? "Answered (inbound call)"
          : "Answered (call)"
        : `Call ${status}`;
    await authed(`/crm_touches`, {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        lead_id: contact_id,
        occurred_on: timestamp.slice(0, 10),
        outcome,
        note:
          [notes, duration_seconds ? `${mins || "<1"} min` : null]
            .filter(Boolean)
            .join(" · ") || null,
      }),
    });
  }
}
