# ASL Learning Platform
Uses Kaggle DataSet: https://www.kaggle.com/datasets/grassknoted/asl-alphabet

Next.js web application that provides interactive American Sign Language (ASL) learning with real-time sign recognition using computer vision and machine learning.

## What It Does

- **Real-time Sign Recognition**: Uses webcam to detect and recognize ASL alphabet signs (A-Z) in real-time
- **Interactive Lessons**: Browse and learn individual ASL alphabet letters with detailed instructions
- **Guided Practice**: Practice specific signs with real-time feedback and progress tracking
- **Quiz Mode**: Test your knowledge with interactive quizzes on ASL alphabet recognition
- **Reference Guide**: Quick reference for all 26 ASL alphabet letters
- **Progress Tracking**: Save your learning progress and track mastery of each sign
- **User Dashboard**: View statistics, accuracy, and learning history
- **AI-Powered Recognition**: Client-side ONNX model with GPU acceleration for fast inference

## How It Works

1. **Hand Detection**: MediaPipe tracks hand landmarks in real-time from webcam feed
2. **Feature Extraction**: Extracts 21 hand landmarks (63 features: x, y, z coordinates)
3. **AI Recognition**: ONNX model (trained PyTorch MLP) predicts the sign from hand landmarks
4. **Real-time Feedback**: Displays detected sign and confidence score instantly
5. **Progress Tracking**: Records practice sessions and updates user progress in database
6. **Guided Learning**: Provides step-by-step lessons with key points and common mistakes
7. **Quiz System**: Generates random or custom quizzes to test recognition skills

## Controls

- **Practice Mode**: Use webcam to practice any ASL sign with real-time recognition (start/stop camera control)
- **Time Challenge**: Race against the clock to sign letters as fast as possible with automatic progression
- **Lessons**: Browse alphabet lessons, view instructions, and start guided practice
- **Quiz**: Select quiz mode (random, category, or custom letters) and answer questions
- **Reference**: Quick visual reference for all 26 ASL alphabet letters
- **Dashboard**: View learning statistics, progress, and history (requires login)
- **Navigation**: Switch between Practice, Time Challenge, Lessons, Quiz, Reference, and Dashboard

**Note**: Recognition uses optimized balanced settings (2000ms inference throttle) for smooth video performance.

## Dependencies

### Frontend
- `next` - React framework with App Router
- `react` & `react-dom` - UI library
- `onnxruntime-web` - ONNX model inference in browser
- `@mediapipe/hands` - Hand tracking and landmark detection
- `@supabase/supabase-js` - Authentication and database client
- `tailwindcss` - Utility-first CSS framework
- `framer-motion` - Animation library
- `lucide-react` - Icon library
- `typescript` - Type safety

### Backend
- `fastapi` - Python web framework
- `pytorch` - Machine learning framework for model training
- `sqlalchemy` - Python ORM
- `supabase` - PostgreSQL database and auth
- `uvicorn` - ASGI server
- `numpy` - Numerical computing
- `opencv-python` - Image processing (server side)
- `mediapipe` - Hand detection (server side)

## Technical Details

- **Framework**: Next.js 16 (App Router)
- **AI Model**: PyTorch MLP → ONNX format (98.98% test accuracy)
- **Inference**: Client-side ONNX Runtime Web with WebGL GPU acceleration
- **Hand Tracking**: MediaPipe Hands (client-side or server-side)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (Email + Google OAuth)
- **State Management**: React hooks + Supabase real-time
- **Styling**: Tailwind CSS utility classes
- **API**: FastAPI REST endpoints
- **Deployment**: Vercel (frontend) + Render (backend) + Supabase (database)

## Features

- Real-time ASL alphabet recognition (A-Z)
- GPU-accelerated inference (WebGL)
- Interactive lessons with step-by-step instructions
- Guided practice with mastery tracking
- Interactive quiz system
- Progress tracking and statistics
- User authentication (Email + Google OAuth)

## API Endpoints

- `GET /api/lessons/` - Get all lessons
- `GET /api/lessons/{id}` - Get specific lesson
- `GET /api/progress/user/{user_id}` - Get user progress
- `POST /api/progress/` - Update progress
- `POST /api/progress/session` - Record practice session
- `GET /health` - Health check

API documentation available at `/docs` when running backend.
