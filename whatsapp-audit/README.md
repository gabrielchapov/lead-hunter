# WhatsApp Bot Audit Tool

A companion tool for the Lead Finder MVP (`../backend`, `../frontend`). Where the rest of this project finds Brazilian SMBs to reach out to, this piece answers one specific question about each lead: does their WhatsApp "AI attendant" actually hold up under real customer behavior? It acts like a slightly-annoying real customer, logs what happens, and gives you the proof screenshot for the "we find the sad path" pitch.

## How it fits with the rest of the project

This reads the same lead data the backend already models (`company_name`, `whatsapp`, `business_type`, `city`, `notes`). Easiest path: hit the existing `/api/v1/leads/export` endpoint on the FastAPI backend, drop the CSV it gives you into `data/leads.csv` here, and run this tool against it. It's a standalone Node script rather than part of the FastAPI/React app because the actual "send a WhatsApp message and wait for a reply" step needs a real, persistent WhatsApp Web session (QR-code login) — that's a different runtime concern than the scraper/API/frontend, so it's kept separate on purpose.

## What it does

1. Reads target businesses from `data/leads.csv`.
2. Sends each one four short test messages over **your own WhatsApp Web session**: a normal greeting, a voice note, a reference to a nonexistent past order, and a message mixing two topics. These map directly to the failure modes that show up constantly in real complaints — bots that can't handle audio, have no memory between messages, and lock customers into a rigid menu.
3. Waits to see if/how fast a reply comes back, logs everything to `data/results.csv`, and moves to the next lead — with randomized delays and a daily cap so it behaves like a person testing a few businesses, not a script blasting a list.
4. You read the logged replies afterward and judge whether the bot handled it well or embarrassingly. That judgment call is deliberately not automated — it's also exactly what becomes your outreach screenshot.

## Before you run this — read this part

- **Use a secondary/test WhatsApp number, not your main personal number, and not a client's number.** Meta's 2026 enforcement flags automated-looking behavior. This is built to look human (random delays, daily cap, typing simulation), but there's no such thing as zero risk when a script drives WhatsApp Web. If the test number gets flagged, you lose a burner, not your real line.
- **Respect the safety rails in `config.json`.** Don't raise `maxTestsPerDay` or shrink the delays to "go faster" — the whole point is this reads as one curious human, not a bot.
- **This is a mystery-shopper test, not spam.** One short exchange per lead, sent to a public business number the same way any customer could message them — not a bulk unsolicited blast. Keep it that way.
- **This hasn't been run end-to-end yet** — building it happened without a live WhatsApp session to test against (sandbox limitation). Run `npm run dry-run` first to sanity-check the logic before it ever touches a real session, and watch the first few live sends closely.

## Setup

Requires Node.js 18+.

```bash
cd whatsapp-audit
npm install
```

Get your lead list into `data/leads.csv` — either export it from the backend (`GET /api/v1/leads/export`) and drop the file here, or fill it in by hand. The two example rows in the file already there are placeholders; replace or delete them. Phone numbers need to be digits only, country code first, no `+` or spaces: `5511999990000`.

Drop a short real voice note (a few seconds, recorded normally) at `data/test_audio.ogg` — this is the "can your bot handle audio" test, so it has to be an actual audio file.

## Running it

Dry run first — logs what *would* be sent, sends nothing, connects to nothing:

```bash
npm run dry-run
```

When that looks right:

```bash
npm start
```

A QR code prints in the terminal. Open WhatsApp on the test phone → Linked Devices → scan it. The script works through `data/leads.csv`, skips anyone already logged in `data/results.csv`, and stops once it hits the daily cap or the active-hours window closes.

## Reading the results

`data/results.csv` gets one row per test message per lead: timestamp, business, which test it was, whether a reply came, how fast, and the reply text. A reply inside ~15 seconds is almost certainly automated, not a human — logged as a hint (`likely_bot`), not a certainty. The `manual_review` column is left blank on purpose: write "handled fine" / "broke on the audio" / "gave a made-up answer" there after actually reading the exchange. That's what turns into your outreach message and your audit report.
