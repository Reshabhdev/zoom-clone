from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.sql import func
from datetime import datetime, timezone
from ..database.base import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    # The short ID for the URL (e.g., abc-def-ghi)
    meeting_id = Column(String, unique=True, index=True) 
    title = Column(String, nullable=False)
    # Password for the room (auto-generated)
    password = Column(String, nullable=False) 
    # Unique token for invitation link
    invitation_token = Column(String, unique=True, index=True)
    # Link to the User who created it
    host_id = Column(Integer, ForeignKey("users.id")) 
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))