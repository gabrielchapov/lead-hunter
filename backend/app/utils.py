import unicodedata


def slugify(text: str) -> str:
    """ASCII-only, lowercase, no spaces — used to derive things like
    placeholder emails/instagram handles from a business name during
    simulated enrichment."""
    normalized = unicodedata.normalize("NFKD", text)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    return ascii_only.lower().replace(" ", "")
