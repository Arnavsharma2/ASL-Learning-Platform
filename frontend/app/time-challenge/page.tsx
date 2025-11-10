'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { initializeHands, startCamera, drawHands, MediaPipeResults } from '@/lib/mediapipe';
import onnxInference from '@/lib/onnx-inference';
import { HandLandmarks } from '@/lib/mediapipe';
import { Zap, Trophy, Clock, Target } from 'lucide-react';

type ChallengeMode = 'setup' | 'countdown' | 'challenge' | 'results';

export default function TimeChallengePage() {
  // Mode and configuration
  const [mode, setMode] = useState<ChallengeMode>('setup');
  const [numLetters, setNumLetters] = useState<number>(10);

  // Challenge state
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [challengeLetters, setChallengeLetters] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [finalTime, setFinalTime] = useState<number>(0);

  // Countdown state
  const [countdownValue, setCountdownValue] = useState<number>(3);

  // Camera and CV state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');

  // Recognition state
  const [detectedSign, setDetectedSign] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const lastInferenceRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);
  const INFERENCE_THROTTLE_MS = 100; // 10 FPS

  // Timeout state (15 seconds per letter)
  const [letterStartTime, setLetterStartTime] = useState<number>(0);
  const [showHint, setShowHint] = useState(false);
  const [hintTimer, setHintTimer] = useState<number>(0);
  const LETTER_TIMEOUT_MS = 15000; // 15 seconds
  const HINT_DISPLAY_MS = 5000; // 5 seconds

  // Timer update effect
  useEffect(() => {
    if (mode === 'challenge' && !showHint) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 10); // Update every 10ms for smooth display

      return () => clearInterval(interval);
    }
  }, [mode, startTime, showHint]);

  // Letter timeout checker
  useEffect(() => {
    if (mode === 'challenge' && letterStartTime > 0 && !showHint) {
      const checkTimeout = setInterval(() => {
        const timeSinceLetterStart = Date.now() - letterStartTime;

        if (timeSinceLetterStart >= LETTER_TIMEOUT_MS) {
          // Show hint for 5 seconds
          setShowHint(true);
          setHintTimer(5);

          const hintCountdown = setInterval(() => {
            setHintTimer(prev => {
              if (prev <= 1) {
                clearInterval(hintCountdown);
                setShowHint(false);
                // Move to next letter
                moveToNextLetter();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          clearInterval(checkTimeout);
        }
      }, 100);

      return () => clearInterval(checkTimeout);
    }
  }, [mode, letterStartTime, showHint]);

  // Load ONNX model
  useEffect(() => {
    const loadModel = async () => {
      try {
        await onnxInference.loadModel();
        setModelLoading(false);
      } catch (err) {
        console.error('Failed to load model:', err);
        setModelLoading(false);
      }
    };
    loadModel();
  }, []);

  // Generate random letters for challenge
  const generateChallenge = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const letters: string[] = [];
    for (let i = 0; i < numLetters; i++) {
      const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
      letters.push(randomLetter);
    }
    setChallengeLetters(letters);
  };

  // Start challenge
  const startChallenge = async () => {
    generateChallenge();
    setCameraError('');

    // Start camera first and wait for it to be fully ready
    if (!cameraActive) {
      setCameraLoading(true);
      const success = await initializeCamera();
      setCameraLoading(false);

      if (!success) {
        setCameraError('Failed to initialize camera. Please check permissions and try again.');
        return;
      }

      // Wait an extra moment for camera to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Now start countdown
    setMode('countdown');
    setCountdownValue(3);

    // Countdown
    const countdownInterval = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Start the actual challenge
          setMode('challenge');
          setStartTime(Date.now());
          setLetterStartTime(Date.now());
          setCurrentLetterIndex(0);
          setElapsedTime(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Initialize camera
  const initializeCamera = async (): Promise<boolean> => {
    if (!videoRef.current || !canvasRef.current) return false;

    try {
      const hands = await initializeHands(handleHandDetection);
      handsRef.current = hands;

      const stream = await startCamera(videoRef.current, hands);
      streamRef.current = stream;
      setCameraActive(true);
      return true;
    } catch (err) {
      console.error('Failed to initialize camera:', err);
      setCameraError(err instanceof Error ? err.message : 'Camera initialization failed');
      return false;
    }
  };

  // Handle hand detection and recognition
  const handleHandDetection = useCallback(async (results: MediaPipeResults) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw hands
    drawHands(ctx, results, 640, 480, videoRef.current || undefined);

    // Only run recognition during active challenge
    if (mode !== 'challenge' || showHint) return;

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      setDetectedSign('No hand detected');
      setConfidence(0);
      return;
    }

    if (!onnxInference.isModelLoaded()) {
      setDetectedSign('Model loading...');
      return;
    }

    // Throttle inference
    const now = Date.now();
    if (now - lastInferenceRef.current < INFERENCE_THROTTLE_MS) {
      return;
    }

    if (isProcessingRef.current) {
      return;
    }

    lastInferenceRef.current = now;
    isProcessingRef.current = true;

    try {
      const landmarks = results.multiHandLandmarks[0];
      const landmarksArray = (landmarks as HandLandmarks[]).map((lm: HandLandmarks) => [lm.x, lm.y, lm.z]);

      const prediction = await onnxInference.predict(landmarksArray);

      setDetectedSign(prediction.sign);
      setConfidence(prediction.confidence);

      // Check if detected sign matches target
      const targetLetter = challengeLetters[currentLetterIndex];
      if (prediction.sign === targetLetter && prediction.confidence >= 0.80) {
        // Correct sign detected! Move to next letter
        moveToNextLetter();
      }
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      isProcessingRef.current = false;
    }
  }, [mode, challengeLetters, currentLetterIndex, showHint]);

  // Move to next letter
  const moveToNextLetter = () => {
    const nextIndex = currentLetterIndex + 1;

    if (nextIndex >= challengeLetters.length) {
      // Challenge complete!
      const totalTime = Date.now() - startTime;
      setFinalTime(totalTime);
      setMode('results');
      stopCamera();
    } else {
      // Move to next letter
      setCurrentLetterIndex(nextIndex);
      setLetterStartTime(Date.now());
      setShowHint(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (handsRef.current) {
      try {
        handsRef.current.close();
      } catch (e) {
        // Ignore
      }
      handsRef.current = null;
    }
    if (videoRef.current && (videoRef.current as any).__stopFrameProcessing) {
      (videoRef.current as any).__stopFrameProcessing();
    }
    setCameraActive(false);
  };

  // Reset challenge
  const resetChallenge = () => {
    setMode('setup');
    setCurrentLetterIndex(0);
    setChallengeLetters([]);
    setElapsedTime(0);
    setFinalTime(0);
    setDetectedSign('');
    setConfidence(0);
    setShowHint(false);
    stopCamera();
  };

  // Format time (milliseconds to MM:SS.CS)
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-light mb-2 relative inline-block">
              Time Challenge
              <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-white via-white/50 to-transparent" />
            </h1>
            <p className="text-gray-400 mt-4">
              Race against the clock! Sign letters as fast as you can.
            </p>
          </div>

          {/* Setup Mode */}
          {mode === 'setup' && (
            <div className="max-w-2xl mx-auto">
              <Card className="p-8 bg-gray-900/30 border-gray-800">
                <div className="text-center mb-6">
                  <Zap className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                  <h2 className="text-2xl font-semibold mb-2">Configure Your Challenge</h2>
                  <p className="text-gray-400">How many letters do you want to sign?</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Letters</label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={numLetters}
                      onChange={(e) => setNumLetters(Math.max(5, Math.min(50, parseInt(e.target.value) || 10)))}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-center text-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center">Min: 5, Max: 50</p>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Challenge Rules
                    </h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Sign each letter as quickly as possible</li>
                      <li>• 80%+ confidence required to advance</li>
                      <li>• 15 second timeout per letter (hint shown if exceeded)</li>
                      <li>• Timer runs continuously until completion</li>
                    </ul>
                  </div>

                  {cameraError && (
                    <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300 text-sm">
                      {cameraError}
                    </div>
                  )}

                  <Button
                    onClick={startChallenge}
                    disabled={modelLoading || cameraLoading}
                    className="w-full py-6 text-lg bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cameraLoading ? 'Initializing Camera...' : modelLoading ? 'Loading Model...' : 'Start Challenge'}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Countdown Mode */}
          {mode === 'countdown' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Camera preview during countdown */}
              <div className="w-full">
                <Card className="p-4 bg-gray-900/30 border-gray-800">
                  <div className="relative bg-black rounded-lg overflow-hidden w-full" style={{ aspectRatio: '4/3' }}>
                    <video
                      ref={videoRef}
                      className="absolute inset-0 opacity-0 w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={480}
                      className="absolute inset-0 w-full h-full"
                    />
                    {/* Countdown overlay */}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-9xl font-bold text-yellow-400 animate-pulse">
                          {countdownValue}
                        </div>
                        <p className="text-2xl text-gray-400 mt-4">Get Ready!</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Info panel during countdown */}
              <div className="space-y-4 flex flex-col justify-center">
                <Card className="p-6 bg-blue-900/20 border-blue-800/50">
                  <h3 className="text-xl font-semibold mb-3">Challenge Starting Soon</h3>
                  <div className="space-y-2 text-gray-300">
                    <p>• {challengeLetters.length} letters to sign</p>
                    <p>• 80% confidence required</p>
                    <p>• 15 second timeout per letter</p>
                    <p>• Camera is ready ✓</p>
                  </div>
                </Card>

                <Card className="p-6 bg-gray-900/30 border-gray-800">
                  <p className="text-sm text-gray-400 mb-2">Quick Tips:</p>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Position your hand clearly in view</li>
                    <li>• Good lighting helps accuracy</li>
                    <li>• Sign clearly and hold briefly</li>
                  </ul>
                </Card>
              </div>
            </div>
          )}

          {/* Challenge Mode */}
          {mode === 'challenge' && (
            <div className="grid xl:grid-cols-[1fr,400px] lg:grid-cols-1 gap-6">
              {/* Left: Camera Feed */}
              <div className="w-full">
                <Card className="p-4 bg-gray-900/30 border-gray-800">
                  <div className="relative bg-black rounded-lg overflow-hidden w-full" style={{ aspectRatio: '4/3' }}>
                    <video
                      ref={videoRef}
                      className="absolute inset-0 opacity-0 w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={480}
                      className="absolute inset-0 w-full h-full"
                    />

                    {/* Hint Overlay */}
                    {showHint && (
                      <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
                        <p className="text-yellow-400 text-xl mb-4">Time's up! Here's a hint:</p>
                        <div className="text-9xl font-bold text-white mb-4">
                          {challengeLetters[currentLetterIndex]}
                        </div>
                        <img
                          src={`/asl-alphabet/${challengeLetters[currentLetterIndex].toLowerCase()}.png`}
                          alt={challengeLetters[currentLetterIndex]}
                          className="w-64 h-64 object-contain mb-4"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <p className="text-gray-400">Moving to next letter in {hintTimer}s...</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right: Challenge Info */}
              <div className="space-y-4">
                {/* Target Letter - Make this the most prominent */}
                <Card className="p-8 bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-800/50 text-center">
                  <p className="text-sm text-gray-400 mb-2">Sign This Letter</p>
                  <div className="text-8xl font-bold text-white my-4">
                    {challengeLetters[currentLetterIndex]}
                  </div>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                    <span>Letter {currentLetterIndex + 1} of {challengeLetters.length}</span>
                  </div>
                </Card>

                {/* Timer and Progress in one card */}
                <Card className="p-4 bg-gray-900/30 border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time
                    </span>
                    <div className="text-2xl font-bold text-yellow-400 font-mono">
                      {formatTime(elapsedTime)}
                    </div>
                  </div>

                  <div className="border-t border-gray-800 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Progress</span>
                      <Badge variant="outline" className="text-xs">{currentLetterIndex + 1} / {challengeLetters.length}</Badge>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                        style={{ width: `${((currentLetterIndex + 1) / challengeLetters.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </Card>

                {/* Detection Status */}
                <Card className="p-4 bg-gray-900/30 border-gray-800">
                  <p className="text-xs text-gray-400 mb-3">Current Detection</p>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{detectedSign || '—'}</span>
                    <Badge
                      variant={confidence >= 0.80 ? "default" : "secondary"}
                      className={confidence >= 0.80 ? "bg-green-600 text-lg px-3 py-1" : "text-lg px-3 py-1"}
                    >
                      {(confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Results Mode */}
          {mode === 'results' && (
            <div className="max-w-2xl mx-auto">
              <Card className="p-8 bg-gradient-to-br from-green-900/40 to-blue-900/40 border-green-800/50">
                <div className="text-center">
                  <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-400" />
                  <h2 className="text-3xl font-bold mb-2">Challenge Complete!</h2>
                  <p className="text-gray-400 mb-6">You signed {challengeLetters.length} letters</p>

                  <div className="bg-black/30 rounded-lg p-8 mb-6">
                    <p className="text-sm text-gray-400 mb-2">Total Time</p>
                    <div className="text-6xl font-bold text-green-400 font-mono">
                      {formatTime(finalTime)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <p className="text-sm text-gray-400">Letters</p>
                      <p className="text-2xl font-bold">{challengeLetters.length}</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <p className="text-sm text-gray-400">Avg Per Letter</p>
                      <p className="text-2xl font-bold">{(finalTime / challengeLetters.length / 1000).toFixed(2)}s</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={startChallenge} className="flex-1 bg-yellow-600 hover:bg-yellow-700">
                      Try Again
                    </Button>
                    <Button onClick={resetChallenge} variant="outline" className="flex-1">
                      New Challenge
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
