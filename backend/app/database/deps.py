from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import httpx

from .session import SessionLocal
from ..models.user import User
from ..core.config import settings

# Use HTTP Bearer token scheme for Clerk authentication
security = HTTPBearer()

CLERK_API_BASE = "https://api.clerk.com/v1"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ✅ Fixed the type hint right here:
def get_clerk_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    
    try:
        # Instead of /tokens/verify, use the /users/me or a direct session check
        # Many developers use the 'v1/client' or 'v1/sessions' to verify
        headers = {
            "Authorization": f"Bearer {token}" # Use the USER'S token here
        }
        
        # Verify by trying to get the user's own data from Clerk
        response = httpx.get(
            f"{CLERK_API_BASE}/me", 
            headers=headers
        )
        
        if response.status_code != 200:
            # Check Render logs for this specific detail
            print(f"Clerk Error: {response.text}") 
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        
        return response.json()
    except httpx.RequestError as e:
        print(f"Request Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not verify token with Clerk",
        )
    """
    Extract and validate Clerk token from Authorization header.
    Returns the raw Clerk session data.
    """
    token = credentials.credentials
    
    try:
        # Verify token with Clerk API
        headers = {
            "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"
        }
        
        response = httpx.get(
            f"{CLERK_API_BASE}/tokens/verify",
            headers=headers,
            params={"token": token}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return response.json()
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not verify token with Clerk",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(
    clerk_user: dict = Depends(get_clerk_user),
    db: Session = Depends(get_db)
):
    """
    Get or create user in database based on Clerk authentication.
    """
    clerk_id = clerk_user.get("sub")
    email = clerk_user.get("email")
    
    if not clerk_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format"
        )
    
    # Get or create user in database
    user = db.query(User).filter(User.clerk_id == clerk_id).first()
    
    if not user:
        user = User(
            clerk_id=clerk_id,
            email=email,
            first_name=clerk_user.get("given_name"),
            last_name=clerk_user.get("family_name")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user