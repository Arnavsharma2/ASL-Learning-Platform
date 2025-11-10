# Max Performance Mode Troubleshooting Guide

## Issue: Max Performance Mode Shows Video But No Hand Detection

### Root Cause

Max Performance mode requires a **backend server with MediaPipe** to process hand detection. If you're seeing this issue, it's likely because:

1. **Production (Render)**: Your backend is running Python 3.13, which doesn't support MediaPipe
2. **Local Development**: Backend server isn't running
3. **Network Issue**: Frontend can't reach the backend API

---

## Quick Diagnosis

### Check 1: Is the backend available?

Open browser console and look for errors like:
```
Server frame processing error: TypeError: Failed to fetch
```

### Check 2: What's your API URL?

Check the network tab in browser dev tools. Look for requests to:
- Production: `https://learnasl.onrender.com/api/hand-detection/detect-hands`
- Local: `http://localhost:8000/api/hand-detection/detect-hands`

### Check 3: Backend health check

Visit in your browser:
- Production: https://learnasl.onrender.com/health
- Local: http://localhost:8000/health

Look for:
```json
{
  "hand_detection_available": true  // ← Must be true!
}
```

If `hand_detection_available` is `false`, MediaPipe is not installed.

---

## Solutions

### Solution 1: For Production (Render.com)

Your production backend is running **Python 3.13**, which doesn't support MediaPipe.

**Option A: Downgrade to Python 3.11 (Recommended)**

1. Go to Render Dashboard → Your Web Service
2. Navigate to **Environment** tab
3. Add environment variable:
   ```
   PYTHON_VERSION=3.11.9
   ```
4. Go to **Settings** → Manual Deploy → **Deploy latest commit**

5. Update `backend/requirements.txt`:
   ```diff
   opencv-python-headless==4.10.0.84
   - # mediapipe==0.10.14  # Uncomment if using Python 3.8-3.12
   + mediapipe==0.10.14
   ```

6. Commit and push changes
7. Wait for deployment (~5 minutes)
8. Check health: https://learnasl.onrender.com/health
9. Verify: `"hand_detection_available": true`

**Option B: Keep Python 3.13 (Client modes only)**

If you want to stay on Python 3.13:
- Max Performance mode won't work
- Balanced and Max Accuracy modes work perfectly
- Users will see a warning banner: "Server Unavailable"
- This is totally fine! Most users prefer client-side modes anyway

### Solution 2: For Local Development

**Start the backend server:**

```bash
# Terminal 1 - Backend
cd "/Users/aps/Projects/Sign Language Learning/backend"
source venv/bin/activate
uvicorn main:app --reload

# Terminal 2 - Frontend
cd "/Users/aps/Projects/Sign Language Learning/frontend"
npm run dev
```

**Verify backend is running:**
```bash
curl http://localhost:8000/health
```

Should see:
```json
{
  "status": "healthy",
  "hand_detection_available": true
}
```

**Check frontend is pointing to correct API:**

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Restart frontend server after creating this file.

---

## Testing Max Performance Mode

### Step-by-Step Test

1. **Open Settings**: http://localhost:3000/settings (or your domain)
2. **Select "Max Performance"**: Move slider all the way left
3. **Go to Practice**: http://localhost:3000/practice
4. **Click "Start Camera"**

### Expected Behavior

✅ **If backend is available:**
- Video appears immediately (smooth 60 FPS)
- Hand detection happens every 2 seconds
- Green lines and red dots appear when hands detected
- Badge shows "1 hand detected" or "2 hands detected"
- Sign letter prediction appears (A-Z)

❌ **If backend is unavailable:**
- Video appears and plays smoothly
- Yellow warning banner at bottom: "⚠️ Server Unavailable"
- Message: "Hand detection server is not responding. Switch to Balanced or Max Accuracy mode in Settings."
- No hand detection overlays appear
- No sign predictions

### Browser Console Output

**Success (backend available):**
```
Settings loaded from localStorage
Camera stream started
Video drawing loop started
Sending frame to server...
Server detected 1 hand with 21 landmarks
Drawing hand overlay
ONNX prediction: B (confidence: 0.92)
```

**Failure (backend unavailable):**
```
Settings loaded from localStorage
Camera stream started
Video drawing loop started
Sending frame to server...
Server frame processing error: TypeError: Failed to fetch
Server unavailable - hand detection requires backend with OpenCV/MediaPipe
Falling back to client-side mode recommended
```

---

## Understanding the Modes

| Mode | Hand Detection | Video Rendering | Best For |
|------|----------------|-----------------|----------|
| **Max Performance** | Server (every 2s) | 60 FPS continuous | Old devices, low CPU |
| **Balanced** | Client (30 FPS) | 30 FPS with landmarks | General use |
| **Max Accuracy** | Client (30 FPS) | 30 FPS with landmarks | Low latency |

---

## Why Max Performance Needs Backend

### Client-Side Modes (Balanced/Max Accuracy)
```
Browser → MediaPipe WASM → Hand Landmarks → ONNX Inference → Prediction
         (runs in browser)
```
- ✅ Works without backend
- ✅ Real-time (30 FPS)
- ⚠️ Higher CPU usage

### Server-Side Mode (Max Performance)
```
Browser → Capture Frame → Backend API → MediaPipe (Python) → Hand Landmarks
                                                              ↓
Browser ← Display Video ← Send Landmarks ← ONNX Inference ← Return
         (60 FPS loop)     (every 2s)
```
- ✅ Very low client CPU
- ✅ Smooth video (60 FPS)
- ⚠️ Requires backend with MediaPipe

---

## Common Errors and Fixes

### Error: "Failed to fetch"

**Cause**: Backend not running or wrong API URL

**Fix**:
1. Check backend is running: `lsof -i:8000`
2. Check frontend `.env.local` has correct `NEXT_PUBLIC_API_URL`
3. Check CORS settings in backend allow your frontend URL

### Error: "404 Not Found" on /api/hand-detection/detect-hands

**Cause**: Backend route not loaded (MediaPipe not installed)

**Fix**:
1. Check backend logs for: `⚠️ Hand detection route unavailable`
2. Install MediaPipe: `pip install mediapipe==0.10.14 opencv-python-headless==4.10.0.84`
3. Verify Python version: `python --version` (must be 3.8-3.12, not 3.13+)
4. Restart backend

### Error: "No module named 'cv2'"

**Cause**: OpenCV not installed

**Fix**:
```bash
pip install opencv-python-headless==4.10.0.84
```

### Error: Warning banner appears but video works

**Cause**: Expected! Server isn't available but client-side fallback is working

**Fix**: Not really an error - this is graceful degradation:
- Option 1: Fix backend (see Solution 1 or 2 above)
- Option 2: Switch to Balanced or Max Accuracy mode

---

## Production Deployment Checklist

### Backend (Render)

- [ ] Python version set to 3.11 (not 3.13)
- [ ] `mediapipe==0.10.14` uncommented in requirements.txt
- [ ] `opencv-python-headless==4.10.0.84` present in requirements.txt
- [ ] Environment variable `FRONTEND_URL` set
- [ ] Health check shows `"hand_detection_available": true`

### Frontend (Vercel)

- [ ] `NEXT_PUBLIC_API_URL` environment variable set to Render backend URL
- [ ] All three performance modes tested
- [ ] Warning banner appears when backend unavailable
- [ ] Fallback to client modes works correctly

---

## Performance Expectations

### With Backend Available (All 3 modes work)

| Metric | Max Performance | Balanced | Max Accuracy |
|--------|----------------|----------|--------------|
| **Video FPS** | 60 | 30 | 30 |
| **Detection Rate** | Every 2s | 30 FPS | 30 FPS |
| **Inference Throttle** | N/A | 500ms | 200ms |
| **Client CPU** | ~5% | ~20% | ~30% |
| **Latency** | ~100-500ms | ~50-100ms | ~20-50ms |

### Without Backend (Max Performance unavailable)

| Metric | Max Performance | Balanced | Max Accuracy |
|--------|----------------|----------|--------------|
| **Status** | ❌ Shows warning | ✅ Works | ✅ Works |
| **Video FPS** | 60 (no detection) | 30 | 30 |
| **User Experience** | Poor (no hands) | Good | Excellent |

---

## Recommended Setup by Environment

### Development (Local)
**Recommended**: Run backend locally
- Enables all 3 modes
- Fast iteration
- Easy debugging

### Production (Free Tier)
**Recommended**: Client-side only (Python 3.13)
- Keeps costs low
- No server processing needed
- Balanced and Max Accuracy work great
- Users' data stays on device (privacy)

### Production (Paid Tier)
**Recommended**: Server-side enabled (Python 3.11)
- All 3 modes available
- Better experience for low-end devices
- Slightly higher hosting costs

---

## Final Notes

### If Max Performance Still Doesn't Work After Fixes:

1. **Clear browser cache** and reload
2. **Check localStorage**: Open browser console and run:
   ```javascript
   console.log(localStorage.getItem('asl-settings'));
   ```
   Should show: `{"mode":"max_performance","inferenceThrottleMs":0}`

3. **Check network tab**: Look for requests to `/api/hand-detection/detect-hands`
   - Should see requests every 2 seconds
   - Check status code (should be 200, not 404/500)
   - Check response body (should have landmarks array)

4. **Backend logs**: Check Render logs or local terminal for:
   ```
   INFO:     127.0.0.1:xxxxx - "POST /api/hand-detection/detect-hands HTTP/1.1" 200 OK
   ```

### Still Having Issues?

1. Share browser console errors
2. Share backend logs
3. Share health check response
4. Share which environment (local/production)

The fix is complete and should work once the backend is properly configured!
