import httpx
from typing import Optional, Dict, Any
from .config import settings

# Clerk API endpoints
CLERK_API_BASE = "https://api.clerk.com/v1"

async def verify_clerk_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify Clerk JWT token by making a request to Clerk's API.
    Returns the decoded token payload if valid, None otherwise.
    """
    try:
        headers = {
            "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CLERK_API_BASE}/tokens/verify",
                headers=headers,
                params={"token": token}
            )
            
            if response.status_code == 200:
                return response.json()
            return None
    except Exception as e:
        print(f"Error verifying Clerk token: {e}")
        return None
