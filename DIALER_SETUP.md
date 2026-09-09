# Flow State Dialer — setup

A Chrome extension softphone wired into the CRM. Outbound + inbound PSTN calls
through Twilio, contact lookup and call logging straight into Supabase.

There is **no new backend API** for contacts/calls — the extension talks to
Supabase directly, exactly like the CRM web app does. The only server code added
is the Twilio glue: `app/api/twilio/token` and `app/api/twilio/voice`.

---

## What you have to do (≈15 min)

1. Apply one database migration
2. Create a Twilio **API Key/Secret** and a **TwiML App**, point the number at it
3. Deploy the CRM with the Twilio env vars
4. Load the unpacked extension and sign in

---

## 1. Database migration

`supabase/migrations/20260909120000_crm_calls_and_phone_digits.sql` adds:

- `crm_calls` — the call-history table (`lead_id, phone_number, direction,
  status, duration_seconds, notes, recording_url, twilio_call_sid, occurred_at`),
  with the same owner-only RLS as the other `crm_*` tables.
- `crm_leads.phone_digits` — a generated digits-only column so an inbound
  Twilio number matches a lead however the stored number is punctuated.

Apply it with the **Supabase dashboard → SQL editor** (paste the file, run), or:

```bash
supabase link --project-ref ogzxvbmzyvqcspupxhak
supabase db push
```

It is additive and idempotent — safe to run on the live project.

---

## 2. Twilio console

You need the Twilio account that owns the number `+16292818264` (voice-enabled).
Its Account SID (`AC…`) goes in `TWILIO_ACCOUNT_SID` — copy it from the Twilio
console dashboard, don't commit it.

### 2a. API Key + Secret

1. <https://console.twilio.com> → **Account → API keys & tokens** → **Create API key**.
2. Name it `flow-state-dialer`, type **Standard**. Create.
3. Copy the **SID** (`SK…`) → `TWILIO_API_KEY`, and the **Secret** (shown once)
   → `TWILIO_API_SECRET`.

### 2b. TwiML App

1. **Voice → TwiML → TwiML Apps** → **Create new TwiML App**.
2. Friendly name: `Flow State Dialer`.
3. **Voice → Request URL**: `https://YOUR-CRM-DOMAIN/api/twilio/voice` — method **HTTP POST**.
   Leave the status callback URL blank (calls are logged from the browser).
4. Save. Copy the **App SID** (`AP…`) → `TWILIO_TWIML_APP_SID`.

### 2c. Point the phone number at the app

1. **Phone Numbers → Manage → Active numbers → +16292818264**.
2. **Voice Configuration → A call comes in**: **TwiML App** → `Flow State Dialer`.
3. Save. Inbound calls now ring the extension.

### 2d. Auth token

**Account → API keys & tokens → Auth Token** → copy it → `TWILIO_AUTH_TOKEN`.
(Used only to verify that webhook requests really come from Twilio.)

---

## 3. Deploy the CRM

Set these on the deployment (Vercel/Railway dashboard → Environment):

```
TWILIO_ACCOUNT_SID=<AC… from the console dashboard>
TWILIO_AUTH_TOKEN=<from 2d>
TWILIO_PHONE_NUMBER=+16292818264
TWILIO_TWIML_APP_SID=<AP… from 2b>
TWILIO_API_KEY=<SK… from 2a>
TWILIO_API_SECRET=<secret from 2a>
TWILIO_PUBLIC_URL=https://YOUR-CRM-DOMAIN        # exact origin registered in 2b
```

`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are already set.

Redeploy. Check `GET https://YOUR-CRM-DOMAIN/api/twilio/token` returns
`{"error":"Missing bearer token."}` (401) — that means the route is live.

### Testing before you deploy

Run the CRM locally and expose it with a tunnel:

```bash
npm run dev                 # http://localhost:3000
cloudflared tunnel --url http://localhost:3000   # or: ngrok http 3000
```

Use the tunnel URL for `TWILIO_PUBLIC_URL` and the TwiML App Request URL, and add
`TWILIO_SKIP_SIGNATURE_CHECK=true` to `.env.local` while tunnelling (the tunnel
rewrites headers so signatures won't match). **Remove that flag in production.**

---

## 4. Load the extension

1. Edit `chrome-extension/manifest.json` — replace **both** `your-crm-domain.com`
   entries (`host_permissions` and `content_scripts.matches`) with your real CRM
   host. Keep the `localhost:3000` entries if you want it to work in dev too.
2. Edit `chrome-extension/config.js` — set `CRM_BASE_URL` to the same host
   (or leave it and set the URL later in the dialer's ⚙ settings panel).
3. `chrome://extensions` → toggle **Developer mode** (top right) → **Load
   unpacked** → pick the `chrome-extension/` folder.
4. Pin it (puzzle-piece icon → pin). Click the icon.
5. **Sign in** with your CRM email + password (`salvinokevin7@gmail.com`).
6. Open ⚙ → **Grant microphone access** → allow the prompt. Do this once; the
   offscreen call engine can't show its own mic prompt.
7. (Optional) After loading, Chrome shows the extension **ID**. If you want to
   lock the token endpoint to just this extension, set
   `DIALER_EXTENSION_ORIGIN=chrome-extension://<that id>` on the server and
   redeploy. Otherwise the endpoint stays open but useless without your login.

---

## Using it

- **Dial:** pick a country, type the number (or type `+…` directly), **Call**.
- **Search:** type a name or number in the search box — matches come from the
  CRM, with the contact's last call date. Selecting one fills the number.
- **From a CRM page:** phone numbers on `/crm/*` pages are clickable — clicking
  one opens the dialer with it prefilled.
- **During a call:** mute, hold, DTMF keypad, live timer.
- **After a call:** type notes → **Save to CRM**. Writes a `crm_calls` row and a
  `crm_touches` row (so the call counts toward the lead's follow-up stage). If
  the popup is closed when the call ends, the call is logged automatically
  without notes.
- **Inbound:** a call to `+16292818264` raises a Chrome notification with
  Accept / Reject and opens the dialer; if the caller's number is on a lead,
  their name shows.

---

## Deliberately not built (and when to add it)

| Skipped | Why | Add when |
|---|---|---|
| `POST /api/twilio/status` callback | The browser knows the call's duration/outcome and logs it directly. | Calls where Chrome is closed mid-call need reliable logging, or you turn on recording. |
| Call **recording** | Your outreach market (France/EU) needs both-party consent. `recording_url` exists in the schema but stays null. | You add a consent step + a spoken "this call may be recorded" notice. |
| True **hold** (hold music to the other party) | Needs a server-side call redirect to a hold-TwiML and back. | "Hold" needs to actually park the other party rather than just mute your mic. |
| `/api/contacts`, `/api/calls` REST endpoints | The extension uses Supabase directly, like the CRM. | You want other clients (mobile app, Zapier) hitting a stable API. |
| Multi-user / team routing | RLS and the Twilio identity are single-user. | More than one person uses the dialer. |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Dialer says "signed out" after working | Session refresh failed — sign in again in ⚙. |
| "Token request failed (500) Twilio not configured" | A `TWILIO_*` env var is missing on the deployment. The message lists which. |
| Inbound webhook returns 403 / "could not be verified" | `TWILIO_PUBLIC_URL` doesn't exactly match the TwiML App Request URL, or you're tunnelling without `TWILIO_SKIP_SIGNATURE_CHECK=true`. |
| "Microphone blocked" on call | ⚙ → Grant microphone access; if still blocked, `chrome://settings/content/microphone` → allow for the extension. |
| Numbers on CRM pages aren't clickable | The `content_scripts.matches` host in `manifest.json` doesn't match your CRM URL; reload the extension after fixing. |
| Extension ID changed after reload | Only happens if you move/rename the folder. Re-set `DIALER_EXTENSION_ORIGIN` if you pinned it. |
