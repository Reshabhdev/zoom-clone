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

def get_clerk_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Extract and validate Clerk token from Authorization header.
    Returns the Clerk user data including user ID and email.
    """
    token = credentials.credentials
    
    try:
        # Verify by trying to get the user's own data from Clerk using their token
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        response = httpx.get(
            f"{CLERK_API_BASE}/me", 
            headers=headers,
            timeout=10.0
        )
        
        if response.status_code != 200:
            print(f"Clerk /me verification failed: {response.status_code} - {response.text}") 
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        
        return response.json()
    except httpx.RequestError as e:
        print(f"Request Error verifying token with Clerk: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not verify token with Clerk",
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