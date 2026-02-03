from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MeetingCreate(BaseModel):
    title: str
    password: Optional[str] = None

class MeetingOut(BaseModel):
    meeting_id: str
    title: str
    host_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class MeetingJoin(BaseModel):
    meeting_id: str
    password: Optional[str] = None        