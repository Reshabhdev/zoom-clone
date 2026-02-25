import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Internal imports
from ..database.deps import get_db, get_current_user
from ..models.meeting import Meeting
from ..models.user import User
from ..schemas.meeting import (
    MeetingCreate, 
    MeetingOut, 
    MeetingJoin,
    MeetingCreateResponse,
    InvitationDetails
)
from ..core.utils import generate_meeting_credentials

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/create", response_model=MeetingCreateResponse)
def create_meeting(
    meeting_in: MeetingCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new meeting with:
    - Auto-generated 6-digit numeric password
    - Unique invitation token for shareable link
    - 9-digit meeting ID (format: xxx-xxx-xxx)
    """
    try:
        # Generate unique ID (format: xxx-xxx-xxx)
        raw_uuid = str(uuid.uuid4()).replace("-", "")
        short_id = f"{raw_uuid[:3]}-{raw_uuid[3:6]}-{raw_uuid[6:9]}"

        # Generate password and invitation token
        password, invitation_token = generate_meeting_credentials()

        logger.info(f"Creating meeting: id={short_id}, title={meeting_in.title}, host_id={current_user.id}")

        new_meeting = Meeting(
            meeting_id=short_id,
            title=meeting_in.title,
            host_id=current_user.id,
            password=password,
            invitation_token=invitation_token
        )
        
        db.add(new_meeting)
        db.commit()
        db.refresh(new_meeting)
        
        logger.info(f"Meeting created successfully: {new_meeting.meeting_id}")
        
        return {
            "meeting_id": new_meeting.meeting_id,
            "title": new_meeting.title,
            "password": new_meeting.password,
            "invitation_token": new_meeting.invitation_token,
            "created_at": new_meeting.created_at
        }
    except Exception as e:
        logger.error(f"Error creating meeting: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create meeting: {str(e)}"
        )

@router.get("/invitation/{invitation_token}", response_model=InvitationDetails)
def get_invitation_details(
    invitation_token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve meeting details using the invitation token.
    This is used when sharing the invitation link.
    """
    meeting = db.query(Meeting).filter(
        Meeting.invitation_token == invitation_token
    ).first()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation link not found or expired"
        )
    
    if not meeting.is_active:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This meeting has ended"
        )
    
    return meeting

@router.post("/join")
def join_meeting(
    join_data: MeetingJoin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verify meeting ID and password before allowing join.
    """
    # Search for the meeting by the custom ID
    meeting = db.query(Meeting).filter(Meeting.meeting_id == join_data.meeting_id).first()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Meeting room not found"
        )

    # Verify the password
    if join_data.password != meeting.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Incorrect meeting password"
        )

    # Success response
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