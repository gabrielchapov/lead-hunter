# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Gabriel — a solo developer/consultant based in Itapoá, SC, Brazil, running Lead Hunter as a one-person prospecting operation. He is the tool's only user (single-user JWT auth by design). Prospects surfaced by the tool are Brazilian SMBs, in two segments: (1) local businesses with no website, pitched a quick AI-built site; (2) established businesses, pitched AI-automation/custom-build consulting. Multi-tenant/reselling to other consultants was explicitly considered and deprioritized — not a current design constraint.

## Product Purpose

Find, score, and manage outreach to local Brazilian businesses, from sourcing through a Kanban pipeline to WhatsApp-based contact, so Gabriel can convert them into paying clients for websites and AI-automation/consulting work.

## Positioning

Combines free/low-cost lead sourcing (OpenStreetMap/Overpass, optional Google Places enrichment) with a demo-first, instrumented outreach workflow built around WhatsApp — the dominant contact channel for the Brazilian SMB market — run entirely by one operator rather than a team or agency.

## Operating Context

Core loop: search a location/category on an interactive map (Leaflet, dark CARTO basemap) → import real businesses via Overpass → score/filter/tag leads → move through a four-stage Kanban (Novo → Contatado → Respondeu → Fechado) → personalize and send a WhatsApp message from an editable template → export filtered leads to CSV/Excel.

Deployment: FastAPI backend on Render's free tier (Neon Postgres, cold starts after ~15 min idle), React/Vite frontend on Cloudflare Workers static assets. Every push to `main` auto-deploys both. Single-user login gate protects the lead database.

## Capabilities and Constraints

- pt-BR only, no i18n.
- Enrichment (phone/website via Google Places New) is optional and currently inert — code-complete but gated behind `GOOGLE_PLACES_API_KEY`, which is not yet set. Never fabricates contact data; only fills verified gaps.
- WhatsApp sending today is manual: a `wa.me` deep link opened per lead, one at a time. No Business API, no bulk send (the "Modo disparo" bulk flow is a stub), no reply tracking or send instrumentation yet — open work.
- Free-tier infra throughout by deliberate choice; any new dependency must justify its cost against a genuinely free tier or Gabriel's own budget.
- Existing visual system is fixed, not a starting template: a dark "Modernist" design — 0 border-radius, 2px rules, Archivo typeface, hand-built CSS tokens/classes (`tokens.css`/`app.css`), no Tailwind. Refinement work should preserve this identity, not replace it, unless a redesign is explicitly requested.

## Brand Commitments

Name: **Lead Hunter** (🎯), fixed and binding for the tool itself. No further identity assets (logo mark, color story beyond the existing dark theme, tagline) confirmed yet.

## Evidence on Hand

No real client testimonials, case studies, or press exist — this is a pre-revenue solo project. Do not fabricate any of these in design work; state their absence rather than inventing placeholders that read as real.

## Product Principles

1. Never fabricate lead data — enrichment only surfaces real, verified contact info or honestly reports none found.
2. Free/cheap infrastructure by default; every added cost must earn its place.
3. Demo-first outreach — show a concrete artifact (a built site, a working example) before describing an offer.
4. Solo-operator ergonomics — every workflow must work for one person with no team or VA.
5. WhatsApp-first, Brazilian SMB market — design and copy assume pt-BR and WhatsApp as the primary contact channel, not email-first conventions.
