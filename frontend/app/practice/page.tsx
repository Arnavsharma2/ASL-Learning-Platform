'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { MediaPipeResults, HandLandmarks } from '@/lib/mediapipe';
import { AdaptiveCameraFeed } from '@/components/AdaptiveCameraFeed';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { progressApi, lessonsApi } from '@/lib/api';
import onnxInference from '@/lib/onnx-inference';
import { CheckCircle2, XCircle, Target } from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  sign_name: string;
  description: string;
  image_url?: string;
}

function PracticePageContent() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lessonId = searchParams?.get('lesson');

  const [detectedSign, setDetectedSign] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [targetSign, setTargetSign] = useState<string | null>(null);

  const lastRecordedRef = useRef<{ sign: string; timestamp: number } | null>(null);
  const lastInferenceRef = useRef<number>(0);
  const [sessionCount, setSessionCount] = useState(0);
  const isProcessingRef = useRef<boolean>(false);

  // Use settings throttle value (2000ms for balanced mode)
  const INFERENCE_THROTTLE_MS = settings.inferenceThrottleMs;
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);

  // Performance monitoring (optional - can be removed after testing)
  const [fps, setFps] = useState<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(Date.now());

  // Guided practice state
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
  const [completed, setCompleted] = useState(false);

  const MASTERY_GOAL = 10;
  const MIN_CONFIDENCE = 0.8;

  // Load lesson data if lesson ID is provided
  useEffect(() => {
    async function loadLesson() {
      if (lessonId) {
        try {
          const lessonData = await lessonsApi.getLesson(parseInt(lessonId));
          setLesson(lessonData);
          setTargetSign(lessonData.sign_name);
        } catch (error) {
          console.error('Failed to load lesson:', error);
        }
      }
    }
    loadLesson();
  }, [lessonId]);

  // Load ONNX model on component mount (optional - practice works without it)
  useEffect(() => {
    async function loadModel() {
      try {
        setModelLoading(true);
        setModelError(null);
        await onnxInference.loadModel();
        console.log('ONNX model loaded successfully');
      } catch (error) {
        console.warn('ONNX model not available - using MediaPipe only mode:', error);
        setModelError('AI model not loaded. Using basic hand tracking mode.');
      } finally {
        setModelLoading(false);
      }
    }
    loadModel();
  }, []);

  const handleHandDetection = async (results: MediaPipeResults) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Skip if model is not loaded - show hand tracking only
      if (!onnxInference.isModelLoaded()) {
        // Just show that hand is detected, don't try to predict
        setDetectedSign('Hand detected (model not loaded)');
        setConfidence(0);
        return;
      }

      // Time-based throttling: only run inference every INFERENCE_THROTTLE_MS
      const now = Date.now();
      const timeSinceLastInference = now - lastInferenceRef.current;

      if (timeSinceLastInference < INFERENCE_THROTTLE_MS) {
        return; // Skip this frame - too soon since last inference
      }

      // Skip if already processing to prevent concurrent runs
      if (isProcessingRef.current) {
        return; // Skip this frame
      }

      lastInferenceRef.current = now;
      isProcessingRef.current = true;

      // Run inference asynchronously to avoid blocking video rendering
      // The video continues to render while inference runs in the background

      // Performance monitoring: track FPS
      frameCountRef.current++;
      if (now - lastFpsUpdateRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }

      try {
        // Extract landmarks from first detected hand
        const landmarks = results.multiHandLandmarks[0];

        // Convert landmarks to array of [x, y, z] coordinates
        const landmarksArray = (landmarks as HandLandmarks[]).map((lm: HandLandmarks) => [lm.x, lm.y, lm.z]);

        // Run ONNX inference directly in browser
        const prediction = await onnxInference.predict(landmarksArray);
        const sign = prediction.sign;
        const conf = prediction.confidence;

        setDetectedSign(sign);
        setConfidence(conf);

        // Check if this is guided practice and evaluate
        if (targetSign && sign && conf >= MIN_CONFIDENCE && !completed) {
          const isCorrect = sign === targetSign;

          setTotalAttempts(prev => prev + 1);

          if (isCorrect) {
            setCorrectAttempts(prev => prev + 1);
            setConsecutiveCorrect(prev => {
              const newConsecutive = prev + 1;
              if (newConsecutive >= MASTERY_GOAL) {
                setCompleted(true);
                // Update progress in database
                updateLessonProgress();
              }
              return newConsecutive;
            });
            setFeedbackType('success');
          } else {
            setConsecutiveCorrect(0);
            setFeedbackType('error');
          }

          setShowFeedback(true);
          setTimeout(() => setShowFeedback(false), 1500);
        }

        // Record session if user is logged in
        if (user && sign) {
          const recordNow = Date.now();
          const lastRecorded = lastRecordedRef.current;

          // Throttle: only record once per 3 seconds for the same sign
          if (
            !lastRecorded ||
            lastRecorded.sign !== sign ||
            recordNow - lastRecorded.timestamp > 3000
          ) {
            try {
              await progressApi.recordSession({
                user_id: user.id,
                sign_detected: sign,
                confidence: conf,
                is_correct: targetSign ? sign === targetSign : null,
              });
              lastRecordedRef.current = { sign, timestamp: recordNow };
              setSessionCount((prev) => prev + 1);
            } catch (error) {
              console.error('Failed to record session:', error);
            }
          }
        }
      } catch (error) {
        console.error('Inference error:', error);
        setDetectedSign('Error');
        setConfidence(0);
      } finally {
        isProcessingRef.current = false;
      }
    } else {
      setDetectedSign(null);
      setConfidence(0);
    }
  };

  const updateLessonProgress = async () => {
    if (!user || !lessonId) return;

    try {
      await progressApi.updateProgress({
        user_id: user.id,
        lesson_id: parseInt(lessonId),
        attempts: totalAttempts,
        accuracy: correctAttempts / totalAttempts,
        status: 'mastered', // Mark as mastered when completing 10 correct attempts
      });
      console.log('Lesson marked as mastered!');
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleRestart = () => {
    setCorrectAttempts(0);
    setTotalAttempts(0);
    setConsecutiveCorrect(0);
    setCompleted(false);
    setShowFeedback(false);
  };

  const handleBackToLesson = () => {
    if (lessonId) {
      router.push(`/learn/${lessonId}`);
    } else {
      router.push('/learn');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">
              {lesson ? `Practice: ${lesson.title}` : 'Practice Mode'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {lesson
                ? `Learn the ASL sign for "${lesson.sign_name}"`
                : 'Use your webcam to practice ASL signs in real-time'}
            </p>
            {lesson && (
              <Button
                variant="outline"
                onClick={handleBackToLesson}
                className="mt-4"
              >
                ← Back to Lesson
              </Button>
            )}
          </div>

          {/* Completion Celebration */}
          {completed && (
            <Card className="p-8 mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
                  Congratulations!
                </h3>
                <p className="text-green-800 dark:text-green-200 mb-6">
                  You've successfully completed this lesson with {MASTERY_GOAL} correct attempts!
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={handleBackToLesson} variant="outline">
                    Back to Lesson
                  </Button>
                  <Button onClick={handleRestart}>
                    Practice Again
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Camera Feed - Takes 2 columns */}
            <div className="lg:col-span-2">
              {modelLoading ? (
                <Card className="p-12 text-center">
                  <div className="animate-pulse">
                    <p className="text-lg font-medium">Loading AI model...</p>
                    <p className="text-sm text-gray-500 mt-2">Please wait</p>
                  </div>
                </Card>
              ) : modelError ? (
                <Card className="p-12 text-center">
                  <p className="text-lg font-medium text-red-600">{modelError}</p>
                </Card>
              ) : (
                <>
                  <AdaptiveCameraFeed
                    onHandDetected={handleHandDetection}
                    width={640}
                    height={480}
                  />
                  {/* Real-time Feedback Overlay */}
                  {showFeedback && targetSign && (
                    <div className="mt-4">
                      {feedbackType === 'success' ? (
                        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-green-900 dark:text-green-100">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-semibold">Correct! Keep going!</span>
                          </div>
                        </Card>
                      ) : (
                        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2 text-red-900 dark:text-red-100">
                            <XCircle className="w-5 h-5" />
                            <span className="font-semibold">Try again - looking for "{targetSign}"</span>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Detection Results - Takes 1 column */}
            <div className="space-y-4">
              {/* Target Sign Card (only for guided practice) */}
              {targetSign && !completed && (
                <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold">Target Sign</h3>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl mb-4">{targetSign}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Show this sign to the camera
                    </p>
                  </div>
                  {lesson?.image_url && (
                    <img
                      src={lesson.image_url}
                      alt={`${targetSign} sign`}
                      className="mt-4 rounded-lg w-full"
                    />
                  )}
                </Card>
              )}

              {/* Progress Card (only for guided practice) */}
              {targetSign && !completed && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Correct Attempts</span>
                        <span className="text-sm font-semibold">{consecutiveCorrect}/{MASTERY_GOAL}</span>
                      </div>
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${(consecutiveCorrect / MASTERY_GOAL) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
                        <p className="text-2xl font-bold">
                          {totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                        <p className="text-2xl font-bold">{totalAttempts}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Detection Results Card */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Detection Results</h3>

                {detectedSign ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Detected Sign
                      </p>
                      <Badge
                        variant={targetSign && detectedSign === targetSign ? 'default' : 'secondary'}
                        className="text-lg px-4 py-2"
                      >
                        {detectedSign}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Confidence
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              confidence >= MIN_CONFIDENCE ? 'bg-blue-600' : 'bg-yellow-600'
                            }`}
                            style={{ width: `${confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {(confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {user && (
                      <div className="pt-4 border-t">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Sessions recorded: {sessionCount}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No hands detected</p>
                    <p className="text-sm mt-2">
                      Position your hand in front of the camera
                    </p>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Tips</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Ensure good lighting</li>
                  <li>• Keep hand in camera frame</li>
                  <li>• Use a plain background</li>
                  <li>• Hold sign steady for 2-3 seconds</li>
                  {targetSign && <li>• Aim for 80%+ confidence for best results</li>}
                </ul>
                {fps > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="text-xs text-gray-500">
                      Performance: <span className="text-green-400 font-semibold">{fps} FPS</span>
                      <br />
                      <span className="text-gray-600">Inference throttled to ~10 FPS for optimal performance</span>
                    </p>
                  </div>
                )}
              </Card>

              <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <p className="text-sm text-green-900 dark:text-green-100">
                  <strong>Client-Side AI:</strong> ONNX model running in your browser!
                  Recognizing alphabet letters A-Z
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                  Model: PyTorch MLP → ONNX | Test Accuracy: 98.98% | No server required!
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading practice mode...</p>
        </div>
      </div>
    }>
      <PracticePageContent />
    </Suspense>
  );
}
