import os
import uuid
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, inspect, text
from typing import List, Optional

from app.auth import create_token, require_auth, verify_credentials
from app.database import get_db, engine
from app import enrichment
from app.models import Prospect, OutreachSend, template_id_for
from app.scrapers import scrape_overpass
from app.demo_sites import generator as demo_generator

load_dotenv()

VALID_STAGES = ["novo", "contatado", "respondeu", "fechado"]

app = FastAPI(
    title="Lead Hunter API",
    description="Prospecting API for the Lead Hunter tool — map, kanban, dashboard, and WhatsApp outreach for local businesses without a website.",
    version="0.2.0",
)

# CORS_ORIGINS in .env actually gets read now (it previously sat there
# unused while this was hardcoded to "*"). Falls back to "*" only if the
# env var is missing entirely, so local dev without a .env still works.
_cors_origins_env = os.getenv("CORS_ORIGINS")
_allow_origins = [o.strip() for o in _cors_origins_env.split(",")] if _cors_origins_env else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    # No cookies/auth are used, so credentials stay off — this keeps the
    # allow_origins=["*"] wildcard unambiguous (browsers reject "*" origin
    # combined with credentialed requests; we don't send any, but there's
    # no reason to leave the flag on and invite confusion).
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def create_db_tables():
    Prospect.__table__.create(bind=engine, checkfirst=True)
    OutreachSend.__table__.create(bind=engine, checkfirst=True)
    _add_missing_columns()


def _add_missing_columns():
    """checkfirst=True above only creates the table if it's entirely
    absent — it does nothing for a table that already exists with an
    older column set, which is exactly production's situation on every
    deploy that adds a column. There's no Alembic (or any migration
    tool) in this project yet; for the occasional single added column,
    a guarded ALTER TABLE is simpler than introducing one. Revisit if
    schema changes start happening often enough for this to get messy.
    """
    inspector = inspect(engine)
    existing = {col["name"] for col in inspector.get_columns(Prospect.__tablename__)}
    with engine.begin() as conn:
        if "qualified" not in existing:
            conn.execute(
                text(f"ALTER TABLE {Prospect.__tablename__} ADD COLUMN qualified BOOLEAN DEFAULT FALSE")
            )
        if "demo_html" not in existing:
            conn.execute(text(f"ALTER TABLE {Prospect.__tablename__} ADD COLUMN demo_html VARCHAR"))
        if "demo_generated_at" not in existing:
            conn.execute(
                text(f"ALTER TABLE {Prospect.__tablename__} ADD COLUMN demo_generated_at TIMESTAMP")
            )


@app.on_event("startup")
async def startup_event():
    create_db_tables()
    print("Lead Hunter API started. Database starts empty — use \"Importar do OpenStreetMap\" to pull real leads for a location.")


@app.get("/")
def read_root():
    return {
        "message": "Lead Hunter API",
        "version": "0.2.0",
        "endpoints": [
            "/api/v1/leads",
            "/api/v1/leads/{id}/stage",
            "/api/v1/leads/{id}/qualify",
            "/api/v1/leads/{id}/enrich",
            "/api/v1/leads/{id}/sends",
            "/api/v1/outreach/stats",
            "/api/v1/leads/{id}/demo",
            "/demo/{id}",
        ],
    }


@app.post("/api/v1/auth/login")
def login(payload: dict = Body(...)):
    """Single-user login. Credentials live in AUTH_USERNAME/AUTH_PASSWORD
    env vars — there's no user table, this is a solo tool being exposed
    to the internet, not a multi-tenant product."""
    username = payload.get("username", "")
    password = payload.get("password", "")
    if not verify_credentials(username, password):
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")
    return {"token": create_token(username)}


@app.get("/api/v1/leads", response_model=List[dict])
def get_leads(db: Session = Depends(get_db), _user: str = Depends(require_auth)):
    """Return every prospect. Filtering/sorting by category, radius,
    channel, and text is done client-side against this full list, per
    the design spec (the dataset here is small enough that a full
    client-side recompute on every filter change is instant)."""
    prospects = db.execute(select(Prospect)).scalars().all()
    return [p.as_dict() for p in prospects]


@app.patch("/api/v1/leads/{prospect_id}/stage")
def update_stage(
    prospect_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _user: str = Depends(require_auth),
):
    """Move a prospect between Kanban stages."""
    stage = payload.get("stage")
    if stage not in VALID_STAGES:
        raise HTTPException(status_code=400, detail=f"stage must be one of {VALID_STAGES}")
    prospect = db.get(Prospect, prospect_id)
    if prospect is None:
        raise HTTPException(status_code=404, detail="Prospect not found")
    prospect.stage = stage
    db.commit()
    db.refresh(prospect)
    return prospect.as_dict()


@app.post("/api/v1/leads/{prospect_id}/sends")
def log_send(
    prospect_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _user: str = Depends(require_auth),
):
    """Log a WhatsApp send for outreach instrumentation (wayfinder ticket
    06). Called right when the operator clicks "WhatsApp" on a lead —
    the actual send still happens client-side via a wa.me link; this
    just records that it happened so reply rate can be tracked per
    template later via GET /api/v1/outreach/stats."""
    template_text = (payload.get("template_text") or "").strip()
    if not template_text:
        raise HTTPException(status_code=400, detail="template_text is required")
    variant = payload.get("variant")

    prospect = db.get(Prospect, prospect_id)
    if prospect is None:
        raise HTTPException(status_code=404, detail="Prospect not found")

    send = OutreachSend(
        id=str(uuid.uuid4())[:8],
        prospect_id=prospect_id,
        template_id=template_id_for(template_text),
        template_text=template_text,
        variant=variant,
    )
    db.add(send)
    db.commit()
    db.refresh(send)
    return send.as_dict()


@app.get("/api/v1/outreach/stats")
def outreach_stats(db: Session = Depends(get_db), _user: str = Depends(require_auth)):
    """Reply-rate-per-template breakdown for the Painel view (wayfinder
    ticket 06). "Reply" is a proxy, not a separate tracked event: a
    sent-to lead currently sitting in stage 'respondeu' or 'fechado'
    counts as replied, reusing the Kanban stage that already exists
    rather than adding a new reply-event model."""
    sends = db.execute(select(OutreachSend)).scalars().all()
    if not sends:
        return []

    prospect_ids = {s.prospect_id for s in sends}
    prospects_by_id = {
        p.id: p
        for p in db.execute(select(Prospect).where(Prospect.id.in_(prospect_ids))).scalars()
    }

    by_template: dict[str, dict] = {}
    for send in sends:
        bucket = by_template.setdefault(
            send.template_id,
            {"templateId": send.template_id, "templateText": send.template_text, "prospect_ids": set()},
        )
        bucket["prospect_ids"].add(send.prospect_id)

    result = []
    for bucket in by_template.values():
        ids_for_template = bucket.pop("prospect_ids")
        replied = sum(
            1
            for pid in ids_for_template
            if prospects_by_id.get(pid) and prospects_by_id[pid].stage in ("respondeu", "fechado")
        )
        total = len(ids_for_template)
        result.append(
            {
                **bucket,
                "sentCount": total,
                "repliedCount": replied,
                "replyRate": round(replied / total, 3) if total else 0,
            }
        )

    result.sort(key=lambda r: r["sentCount"], reverse=True)
    return result


@app.patch("/api/v1/leads/{prospect_id}/qualify")
def update_qualified(
    prospect_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _user: str = Depends(require_auth),
):
    """Manual qualification gate (wayfinder ticket 01): marks whether a
    lead is worth building a demo for. No scoring, purely a judgment
    call the operator makes per lead."""
    qualified = payload.get("qualified")
    if not isinstance(qualified, bool):
        raise HTTPException(status_code=400, detail="qualified must be a boolean")
    prospect = db.get(Prospect, prospect_id)
    if prospect is None:
        raise HTTPException(status_code=404, detail="Prospect not found")
    prospect.qualified = qualified
    db.commit()
    db.refresh(prospect)
    return prospect.as_dict()


@app.post("/api/v1/leads/{prospect_id}/demo")
def generate_demo(prospect_id: str, db: Session = Depends(get_db), _user: str = Depends(require_auth)):
    """Generate a category-template demo site for a lead (wayfinder
    ticket 02). Gated behind the qualification flag (ticket 01) — this
    isn't something to bulk-run across every imported lead, only ones
    already judged worth the pitch. Only categories with a real,
    designed template are supported; an unlisted category returns a
    clear 501 rather than falling back to a generic page."""
    prospect = db.get(Prospect, prospect_id)
    if prospect is None:
        raise HTTPException(status_code=404, detail="Prospect not found")
    if not prospect.qualified:
        raise HTTPException(
            status_code=400,
            detail="Este lead ainda não foi qualificado. Marque como qualificado antes de gerar uma demo.",
        )
    if not demo_generator.is_supported(prospect.category):
        raise HTTPException(
            status_code=501,
            detail=f"Ainda não existe um modelo de demo para a categoria '{prospect.category}'.",
        )

    prospect.demo_html = demo_generator.generate(prospect)
    prospect.demo_generated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(prospect)
    return {"demo_url": f"/demo/{prospect.id}", **prospect.as_dict()}


@app.get("/demo/{prospect_id}", response_class=HTMLResponse)
def view_demo(prospect_id: str, db: Session = Depends(get_db)):
    """Public, unauthenticated - this is the link sent to the lead
    themselves, they obviously don't have a Lead Hunter login."""
    prospect = db.get(Prospect, prospect_id)
    if prospect is None or not prospect.demo_html:
        raise HTTPException(status_code=404, detail="Demo not found")
    return HTMLResponse(content=prospect.demo_html)


@app.post("/api/v1/leads/{prospect_id}/enrich")
def enrich_lead(prospect_id: str, db: Session = Depends(get_db), _user: str = Depends(require_auth)):
    """Attempt to enrich a prospect's contact details.

    If GOOGLE_PLACES_API_KEY is configured, looks the business up on
    Google Places (Text Search -> Place Details) and fills in phone/
    website fields OSM didn't have — never overwrites data that's
    already there. This endpoint never fabricates contact info: with no
    provider configured, or if Places has no match, it only confirms
    whatever contact info Overpass/OSM already gave us.
    """
    prospect = db.get(Prospect, prospect_id)
    if prospect is None:
        raise HTTPException(status_code=404, detail="Prospect not found")

    if enrichment.is_configured():
        try:
            result = enrichment.enrich(prospect.name, prospect.city, prospect.state)
        except requests.RequestException as e:
            raise HTTPException(status_code=502, detail=f"Consulta ao Google Places falhou: {str(e)}")

        if result:
            if result.get("phone") and not prospect.phone:
                prospect.phone = result["phone"]
                prospect.has_whatsapp = True
                prospect.score = min(prospect.score + 15, 100)
            if result.get("website") and not prospect.website:
                prospect.website = result["website"]
                prospect.has_site = True
                prospect.score = min(prospect.score + 10, 100)

    if prospect.phone or prospect.instagram or prospect.email:
        prospect.enriched = True
        db.commit()
        db.refresh(prospect)
        return prospect.as_dict()

    db.commit()
    raise HTTPException(
        status_code=501,
        detail=(
            "Nenhum provedor de enriquecimento configurado. Este lead não tem "
            "contato disponível no OpenStreetMap, e nenhum dado é inventado — "
            "configure GOOGLE_PLACES_API_KEY para habilitar busca automática."
        )
        if not enrichment.is_configured()
        else (
            "Nenhuma informação de contato encontrada para este negócio no "
            "Google Places."
        ),
    )


@app.delete("/api/v1/leads")
def clear_all_leads(db: Session = Depends(get_db), _user: str = Depends(require_auth)):
    """Wipe every prospect from the database. Use this to start clean for
    a new market/region rather than accumulating leads across unrelated
    searches indefinitely."""
    deleted = db.query(Prospect).delete()
    db.commit()
    return {"status": "cleared", "deleted_count": deleted}


@app.post("/api/v1/leads/import-overpass")
def import_from_overpass(
    location: str = Body(..., embed=True),
    category: Optional[str] = Body(None, embed=True),
    radius_km: float = Body(25, embed=True),
    db: Session = Depends(get_db),
    _user: str = Depends(require_auth),
):
    """Scrape OpenStreetMap for businesses in a location via Overpass API.

    Args:
        location: e.g. "Itapoá, SC"
        category: optional filter, e.g. "Clínica médica", "Odontologia"
        radius_km: search radius in kilometers (default 25)

    Returns:
        {status: "imported", location: str, category: str, new_count: int, total_scraped: int}

    Results appear immediately in GET /api/v1/leads.
    """
    try:
        print(f"[DEBUG] Importing from Overpass: location={location}, category={category}, radius={radius_km}")
        prospects = scrape_overpass(location, category, radius_km)
        print(f"[DEBUG] Got {len(prospects)} prospects from Overpass")

        if not prospects:
            return {
                "status": "no_results",
                "location": location,
                "category": category,
                "message": f"Nenhum negócio encontrado em {location}",
            }

        # Deduplicate: if a prospect with the same name+city exists, skip it
        city = location.split(",")[0].strip()
        existing_names = set(
            p.name for p in db.execute(select(Prospect.name).where(Prospect.city == city)).scalars()
        )

        added = 0
        for prospect in prospects:
            if prospect.name not in existing_names:
                db.add(prospect)
                existing_names.add(prospect.name)
                added += 1

        db.commit()

        return {
            "status": "imported",
            "location": location,
            "category": category,
            "new_count": added,
            "total_scraped": len(prospects),
            "duplicates_skipped": len(prospects) - added,
        }
    except ValueError as e:
        print(f"[ERROR] ValueError: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[ERROR] Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")
