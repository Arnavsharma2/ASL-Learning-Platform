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
 */
export async function startCamera(
  videoElement: HTMLVideoElement,
  hands: any,
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 },
  });

  videoElement.srcObject = stream;
  await videoElement.play();

  // Throttle frame processing to ~30fps to reduce lag when hands enter/exit
  let lastFrameTime = 0;
  const targetFPS = 30;
  const frameInterval = 1000 / targetFPS;
  let isProcessing = false;
  let animationFrameId: number | null = null;
  let shouldContinue = true;

  // Process frames with throttling
  const sendFrame = () => {
    // Check if still active and video is playing
    if (!videoElement.srcObject || !shouldContinue) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      return;
    }

    const now = performance.now();
    const elapsed = now - lastFrameTime;

    // Only process if enough time has passed and not already processing
    if (elapsed >= frameInterval && !isProcessing) {
      isProcessing = true;
      lastFrameTime = now;
      
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

    // Continue the loop - requestAnimationFrame naturally throttles to ~60fps
    // Our frameInterval check ensures we only process at 30fps
    if (shouldContinue) {
      animationFrameId = requestAnimationFrame(sendFrame);
    }
  };

  animationFrameId = requestAnimationFrame(sendFrame);
  
  // Store cleanup function on video element for later
  (videoElement as any).__stopFrameProcessing = () => {
    shouldContinue = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  return stream;
}

/**
 * Draw hand landmarks on canvas
 */
export function drawHands(
  canvasCtx: CanvasRenderingContext2D,
  results: MediaPipeResults,
  width: number,
  height: number
) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, width, height);

  // Draw the video frame
  if (results.image) {
    canvasCtx.drawImage(results.image, 0, 0, width, height);
  }

  // Only draw landmarks if hands are detected
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (const landmarks of results.multiHandLandmarks) {
      // Draw connections
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS);
      // Draw landmarks
      drawLandmarks(canvasCtx, landmarks);
    }
  }

  canvasCtx.restore();
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
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;

  for (const [start, end] of connections) {
    const startLandmark = landmarks[start];
    const endLandmark = landmarks[end];

    ctx.beginPath();
    ctx.moveTo(startLandmark.x * ctx.canvas.width, startLandmark.y * ctx.canvas.height);
    ctx.lineTo(endLandmark.x * ctx.canvas.width, endLandmark.y * ctx.canvas.height);
    ctx.stroke();
  }
}

function drawLandmarks(ctx: CanvasRenderingContext2D, landmarks: any[]) {
  for (const landmark of landmarks) {
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(
      landmark.x * ctx.canvas.width,
      landmark.y * ctx.canvas.height,
      5,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }
}
