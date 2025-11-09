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


class UserProgressCreate(UserProgressBase):
    user_id: str


class UserProgressResponse(UserProgressBase):
    id: int
    user_id: str
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
