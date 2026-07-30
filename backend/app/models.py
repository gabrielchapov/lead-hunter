import hashlib

from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime
from datetime import datetime, timezone
from app.database import Base


class Prospect(Base):
    """A prospected local business — the 'Lead Hunter' data shape.

    Table is named `prospects` (not `leads`) on purpose: the earlier MVP
    used a `leads` table with a different, simpler schema. A new table
    name avoids silently colliding with that old schema in the same
    SQLite file rather than requiring a destructive migration.
    """

    __tablename__ = "prospects"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)

    address = Column(String)  # expected format: "Rua X, 123 · Bairro"
    city = Column(String)
    state = Column(String)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    website = Column(String, nullable=True)
    has_site = Column(Boolean, default=False)

    phone = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    email = Column(String, nullable=True)
    has_whatsapp = Column(Boolean, default=False)
    has_instagram = Column(Boolean, default=False)
    has_email = Column(Boolean, default=False)

    score = Column(Integer, default=50)  # 0-100, drives "temperatura" client-side
    stage = Column(String, default="novo")  # novo | contatado | respondeu | fechado
    enriched = Column(Boolean, default=False)
    qualified = Column(Boolean, default=False)  # manual gate before demo-generation (wayfinder ticket 01)

    # Generated demo site (wayfinder ticket 02) - stored, not regenerated
    # per view, so the link stays stable even if the lead's data changes later.
    demo_html = Column(String, nullable=True)
    demo_generated_at = Column(DateTime, nullable=True)

    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "lat": self.lat,
            "lng": self.lng,
            "website": self.website,
            "hasSite": self.has_site,
            "phone": self.phone,
            "instagram": self.instagram,
            "email": self.email,
            "wa": self.has_whatsapp,
            "ig": self.has_instagram,
            "em": self.has_email,
            "score": self.score,
            "stage": self.stage,
            "enriched": self.enriched,
            "qualified": self.qualified,
            "hasDemo": self.demo_html is not None,
            "notes": self.notes,
        }


def template_id_for(text: str) -> str:
    """Stable short id derived from template text (wayfinder ticket 06)
    — there's no multi-template management UI yet, so identity comes
    from the content itself: the same text always maps to the same id,
    any edit produces a new one, with no separate naming step required."""
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()[:8]


class OutreachSend(Base):
    """A logged WhatsApp send, tagged by template so reply rate can be
    tracked per template/variant (wayfinder ticket 06). The actual send
    still happens client-side via a wa.me deep link — this just records
    that it happened."""

    __tablename__ = "outreach_sends"

    id = Column(String, primary_key=True, index=True)
    prospect_id = Column(String, index=True, nullable=False)
    template_id = Column(String, index=True, nullable=False)
    template_text = Column(String, nullable=False)
    variant = Column(String, nullable=True)
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def as_dict(self):
        return {
            "id": self.id,
            "prospectId": self.prospect_id,
            "templateId": self.template_id,
            "templateText": self.template_text,
            "variant": self.variant,
            "sentAt": self.sent_at.isoformat() if self.sent_at else None,
        }
