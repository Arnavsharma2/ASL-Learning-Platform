#!/bin/bash

# ASL Learning Platform - Setup Script

echo "🚀 Setting up ASL Learning Platform..."
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "⚠️  Docker not found. You won't be able to use docker-compose." >&2; }

echo "✅ Prerequisites check passed"
echo ""

# Frontend setup
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Frontend installation failed"
    exit 1
fi

# Create frontend env file
if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    echo "📝 Created frontend/.env.local - Please update with your Supabase credentials"
fi

cd ..

# Backend setup
echo ""
echo "📦 Setting up backend virtual environment..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install -r requirements.txt
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Backend installation failed"
    exit 1
fi

# Create backend env file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created backend/.env - Please update with your Supabase credentials"
fi

cd ..

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Run the SQL from backend/database/schema.sql in Supabase SQL Editor"
echo "3. Update environment variables:"
echo "   - frontend/.env.local"
echo "   - backend/.env"
echo "4. Start the development servers:"
echo ""
echo "   Option A: Using Docker Compose (recommended)"
echo "   $ docker-compose up"
echo ""
echo "   Option B: Run separately"
echo "   Terminal 1: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "5. Access the app at http://localhost:3000"
echo ""
