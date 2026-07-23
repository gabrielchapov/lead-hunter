"""
Business data scrapers — currently OpenStreetMap via Overpass API.
Free, no API key needed, no rate limits, community-maintained data.
"""

import uuid
import math
import unicodedata
import requests
from typing import Optional
from geopy.geocoders import Nominatim

from app.models import Prospect


def _normalize(s: str) -> str:
    """Lowercase + strip accents so 'Itapoá' and 'itapoa' (or an NFD-encoded
    'á' from a different keyboard/OS) both hit the same dictionary key."""
    s = s.lower().strip()
    s = unicodedata.normalize("NFKD", s)
    return "".join(c for c in s if not unicodedata.combining(c))


# Map user-facing categories to (key, value) OSM tag pairs.
# Each entry becomes `node["key"="value"](bbox);` in the Overpass query —
# NOT a bare "key=value" string, which is invalid Overpass QL.
CATEGORY_OSM_TAGS: dict[str, list[tuple[str, Optional[str]]]] = {
    "Clínica médica": [("amenity", "clinic")],
    "Odontologia": [("amenity", "dentist")],
    "Estética": [("shop", "beauty"), ("shop", "hairdresser")],
    "Fisioterapia": [("amenity", "clinic")],
    "Veterinária": [("amenity", "veterinary")],
}

# When no category is picked, search across all businesses by checking for
# the mere presence of these keys (no specific value required).
ALL_BUSINESS_KEYS = ["shop", "amenity", "office", "tourism"]

# Fallback: some hardcoded city locations (skips the network geocoding
# round-trip for the cities we know users will actually type). Keys are
# pre-normalized (lowercase, no accents) — always look these up via
# _normalize(), never compare raw strings.
KNOWN_LOCATIONS = {
    "itapoa, sc": {"lat": -26.1166, "lng": -48.5833},
    "itapoa": {"lat": -26.1166, "lng": -48.5833},
    "porto alegre, rs": {"lat": -30.0346, "lng": -51.2177},
    "porto alegre": {"lat": -30.0346, "lng": -51.2177},
    "canoas, rs": {"lat": -29.92, "lng": -51.1833},
    "canoas": {"lat": -29.92, "lng": -51.1833},
    "novo hamburgo, rs": {"lat": -29.6783, "lng": -51.1306},
    "novo hamburgo": {"lat": -29.6783, "lng": -51.1306},
    "rio de janeiro, rj": {"lat": -22.9068, "lng": -43.1729},
    "rio de janeiro": {"lat": -22.9068, "lng": -43.1729},
    "sao paulo, sp": {"lat": -23.5505, "lng": -46.6333},
    "sao paulo": {"lat": -23.5505, "lng": -46.6333},
    "belo horizonte, mg": {"lat": -19.9167, "lng": -43.9345},
    "belo horizonte": {"lat": -19.9167, "lng": -43.9345},
    "curitiba, pr": {"lat": -25.4284, "lng": -49.2733},
    "curitiba": {"lat": -25.4284, "lng": -49.2733},
    "salvador, ba": {"lat": -12.9714, "lng": -38.5014},
    "salvador": {"lat": -12.9714, "lng": -38.5014},
    "fortaleza, ce": {"lat": -3.7172, "lng": -38.5433},
    "fortaleza": {"lat": -3.7172, "lng": -38.5433},
}


def _geocode_location(location: str) -> Optional[dict]:
    """Geocode a location string to lat/lng. Returns {lat, lng} or None."""
    key = _normalize(location)
    if key in KNOWN_LOCATIONS:
        return KNOWN_LOCATIONS[key]

    try:
        geolocator = Nominatim(user_agent="lead_hunter_osm")
        geo = geolocator.geocode(location, timeout=10)
        if geo:
            return {"lat": geo.latitude, "lng": geo.longitude}
    except Exception:
        pass

    return None


def _build_overpass_query(
    lat: float,
    lng: float,
    radius_km: float,
    tag_pairs: list[tuple[str, Optional[str]]],
) -> str:
    """
    Build an Overpass QL query for businesses in a bounding box.

    tag_pairs is a list of (key, value) tuples. If value is None, matches
    any node/way that has the key at all (e.g. any "shop" tag, regardless
    of what kind of shop). If value is set, matches key=value exactly.

    Radius is converted to degrees (rough approximation, fine at this scale).
    Returns QL string ready for POST to Overpass API.
    """
    radius_deg = radius_km / 111.0

    south = lat - radius_deg
    north = lat + radius_deg
    west = lng - radius_deg
    east = lng + radius_deg
    bbox = f"{south},{west},{north},{east}"

    statements = []
    for key, value in tag_pairs:
        tag_filter = f'"{key}"="{value}"' if value is not None else f'"{key}"'
        statements.append(f"  node[{tag_filter}]({bbox});")
        statements.append(f"  way[{tag_filter}]({bbox});")

    query = "[out:json][timeout:25];\n(\n" + "\n".join(statements) + "\n);\nout center;\n"
    return query


def _distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine distance in km."""
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLng = math.radians(lng2 - lng1)
    a = (
        math.sin(dLat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def scrape_overpass(
    location: str, category: Optional[str] = None, radius_km: float = 25
) -> list[Prospect]:
    """
    Scrape OpenStreetMap for businesses via Overpass API.

    Args:
        location: e.g. "Itapoá, SC" or "Porto Alegre, RS"
        category: optional filter, e.g. "Clínica médica", "Odontologia"
        radius_km: search radius in kilometers (default 25)

    Returns:
        List of Prospect objects
    """
    # Geocode location to lat/lng
    center = _geocode_location(location)
    if not center:
        raise ValueError(f"Could not geocode location: {location}")

    center_lat, center_lng = center["lat"], center["lng"]
    city = location.split(",")[0].strip()
    state = "SC" if "sc" in location.lower() else "RS"

    # Determine OSM tag pairs to search for
    if category and category in CATEGORY_OSM_TAGS:
        tag_pairs = CATEGORY_OSM_TAGS[category]
    else:
        # Search all businesses: presence of any of these keys, any value
        tag_pairs = [(key, None) for key in ALL_BUSINESS_KEYS]

    # Build Overpass query
    query = _build_overpass_query(center_lat, center_lng, radius_km, tag_pairs)

    # POST to Overpass API. Two things matter here that are easy to miss:
    # - The query must be sent as a form field named "data" (Overpass's
    #   documented POST convention), not as a raw body — some Overpass
    #   mirrors reject a bare body with 406 Not Acceptable.
    # - A real User-Agent is required; Overpass (and the Apache in front of
    #   it) will 406/403 generic "python-requests" agents.
    headers = {
        "User-Agent": "LeadHunterOSM/1.0 (+https://github.com/lead-hunter; contact: gabrielchapov.dev@gmail.com)",
        "Accept": "application/json, text/plain, */*",
    }
    try:
        response = requests.post(
            "https://overpass-api.de/api/interpreter",
            data={"data": query},
            headers=headers,
            timeout=40,
        )
        if response.status_code != 200:
            # Overpass returns the parser error as plain text/HTML in the body —
            # surface it so a bad query is obvious instead of a bare "400".
            raise ValueError(
                f"Overpass API returned {response.status_code}: {response.text[:300]}"
            )
        data = response.json()
    except requests.RequestException as e:
        raise ValueError(f"Overpass API request failed: {str(e)}")

    # Parse results
    prospects = []
    elements = data.get("elements", [])

    for elem in elements:
        try:
            tags = elem.get("tags", {})
            name = tags.get("name")

            if not name or len(name) < 2:
                continue

            # Get coordinates (prefer center for ways, use coords for nodes)
            if "center" in elem:
                lat, lng = elem["center"]["lat"], elem["center"]["lon"]
            elif "lat" in elem and "lon" in elem:
                lat, lng = elem["lat"], elem["lon"]
            else:
                continue

            # Filter by radius
            distance = _distance_km(center_lat, center_lng, lat, lng)
            if distance > radius_km:
                continue

            # Extract optional fields
            phone = tags.get("phone")
            website = tags.get("website") or tags.get("contact:website")
            address = tags.get("addr:street")
            if address and tags.get("addr:housenumber"):
                address = f"{address}, {tags['addr:housenumber']}"

            # Infer channels from tags
            has_phone = bool(phone)
            has_website = bool(website)
            has_instagram = "contact:instagram" in tags

            # Score: higher if has contact info
            score = 50
            if has_phone:
                score += 15
            if has_website:
                score += 10
            if has_instagram:
                score += 5
            score = min(score, 100)

            # When no category filter was applied, tag the prospect with
            # whatever OSM category it actually matched (shop type, amenity
            # type, etc.) instead of a generic label.
            inferred_category = category or tags.get("shop") or tags.get("amenity") or tags.get("office") or tags.get("tourism") or "Negócio Local"

            prospect = Prospect(
                id=str(uuid.uuid4())[:8],
                name=name,
                category=inferred_category,
                address=address,
                city=city,
                state=state,
                lat=lat,
                lng=lng,
                website=website,
                has_site=has_website,
                phone=phone,
                instagram=tags.get("contact:instagram"),
                email=tags.get("contact:email"),
                has_whatsapp=has_phone,  # Assume if has phone, likely has WhatsApp in Brazil
                has_instagram=has_instagram,
                has_email=bool(tags.get("contact:email")),
                score=score,
                stage="novo",
                enriched=bool(phone or website),  # Mark as enriched if we got contact info from OSM
            )
            prospects.append(prospect)

        except Exception:
            # Skip malformed elements
            continue

    return prospects
