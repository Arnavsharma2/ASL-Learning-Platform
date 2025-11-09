-- Migration: Add user_settings table
-- Run this in Supabase SQL Editor if the table doesn't exist

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

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop existing first to allow re-running)
DROP POLICY IF EXISTS "Allow backend to insert settings" ON user_settings;
DROP POLICY IF EXISTS "Allow backend to update settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;

CREATE POLICY "Allow backend to insert settings"
    ON user_settings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow backend to update settings"
    ON user_settings FOR UPDATE
    USING (true);

CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (auth.uid()::text = user_id OR auth.uid() IS NULL);

