# Troubleshooting Guide

## Common Issues and Solutions

### CORS Error: "No 'Access-Control-Allow-Origin' header"

**Symptoms:**
- Dashboard shows "Failed to connect to backend API"
- Browser console shows CORS errors
- Frontend can't fetch data from backend

**Solution:**
The backend must be started with `--host 0.0.0.0` instead of `--host 127.0.0.1`

```bash
# ❌ Wrong - may cause CORS issues
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# ✅ Correct - allows CORS properly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Quick Fix:**
```bash
# Stop backend
kill $(lsof -ti:8000)

# Restart with correct host
cd backend
./run.sh
# OR
./venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Verify it's working:**
```bash
# Check CORS headers
curl -v -H "Origin: http://localhost:3000" http://localhost:8000/api/lessons/ 2>&1 | grep access-control

# Should see:
# access-control-allow-origin: http://localhost:3000
# access-control-allow-credentials: true
```

---

### Backend Not Responding

**Symptoms:**
- `curl http://localhost:8000/health` fails
- Frontend can't connect
- No process on port 8000

**Solution:**
```bash
# Check if backend is running
lsof -i :8000

# If nothing, start it
cd backend
./run.sh
```

---

### Dashboard Shows "No data yet"

**Possible Causes:**

1. **Not logged in**: You must be signed in to see data
2. **No practice sessions**: Visit the Practice page and wave your hand
3. **Backend not recording**: Check browser console for errors

**Solution:**
```bash
# 1. Make sure you're logged in
# 2. Visit /practice page
# 3. Start camera and wave hand
# 4. Check session counter increments
# 5. Go back to dashboard
```

---

### Google OAuth Not Working

**Error:** "Provider is not enabled" or "Unsupported provider"

**Solution:**
Follow the complete setup guide in [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)

Quick checklist:
- [ ] Created Google OAuth credentials
- [ ] Added redirect URI to Google Cloud Console
- [ ] Enabled Google provider in Supabase
- [ ] Added Client ID and Secret to Supabase

---

### Frontend Not Starting

**Error:** Port 3000 already in use

**Solution:**
```bash
# Kill process on port 3000
kill $(lsof -ti:3000)

# Restart frontend
cd frontend
npm run dev
```

---

### Database Connection Failed

**Symptoms:**
- Backend shows "database": "not_configured"
- API returns 500 errors
- No lessons loading

**Solution:**

1. **Check environment variables:**
```bash
# backend/.env should have:
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:pass@host/db
```

2. **Verify Supabase schema:**
   - Open Supabase SQL Editor
   - Run `backend/database/schema.sql`
   - Check tables exist: `lessons`, `user_progress`, `practice_sessions`

3. **Restart backend:**
```bash
cd backend
./run.sh
```

---

### Module Import Errors

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
cd backend
python -m pip install -r requirements.txt
```

---

### TypeScript Errors in Frontend

**Error:** Type errors when running `npm run dev`

**Solution:**
```bash
cd frontend
npm install
npm run dev
```

If errors persist:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### Hand Tracking Not Working

**Symptoms:**
- Camera starts but no hand detection
- No green lines/red dots
- "No hands detected" message persists

**Solutions:**

1. **Check lighting**: Ensure good lighting on your hands
2. **Clear background**: Use plain background behind hand
3. **Hand position**: Keep hand in center of frame
4. **Browser compatibility**: Use Chrome/Edge (best MediaPipe support)
5. **Camera permissions**: Allow camera access

**Browser Console Check:**
```javascript
// Should see no errors related to MediaPipe
// If you see errors, try refreshing the page
```

---

### Session Not Recording

**Symptoms:**
- Hand detected but "Sessions recorded: 0"
- Dashboard has no data

**Check:**

1. **Are you logged in?**
   - Sessions only record for authenticated users
   - Sign in first, then practice

2. **Is backend running?**
   ```bash
   curl http://localhost:8000/health
   ```

3. **Check browser console:**
   - Look for API errors
   - Network tab should show POST to `/api/progress/session`

---

## Development Tips

### Restart Everything

When in doubt, restart all services:

```bash
# Stop all
kill $(lsof -ti:8000)  # Backend
kill $(lsof -ti:3000)  # Frontend

# Wait a moment
sleep 2

# Start backend
cd backend
./run.sh &

# Start frontend (new terminal)
cd frontend
npm run dev
```

### Check Logs

**Backend logs:**
```bash
# If running with run.sh, check terminal output
# Or check the process logs
tail -f /tmp/backend.log  # if redirected to file
```

**Frontend logs:**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

### Clear Everything

Nuclear option - clear all caches:

```bash
# Frontend
cd frontend
rm -rf .next node_modules package-lock.json
npm install
npm run dev

# Backend (if using venv)
cd backend
rm -rf venv
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

---

## Getting Help

If you're still stuck:

1. **Check browser console** for detailed error messages
2. **Check backend terminal** for server-side errors
3. **Verify environment variables** in `.env` files
4. **Test endpoints directly** with curl
5. **Review the documentation**:
   - [PHASE3_COMPLETE.md](PHASE3_COMPLETE.md) - Feature overview
   - [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) - OAuth setup
   - [QUICKSTART.md](QUICKSTART.md) - Quick start guide

## Quick Health Check

Run this to verify everything is configured:

```bash
# Backend health
curl http://localhost:8000/health

# Expected output:
# {
#   "status": "healthy",
#   "database": "connected",
#   "supabase": "connected",
#   "routes_available": true
# }

# Frontend (visit in browser):
# http://localhost:3000 - Should load without errors

# CORS test:
curl -H "Origin: http://localhost:3000" http://localhost:8000/api/lessons/
# Should return JSON without CORS errors
```
