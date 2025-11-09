// MediaPipe types
export interface HandLandmarks {
  x: number;
  y: number;
  z: number;
}

export interface HandDetectionResult {
  landmarks: HandLandmarks[][];
  multiHandedness: any[];
}

export interface MediaPipeResults {
  image: any;
  multiHandLandmarks?: any[];
  multiHandedness?: any[];
}

/**
 * Load MediaPipe Hands from CDN
 */
export async function loadMediaPipeHands(): Promise<any> {
  // Dynamically import from CDN
  if (typeof window === 'undefined') return null;

  // Load script if not already loaded
  if (!(window as any).Hands) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return (window as any).Hands;
}

/**
 * Initialize MediaPipe Hands detection
 */
export async function initializeHands(
  onResults: (results: MediaPipeResults) => void
): Promise<any> {
  const HandsConstructor = await loadMediaPipeHands();

  const hands = new HandsConstructor({
    locateFile: (file: string) => {
      // Use CDN with proper error handling
      const url = `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      return url;
    },
  });

  // Wait a bit for MediaPipe to fully initialize before setting options
  await new Promise(resolve => setTimeout(resolve, 100));

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 0, // Use lighter model (0 = fastest, 1 = balanced, 2 = most accurate)
    minDetectionConfidence: 0.7, // Slightly higher to reduce false positives
    minTrackingConfidence: 0.5,
  });

  hands.onResults(onResults);

  return hands;
}

/**
 * Start camera stream and process frames
 * Optimized for smooth performance using requestVideoFrameCallback when available
 */
export async function startCamera(
  videoElement: HTMLVideoElement,
  hands: any,
): Promise<MediaStream> {
  // Use lower resolution for better performance (can be increased if needed)
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { 
      width: { ideal: 640, max: 640 },
      height: { ideal: 480, max: 480 },
      frameRate: { ideal: 30, max: 30 },
      facingMode: 'user'
    },
  });

  videoElement.srcObject = stream;
  videoElement.playsInline = true;
  videoElement.muted = true;
  await videoElement.play();

  let shouldContinue = true;
  let frameCallbackId: number | null = null;
  let rafId: number | null = null;

  // Use requestVideoFrameCallback if available (much more efficient for video)
  // Falls back to requestAnimationFrame for compatibility
  const sendFrame = () => {
    if (!videoElement.srcObject || !shouldContinue || videoElement.readyState < 2) {
      return;
    }

    // Send frame to MediaPipe (non-blocking - MediaPipe handles queuing)
    hands.send({ image: videoElement }).catch((error: any) => {
      console.error('Error sending frame to MediaPipe:', error);
      const errorMsg = error?.message || error?.toString() || '';
      if (
        errorMsg.includes('resource') || 
        errorMsg.includes('wasm') || 
        errorMsg.includes('emscripten') ||
        errorMsg.includes('not found') ||
        errorMsg.includes('Failed to fetch')
      ) {
        console.error('MediaPipe resource error detected. Stopping frame processing.');
        shouldContinue = false;
        if (videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoElement.srcObject = null;
        }
      }
    });
  };

  // Check if requestVideoFrameCallback is available (Chrome 94+, Edge 94+)
  if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
    const processFrame = (now: number, metadata: any) => {
      if (!shouldContinue) return;
      sendFrame();
      frameCallbackId = (videoElement as any).requestVideoFrameCallback(processFrame);
    };
    frameCallbackId = (videoElement as any).requestVideoFrameCallback(processFrame);
  } else {
    // Fallback to requestAnimationFrame with throttling
    let lastFrameTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const rafLoop = () => {
      if (!shouldContinue) return;

      const now = performance.now();
      if (now - lastFrameTime >= frameInterval) {
        lastFrameTime = now;
        sendFrame();
      }

      rafId = requestAnimationFrame(rafLoop);
    };
    rafId = requestAnimationFrame(rafLoop);
  }
  
  // Store cleanup function on video element for later
  (videoElement as any).__stopFrameProcessing = () => {
    shouldContinue = false;
    if (frameCallbackId !== null && 'cancelVideoFrameCallback' in HTMLVideoElement.prototype) {
      (videoElement as any).cancelVideoFrameCallback(frameCallbackId);
      frameCallbackId = null;
    }
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return stream;
}

/**
 * Draw hand landmarks on canvas
 * Optimized for performance with batched drawing operations
 */
export function drawHands(
  canvasCtx: CanvasRenderingContext2D,
  results: MediaPipeResults,
  width: number,
  height: number
) {
  // Use requestAnimationFrame to decouple drawing from MediaPipe callback
  // This prevents blocking MediaPipe processing
  requestAnimationFrame(() => {
    // Clear canvas efficiently
    canvasCtx.clearRect(0, 0, width, height);

    // Draw the video frame
    if (results.image) {
      canvasCtx.drawImage(results.image, 0, 0, width, height);
    }

    // Only draw landmarks if hands are detected
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Batch all drawing operations for better performance
      canvasCtx.save();
      
      for (const landmarks of results.multiHandLandmarks) {
        // Draw connections and landmarks together
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS);
        drawLandmarks(canvasCtx, landmarks);
      }
      
      canvasCtx.restore();
    }
  });
}

// Hand connection lines (MediaPipe hand model)
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],  // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],  // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],  // Ring
  [0, 17], [17, 18], [18, 19], [19, 20],  // Pinky
  [5, 9], [9, 13], [13, 17],  // Palm
];

/**
 * Optimized connector drawing - batches all strokes
 */
function drawConnectors(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  connections: number[][]
) {
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  
  // Set style once for all strokes
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Batch all strokes in a single path for better performance
  ctx.beginPath();
  for (const [start, end] of connections) {
    const startLandmark = landmarks[start];
    const endLandmark = landmarks[end];

    ctx.moveTo(startLandmark.x * canvasWidth, startLandmark.y * canvasHeight);
    ctx.lineTo(endLandmark.x * canvasWidth, endLandmark.y * canvasHeight);
  }
  ctx.stroke();
}

/**
 * Optimized landmark drawing - batches all circles
 */
function drawLandmarks(ctx: CanvasRenderingContext2D, landmarks: any[]) {
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  
  // Set style once
  ctx.fillStyle = '#FF0000';

  // Batch all circles for better performance
  for (const landmark of landmarks) {
    ctx.beginPath();
    ctx.arc(
      landmark.x * canvasWidth,
      landmark.y * canvasHeight,
      5,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }
}
