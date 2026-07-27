"""
Google Places (New) enrichment — resolves an OSM lead's name/city to a
Google place_id via Text Search, then pulls phone/website from Place
Details. Two billable calls per lead (Text Search to resolve the
place_id, then Details); see ROADMAP.md for why this is gated to leads
a human has already moved to "Contatado" rather than run automatically
on import.

Field masks are deliberately minimal (places.id for the search,
nationalPhoneNumber/websiteUri for details) to stay on the cheaper
Essentials SKU tier — rating/reviews live on the pricier Pro tier and
aren't fetched here.
"""

import os
from typing import Optional

import requests

PLACES_API_BASE = "https://places.googleapis.com/v1"


def is_configured() -> bool:
    return bool(os.getenv("GOOGLE_PLACES_API_KEY"))


def _api_key() -> str:
    key = os.getenv("GOOGLE_PLACES_API_KEY")
    if not key:
        raise RuntimeError("GOOGLE_PLACES_API_KEY not configured")
    return key


def _find_place_id(name: str, city: Optional[str], state: Optional[str]) -> Optional[str]:
    text_query = ", ".join(p for p in [name, city, state, "Brazil"] if p)

    response = requests.post(
        f"{PLACES_API_BASE}/places:searchText",
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": _api_key(),
            "X-Goog-FieldMask": "places.id",
        },
        json={"textQuery": text_query},
        timeout=10,
    )
    response.raise_for_status()
    places = response.json().get("places", [])
    return places[0]["id"] if places else None


def _get_place_details(place_id: str) -> dict:
    response = requests.get(
        f"{PLACES_API_BASE}/places/{place_id}",
        headers={
            "X-Goog-Api-Key": _api_key(),
            "X-Goog-FieldMask": "nationalPhoneNumber,websiteUri",
        },
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def enrich(name: str, city: Optional[str], state: Optional[str]) -> Optional[dict]:
    """Returns {"phone": str|None, "website": str|None} for the best-matching
    place, or None if Text Search found no match at all. Raises
    requests.RequestException on network/API failure — the caller decides
    how to surface that (this module doesn't know about HTTP status codes
    for the rest of the app)."""
    place_id = _find_place_id(name, city, state)
    if not place_id:
        return None
    details = _get_place_details(place_id)
    return {
        "phone": details.get("nationalPhoneNumber"),
        "website": details.get("websiteUri"),
    }
