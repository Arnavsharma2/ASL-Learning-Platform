-- Clear ASL Learning Platform Database Schema
-- Run this in Supabase SQL Editor to drop all tables, policies, and indexes
-- WARNING: This will delete all data! Make sure you have backups if needed.

-- Drop all RLS policies first
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

-- Drop tables in order (child tables first due to foreign key constraints)
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS practice_sessions CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;

-- Note: Indexes are automatically dropped when tables are dropped
-- Extensions are not dropped (uuid-ossp is a system extension)

-- Verify tables are dropped (optional - run this to check)
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('lessons', 'user_progress', 'practice_sessions', 'user_settings');

