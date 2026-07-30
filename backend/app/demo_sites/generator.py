import os
from html import escape
from urllib.parse import quote

from app.models import Prospect

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")

# category (OSM tag value) -> (template filename, display label)
# Only categories with a real, designed template belong here - an
# unlisted category means "no demo available yet", not a fallback
# generic page. Extend one entry at a time as new templates get built.
CATEGORY_TEMPLATES = {
    "restaurant": ("restaurant.html", "Restaurante"),
}


def is_supported(category: str) -> bool:
    return category in CATEGORY_TEMPLATES


def _bairro_of(address: str | None) -> str:
    """Python port of the frontend's bairroOf() (types.ts) - address is
    stored as 'Rua X, 123 · Bairro'."""
    if not address:
        return ""
    parts = address.split("·")
    return parts[1].strip() if len(parts) > 1 else ""


def _whatsapp_block(prospect: Prospect) -> str:
    if prospect.phone:
        digits = "".join(ch for ch in prospect.phone if ch.isdigit())
        text = "Ola! Vi o site de voces e queria saber mais."
        url = f"https://wa.me/{digits}?text={quote(text)}"
        return (
            f'<a class="btn btn-primary" href="{escape(url)}" '
            f'target="_blank" rel="noopener noreferrer">Peça pelo WhatsApp</a>'
        )
    # No phone on file yet - never fabricate a contact channel, show a
    # neutral placeholder instead of a broken/fake link.
    return '<span class="btn btn-quiet">Contato em breve</span>'


def generate(prospect: Prospect) -> str:
    """Render the category template for this prospect's data. Raises
    KeyError if the category has no template - callers must check
    is_supported() first rather than relying on this to fail gracefully."""
    filename, category_label = CATEGORY_TEMPLATES[prospect.category]
    with open(os.path.join(TEMPLATES_DIR, filename), encoding="utf-8") as f:
        html = f.read()

    location_label = _bairro_of(prospect.address) or prospect.city or ""

    replacements = {
        "{{name}}": escape(prospect.name),
        "{{address}}": escape(prospect.address or prospect.city or "Endereço não informado"),
        "{{category_label}}": category_label,
        "{{category_label_lower}}": category_label.lower(),
        "{{location_label}}": escape(location_label) if location_label else "sua região",
        "{{whatsapp_block}}": _whatsapp_block(prospect),
    }
    for token, value in replacements.items():
        html = html.replace(token, value)
    return html
