# Database Schema and Migrations

## Files

- `schema.sql` - Initial database schema (run once when setting up)
- `migration_fix_is_correct.sql` - Migration to fix is_correct constraint
- `models.py` - SQLAlchemy ORM models
- `supabase.py` - Database connection setup

## Running Migrations

### Initial Setup
Run `schema.sql` in Supabase SQL Editor when first setting up the database.

### Migrations
Run migration files in order if you need to update an existing database:

1. `migration_fix_is_correct.sql` - Fixes the `is_correct` constraint to allow NULL values for free practice mode
2. `migration_fix_rls_policies.sql` - Fixes RLS policies to allow backend API inserts (backend uses PostgreSQL connection, not Supabase auth)

## Schema Changes

### practice_sessions table
- `is_correct` column now accepts: 0, 1, or NULL
  - 0 = incorrect sign
  - 1 = correct sign
  - NULL = free practice (no target sign to compare)

### user_progress table
- Added `status` column: 'not_started', 'in_progress', or 'mastered'
