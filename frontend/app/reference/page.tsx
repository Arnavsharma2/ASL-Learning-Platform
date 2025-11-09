'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { lessonsApi } from '@/lib/api';
import Link from 'next/link';

interface Lesson {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  sign_name: string;
  video_url?: string;
  image_url?: string;
}

export default function ReferencePage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlphabetLessons();
  }, []);

  const fetchAlphabetLessons = async () => {
    try {
      setLoading(true);
      const data = await lessonsApi.getAll('alphabet');

      // Sort alphabetically by sign_name
      const sorted = data.sort((a: Lesson, b: Lesson) => {
        if (a.sign_name && b.sign_name) {
          return a.sign_name.localeCompare(b.sign_name);
        }
        return a.id - b.id;
      });

      setLessons(sorted);
      setError(null);
    } catch (err) {
      setError('Failed to load alphabet reference. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ASL alphabet image URLs from a reliable source
  const getASLImageUrl = (letter: string) => {
    // Using ASL alphabet images from a public CDN
    // You can replace these with your own hosted images
    return `https://www.lifeprint.com/asl101/fingerspelling/abc-gifs/${letter.toLowerCase()}.gif`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">ASL Alphabet Reference</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Quick reference guide for all 26 letters of the ASL alphabet
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-lg">Loading reference guide...</p>
            </div>
          ) : error ? (
            <Card className="p-8 text-center bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <p className="text-red-900 dark:text-red-100">{error}</p>
            </Card>
          ) : (
            <>
              {/* Grid of all letters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                {lessons.map((lesson) => (
                  <Link key={lesson.id} href={`/learn/${lesson.id}`}>
                    <Card className="p-4 hover:shadow-lg transition-all cursor-pointer group h-full">
                      <div className="flex flex-col items-center space-y-3">
                        {/* Letter badge */}
                        <Badge className="text-2xl px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                          {lesson.sign_name}
                        </Badge>

                        {/* Image */}
                        <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
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
                                parent.innerHTML = `<div class="text-6xl font-bold text-gray-400">${lesson.sign_name}</div>`;
                              }
                            }}
                          />
                        </div>

                        {/* Title */}
                        <p className="text-sm font-medium text-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          Letter {lesson.sign_name}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Tips section */}
              <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <h2 className="text-xl font-semibold mb-4">Tips for Learning</h2>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Practice each letter until you can form it without looking at the reference</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Hold your hand at chest level for clear visibility</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Keep your hand steady for 2-3 seconds when signing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Note: J and Z involve motion - draw the letter shape in the air</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Click on any letter to view detailed instructions and start practicing</span>
                  </li>
                </ul>
              </Card>

              {/* Print-friendly version note */}
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>💡 Tip: Use your browser's print function to create a physical reference card</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
