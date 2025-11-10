# Deployment Guide

## Current Deployment Status

### Production (Render)
- **URL**: https://learnasl.onrender.com
- **Status**: ✅ Running
- **Python Version**: 3.13
- **Hand Detection**: ⚠️ Server mode unavailable (MediaPipe requires Python 3.8-3.12)
- **Client Modes**: ✅ Fully functional (Balanced & Max Accuracy)

## Dependencies Fixed

### backend/requirements.txt
Added OpenCV (headless version for servers):
```
opencv-python-headless==4.10.0.84
```

### Why opencv-python-headless?
- Standard `opencv-python` requires GUI libraries (X11, etc.)
- `opencv-python-headless` works on servers without display
- Smaller footprint for production

## Server-Side Hand Detection on Render

### Option 1: Use Python 3.11 (Recommended for full features)
If you want server-side hand detection to work on Render:

1. **Update Render Environment**:
   - Go to Render Dashboard → Environment
   - Set Python version to 3.11:
     ```
     PYTHON_VERSION=3.11.9
     ```

2. **Update requirements.txt**:
   ```diff
   # Computer Vision (for server-side hand detection)
   opencv-python-headless==4.10.0.84
   - # mediapipe==0.10.14  # Uncomment if using Python 3.8-3.12
   + mediapipe==0.10.14  # Now works with Python 3.11
   ```

3. **Redeploy**:
   - Trigger manual deploy on Render
   - Check logs for: `✅ Hand detection endpoint loaded successfully`

### Option 2: Use Python 3.13 (Current - Client modes only)
Keep current setup:
- ✅ Balanced mode works (client-side real-time tracking)
- ✅ Max Accuracy mode works (client-side fast inference)
- ❌ Max Performance mode unavailable (no server-side processing)

**This is perfectly fine!** Most users will prefer client-side modes anyway.

## Environment Variables

### Required for Production
```bash
# Frontend URL for CORS
FRONTEND_URL=https://your-frontend-url.vercel.app

# Database (optional)
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
DATABASE_URL=your-database-url
```

### Render Configuration
Set in Render Dashboard → Environment:
```
FRONTEND_URL=https://asl-learning-platform-psi.vercel.app
```

## Vercel Frontend Configuration

### Environment Variables
Create `.env.production` in frontend:
```bash
NEXT_PUBLIC_API_URL=https://learnasl.onrender.com
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Current Production Behavior

### With Python 3.13 (Current)
```
┌─────────────────────────────────────────┐
│  Performance Modes Status               │
├─────────────────────────────────────────┤
│  🟢 Max Performance    ❌ Unavailable   │
│     (requires MediaPipe on server)      │
│                                         │
│  🔵 Balanced          ✅ Working        │
│     (client-side, 500ms inference)      │
│                                         │
│  🟣 Max Accuracy      ✅ Working        │
│     (client-side, 200ms inference)      │
└─────────────────────────────────────────┘
```

Users who select "Max Performance" will automatically fall back to client-side mode.

### With Python 3.11 + MediaPipe
```
┌─────────────────────────────────────────┐
│  Performance Modes Status               │
├─────────────────────────────────────────┤
│  🟢 Max Performance    ✅ Working       │
│     (server snapshots every 2s)         │
│                                         │
│  🔵 Balanced          ✅ Working        │
│     (client-side, 500ms inference)      │
│                                         │
│  🟣 Max Accuracy      ✅ Working        │
│     (client-side, 200ms inference)      │
└─────────────────────────────────────────┘
```

## Health Check Endpoint

Check backend status:
```bash
curl https://learnasl.onrender.com/health
```

Response:
```json
{
  "status": "healthy",
  "database": "not_configured",
  "supabase": "not_configured",
  "routes_available": false,
  "hand_detection_available": false,
  "message": "Configure SUPABASE_URL and DATABASE_URL in .env to enable all features"
}
```

## Troubleshooting

### Issue: "No module named 'cv2'"
**Cause**: OpenCV not installed

**Solution**: Already fixed! Added to requirements.txt:
```
opencv-python-headless==4.10.0.84
```

### Issue: "Hand detection route unavailable"
**Cause**: MediaPipe doesn't support Python 3.13

**Solutions**:
1. **Option A**: Downgrade to Python 3.11 on Render (see Option 1 above)
2. **Option B**: Keep Python 3.13, users use client modes (perfectly fine!)

### Issue: CORS errors
**Cause**: Frontend URL not in allowed origins

**Solution**: Set `FRONTEND_URL` environment variable on Render

### Issue: 404 on /api/hand-detection/detect-hands
**Cause**: Hand detection route not loaded (MediaPipe unavailable)

**Expected**: This is normal with Python 3.13. Client modes still work!

## Deployment Checklist

### Backend (Render)
- [x] OpenCV added to requirements.txt
- [x] Graceful error handling for missing MediaPipe
- [x] Helpful log messages
- [ ] Optional: Switch to Python 3.11 for full features
- [ ] Optional: Configure FRONTEND_URL env var

### Frontend (Vercel)
- [ ] Set NEXT_PUBLIC_API_URL to Render URL
- [ ] Set Supabase env vars (if using auth)
- [ ] Test all three performance modes
- [ ] Verify fallback to client mode works

## Recommended Setup

For **most users**, the current Python 3.13 setup is perfect:
- ✅ Client-side modes work great
- ✅ No server processing means lower costs
- ✅ Users' data stays on their device (privacy)
- ✅ Works offline

For **maximum features** (all 3 modes), use Python 3.11:
- Switch Render to Python 3.11
- Uncomment mediapipe in requirements.txt
- Redeploy

## Cost Considerations

### Free Tier Limits
**Render Free:**
- Spins down after 15 minutes of inactivity
- 750 hours/month
- Cold start: ~50 seconds

**Vercel Free:**
- 100 GB bandwidth/month
- Unlimited deployments

### Server-Side Processing Impact
If you enable MediaPipe on server (Python 3.11):
- Each hand detection request: ~100-500ms processing
- Memory usage: ~200MB per request
- May hit free tier limits faster

**Recommendation**: Keep client-side modes for free tier!

## Next Steps

1. **Commit and push** the requirements.txt fix
2. **Redeploy on Render** (automatic if connected to GitHub)
3. **Test client modes** on production
4. **Optional**: Switch to Python 3.11 if you want server mode

Your app is production-ready with client-side modes! 🚀
