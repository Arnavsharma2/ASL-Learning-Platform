#!/usr/bin/env python3
"""Test Supabase connection and data access"""

from database.supabase import supabase

print("🔍 Testing Supabase client...\n")

if supabase is None:
    print("❌ Supabase client not initialized")
    exit(1)

print("✅ Supabase client connected")

try:
    # Try to fetch lessons using Supabase client
    print("\n📚 Fetching lessons...")
    response = supabase.table('lessons').select('*').execute()

    lessons = response.data
    print(f"✅ Found {len(lessons)} lessons!")

    if lessons:
        print(f"\n📝 First lesson:")
        print(f"  Title: {lessons[0]['title']}")
        print(f"  Category: {lessons[0]['category']}")
        print(f"  Difficulty: {lessons[0]['difficulty']}")
        print(f"  Sign: {lessons[0]['sign_name']}")

    print("\n✅ Supabase client is working perfectly!")
    print("   The issue is with the direct PostgreSQL connection.")
    print("   We can use the Supabase client instead.")

except Exception as e:
    print(f"❌ Error fetching data: {e}")
    print("\nMake sure you ran the SQL schema in Supabase SQL Editor")
