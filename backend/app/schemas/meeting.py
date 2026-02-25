from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class MeetingCreate(BaseModel):
    title: str

class MeetingOut(BaseModel):
    meeting_id: str
    title: str
    host_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MeetingCreateResponse(BaseModel):
    """Response when creating a meeting, includes password and invitation token"""
    meeting_id: str
    title: str
    password: str
    invitation_token: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InvitationDetails(BaseModel):
    """Details for sharing the invitation link"""
    meeting_id: str
    title: str
    password: str
    invitation_token: str
    host_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MeetingJoin(BaseModel):
    meeting_id: str
    password: str        