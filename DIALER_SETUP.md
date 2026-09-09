# Flow State Dialer — setup

A Chrome extension softphone wired into the CRM. Outbound + inbound PSTN calls
through Twilio, contact lookup and call logging straight into Supabase.

There is **no new backend API** for contacts/calls — the extension talks to
Supabase directly, exactly like the CRM web app does. The only server code added
is the Twilio glue: `app/api/twilio/token` and `app/api/twilio/voice`.

---

## Already done

- **CRM deployed to Railway** — project `FlowState`, new service **`crm`**,
  auto-deploys from branch `claude/crm-ig-link-and-category-filter`.
  URL: **`https://crm-production-9434.up.railway.app`**
  (the existing `flowstate` production service on `main` is untouched).
- Env vars set on the `crm` service: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_PHONE_NUMBER`,
  `TWILIO_DIALER_IDENTITY`, `TWILIO_PUBLIC_URL`.
- Extension `config.js` + `manifest.json` point at the Railway URL.

## What's left for you (≈10 min)

1. Apply one database migration
2. Twilio console: create an API Key/Secret + a TwiML App, point the number at it
3. Add 4 more env vars to the `crm` service
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

Additive and idempotent — safe on the live project.

---

## 2. Twilio console

Account that owns `+16292818264` (voice-enabled, not yet attached to a TwiML app).

### 2a. API Key + Secret

1. <https://console.twilio.com> → **Account → API keys & tokens** → **Create API key**.
2. Name `flow-state-dialer`, type **Standard**. Create.
3. Copy the **SID** (`SK…`) and the **Secret** (shown once).

### 2b. TwiML App

1. **Voice → TwiML → TwiML Apps** → **Create new TwiML App**.
2. Friendly name: `Flow State Dialer`.
3. **Voice → Request URL**:
   `https://crm-production-9434.up.railway.app/api/twilio/voice` — **HTTP POST**.
   Leave the status callback URL blank.
4. Save. Copy the **App SID** (`AP…`).

### 2c. Point the number at the app

1. **Phone Numbers → Manage → Active numbers → +16292818264**.
2. **Voice Configuration → A call comes in**: **TwiML App** → `Flow State Dialer`.
3. Save. Inbound calls now ring the extension.

### 2d. Auth token

**Account → API keys & tokens → Auth Token** → copy it.

---

## 3. Add the remaining env vars

Railway dashboard → project **FlowState** → service **crm** → **Variables**, or:

```bash
railway link --project FlowState
railway service crm
railway variables --set "TWILIO_AUTH_TOKEN=<from 2d>" \
  --set "TWILIO_API_KEY=<SK… from 2a>" \
  --set "TWILIO_API_SECRET=<secret from 2a>" \
  --set "TWILIO_TWIML_APP_SID=<AP… from 2b>"
```

Railway redeploys automatically. Then check:

```bash
curl https://crm-production-9434.up.railway.app/api/twilio/token
# -> {"error":"Missing bearer token."}   (401 = route is live and gated)
```

---

## 4. Load the extension

1. `chrome://extensions` → toggle **Developer mode** (top right) → **Load
   unpacked** → pick the `chrome-extension/` folder.
2. Pin it (puzzle-piece icon → pin). Click the icon.
3. **Sign in** with your CRM email + password (`salvinokevin7@gmail.com`).
4. Open ⚙ → **Grant microphone access** → allow the prompt. Do this once; the
   offscreen call engine can't show its own mic prompt.
5. (Optional) Chrome shows the extension **ID** after loading. To lock the token
   endpoint to just this extension, add
   `DIALER_EXTENSION_ORIGIN=chrome-extension://<that id>` to the `crm` service.
   Otherwise the endpoint stays reachable but useless without your login.

### Local dev

`config.js` and `manifest.json` also allow `http://localhost:3000`. Run
`npm run dev`, open the dialer's ⚙ and set the CRM URL to
`http://localhost:3000` to test against a local server. For Twilio webhooks
locally you still need the Railway URL (or a tunnel) in the TwiML App.

---

## Using it

- **Dial:** pick a country, type the number (or `+…` directly), **Call**.
- **Search:** type a name or number — matches come from the CRM with the
  contact's last call date. Selecting one fills the number.
- **From a CRM page:** phone numbers on `/crm/*` pages are clickable.
- **During a call:** mute, hold, DTMF keypad, live timer.
- **After a call:** type notes → **Save to CRM** (writes `crm_calls` + a
  `crm_touches` row so it counts toward the lead's stage). If the popup is
  closed when the call ends, it's logged automatically without notes.
- **Inbound:** a call to `+16292818264` raises a Chrome notification with
  Accept / Reject; if the caller is on a lead, their name shows.

---

## Deliberately not built

| Skipped | Why | Add when |
|---|---|---|
| `POST /api/twilio/status` callback | The browser logs the call's duration/outcome directly. | You need reliable logging when Chrome is closed mid-call, or turn on recording. |
| Call **recording** | France/EU needs both-party consent. `recording_url` exists in the schema but stays null. | You add a consent step + a spoken "this call may be recorded" notice. |
| True **hold** | Needs a server-side call redirect to hold-TwiML and back. "Hold" currently just mutes your mic. | You need to actually park the other party. |
| `/api/contacts`, `/api/calls` REST | The extension uses Supabase directly, like the CRM. | Another client (mobile, Zapier) needs a stable API. |
| Multi-user / team routing | RLS and the Twilio identity are single-user. | More than one person uses the dialer. |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Dialer says "signed out" after working | Session refresh failed — sign in again in ⚙. |
| "Twilio not configured — missing: …" (500) | Set the listed var on the `crm` Railway service. |
| Inbound webhook 403 / "could not be verified" | `TWILIO_PUBLIC_URL` must exactly equal the TwiML App Request URL origin. It's set to the Railway URL; if you add a custom domain, update it. |
| "Microphone blocked" on call | ⚙ → Grant microphone access; else `chrome://settings/content/microphone` → allow for the extension. |
| Numbers on CRM pages aren't clickable | You're on a URL not in `content_scripts.matches`. Add it and reload the extension. |
| Want auto-deploy from a different branch | Railway dashboard → `crm` service → Settings → Source. |
