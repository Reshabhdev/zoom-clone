# Quick Setup & Testing Guide

## Prerequisites Checklist

- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] Virtual environment activated (Python)
- [ ] All dependencies installed
- [ ] Database set up and running
- [ ] Clerk authentication configured

## Setup Steps

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Ensure virtual environment is activated
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows

# Install any new dependencies (if needed)
pip install -r requirements.txt
```

### 2. Database Migration

Since the schema has changed, you need to update your database:

#### Option A: Using Alembic (Recommended)

```bash
# Create a new migration
alembic revision --autogenerate -m "Add password and invitation_token to meetings"

# Review the migration file that was created
# Then apply it
alembic upgrade head
```

#### Option B: Manual SQL (SQLite)

```sql
-- If using SQLite
ALTER TABLE meetings 
ADD COLUMN password VARCHAR(6) NOT NULL DEFAULT 'TEMP00';

ALTER TABLE meetings 
ADD COLUMN invitation_token VARCHAR(32) UNIQUE;

-- Update existing meetings with generated values
UPDATE meetings SET password = '000000' WHERE password = 'TEMP00';

-- Then generate proper values using the Python script below
```

#### Option C: Manual SQL (PostgreSQL)

```sql
-- If using PostgreSQL
ALTER TABLE meetings 
ADD COLUMN password VARCHAR(6) NOT NULL DEFAULT 'TEMP00';

ALTER TABLE meetings 
ADD COLUMN invitation_token VARCHAR(32) UNIQUE;

UPDATE meetings SET password = '000000' WHERE password = 'TEMP00';
```

#### Option D: Python Script (Generate Missing Values)

```python
# Run this in your Python environment
from app.core.utils import generate_meeting_credentials
from app.models.meeting import Meeting
from app.database.session import SessionLocal

db = SessionLocal()
meetings = db.query(Meeting).filter(Meeting.password == None).all()

count = 0
for meeting in meetings:
    password, token = generate_meeting_credentials()
    meeting.password = password
    meeting.invitation_token = token
    count += 1

db.commit()
print(f"Updated {count} meetings with passwords and invitation tokens")
db.close()
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already done)
npm install

# Create .env.local if not present (copy from .env.example if available)
echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key" > .env.local
echo "CLERK_SECRET_KEY=your_clerk_secret" >> .env.local
```

### 4. Start the Application

#### Terminal 1: Backend

```bash
cd backend
source venv/bin/activate  # or use your activation script

# Start uvicorn
uvicorn app.main:app --reload

# You should see:
# INFO:     Uvicorn running on http://127.0.0.1:8000
# INFO:     Application startup complete
```

#### Terminal 2: Frontend

```bash
cd frontend

# Start Next.js dev server
npm run dev

# You should see:
# ▲ Next.js 15.x.x
#   Local:        http://localhost:3000
```

## Testing Guide

### Test 1: Create a Meeting

1. **Go to:** http://localhost:3000
2. **Login** with your Clerk account
3. **Click** "Create a Meeting"
4. **Verify:**
   - ✅ Modal appears with meeting details
   - ✅ Meeting ID is displayed (format: xxx-xxx-xxx)
   - ✅ Password is displayed (6 digits, e.g., 123456)
   - ✅ Invitation link is displayed
   - ✅ All copy buttons work

**Example Output:**
```
Meeting Created!

Meeting ID: abc-def-ghi [Copy]
Room Password: 123456 [Copy]
Invitation Link: http://localhost:3000/join/aBc1D2eF3gH4iJ5kL6 [Copy]

[Copy Invite Link] [Start Meeting]
```

### Test 2: Share and Join via Invitation Link

1. **From the modal:**
   - Click "Copy Invite Link"
   - Open new browser/incognito window
   - Paste URL in address bar

2. **Verify invitation page:**
   - ✅ Meeting title shows
   - ✅ Meeting ID shows
   - ✅ Password shows
   - ✅ "Join Meeting Now" button visible

3. **Click "Join Meeting Now":**
   - ✅ Redirects to /room/{meeting_id}
   - ✅ User is in the meeting room
   - ✅ Video feed displays

### Test 3: Manual Join with Password

1. **Go to:** http://localhost:3000
2. **Don't create new meeting, use existing one**
3. **In the join form:**
   - Enter Meeting ID: `abc-def-ghi`
   - Click "Join Meeting"
4. **Verify:**
   - ✅ You're redirected to the meeting room
   - ✅ Video feed displays
   - ✅ Share button is visible

### Test 4: Share Button in Meeting Room

1. **In meeting room:**
   - Click "Share" button (top right)
2. **Verify share modal:**
   - ✅ Invitation link displayed
   - ✅ Copy button works
   - ✅ Share via... button visible (if supported)
   - ✅ All buttons functional

### Test 5: Error Handling

#### Test Wrong Password
```
1. Go to home page
2. Enter: Meeting ID: abc-def-ghi
3. Enter: Wrong password (e.g., 000000)
4. Click Join
5. Verify: ❌ "Incorrect meeting password" error shows
```

#### Test Invalid Meeting ID
```
1. Go to home page
2. Enter: Meeting ID: xxx-xxx-xxx (non-existent)
3. Click Join
4. Verify: ❌ "Meeting room not found" error shows
```

#### Test Invalid Invitation Link
```
1. Go to: http://localhost:3000/join/invalid-token-12345
2. Verify: ❌ "Invitation link not found" error shows
```

### Test 6: API Testing with curl

#### Create Meeting
```bash
curl -X POST http://localhost:8000/meetings/create \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Meeting"}'

# Response:
# {
#   "meeting_id": "abc-def-ghi",
#   "title": "Test Meeting",
#   "password": "123456",
#   "invitation_token": "aBc1D2eF3gH4iJ5kL6",
#   "created_at": "2024-02-25T10:30:00"
# }
```

#### Get Invitation Details
```bash
curl http://localhost:8000/meetings/invitation/aBc1D2eF3gH4iJ5kL6 \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"

# Response:
# {
#   "meeting_id": "abc-def-ghi",
#   "title": "Test Meeting",
#   "password": "123456",
#   "host_id": 1,
#   "created_at": "2024-02-25T10:30:00"
# }
```

#### Join Meeting
```bash
curl -X POST http://localhost:8000/meetings/join \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"meeting_id": "abc-def-ghi", "password": "123456"}'

# Response:
# {
#   "status": "success",
#   "message": "Successfully joined Test Meeting",
#   "data": {
#     "room_id": "abc-def-ghi",
#     "title": "Test Meeting",
#     "joined_as": "user@example.com"
#   }
# }
```

## Common Issues & Solutions

### Issue 1: Database Column Not Found

**Error:** `sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) no such column: meetings.password`

**Solution:**
```bash
# Run migration
alembic upgrade head

# Or manually add columns
# See "Database Migration" section above
```

### Issue 2: Backend Not Starting

**Error:** `ModuleNotFoundError: No module named 'app.core.utils'`

**Solution:**
```bash
# Make sure utils.py exists in backend/app/core/
# Check file structure:
ls -la backend/app/core/

# Should show: utils.py among other files
```

### Issue 3: Frontend Can't Connect to Backend

**Error:** `Failed to join. Make sure the ID is correct and backend is running.`

**Solution:**
```bash
# Check backend is running on port 8000
curl http://localhost:8000/docs

# Check frontend API configuration
# File: frontend/src/lib/api.ts
# Should route to /api{endpoint}

# Check Next.js proxy is configured
# File: frontend/next.config.ts
```

### Issue 4: Invitation Link Not Found

**Error:** `Invitation link not found or expired`

**Solution:**
1. Verify invitation_token was generated
2. Check database has the token
3. Make sure you're using the correct token from the response

```bash
# Check in database
SELECT meeting_id, password, invitation_token FROM meetings LIMIT 1;
```

### Issue 5: Password Not Auto-Generated

**Error:** `Meeting created but password is NULL or empty`

**Solution:**
```bash
# Check utils.py is imported correctly in router
# File: backend/app/routers/meeting.py
# Should have: from ..core.utils import generate_meeting_credentials

# Test the function directly
python
>>> from app.core.utils import generate_meeting_password, generate_meeting_credentials
>>> generate_meeting_password()
'123456'
>>> generate_meeting_credentials()
('123456', 'aBc1D2eF3gH4iJ5kL6')
```

## Debugging Tips

### Enable Debug Logging

```python
# In backend/app/main.py
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# In routes
logger.debug(f"Creating meeting: {meeting_in}")
logger.debug(f"Generated password: {password}")
```

### Check Network Requests

1. Open browser DevTools (F12)
2. Go to Network tab
3. Create a meeting
4. Look for POST to `/api/meetings/create`
5. Check response tab for all details

### Database Query Testing

```python
# Test the DB directly
from app.database.session import SessionLocal
from app.models.meeting import Meeting

db = SessionLocal()
meetings = db.query(Meeting).all()
for m in meetings:
    print(f"ID: {m.meeting_id}, Password: {m.password}, Token: {m.invitation_token}")
db.close()
```

## Performance Testing

### Create Multiple Meetings
```bash
for i in {1..10}; do
  curl -X POST http://localhost:8000/meetings/create \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"title\": \"Meeting $i\"}"
done
```

### Load Testing (Optional)
```bash
# Using Apache Bench
ab -n 100 -c 10 http://localhost:3000/

# Or using wrk
wrk -t4 -c100 -d30s http://localhost:3000/
```

## Final Checklist

- [ ] Database migrations completed
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can create a meeting
- [ ] Meeting has password and invitation token
- [ ] Can copy meeting credentials
- [ ] Can join via invitation link
- [ ] Can join manually with ID + password
- [ ] Can share from meeting room
- [ ] Error handling works correctly
- [ ] No console errors in browser DevTools
- [ ] No errors in backend terminal
- [ ] All tests pass

## Next Steps

1. **Deploy to staging**
   - Test in production-like environment
   - Verify HTTPS works correctly
   - Test with real users

2. **Production deployment**
   - Update database with real connection string
   - Update frontend baseUrl
   - Set up proper logging
   - Configure backups

3. **Monitor**
   - Watch for errors in logs
   - Monitor database growth
   - Check invitation link usage
   - Gather user feedback

---

**Last Updated:** February 25, 2024
**Status:** Ready for Testing ✅
