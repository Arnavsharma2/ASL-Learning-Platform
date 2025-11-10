"""
Cleanup script to remove word lessons (like "no", "hello", etc.) and ensure all A-Z letters exist
Run this script to clean up the database and ensure only alphabet letters remain
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from database.supabase import SessionLocal
from database.models import Lesson
from sqlalchemy import text

def cleanup_word_lessons():
    """Remove all lessons that are not single A-Z letters"""
    if SessionLocal is None:
        print("❌ Database not configured. Check your DATABASE_URL in .env")
        return

    db = SessionLocal()

    try:
        print("🧹 Cleaning up word lessons...")
        print("-" * 50)

        # Find all lessons that are not single A-Z letters
        all_lessons = db.query(Lesson).all()
        words_to_delete = []

        for lesson in all_lessons:
            sign_name = lesson.sign_name
            # Check if it's NOT a single A-Z letter
            if not (sign_name and len(sign_name) == 1 and sign_name.isalpha() and sign_name.isupper()):
                words_to_delete.append(lesson)
                print(f"🗑️  Marked for deletion: {lesson.title} (sign_name: '{sign_name}')")

        # Delete word lessons
        deleted_count = 0
        for lesson in words_to_delete:
            db.delete(lesson)
            deleted_count += 1

        db.commit()

        print("-" * 50)
        print(f"✅ Deleted {deleted_count} word lessons")

        # Now ensure all A-Z letters exist
        print("\n📝 Ensuring all A-Z letters exist...")
        print("-" * 50)

        alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        created_count = 0
        skipped_count = 0

        for letter in alphabet:
            # Check if lesson exists
            existing = db.query(Lesson).filter(
                Lesson.sign_name == letter,
                Lesson.category == 'alphabet'
            ).first()

            if existing:
                print(f"⏭️  Letter {letter} already exists (ID: {existing.id})")
                skipped_count += 1
            else:
                # Create new lesson
                new_lesson = Lesson(
                    title=f"Letter {letter}",
                    description=f"Learn the ASL sign for the letter {letter}",
                    category='alphabet',
                    difficulty='beginner',
                    sign_name=letter
                )
                db.add(new_lesson)
                created_count += 1
                print(f"✅ Created lesson for letter {letter}")

        db.commit()

        print("-" * 50)
        print(f"🎉 Cleanup complete!")
        print(f"   Deleted: {deleted_count} word lessons")
        print(f"   Created: {created_count} alphabet lessons")
        print(f"   Skipped: {skipped_count} alphabet lessons (already exist)")

        # Verify final count
        total_alphabet = db.query(Lesson).filter(Lesson.category == 'alphabet').count()
        total_all = db.query(Lesson).count()
        print(f"\n📊 Final counts:")
        print(f"   Alphabet lessons: {total_alphabet}/26")
        print(f"   Total lessons: {total_all}")

        if total_alphabet == 26:
            print("✅ Perfect! All 26 alphabet letters are present")
        else:
            print(f"⚠️  Warning: Expected 26 alphabet lessons, found {total_alphabet}")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_word_lessons()

