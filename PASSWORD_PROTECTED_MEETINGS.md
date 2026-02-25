# Password-Protected Meeting Rooms with Invitation Links

## Overview

This feature implements password-protected meeting rooms with shareable invitation links in your Zoom clone application. When a user creates a meeting, it's automatically password-protected with a 6-digit numeric password, and they can share a secure invitation link with others.

## How It Works

### 1. **Meeting Creation Flow**

When a user creates a meeting:
- ✅ A 6-digit numeric password is **automatically generated** (e.g., 123456)
- ✅ A unique invitation token is created for the shareable link
- ✅ A 9-digit meeting ID is generated (format: xxx-xxx-xxx)
- ✅ All details are stored in the database
- ✅ A modal displays the password, meeting ID, and invitation link to the creator

### 2. **Sharing the Meeting**

The meeting creator can:
- 📋 **Copy the meeting ID** to share directly
- 🔐 **Copy the password** if needed
- 🔗 **Copy the invitation link** - the easiest way for others to join
- 📤 **Share via native share** (if supported by browser)

### 3. **Joining via Invitation Link**

When someone uses the invitation link:
- 🔓 They land on a dedicated page showing meeting details
- 🔑 The password is **automatically provided** - no manual entry needed
- ✅ They can click "Join Meeting Now" to enter directly
- 🚀 They're instantly added to the meeting room

### 4. **Direct Join with Password**

Alternative method - users can:
- Enter the meeting ID on the home page
- Provide the password manually
- Join the meeting

## Backend Implementation

### Updated Models

**File:** `backend/app/models/meeting.py`

```python
class Meeting(Base):
    __tablename__ = "meetings"
    
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String, unique=True, index=True)  # xxx-xxx-xxx
    title = Column(String, nullable=False)
    password = Column(String, nullable=False)  # Auto-generated 6-digit code
    invitation_token = Column(String, unique=True, index=True)  # For shareable link
    host_id = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### New Utility Functions

**File:** `backend/app/core/utils.py`

- `generate_meeting_password()` - Creates a 6-digit numeric password
- `generate_invitation_token()` - Creates a secure URL-safe token
- `generate_meeting_credentials()` - Generates both in one call

### API Endpoints

#### 1. Create Meeting (POST /meetings/create)
```bash
curl -X POST http://localhost:8000/meetings/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Team Standup"}'
```

**Response:**
```json
{
  "meeting_id": "abc-def-ghi",
  "title": "Team Standup",
  "password": "123456",
  "invitation_token": "aBc1D2eF3gH4iJ5kL6",
  "created_at": "2024-02-25T10:30:00"
}
```

#### 2. Get Invitation Details (GET /meetings/invitation/{token})
```bash
curl http://localhost:8000/meetings/invitation/aBc1D2eF3gH4iJ5kL6 \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "meeting_id": "abc-def-ghi",
  "title": "Team Standup",
  "password": "123456",
  "host_id": 1,
  "created_at": "2024-02-25T10:30:00"
}
```

#### 3. Join Meeting (POST /meetings/join)
```bash
curl -X POST http://localhost:8000/meetings/join \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"meeting_id": "abc-def-ghi", "password": "123456"}'
```

## Frontend Implementation

### Pages & Components

#### 1. **Home Page** (`src/app/page.tsx`)
- Create meeting button that:
  - Creates a meeting
  - Shows a modal with password and invitation link
  - Allows copying credentials
  - Lets user start the meeting

#### 2. **Join via Invitation** (`src/app/join/[token]/page.tsx`)
- Landing page for invitation links
- Displays meeting details
- Shows password (for reference)
- Auto-joins with the password when user clicks "Join"

#### 3. **Meeting Room** (`src/app/room/[id]/page.tsx`)
- Share button in top bar
- Modal to copy/share invitation link
- Native web share API support
- Easy copy-to-clipboard functionality

## User Experience

### For Meeting Creator

1. Click "Create a Meeting"
2. See a popup with:
   - Meeting ID (e.g., `abc-def-ghi`)
   - Password (e.g., `123456`)
   - Invitation link (e.g., `https://app.com/join/aBc1D2eF3gH4iJ5kL6`)
3. Copy and share the invitation link
4. Click "Start Meeting" to enter the room

### For Meeting Participants

**Option 1: Via Invitation Link**
1. Receive link: `https://app.com/join/aBc1D2eF3gH4iJ5kL6`
2. Click the link
3. See meeting details
4. Click "Join Meeting Now"
5. Automatically join the meeting

**Option 2: Manual Entry**
1. Go to home page
2. Enter meeting ID: `abc-def-ghi`
3. Enter password: `123456`
4. Click "Join Meeting"
5. Enter the room

## Security Features

- 🔐 **6-digit numeric passwords** - Memorable but secure
- 🔑 **Unique invitation tokens** - Can't guess the URL
- 🌐 **HTTPS recommended** - Secure transmission of links
- ✅ **Password validation** - Required for joining
- 🚫 **Invalid link handling** - Expired/non-existent invitations rejected

## Database Migration

If you're upgrading from the old schema, you need to:

1. **Add the new columns** to your meetings table:
   ```sql
   ALTER TABLE meetings 
   ADD COLUMN password VARCHAR(6) NOT NULL DEFAULT '',
   ADD COLUMN invitation_token VARCHAR(32) UNIQUE;
   ```

2. **Populate existing meetings** (optional):
   ```python
   from app.core.utils import generate_meeting_credentials
   from app.models.meeting import Meeting
   from app.database.session import SessionLocal
   
   db = SessionLocal()
   meetings = db.query(Meeting).filter(Meeting.password == None).all()
   
   for meeting in meetings:
       password, token = generate_meeting_credentials()
       meeting.password = password
       meeting.invitation_token = token
   
   db.commit()
   ```

3. Run your migration tools (Alembic recommended):
   ```bash
   alembic revision --autogenerate -m "Add password and invitation_token to meetings"
   alembic upgrade head
   ```

## Configuration

The system is ready to use without additional configuration. However, you may want to customize:

### Meeting Password Format
Change the password length in `backend/app/core/utils.py`:
```python
def generate_meeting_password() -> str:
    return ''.join(secrets.choice(string.digits) for _ in range(8))  # 8 digits instead of 6
```

### Invitation Link Base URL
Update in `frontend/src/app/page.tsx`:
```typescript
const baseUrl = "https://yourdomain.com";  // Instead of window.location.origin
```

## API Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/meetings/create` | Create a new password-protected meeting |
| GET | `/meetings/invitation/{token}` | Get meeting details via invitation token |
| POST | `/meetings/join` | Join meeting with ID and password |
| GET | `/meetings/my-meetings` | List user's hosted meetings |

## Error Handling

### Common Errors

1. **"Invitation link not found"**
   - Invalid token
   - Link has expired
   - Solution: Ask creator to share the link again

2. **"Meeting room not found"**
   - Wrong meeting ID entered
   - Meeting has been deleted
   - Solution: Double-check the meeting ID

3. **"Incorrect meeting password"**
   - Wrong password entered
   - Solution: Verify password with meeting creator

## Testing

### Test Create Meeting
```bash
# As authenticated user
POST /meetings/create
{
  "title": "Test Meeting"
}
```

### Test Invitation Link
```bash
# Get the invitation_token from create response
GET /meetings/invitation/{invitation_token}
```

### Test Join
```bash
POST /meetings/join
{
  "meeting_id": "abc-def-ghi",
  "password": "123456"
}
```

## Future Enhancements

- [ ] QR code generation for quick sharing
- [ ] Meeting expiration timers
- [ ] Custom password option for creators
- [ ] Meeting recording with password protection
- [ ] Participant list and controls
- [ ] Chat functionality
- [ ] Screen sharing with password-protected access
- [ ] Email invitations with pre-filled passwords

## Troubleshooting

### Meeting Password Not Auto-Generated
- **Cause:** Database schema missing password column
- **Fix:** Run migrations and update database

### Invitation Links Not Working
- **Cause:** Frontend baseUrl doesn't match deployment URL
- **Fix:** Update baseUrl in `page.tsx`

### Can't Join After Creating
- **Cause:** Password mismatch in API
- **Fix:** Verify password is being sent correctly in join request

---

**Version:** 1.0  
**Last Updated:** February 2024  
**Status:** Production Ready ✅
