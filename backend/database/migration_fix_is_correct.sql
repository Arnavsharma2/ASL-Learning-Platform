-- Migration: Fix practice_sessions is_correct constraint to allow NULL
-- Run this in Supabase SQL Editor to fix the database schema

-- Step 1: Drop the existing constraint
ALTER TABLE practice_sessions
DROP CONSTRAINT IF EXISTS practice_sessions_is_correct_check;

-- Step 2: Add the new constraint that allows NULL
ALTER TABLE practice_sessions
ADD CONSTRAINT practice_sessions_is_correct_check
CHECK (is_correct IN (0, 1) OR is_correct IS NULL);

-- Step 3: Add status column to user_progress if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_progress' AND column_name = 'status'
    ) THEN
        ALTER TABLE user_progress
        ADD COLUMN status VARCHAR(50) DEFAULT 'not_started';
    END IF;
END $$;

-- Verify the changes
SELECT
    'practice_sessions' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'practice_sessions'
    AND column_name IN ('is_correct', 'user_id')
ORDER BY ordinal_position;

SELECT
    'user_progress' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_progress'
    AND column_name IN ('status', 'user_id')
ORDER BY ordinal_position;
