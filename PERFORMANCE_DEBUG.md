# Performance Debugging Guide

## Quick Diagnostic Checklist

### 1. Browser Performance Tab
1. Open DevTools (F12)
2. Go to **Performance** tab
3. Click **Record** (red circle)
4. Use your app for 10 seconds
5. Stop recording
6. Look for:
   - **Long frames** (over 16ms = dropped frames)
   - **Yellow/red bars** in the flame chart
   - **Main thread activity** - what's taking the most time?

### 2. Check Frame Rate
Add this to your `CameraFeed.tsx` to measure actual FPS:

```typescript
// Add after line 27
const [fps, setFps] = useState(0);
const fpsCounterRef = useRef({ frames: 0, lastTime: Date.now() });

// Inside onResults callback (around line 41-66), add:
const fpsCounter = fpsCounterRef.current;
fpsCounter.frames++;
const now = Date.now();
if (now - fpsCounter.lastTime >= 1000) {
  setFps(fpsCounter.frames);
  fpsCounter.frames = 0;
  fpsCounter.lastTime = now;
}

// Display in UI (around line 149):
<Badge variant="outline">
  {fps} FPS
</Badge>
```

### 3. Check CPU Usage
- **Windows:** Task Manager → Performance → CPU
- **Mac:** Activity Monitor → CPU
- Browser should use **30-60%** of one core
- If **>80%**: You're CPU-bottlenecked

### 4. Check GPU Acceleration
In Chrome DevTools:
1. Type `chrome://gpu` in address bar
2. Check "Graphics Feature Status"
3. Ensure **WebGL** and **WebGL2** are "Hardware accelerated"
4. If not, update graphics drivers

### 5. Compare Browsers
Test in multiple browsers to isolate the issue:
- **Chrome/Edge:** Best WASM performance
- **Firefox:** Slower WASM, but better privacy
- **Safari:** Slowest for MediaPipe

## Expected Performance

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| FPS | 25-30 | 15-24 | <15 |
| Frame Time | <16ms | 16-33ms | >33ms |
| CPU Usage | 30-60% | 60-80% | >80% |
| Memory | <500MB | 500MB-1GB | >1GB |

## Common Bottlenecks

### MediaPipe WASM (Most Likely)
**Symptoms:** High CPU usage, low FPS
**Solutions:**
1. Lower video resolution to 480x360
2. Reduce frame rate to 24 FPS
3. Try `modelComplexity: 0` (already set)
4. Disable hand landmark drawing temporarily

### ONNX Inference
**Symptoms:** Stuttering every ~250ms
**Solutions:**
1. Increase throttle to 500ms
2. Disable inference temporarily to test
3. Check if WebGL execution provider is working

### Canvas Drawing
**Symptoms:** High FPS but choppy video
**Solutions:**
1. Reduce landmark drawing (skip some connections)
2. Use OffscreenCanvas for drawing
3. Reduce landmark circle size

### Memory Leak
**Symptoms:** Gets slower over time
**Solutions:**
1. Check DevTools → Memory → Take heap snapshot
2. Look for detached DOM nodes
3. Ensure MediaPipe cleanup is working

## Quick Fixes to Try

### Fix 1: Reduce Video Resolution
File: `frontend/lib/mediapipe.ts:83-86`

```typescript
width: { ideal: 480, max: 480 },   // was 640
height: { ideal: 360, max: 360 },  // was 480
frameRate: { ideal: 24, max: 24 }, // was 30
```

### Fix 2: Reduce Drawing Detail
File: `frontend/lib/mediapipe.ts:259-269`

```typescript
// Only draw every 3rd landmark
for (let i = 0; i < landmarks.length; i += 3) {
  const landmark = landmarks[i];
  ctx.beginPath();
  ctx.arc(landmark.x * canvasWidth, landmark.y * canvasHeight, 3, 0, 2 * Math.PI);
  ctx.fill();
}
```

### Fix 3: Disable Inference Temporarily
File: `frontend/app/practice/page.tsx:87-184`

Comment out the entire `handleHandDetection` function body and just draw hands:

```typescript
const handleHandDetection = async (results: MediaPipeResults) => {
  // Just show hand count
  const handCount = results.multiHandLandmarks?.length || 0;
  setDetectedSign(handCount > 0 ? 'Hand detected' : null);
};
```

If this makes it smooth, the bottleneck is ONNX inference.

### Fix 4: Try GPU Acceleration for ONNX
File: `frontend/lib/onnx-inference.ts` (around line with executionProviders)

Ensure WebGL is first:
```typescript
executionProviders: ['webgl', 'wasm']  // WebGL = GPU
```

## Comparison Test

To prove the difference between your app and handscript:

1. **Your app:** Real-time 30 FPS hand tracking
2. **Handscript:** 0.1 FPS (1 frame every 10 seconds)

Your app is doing **300x more work** per minute! The "lag" might actually be normal for client-side real-time tracking.

## Next Steps

1. Run Performance profiling (step 1 above)
2. Measure actual FPS (step 2 above)
3. Report findings:
   - What FPS are you getting?
   - What's the main thread bottleneck?
   - What's your CPU usage?
   - Which browser are you using?

Then we can target the specific bottleneck.
