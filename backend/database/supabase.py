from supabase import create_client, Client
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

# Supabase client for auth and storage
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

supabase: Client = None
if supabase_url and supabase_key and supabase_url != "placeholder":
    try:
        supabase = create_client(supabase_url, supabase_key)
    except Exception as e:
        print(f"Warning: Could not initialize Supabase client: {e}")
        supabase = None


# SQLAlchemy database connection
DATABASE_URL = os.getenv("DATABASE_URL")

engine = None
SessionLocal = None

if DATABASE_URL:
    try:
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception as e:
        print(f"Warning: Could not connect to database: {e}")
        engine = None
        SessionLocal = None


def get_db():
    """Dependency for getting database session"""
    if SessionLocal is None:
        raise Exception("Database not configured")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    if supabase is None:
        raise Exception("Supabase not configured")
    return supabase
