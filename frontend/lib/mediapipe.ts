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
    maxNumHands: 1, // Optimize: only track 1 hand for ASL recognition (was 2)
    modelComplexity: 0, // Use lighter model (0 = fastest, 1 = balanced, 2 = most accurate)
    minDetectionConfidence: 0.7, // Slightly higher to reduce false positives
    minTrackingConfidence: 0.5,
  });

  hands.onResults(onResults);

  return hands;
}

/**
 * Start camera stream and process frames
 */
export async function startCamera(
  videoElement: HTMLVideoElement,
  hands: any,
  canvasElement?: HTMLCanvasElement,
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 },
  });

  videoElement.srcObject = stream;
  await videoElement.play();

  // Continuous video drawing loop - ensures video is always displayed regardless of MediaPipe processing
  let videoDrawAnimationId: number | null = null;
  let shouldDrawVideo = true;

  if (canvasElement) {
    const drawVideoContinuously = () => {
      if (!videoElement.srcObject || !shouldDrawVideo || !canvasElement) {
        if (videoDrawAnimationId) {
          cancelAnimationFrame(videoDrawAnimationId);
          videoDrawAnimationId = null;
        }
        return;
      }

      const ctx = canvasElement.getContext('2d');
      if (ctx && videoElement.readyState >= 2) {
        // Continuously draw video frame - this runs independently of MediaPipe
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      }

      if (shouldDrawVideo) {
        videoDrawAnimationId = requestAnimationFrame(drawVideoContinuously);
      }
    };
    videoDrawAnimationId = requestAnimationFrame(drawVideoContinuously);
  }

  // Performance optimization: limit MediaPipe to ~20 FPS (50ms between frames)
  // This prevents overwhelming the GPU/CPU while still feeling responsive
  const FRAME_THROTTLE_MS = 50;
  let isProcessing = false;
  let animationFrameId: number | null = null;
  let shouldContinue = true;
  let lastFrameTime = 0;

  // Process frames with throttling for better performance
  const sendFrame = (currentTime: number) => {
    // Check if still active and video is playing
    if (!videoElement.srcObject || !shouldContinue) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      return;
    }

    // Throttle frame processing - only process if enough time has passed
    const timeSinceLastFrame = currentTime - lastFrameTime;
    const shouldProcess = timeSinceLastFrame >= FRAME_THROTTLE_MS;

    // Process frame if not already processing AND enough time has passed
    if (!isProcessing && shouldProcess) {
      isProcessing = true;
      lastFrameTime = currentTime;

      // Process frame asynchronously
      hands.send({ image: videoElement })
        .catch((error: any) => {
          console.error('Error sending frame to MediaPipe:', error);
          // Stop processing on resource/loading errors to prevent infinite loop
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
            if (animationFrameId) {
              cancelAnimationFrame(animationFrameId);
              animationFrameId = null;
            }
            // Clear video source to stop the stream
            if (videoElement.srcObject) {
              const stream = videoElement.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
              videoElement.srcObject = null;
            }
          }
        })
        .finally(() => {
          isProcessing = false;
        });
    }

    // Continue the loop at maximum speed
    if (shouldContinue) {
      animationFrameId = requestAnimationFrame(sendFrame);
    }
  };

  animationFrameId = requestAnimationFrame(sendFrame);
  
  // Store cleanup function on video element for later
  (videoElement as any).__stopFrameProcessing = () => {
    shouldContinue = false;
    shouldDrawVideo = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (videoDrawAnimationId) {
      cancelAnimationFrame(videoDrawAnimationId);
      videoDrawAnimationId = null;
    }
  };

  return stream;
}

/**
 * Draw hand landmarks on canvas
 * Note: Video is now drawn continuously in a separate loop for 100% uptime.
 * This function is kept for compatibility but video drawing is handled elsewhere.
 */
export function drawHands(
  canvasCtx: CanvasRenderingContext2D,
  results: MediaPipeResults,
  width: number,
  height: number,
  videoElement?: HTMLVideoElement
) {
  // Video is drawn continuously in startCamera() for 100% uptime
  // This function is kept for compatibility but doesn't need to draw video
  // Hand landmarks and connections are not drawn - only video is displayed
  // (Landmarks are still detected and used for recognition, just not visualized)
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

function drawConnectors(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  connections: number[][]
) {
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

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

function drawLandmarks(ctx: CanvasRenderingContext2D, landmarks: any[]) {
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  ctx.fillStyle = '#FF0000';

  // Draw all landmarks (more efficient than creating path for each)
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
