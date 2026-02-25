from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional


class UserResponse(BaseModel):
    id: int
    clerk_id: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
