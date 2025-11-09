-- Migration: Remove foreign key constraints on user_id
-- The backend uses PostgreSQL connection (not Supabase auth), so it cannot
-- insert records that reference auth.users. We validate user_id at the app level.

-- Drop the foreign key constraints
ALTER TABLE practice_sessions
DROP CONSTRAINT IF EXISTS practice_sessions_user_id_fkey;

ALTER TABLE user_progress
DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;

-- Change user_id columns from UUID type to VARCHAR to accept string user IDs
-- First, we need to drop and recreate the columns with the new type

-- For practice_sessions
ALTER TABLE practice_sessions
ALTER COLUMN user_id TYPE VARCHAR(255);

-- For user_progress
ALTER TABLE user_progress
ALTER COLUMN user_id TYPE VARCHAR(255);

-- Verify the changes
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('practice_sessions', 'user_progress')
    AND column_name = 'user_id'
ORDER BY table_name;
