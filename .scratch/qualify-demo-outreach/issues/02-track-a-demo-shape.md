Type: grilling
Status: resolved

## Question

For no-website leads (Track A), roughly what shape should the generated website demo take — a fixed set of category templates, or a bespoke AI-generated page per lead? How fast/cheap does it need to be, roughly how does it get hosted/linked?

## Answer

Category-based templates, not bespoke-per-lead generation. A small set of templates (one per lead category — e.g. salão de beleza, oficina mecânica, restaurante) gets designed once with real rigor (`/impeccable shape` → `critique` → `polish`, consistent with `DESIGN.md`), then auto-filled per lead with their real data (name, address, category copy, photo once Google Places enrichment is live).

Rationale: reused templates get design quality once and keep it; bespoke-per-lead generation risks inconsistent quality (AI slop) at volume and costs more compute/time per lead for something disposable until the lead responds.

Hosting: cheap, static, same free-tier philosophy as the rest of the stack (Cloudflare). Exact pattern (subdomain vs. path vs. per-lead project) deferred to implementation — see map's "Not yet specified".

## Comments

Resolved via grilling session, 2026-07-29.
