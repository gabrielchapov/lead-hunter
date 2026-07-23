import os

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional

from app.database import get_db, engine
from app.models import Prospect
from app.scrapers import scrape_overpass

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
            "/api/v1/leads/{id}/enrich",
        ],
    }


@app.get("/api/v1/leads", response_model=List[dict])
def get_leads(db: Session = Depends(get_db)):
    """Return every prospect. Filtering/sorting by category, radius,
    channel, and text is done client-side against this full list, per
    the design spec (the dataset here is small enough that a full
    client-side recompute on every filter change is instant)."""
    prospects = db.execute(select(Prospect)).scalars().all()
    return [p.as_dict() for p in prospects]


@app.patch("/api/v1/leads/{prospect_id}/stage")
def update_stage(prospect_id: str, payload: dict = Body(...), db: Session = Depends(get_db)):
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


@app.post("/api/v1/leads/{prospect_id}/enrich")
def enrich_lead(prospect_id: str, db: Session = Depends(get_db)):
    """Attempt to enrich a prospect's contact details.

    IMPORTANT: there is no real enrichment provider wired up yet (no
    Google Business Profile / CNPJ lookup / etc.). This endpoint does
    NOT fabricate phone numbers, Instagram handles, or emails — inventing
    a plausible-looking phone number for a real business and letting
    someone message it would be actively harmful, not a a harmless demo.
    Until a real provider is wired up here, this just confirms whatever
    contact info Overpass/OSM already gave us, or reports that nothing
    more is available.
    """
    prospect = db.get(Prospect, prospect_id)
    if prospect is None:
        raise HTTPException(status_code=404, detail="Prospect not found")

    if prospect.phone or prospect.instagram or prospect.email:
        prospect.enriched = True
        db.commit()
        db.refresh(prospect)
        return prospect.as_dict()

    raise HTTPException(
        status_code=501,
        detail=(
            "Nenhum provedor de enriquecimento configurado. Este lead não tem "
            "contato disponível no OpenStreetMap, e nenhum dado é inventado — "
            "configure um provedor real (Google Business Profile, CNPJ, etc.) "
            "para preencher isso automaticamente."
        ),
    )


@app.delete("/api/v1/leads")
def clear_all_leads(db: Session = Depends(get_db)):
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
