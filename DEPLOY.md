# 🚀 Deployment Guide - ASL Learning Platform

Deploy your ASL Learning Platform for **FREE** using:
- **Frontend**: Vercel (Free tier)
- **Backend**: Render (Free tier)
- **Database**: Supabase (Free tier)

---

## Prerequisites

1. GitHub account
2. [Vercel account](https://vercel.com/signup) (free)
3. [Render account](https://dashboard.render.com/register) (free)
4. [Supabase account](https://supabase.com) (free)

---

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Fill in:
   - **Name**: `asl-learning-platform`
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
4. Wait 2-3 minutes for project creation

### 1.2 Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `backend/database/schema.sql`
3. Paste into SQL Editor and click **Run**

### 1.2.1 Run Database Migrations (If Already Deployed)

If you already ran the schema earlier and need to update it, run these migrations in order:

**Migration 1: Fix is_correct constraint**
1. In Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `backend/database/migration_fix_is_correct.sql`
3. Paste into SQL Editor and click **Run**

**Migration 2: Fix RLS policies** (REQUIRED for backend to work)
1. In Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `backend/database/migration_fix_rls_policies.sql`
3. Paste into SQL Editor and click **Run**
4. This allows the backend API to insert data (backend uses PostgreSQL connection, not Supabase auth)

### 1.3 Get Your Credentials

Go to **Settings** → **API** and copy:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Go to **Settings** → **Database** and copy:
  - **Connection String** (URI format): `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

---

## Step 2: Deploy Backend to Render

### 2.1 Push Code to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2.2 Create Web Service on Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:

```
Name: asl-backend
Region: (choose closest)
Branch: main
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 2.3 Add Environment Variables

In Render dashboard, add these environment variables:

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FRONTEND_URL=https://your-frontend.vercel.app
ENVIRONMENT=production
```

**Important**:
- Replace `[YOUR-PASSWORD]` in DATABASE_URL with your actual Supabase password
- You'll update `FRONTEND_URL` after deploying frontend (Step 3)

### 2.4 Deploy

1. Click **Create Web Service**
2. Wait 3-5 minutes for deployment
3. Your backend will be live at: `https://asl-backend.onrender.com`
4. Test it: Visit `https://asl-backend.onrender.com/health`

**Note**: Free tier spins down after 15 minutes of inactivity. First request after spin-down takes ~30 seconds.

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure:

```
Framework Preset: Next.js (auto-detected)
Root Directory: frontend
Build Command: npm run build (default)
Output Directory: .next (default)
Install Command: npm install (default)
```

### 3.2 Add Environment Variables

In Vercel dashboard → **Settings** → **Environment Variables**, add:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://asl-backend.onrender.com
```

### 3.3 Deploy

1. Click **Deploy**
2. Wait 2-3 minutes
3. Your frontend will be live at: `https://your-project.vercel.app`

### 3.4 Update Backend FRONTEND_URL

1. Go back to Render dashboard
2. Edit environment variable `FRONTEND_URL` to your Vercel URL
3. Click **Save Changes** (this will redeploy backend)

---

## Step 4: Configure Google OAuth (Optional)

If you want Google Sign-In:

### 4.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure:
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `https://xxxxx.supabase.co/auth/v1/callback`

### 4.2 Enable in Supabase

1. Go to Supabase dashboard → **Authentication** → **Providers**
2. Enable **Google**
3. Add your Google **Client ID** and **Client Secret**
4. Save

---

## Step 5: Verify Deployment

### 5.1 Test Backend

Visit: `https://asl-backend.onrender.com/docs`
- You should see FastAPI Swagger documentation

### 5.2 Test Frontend

Visit: `https://your-project.vercel.app`
- Landing page should load
- Try signing up with email
- Try practicing ASL signs

### 5.3 Test Integration

1. Sign up on frontend
2. Go to practice page
3. Allow camera access
4. Practice a sign
5. Check if progress is saved in dashboard

---

## Troubleshooting

### Backend Issues

**Problem**: "Module not found"
- **Solution**: Check Root Directory is set to `backend` in Render

**Problem**: "Database connection failed"
- **Solution**: Verify DATABASE_URL is correct and password doesn't have special characters that need escaping

**Problem**: Backend is slow to respond
- **Solution**: This is normal on free tier after spin-down. Consider using [UptimeRobot](https://uptimerobot.com) to ping every 5 minutes

### Frontend Issues

**Problem**: "Failed to fetch API"
- **Solution**: Check NEXT_PUBLIC_API_URL matches your Render backend URL

**Problem**: "Authentication failed"
- **Solution**: Verify Supabase credentials are correct in environment variables

**Problem**: CORS errors
- **Solution**: Ensure FRONTEND_URL in backend matches your Vercel URL exactly

### Database Issues

**Problem**: "relation does not exist"
- **Solution**: Run the schema.sql file in Supabase SQL Editor

**Problem**: "Connection timeout"
- **Solution**: Check if Supabase allows external connections (should be enabled by default)

---

## Free Tier Limits

### Vercel (Frontend)
- 100GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS
- **No credit card required**

### Render (Backend)
- 750 hours/month (enough for 24/7)
- Spins down after 15 minutes inactivity
- 512MB RAM
- **No credit card required**

### Supabase (Database)
- 500MB database space
- 2GB bandwidth/month
- 50,000 monthly active users
- **No credit card required**

---

## Updating Your Deployment

### Frontend Updates

```bash
git add .
git commit -m "Update frontend"
git push origin main
```
Vercel auto-deploys on push to main branch.

### Backend Updates

```bash
git add .
git commit -m "Update backend"
git push origin main
```
Render auto-deploys on push to main branch.

### Database Updates

1. Update `backend/database/schema.sql`
2. Run the new SQL in Supabase SQL Editor
3. Update models in `backend/database/models.py` if needed
4. Commit and push

---

## Optional: Keep Backend Awake

Free tier backends spin down after 15 minutes of inactivity. To prevent this:

1. Sign up at [UptimeRobot](https://uptimerobot.com) (free)
2. Add a new monitor:
   - Type: HTTP(s)
   - URL: `https://asl-backend.onrender.com/health`
   - Interval: Every 5 minutes
3. This keeps your backend active 24/7

---

## Custom Domain (Optional)

### Frontend (Vercel)
1. Go to Vercel dashboard → **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

### Backend (Render)
Free tier doesn't support custom domains. Upgrade to paid plan if needed.

---

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs

---

## Deployment Checklist

- [ ] Supabase project created
- [ ] Database schema applied
- [ ] Backend deployed to Render
- [ ] Backend environment variables set
- [ ] Backend health check working
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables set
- [ ] Frontend can access backend API
- [ ] Authentication working
- [ ] Camera access working
- [ ] Progress tracking working
- [ ] (Optional) Google OAuth configured
- [ ] (Optional) Custom domain configured
- [ ] (Optional) UptimeRobot monitoring setup

---

**Congratulations!** Your ASL Learning Platform is now live and accessible worldwide for free!
