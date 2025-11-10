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
  // MediaPipe WASM needs time to load and initialize
  await new Promise(resolve => setTimeout(resolve, 200));

  hands.setOptions({
    maxNumHands: 1, // Optimize: only track 1 hand for ASL recognition (was 2)
    modelComplexity: 0, // Use lighter model (0 = fastest, 1 = balanced, 2 = most accurate)
    minDetectionConfidence: 0.7, // Slightly higher to reduce false positives
    minTrackingConfidence: 0.5,
  });

  hands.onResults(onResults);

  // Wait a bit more to ensure MediaPipe is fully ready to process frames
  await new Promise(resolve => setTimeout(resolve, 100));

  // Mark as initialized to prevent reuse after close
  (hands as any).__isInitialized = true;
  (hands as any).__isClosed = false;

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

  // Wait for video to be ready with valid dimensions before starting frame processing
  // This prevents "memory access out of bounds" errors
  await new Promise<void>((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 100; // 5 seconds max wait (100 * 50ms)
    const checkReady = () => {
      attempts++;
      if (videoElement.readyState >= 2 && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error('Video element failed to become ready'));
      } else {
        // Check again after a short delay
        setTimeout(checkReady, 50);
      }
    };
    checkReady();
  });

  // Keep MediaPipe at 30 FPS for smooth hand detection
  // We'll throttle the inference separately
  const FRAME_THROTTLE_MS = 33; // ~30 FPS
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

    // Validate video element is ready before processing
    // This prevents "memory access out of bounds" errors
    const videoReady = videoElement.readyState >= 2; // HAVE_CURRENT_DATA or higher
    const hasValidDimensions = videoElement.videoWidth > 0 && videoElement.videoHeight > 0;
    
    if (!videoReady || !hasValidDimensions) {
      // Video not ready yet, continue loop but don't process
      if (shouldContinue) {
        animationFrameId = requestAnimationFrame(sendFrame);
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

      // Double-check video is still valid before sending
      if (videoElement.readyState < 2 || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        isProcessing = false;
        if (shouldContinue) {
          animationFrameId = requestAnimationFrame(sendFrame);
        }
        return;
      }

      // Check if hands instance is still valid before sending
      if ((hands as any).__isClosed) {
        console.warn('MediaPipe instance was closed, stopping frame processing');
        shouldContinue = false;
        isProcessing = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        return;
      }

      // Process frame asynchronously with timeout protection
      // If MediaPipe hangs, reset isProcessing after 1 second to prevent blocking
      const frameProcessingStartTime = Date.now();
      const frameTimeout = setTimeout(() => {
        if (isProcessing && Date.now() - frameProcessingStartTime > 1000) {
          console.warn('[MediaPipe] Frame processing timeout - resetting isProcessing flag');
          isProcessing = false;
        }
      }, 1000);

      hands.send({ image: videoElement })
        .catch((error: any) => {
          console.error('[MediaPipe] Error sending frame:', error);
          // Stop processing on resource/loading errors or deleted object errors
          const errorMsg = error?.message || error?.toString() || '';
          if (
            errorMsg.includes('resource') ||
            errorMsg.includes('wasm') ||
            errorMsg.includes('emscripten') ||
            errorMsg.includes('not found') ||
            errorMsg.includes('Failed to fetch') ||
            errorMsg.includes('memory access out of bounds') ||
            errorMsg.includes('RuntimeError') ||
            errorMsg.includes('deleted object') ||
            errorMsg.includes('BindingError')
          ) {
            console.error('[MediaPipe] Fatal error detected. Stopping frame processing.');
            shouldContinue = false;
            if (animationFrameId) {
              cancelAnimationFrame(animationFrameId);
              animationFrameId = null;
            }
            // Mark as closed to prevent reuse
            (hands as any).__isClosed = true;
            // Clear video source to stop the stream
            if (videoElement.srcObject) {
              const stream = videoElement.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
              videoElement.srcObject = null;
            }
          }
        })
        .finally(() => {
          clearTimeout(frameTimeout);
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
  height: number,
  videoElement?: HTMLVideoElement
) {
  canvasCtx.save();
  
  // Determine if we have a video frame to draw
  const hasVideoFrame = (videoElement && videoElement.readyState >= 2) || !!results.image;
  
  // Only clear if we have a new video frame to draw - prevents black screen during processing
  if (hasVideoFrame) {
    canvasCtx.clearRect(0, 0, width, height);
    
    // Draw the video frame - prefer videoElement (more reliable), fallback to results.image
    if (videoElement && videoElement.readyState >= 2) {
      // Video is loaded and has data - draw directly from video element
      canvasCtx.drawImage(videoElement, 0, 0, width, height);
    } else if (results.image) {
      // Fallback to image from results
      canvasCtx.drawImage(results.image, 0, 0, width, height);
    }
  }
  // If no video frame available, don't clear - keep previous frame visible to prevent black screen

  // Skip drawing landmarks to improve performance
  // The hand detection still works, we just don't visualize it
  // if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
  //   for (const landmarks of results.multiHandLandmarks) {
  //     drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS);
  //     drawLandmarks(canvasCtx, landmarks);
  //   }
  // }

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
