-- Migration: Remove foreign key constraints on user_id
-- The backend uses PostgreSQL connection (not Supabase auth), so it cannot
-- insert records that reference auth.users. We validate user_id at the app level.

-- Step 1: Drop RLS policies that depend on user_id column
DROP POLICY IF EXISTS "Users can view their own sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Allow backend to insert sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Allow backend to insert progress" ON user_progress;
DROP POLICY IF EXISTS "Allow backend to update progress" ON user_progress;

-- Step 2: Drop the foreign key constraints
ALTER TABLE practice_sessions
DROP CONSTRAINT IF EXISTS practice_sessions_user_id_fkey;

ALTER TABLE user_progress
DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;

-- Step 3: Change user_id columns from UUID type to VARCHAR
ALTER TABLE practice_sessions
ALTER COLUMN user_id TYPE VARCHAR(255);

ALTER TABLE user_progress
ALTER COLUMN user_id TYPE VARCHAR(255);

-- Step 4: Recreate RLS policies with correct type casting
CREATE POLICY "Allow backend to insert sessions"
    ON practice_sessions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view their own sessions"
    ON practice_sessions FOR SELECT
    USING (auth.uid()::text = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow backend to insert progress"
    ON user_progress FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow backend to update progress"
    ON user_progress FOR UPDATE
    USING (true);

CREATE POLICY "Users can view their own progress"
    ON user_progress FOR SELECT
    USING (auth.uid()::text = user_id OR auth.uid() IS NULL);

-- Verify the changes
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('practice_sessions', 'user_progress')
    AND column_name = 'user_id'
ORDER BY table_name;
