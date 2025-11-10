'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { initializeHands, startCamera, drawHands, MediaPipeResults } from '@/lib/mediapipe';
import { detectHandsOnServer, convertServerLandmarksToMediaPipe } from '@/lib/serverHandDetection';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/contexts/SettingsContext';
import { Zap, Wifi, WifiOff } from 'lucide-react';

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

  const isServerMode = settings.mode === 'max_performance';

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

        // Draw the hands on canvas
        drawHands(ctx, results, width, height);

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

      // Start camera
      const stream = await startCamera(videoRef.current, hands);
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

      // Draw video continuously on canvas (60 FPS)
      let animationFrameId: number | null = null;
      const drawVideoFrame = () => {
        if (!videoRef.current || !canvasRef.current) {
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
          return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, width, height);
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
      const processServerFrame = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        try {
          // Capture current frame
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) return;

          tempCtx.drawImage(videoRef.current, 0, 0, width, height);
          const imageDataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);

          // Send to server for detection
          const response = await detectHandsOnServer(imageDataUrl, false);

          // Update hand count
          const currentHandCount = response?.hand_count || 0;
          if (currentHandCount !== lastHandCountRef.current) {
            lastHandCountRef.current = currentHandCount;
            setHandsDetected(currentHandCount);
          }

          // If server returns landmarks, draw them
          if (response && response.hand_count > 0) {
            // Convert to MediaPipe format
            const mediaPipeResults = convertServerLandmarksToMediaPipe(response.landmarks);

            // Get canvas context
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Draw landmarks on top of video
            if (mediaPipeResults.multiHandLandmarks?.length > 0) {
              drawHands(ctx, {
                image: videoRef.current,
                ...mediaPipeResults
              }, width, height);
            }

            // Callback
            if (onHandDetected) {
              onHandDetected({
                image: videoRef.current,
                ...mediaPipeResults
              });
            }
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
                <p className="font-semibold text-sm mb-1">⚠️ Server Unavailable</p>
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
