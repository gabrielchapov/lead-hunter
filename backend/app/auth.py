import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Header, HTTPException

JWT_ALGORITHM = "HS256"
TOKEN_TTL_DAYS = 30


def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET not configured on the server.",
        )
    return secret


def verify_credentials(username: str, password: str) -> bool:
    expected_username = os.getenv("AUTH_USERNAME")
    expected_password = os.getenv("AUTH_PASSWORD")
    if not expected_username or not expected_password:
        raise HTTPException(
            status_code=500,
            detail="AUTH_USERNAME/AUTH_PASSWORD not configured on the server.",
        )
    # Constant-time comparisons so response timing can't be used to guess
    # the username/password one character at a time.
    return hmac.compare_digest(username, expected_username) and hmac.compare_digest(
        password, expected_password
    )


def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_TTL_DAYS),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def require_auth(authorization: Optional[str] = Header(default=None)) -> str:
    """FastAPI dependency — raises 401 unless a valid Bearer token is present.
    Wire this into every route that touches lead data."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization[len("Bearer ") :]
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload["sub"]
