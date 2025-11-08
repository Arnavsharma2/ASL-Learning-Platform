# ASL Learning Platform

An interactive American Sign Language (ASL) learning platform with real-time sign detection using machine learning.

## Tech Stack

**Frontend:**
- Next.js 14 (React with TypeScript)
- TailwindCSS + Shadcn/ui
- TensorFlow.js + MediaPipe
- Supabase (Auth)

**Backend:**
- Python FastAPI
- PostgreSQL (via Supabase)
- SQLAlchemy
- PyTorch (for custom model training - Phase 6)

**Deployment:**
- Frontend: Vercel
- Backend: Railway/Render
- Database: Supabase

## Project Structure

```
.
├── frontend/              # Next.js application
│   ├── app/              # Next.js 14 app router
│   ├── components/       # React components
│   ├── lib/              # Utilities and API clients
│   └── public/           # Static assets
│
├── backend/              # FastAPI application
│   ├── routes/           # API endpoints
│   ├── database/         # Models and DB connection
│   ├── services/         # Business logic
│   ├── training/         # ML model training (Phase 6)
│   └── tests/            # API tests
│
└── docker-compose.yml    # Local development setup
```

## Phase 1 Setup (Completed ✓)

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker and Docker Compose (for local development)
- Supabase account (free tier)

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `backend/database/schema.sql`
3. Get your project URL and anon key from Settings > API

### 3. Configure Environment Variables

**Frontend** (`frontend/.env.local`):
```bash
cp frontend/.env.local.example frontend/.env.local
# Edit and add your Supabase credentials
```

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Edit and add your Supabase credentials
```

### 4. Run with Docker Compose (Recommended for local development)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**OR** run services separately:

```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## API Endpoints

### Lessons
- `GET /api/lessons/` - Get all lessons
- `GET /api/lessons/{id}` - Get lesson by ID
- `GET /api/lessons/category/{category}` - Get lessons by category
- `POST /api/lessons/` - Create new lesson

### Progress
- `GET /api/progress/user/{user_id}` - Get user progress
- `POST /api/progress/` - Create/update progress
- `POST /api/progress/session` - Record practice session
- `GET /api/progress/sessions/{user_id}` - Get user sessions
- `GET /api/progress/stats/{user_id}` - Get user statistics

## Development Workflow

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests (when added)
cd frontend
npm test
```

### Database Migrations

When modifying the schema:
1. Update `backend/database/schema.sql`
2. Run in Supabase SQL Editor
3. Update SQLAlchemy models in `backend/database/models.py`

## Project Status

- ✅ **Phase 1: Foundation** - Complete ([details](PHASE1_COMPLETE.md))
  - Next.js 14 + FastAPI setup
  - Database schema and API endpoints
  - Development environment

- ✅ **Phase 2: ML Integration** - Complete ([details](PHASE2_COMPLETE.md))
  - MediaPipe Hands integration
  - Real-time hand tracking
  - Camera feed component
  - UI pages (Landing, Practice, Lessons)

- ✅ **Phase 3: Core Features** - Complete ([details](PHASE3_COMPLETE.md))
  - Authentication (Email/Password + Google OAuth)
  - Progress tracking system
  - User dashboard with statistics
  - Session history and analytics

## Next Steps: Phase 4 or Phase 6

**Option 1: Phase 4 - UI/UX Polish**
- Improve landing page design
- Add animations and transitions
- Enhanced mobile responsiveness
- Accessibility improvements

**Option 2: Phase 6 - Custom ML Model (Recommended)**
- Collect ASL gesture dataset
- Train PyTorch model
- Convert to TensorFlow.js
- Implement real sign recognition

See [plan.md](plan.md) for the complete project roadmap.

## Additional Documentation

- [QUICKSTART.md](QUICKSTART.md) - Fast setup guide
- [RUN_WITHOUT_SUPABASE.md](RUN_WITHOUT_SUPABASE.md) - Local-only development
- [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) - OAuth configuration guide

## Project Goal

This is a portfolio project demonstrating:
- Full-stack development (Next.js + FastAPI)
- Real-time ML inference in the browser
- Modern authentication and database design
- Clean API architecture
- Testing and deployment practices

## License

MIT
