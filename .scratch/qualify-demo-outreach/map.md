<!-- wayfinder:map -->

## Destination

A qualify-then-demo outreach pipeline for Lead Hunter — for no-website leads (website demo) and established businesses (automation-prototype demo) alike — that is selective about who gets a demo, tracked per template/variant, and safe to send at real volume.

## Notes

- Domain: Brazilian SMB prospecting, solo operator (Gabriel), see `PRODUCT.md` for full product context.
- Consult `DESIGN.md` before any UI work — existing dark "Ops Console" system, 0px radius, structural shadows, Signal Blue / Ember Amber only. Run `/impeccable critique` or `/impeccable polish` before shipping new UI surfaces, including per-lead demo sites.
- Standing philosophy: free/cheap infrastructure by default (`PRODUCT.md` Product Principles); never fabricate lead or contact data.
- Reference model for Track B (automation-prototype outreach): [calipersoftware.dev](https://calipersoftware.dev/) — free 30-min discovery call → free 10-day scoped prototype demo → 2-6wk custom build → iterate/scale. ~80% operational-time-reduction case studies in auto dealerships, agricultural machinery, insurance.
- Two tracks share infrastructure (qualification gate, instrumentation) but differ in targeting, demo mechanism, and outreach shape — see tickets 01-06.

## Decisions so far

- [01 — Qualification gate](issues/01-qualification-gate.md) — Manual judgment gate for now, not scored criteria; unlocks the demo-generation action per lead.
- [02 — Track A demo shape](issues/02-track-a-demo-shape.md) — Category-based templates (polished once per category via Impeccable), auto-filled per lead, not bespoke-per-lead generation.
- [03 — Track B demo approach](issues/03-track-b-demo-approach.md) — No pre-built artifact; outreach leads with a case-study-style pitch, real prototype only built after a discovery call, mirroring Caliper.
- [04 — Track B targeting](issues/04-track-b-targeting.md) — Restricted to operationally complex/bigger businesses (chains, dealerships, real estate agencies, insurance, equipment dealers) — not the same small-business pool as Track A.
- [05 — Shipping order](issues/05-shipping-order.md) — Track A ships first (fits existing sourcing/lead pool); Track B is the higher-value destination but needs a sourcing answer and Gabriel's own call-taking capacity.
- [06 — Outreach instrumentation](issues/06-outreach-instrumentation.md) — `template_id` + `variant` tagged on every send, tracked via existing Kanban stage transitions, surfaced as a new breakdown in the existing Painel view. Decoupled from the WhatsApp Business API question — works on the current manual `wa.me` flow already.
- [07 — WhatsApp Business API approach](issues/07-whatsapp-business-api-approach.md) — Stay on the manual `wa.me` flow for now; none of Meta direct/Twilio/360dialog pencil out yet at current solo-operator volume, and the ban-risk trigger for moving off manual hasn't been hit. Confirmed via Meta's own docs that the Oct 1, 2026 service-message pricing change is real; exact rates stay blocked until Meta's rate card (by Sept 1, 2026). Revisit once instrumentation (ticket 06) gives real send-volume data.
- [08 — Track B sourcing](issues/08-track-b-sourcing.md) — Manual curated seed list for launch, not automated sourcing; neither CNPJ bulk data nor Google Places cleanly filters for "operationally complex" as a query. CNPJ bulk-ETL (porte + filial-count + CNAE) is the real fallback if/when the manual list becomes the bottleneck, deferred until then.

## Not yet specified

- Caliper-style company/landing page for Gabriel's own consulting brand — explicitly backlogged, no name or identity chosen yet, and realistically blocked on having at least one real case study to show. Revisit once Track B has a first client.
- Track B outreach copy/case-study content — same chicken-and-egg as above; can't write a real case study before there's a real client.
- Exact qualification-gate UI mechanic (flag on the lead vs. a new Kanban state) — small enough to resolve during Track A implementation, not worth a ticket.
- Exact demo hosting pattern (subdomain vs. path vs. per-lead Cloudflare project) — same, implementation-level, resolve during build.

## Out of scope

(none yet — nothing has been ruled out of this destination so far)
