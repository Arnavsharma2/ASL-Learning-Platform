#!/usr/bin/env python3
"""Quick script to check database connection and tables"""

from database.supabase import engine, SessionLocal
from sqlalchemy import text

print("🔍 Checking database setup...\n")

if engine is None:
    print("❌ Database engine not initialized")
    exit(1)

try:
    # Test connection
    with engine.connect() as conn:
        print("✅ Database connection successful")

        # Check if tables exist
        result = conn.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('lessons', 'user_progress', 'practice_sessions')
            ORDER BY table_name
        """))

        tables = [row[0] for row in result]

        print(f"\n📊 Tables found: {len(tables)}/3")

        expected_tables = ['lessons', 'practice_sessions', 'user_progress']
        for table in expected_tables:
            if table in tables:
                print(f"  ✅ {table}")

                # Count rows
                count_result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = count_result.scalar()
                print(f"     → {count} rows")
            else:
                print(f"  ❌ {table} - MISSING!")

        if len(tables) == 3:
            print("\n✅ Database is fully set up!")
        else:
            print("\n⚠️  Some tables are missing. Please run backend/database/schema.sql in Supabase SQL Editor")

except Exception as e:
    print(f"❌ Error: {e}")
    print("\nMake sure you've run backend/database/schema.sql in Supabase SQL Editor")
