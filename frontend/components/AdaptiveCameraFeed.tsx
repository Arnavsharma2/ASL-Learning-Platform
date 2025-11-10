'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { initializeHands, startCamera, drawHands, MediaPipeResults } from '@/lib/mediapipe';
import { detectHandsOnServer, convertServerLandmarksToMediaPipe } from '@/lib/serverHandDetection';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/contexts/SettingsContext';
import { Zap, Wifi, WifiOff } from 'lucide-react';

// Hand connection lines (MediaPipe hand model)
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],  // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],  // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],  // Ring
  [0, 17], [17, 18], [18, 19], [19, 20],  // Pinky
  [5, 9], [9, 13], [13, 17],  // Palm
];

// Helper function to draw connectors
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

  ctx.beginPath();
  for (const [start, end] of connections) {
    const startLandmark = landmarks[start];
    const endLandmark = landmarks[end];
    ctx.moveTo(startLandmark.x * canvasWidth, startLandmark.y * canvasHeight);
    ctx.lineTo(endLandmark.x * canvasWidth, endLandmark.y * canvasHeight);
  }
  ctx.stroke();
}

// Helper function to draw landmarks only (no clear, no video redraw)
function drawLandmarksOnly(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  width: number,
  height: number
) {
  ctx.fillStyle = '#FF0000';

  for (const landmark of landmarks) {
    ctx.beginPath();
    ctx.arc(
      landmark.x * width,
      landmark.y * height,
      5,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }
}

interface AdaptiveCameraFeedProps {
  onHandDetected?: (results: MediaPipeResults) => void;
  width?: number;
  height?: number;
}

export function AdaptiveCameraFeed({
  onHandDetected,
  width = 640,
  height = 480
}: AdaptiveCameraFeedProps) {
  const { settings } = useSettings();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handsDetected, setHandsDetected] = useState(0);
  const [serverError, setServerError] = useState(false);
  const handsRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastHandCountRef = useRef<number>(0);
  const serverIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const serverErrorCountRef = useRef<number>(0);
  const currentLandmarksRef = useRef<any[] | null>(null); // Store current landmarks for continuous drawing

  // Always use client mode (balanced) - server mode disabled
  const isServerMode = false;

  // Client-side real-time processing
  const initializeClientMode = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      // Initialize MediaPipe Hands
      const hands = await initializeHands((results: MediaPipeResults) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw the hands on canvas - pass video element to ensure video is always drawn
        drawHands(ctx, results, width, height, videoRef.current || undefined);

        // Update hand count
        const currentHandCount = results.multiHandLandmarks?.length || 0;
        if (currentHandCount !== lastHandCountRef.current) {
          lastHandCountRef.current = currentHandCount;
          setHandsDetected(currentHandCount);
        }

        // Callback for hand detection
        if (onHandDetected && results.multiHandLandmarks) {
          onHandDetected(results);
        }
      });

      if (!videoRef.current) return;

      handsRef.current = hands;

      // Start camera with continuous video drawing
      const stream = await startCamera(videoRef.current, hands, canvasRef.current);
      streamRef.current = stream;
      setError(null);
    } catch (err: any) {
      console.error('Error initializing client mode:', err);

      // Ignore errors that happen during cleanup/unmount
      const errorMsg = err?.message || '';
      if (errorMsg.includes('interrupted') || errorMsg.includes('AbortError')) {
        return; // Component is unmounting, ignore
      }

      setError('Failed to access camera or load MediaPipe');
      setIsActive(false);
    }
  }, [width, height, onHandDetected]);

  // Server-side snapshot processing
  const initializeServerMode = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      // Just start the camera without MediaPipe
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width, height },
      });

      if (!videoRef.current) return;

      videoRef.current.srcObject = stream;
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;

      try {
        await videoRef.current.play();
      } catch (playError: any) {
        // Ignore "interrupted by new load" errors during cleanup
        if (!playError.message?.includes('interrupted')) {
          throw playError;
        }
      }

      streamRef.current = stream;

      // Draw video continuously on canvas (maximum speed - no throttling)
      let animationFrameId: number | null = null;

      const drawVideoFrame = () => {
        if (!videoRef.current || !canvasRef.current) {
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
          return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw video frame
          ctx.drawImage(videoRef.current, 0, 0, width, height);

          // Hand landmarks are not drawn - only video is displayed
          // (Landmarks are still detected and used for recognition, just not visualized)
        }

        animationFrameId = requestAnimationFrame(drawVideoFrame);
      };
      animationFrameId = requestAnimationFrame(drawVideoFrame);

      // Store cleanup function for video drawing
      (videoRef.current as any).__stopVideoDrawing = () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      };

      // Process frames periodically (like the other repo - every few seconds)
      const processServerFrame = () => {
        if (!videoRef.current || !canvasRef.current) return;

        // Run detection asynchronously without blocking
        (async () => {
          try {
            // Capture current frame - check video ref again inside async
            const video = videoRef.current;
            if (!video) return;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;

            tempCtx.drawImage(video, 0, 0, width, height);
            const imageDataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);

            // Send to server for detection
            const response = await detectHandsOnServer(imageDataUrl, false);

          // Update hand count
          const currentHandCount = response?.hand_count || 0;
          if (currentHandCount !== lastHandCountRef.current) {
            lastHandCountRef.current = currentHandCount;
            setHandsDetected(currentHandCount);
          }

          // If server returns landmarks, store them for continuous drawing
          if (response && response.hand_count > 0) {
            // Convert to MediaPipe format
            const mediaPipeResults = convertServerLandmarksToMediaPipe(response.landmarks);

            // Store landmarks for the drawing loop to use
            if (mediaPipeResults.multiHandLandmarks?.length > 0) {
              currentLandmarksRef.current = mediaPipeResults.multiHandLandmarks;
            }

            // Callback
            if (onHandDetected) {
              const video = videoRef.current;
              if (video) {
                onHandDetected({
                  image: video,
                  ...mediaPipeResults
                });
              }
            }
          } else {
            // No hands detected, clear landmarks
            currentLandmarksRef.current = null;
          }
          } catch (err: any) {
            console.error('Server frame processing error:', err);
            serverErrorCountRef.current += 1;

            // If server is unavailable, show helpful error after 3 failed attempts
            if (serverErrorCountRef.current >= 3 && !serverError) {
              setServerError(true);
              console.warn('Server unavailable - hand detection requires backend with OpenCV/MediaPipe');
              console.warn('Falling back to client-side mode recommended');
            }
          }
        })(); // Execute async immediately
      };

      // Process every 2 seconds for smoothness (more frequent than the 10s in the other repo)
      serverIntervalRef.current = setInterval(processServerFrame, 2000);

      // Do first detection immediately
      processServerFrame();

      setError(null);
    } catch (err: any) {
      console.error('Error initializing server mode:', err);
      setError('Failed to access camera');
      setIsActive(false);
    }
  }, [width, height, onHandDetected]);

  // Initialize based on mode
  useEffect(() => {
    if (!isActive) return;

    let isMounted = true;
    let cleanupCalled = false;

    const initialize = async () => {
      // Small delay to prevent race conditions during mode switching
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!isMounted || cleanupCalled) return;

      if (isServerMode) {
        await initializeServerMode();
      } else {
        await initializeClientMode();
      }
    };

    initialize();

    return () => {
      // Cleanup
      isMounted = false;
      cleanupCalled = true;

      // Stop server interval
      if (serverIntervalRef.current) {
        clearInterval(serverIntervalRef.current);
        serverIntervalRef.current = null;
      }

      // Stop frame processing
      if (videoRef.current && (videoRef.current as any).__stopFrameProcessing) {
        (videoRef.current as any).__stopFrameProcessing();
      }

      // Stop video drawing (for server mode)
      if (videoRef.current && (videoRef.current as any).__stopVideoDrawing) {
        (videoRef.current as any).__stopVideoDrawing();
      }

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Close MediaPipe
      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch (e) {
          // Ignore
        }
        handsRef.current = null;
      }
    };
  }, [isActive, isServerMode, initializeClientMode, initializeServerMode]);

  const toggleCamera = () => {
    setIsActive(!isActive);
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Camera Feed</h3>
          <div className="flex items-center gap-2">
            {isActive && (
              <>
                <Badge variant={handsDetected > 0 ? "default" : "secondary"}>
                  {handsDetected} {handsDetected === 1 ? 'hand' : 'hands'} detected
                </Badge>
                <Badge variant="outline" className="gap-1">
                  {isServerMode ? (
                    <>
                      <Wifi className="w-3 h-3" />
                      Server Mode
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3" />
                      Client Mode
                    </>
                  )}
                </Badge>
              </>
            )}
            <Button onClick={toggleCamera} variant={isActive ? "destructive" : "default"}>
              {isActive ? 'Stop Camera' : 'Start Camera'}
            </Button>
          </div>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden" style={{ width, height }}>
          {/* Video element */}
          <video
            ref={videoRef}
            className={`absolute top-0 left-0 ${isServerMode ? '' : 'opacity-0'}`}
            style={{ width, height }}
            playsInline
            muted
          />

          {/* Canvas for drawing hand landmarks */}
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute top-0 left-0"
          />

          {/* Placeholder when camera is off */}
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <p className="text-lg mb-2">Camera is off</p>
                <p className="text-sm text-gray-400">Click "Start Camera" to begin</p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90 text-white p-4">
              <div className="text-center">
                <p className="font-semibold mb-2">Camera Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Server error warning */}
          {serverError && !error && (
            <div className="absolute bottom-0 left-0 right-0 bg-yellow-900 bg-opacity-90 text-white p-3">
              <div className="text-center">
                <p className="font-semibold text-sm mb-1">Server Unavailable</p>
                <p className="text-xs">Hand detection server is not responding. Switch to Balanced or Max Accuracy mode in Settings.</p>
              </div>
            </div>
          )}
        </div>

        {isActive && (
          <div className="text-sm text-gray-600">
            <p>
              {isServerMode
                ? 'Using server-side processing for maximum smoothness (snapshots every 2 seconds)'
                : 'Using client-side real-time tracking for maximum accuracy'}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
