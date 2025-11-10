"""
Seed database with all 26 ASL alphabet lessons
Run this script to populate the lessons table with comprehensive alphabet curriculum
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from database.supabase import SessionLocal, engine
from database.models import Lesson
from sqlalchemy import text

# Comprehensive alphabet lesson data
ALPHABET_LESSONS = [
    {"letter": "A", "tips": "Make a fist with thumb alongside", "mistakes": "Don't let thumb stick out too far"},
    {"letter": "B", "tips": "Flat hand with fingers together, thumb across palm", "mistakes": "Keep fingers straight and together"},
    {"letter": "C", "tips": "Curve hand to form a 'C' shape", "mistakes": "Don't close the gap completely"},
    {"letter": "D", "tips": "Index finger up, other fingers touch thumb", "mistakes": "Keep index finger straight"},
    {"letter": "E", "tips": "All fingers bent down touching thumb", "mistakes": "Curl fingers, don't extend them"},
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

def create_alphabet_lessons():
    """Create all 26 alphabet lessons in the database"""
    if SessionLocal is None:
        print("Database not configured. Check your DATABASE_URL in .env")
        return

    db = SessionLocal()

    try:
        print("Seeding alphabet lessons...")
        print("-" * 50)

        created_count = 0
        skipped_count = 0

        for idx, lesson_data in enumerate(ALPHABET_LESSONS, start=1):
            letter = lesson_data["letter"]

            # Check if lesson already exists
            existing = db.query(Lesson).filter(
                Lesson.sign_name == letter,
                Lesson.category == 'alphabet'
            ).first()

            if existing:
                print(f"Skipping {letter} - already exists (ID: {existing.id})")
                skipped_count += 1
                continue

            # Create lesson with educational content
            title = f"Letter {letter}"
            description = f"Learn how to sign the letter '{letter}' in American Sign Language"

            # Key teaching points as JSON array (PostgreSQL will store this as JSONB)
            key_points = [
                lesson_data["tips"],
                "Hold your hand at chest level",
                "Keep the sign clear and steady for 2-3 seconds"
            ]

            # Common mistakes as JSON array
            common_mistakes = [
                lesson_data["mistakes"],
                "Don't rush - hold the position steady"
            ]

            # Create new lesson
            new_lesson = Lesson(
                title=title,
                description=description,
                category='alphabet',
                video_url=f'https://www.startasl.com/american-sign-language-alphabet/_{letter.lower()}',
                difficulty='beginner',
                sign_name=letter
            )

            # Note: key_points and common_mistakes fields need to be added to the Lesson model
            # For now, we'll use the SQL directly to add them if the columns exist
            db.add(new_lesson)
            db.flush()  # Get the ID without committing

            # Try to update with JSON fields if columns exist
            try:
                db.execute(
                    text("""
                        UPDATE lessons
                        SET key_points = :key_points::jsonb,
                            common_mistakes = :common_mistakes::jsonb,
                            order_index = :order_index
                        WHERE id = :lesson_id
                    """),
                    {
                        "key_points": str(key_points).replace("'", '"'),
                        "common_mistakes": str(common_mistakes).replace("'", '"'),
                        "order_index": idx,
                        "lesson_id": new_lesson.id
                    }
                )
            except Exception as e:
                # Columns might not exist yet - that's okay, lesson is still created
                print(f"  Note: Could not set extended fields (they may not exist in schema yet)")
                pass

            created_count += 1
            print(f"Created {letter} - Lesson ID: {new_lesson.id}")

        db.commit()

        print("-" * 50)
        print(f"Seeding complete!")
        print(f"   Created: {created_count} lessons")
        print(f"   Skipped: {skipped_count} lessons (already exist)")
        print(f"   Total alphabet lessons: {created_count + skipped_count}")

        # Verify total count
        total_count = db.query(Lesson).filter(Lesson.category == 'alphabet').count()
        print(f"\nDatabase now has {total_count} alphabet lessons")

    except Exception as e:
        db.rollback()
        print(f"\nError seeding lessons: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

def delete_all_alphabet_lessons():
    """Delete all alphabet lessons (use with caution!)"""
    if SessionLocal is None:
        print("Database not configured")
        return

    db = SessionLocal()

    try:
        deleted_count = db.query(Lesson).filter(Lesson.category == 'alphabet').delete()
        db.commit()
        print(f"Deleted {deleted_count} alphabet lessons")
    except Exception as e:
        db.rollback()
        print(f"Error deleting lessons: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Manage ASL alphabet lessons in database")
    parser.add_argument(
        '--action',
        choices=['seed', 'reset'],
        default='seed',
        help='Action to perform: seed (add lessons) or reset (delete then re-add)'
    )

    args = parser.parse_args()

    if args.action == 'reset':
        print("WARNING: This will delete all existing alphabet lessons!")
        confirm = input("Type 'yes' to confirm: ")
        if confirm.lower() == 'yes':
            delete_all_alphabet_lessons()
            create_alphabet_lessons()
        else:
            print("Reset cancelled")
    else:
        create_alphabet_lessons()
