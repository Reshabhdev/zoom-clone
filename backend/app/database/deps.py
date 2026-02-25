import logging

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .session import SessionLocal
from ..models.user import User
from ..core.security import verify_clerk_token, fetch_clerk_user

logger = logging.getLogger(__name__)

# Use HTTP Bearer token scheme for Clerk authentication
security = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_clerk_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Verify the Clerk session JWT using JWKS and return user claims.
    If the JWT doesn't contain an email, fetch user details from Clerk's Users API.
    """
    token = credentials.credentials
    logger.info(f"Auth: token present={bool(token)}, length={len(token) if token else 0}")
    
    if not token:
        logger.error("No token provided in Authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No token provided",
        )

    # 1. Verify the JWT signature using JWKS
    payload = await verify_clerk_token(token)
    if not payload:
        logger.error("Token verification failed - invalid or expired token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    logger.info(f"Token verified successfully. Payload: {list(payload.keys())}")
    
    sub = payload.get("sub")
    email = payload.get("email")
    given_name = payload.get("given_name") or payload.get("first_name")
    family_name = payload.get("family_name") or payload.get("last_name")

    # 2. Clerk session JWTs often lack email — fetch from Users API
    if not email and sub:
        logger.info(f"Email missing from JWT for sub={sub}, fetching from Clerk Users API")
        user_data = await fetch_clerk_user(sub)
        if user_data:
            email = user_data.get("email")
            if not given_name:
                given_name = user_data.get("first_name")
            if not family_name:
                family_name = user_data.get("last_name")

    return {
        "sub": sub,
        "email": email,
        "given_name": given_name,
        "family_name": family_name,
    }


def get_current_user(
    clerk_user: dict = Depends(get_clerk_user),
    db: Session = Depends(get_db),
):
    """
    Get or create user in database based on Clerk authentication.
    """
    clerk_id = clerk_user.get("sub")
    email = clerk_user.get("email")

    if not clerk_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID",
        )

    # If we still don't have email, use a placeholder derived from clerk_id
    if not email:
        logger.warning(f"Could not resolve email for clerk_id={clerk_id}, using placeholder")
        email = f"{clerk_id}@clerk.placeholder"

    # Get or create user in database
    user = db.query(User).filter(User.clerk_id == clerk_id).first()

    if not user:
        user = User(
            clerk_id=clerk_id,
            email=email,
            first_name=clerk_user.get("given_name"),
            last_name=clerk_user.get("family_name"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Created new user: clerk_id={clerk_id}, email={email}")
    else:
        # Update email if we now have a real one and the stored one is a placeholder
        if email and not email.endswith("@clerk.placeholder") and user.email != email:
            user.email = email
            if clerk_user.get("given_name"):
                user.first_name = clerk_user.get("given_name")
            if clerk_user.get("family_name"):
                user.last_name = clerk_user.get("family_name")
            db.commit()
            db.refresh(user)

    return user