#!/usr/bin/env python3
"""
Add status column to user_progress table
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL not found in environment")
    exit(1)

engine = create_engine(DATABASE_URL)

def main():
    with engine.connect() as conn:
        try:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'user_progress'
                AND column_name = 'status'
            """))

            if result.fetchone():
                print("✓ Status column already exists")
                return

            # Add status column
            print("Adding status column to user_progress table...")
            conn.execute(text("""
                ALTER TABLE user_progress
                ADD COLUMN status VARCHAR DEFAULT 'not_started'
            """))
            conn.commit()

            print("✅ Status column added successfully")

        except Exception as e:
            print(f"❌ Error: {e}")
            raise

if __name__ == "__main__":
    main()
