# 🎯 Lead Hunter

Prospecting tool for local businesses without a website — map, Kanban pipeline, dashboard, and a WhatsApp message-template editor, built from the `Design para ferramenta de mapa.zip` handoff.

## Overview

Encontre negócios locais sem site para prospectar, acompanhe-os num Kanban, veja um painel de estatísticas, e dispare mensagens de WhatsApp personalizadas — tudo em pt-BR, focado no mercado brasileiro de SMBs.

## Features

- ✅ Mapa interativo (Leaflet, tema escuro CARTO) com busca por categoria/localização/raio
- ✅ Painel de resultados filtrável/ordenável, com cartões de lead e ações (WhatsApp, Detalhes, Enriquecer)
- ✅ Kanban de quatro estágios (Novo → Contatado → Respondeu → Fechado)
- ✅ Painel com estatísticas e gráficos por categoria/temperatura
- ✅ Editor de modelo de mensagem do WhatsApp com prévia ao vivo
- ✅ Exportação CSV/Excel dos leads filtrados
- ✅ Enriquecimento simulado (endpoint pronto para trocar por um provedor real depois)

## Project Structure

```
lead-hunter/
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI routes
│   │   ├── models.py       # SQLAlchemy models (Prospect)
│   │   ├── scrapers.py     # Overpass (OpenStreetMap) lead import
│   │   ├── utils.py        # slugify() helper
│   │   └── database.py     # Database setup
│   └── pyproject.toml
├── frontend/                # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/      # TopNav, MapaView, KanbanView, PainelView, MensagensView, ...
│   │   ├── styles/          # tokens.css (design tokens) + app.css (layout)
│   │   ├── utils/           # haversine, filters, whatsapp, export, geocode
│   │   ├── types.ts
│   │   ├── api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── whatsapp-audit/          # companion tool — see its own README
└── README.md
```

## Tech Stack

### Backend
- FastAPI · SQLAlchemy · SQLite

### Frontend
- React 18 + TypeScript + Vite
- Leaflet / react-leaflet (CARTO dark basemap)
- lucide-react icons
- Plain CSS (design tokens + component classes) — no Tailwind; the design is a
  specific dark "Modernist" system (0 border-radius, 2px rules, Archivo type)
  that's more directly expressed as its own token/class stylesheet than forced
  through Tailwind's default scale.

## Setup

### Backend

```bash
cd backend
pip install -e .
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The database starts empty. Use the "Importar do OpenStreetMap" button in the
Mapa view to pull real businesses for a location — there is no fictional/demo
dataset anymore. `DELETE /api/v1/leads` wipes everything if you want to start
clean for a new region.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173 · Backend: http://localhost:8000

## API Endpoints

- `GET /api/v1/leads` — all prospects
- `PATCH /api/v1/leads/{id}/stage` — move a prospect between Kanban stages (`{"stage": "contatado"}`)
- `POST /api/v1/leads/{id}/enrich` — simulated contact-info enrichment (replace with a real provider later)
- `POST /api/v1/leads/import-overpass` — pull real businesses from OpenStreetMap for a location (`{"location": "Itapoá, SC", "category": null, "radius_km": 20}`)
- `DELETE /api/v1/leads` — wipe all prospects

CSV/Excel export happens client-side over the currently-filtered leads (matches the design spec) rather than hitting the server.

## Next Steps

See `ROADMAP.md` for the full MVP → production plan. Short version:

1. Real geocoding for the "Localização" field (`src/utils/geocode.ts` currently has a small static city lookup — swap in Nominatim or Google Geocoding)
2. Wire a real enrichment provider behind `POST /api/v1/leads/{id}/enrich`
3. Real bulk-send flow behind "Modo disparo" (currently a summary `alert()`, per the design prototype)
4. Move off SQLite + localhost-only to a real deploy (see ROADMAP.md)

## WhatsApp Bot Audit

See `whatsapp-audit/` — a companion Node script that takes a lead export and tests each business's WhatsApp bot with real customer-style messages (audio, off-topic questions, multi-topic messages) to see if/where it breaks. See `whatsapp-audit/README.md` for setup and safety notes before running it.
