# Deploying Backend to Render

## Quick Setup Guide

### Step 1: Create Web Service on Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `Arnavsharma2/ASL-Learning-Platform`

### Step 2: Configure Settings

**Important Settings:**
- **Name:** `asl-backend` (or any name)
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** `backend` ⚠️ **This is crucial!
- **Runtime:** `Python 3` (NOT Docker)
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 3: Environment Variables

Add these in the Render dashboard:

```
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FRONTEND_URL=https://your-frontend.vercel.app
ENVIRONMENT=production
```

**Get DATABASE_URL from Supabase:**
- Supabase Dashboard → Settings → Database
- Connection String → URI format
- Replace `[YOUR-PASSWORD]` with your actual password

### Step 4: Deploy!

Click **"Create Web Service"** and Render will:
1. Clone your repo
2. Navigate to `backend/` directory
3. Install dependencies
4. Start your FastAPI app

---

## ⚠️ Common Issues

### Issue: "Dockerfile not found"

**Solution:** Make sure:
- Root Directory is set to `backend`
- Runtime is set to `Python 3` (NOT Docker)

### Issue: "Module not found"

**Solution:** Check that Root Directory is `backend` so it can find `main.py`

### Issue: "Port binding error"

**Solution:** Make sure Start Command uses `$PORT`:
```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Issue: "Database connection failed"

**Solution:** 
- Check `DATABASE_URL` format (should be PostgreSQL URI)
- Verify Supabase allows external connections
- Check password is correct

---

## Render Settings Summary

```
Name: asl-backend
Region: (your choice)
Branch: main
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## After Deployment

1. **Get your backend URL:** `https://asl-backend.onrender.com`
2. **Update frontend:** Set `NEXT_PUBLIC_API_URL` to your Render URL
3. **Test:** Visit `https://asl-backend.onrender.com/health`

---

## Free Tier Limits

- ✅ 750 hours/month (enough for 24/7)
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ First request after spin-down takes ~30 seconds (cold start)
- ✅ Free SSL certificate
- ✅ Automatic deployments from Git

---

## Pro Tips

1. **Keep it awake:** Use a service like [UptimeRobot](https://uptimerobot.com) (free) to ping your backend every 5 minutes
2. **Monitor logs:** Check Render dashboard for any errors
3. **Environment variables:** Double-check all are set correctly

---

## Troubleshooting

**Backend won't start:**
- Check logs in Render dashboard
- Verify Python version (should be 3.11+)
- Check all dependencies are in `requirements.txt`

**CORS errors:**
- Update `FRONTEND_URL` in environment variables
- Make sure it matches your actual frontend URL

**Database errors:**
- Verify `DATABASE_URL` is correct
- Check Supabase connection pooling settings
- Ensure database is accessible from Render IPs

