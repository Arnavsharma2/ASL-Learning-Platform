# Vercel Setup - Final Instructions

## The Problem
Vercel needs to know your Next.js app is in the `frontend/` subdirectory.

## The Solution: Set Root Directory in Vercel Dashboard

**This is the ONLY step you need:**

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Click **Settings** (gear icon)
4. Click **General** tab
5. Scroll down to **Root Directory**
6. Click **Edit** button
7. Enter: `frontend`
8. Click **Save**

## After Setting Root Directory

Vercel will:
- ✅ Automatically detect Next.js
- ✅ Find `package.json` in `frontend/`
- ✅ Use correct build commands
- ✅ Deploy successfully

## No vercel.json Needed

I've removed `vercel.json` because:
- Vercel auto-detects Next.js when Root Directory is set correctly
- The config file was causing conflicts
- Root Directory setting is all you need

## Environment Variables

Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://learnasl.onrender.com
```

## Redeploy

After setting Root Directory:
1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on latest deployment
3. Click **Redeploy**

Or just push a new commit - it will auto-deploy with correct settings.

---

**That's it!** Once Root Directory is set to `frontend`, everything should work automatically.

