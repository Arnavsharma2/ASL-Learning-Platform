#!/usr/bin/env python3
"""
Quick seed script for alphabet lessons - avoids import conflicts
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL not found in environment")
    exit(1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Lesson data for letters F-Z
REMAINING_LESSONS = [
    {"letter": "F", "tips": "Index and thumb form circle, other fingers up", "mistakes": "Keep the circle tight"},
    {"letter": "G", "tips": "Index and thumb point horizontally", "mistakes": "Keep hand sideways, not vertical"},
    {"letter": "H", "tips": "Index and middle fingers extended sideways", "mistakes": "Keep fingers together and horizontal"},
    {"letter": "I", "tips": "Pinky finger extended up, others closed", "mistakes": "Keep other fingers folded down"},
    {"letter": "J", "tips": "Like 'I' but draw a 'J' shape in air", "mistakes": "Remember the motion - it's dynamic"},
    {"letter": "K", "tips": "Index and middle up, thumb between them", "mistakes": "Thumb should touch middle finger"},
    {"letter": "L", "tips": "Index up, thumb out (90-degree angle)", "mistakes": "Make a clear 'L' shape"},
    {"letter": "M", "tips": "Thumb under first three fingers", "mistakes": "Use three fingers, not four"},
    {"letter": "N", "tips": "Thumb under first two fingers", "mistakes": "Use two fingers, not three"},
    {"letter": "O", "tips": "All fingers curved into 'O' shape", "mistakes": "Keep fingers touching"},
    {"letter": "P", "tips": "Like 'K' but pointed down", "mistakes": "Remember the downward angle"},
    {"letter": "Q", "tips": "Like 'G' but pointed down", "mistakes": "Keep thumb and index touching"},
    {"letter": "R", "tips": "Cross index over middle finger", "mistakes": "Don't separate the fingers"},
    {"letter": "S", "tips": "Fist with thumb over fingers", "mistakes": "Thumb goes in front, not side"},
    {"letter": "T", "tips": "Thumb between index and middle", "mistakes": "Keep thumb tucked in"},
    {"letter": "U", "tips": "Index and middle fingers up together", "mistakes": "Keep fingers touching"},
    {"letter": "V", "tips": "Index and middle form 'V' shape", "mistakes": "Spread fingers to make clear 'V'"},
    {"letter": "W", "tips": "Three fingers up (index, middle, ring)", "mistakes": "Keep all three fingers extended"},
    {"letter": "X", "tips": "Index finger bent into hook shape", "mistakes": "Bend only the index finger"},
    {"letter": "Y", "tips": "Thumb and pinky extended out", "mistakes": "Keep other fingers folded"},
    {"letter": "Z", "tips": "Draw 'Z' shape with index finger", "mistakes": "Remember the motion - it's dynamic"},
]

def main():
    db = SessionLocal()

    try:
        print("🎓 Adding remaining alphabet lessons (F-Z)...")
        print("-" * 50)

        created = 0
        skipped = 0

        for idx, lesson_data in enumerate(REMAINING_LESSONS, start=6):  # Start at 6 (F is 6th letter)
            letter = lesson_data["letter"]

            # Check if exists
            result = db.execute(
                text("SELECT id FROM lessons WHERE sign_name = :letter AND category = 'alphabet'"),
                {"letter": letter}
            )
            if result.fetchone():
                print(f"⏭️  Skipping {letter} - already exists")
                skipped += 1
                continue

            # Insert lesson (without order_index since it doesn't exist in schema)
            db.execute(
                text("""
                    INSERT INTO lessons (title, description, category, difficulty, sign_name, video_url)
                    VALUES (:title, :description, :category, :difficulty, :sign_name, :video_url)
                """),
                {
                    "title": f"Letter {letter}",
                    "description": f"Learn how to sign the letter '{letter}' in American Sign Language. {lesson_data['tips']}",
                    "category": "alphabet",
                    "difficulty": "beginner",
                    "sign_name": letter,
                    "video_url": f"https://www.startasl.com/american-sign-language-alphabet/_{letter.lower()}"
                }
            )

            created += 1
            print(f"✅ Created lesson for letter {letter}")

        db.commit()

        print("-" * 50)
        print(f"🎉 Complete!")
        print(f"   Created: {created}")
        print(f"   Skipped: {skipped}")

        # Count total
        result = db.execute(text("SELECT COUNT(*) FROM lessons WHERE category = 'alphabet'"))
        total = result.fetchone()[0]
        print(f"\n📊 Total alphabet lessons in database: {total}/26")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
