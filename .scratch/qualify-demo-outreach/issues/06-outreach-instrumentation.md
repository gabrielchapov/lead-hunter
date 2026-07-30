Type: grilling
Status: resolved

## Question

What needs tracking for outreach instrumentation (template/variant tagging, reply rate), and where should it be visible?

## Answer

Tag every outreach send with `template_id` + `variant`. Log against the lead's existing Kanban stage transitions (Novo→Contatado is already a timestamp-able event, no new event model needed). Surface reply-rate-per-template as a new breakdown in the existing Painel view — it already does category/temperature breakdowns, this is the same pattern with one more dimension, rather than a new analytics screen to remember to check.

Important: this is decoupled from the WhatsApp Business API question (ticket 07). It works against the current manual `wa.me` deep-link flow as-is — no need to wait for an API decision to ship this.

## Comments

Resolved via grilling session, 2026-07-29.
