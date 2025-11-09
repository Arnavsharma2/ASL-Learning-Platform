# Vercel Deployment Setup

## Issue: Frontend Not Showing on Vercel

If your frontend isn't showing up on Vercel, it's because Vercel needs to know where your Next.js app is located.

## Solution: Set Root Directory

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Click **Settings** → **General**
3. Scroll to **Root Directory**
4. Click **Edit**
5. Enter: `frontend`
6. Click **Save**
7. Go to **Deployments** and trigger a new deployment

### Option 2: Via vercel.json (Already Created)

I've created a `vercel.json` file in the root that tells Vercel:
- Root Directory: `frontend`
- Build Command: `cd frontend && npm install && npm run build`
- Framework: Next.js

**After pushing this file, Vercel should auto-detect it.**

### Option 3: When Creating New Project

If creating a new project:
1. Import repository
2. In **Configure Project**:
   - **Root Directory:** Set to `frontend`
   - **Framework Preset:** Next.js (auto-detected)
3. Add environment variables
4. Deploy

## Environment Variables Needed

Add these in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://learnasl.onrender.com
```

## Verify It's Working

After deployment:
1. Check build logs - should show Next.js build
2. Visit your Vercel URL
3. Should see your app, not a 404

## Troubleshooting

**Still not working?**
1. Delete the Vercel project
2. Re-import with Root Directory set to `frontend` from the start
3. Or use the `vercel.json` I created (push it first)

**Build errors?**
- Check that `package.json` exists in `frontend/`
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

