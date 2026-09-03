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
components/
  ui/                 Logo, Nav, Button, Card, Section, CountUp, icons
  sections/           Hero, Problem, Services (3 service panels), GEOMockup,
                      AgenticWorkflow (How It Works), Industries, CaseStudy,
                      FinalCTA, Footer
                      — Dashboard.tsx and AuthorityDiagram.tsx are kept but no
                        longer mounted (GEO-only visuals from the old single-
                        service site)
lib/utils.ts          cn(), shared motion presets
```

## Brand rules baked in

- ~90% monochrome. Cyan (`#00C8F0`) appears at most once per section, only on
  functional elements: primary CTAs, one stat/metric, dashboard active states,
  the pipeline progress dot.
- All animations respect `prefers-reduced-motion` (see `globals.css` + `usePrefersReducedMotion`).
- The strategy-call form is client-only (no backend). Every CTA on the page
  links to `#audit` (the `FinalCTA.tsx` section) — wire it to your CRM, a
  booking link (Calendly/Cal.com), or a `/api/lead` route.

## Notes

- Copy, stats, and the case study are placeholder-free but illustrative —
  confirm figures with the team before publishing.
- `metadataBase` in `app/layout.tsx` is set to `https://flowstate.agency`; change
  it to the real domain.
