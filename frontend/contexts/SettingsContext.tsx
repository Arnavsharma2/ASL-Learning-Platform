'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type PerformanceMode = 'max_performance' | 'balanced' | 'max_accuracy';

export interface PerformanceSettings {
  mode: PerformanceMode;
  videoResolution: string;
  frameRate: number;
  modelComplexity: number;
  inferenceThrottleMs: number;
  minConfidence: number;
}

interface SettingsContextType {
  settings: PerformanceSettings;
  updateSettings: (newSettings: Partial<PerformanceSettings>) => void;
  resetSettings: () => void;
}

// Fixed to balanced mode since we're using SageMaker/cloud inference
const defaultSettings: PerformanceSettings = {
  mode: 'balanced',
  videoResolution: '640x480',
  frameRate: 30,
  modelComplexity: 0,
  inferenceThrottleMs: 100, // Fast inference with SageMaker
  minConfidence: 0.75,
};

// Preset configurations (all modes now use balanced settings with SageMaker)
export const performancePresets: Record<PerformanceMode, PerformanceSettings> = {
  max_performance: {
    mode: 'max_performance',
    videoResolution: '640x480',
    frameRate: 30,
    modelComplexity: 0,
    inferenceThrottleMs: 100, // Cloud inference via SageMaker
    minConfidence: 0.75,
  },
  balanced: {
    mode: 'balanced',
    videoResolution: '640x480',
    frameRate: 30,
    modelComplexity: 0,
    inferenceThrottleMs: 100, // Cloud inference via SageMaker
    minConfidence: 0.75,
  },
  max_accuracy: {
    mode: 'max_accuracy',
    videoResolution: '640x480',
    frameRate: 30,
    modelComplexity: 0,
    inferenceThrottleMs: 100, // Cloud inference via SageMaker
    minConfidence: 0.75,
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PerformanceSettings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('asl-performance-settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
      } catch (error) {
        console.error('Failed to parse stored settings:', error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('asl-performance-settings', JSON.stringify(settings));
    }
  }, [settings, isInitialized]);

  const updateSettings = (newSettings: Partial<PerformanceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
