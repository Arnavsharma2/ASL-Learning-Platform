'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSettings, PerformanceMode, performancePresets } from '@/contexts/SettingsContext';
import { Slider } from '@/components/ui/slider';
import { Settings, Zap, Scale, Target, Info } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();

  // Map mode to slider value (0 = max_performance, 1 = balanced, 2 = max_accuracy)
  const modeToValue: Record<PerformanceMode, number> = {
    max_performance: 0,
    balanced: 1,
    max_accuracy: 2,
  };

  const valueToMode: Record<number, PerformanceMode> = {
    0: 'max_performance',
    1: 'balanced',
    2: 'max_accuracy',
  };

  const [sliderValue, setSliderValue] = useState(modeToValue[settings.mode]);

  const handleSliderChange = (value: number[]) => {
    const newValue = value[0];
    setSliderValue(newValue);
    const newMode = valueToMode[newValue];
    const preset = performancePresets[newMode];
    updateSettings(preset);
  };

  const handleReset = () => {
    resetSettings();
    setSliderValue(1); // balanced
  };

  const getModeInfo = (mode: PerformanceMode) => {
    switch (mode) {
      case 'max_performance':
        return {
          icon: <Zap className="w-5 h-5" />,
          title: 'Max Performance',
          description: 'Smoothest experience - processing happens on server',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          features: [
            'Server-side hand detection (fastest)',
            'Snapshot-based processing',
            'Lowest CPU/battery usage',
            'Requires internet connection',
            'Best for low-end devices',
          ],
        };
      case 'balanced':
        return {
          icon: <Scale className="w-5 h-5" />,
          title: 'Balanced',
          description: 'Good balance between performance and accuracy',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          features: [
            'Client-side real-time tracking',
            'Moderate inference rate (500ms)',
            'Balanced CPU usage',
            'Works offline',
            'Good for most devices',
          ],
        };
      case 'max_accuracy':
        return {
          icon: <Target className="w-5 h-5" />,
          title: 'Max Accuracy',
          description: 'Best accuracy - real-time AI analysis in your browser',
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          features: [
            'Client-side real-time tracking',
            'Fast inference rate (200ms)',
            'Higher CPU usage',
            'Works offline',
            'Best for powerful devices',
          ],
        };
    }
  };

  const currentModeInfo = getModeInfo(settings.mode);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Performance Settings</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Optimize hand tracking performance for your device
            </p>
          </div>

          {/* Current Mode Display */}
          <Card className={`p-6 mb-6 ${currentModeInfo.bgColor} ${currentModeInfo.borderColor}`}>
            <div className="flex items-start gap-4">
              <div className={currentModeInfo.color}>
                {currentModeInfo.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold">{currentModeInfo.title}</h2>
                  <Badge variant="outline" className={currentModeInfo.color}>
                    Active
                  </Badge>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {currentModeInfo.description}
                </p>
                <ul className="space-y-2">
                  {currentModeInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className={`w-1.5 h-1.5 rounded-full ${currentModeInfo.color.replace('text-', 'bg-')}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Performance Slider */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-6">Performance Mode</h3>

            <div className="space-y-6">
              {/* Slider */}
              <div className="px-2">
                <Slider
                  value={[sliderValue]}
                  onValueChange={handleSliderChange}
                  min={0}
                  max={2}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Labels */}
              <div className="flex justify-between text-sm">
                <div className="text-center flex-1">
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    Max Performance
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Smoothest</div>
                </div>
                <div className="text-center flex-1">
                  <div className="font-semibold text-blue-600 dark:text-blue-400">
                    Balanced
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Recommended</div>
                </div>
                <div className="text-center flex-1">
                  <div className="font-semibold text-purple-600 dark:text-purple-400">
                    Max Accuracy
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Most Accurate</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Technical Details */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Technical Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Video Resolution</p>
                <p className="font-mono font-semibold">{settings.videoResolution}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Frame Rate</p>
                <p className="font-mono font-semibold">{settings.frameRate} FPS</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Model Complexity</p>
                <p className="font-mono font-semibold">
                  {settings.modelComplexity === 0 ? 'Fast' : settings.modelComplexity === 1 ? 'Balanced' : 'Accurate'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Inference Throttle</p>
                <p className="font-mono font-semibold">
                  {settings.inferenceThrottleMs === 0 ? 'Server-side' : `${settings.inferenceThrottleMs}ms`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Min Confidence</p>
                <p className="font-mono font-semibold">{(settings.minConfidence * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Processing Mode</p>
                <p className="font-mono font-semibold">
                  {settings.inferenceThrottleMs === 0 ? 'Server' : 'Client'}
                </p>
              </div>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-6 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  How does this work?
                </p>
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>Max Performance:</strong> Sends snapshots to the server for processing, similar to how other apps work. Very smooth but requires internet.
                </p>
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>Balanced:</strong> Runs AI in your browser with moderate update rate. Good balance for most devices.
                </p>
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>Max Accuracy:</strong> Runs AI in your browser with fast updates for real-time analysis. More demanding but most accurate.
                </p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={handleReset} variant="outline">
              Reset to Default
            </Button>
            <Button onClick={() => window.location.href = '/practice'}>
              Test in Practice Mode
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
