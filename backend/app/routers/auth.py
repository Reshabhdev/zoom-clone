from fastapi import APIRouter, Depends

from backend.app.models.user import User
from backend.app.database.deps import get_current_user
from backend.app.schemas.user import UserResponse

# Prefix is handled in main.py to keep this file flexible
router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's information from the database.
    Authentication is handled by Clerk via the get_current_user dependency.
    """
    return current_user