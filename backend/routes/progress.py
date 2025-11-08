from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
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
        is_correct=1 if session.is_correct else 0
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
    """Get aggregate statistics for a user"""
    # Total attempts
    total_attempts = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id
    ).scalar()

    # Average accuracy
    avg_accuracy = db.query(func.avg(UserProgress.accuracy)).filter(
        UserProgress.user_id == user_id
    ).scalar()

    # Total lessons practiced
    lessons_practiced = db.query(func.count(UserProgress.id)).filter(
        UserProgress.user_id == user_id
    ).scalar()

    # Correct attempts
    correct_attempts = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.is_correct == 1
    ).scalar()

    return {
        "user_id": user_id,
        "total_attempts": total_attempts or 0,
        "correct_attempts": correct_attempts or 0,
        "accuracy_rate": (correct_attempts / total_attempts * 100) if total_attempts else 0,
        "avg_lesson_accuracy": float(avg_accuracy) if avg_accuracy else 0,
        "lessons_practiced": lessons_practiced or 0
    }
