# ASL Learning Platform

> Browser-native, real-time American Sign Language recognition — **98.98% accurate**, running entirely on-device with WebGL GPU acceleration.

**[Live Demo](https://asl-learning-platform-psi.vercel.app/)** 

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232a?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=flat-square&logo=pytorch&logoColor=white)
![ONNX](https://img.shields.io/badge/ONNX_Runtime-grey?style=flat-square&logo=onnx&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)

---

## Technical Highlights

- **On-device ML inference** — The recognition pipeline runs 100% in the browser. A PyTorch MLP trained on 87,000 images was converted to ONNX format and served via ONNX Runtime Web with WebGL GPU acceleration, achieving **<50ms inference latency** with zero server roundtrips.
- **98.98% test accuracy, 99.18% validation accuracy** — 5-layer MLP (~50K parameters, 87 epochs) trained on the [Kaggle ASL Alphabet dataset](https://www.kaggle.com/datasets/grassknoted/asl-alphabet), classifying all 26 ASL alphabet signs (A–Z).
- **Real-time hand tracking at ~10 FPS** — MediaPipe Hands processes the webcam feed each frame, extracting 21 landmarks (63 x/y/z features) as model input for instant sign classification.
- **Full-stack, fully deployed** — Next.js 16 + React 19 frontend on Vercel; FastAPI backend on Render; PostgreSQL + Auth on Supabase.

---

## Architecture

```
Webcam
  └─► MediaPipe Hands ──► 63 landmark features
                               └─► ONNX Runtime Web (WebGL GPU)
                                        └─► Sign prediction + confidence
                                                   │
                                         [all client-side — no roundtrip]

User progress / Lessons ◄──► FastAPI (Render) ◄──► Supabase (PostgreSQL)
```

The ML pipeline is **entirely client-side** — the backend only handles authentication, lesson content, and progress persistence.

---

## Features

| | |
|---|---|
| **Real-time Practice** | Live webcam ASL recognition with per-frame confidence score |
| **Time Challenge** | Race-the-clock mode with automatic letter progression |
| **Guided Lessons** | Step-by-step instructions and common-mistake callouts for all 26 letters |
| **Quiz Mode** | Random, category, or custom-letter quizzes with instant feedback |
| **Reference Guide** | Visual lookup for all 26 ASL alphabet signs |
| **Progress Dashboard** | Accuracy stats, session history, and per-letter mastery tracking |
| **Authentication** | Email and Google OAuth via Supabase Auth |

---

## Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Recharts |
| **On-device ML** | ONNX Runtime Web, MediaPipe Hands, WebGL (GPU acceleration) |
| **ML Training** | PyTorch, NumPy, OpenCV, MediaPipe |
| **Backend** | FastAPI, Python, SQLAlchemy, Uvicorn |
| **Database / Auth** | Supabase — PostgreSQL + Auth (Email & Google OAuth) |
| **Deployment** | Vercel (frontend) · Render (backend) · Supabase (database) |

---

## Getting Started

**Frontend**
```bash
cd frontend
cp .env.example .env.local   # add your Supabase URL and anon key
npm install
npm run dev
```

**Backend**
```bash
cd backend
pip install -r requirements.txt
# export SUPABASE_URL=... SUPABASE_KEY=...
./run.sh
```

API reference available at `http://localhost:8000/docs`.

---

## Model Details

| | |
|---|---|
| Architecture | 5-layer MLP |
| Parameters | ~50,000 |
| Input | 63 features (21 landmarks × x, y, z) |
| Classes | 26 (A–Z) |
| Test Accuracy | **98.98%** |
| Validation Accuracy | **99.18%** |
| Training Epochs | 87 |
| Dataset | [Kaggle ASL Alphabet](https://www.kaggle.com/datasets/grassknoted/asl-alphabet) — 87,000 images |
| Export | ONNX (converted from PyTorch) |
| Inference | ONNX Runtime Web + WebGL — **<50ms** client-side |

---

## API

| Endpoint | Description |
|---|---|
| `GET /api/lessons/` | All lesson modules |
| `GET /api/lessons/{id}` | Single lesson by ID |
| `GET /api/progress/user/{user_id}` | User progress summary |
| `POST /api/progress/` | Update letter progress |
| `POST /api/progress/session` | Record a practice session |
| `GET /health` | Health check |
