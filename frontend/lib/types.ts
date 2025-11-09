// Database models matching backend

export interface Lesson {
  id: number;
  title: string;
  description?: string;
  category: string;
  video_url?: string;
  difficulty: string;
  sign_name: string;
}

export interface UserProgress {
  id: number;
  user_id: string;
  lesson_id: number;
  attempts: number;
  accuracy?: number;
  last_practiced: string;
  created_at: string;
}

export interface PracticeSession {
  id: number;
  user_id: string;
  sign_detected: string;
  confidence: number;
  is_correct: boolean;
  timestamp: string;
}

export interface UserStats {
  user_id: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy_rate: number;
  avg_lesson_accuracy: number;
  lessons_practiced: number;
}

// MediaPipe hand tracking types
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface DetectionResult {
  sign: string;
  confidence: number;
  landmarks: HandLandmark[];
}
