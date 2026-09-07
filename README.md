# Flow State

Marketing homepage for **Flow State** — a marketing agency running three
standalone services: **Meta Ads**, **Google Ads**, and **GEO** (Generative
Engine Optimization).

> Get found by AI. Get clicked on Google. Get discovered on Meta.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS — brand tokens in [`tailwind.config.ts`](tailwind.config.ts)
- Fonts — **Cal Sans** (display, via jsDelivr CDN link in `app/layout.tsx`) with
  **Space Grotesk** 500–700 as the self-hosted fallback; **Inter** (body) and
  **JetBrains Mono** (data/labels) via `next/font`
- Animation — CSS keyframes + a small `useReveal` IntersectionObserver hook
  ([`lib/useReveal.ts`](lib/useReveal.ts)). No animation library: JS-driven
  reveals were leaving content invisible when the tab's rAF loop was throttled;
  CSS `animation … forwards` always settles to its end state, and a 2.5s
  observer-timeout fallback plus a `<noscript>` rule guarantee nothing can stay
  hidden. Motion values still match the brief's spec.
- No external UI libraries; the logo, icons, dashboard, and diagrams are hand-built SVG

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build

```bash
npm run build
npm run start
```

Fully static — deploy to Vercel (zero config) or any Node host.

## Structure

```
app/
  layout.tsx          fonts, metadata, <noscript> reveal fallback
  page.tsx            all sections in order (heavy ones code-split via next/dynamic)
  icon.svg            F-mark favicon
  crm/                layout.tsx (noindex + shell), CrmShell.tsx (session gate,
                      sign-in, tab bar), page.tsx + Dashboard.tsx,
                      LeadList.tsx (filters + list), LeadDetail.tsx (log form,
                      history), calls/ and outreach/ pick the channel
components/
  ui/                 Logo, Nav, Button, Card, Section, CountUp, icons
  sections/           Hero, Problem, Services (3 service panels), GEOMockup,
                      AgenticWorkflow (How It Works), Industries, CaseStudy,
                      FinalCTA, Footer
                      — Dashboard.tsx and AuthorityDiagram.tsx are kept but no
                        longer mounted (GEO-only visuals from the old single-
                        service site)
lib/utils.ts          cn(), shared motion presets
lib/supabase.ts       CRM client, CHANNELS config, Lead/Touch types, date helper
```

## Brand rules baked in

- ~90% monochrome. Cyan (`#00C8F0`) appears at most once per section, only on
  functional elements: primary CTAs, one stat/metric, dashboard active states,
  the pipeline progress dot.
- All animations respect `prefers-reduced-motion` (see `globals.css` + `usePrefersReducedMotion`).
- Every CTA links to `#audit` (`FinalCTA.tsx`). The form inserts a row into the
  Supabase `leads` table via PostgREST as the `anon` role (`lib/leads.ts`) — no
  client library, no backend route. Requires `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`); without them the form
  shows an error on submit.

## CRM (`/crm`)

Private follow-up tracker. It answers three questions and nothing else: when a
lead was **first contacted**, what **follow-ups** have happened, and when the
**next follow-up** is due.

Three pages, all behind the same session gate ([`CrmShell.tsx`](app/crm/CrmShell.tsx)):

| Route | What it is |
|---|---|
| `/crm` | Dashboard — per-channel counts and stage breakdown, then everything due today or overdue across both |
| `/crm/calls` | Cold calls — India |
| `/crm/outreach` | Instagram & email — France, EU, US |

### Channels

Both channels share one table and one list component; they differ only in what
identifies a lead, how fast the cadence is, and what an outcome can be. All
three live in `CHANNELS` in [`lib/supabase.ts`](lib/supabase.ts) — add a channel
there and it appears everywhere.

| | Cold calls | Instagram & email |
|---|---|---|
| Identifier | `phone` (tap to dial) | `contact` handle + `email` |
| Follow-up gap | 3 days | 7 days |
| Outcomes | Answered, No answer, Call back later… | DM sent, Email sent, Replied… |

### Sequence stages

A lead moves: **initial attempt → follow-up 1…4 → sequence done**. The stage is
*derived*, never stored — the `crm_leads_staged` view counts `crm_touches` rows
per lead, so it can never drift from the history. Reads go through the view,
writes go to `crm_leads`.

Each channel page shows a count per stage; clicking one filters the list, and
the dashboard deep-links to `?stage=followup_3`. `status` is separate and
manual — `unqualified` is the one to set for a lead that went through the whole
sequence without engaging (as opposed to `lost`, which said no).

### Data

- `crm_leads` — `channel`, name, company, email, `contact` (Instagram handle),
  `website`, phone, country, `category` (sector), `description`, status,
  `first_contacted_at`, `next_followup_at`, notes. `contact` and `website` are
  separate columns so the detail can link to both.

  > Adding a column to `crm_leads` means **recreating `crm_leads_staged`** —
  > Postgres expands its `select l.*` at definition time, so a new column will
  > not appear in the view on its own.
- `crm_touches` — one row per contact: `occurred_on`, `outcome`, `note`. This is
  the follow-up history.
- Separate from the marketing form's `leads` table, which is untouched.
- **Log contact** writes a `crm_touches` row, fills `first_contacted_at` if it
  was still blank, and pencils the next follow-up `CHANNELS[channel].gap` days out.

### Import

**Import** on either channel page takes a drag-and-drop `.xlsx` or `.csv`
(also `.tsv`; `.xls` is rejected with a note to re-save). Nothing is written
until you confirm:

1. **Parse** — [`lib/parseSheet.ts`](lib/parseSheet.ts). XLSX goes through
   `read-excel-file` (`readSheet`, not the default export — since v9 the default
   returns sheet *metadata*). The `xlsx` package on npm is stuck at 0.18.5 from
   2022 with unpatched advisories, so it is deliberately not used. CSV is parsed
   in-file: RFC 4180 quoting, embedded delimiters and newlines, CRLF, BOM, and
   `,`/`;`/tab sniffing. Self-check: `npm run test:parse`.
2. **Map** — headers are guessed from synonyms (`Brand name` → Name,
   `Instagram handle` → IG handle, …) and shown as dropdowns with a sample value
   from row 1. Only **Name** is required. Each field can be claimed once. The
   headers in [`flowstate-leads-template.csv`](flowstate-leads-template.csv) map
   with no correction needed.
3. **Preview** — first five mapped rows, plus a count of what will be skipped
   and why.
4. **Write** — inserted 250 at a time. Rows with no name, repeats within the
   file, and leads already in that channel are skipped. Dedupe key is
   handle → phone → email, case- and space-insensitive, so re-importing the same
   sheet adds nothing.

A row carrying a first-contact date also gets one seed `crm_touches` row on that
date, so it starts at "initial attempt" instead of contradicting itself by
reading `contacted` at stage "not contacted".

### Access

The lock is RLS, not the UI: both tables are `for all to authenticated using
(auth.email() = '<owner>')`. Anyone else who signs up gets an empty CRM. Change
the address in the policies to hand the CRM over. A "CRM" link appears in the
site nav only while signed in; the pages are `robots: noindex`.

Uses `@supabase/supabase-js` for session persistence and token refresh — the
marketing form still posts with raw fetch.

## Notes

- Copy, stats, and the case study are placeholder-free but illustrative —
  confirm figures with the team before publishing.
- `metadataBase` in `app/layout.tsx` is set to `https://flowstate.agency`; change
  it to the real domain.
