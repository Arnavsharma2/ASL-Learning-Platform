from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import routes (will show warnings if DB not configured, but won't crash)
try:
    from routes import lessons, progress
    routes_available = True
except Exception as e:
    print(f"Warning: Could not load routes: {e}")
    print("API will run in limited mode. Configure Supabase to enable all endpoints.")
    routes_available = False

# Import hand_detection separately (requires OpenCV/MediaPipe)
try:
    from routes import hand_detection
    hand_detection_available = True
    print("✅ Hand detection endpoint loaded successfully")
except Exception as e:
    print(f"⚠️  Hand detection route unavailable: {e}")
    print("💡 To enable server-side hand detection, install: pip install opencv-python-headless mediapipe")
    print("✅ Client-side modes (Balanced/Max Accuracy) will still work perfectly!")
    hand_detection_available = False

app = FastAPI(
    title="ASL Learning API",
    description="REST API for ASL sign language learning platform",
    version="1.0.0"
)

# CORS configuration for frontend
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
origins = [
    "http://localhost:3000",  # Next.js dev server
    "http://127.0.0.1:3000",
]

# Add production frontend URL if not localhost
if frontend_url and "localhost" not in frontend_url:
    origins.append(frontend_url)
    # Also add without trailing slash if it has one
    origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (only if successfully loaded)
if routes_available:
    app.include_router(lessons.router, prefix="/api/lessons", tags=["lessons"])
    app.include_router(progress.router, prefix="/api/progress", tags=["progress"])

# Include hand detection router (works without DB)
if hand_detection_available:
    app.include_router(hand_detection.router, prefix="/api/hand-detection", tags=["hand-detection"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "ASL Learning API",
        "status": "healthy",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    from database.supabase import supabase, SessionLocal

    db_status = "not_configured"
    if SessionLocal is not None:
        db_status = "connected"

    supabase_status = "not_configured"
    if supabase is not None:
        supabase_status = "connected"

    return {
        "status": "healthy",
        "database": db_status,
        "supabase": supabase_status,
        "routes_available": routes_available,
        "hand_detection_available": hand_detection_available,
        "message": "Configure SUPABASE_URL and DATABASE_URL in .env to enable all features"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
