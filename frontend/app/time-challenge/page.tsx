'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { initializeHands, startCamera, drawHands, MediaPipeResults } from '@/lib/mediapipe';
import onnxInference from '@/lib/onnx-inference';
import { HandLandmarks } from '@/lib/mediapipe';
import { Trophy, Clock, Target } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

type ChallengeMode = 'setup' | 'countdown' | 'challenge' | 'results';

export default function TimeChallengePage() {
  const { settings } = useSettings();
  
  // Mode and configuration
  const [mode, setMode] = useState<ChallengeMode>('setup');
  const [numLetters, setNumLetters] = useState<number>(10);
  const [numLettersInput, setNumLettersInput] = useState<string>('10');

  // Challenge state
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [challengeLetters, setChallengeLetters] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [finalTime, setFinalTime] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  
  // Refs to track current values for use in callbacks
  const currentLetterIndexRef = useRef(0);
  const challengeLettersRef = useRef<string[]>([]);
  const startTimeRef = useRef<number>(0);

  // Countdown state
  const [countdownValue, setCountdownValue] = useState<number>(3);

  // Camera and CV state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);

  // Recognition state
  const [detectedSign, setDetectedSign] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const lastInferenceRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);
  const isMovingToNextRef = useRef<boolean>(false);
  // Use settings throttle value (2000ms for balanced mode)
  const INFERENCE_THROTTLE_MS = settings.inferenceThrottleMs;

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

  // Initialize camera when challenge mode starts
  useEffect(() => {
    if (mode === 'challenge' && !cameraActive) {
      // Use requestAnimationFrame to ensure DOM is updated and refs are available
      let retryCount = 0;
      const maxRetries = 10;
      
      const initCamera = () => {
        if (videoRef.current && canvasRef.current) {
          initializeCamera();
        } else if (retryCount < maxRetries) {
          // Retry if refs aren't available yet (with max retries to prevent infinite loop)
          retryCount++;
          requestAnimationFrame(initCamera);
        } else {
          console.error('Failed to initialize camera: video/canvas refs not available');
        }
      };
      requestAnimationFrame(initCamera);
    }
  }, [mode, cameraActive]);

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
    setMode('countdown');
    setCountdownValue(3);
    setCorrectCount(0);
    isMovingToNextRef.current = false;

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
  const initializeCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const hands = await initializeHands(handleHandDetection);
      handsRef.current = hands;

      // Start camera with continuous video drawing for 100% uptime
      const stream = await startCamera(videoRef.current, hands, canvasRef.current);
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.error('Failed to initialize camera:', err);
    }
  };

  // Update refs when state changes
  useEffect(() => {
    currentLetterIndexRef.current = currentLetterIndex;
  }, [currentLetterIndex]);

  useEffect(() => {
    challengeLettersRef.current = challengeLetters;
  }, [challengeLetters]);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  // Move to next letter
  const moveToNextLetter = useCallback(() => {
    // Prevent multiple rapid calls
    if (isMovingToNextRef.current) return;
    isMovingToNextRef.current = true;

    const nextIndex = currentLetterIndexRef.current + 1;

    if (nextIndex >= challengeLettersRef.current.length) {
      // Challenge complete!
      const totalTime = Date.now() - startTimeRef.current;
      setFinalTime(totalTime);
      setMode('results');
      stopCamera();
      isMovingToNextRef.current = false;
    } else {
      // Move to next letter
      setCurrentLetterIndex(nextIndex);
      setLetterStartTime(Date.now());
      setShowHint(false);
      // Reset flag after a short delay to allow state to update
      setTimeout(() => {
        isMovingToNextRef.current = false;
      }, 100);
    }
  }, []);

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

      // Check if detected sign matches target - use refs to get latest values
      const targetLetter = challengeLettersRef.current[currentLetterIndexRef.current];
      
      if (prediction.sign === targetLetter && prediction.confidence >= 0.80 && !isMovingToNextRef.current) {
        // Correct sign detected! Increment counter and move to next letter
        setCorrectCount(prev => prev + 1);
        moveToNextLetter();
      }
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      isProcessingRef.current = false;
    }
  }, [mode, showHint, moveToNextLetter]);

  // Stop camera
  const stopCamera = () => {
    // Stop frame processing first
    if (videoRef.current && (videoRef.current as any).__stopFrameProcessing) {
      (videoRef.current as any).__stopFrameProcessing();
    }

    // Stop camera stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    // Close MediaPipe hands
    if (handsRef.current) {
      try {
        handsRef.current.close();
      } catch (e) {
        // Ignore
      }
      handsRef.current = null;
    }

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
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
    setCorrectCount(0);
    setDetectedSign('');
    setConfidence(0);
    setShowHint(false);
    isMovingToNextRef.current = false;
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

  // ASL alphabet image URLs from a reliable source
  const getASLImageUrl = (letter: string) => {
    // Using ASL alphabet images from a public CDN
    return `https://www.lifeprint.com/asl101/fingerspelling/abc-gifs/${letter.toLowerCase()}.gif`;
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
                      value={numLettersInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNumLettersInput(value);
                        const num = parseInt(value, 10);
                        if (!isNaN(num) && num >= 5 && num <= 50) {
                          setNumLetters(num);
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure a valid value when user leaves the field
                        const value = e.target.value;
                        const num = parseInt(value, 10);
                        if (isNaN(num) || num < 5) {
                          setNumLetters(5);
                          setNumLettersInput('5');
                        } else if (num > 50) {
                          setNumLetters(50);
                          setNumLettersInput('50');
                        } else {
                          setNumLetters(num);
                          setNumLettersInput(num.toString());
                        }
                      }}
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

                  <Button
                    onClick={startChallenge}
                    disabled={modelLoading}
                    className="w-full py-6 text-lg bg-yellow-600 hover:bg-yellow-700"
                  >
                    {modelLoading ? 'Loading Model...' : 'Start Challenge'}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Countdown Mode */}
          {mode === 'countdown' && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="text-9xl font-bold text-yellow-400 animate-pulse">
                  {countdownValue}
                </div>
                <p className="text-2xl text-gray-400 mt-4">Get Ready!</p>
              </div>
            </div>
          )}

          {/* Challenge Mode */}
          {mode === 'challenge' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left: Camera Feed */}
              <div>
                <Card className="p-4 bg-gray-900/30 border-gray-800">
                  <div className="relative bg-black rounded-lg overflow-hidden w-full" style={{ aspectRatio: '4/3', maxWidth: '640px' }}>
                    <video
                      ref={videoRef}
                      className="absolute top-0 left-0 w-full h-full object-cover opacity-0"
                      playsInline
                      muted
                      autoPlay
                    />
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={480}
                      className="absolute top-0 left-0 w-full h-full object-cover"
                    />

                    {/* Camera not active overlay */}
                    {!cameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                        <div className="text-center">
                          <p className="text-lg mb-2">Camera initializing...</p>
                        </div>
                      </div>
                    )}

                    {/* Hint Overlay */}
                    {showHint && (
                      <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-10 p-6">
                        <p className="text-yellow-400 text-2xl font-semibold mb-2">Time's up! Here's how to sign:</p>
                        <div className="text-8xl font-bold text-white mb-6">
                          {challengeLetters[currentLetterIndex]}
                        </div>
                        <div className="bg-white/10 rounded-lg p-6 mb-6 max-w-md w-full">
                          <img
                            src={getASLImageUrl(challengeLetters[currentLetterIndex])}
                            alt={`ASL sign for letter ${challengeLetters[currentLetterIndex]}`}
                            className="w-full h-auto object-contain"
                            onError={(e) => {
                              // Fallback if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="text-6xl font-bold text-gray-400 text-center py-8">Image unavailable</div>`;
                              }
                            }}
                          />
                        </div>
                        <p className="text-gray-300 text-lg">Moving to next letter in <span className="text-yellow-400 font-bold">{hintTimer}</span>s...</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Current Detection under camera */}
                  <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Current Detection:</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{detectedSign || '—'}</span>
                      <Badge
                        variant={confidence >= 0.80 ? "default" : "secondary"}
                        className={confidence >= 0.80 ? "bg-green-600" : ""}
                      >
                        {(confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right: Challenge Info */}
              <div className="space-y-4">
                {/* Timer */}
                <Card className="p-6 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Elapsed Time
                    </span>
                    {/* Correct Signs in top right */}
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-400" />
                      <span className="text-lg font-bold text-green-400">{correctCount}</span>
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-yellow-400 font-mono">
                    {formatTime(elapsedTime)}
                  </div>
                </Card>

                {/* Progress */}
                <Card className="p-6 bg-gray-900/30 border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Progress</span>
                    <Badge variant="outline">{currentLetterIndex + 1} / {challengeLetters.length}</Badge>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${((currentLetterIndex + 1) / challengeLetters.length) * 100}%` }}
                    />
                  </div>
                </Card>

                {/* Target Letter */}
                <Card className="p-8 bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-800/50 text-center">
                  <p className="text-sm text-gray-400 mb-2">Sign This Letter:</p>
                  <div className="text-9xl font-bold text-white mb-4">
                    {challengeLetters[currentLetterIndex]}
                  </div>
                  <div className="text-sm text-gray-500">
                    Letter {currentLetterIndex + 1} of {challengeLetters.length}
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

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <p className="text-sm text-gray-400">Letters</p>
                      <p className="text-2xl font-bold">{challengeLetters.length}</p>
                    </div>
                    <div className="bg-green-900/50 rounded-lg p-4">
                      <p className="text-sm text-gray-400">Correct</p>
                      <p className="text-2xl font-bold text-green-400">{correctCount}</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <p className="text-sm text-gray-400">Avg Per Letter</p>
                      <p className="text-2xl font-bold">{(finalTime / challengeLetters.length / 1000).toFixed(2)}s</p>
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-400 mb-1">Accuracy</p>
                    <p className="text-3xl font-bold text-green-400">
                      {challengeLetters.length > 0 ? Math.round((correctCount / challengeLetters.length) * 100) : 0}%
                    </p>
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
