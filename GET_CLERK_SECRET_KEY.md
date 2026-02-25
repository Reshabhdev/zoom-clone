# Quick Setup: Get Your Clerk Secret Key

## Step 1: Open Clerk Dashboard
Go to: https://dashboard.clerk.com/

## Step 2: Navigate to API Keys
- Click on **"API Keys"** in the left sidebar
- Or go to **Settings → API Keys**

## Step 3: Find Your Secret Key
You'll see a section called **"Secret Keys"** or **"Credentials"**
- Look for a key starting with: `sk_test_` (for testing) or `sk_live_` (for production)
- Copy the entire key

## Step 4: Update Backend Environment
Edit: `backend/.env`

Replace:
```
CLERK_SECRET_KEY=sk_test_your_secret_key_here
```

With your actual key:
```
CLERK_SECRET_KEY=sk_test_YOUR_COPIED_KEY_HERE
```

## Step 5: Restart Backend
```bash
# Kill existing process
pkill -9 -f uvicorn

# Start fresh
cd backend
uvicorn app.main:app --reload
```

## Step 6: Test
Click "New Meeting" in the frontend - it should work now!

---

**Current Status:**
- ✅ Frontend has valid Clerk key
- ✅ Backend domain is configured
- ⏳ **Waiting for**: Your Clerk Secret Key to be added to `backend/.env`
