# Running Without Supabase (Development Mode)

The backend now works without Supabase configured! This lets you see the API structure before setting up the database.

## Start the Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

## What Works Without Supabase

✅ **Root endpoint**: http://localhost:8000
- Returns: `{"message": "ASL Learning API", "status": "healthy", "version": "1.0.0"}`

✅ **Health check**: http://localhost:8000/health
- Shows database/Supabase connection status
- Returns:
```json
{
  "status": "healthy",
  "database": "not_configured",
  "supabase": "not_configured",
  "routes_available": false,
  "message": "Configure SUPABASE_URL and DATABASE_URL in .env to enable all features"
}
```

✅ **API Documentation**: http://localhost:8000/docs
- Interactive Swagger UI
- You can see all endpoint definitions (even if they won't work without DB)

## What Doesn't Work Yet

❌ `/api/lessons/*` endpoints - Need database
❌ `/api/progress/*` endpoints - Need database

## When You Configure Supabase

Once you add your credentials to `backend/.env`:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

Then restart the backend, and you'll see:
```json
{
  "status": "healthy",
  "database": "connected",
  "supabase": "connected",
  "routes_available": true
}
```

And all API endpoints will work!

## Quick Test

Try this in your terminal:

```bash
# Test root endpoint
curl http://localhost:8000

# Test health check
curl http://localhost:8000/health
```

Or open http://localhost:8000/docs in your browser to explore the API!

---

**Next step**: Follow [QUICKSTART.md](QUICKSTART.md) to set up Supabase and enable full functionality.
