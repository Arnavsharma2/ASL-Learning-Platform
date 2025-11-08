from fastapi import APIRouter, HTTPException
from typing import List

from database.models import LessonCreate, LessonResponse
from database.supabase import supabase

router = APIRouter()


@router.get("/", response_model=List[LessonResponse])
async def get_lessons(
    skip: int = 0,
    limit: int = 100,
    category: str = None
):
    """Get all lessons with optional filtering"""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    query = supabase.table('lessons').select('*')

    if category:
        query = query.eq('category', category)

    response = query.range(skip, skip + limit - 1).execute()
    return response.data


@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(lesson_id: int):
    """Get a specific lesson by ID"""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    response = supabase.table('lessons').select('*').eq('id', lesson_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return response.data[0]


@router.post("/", response_model=LessonResponse, status_code=201)
async def create_lesson(lesson: LessonCreate):
    """Create a new lesson"""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    response = supabase.table('lessons').insert(lesson.model_dump()).execute()
    return response.data[0]


@router.get("/category/{category}", response_model=List[LessonResponse])
async def get_lessons_by_category(category: str):
    """Get all lessons in a specific category"""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    response = supabase.table('lessons').select('*').eq('category', category).execute()
    return response.data
