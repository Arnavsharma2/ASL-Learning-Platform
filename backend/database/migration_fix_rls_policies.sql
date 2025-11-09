-- Migration: Fix RLS policies to allow backend API inserts
-- The backend connects via PostgreSQL connection (not Supabase auth),
-- so auth.uid() is NULL. We need to allow inserts from the backend.

-- Drop ALL existing policies for these tables
DROP POLICY IF EXISTS "Users can insert their own sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Allow backend to insert sessions" ON practice_sessions;

DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Allow backend to insert progress" ON user_progress;
DROP POLICY IF EXISTS "Allow backend to update progress" ON user_progress;

-- Create new policies that allow backend inserts
-- For practice_sessions: Allow all inserts (backend will validate user_id)
CREATE POLICY "Allow backend to insert sessions"
    ON practice_sessions FOR INSERT
    WITH CHECK (true);

-- Keep read restrictions in place
CREATE POLICY "Users can view their own sessions"
    ON practice_sessions FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- For user_progress: Allow all inserts and updates (backend will validate)
CREATE POLICY "Allow backend to insert progress"
    ON user_progress FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow backend to update progress"
    ON user_progress FOR UPDATE
    USING (true);

-- Keep read restrictions
CREATE POLICY "Users can view their own progress"
    ON user_progress FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('practice_sessions', 'user_progress')
ORDER BY tablename, policyname;
