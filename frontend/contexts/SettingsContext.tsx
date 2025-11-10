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

// Always use balanced settings with 2000ms throttle for better video performance
const defaultSettings: PerformanceSettings = {
  mode: 'balanced',
  videoResolution: '640x480',
  frameRate: 30,
  modelComplexity: 0,
  inferenceThrottleMs: 2000, // 2 seconds - slower detection for better video quality
  minConfidence: 0.75,
};

// Preset configurations (kept for compatibility but not used)
export const performancePresets: Record<PerformanceMode, PerformanceSettings> = {
  max_performance: {
    mode: 'max_performance',
    videoResolution: '640x480',
    frameRate: 30,
    modelComplexity: 0,
    inferenceThrottleMs: 0,
    minConfidence: 0.7,
  },
  balanced: {
    mode: 'balanced',
    videoResolution: '640x480',
    frameRate: 30,
    modelComplexity: 0,
    inferenceThrottleMs: 2000, // 2 seconds
    minConfidence: 0.75,
  },
  max_accuracy: {
    mode: 'max_accuracy',
    videoResolution: '640x480',
    frameRate: 30,
    modelComplexity: 1,
    inferenceThrottleMs: 200,
    minConfidence: 0.8,
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Always use balanced settings with 2000ms throttle - no user customization
  const [settings] = useState<PerformanceSettings>(defaultSettings);

  // Settings are now fixed - no updates or localStorage needed
  const updateSettings = () => {
    // No-op: settings are fixed
  };

  const resetSettings = () => {
    // No-op: settings are fixed
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
