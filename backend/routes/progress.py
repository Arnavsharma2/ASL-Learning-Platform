from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List

from database.models import (
    UserProgress,
    UserProgressCreate,
    UserProgressResponse,
    PracticeSession,
    PracticeSessionCreate,
    PracticeSessionResponse
)
from database.supabase import get_db

router = APIRouter()


@router.get("/user/{user_id}", response_model=List[UserProgressResponse])
async def get_user_progress(user_id: str, db: Session = Depends(get_db)):
    """Get all progress records for a user"""
    progress = db.query(UserProgress).filter(UserProgress.user_id == user_id).all()
    return progress


@router.post("/", response_model=UserProgressResponse, status_code=201)
async def create_or_update_progress(
    progress: UserProgressCreate,
    db: Session = Depends(get_db)
):
    """Create or update user progress for a lesson"""
    # Check if progress already exists
    existing = db.query(UserProgress).filter(
        UserProgress.user_id == progress.user_id,
        UserProgress.lesson_id == progress.lesson_id
    ).first()

    if existing:
        # Update existing progress
        existing.attempts = progress.attempts
        existing.accuracy = progress.accuracy
        if progress.status:
            existing.status = progress.status
        existing.last_practiced = func.now()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new progress record
        db_progress = UserProgress(**progress.model_dump())
        db.add(db_progress)
        db.commit()
        db.refresh(db_progress)
        return db_progress


@router.post("/session", response_model=PracticeSessionResponse, status_code=201)
async def record_practice_session(
    session: PracticeSessionCreate,
    db: Session = Depends(get_db)
):
    """Record a practice session"""
    db_session = PracticeSession(
        user_id=session.user_id,
        sign_detected=session.sign_detected,
        confidence=session.confidence,
        is_correct=1 if session.is_correct is True else (0 if session.is_correct is False else None)
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@router.get("/sessions/{user_id}", response_model=List[PracticeSessionResponse])
async def get_user_sessions(
    user_id: str,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get recent practice sessions for a user"""
    sessions = db.query(PracticeSession).filter(
        PracticeSession.user_id == user_id
    ).order_by(PracticeSession.timestamp.desc()).limit(limit).all()
    return sessions


@router.get("/stats/{user_id}")
async def get_user_stats(user_id: str, db: Session = Depends(get_db)):
    """Get aggregate statistics for a user - uses single query for transaction pooler compatibility"""
    # Use a single combined query with subqueries to work with Supabase transaction pooler
    # This avoids multiple prepared statements which aren't supported by transaction pooler
    result = db.execute(
        text("""
            SELECT 
                (SELECT COALESCE(COUNT(id), 0) 
                 FROM public.practice_sessions 
                 WHERE user_id = :user_id) as total_attempts,
                (SELECT COALESCE(COUNT(id), 0) 
                 FROM public.practice_sessions 
                 WHERE user_id = :user_id AND is_correct = 1) as correct_attempts,
                (SELECT COALESCE(AVG(accuracy), 0) 
                 FROM public.user_progress 
                 WHERE user_id = :user_id) as avg_lesson_accuracy,
                (SELECT COALESCE(COUNT(id), 0) 
                 FROM public.user_progress 
                 WHERE user_id = :user_id) as lessons_practiced
        """),
        {"user_id": user_id}
    ).first()
    
    if result:
        total_attempts = result.total_attempts or 0
        correct_attempts = result.correct_attempts or 0
        avg_accuracy = float(result.avg_lesson_accuracy) if result.avg_lesson_accuracy else 0
        lessons_practiced = result.lessons_practiced or 0
    else:
        total_attempts = 0
        correct_attempts = 0
        avg_accuracy = 0
        lessons_practiced = 0
    
    return {
        "user_id": user_id,
        "total_attempts": total_attempts,
        "correct_attempts": correct_attempts,
        "accuracy_rate": (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0,
        "avg_lesson_accuracy": avg_accuracy,
        "lessons_practiced": lessons_practiced
    }
