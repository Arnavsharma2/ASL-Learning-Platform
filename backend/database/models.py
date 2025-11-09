from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID

Base = declarative_base()


# SQLAlchemy ORM Models

class Lesson(Base):
    """Lesson database model"""
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)  # e.g., "alphabet", "numbers", "basic_words"
    video_url = Column(String)
    difficulty = Column(String)  # "beginner", "intermediate", "advanced"
    sign_name = Column(String, nullable=False)  # The actual sign being taught


class UserProgress(Base):
    """User progress database model"""
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)  # From Supabase Auth
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    attempts = Column(Integer, default=0)
    accuracy = Column(Float)  # Average accuracy percentage
    status = Column(String, default='not_started')  # not_started, in_progress, mastered
    last_practiced = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PracticeSession(Base):
    """Individual practice session records"""
    __tablename__ = "practice_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    sign_detected = Column(String)
    confidence = Column(Float)
    is_correct = Column(Integer, nullable=True)  # 0, 1, or None
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class UserSettings(Base):
    """User settings and preferences"""
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, unique=True, index=True)
    performance_mode = Column(String, default='balanced')  # 'max_performance', 'balanced', 'max_accuracy'
    video_resolution = Column(String, default='640x480')  # '480x360', '640x480', '1280x720'
    frame_rate = Column(Integer, default=30)  # 15, 24, 30
    model_complexity = Column(Integer, default=0)  # 0 (fastest), 1 (balanced), 2 (most accurate)
    inference_throttle_ms = Column(Integer, default=250)  # Milliseconds between inferences
    min_confidence = Column(Float, default=0.8)  # Minimum confidence threshold
    use_server_processing = Column(Integer, default=0)  # 0 = false, 1 = true
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# Pydantic Schemas for API

class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    video_url: Optional[str] = None
    difficulty: str
    sign_name: str


class LessonCreate(LessonBase):
    pass


class LessonResponse(LessonBase):
    id: int

    class Config:
        from_attributes = True


class UserProgressBase(BaseModel):
    lesson_id: int
    attempts: int = 0
    accuracy: Optional[float] = None
    status: Optional[str] = 'not_started'


class UserProgressCreate(UserProgressBase):
    user_id: str


class UserProgressResponse(UserProgressBase):
    id: int
    user_id: str
    status: str
    last_practiced: datetime
    created_at: datetime

    @field_validator('user_id', mode='before')
    @classmethod
    def convert_user_id_to_string(cls, v):
        """Convert UUID to string if needed"""
        if isinstance(v, UUID):
            return str(v)
        return str(v) if v is not None else v

    class Config:
        from_attributes = True


class PracticeSessionCreate(BaseModel):
    user_id: str
    sign_detected: str
    confidence: float
    is_correct: Optional[bool] = None


class PracticeSessionResponse(BaseModel):
    id: int
    user_id: str
    sign_detected: str
    confidence: float
    is_correct: Optional[int] = None  # 0, 1, or None
    timestamp: datetime

    @field_validator('user_id', mode='before')
    @classmethod
    def convert_user_id_to_string(cls, v):
        """Convert UUID to string if needed"""
        if isinstance(v, UUID):
            return str(v)
        return str(v) if v is not None else v

    class Config:
        from_attributes = True


class UserSettingsBase(BaseModel):
    performance_mode: Optional[str] = 'balanced'
    video_resolution: Optional[str] = '640x480'
    frame_rate: Optional[int] = 30
    model_complexity: Optional[int] = 0
    inference_throttle_ms: Optional[int] = 250
    min_confidence: Optional[float] = 0.8
    use_server_processing: Optional[bool] = False


class UserSettingsCreate(UserSettingsBase):
    user_id: str


class UserSettingsResponse(UserSettingsBase):
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime

    @field_validator('user_id', mode='before')
    @classmethod
    def convert_user_id_to_string(cls, v):
        """Convert UUID to string if needed"""
        if isinstance(v, UUID):
            return str(v)
        return str(v) if v is not None else v

    class Config:
        from_attributes = True
