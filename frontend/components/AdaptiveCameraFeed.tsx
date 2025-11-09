'use client';

import { useEffect, useRef, useState } from 'react';
import { initializeHands, startCamera, drawHands, MediaPipeResults } from '@/lib/mediapipe';
import { handTrackingApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdaptiveCameraFeedProps {
  onHandDetected?: (results: MediaPipeResults) => void;
  width?: number;
  height?: number;
  useServerProcessing?: boolean;
  settings?: {
    video_resolution?: string;
    frame_rate?: number;
    model_complexity?: number;
    inference_throttle_ms?: number;
  };
}

export function AdaptiveCameraFeed({
  onHandDetected,
  width = 640,
  height = 480,
  useServerProcessing = false,
  settings
}: AdaptiveCameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handsDetected, setHandsDetected] = useState(0);
  const handsRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastHandCountRef = useRef<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const lastInferenceTimeRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

  // Parse resolution string to width/height
  const parseResolution = (resolution: string) => {
    const [w, h] = resolution.split('x').map(Number);
    return { width: w || width, height: h || height };
  };

  const resolution = settings?.video_resolution 
    ? parseResolution(settings.video_resolution)
    : { width, height };

  useEffect(() => {
    if (!isActive) return;

    let isMounted = true;
    let hands: any = null;
    let stream: MediaStream | null = null;

    const initializeClientSide = async () => {
      try {
        if (!videoRef.current || !canvasRef.current || !isMounted) return;

        // Initialize MediaPipe Hands with settings
        const modelComplexity = settings?.model_complexity ?? 0;
        const HandsConstructor = await (async () => {
          if (typeof window === 'undefined') return null;
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
        })();

        hands = new HandsConstructor({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: modelComplexity,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: MediaPipeResults) => {
          if (!isMounted) return;

          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d', { 
            willReadFrequently: false
          });
          if (!ctx) return;

          drawHands(ctx, results, resolution.width, resolution.height);

          const currentHandCount = results.multiHandLandmarks?.length || 0;
          if (currentHandCount !== lastHandCountRef.current) {
            lastHandCountRef.current = currentHandCount;
            setHandsDetected(currentHandCount);
          }

          if (onHandDetected && results.multiHandLandmarks) {
            onHandDetected(results);
          }
        });

        if (!isMounted) {
          hands?.close();
          return;
        }

        handsRef.current = hands;

        // Start camera with settings
        const frameRate = settings?.frame_rate ?? 30;
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: resolution.width, max: resolution.width },
            height: { ideal: resolution.height, max: resolution.height },
            frameRate: { ideal: frameRate, max: frameRate },
            facingMode: 'user'
          },
        });

        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        await videoRef.current.play();

        // Use requestVideoFrameCallback if available
        if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
          const processFrame = () => {
            if (!isMounted || !videoRef.current || !hands) return;
            hands.send({ image: videoRef.current });
            (videoRef.current as any).requestVideoFrameCallback(processFrame);
          };
          (videoRef.current as any).requestVideoFrameCallback(processFrame);
        } else {
          // Fallback to requestAnimationFrame
          let lastFrameTime = 0;
          const frameInterval = 1000 / frameRate;
          const rafLoop = () => {
            if (!isMounted || !videoRef.current || !hands) return;
            const now = performance.now();
            if (now - lastFrameTime >= frameInterval) {
              lastFrameTime = now;
              hands.send({ image: videoRef.current });
            }
            requestAnimationFrame(rafLoop);
          };
          requestAnimationFrame(rafLoop);
        }

        if (!isMounted) {
          stream?.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        setError(null);
      } catch (err: any) {
        console.error('Error initializing client-side MediaPipe:', err);
        if (isMounted) {
          setError('Failed to access camera. Please ensure camera permissions are granted.');
          setIsActive(false);
        }
      }
    };

    const initializeServerSide = async () => {
      try {
        if (!videoRef.current || !canvasRef.current || !isMounted) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const wsUrl = API_URL.replace('http://', 'ws://').replace('https://', 'wss://');
        const ws = new WebSocket(`${wsUrl}/api/hand-tracking/ws/process-stream`);

        ws.onopen = () => {
          console.log('WebSocket connected for server-side processing');
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          const data = JSON.parse(event.data);
          
          if (data.error) {
            console.error('Server processing error:', data.error);
            return;
          }

          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d', { 
            willReadFrequently: false
          });
          if (!ctx) return;

          // Draw video frame
          ctx.clearRect(0, 0, resolution.width, resolution.height);
          if (videoRef.current) {
            ctx.drawImage(videoRef.current, 0, 0, resolution.width, resolution.height);
          }

          // Draw landmarks if available
          if (data.landmarks && data.landmarks.length > 0) {
            const handCount = data.hand_count || 0;
            if (handCount !== lastHandCountRef.current) {
              lastHandCountRef.current = handCount;
              setHandsDetected(handCount);
            }

            // Convert server landmarks to MediaPipeResults format
            const results: MediaPipeResults = {
              image: videoRef.current,
              multiHandLandmarks: data.landmarks.map((hand: number[][]) => 
                hand.map(([x, y, z]) => ({ x, y, z }))
              )
            };

            drawHands(ctx, results, resolution.width, resolution.height);

            if (onHandDetected) {
              onHandDetected(results);
            }
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (isMounted) {
            setError('Failed to connect to server for processing. Falling back to client-side.');
            // Fallback to client-side
            initializeClientSide();
          }
        };

        ws.onclose = () => {
          console.log('WebSocket closed');
        };

        wsRef.current = ws;

        // Start camera
        const frameRate = settings?.frame_rate ?? 30;
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: resolution.width, max: resolution.width },
            height: { ideal: resolution.height, max: resolution.height },
            frameRate: { ideal: frameRate, max: frameRate },
            facingMode: 'user'
          },
        });

        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        await videoRef.current.play();

        // Send frames to server via WebSocket
        const throttleMs = settings?.inference_throttle_ms ?? 250;
        const sendFrame = () => {
          if (!isMounted || !videoRef.current || !ws || ws.readyState !== WebSocket.OPEN) return;

          const now = Date.now();
          if (now - lastInferenceTimeRef.current < throttleMs || isProcessingRef.current) {
            requestAnimationFrame(sendFrame);
            return;
          }

          isProcessingRef.current = true;
          lastInferenceTimeRef.current = now;

          // Capture frame from video
          const canvas = document.createElement('canvas');
          canvas.width = resolution.width;
          canvas.height = resolution.height;
          const ctx = canvas.getContext('2d');
          if (ctx && videoRef.current) {
            ctx.drawImage(videoRef.current, 0, 0, resolution.width, resolution.height);
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            const base64Data = imageData.split(',')[1];

            ws.send(JSON.stringify({
              image_data: base64Data,
              timestamp: now
            }));
          }

          isProcessingRef.current = false;
          requestAnimationFrame(sendFrame);
        };

        requestAnimationFrame(sendFrame);
        streamRef.current = stream;
        setError(null);
      } catch (err: any) {
        console.error('Error initializing server-side processing:', err);
        if (isMounted) {
          setError('Failed to access camera. Please ensure camera permissions are granted.');
          setIsActive(false);
        }
      }
    };

    if (useServerProcessing) {
      initializeServerSide();
    } else {
      initializeClientSide();
    }

    return () => {
      isMounted = false;

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

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
  }, [isActive, useServerProcessing, settings, resolution.width, resolution.height, onHandDetected]);

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
                <Badge variant={useServerProcessing ? "default" : "secondary"}>
                  {useServerProcessing ? 'Server' : 'Client'}
                </Badge>
                <Badge variant={handsDetected > 0 ? "default" : "secondary"}>
                  {handsDetected} {handsDetected === 1 ? 'hand' : 'hands'} detected
                </Badge>
              </>
            )}
            <Button onClick={toggleCamera} variant={isActive ? "destructive" : "default"}>
              {isActive ? 'Stop Camera' : 'Start Camera'}
            </Button>
          </div>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden" style={{ width: resolution.width, height: resolution.height }}>
          <video
            ref={videoRef}
            className="absolute top-0 left-0 opacity-0"
            style={{ 
              width: resolution.width, 
              height: resolution.height,
              transform: 'translateZ(0)',
              pointerEvents: 'none'
            }}
            playsInline
            muted
          />

          <canvas
            ref={canvasRef}
            width={resolution.width}
            height={resolution.height}
            className="absolute top-0 left-0"
            style={{ 
              transform: 'translateZ(0)'
            }}
          />

          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <p className="text-lg mb-2">Camera is off</p>
                <p className="text-sm text-gray-400">Click "Start Camera" to begin</p>
              </div>
            </div>
          )}

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
            <p className="text-xs text-gray-500 mt-1">
              Mode: {useServerProcessing ? 'Server-side processing' : 'Client-side processing'}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

