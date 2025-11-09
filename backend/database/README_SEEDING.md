# Database Seeding Instructions

## How to Seed Alphabet Lessons

The seed script `seed_alphabet_lessons.py` will populate your database with all 26 alphabet lessons (A-Z).

### Prerequisites

1. Backend server must be configured with DATABASE_URL in `.env`
2. Database must be accessible
3. Python dependencies must be installed

### Option 1: Manual Lesson Creation via API

Since the seed script has import conflicts, you can create lessons using the API:

```bash
# Start the backend server first
cd backend
./venv/bin/uvicorn main:app --reload --port 8000

# Then use curl or the frontend to create lessons
curl -X POST "http://localhost:8000/api/lessons/" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Letter A",
    "description": "Learn how to sign the letter A in American Sign Language",
    "category": "alphabet",
    "difficulty": "beginner",
    "sign_name": "A",
    "video_url": "https://www.startasl.com/american-sign-language-alphabet/_a"
  }'
```

### Option 2: Use Docker

If using Docker Compose:

```bash
docker-compose exec backend python /app/database/seed_alphabet_lessons.py
```

### Option 3: Direct Database Access

Use a PostgreSQL client or Supabase dashboard to run the SQL directly.

## Lesson Data Structure

Each lesson includes:
- **title**: "Letter X"
- **description**: Educational description
- **category**: "alphabet"
- **difficulty**: "beginner"
- **sign_name**: The letter (A-Z)
- **order_index**: 1-26 for sorting
- **key_points**: JSON array of teaching tips
- **common_mistakes**: JSON array of what to avoid
- **video_url**: Reference link to ASL resource

## Verifying Lessons

Check that lessons were created:

```sql
SELECT id, title, sign_name, category FROM lessons WHERE category = 'alphabet' ORDER BY sign_name;
```

Should return 26 rows (A-Z).
