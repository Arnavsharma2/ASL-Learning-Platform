-- ASL Learning Platform Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    video_url VARCHAR(500),
    difficulty VARCHAR(50) NOT NULL,
    sign_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    attempts INTEGER DEFAULT 0,
    accuracy FLOAT,
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'mastered')),
    last_practiced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Practice sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sign_detected VARCHAR(100),
    confidence FLOAT,
    is_correct INTEGER CHECK (is_correct IN (0, 1)),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_timestamp ON practice_sessions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons(category);

-- Delete existing alphabet lessons to avoid duplicates
DELETE FROM lessons WHERE category = 'alphabet';

-- Insert all 26 ASL alphabet lessons (A-Z)
INSERT INTO lessons (title, description, category, difficulty, sign_name) VALUES
    ('Letter A', 'Learn the ASL sign for the letter A', 'alphabet', 'beginner', 'A'),
    ('Letter B', 'Learn the ASL sign for the letter B', 'alphabet', 'beginner', 'B'),
    ('Letter C', 'Learn the ASL sign for the letter C', 'alphabet', 'beginner', 'C'),
    ('Letter D', 'Learn the ASL sign for the letter D', 'alphabet', 'beginner', 'D'),
    ('Letter E', 'Learn the ASL sign for the letter E', 'alphabet', 'beginner', 'E'),
    ('Letter F', 'Learn the ASL sign for the letter F', 'alphabet', 'beginner', 'F'),
    ('Letter G', 'Learn the ASL sign for the letter G', 'alphabet', 'beginner', 'G'),
    ('Letter H', 'Learn the ASL sign for the letter H', 'alphabet', 'beginner', 'H'),
    ('Letter I', 'Learn the ASL sign for the letter I', 'alphabet', 'beginner', 'I'),
    ('Letter J', 'Learn the ASL sign for the letter J', 'alphabet', 'beginner', 'J'),
    ('Letter K', 'Learn the ASL sign for the letter K', 'alphabet', 'beginner', 'K'),
    ('Letter L', 'Learn the ASL sign for the letter L', 'alphabet', 'beginner', 'L'),
    ('Letter M', 'Learn the ASL sign for the letter M', 'alphabet', 'beginner', 'M'),
    ('Letter N', 'Learn the ASL sign for the letter N', 'alphabet', 'beginner', 'N'),
    ('Letter O', 'Learn the ASL sign for the letter O', 'alphabet', 'beginner', 'O'),
    ('Letter P', 'Learn the ASL sign for the letter P', 'alphabet', 'beginner', 'P'),
    ('Letter Q', 'Learn the ASL sign for the letter Q', 'alphabet', 'beginner', 'Q'),
    ('Letter R', 'Learn the ASL sign for the letter R', 'alphabet', 'beginner', 'R'),
    ('Letter S', 'Learn the ASL sign for the letter S', 'alphabet', 'beginner', 'S'),
    ('Letter T', 'Learn the ASL sign for the letter T', 'alphabet', 'beginner', 'T'),
    ('Letter U', 'Learn the ASL sign for the letter U', 'alphabet', 'beginner', 'U'),
    ('Letter V', 'Learn the ASL sign for the letter V', 'alphabet', 'beginner', 'V'),
    ('Letter W', 'Learn the ASL sign for the letter W', 'alphabet', 'beginner', 'W'),
    ('Letter X', 'Learn the ASL sign for the letter X', 'alphabet', 'beginner', 'X'),
    ('Letter Y', 'Learn the ASL sign for the letter Y', 'alphabet', 'beginner', 'Y'),
    ('Letter Z', 'Learn the ASL sign for the letter Z', 'alphabet', 'beginner', 'Z')
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) Policies
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can view their own sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON practice_sessions;

-- Users can only read/write their own progress
CREATE POLICY "Users can view their own progress"
    ON user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
    ON user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
    ON user_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can only read/write their own practice sessions
CREATE POLICY "Users can view their own sessions"
    ON practice_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
    ON practice_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Everyone can read lessons (public data)
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing lesson policies if they exist
DROP POLICY IF EXISTS "Anyone can view lessons" ON lessons;
DROP POLICY IF EXISTS "Authenticated users can create lessons" ON lessons;

CREATE POLICY "Anyone can view lessons"
    ON lessons FOR SELECT
    USING (true);

-- Only authenticated users can create lessons (admin feature for later)
CREATE POLICY "Authenticated users can create lessons"
    ON lessons FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Add status column to existing user_progress table (for databases that already exist)
-- This is safe to run multiple times due to IF NOT EXISTS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' AND column_name = 'status'
    ) THEN
        ALTER TABLE user_progress 
        ADD COLUMN status VARCHAR(20) DEFAULT 'not_started' 
        CHECK (status IN ('not_started', 'in_progress', 'mastered'));
        
        -- Update existing rows based on attempts and accuracy
        UPDATE user_progress 
        SET status = CASE
            WHEN attempts = 0 THEN 'not_started'
            WHEN accuracy >= 0.8 THEN 'mastered'
            ELSE 'in_progress'
        END;
    END IF;
END $$;
