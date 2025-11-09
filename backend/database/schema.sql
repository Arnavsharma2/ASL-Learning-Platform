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
    user_id VARCHAR(255) NOT NULL,
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
    user_id VARCHAR(255) NOT NULL,
    sign_detected VARCHAR(100),
    confidence FLOAT,
    is_correct INTEGER CHECK (is_correct IN (0, 1) OR is_correct IS NULL),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    performance_mode VARCHAR(50) DEFAULT 'balanced', -- 'max_performance', 'balanced', 'max_accuracy'
    video_resolution VARCHAR(20) DEFAULT '640x480', -- '480x360', '640x480', '1280x720'
    frame_rate INTEGER DEFAULT 30, -- 15, 24, 30
    model_complexity INTEGER DEFAULT 0, -- 0 (fastest), 1 (balanced), 2 (most accurate)
    inference_throttle_ms INTEGER DEFAULT 250, -- Milliseconds between inferences
    min_confidence FLOAT DEFAULT 0.8, -- Minimum confidence threshold
    use_server_processing INTEGER DEFAULT 0, -- Use server-side processing (0 = false, 1 = true)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_timestamp ON practice_sessions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons(category);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

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

-- Note: Backend connects via PostgreSQL (not Supabase auth), so auth.uid() is NULL
-- Policies allow backend inserts while keeping read restrictions

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Allow backend to insert sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Allow backend to insert progress" ON user_progress;
DROP POLICY IF EXISTS "Allow backend to update progress" ON user_progress;
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Allow backend to insert settings" ON user_settings;
DROP POLICY IF EXISTS "Allow backend to update settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Anyone can view lessons" ON lessons;
DROP POLICY IF EXISTS "Authenticated users can create lessons" ON lessons;

-- Practice sessions policies
CREATE POLICY "Allow backend to insert sessions"
    ON practice_sessions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view their own sessions"
    ON practice_sessions FOR SELECT
    USING (auth.uid()::text = user_id OR auth.uid() IS NULL);

-- User progress policies
CREATE POLICY "Allow backend to insert progress"
    ON user_progress FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow backend to update progress"
    ON user_progress FOR UPDATE
    USING (true);

CREATE POLICY "Users can view their own progress"
    ON user_progress FOR SELECT
    USING (auth.uid()::text = user_id OR auth.uid() IS NULL);

-- User settings policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow backend to insert settings"
    ON user_settings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow backend to update settings"
    ON user_settings FOR UPDATE
    USING (true);

CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (auth.uid()::text = user_id OR auth.uid() IS NULL);

-- Everyone can read lessons (public data)
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lessons"
    ON lessons FOR SELECT
    USING (true);

-- Only authenticated users can create lessons (admin feature for later)
CREATE POLICY "Authenticated users can create lessons"
    ON lessons FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
