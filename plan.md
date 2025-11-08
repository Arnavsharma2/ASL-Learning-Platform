<!-- 5af29bb2-8ac0-49bd-930d-963a2e8d6791 1042011e-6e82-4fe1-8a70-9515b812e636 -->
# Sign Language Learning Website Plan

## Project Goal
A portfolio project demonstrating full-stack development, ML integration, and modern web technologies through an interactive ASL learning platform.

## Architecture Overview (Resume-Optimized)

**Frontend:** Next.js 14 (React) with TypeScript, TailwindCSS
**Backend:** Python FastAPI (REST API)
**ML Model:** TensorFlow.js + MediaPipe (client-side inference)
**Database:** Supabase (PostgreSQL with built-in auth)
**Storage:** Cloudinary or Vercel Blob (free tier for demo videos)
**Deployment:** Vercel (frontend + serverless functions), Railway/Render (backend)
**Testing:** Jest, Pytest, Playwright (E2E)

## Core Features (MVP Focus)

### 1. Real-Time Sign Detection (Main Feature)
- Client-side webcam processing with MediaPipe Hands
- Recognition of 15-20 common ASL signs (alphabet + basic words)
- TensorFlow.js model running in browser (no backend latency)
- Visual feedback with confidence scores
- **Resume highlight:** Real-time ML inference, WebRTC, Canvas API

### 2. Interactive Learning System
- Structured lessons with video demonstrations
- Practice mode with instant feedback
- Progress tracking (localStorage + database sync)
- Simple quiz system
- **Resume highlight:** Interactive UI/UX, state management

### 3. User Features
- Supabase authentication (Google OAuth + email)
- Personal dashboard with statistics
- Session history and accuracy tracking
- **Resume highlight:** Auth implementation, data visualization

## Technical Implementation

### Frontend Structure (Next.js)
```
frontend/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── practice/page.tsx           # Real-time detection
│   ├── learn/page.tsx              # Lesson catalog
│   ├── dashboard/page.tsx          # User stats
│   └── api/                        # API routes (optional)
├── components/
│   ├── CameraFeed.tsx              # Webcam + MediaPipe
│   ├── SignDetector.tsx            # ML inference logic
│   ├── LessonCard.tsx              # Lesson UI
│   ├── ProgressChart.tsx           # Chart.js/Recharts
│   └── ui/                         # Shadcn/ui components
├── lib/
│   ├── mediapipe.ts                # MediaPipe setup
│   ├── tensorflow.ts               # TF.js model loader
│   ├── supabase.ts                 # Supabase client
│   └── types.ts                    # TypeScript types
└── public/
    └── models/                     # TF.js model files
```

### Backend Structure (FastAPI - Simplified)
```
backend/
├── main.py                         # FastAPI app
├── routes/
│   ├── lessons.py                  # CRUD for lessons
│   └── progress.py                 # Save user stats
├── database/
│   ├── models.py                   # SQLAlchemy/Pydantic models
│   └── supabase.py                 # Supabase connection
├── services/
│   └── cloudinary.py               # Video upload (optional)
├── training/                       # Phase 2: PyTorch training
│   ├── collect_data.py            # Collect gesture landmarks
│   ├── dataset.py                 # PyTorch dataset class
│   ├── model.py                   # Model architecture
│   ├── train.py                   # Training script
│   ├── export.py                  # Convert to TF.js
│   ├── evaluate.py                # Model evaluation
│   └── data/                      # Raw training data
└── tests/
    └── test_api.py                 # Pytest tests
```

### Database Schema (Supabase PostgreSQL)
```sql
users (handled by Supabase Auth)

lessons
- id, title, description, category, video_url, difficulty, sign_name

user_progress
- id, user_id, lesson_id, attempts, accuracy, last_practiced, created_at

practice_sessions
- id, user_id, sign_detected, confidence, is_correct, timestamp
```

## Development Phases (Achievable MVP)

### Phase 1: Foundation (Week 1)
- Initialize Next.js 14 with TypeScript, TailwindCSS, Shadcn/ui
- Set up FastAPI backend with basic structure
- Configure Supabase project (database + auth)
- Set up dev environment (Docker Compose for local Postgres)
- **Resume highlight:** Project setup, tooling selection

### Phase 2: ML Integration - Pre-trained Model (Week 2)
- Integrate MediaPipe Hands in browser
- Find and integrate existing TensorFlow.js gesture model
- OR use MediaPipe's built-in gesture recognizer
- Create CameraFeed component with hand tracking visualization
- Test basic recognition (even if limited signs)
- **Resume highlight:** ML model integration, computer vision, MediaPipe

### Phase 3: Core Features (Week 3)
- Build practice page with real-time detection
- Implement Supabase auth (email + Google OAuth)
- Create API endpoints for lessons and progress
- Build lesson catalog with static content
- Implement progress tracking (save attempts/accuracy)
- **Resume highlight:** Full-stack implementation, REST API

### Phase 4: UI/UX Polish (Week 4)
- Design landing page with demo
- Create dashboard with charts (accuracy over time, signs learned)
- Add responsive design for mobile
- Implement error handling and loading states
- **Resume highlight:** UI/UX design, responsive design

### Phase 5: Testing & Deployment (Week 5)
- Write unit tests (Jest for frontend, Pytest for backend)
- Add E2E tests with Playwright
- Deploy frontend to Vercel
- Deploy backend to Railway/Render
- Set up CI/CD with GitHub Actions
- **Resume highlight:** Testing, CI/CD, deployment

---

## Phase 6: Custom PyTorch Model (Optional Enhancement)

**Goal:** Replace pre-trained model with custom-trained PyTorch model for better accuracy and deeper ML experience.

### Week 6: Data Collection & Preparation
- Build data collection tool using MediaPipe
- Record 100+ samples per sign (15-20 signs)
- Extract hand landmarks (21 points × 3 coords = 63 features)
- Split into train/validation/test sets
- Augment data (rotation, scaling, noise)
- **Resume highlight:** Dataset creation, data engineering

### Week 7: Model Training & Experimentation
- Design PyTorch model architecture (CNN/LSTM/Transformer)
- Implement training loop with validation
- Experiment with hyperparameters
- Add techniques: dropout, batch norm, learning rate scheduling
- Track experiments with TensorBoard or Weights & Biases
- Achieve target accuracy (>85% on test set)
- **Resume highlight:** Deep learning, PyTorch, model training

### Week 8: Model Export & Integration
- Convert PyTorch model to ONNX format
- Convert ONNX to TensorFlow.js
- Optimize model size (<5MB)
- Replace pre-trained model in frontend
- A/B test performance vs. pre-trained model
- Document training process in README
- **Resume highlight:** Model deployment pipeline, optimization

## Tech Stack Justification (For Resume/Interviews)

**Why Next.js?**
- Server components for performance
- Built-in API routes (optional backend)
- Great DX with hot reload
- Industry standard

**Why FastAPI?**
- Fast, async Python framework
- Auto-generated OpenAPI docs
- Type hints with Pydantic
- Good for ML integration

**Why TensorFlow.js + MediaPipe?**
- Client-side inference = no latency
- Privacy-friendly (no video upload)
- Demonstrates understanding of browser ML
- MediaPipe is production-grade (Google)

**Why Supabase?**
- PostgreSQL with built-in auth
- Free tier for portfolio projects
- Row-level security
- Real-time capabilities

## ML Model Strategy (Two-Phase Approach)

### Phase 1: Pre-trained Model (MVP - Faster Launch)
**Goal:** Get working prototype deployed quickly

- Use existing TensorFlow.js hand gesture model
- Or use MediaPipe's gesture recognition
- Focus on integration and UI/UX
- Prove the concept works end-to-end
- **Timeline:** Weeks 1-5

**Benefits:**
- Fast deployment
- Focus on full-stack skills
- Working demo for resume

### Phase 2: Custom PyTorch Model (Enhancement - More Impressive)
**Goal:** Show ML engineering depth

- Collect custom ASL dataset using MediaPipe landmarks
- Design and train PyTorch CNN/LSTM
- Experiment with model architectures
- Convert PyTorch → ONNX → TensorFlow.js
- Document training process and results
- **Timeline:** Weeks 6-8 (if time permits)

**Benefits:**
- End-to-end ML pipeline
- Model training experience
- Stronger resume talking points
- Potential accuracy improvements

**Training Pipeline:**
```
Data Collection → PyTorch Training → Model Export → Production Deployment
     ↓                    ↓                ↓              ↓
MediaPipe          Train on GPU      ONNX/TF.js    Replace model in
landmarks          Tune hyperparams  conversion     frontend/public/
```

## Resume Talking Points

### After Phase 5 (MVP with Pre-trained Model):

1. **Problem-Solving**: "Built an accessible ASL learning platform to help bridge communication gaps"

2. **Technical Depth**: "Implemented real-time ML inference using TensorFlow.js and MediaPipe, processing 30fps video in-browser"

3. **Architecture Decisions**: "Chose client-side ML to minimize latency and protect user privacy"

4. **Full-Stack Skills**: "Built REST API with FastAPI, integrated Supabase for auth and persistence, deployed on Vercel/Railway"

5. **Performance**: "Optimized model size to <5MB for fast loading, implemented lazy loading for components"

6. **Testing**: "Wrote unit tests with Jest/Pytest, E2E tests with Playwright, achieved X% code coverage"

### After Phase 6 (Custom PyTorch Model - Enhanced):

**Additional talking points:**

7. **ML Engineering**: "Designed and trained custom PyTorch CNN for ASL gesture recognition, achieving X% accuracy on held-out test set"

8. **End-to-End ML Pipeline**: "Built complete ML pipeline from data collection through MediaPipe, model training in PyTorch, to production deployment via TensorFlow.js conversion"

9. **Data Engineering**: "Collected and labeled 2000+ gesture samples, implemented data augmentation strategies to improve model robustness"

10. **Model Optimization**: "Converted PyTorch model to TensorFlow.js, reducing model size by X% while maintaining accuracy"

11. **Experimentation**: "Tracked experiments using TensorBoard, iterating on architectures (CNN vs LSTM vs Transformer) to find optimal performance"

12. **Iterative Development**: "Started with pre-trained model for rapid prototyping, then enhanced with custom model showing X% accuracy improvement"

## Success Metrics

- Model accuracy: >85% on test set
- Detection latency: <100ms per frame
- Lighthouse score: >90
- Mobile responsive
- Working auth flow
- 15+ signs recognized

## To-Dos

### Phase 1-5: MVP (Weeks 1-5)

**Phase 1: Setup**
- [ ] Initialize Next.js 14 project with TypeScript, TailwindCSS, Shadcn/ui
- [ ] Set up FastAPI backend with basic routes
- [ ] Create Supabase project and configure database schema
- [ ] Set up Docker Compose for local development

**Phase 2: ML Core (Pre-trained)**
- [ ] Integrate MediaPipe Hands in React component
- [ ] Find existing TensorFlow.js gesture recognition model
- [ ] Implement real-time hand tracking visualization
- [ ] Test basic gesture recognition
- [ ] Create fallback for unsupported browsers

**Phase 3: Features**
- [ ] Implement Supabase auth (email + OAuth)
- [ ] Build practice page with detection + feedback
- [ ] Create lesson catalog with sample content
- [ ] Build API endpoints for lessons and progress tracking
- [ ] Implement progress dashboard with charts

**Phase 4: Polish**
- [ ] Design landing page with project demo
- [ ] Add responsive mobile design
- [ ] Implement error handling and loading states
- [ ] Add accessibility features
- [ ] Performance optimization

**Phase 5: Testing & Deployment**
- [ ] Write unit tests (Jest for frontend, Pytest for backend)
- [ ] Add E2E tests with Playwright
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway/Render
- [ ] Set up CI/CD with GitHub Actions

### Phase 6: Custom PyTorch Model (Weeks 6-8, Optional)

**Week 6: Data Collection**
- [ ] Build MediaPipe data collection tool with UI
- [ ] Record 100+ samples per sign (15-20 signs total)
- [ ] Label and organize dataset
- [ ] Create train/validation/test splits (70/15/15)
- [ ] Implement data augmentation pipeline
- [ ] Document dataset collection process

**Week 7: Model Training**
- [ ] Set up PyTorch training environment (GPU recommended)
- [ ] Implement dataset loader and preprocessing
- [ ] Design model architecture (start with simple MLP)
- [ ] Implement training loop with checkpointing
- [ ] Add validation metrics and early stopping
- [ ] Experiment with architectures (CNN, LSTM, Transformer)
- [ ] Set up TensorBoard for experiment tracking
- [ ] Achieve >85% validation accuracy

**Week 8: Deployment**
- [ ] Export best PyTorch model to ONNX
- [ ] Convert ONNX to TensorFlow.js format
- [ ] Optimize model size and quantization
- [ ] Replace pre-trained model in frontend
- [ ] Compare performance: custom vs. pre-trained
- [ ] Update documentation with training details
- [ ] Create model comparison demo page