import httpx
import jwt
import json
import base64
import time
import logging
from typing import Optional, Dict, Any

from .config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# JWKS cache – avoids fetching Clerk's public keys on every request
# ---------------------------------------------------------------------------
_jwks_cache: Dict[str, Any] = {"keys": [], "fetched_at": 0}
_JWKS_CACHE_TTL = 3600  # seconds


def _get_clerk_frontend_api() -> str:
    """
    Derive the Clerk instance domain from the publishable key.
    pk_test_<base64-encoded-domain>$  →  <domain>
    """
    pk = settings.CLERK_PUBLISHABLE_KEY
    if not pk:
        raise ValueError("CLERK_PUBLISHABLE_KEY is not set")
    # Strip the pk_test_ or pk_live_ prefix
    b64_part = pk.split("_", 2)[-1]  # e.g. "test_YXJ0aXN0..."
    if "_" in b64_part:
        b64_part = b64_part.split("_", 1)[-1]
    # Add padding
    b64_part += "=" * (-len(b64_part) % 4)
    domain = base64.b64decode(b64_part).decode().rstrip("$")
    return domain


def _get_jwks_url() -> str:
    domain = _get_clerk_frontend_api()
    return f"https://{domain}/.well-known/jwks.json"


async def _fetch_jwks() -> list:
    """Fetch (or return cached) JSON Web Key Set from Clerk."""
    global _jwks_cache
    now = time.time()
    if _jwks_cache["keys"] and (now - _jwks_cache["fetched_at"]) < _JWKS_CACHE_TTL:
        return _jwks_cache["keys"]

    jwks_url = _get_jwks_url()
    logger.info(f"Fetching JWKS from {jwks_url}")
    async with httpx.AsyncClient() as client:
        resp = await client.get(jwks_url, timeout=10.0)
        resp.raise_for_status()
        data = resp.json()
        _jwks_cache["keys"] = data.get("keys", [])
        _jwks_cache["fetched_at"] = now
        logger.info(f"JWKS fetched successfully, {len(_jwks_cache['keys'])} key(s)")
        return _jwks_cache["keys"]


def _decode_jwt_payload_unsafe(token: str) -> Optional[Dict[str, Any]]:
    """Decode JWT payload WITHOUT verification (for extracting claims like kid)."""
    try:
        parts = token.split(".")
        if len(parts) < 2:
            return None
        payload_b64 = parts[1]
        payload_b64 += "=" * (-len(payload_b64) % 4)
        decoded = base64.urlsafe_b64decode(payload_b64.encode())
        return json.loads(decoded)
    except Exception:
        return None


def _decode_jwt_header(token: str) -> Optional[Dict[str, Any]]:
    """Decode the JWT header to extract the kid (key ID)."""
    try:
        parts = token.split(".")
        if len(parts) < 2:
            return None
        header_b64 = parts[0]
        header_b64 += "=" * (-len(header_b64) % 4)
        decoded = base64.urlsafe_b64decode(header_b64.encode())
        return json.loads(decoded)
    except Exception:
        return None


async def verify_clerk_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify a Clerk session JWT using Clerk's JWKS public keys.

    1. Fetch (cached) JWKS from Clerk's well-known endpoint
    2. Match the JWT's `kid` header to a JWKS key
    3. Verify signature and decode claims using PyJWT
    4. Return the verified payload, or None on failure.
    """
    try:
        if not token:
            logger.error("Token is empty")
            return None
            
        # 1. Get JWKS keys
        jwks_keys = await _fetch_jwks()
        if not jwks_keys:
            logger.error("No JWKS keys available from Clerk")
            return None

        # 2. Get the kid from the token header
        header = _decode_jwt_header(token)
        if not header:
            logger.error("Could not decode JWT header")
            return None
        kid = header.get("kid")
        logger.info(f"Token kid: {kid}")

        # 3. Find matching public key
        matching_key = None
        for key in jwks_keys:
            if key.get("kid") == kid:
                matching_key = key
                break

        if not matching_key:
            logger.error(f"No JWKS key found matching kid={kid}")
            logger.info(f"Available keys: {[k.get('kid') for k in jwks_keys]}")
            # Invalidate cache and retry once
            _jwks_cache["fetched_at"] = 0
            jwks_keys = await _fetch_jwks()
            for key in jwks_keys:
                if key.get("kid") == kid:
                    matching_key = key
                    break
            if not matching_key:
                logger.error(f"Still no JWKS key found for kid={kid} after refresh")
                return None

        # 4. Build the public key and verify
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(matching_key))
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={
                "verify_aud": False,   # Clerk session tokens don't always have aud
                "verify_iss": False,   # We'll validate issuer ourselves if needed
            },
        )

        logger.info(f"Clerk JWT verified successfully for sub={payload.get('sub')}")
        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("Clerk JWT has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Clerk JWT invalid: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error verifying Clerk JWT: {e}")
        return None


async def fetch_clerk_user(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch user details from Clerk's Users API.
    GET https://api.clerk.com/v1/users/{user_id}
    Uses CLERK_SECRET_KEY as bearer auth.
    """
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.clerk.com/v1/users/{user_id}",
                headers={"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"},
                timeout=10.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                # Extract email from email_addresses array
                email = None
                email_addresses = data.get("email_addresses", [])
                if email_addresses:
                    # Find the primary email or use the first one
                    primary_id = data.get("primary_email_address_id")
                    for ea in email_addresses:
                        if ea.get("id") == primary_id:
                            email = ea.get("email_address")
                            break
                    if not email and email_addresses:
                        email = email_addresses[0].get("email_address")

                return {
                    "id": data.get("id"),
                    "email": email,
                    "first_name": data.get("first_name"),
                    "last_name": data.get("last_name"),
                }
            else:
                logger.error(f"Clerk Users API returned {resp.status_code}: {resp.text[:200]}")
                return None
    except Exception as e:
        logger.error(f"Error fetching Clerk user {user_id}: {e}")
        return None
