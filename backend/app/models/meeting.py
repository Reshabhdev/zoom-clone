from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.sql import func
from ..database.base import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    # The short ID for the URL (e.g., abc-def-ghi)
    meeting_id = Column(String, unique=True, index=True) 
    title = Column(String, nullable=False)
    # Optional password for the room
    password = Column(String, nullable=True) 
    # Link to the User who created it
    host_id = Column(Integer, ForeignKey("users.id")) 
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())