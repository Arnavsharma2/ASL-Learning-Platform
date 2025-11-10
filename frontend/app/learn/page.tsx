'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { lessonsApi, progressApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  sign_name: string;
  order_index?: number;
}

interface UserProgress {
  lesson_id: number;
  attempts: number;
  accuracy: number;
  last_practiced: string;
  status?: string;
}

export default function LearnPage() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchLessons();
  }, [selectedCategory]);

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const data = await lessonsApi.getAll(selectedCategory || undefined);

      // Filter to only A-Z letters
      const alphabetOnly = data.filter((lesson: Lesson) => {
        const signName = lesson.sign_name;
        return signName && signName.length === 1 && /^[A-Z]$/.test(signName);
      });

      // Sort lessons with alphabet category first, then alphabetically by sign_name within each category
      const sorted = alphabetOnly.sort((a: Lesson, b: Lesson) => {
        // Alphabet category comes first
        if (a.category === 'alphabet' && b.category !== 'alphabet') return -1;
        if (a.category !== 'alphabet' && b.category === 'alphabet') return 1;

        // Within same category, sort alphabetically by sign_name if available
        if (a.category === b.category) {
          if (a.sign_name && b.sign_name) {
            return a.sign_name.localeCompare(b.sign_name);
          }
          // Fallback to order_index or ID
          if (a.order_index && b.order_index) {
            return a.order_index - b.order_index;
          }
          return a.id - b.id;
        }

        // Otherwise sort by category name
        return a.category.localeCompare(b.category);
      });

      setLessons(sorted);
      setError(null);
    } catch (err) {
      setError('Failed to load lessons. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    if (!user) return;

    try {
      const userProgress = await progressApi.getUserProgress(user.id);
      setProgress(userProgress);
    } catch (err) {
      console.error('Failed to load progress:', err);
    }
  };

  const getLessonProgress = (lessonId: number): UserProgress | undefined => {
    return progress.find((p) => p.lesson_id === lessonId);
  };

  const getLessonStatus = (lessonId: number): 'not_started' | 'in_progress' | 'mastered' => {
    const lessonProgress = getLessonProgress(lessonId);
    if (!lessonProgress) return 'not_started';
    if (lessonProgress.status === 'mastered') return 'mastered';
    if (lessonProgress.attempts > 0) return 'in_progress';
    return 'not_started';
  };

  const getStatusColor = (status: string): string => {
    if (status === 'mastered') return 'text-green-600 dark:text-green-400';
    if (status === 'in_progress') return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-400 dark:text-gray-600';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'mastered') return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
    if (status === 'in_progress') return <PlayCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    return <Circle className="w-5 h-5 text-gray-400 dark:text-gray-600" />;
  };

  const categories = ['alphabet'];

  // Calculate stats
  const totalLessons = lessons.length;
  const masteredCount = lessons.filter(l => getLessonStatus(l.id) === 'mastered').length;
  const inProgressCount = lessons.filter(l => getLessonStatus(l.id) === 'in_progress').length;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-4xl font-light mb-2 relative inline-block">
              Browse Lessons
              <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-white via-white/50 to-transparent" />
            </h2>
            <p className="text-gray-400 mt-4">
              Learn ASL signs organized by category
            </p>
          </div>

          {/* Progress Summary (only if logged in) */}
          {user && totalLessons > 0 && (
            <Card className="p-6 mb-6 bg-gradient-to-r from-gray-900/40 to-gray-800/40 border-gray-700 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-200">Your Progress</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-gray-900/30 border border-gray-800">
                  <p className="text-sm text-gray-400 mb-2">Total Lessons</p>
                  <p className="text-3xl font-bold">{totalLessons}</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-800/50">
                  <p className="text-sm text-gray-400 mb-2">In Progress</p>
                  <p className="text-3xl font-bold text-blue-400">{inProgressCount}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-900/20 border border-green-800/50">
                  <p className="text-sm text-gray-400 mb-2">Mastered</p>
                  <p className="text-3xl font-bold text-green-400">{masteredCount}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</span>
                  <span className="text-sm font-semibold">
                    {totalLessons > 0 ? Math.round((masteredCount / totalLessons) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${totalLessons > 0 ? (masteredCount / totalLessons) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Category Filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
              </Button>
            ))}
          </div>

          {/* Lessons Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Loading lessons...</p>
            </div>
          ) : error ? (
            <Card className="p-8 text-center bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <p className="text-red-900 dark:text-red-100">{error}</p>
              <Button className="mt-4" onClick={fetchLessons}>
                Retry
              </Button>
            </Card>
          ) : lessons.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">No lessons found in this category</p>
              <p className="text-sm text-gray-500 mt-2">
                Note: Lessons may need to be created in the database. See backend/database/README_SEEDING.md
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map((lesson) => {
                const status = getLessonStatus(lesson.id);
                const lessonProgress = getLessonProgress(lesson.id);

                return (
                  <Link key={lesson.id} href={`/learn/${lesson.id}`}>
                    <Card className="p-6 bg-gray-900/30 border-gray-800 hover:bg-gray-900/50 hover:border-gray-700 hover:shadow-xl transition-all h-full cursor-pointer group">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {user && getStatusIcon(status)}
                            <h3 className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {lesson.title}
                            </h3>
                          </div>
                          <Badge variant="secondary">{lesson.difficulty}</Badge>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {lesson.description}
                        </p>

                        {/* Progress indicator */}
                        {user && lessonProgress && (
                          <div className="pt-2 border-t">
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                              <span>Attempts: {lessonProgress.attempts}</span>
                              <span>Accuracy: {(lessonProgress.accuracy * 100).toFixed(0)}%</span>
                            </div>
                            {status !== 'mastered' && lessonProgress.accuracy > 0 && (
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                <div
                                  className="bg-blue-600 h-1 rounded-full"
                                  style={{ width: `${lessonProgress.accuracy * 100}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                            {lesson.category}
                          </span>

                          {user && status === 'mastered' && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                              Mastered
                            </Badge>
                          )}
                        </div>

                        <Button className="w-full mt-4 group-hover:bg-blue-700" variant="default">
                          {status === 'not_started' ? 'Start Learning' :
                           status === 'in_progress' ? 'Continue Learning' :
                           'Review Lesson'}
                        </Button>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
