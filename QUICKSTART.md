# Quick Start Guide

## Setup Complete! ✅

Your ASL Learning Platform is ready to configure and run.

## Next Steps

### 1. Create Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - Project name: `asl-learning` (or any name)
   - Database password: (save this!)
   - Region: Choose closest to you
4. Wait for project to initialize (~2 minutes)

### 2. Set Up Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the entire contents of `backend/database/schema.sql`
4. Paste into the SQL Editor
5. Click "Run" or press Cmd+Enter
6. You should see: "Success. No rows returned"

### 3. Get Your Supabase Credentials

1. In Supabase, go to **Settings > API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### 4. Configure Environment Variables

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** (`backend/.env`):
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:your_db_password@db.xxxxx.supabase.co:5432/postgres
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

> **Note:** Get your `DATABASE_URL` from Supabase Settings > Database > Connection String (URI)

### 5. Start Development Servers

**Option A: Docker Compose (Recommended)**
```bash
docker-compose up
```

**Option B: Run Separately**

Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### 6. Verify It's Working

Open your browser and check:

- ✅ Frontend: http://localhost:3000
- ✅ Backend API: http://localhost:8000
- ✅ API Docs: http://localhost:8000/docs (interactive Swagger UI)
- ✅ Health Check: http://localhost:8000/health

You should see:
- Frontend: Next.js default page (we'll build the UI in Phase 2)
- Backend: JSON response with `{"message": "ASL Learning API", "status": "healthy"}`

### 7. Test the API

Try this in the API docs (http://localhost:8000/docs):

1. Expand `GET /api/lessons/`
2. Click "Try it out"
3. Click "Execute"
4. You should see 10 sample lessons returned!

## Common Issues

### Backend won't start: "Database not configured"
- Make sure you created `backend/.env` with your Supabase credentials
- Verify `DATABASE_URL` is correct

### Frontend can't connect to backend
- Make sure backend is running on port 8000
- Check CORS settings in `backend/main.py`

### "No such table" errors
- Run the SQL schema in Supabase SQL Editor
- Verify schema was created successfully

## What's Installed

✅ Frontend (Next.js 14):
- TypeScript
- TailwindCSS
- Shadcn/ui
- Supabase client
- API client

✅ Backend (FastAPI):
- All Python dependencies
- Database models
- API routes
- Authentication setup

## Next: Phase 2 - ML Integration

Once everything is running, you're ready to add:
- MediaPipe Hands integration
- Camera feed component
- Real-time gesture detection
- Hand tracking visualization

See [plan.md](plan.md) for the full Phase 2 roadmap.

---

**Need help?** Check the main [README.md](README.md) for detailed documentation.
