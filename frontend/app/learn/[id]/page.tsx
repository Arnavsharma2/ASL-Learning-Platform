'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { lessonsApi, progressApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  sign_name: string;
  video_url?: string;
  image_url?: string;
  key_points?: string[];
  common_mistakes?: string[];
  order_index?: number;
}

interface UserProgress {
  attempts: number;
  accuracy: number;
  last_practiced: string;
  status?: string;
}

export default function LessonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const lessonId = params?.id as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    async function loadLessonData() {
      try {
        setLoading(true);
        setError(null);

        // Load lesson details
        const lessonData = await lessonsApi.getLesson(parseInt(lessonId));
        setLesson(lessonData);

        // Load all lessons in the same category for navigation
        const categoryLessons = await lessonsApi.getAll(lessonData.category);
        const sorted = categoryLessons.sort((a: Lesson, b: Lesson) => {
          // Sort alphabetically by sign_name for alphabet category
          if (a.sign_name && b.sign_name) {
            return a.sign_name.localeCompare(b.sign_name);
          }
          return a.id - b.id;
        });
        setAllLessons(sorted);

        // Load user progress if logged in
        if (user) {
          try {
            const userProgress = await progressApi.getUserProgress(user.id);
            const lessonProgress = userProgress.find(
              (p: any) => p.lesson_id === parseInt(lessonId)
            );
            if (lessonProgress) {
              setProgress(lessonProgress);
            }
          } catch (err) {
            // No progress yet - that's okay
            console.log('No progress data yet');
          }
        }
      } catch (err) {
        console.error('Failed to load lesson:', err);
        setError('Failed to load lesson details');
      } finally {
        setLoading(false);
      }
    }

    if (lessonId) {
      loadLessonData();
    }
  }, [lessonId, user]);

  const handleStartPractice = () => {
    router.push(`/practice?lesson=${lessonId}`);
  };

  const handlePreviousLesson = () => {
    if (!allLessons.length || !lesson) return;

    const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
    if (currentIndex > 0) {
      const previousLesson = allLessons[currentIndex - 1];
      router.push(`/learn/${previousLesson.id}`);
    }
  };

  const handleNextLesson = () => {
    if (!allLessons.length || !lesson) return;

    const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      router.push(`/learn/${nextLesson.id}`);
    }
  };

  const canGoPrevious = () => {
    if (!allLessons.length || !lesson) return false;
    const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
    return currentIndex > 0;
  };

  const canGoNext = () => {
    if (!allLessons.length || !lesson) return false;
    const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
    return currentIndex < allLessons.length - 1;
  };

  const getMasteryStatus = () => {
    if (!progress) return 'Not Started';
    if (progress.status === 'mastered') return 'Mastered';
    if (progress.attempts > 0) return 'In Progress';
    return 'Not Started';
  };

  const getMasteryColor = () => {
    const status = getMasteryStatus();
    if (status === 'Mastered') return 'text-green-600 dark:text-green-400';
    if (status === 'In Progress') return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  // ASL alphabet image URLs from a reliable source
  const getASLImageUrl = (letter: string) => {
    // Using ASL alphabet images from a public CDN
    return `https://www.lifeprint.com/asl101/fingerspelling/abc-gifs/${letter.toLowerCase()}.gif`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-12 text-center">
              <div className="animate-pulse">
                <p className="text-lg">Loading lesson...</p>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-12 text-center">
              <p className="text-lg text-red-600">{error || 'Lesson not found'}</p>
              <Button onClick={() => router.push('/learn')} className="mt-4">
                Back to Lessons
              </Button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button
            variant="outline"
            onClick={() => router.push('/learn')}
            className="mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Lessons
          </Button>

          {/* Lesson Header */}
          <Card className="p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">{lesson.title}</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {lesson.description}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Badge variant="outline" className="capitalize">
                  {lesson.category}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {lesson.difficulty}
                </Badge>
              </div>
            </div>

            {/* Progress Section */}
            {user && (
              <div className="border-t pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p className={`text-lg font-semibold ${getMasteryColor()}`}>
                      {getMasteryStatus()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Attempts</p>
                    <p className="text-lg font-semibold">
                      {progress?.attempts || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
                    <p className="text-lg font-semibold">
                      {progress?.accuracy ? `${(progress.accuracy * 100).toFixed(0)}%` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Visual Reference */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Sign Reference</h2>
              <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden mb-4">
                <img
                  src={getASLImageUrl(lesson.sign_name)}
                  alt={`ASL sign for letter ${lesson.sign_name}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="text-center"><div class="text-6xl font-bold text-gray-400 mb-2">${lesson.sign_name}</div><p class="text-sm text-gray-500">Letter: ${lesson.sign_name}</p></div>`;
                    }
                  }}
                />
              </div>
              {lesson.video_url && (
                <a
                  href={lesson.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Watch video demonstration →
                </a>
              )}
            </Card>

            {/* Key Teaching Points */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">How to Sign</h2>
              {lesson.key_points && lesson.key_points.length > 0 ? (
                <ul className="space-y-3">
                  {lesson.key_points.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Form the hand shape for "{lesson.sign_name}"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Hold your hand at chest level</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Keep the sign clear and steady</span>
                  </li>
                </ul>
              )}
            </Card>
          </div>

          {/* Common Mistakes */}
          {lesson.common_mistakes && lesson.common_mistakes.length > 0 && (
            <Card className="p-6 mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                Common Mistakes to Avoid
              </h2>
              <ul className="space-y-2">
                {lesson.common_mistakes.map((mistake, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-600 dark:text-yellow-400 mr-2">×</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Practice Section */}
          <Card className="p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Ready to Practice?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {progress?.attempts && progress.attempts > 0
                  ? "Continue practicing to improve your mastery"
                  : "Start practicing this sign with real-time feedback"}
              </p>
              <Button size="lg" onClick={handleStartPractice} className="gap-2">
                <PlayCircle className="w-5 h-5" />
                {progress?.attempts && progress.attempts > 0 ? 'Continue Practice' : 'Start Practice'}
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                Goal: 10 successful attempts with 80%+ confidence
              </p>
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePreviousLesson}
              disabled={!canGoPrevious()}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous Lesson
            </Button>
            <Button
              variant="outline"
              onClick={handleNextLesson}
              disabled={!canGoNext()}
            >
              Next Lesson
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
