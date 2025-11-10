'use client';

import { useState, useRef, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdaptiveCameraFeed } from '@/components/AdaptiveCameraFeed';
import { MediaPipeResults, HandLandmarks } from '@/lib/mediapipe';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ASL_SIGNS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z'
];

const GREETINGS = ['hello', 'thank_you', 'please', 'yes', 'no'];

interface LandmarkSample {
  sign: string;
  landmarks: number[][];
  timestamp: number;
}

export default function DataCollectionPage() {
  const [selectedSign, setSelectedSign] = useState<string>('');
  const [samples, setSamples] = useState<LandmarkSample[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const samplesRef = useRef<LandmarkSample[]>([]);

  const handleHandDetection = useCallback((results: MediaPipeResults) => {
    if (!isRecording || !selectedSign) return;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Flatten landmarks to array of [x, y, z] coordinates
      const flatLandmarks = (landmarks as HandLandmarks[]).map((lm: HandLandmarks) => [lm.x, lm.y, lm.z]);

      const sample: LandmarkSample = {
        sign: selectedSign,
        landmarks: flatLandmarks,
        timestamp: Date.now()
      };

      samplesRef.current = [...samplesRef.current, sample];
      setSamples(samplesRef.current);
    }
  }, [isRecording, selectedSign]);

  const startRecording = () => {
    if (!selectedSign) {
      toast.error('Please select a sign first');
      return;
    }

    // 3-second countdown
    let count = 3;
    setCountdown(count);

    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        setCountdown(null);
        setIsRecording(true);
        toast.success('Recording started!');
        clearInterval(countdownInterval);

        // Auto-stop after 5 seconds
        setTimeout(() => {
          stopRecording();
        }, 5000);
      }
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    const signSamples = samplesRef.current.filter(s => s.sign === selectedSign);
    toast.success(`Recorded ${signSamples.length} samples for "${selectedSign}"`);
  };

  const downloadData = () => {
    if (samples.length === 0) {
      toast.error('No samples to download');
      return;
    }

    const dataStr = JSON.stringify(samples, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asl_dataset_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`Downloaded ${samples.length} samples`);
  };

  const clearSamples = () => {
    if (confirm('Are you sure you want to clear all samples?')) {
      samplesRef.current = [];
      setSamples([]);
      toast.success('Samples cleared');
    }
  };

  const getSignSampleCount = (sign: string) => {
    return samples.filter(s => s.sign === sign).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold mb-2">Data Collection Tool</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Collect training data for ASL sign recognition model
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Camera Feed */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Camera Feed</h3>
                <div className="relative">
                  <AdaptiveCameraFeed
                    onHandDetected={handleHandDetection}
                    width={640}
                    height={480}
                  />

                  {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <div className="text-8xl font-bold text-white">
                        {countdown}
                      </div>
                    </div>
                  )}

                  {isRecording && (
                    <div className="absolute top-4 left-4">
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full font-medium">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        Recording
                      </div>
                    </div>
                  )}
                </div>

                {/* Recording Controls */}
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={startRecording}
                    disabled={!selectedSign || isRecording}
                    className="flex-1"
                  >
                    Start Recording (5s)
                  </Button>
                  <Button
                    onClick={stopRecording}
                    disabled={!isRecording}
                    variant="outline"
                  >
                    Stop
                  </Button>
                </div>

                {selectedSign && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm">
                      <strong>Selected Sign:</strong> {selectedSign}
                    </p>
                    <p className="text-sm">
                      <strong>Samples Collected:</strong> {getSignSampleCount(selectedSign)}
                    </p>
                  </div>
                )}
              </Card>

              {/* Instructions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Instructions</h3>
                <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>1. Select a sign from the right panel</li>
                  <li>2. Position your hand in the camera view</li>
                  <li>3. Click "Start Recording" (3-second countdown)</li>
                  <li>4. Hold the sign steady for 5 seconds</li>
                  <li>5. Repeat for different angles and lighting</li>
                  <li>6. Collect 100+ samples per sign for best results</li>
                  <li>7. Download the dataset when finished</li>
                </ol>
              </Card>
            </div>

            {/* Sign Selection */}
            <div className="space-y-4">
              {/* Alphabet */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Alphabet (A-Z)</h3>
                <div className="grid grid-cols-5 gap-2">
                  {ASL_SIGNS.map((sign) => (
                    <Button
                      key={sign}
                      variant={selectedSign === sign ? 'default' : 'outline'}
                      onClick={() => setSelectedSign(sign)}
                      className="relative"
                    >
                      {sign}
                      {getSignSampleCount(sign) > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                          {getSignSampleCount(sign)}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </Card>

              {/* Greetings/Words */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Common Words</h3>
                <div className="space-y-2">
                  {GREETINGS.map((sign) => (
                    <Button
                      key={sign}
                      variant={selectedSign === sign ? 'default' : 'outline'}
                      onClick={() => setSelectedSign(sign)}
                      className="w-full justify-between"
                    >
                      <span className="capitalize">{sign.replace('_', ' ')}</span>
                      {getSignSampleCount(sign) > 0 && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                          {getSignSampleCount(sign)}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </Card>

              {/* Stats & Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Dataset Stats</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Samples</p>
                    <p className="text-2xl font-bold">{samples.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Signs with Data</p>
                    <p className="text-2xl font-bold">
                      {new Set(samples.map(s => s.sign)).size}
                    </p>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button
                      onClick={downloadData}
                      disabled={samples.length === 0}
                      className="w-full"
                    >
                      Download Dataset
                    </Button>
                    <Button
                      onClick={clearSamples}
                      disabled={samples.length === 0}
                      variant="outline"
                      className="w-full"
                    >
                      Clear All Samples
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
