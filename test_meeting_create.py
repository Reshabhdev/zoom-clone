#!/usr/bin/env python3
"""Test script to verify meeting creation"""

import sys
import os

from backend.app.database.session import SessionLocal, engine
from backend.app.database.base import Base
from backend.app.models.user import User
from backend.app.models.meeting import Meeting
from backend.app.core.utils import generate_meeting_credentials
import uuid

def test_meeting_creation():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created/verified")
    
    db = SessionLocal()
    
    try:
        # Check if user exists
        existing_user = db.query(User).filter(User.clerk_id == "test-user-1").first()
        if existing_user:
            test_user = existing_user
            print(f"✓ Using existing test user: {test_user.id}")
        else:
            # Create a test user
            test_user = User(
                clerk_id="test-user-1",
                email="test@example.com",
                first_name="Test",
                last_name="User"
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"✓ Test user created with id={test_user.id}")
        
        # Create a meeting
        raw_uuid = str(uuid.uuid4()).replace("-", "")
        short_id = f"{raw_uuid[:3]}-{raw_uuid[3:6]}-{raw_uuid[6:9]}"
        password, invitation_token = generate_meeting_credentials()
        
        meeting = Meeting(
            meeting_id=short_id,
            title="Test Meeting",
            host_id=test_user.id,
            password=password,
            invitation_token=invitation_token
        )
        
        db.add(meeting)
        db.commit()
        db.refresh(meeting)
        
        print(f"\n✓ Meeting created successfully!")
        print(f"  meeting_id: {meeting.meeting_id}")
        print(f"  title: {meeting.title}")
        print(f"  password: {meeting.password}")
        print(f"  invitation_token: {meeting.invitation_token}")
        print(f"  created_at: {meeting.created_at}")
        print(f"  created_at type: {type(meeting.created_at).__name__}")
        
        # Try to serialize as JSON to see if there's an issue
        import json
        from datetime import datetime
        
        response = {
            "meeting_id": meeting.meeting_id,
            "title": meeting.title,
            "password": meeting.password,
            "invitation_token": meeting.invitation_token,
            "created_at": meeting.created_at
        }
        
        # This is what Pydantic would try to do
        json_str = json.dumps(response, default=str)
        print(f"\n✓ Response serializable to JSON")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    success = test_meeting_creation()
    sys.exit(0 if success else 1)
