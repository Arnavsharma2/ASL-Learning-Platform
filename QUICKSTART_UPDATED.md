# ASL Learning Platform - Quick Start Guide

## System Overview

The ASL Learning Platform is now complete with custom ML model integration! Here's how to run everything.

## Prerequisites

- Node.js 18+ and npm
- Python 3.8-3.13
- Supabase account (for authentication & progress tracking)
- Webcam

## Running the Complete System

### 1. Start the Backend API (Port 8000)

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**What it does:**
- Handles user authentication via Supabase
- Stores practice session data
- Provides progress tracking API
- Runs on http://localhost:8000

### 2. Start the ML Inference Server (Port 8001)

```bash
cd backend/training
python inference_server.py
```

**What it does:**
- Loads trained PyTorch model
- Serves real-time sign predictions
- Provides inference API for practice page
- Runs on http://localhost:8001

### 3. Start the Frontend (Port 3000)

```bash
cd frontend
npm run dev
```

**What it does:**
- Serves React/Next.js application
- Camera integration with MediaPipe
- Calls inference server for predictions
- Runs on http://localhost:3000

## Using the Platform

### Practice Page ⭐
http://localhost:3000/practice

- **Real-time sign recognition** powered by custom ML model
- Show hand to camera
- See detected sign and confidence (96%+ accuracy)
- Automatic session recording (if logged in)

**Currently recognizes: A, B, C, hello, no, please, thank_you, yes**

## Model Performance

- **Test Accuracy**: 96.32%
- **Inference Speed**: <50ms
- **Model Type**: PyTorch MLP (84K params)

---

**Status: Phase 6 Complete!** ✅
