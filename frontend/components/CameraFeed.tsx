'use client';

import { useEffect, useRef, useState } from 'react';
import { initializeHands, startCamera, drawHands, MediaPipeResults } from '@/lib/mediapipe';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CameraFeedProps {
  onHandDetected?: (results: MediaPipeResults) => void;
  width?: number;
  height?: number;
}

export function CameraFeed({
  onHandDetected,
  width = 640,
  height = 480
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handsDetected, setHandsDetected] = useState(0);
  const handsRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastHandCountRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) return;

    let isMounted = true;
    let hands: any = null;
    let stream: MediaStream | null = null;

    const initializeMediaPipe = async () => {
      try {
        if (!videoRef.current || !canvasRef.current || !isMounted) return;

        // Initialize MediaPipe Hands
        hands = await initializeHands((results: MediaPipeResults) => {
          if (!isMounted) return;

          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Draw the hands on canvas
          drawHands(ctx, results, width, height);

          // Only update state when hand count actually changes to avoid unnecessary re-renders
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

        if (!isMounted) {
          hands?.close();
          return;
        }

        handsRef.current = hands;

        // Start camera
        stream = await startCamera(videoRef.current, hands);

        if (!isMounted) {
          stream?.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        setError(null);
      } catch (err: any) {
        console.error('Error initializing MediaPipe:', err);
        if (isMounted) {
          const errorMsg = err?.message || err?.toString() || '';
          if (errorMsg.includes('resource') || errorMsg.includes('wasm') || errorMsg.includes('emscripten')) {
            setError('Failed to load MediaPipe resources. Please check your internet connection and try refreshing the page.');
          } else {
            setError('Failed to access camera. Please ensure camera permissions are granted.');
          }
          setIsActive(false);
        }
      }
    };

    initializeMediaPipe();

    return () => {
      // Cleanup
      isMounted = false;

      // Stop frame processing if cleanup function exists
      if (videoRef.current && (videoRef.current as any).__stopFrameProcessing) {
        (videoRef.current as any).__stopFrameProcessing();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch (e) {
          // Ignore errors during cleanup
        }
        handsRef.current = null;
      }

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (hands) {
        try {
          hands.close();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [isActive, width, height, onHandDetected]);

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
              <Badge variant={handsDetected > 0 ? "default" : "secondary"}>
                {handsDetected} {handsDetected === 1 ? 'hand' : 'hands'} detected
              </Badge>
            )}
            <Button onClick={toggleCamera} variant={isActive ? "destructive" : "default"}>
              {isActive ? 'Stop Camera' : 'Start Camera'}
            </Button>
          </div>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden" style={{ width, height }}>
          {/* Video element (hidden, used for processing) */}
          <video
            ref={videoRef}
            className="absolute top-0 left-0 opacity-0"
            style={{ width, height }}
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
        </div>

        {isActive && (
          <div className="text-sm text-gray-600">
            <p>Position your hand(s) in front of the camera to see tracking landmarks.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
