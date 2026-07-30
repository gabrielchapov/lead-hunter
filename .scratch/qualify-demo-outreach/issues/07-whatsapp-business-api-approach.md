Type: research
Status: resolved

## Question

Which WhatsApp messaging approach should Lead Hunter use once volume justifies moving off the manual `wa.me` deep-link flow — Twilio, 360dialog, Meta Cloud API direct, or staying manual longer than planned?

## Context

Confirmed 2026-07-29: starting October 1, 2026, Meta ends the WhatsApp Business Platform's free 24-hour service window. Every service message becomes billable at the same per-message rate as utility/authentication templates, with no volume discount. The actual rate card is not published yet — Meta is expected to release it before September 1, 2026.

This is **time-gated, not just fog**: a final vendor/cost decision can't fully resolve until the rate card lands. Research now should gather everything that isn't blocked by that:
- Current confirmed pricing structure (utility/auth message costs, country-specific rates for Brazil) as a baseline, even pre-October
- Setup complexity and Brazil-specific requirements (business verification, template approval process) for each of Twilio, 360dialog, and Meta Cloud API direct
- Whether staying on the manual flow longer (accepting its ban-risk-at-scale tradeoff, already documented in `PROJECT_MEMORY`/business-strategy notes) is more economical than any paid API option at Lead Hunter's actual current volume (solo operator, low volume)
- Flag explicitly what remains blocked pending the rate card, rather than guessing at October pricing

Decoupled from ticket 06 (outreach instrumentation) — that ships independently of this decision.

## Answer

**Recommendation: stay on the manual `wa.me` flow for now.** At Lead Hunter's actual current volume (solo operator, one-click sends, no bulk flow — "Modo disparo" is still a stub per `PRODUCT.md`), none of the three paid-API paths pencil out yet, and the strongest existing trigger for moving off manual (ban risk) is explicitly volume-based, not yet hit. Revisit this ticket once (a) Meta publishes the October 2026 rate card (expected by Sept 1, 2026) and (b) ticket 06's outreach instrumentation gives real send-volume data. Below is what's confirmed now, split from what's genuinely blocked.

### 1. Current pricing structure (pre-October 2026 baseline)

Confirmed via Meta's own developer docs:

- Since **July 1, 2025**, WhatsApp Business Platform billing is **per-message**, not per-24h-conversation. Four categories: Marketing, Utility, Authentication (+ a separate Authentication-International rate for OTPs routed internationally), and Service. ["Pricing on the WhatsApp Business Platform"](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- Today, **Utility and Authentication template messages are free when delivered inside an open 24-hour customer service window**, and billed only outside it. **Service messages (free-form replies within that window) have been free for all businesses since November 1, 2024.** Same source.
- Brazil-specific: Meta began allowing WABAs with Brazil as the billing country to invoice in **BRL** starting **July 1, 2026**, rolling out to all eligible Solution Providers/direct businesses; full migration to BRL required by **June 30, 2027**. [Same pricing doc](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- I could not pull exact current per-message BRL figures — Meta publishes them as downloadable rate-card CSV/PDF files per currency rather than as text on the doc pages, and those aren't fetchable through the tools available here. Secondary vendor sources (not primary, treat as rough orientation only) put Brazil utility/authentication in the ~R$0.15–0.19/message range and marketing around $0.0625/message pre-October. Don't rely on these for a cost model — pull the actual BRL rate-card file from Meta's Business Manager or the pricing page above before doing real math.

### 2. The October 2026 change — confirmed, with the primary source

Found the direct primary-source confirmation (not just secondary blog aggregation) on Meta's own docs: ["Upcoming pricing updates for Meta Business Agent, service, and utility messages"](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages). Verbatim, effective **October 1, 2026**: *"Meta will charge for service messages, which have not been charged since November 2024"* and *"Meta will charge on a per-message basis for utility messages sent in response to users within an open 24-hour customer service window."* Meta commits: *"Meta will announce and publish the rates that take effect October 1, 2026, including rates for service messages, by September 1, 2026."* This matches and confirms what was already flagged in the ticket context — good, no correction needed there. Separately, effective **August 1, 2026**, Meta starts charging for "Meta Business Agent" messages (Meta's own AI agent product) — not directly relevant to Lead Hunter but adjacent, noting for completeness.

**Genuinely blocked pending the rate card (do not guess):** exact per-country/per-category October rates, especially Brazil service-message pricing; whether Twilio/360dialog change their markup or monthly-fee structure in response; any real breakeven-volume calculation between staying manual, Twilio, 360dialog, and Meta direct post-October. All of this stays open until the rate card lands (by Sept 1, 2026 per Meta's own commitment above).

### 3. Setup complexity and Brazil requirements — side by side

All three paths sit on top of the same underlying Meta requirement: **Meta Business verification** of the operating entity, plus **Meta template approval** for any templated (non-session) message. Brazil-specific accepted verification documents per 360dialog's own docs (a primary source for BSP-documented process, describing Meta's requirement): CNPJ, MEI Certificate, corporate bylaws ("Contrato Social"), a business bank statement, or a utility bill — must be current/unexpired and match the registered business phone/address. [360dialog: Meta Business Verification](https://docs.360dialog.com/docs/resources/meta-business-verification). Business verification timing itself is described only loosely even in primary docs — Twilio's own onboarding docs say Meta's review "varies by region and can take several weeks." [Twilio: WhatsApp self sign-up](https://www.twilio.com/docs/whatsapp/self-sign-up)

| | **Meta Cloud API (direct)** | **Twilio** | **360dialog** |
|---|---|---|---|
| Platform/markup fee | None — Meta charges only its own per-message rate | **$0.005 per message**, inbound or outbound, on top of Meta's rate ([Twilio WhatsApp pricing](https://www.twilio.com/en-us/whatsapp/pricing)) | **No markup on Meta's per-message fee**, but a flat monthly per-number fee: €49/mo (Regular), €99/mo (Premium), €249/mo (High Throughput) ([360dialog pricing](https://www.360dialog.com/pricing)) |
| Onboarding path | Create a Meta app → connect/create a WABA → generate a permanent **system user** access token (`business_management`, `whatsapp_business_messaging`, `whatsapp_business_management` scopes) → register phone number → configure your own webhook endpoint ([Meta: Get started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started)) | Self-serve sign-up against your own or a new Meta Business Portfolio; phone number must not already be active on consumer/Business WhatsApp apps and must be reachable for SMS/voice OTP ([Twilio self sign-up docs](https://www.twilio.com/docs/whatsapp/self-sign-up)) | "Integrated Onboarding" with four flavors (Direct Link no-code, Connect Button low-code, Custom IO, Partner-Hosted Embedded Signup), plus an accelerated "Partner-Led Business Verification" (PLBV) path 360dialog claims is faster than standard Meta verification ([360dialog onboarding docs](https://docs.360dialog.com/partner/onboarding/integrated-onboarding.md), [Meta Business Verification](https://docs.360dialog.com/docs/resources/meta-business-verification)) |
| Template approval | Submitted straight to Meta for review; approval applies WABA-wide, and Meta can disable templates that draw negative user feedback post-approval ([360dialog: template messages](https://docs.360dialog.com/partner/messaging/template-messages) — same underlying Meta review process applies to all three paths) | Same Meta review process | Same Meta review process |
| Ongoing engineering burden | Highest — you own webhook hosting/uptime, token rotation, template management tooling, API version upgrades, all yourself, for zero platform fee | Low — Twilio's console/API abstracts most of this; you still consume Twilio's webhooks in your own backend | Low-medium — pure API, no built-in message-composition dashboard per user reports, but Integrated Onboarding removes most manual Meta Business Manager clicking |
| Best fit | Teams with spare engineering capacity who want zero per-message markup at real scale | Teams wanting the most mature docs/tooling and are fine with a small linear per-message fee | Teams wanting zero per-message markup with a predictable flat fee, at volumes where the flat fee amortizes well |

### 4. Manual `wa.me` vs. any paid API at Lead Hunter's actual current volume

Per the project's own existing notes, the documented ban-risk trigger is **bulk/automated sending at real volume** ("past low volume — a few dozen/day from a warmed personal WhatsApp Business app — the official API is needed instead of automating the consumer app"), not manual one-click sends at solo-operator scale. Lead Hunter today sends manually, one lead at a time, with no bulk-send feature shipped yet (`PRODUCT.md`: *"Modo disparo" bulk flow is a stub*).

At that volume:
- **Manual `wa.me` costs $0 in message fees**, period, regardless of what Meta's October rate card says, since it isn't going through the Business Platform APIs Meta is repricing at all.
- **360dialog's minimum fixed cost (€49/mo ≈ low hundreds of BRL/month) alone** is very likely to exceed total realistic per-message spend at solo-operator volume — you'd be paying a flat fee to save a per-message markup you're barely accruing.
- **Twilio's $0.005/message markup** is cheap per-unit, but combined with Meta's own per-message utility/auth rate (currently free-in-window, about to become billable for service messages too from October) it's still a switch from "free" to "not free" with no volume benefit yet — the only thing it buys at this stage is getting ahead of ban risk, which isn't the live risk yet at this volume.
- **Meta Cloud API direct** trades the per-message/monthly fees for a real engineering build (webhook hosting, token management, template tooling) — a bad trade for a solo operator's current low volume, even though it's the cheapest option at real scale.

So the ban-risk-at-scale tradeoff that justifies moving to a paid API is exactly that — **at-scale**. It isn't yet triggered, and moving early would mean paying (in cash or engineering time) to solve a risk the project doesn't currently have. The economical move now is staying manual and revisiting once (1) send volume actually approaches bulk territory, and (2) Meta's October rate card removes the current pricing fog so a real cost model (manual-risk-adjusted vs. Twilio vs. 360dialog vs. Meta-direct) can be built — not before.

## Comments

Created 2026-07-29, `/research` subagent dispatched same day.
