from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from database.models import (
    UserSettings,
    UserSettingsBase,
    UserSettingsCreate,
    UserSettingsResponse
)
from database.supabase import get_db

router = APIRouter()


@router.get("/user/{user_id}", response_model=UserSettingsResponse)
async def get_user_settings(user_id: str, db: Session = Depends(get_db)):
    """Get user settings, creating default if not exists"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    
    if not settings:
        # Create default settings
        default_settings = UserSettings(
            user_id=user_id,
            performance_mode='balanced',
            video_resolution='640x480',
            frame_rate=30,
            model_complexity=0,
            inference_throttle_ms=250,
            min_confidence=0.8,
            use_server_processing=0
        )
        db.add(default_settings)
        db.commit()
        db.refresh(default_settings)
        return default_settings
    
    return settings


@router.post("/", response_model=UserSettingsResponse, status_code=201)
async def create_user_settings(
    settings: UserSettingsCreate,
    db: Session = Depends(get_db)
):
    """Create user settings"""
    # Check if settings already exist
    existing = db.query(UserSettings).filter(
        UserSettings.user_id == settings.user_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Settings already exist. Use PUT to update.")
    
    db_settings = UserSettings(
        user_id=settings.user_id,
        performance_mode=settings.performance_mode,
        video_resolution=settings.video_resolution,
        frame_rate=settings.frame_rate,
        model_complexity=settings.model_complexity,
        inference_throttle_ms=settings.inference_throttle_ms,
        min_confidence=settings.min_confidence,
        use_server_processing=1 if settings.use_server_processing else 0
    )
    db.add(db_settings)
    db.commit()
    db.refresh(db_settings)
    return db_settings


@router.put("/user/{user_id}", response_model=UserSettingsResponse)
async def update_user_settings(
    user_id: str,
    settings: UserSettingsBase,
    db: Session = Depends(get_db)
):
    """Update user settings"""
    db_settings = db.query(UserSettings).filter(
        UserSettings.user_id == user_id
    ).first()
    
    if not db_settings:
        # Create if doesn't exist
        db_settings = UserSettings(
            user_id=user_id,
            performance_mode=settings.performance_mode or 'balanced',
            video_resolution=settings.video_resolution or '640x480',
            frame_rate=settings.frame_rate or 30,
            model_complexity=settings.model_complexity or 0,
            inference_throttle_ms=settings.inference_throttle_ms or 250,
            min_confidence=settings.min_confidence or 0.8,
            use_server_processing=1 if settings.use_server_processing else 0
        )
        db.add(db_settings)
    else:
        # Update existing
        if settings.performance_mode is not None:
            db_settings.performance_mode = settings.performance_mode
        if settings.video_resolution is not None:
            db_settings.video_resolution = settings.video_resolution
        if settings.frame_rate is not None:
            db_settings.frame_rate = settings.frame_rate
        if settings.model_complexity is not None:
            db_settings.model_complexity = settings.model_complexity
        if settings.inference_throttle_ms is not None:
            db_settings.inference_throttle_ms = settings.inference_throttle_ms
        if settings.min_confidence is not None:
            db_settings.min_confidence = settings.min_confidence
        if settings.use_server_processing is not None:
            db_settings.use_server_processing = 1 if settings.use_server_processing else 0
        
        db_settings.updated_at = func.now()
    
    db.commit()
    db.refresh(db_settings)
    return db_settings

