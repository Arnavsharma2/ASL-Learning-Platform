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
    status VARCHAR(50) DEFAULT 'not_started',
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
    is_correct INTEGER CHECK (is_correct IN (0, 1) OR is_correct IS NULL),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_timestamp ON practice_sessions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons(category);

-- Insert sample lessons (ASL alphabet)
INSERT INTO lessons (title, description, category, difficulty, sign_name) VALUES
    ('Letter A', 'Learn the ASL sign for the letter A', 'alphabet', 'beginner', 'A'),
    ('Letter B', 'Learn the ASL sign for the letter B', 'alphabet', 'beginner', 'B'),
    ('Letter C', 'Learn the ASL sign for the letter C', 'alphabet', 'beginner', 'C'),
    ('Letter D', 'Learn the ASL sign for the letter D', 'alphabet', 'beginner', 'D'),
    ('Letter E', 'Learn the ASL sign for the letter E', 'alphabet', 'beginner', 'E'),
    ('Hello', 'Learn the ASL sign for Hello', 'greetings', 'beginner', 'hello'),
    ('Thank You', 'Learn the ASL sign for Thank You', 'greetings', 'beginner', 'thank_you'),
    ('Please', 'Learn the ASL sign for Please', 'greetings', 'beginner', 'please'),
    ('Yes', 'Learn the ASL sign for Yes', 'basic_words', 'beginner', 'yes'),
    ('No', 'Learn the ASL sign for No', 'basic_words', 'beginner', 'no')
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) Policies
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Anyone can view lessons"
    ON lessons FOR SELECT
    USING (true);

-- Only authenticated users can create lessons (admin feature for later)
CREATE POLICY "Authenticated users can create lessons"
    ON lessons FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
