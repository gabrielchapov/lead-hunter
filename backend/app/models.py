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
            "notes": self.notes,
        }
