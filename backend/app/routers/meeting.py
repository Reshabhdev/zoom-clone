import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Internal imports
from ..database.deps import get_db, get_current_user
from ..models.meeting import Meeting
from ..models.user import User
from ..schemas.meeting import MeetingCreate, MeetingOut, MeetingJoin

router = APIRouter()

@router.post("/create", response_model=MeetingOut)
def create_meeting(
    meeting_in: MeetingCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a unique 9-digit meeting ID and saves meeting details to the DB.
    """
    # Generate unique ID (format: xxx-xxx-xxx)
    raw_uuid = str(uuid.uuid4()).replace("-", "")
    short_id = f"{raw_uuid[:3]}-{raw_uuid[3:6]}-{raw_uuid[6:9]}"

    new_meeting = Meeting(
        meeting_id=short_id,
        title=meeting_in.title,
        host_id=current_user.id,
        password=meeting_in.password if meeting_in.password else None
    )
    
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    return new_meeting

@router.post("/join")
def join_meeting(
    join_data: MeetingJoin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verifies the meeting ID exists and checks the password if required.
    """
    # 1. Search for the meeting by the custom ID
    meeting = db.query(Meeting).filter(Meeting.meeting_id == join_data.meeting_id).first()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Meeting room not found"
        )

    # 2. If the meeting has a password, verify the provided one
    if meeting.password:
        if not join_data.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="This room requires a password"
            )
        
        if join_data.password != meeting.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Incorrect meeting password"
            )

    # 3. Success response
    return {
        "status": "success",
        "message": f"Successfully joined {meeting.title}",
        "data": {
            "room_id": meeting.meeting_id,
            "title": meeting.title,
            "joined_as": current_user.email
        }
    }

@router.get("/my-meetings", response_model=List[MeetingOut])
def get_user_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a list of all meetings hosted by the current user.
    """
    return db.query(Meeting).filter(Meeting.host_id == current_user.id).all()