# ASL Learning Platform

An interactive American Sign Language (ASL) learning platform with real-time sign detection using machine learning and computer vision.

## Features

- Real-time hand tracking using MediaPipe
- Interactive ASL alphabet practice
- Progress tracking and statistics
- User authentication (Email + Google OAuth)
- Responsive design for mobile and desktop
- Custom ML model for sign recognition

## Tech Stack

### Frontend
- Next.js 16 (React with TypeScript)
- TailwindCSS + Shadcn/ui
- TensorFlow.js + MediaPipe Hands
- Supabase Authentication
- Framer Motion animations

### Backend
- Python FastAPI
- PostgreSQL (Supabase)
- SQLAlchemy ORM
- PyTorch (for model training)

## Project Structure

```
.
├── frontend/              # Next.js application
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and API clients
│   └── public/           # Static assets & ML models
│
└── backend/              # FastAPI application
    ├── routes/           # API endpoints
    ├── database/         # Models and DB schema
    ├── services/         # Business logic
    └── training/         # ML model training pipeline
```

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account (free)

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
pip install -r requirements.txt
```

### 2. Set Up Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run `backend/database/schema.sql` in SQL Editor
3. Get your credentials from Settings → API

### 3. Configure Environment Variables

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** (`.env`):
```bash
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_anon_key
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

### 4. Run Development Servers

```bash
# Terminal 1: Backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Deployment

Deploy this project for **FREE** using:
- **Frontend**: Vercel (free tier)
- **Backend**: Render (free tier)
- **Database**: Supabase (free tier)

**See [DEPLOY.md](DEPLOY.md) for complete deployment instructions.**

## API Endpoints

### Lessons
- `GET /api/lessons/` - Get all lessons
- `GET /api/lessons/{id}` - Get specific lesson
- `GET /api/lessons/category/{category}` - Filter by category

### Progress
- `GET /api/progress/user/{user_id}` - User progress
- `POST /api/progress/` - Update progress
- `POST /api/progress/session` - Record practice session
- `GET /api/progress/stats/{user_id}` - User statistics

### Health
- `GET /health` - API health check

API documentation available at `/docs` when running backend.

## Training Custom ML Model

The platform includes a data collection tool and training pipeline:

1. Visit `/collect` page to gather training samples
2. Train model using scripts in `backend/training/`
3. Export to TensorFlow.js format
4. Deploy model to `frontend/public/models/`

See [backend/training/README.md](backend/training/README.md) for details.

## Development

### Running Tests

```bash
# Backend
cd backend
pytest

# Frontend (when tests added)
cd frontend
npm test
```

### Database Migrations

1. Update `backend/database/schema.sql`
2. Run updated SQL in Supabase SQL Editor
3. Update `backend/database/models.py` accordingly

## Features Completed

- [x] Full-stack setup (Next.js + FastAPI)
- [x] Database schema and API
- [x] MediaPipe hand tracking integration
- [x] Real-time camera feed with landmark detection
- [x] User authentication (Email + Google OAuth)
- [x] Progress tracking system
- [x] User dashboard with statistics
- [x] Responsive UI with animations
- [x] Data collection tool for ML training
- [x] PyTorch model training pipeline

## Project Goals

This portfolio project demonstrates:
- Modern full-stack development
- Real-time ML inference in browser
- Clean API architecture
- Authentication and authorization
- Database design and ORM usage
- Deployment to production

## License

MIT

## Author

Created as a portfolio project showcasing full-stack development with machine learning integration.
