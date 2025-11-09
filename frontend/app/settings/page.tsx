'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { settingsApi } from '@/lib/api';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2 } from 'lucide-react';

interface UserSettings {
  id?: number;
  user_id: string;
  performance_mode: 'max_performance' | 'balanced' | 'max_accuracy';
  video_resolution: string;
  frame_rate: number;
  model_complexity: number;
  inference_throttle_ms: number;
  min_confidence: number;
  use_server_processing: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await settingsApi.getUserSettings(user.id);
      // Convert use_server_processing from 0/1 to boolean
      setSettings({
        ...data,
        use_server_processing: data.use_server_processing === 1 || data.use_server_processing === true
      });
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      await settingsApi.updateSettings(user.id, {
        performance_mode: settings.performance_mode,
        video_resolution: settings.video_resolution,
        frame_rate: settings.frame_rate,
        model_complexity: settings.model_complexity,
        inference_throttle_ms: settings.inference_throttle_ms,
        min_confidence: settings.min_confidence,
        use_server_processing: settings.use_server_processing
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const getPerformanceModeConfig = (mode: string) => {
    switch (mode) {
      case 'max_performance':
        return {
          frame_rate: 15,
          model_complexity: 0,
          inference_throttle_ms: 500,
          video_resolution: '480x360'
        };
      case 'balanced':
        return {
          frame_rate: 30,
          model_complexity: 0,
          inference_throttle_ms: 250,
          video_resolution: '640x480'
        };
      case 'max_accuracy':
        return {
          frame_rate: 30,
          model_complexity: 1,
          inference_throttle_ms: 100,
          video_resolution: '1280x720'
        };
      default:
        return {};
    }
  };

  const handlePerformanceModeChange = (mode: 'max_performance' | 'balanced' | 'max_accuracy') => {
    const config = getPerformanceModeConfig(mode);
    updateSetting('performance_mode', mode);
    if (config.frame_rate) updateSetting('frame_rate', config.frame_rate);
    if (config.model_complexity !== undefined) updateSetting('model_complexity', config.model_complexity);
    if (config.inference_throttle_ms) updateSetting('inference_throttle_ms', config.inference_throttle_ms);
    if (config.video_resolution) updateSetting('video_resolution', config.video_resolution);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <p className="text-center text-gray-600 dark:text-gray-400">
              Please sign in to access settings
            </p>
          </Card>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <p className="text-center text-red-600 dark:text-red-400">
              Failed to load settings. {error}
            </p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure your hand tracking performance preferences
            </p>
          </div>

          {error && (
            <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </Card>
          )}

          {success && (
            <Card className="p-4 mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <p className="text-green-700 dark:text-green-400">Settings saved successfully!</p>
            </Card>
          )}

          <Card className="p-6 space-y-6">
            {/* Performance Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Performance Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['max_performance', 'balanced', 'max_accuracy'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handlePerformanceModeChange(mode)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      settings.performance_mode === mode
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold mb-1 capitalize">
                      {mode.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {mode === 'max_performance' && 'Fastest, lower accuracy'}
                      {mode === 'balanced' && 'Good balance'}
                      {mode === 'max_accuracy' && 'Best accuracy, slower'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Server Processing Toggle */}
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Server-Side Processing</span>
                <Badge variant={settings.use_server_processing ? "default" : "secondary"}>
                  {settings.use_server_processing ? 'Enabled' : 'Disabled'}
                </Badge>
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Use server-side processing for maximum performance (requires backend with MediaPipe)
              </p>
              <button
                onClick={() => updateSetting('use_server_processing', !settings.use_server_processing)}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  settings.use_server_processing
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {settings.use_server_processing ? 'Using Server Processing' : 'Using Client Processing'}
              </button>
            </div>

            {/* Video Resolution */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Video Resolution: {settings.video_resolution}
              </label>
              <select
                value={settings.video_resolution}
                onChange={(e) => updateSetting('video_resolution', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
              >
                <option value="480x360">480x360 (Low)</option>
                <option value="640x480">640x480 (Medium)</option>
                <option value="1280x720">1280x720 (High)</option>
              </select>
            </div>

            {/* Frame Rate */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Frame Rate: {settings.frame_rate} FPS
              </label>
              <input
                type="range"
                min="15"
                max="30"
                step="5"
                value={settings.frame_rate}
                onChange={(e) => updateSetting('frame_rate', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>15</span>
                <span>30</span>
              </div>
            </div>

            {/* Model Complexity */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Model Complexity: {settings.model_complexity === 0 ? 'Fastest' : settings.model_complexity === 1 ? 'Balanced' : 'Most Accurate'}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={settings.model_complexity}
                onChange={(e) => updateSetting('model_complexity', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Fastest</span>
                <span>Balanced</span>
                <span>Most Accurate</span>
              </div>
            </div>

            {/* Inference Throttle */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Inference Throttle: {settings.inference_throttle_ms}ms
              </label>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={settings.inference_throttle_ms}
                onChange={(e) => updateSetting('inference_throttle_ms', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>100ms (Fast)</span>
                <span>1000ms (Slow)</span>
              </div>
            </div>

            {/* Min Confidence */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Minimum Confidence: {(settings.min_confidence * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={settings.min_confidence}
                onChange={(e) => updateSetting('min_confidence', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

