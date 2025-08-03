"""
Authentication utilities for EduAI backend.

This module implements a minimal JSON Web Token (JWT) mechanism using
standard library modules. It should not be used as‑is in production;
libraries such as ``python‑jose`` or ``PyJWT`` provide robust implementations
and support more algorithms. However, those libraries are unavailable in
this environment, so we construct and verify HS256‑style JWTs manually.
"""

import base64
import hmac
import hashlib
import json
import time
from typing import Any, Dict, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

from .database import get_db


# A secret key used to sign tokens. In a real system this should be
# stored securely (e.g., environment variable) and rotated periodically.
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 60 * 60 * 24  # 1 day


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    data += "=" * padding
    return base64.urlsafe_b64decode(data)


def create_access_token(payload: Dict[str, Any]) -> str:
    """
    Create a signed JWT. The payload must be JSON serialisable and should
    include an ``exp`` key with an integer timestamp. Other claims (such as
    ``sub``) may be added by the caller. The header uses HS256.
    """
    header = {"alg": ALGORITHM, "typ": "JWT"}
    header_json = json.dumps(header, separators=(',', ':'), sort_keys=True).encode()
    payload_json = json.dumps(payload, separators=(',', ':'), sort_keys=True).encode()
    segments = [
        _b64encode(header_json),
        _b64encode(payload_json),
    ]
    signing_input = ".".join(segments).encode()
    signature = hmac.new(SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
    segments.append(_b64encode(signature))
    return ".".join(segments)


def decode_token(token: str) -> Dict[str, Any]:
    """Decode a JWT and verify its signature and expiration."""
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token structure")
    signing_input = f"{header_b64}.{payload_b64}".encode()
    signature = _b64decode(signature_b64)
    expected_sig = hmac.new(SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
    if not hmac.compare_digest(signature, expected_sig):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token signature")
    payload_json = _b64decode(payload_b64)
    try:
        payload: Dict[str, Any] = json.loads(payload_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    exp = payload.get("exp")
    if exp is None or not isinstance(exp, int):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing exp")
    if exp < int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    return payload


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


def authenticate_user(email: str, password: str) -> Optional[int]:
    """
    Validate user credentials. Returns the user ID if valid, otherwise None.
    Passwords are stored as salted hashes; we simply compare the stored hash
    with the hash of the provided password using the same salt prefix.
    """
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, password FROM users WHERE email = ?", (email,))
        row = cur.fetchone()
        if row is None:
            return None
        user_id = row["id"]
        stored = row["password"]
        if verify_password(password, stored):
            return user_id
    return None


def hash_password(password: str) -> str:
    """
    Produce a salted SHA‑256 hash of the password. We generate a random salt
    and prefix the resulting hash with the salt (base64 encoded). This is
    obviously not as secure as bcrypt or Argon2, but suffices for a demo.
    """
    import os
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return _b64encode(salt) + ":" + _b64encode(dk)


def verify_password(password: str, stored: str) -> bool:
    """Check whether a plain password matches the stored salted hash."""
    try:
        salt_b64, dk_b64 = stored.split(":")
        salt = _b64decode(salt_b64)
        dk_stored = _b64decode(dk_b64)
        dk_test = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
        return hmac.compare_digest(dk_test, dk_stored)
    except Exception:
        return False


async def get_current_user(token: str = Depends(oauth2_scheme)) -> int:
    """
    FastAPI dependency that extracts the user ID from the JWT and returns it.
    Raises HTTPException if the token is invalid or expired.
    """
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not isinstance(user_id, int):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID in token")
    return user_id
