# Fix Backend Connectivity Issue

## Problem
**Error:** "Failed to create meeting: Cannot reach backend at https://zoom-clone-jjia.onrender.com. Check CORS and network connection."

This error occurs when clicking "New Meeting" button. The issue is a CORS (Cross-Origin Resource Sharing) problem or the backend is not running/responding.

---

## Quick Fixes

### 1. Verify Backend is Running

**Check if Render Backend is Up:**
```bash
curl -X GET https://zoom-clone-jjia.onrender.com/
```

Expected response:
```json
{"status": "Backend running"}
```

If this fails:
- ❌ Backend is down or not deployed
- Go to [Render Dashboard](https://dashboard.render.com)
- Check zoom-clone-backend service status
- Restart if needed

### 2. Verify Environment Variables on Render

Go to **Render Dashboard → zoom-clone-backend → Environment**

Required variables:
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `CLERK_PUBLISHABLE_KEY` - From Clerk Dashboard
- ✅ `CLERK_SECRET_KEY` - From Clerk Dashboard

If any are missing:
1. Add the missing variable
2. Click "Save"
3. Render will auto-redeploy

### 3. Check CORS Configuration

Backend CORS is now properly configured to allow:
- ✅ `http://localhost:3000` (local development)
- ✅ `https://zoom-clone-nu-drab.vercel.app` (production frontend)
- ✅ `https://zoom-clone-*.vercel.app` (Vercel preview deployments)
- ✅ Credentials allowed
- ✅ All methods and headers

This was just fixed in the backend, so redeploy:
```bash
git push origin main
```

### 4. Verify Frontend Environment

Check **frontend/.env.local**:
```env
NEXT_PUBLIC_API_BASE_URL=https://zoom-clone-jjia.onrender.com
```

Should NOT have trailing slash.

---

## Complete Troubleshooting Checklist

### Backend Status
- [ ] Backend URL is accessible: `curl https://zoom-clone-jjia.onrender.com/`
- [ ] Database URL is set in Render environment variables
- [ ] Clerk keys are set in Render environment variables
- [ ] No red errors in Render logs

### Frontend Configuration
- [ ] `NEXT_PUBLIC_API_BASE_URL` is set correctly
- [ ] No trailing slash in API URL
- [ ] Frontend is deployed and running

### Database
- [ ] PostgreSQL database is running
- [ ] Database connection string is correct
- [ ] User table exists with correct schema

### Authentication (Clerk)
- [ ] Clerk account is active
- [ ] Clerk keys are valid
- [ ] Clerk API is accessible from backend

---

## Local Testing (Before Production Deploy)

If you want to test locally:

### 1. Start Backend Locally
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set local .env
cat > .env << EOF
DATABASE_URL=postgresql://localhost/zoom_clone
CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
EOF

python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend Locally
```bash
cd frontend
npm install
npm run dev
```

### 3. Test Meeting Creation
1. Open http://localhost:3000
2. Sign up/login
3. Click "New Meeting"
4. Should create meeting without CORS errors

### 4. Check Frontend Logs
In browser DevTools (F12):
- **Console tab** - Look for CORS or fetch errors
- **Network tab** - Check API requests to backend
  - Should see POST to `/meetings/create`
  - Should have status 200-201
  - Check response headers for CORS

---

## Common Issues & Solutions

### Issue: "Failed to fetch"
**Cause:** Backend is not running or unreachable

**Solutions:**
1. Check if backend is running: `curl https://zoom-clone-jjia.onrender.com/`
2. If production, check Render logs for errors
3. If local, ensure backend is started and listening

### Issue: "CORS error: No 'Access-Control-Allow-Origin' header"
**Cause:** CORS middleware not working

**Solutions:**
1. Check backend CORS config in `app/main.py` ✅ (Already fixed)
2. Restart backend
3. Clear browser cache (Ctrl+Shift+Delete)

### Issue: "Token is invalid"
**Cause:** Clerk authentication not working

**Solutions:**
1. Verify Clerk keys are correct
2. Check Clerk account is active
3. Verify token is being sent with requests
4. Check browser localStorage for token

### Issue: "Database connection failed"
**Cause:** DATABASE_URL is missing or wrong

**Solutions:**
1. Verify `DATABASE_URL` is set in `.env`
2. Test connection: `psql "$DATABASE_URL" -c "SELECT 1"`
3. Ensure database exists and user has permissions

---

## Production Deployment Steps

### Step 1: Update Backend Code
```bash
git add .
git commit -m "Fix CORS and authentication"
git push origin main
```

### Step 2: Render Auto-Deploy
Render will automatically:
1. Pull latest code from GitHub
2. Build Python environment
3. Install dependencies from `requirements.txt`
4. Run `uvicorn app.main:app`

### Step 3: Verify in Production
```bash
# Test backend is running
curl https://zoom-clone-jjia.onrender.com/

# Should respond with:
{"status": "Backend running"}
```

### Step 4: Test Meeting Creation
1. Go to https://zoom-clone-nu-drab.vercel.app
2. Login/Signup
3. Click "New Meeting"
4. Should create meeting without errors

---

## What Was Fixed

✅ **CORS Configuration** - Added proper origins including `vercel.app` wildcard
✅ **Clerk Authentication** - Restored Clerk-only auth instead of JWT
✅ **Database Models** - Updated User and Meeting models for Clerk
✅ **Environment Variables** - Updated to use Clerk keys
✅ **Authentication Endpoints** - Simplified to use Clerk verification
✅ **Meeting Router** - Removed password hashing, use plain text comparison

---

## Next Steps

1. **If Backend is Down:**
   - Check Render dashboard
   - Restart service if needed
   - Verify environment variables

2. **If CORS Still Fails:**
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R)
   - Check browser console for actual error

3. **If Clerk Auth Fails:**
   - Verify Clerk keys in Render
   - Test with `curl` and token

4. **Test Meeting Creation:**
   ```bash
   curl -X POST https://zoom-clone-jjia.onrender.com/meetings/create \
     -H "Authorization: Bearer <your_clerk_token>" \
     -H "Content-Type: application/json" \
     -d '{"title": "Test Meeting", "password": null}'
   ```

---

## Support Resources

- [Render Dashboard](https://dashboard.render.com)
- [Clerk Console](https://dashboard.clerk.com)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/)

---

**Status: ✅ All backend fixes applied. Ready for testing!**
