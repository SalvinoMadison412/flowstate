# Independent inbound voice agent

A standalone service. Twilio PSTN call in, Gemini Live speech-to-speech, back out.
**No platform account, no database, no CRM, no Supabase.** Five files, one dependency (`ws`).

```
caller → Twilio number → POST /voice   → <Connect><Stream>
                       → WSS  /media   → this process ⇄ Gemini Live
```

Everything client-specific lives in `agent.json`. A second client is a second copy of that
file, not a code change.

## Files

| | |
|---|---|
| `server.js` | The whole service: TwiML webhook, media bridge, transfer, DTMF |
| `audio.js` | µ-law ⇄ PCM and resampling (8k ⇄ 16k ⇄ 24k) |
| `agent.json` | Greeting, prompt, menu, voice, transfer number, call cap |
| `test.js` | Audio self-check — run it after touching `audio.js` |

## Run it

```bash
npm install
npm test
```

Set five env vars and start:

```bash
GEMINI_API_KEY=...        # aistudio.google.com — free tier works for testing
TWILIO_ACCOUNT_SID=AC...  # you already have these from the dialer
TWILIO_AUTH_TOKEN=...
PUBLIC_HOST=voice.yourdomain.com   # hostname only, no https://, no trailing slash
PORT=8080
npm start
```

Then in the Twilio console, point your number's **Voice webhook** at
`https://$PUBLIC_HOST/voice` (HTTP POST), and set `agent.json`'s `transferNumber` to a real
phone.

**Local testing:** use ngrok's free static domain and set `PUBLIC_HOST` to it. Cloudflare Tunnel
has documented failures with Twilio media-stream WebSockets — don't use it for this.
`SKIP_SIGNATURE_CHECK=true` disables webhook verification; never set it in production.

## What's wired in

- **Signature verification** on the webhook. Twilio's HMAC-SHA1, ~10 lines, no SDK. Returns 403
  and hangs up on a forged request.
- **Barge-in.** Gemini reports `interrupted`; we send Twilio a `clear` so queued agent audio is
  dropped the instant the caller talks over it.
- **Press 0 always reaches a human.** Handled on the `dtmf` event in the bridge, *before* the
  model sees anything. The model cannot veto it, delay it, or decide to be helpful instead.
- **`transfer_to_human` as a real tool call**, not a magic phrase — with audio-only output there
  is no text to pattern-match, so a phrase-based trigger would silently never fire.
- **Gemini failure transfers the call.** If the model socket errors, the caller gets a person
  instead of silence.
- **Call cap** at `maxCallSeconds`, so a stuck call can't run up a bill.

## Verified locally

```
✓ npm test — µ-law round-trip, both resample directions, signal preserved
✓ GET  /health → ok
✓ POST /voice  → <Connect><Stream wss://…/media>
✓ POST /voice without a valid signature → 403
```

Not yet verified with a real call — that needs your Gemini key, a public host, and a Twilio
number pointed at it. Everything up to the phone ringing is tested.

## Deliberate gaps

- **No booking calendar.** The agent takes name / service / time / number and says a text will
  confirm. Wiring Cal.com is client-#1 work.
- **Menu lives in the system prompt** (~400 tokens). Fine at this size; move it behind a
  retrieval tool before the FAQ grows, since prompt size drives Gemini Live cost per minute.
- **No recording or transcripts yet.** The council called this load-bearing and it is — but it
  needs somewhere to write, and you asked for no CRM. Add Twilio's own `record="true"` or a
  local file sink when you decide where transcripts should live.
- **No `end_call` tool.** Caller hangup and the duration cap cover it.
- **Single region.** Run it near the callers, not near you — voice notices latency that websites
  don't.

## The transfer loop — read this before pointing it at a client

If a client forwards their business line to your Twilio number, then `transferNumber` must be a
**separate, un-forwarded** number. Point it back at the forwarded line and `transfer_to_human`
dials a line that forwards straight back into this agent — an infinite loop, on the exact call
where a frustrated person demanded a human.

Capture a direct, un-forwarded number for every client during discovery.
