'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { lessonsApi } from '@/lib/api';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  sign_name: string;
}

type QuizMode = 'setup' | 'quiz' | 'results';
type SelectionMode = 'random-all' | 'random-category' | 'custom';

export default function QuizPage() {
  const router = useRouter();
  const [mode, setMode] = useState<QuizMode>('setup');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('random-all');
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('alphabet');
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<Lesson[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [results, setResults] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [questionOptions, setQuestionOptions] = useState<{ [key: number]: string[] }>({});

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const data = await lessonsApi.getAll();
      const sorted = data.sort((a: Lesson, b: Lesson) => {
        if (a.sign_name && b.sign_name) {
          return a.sign_name.localeCompare(b.sign_name);
        }
        return a.id - b.id;
      });
      setAllLessons(sorted);
    } catch (err) {
      console.error('Failed to load lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(allLessons.map(l => l.category)));
  // Only get A-Z letters
  const alphabetLetters = allLessons
    .filter(l => {
      const signName = l.sign_name;
      return signName && signName.length === 1 && /^[A-Z]$/.test(signName);
    })
    .map(l => l.sign_name)
    .sort();

  const toggleLetter = (letter: string) => {
    if (selectedLetters.includes(letter)) {
      setSelectedLetters(selectedLetters.filter(l => l !== letter));
    } else {
      setSelectedLetters([...selectedLetters, letter]);
    }
  };

  const startQuiz = () => {
    let questionsPool: Lesson[] = [];

    // Filter to only alphabet letters (A-Z)
    const alphabetOnly = allLessons.filter(l => {
      const signName = l.sign_name;
      return signName && signName.length === 1 && /^[A-Z]$/.test(signName);
    });

    if (selectionMode === 'random-all') {
      questionsPool = [...alphabetOnly];
    } else if (selectionMode === 'random-category') {
      questionsPool = alphabetOnly.filter(l => l.category === selectedCategory);
    } else if (selectionMode === 'custom') {
      questionsPool = alphabetOnly.filter(l => selectedLetters.includes(l.sign_name));
    }

    // Shuffle and select questions
    const shuffled = questionsPool.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(numQuestions, questionsPool.length));

    // Pre-generate options for all questions
    const optionsMap: { [key: number]: string[] } = {};
    selected.forEach((question, index) => {
      optionsMap[index] = generateOptions(question.sign_name);
    });

    setQuizQuestions(selected);
    setQuestionOptions(optionsMap);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setImageErrors({});
    setMode('quiz');
  };

  const handleAnswer = (answer: string) => {
    setUserAnswers({
      ...userAnswers,
      [currentQuestionIndex]: answer
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishQuiz = () => {
    let correct = 0;
    quizQuestions.forEach((question, index) => {
      if (userAnswers[index] === question.sign_name) {
        correct++;
      }
    });

    setResults({ correct, total: quizQuestions.length });
    setMode('results');
  };

  const resetQuiz = () => {
    setMode('setup');
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizQuestions([]);
  };

  const getASLImageUrl = (letter: string) => {
    return `https://www.lifeprint.com/asl101/fingerspelling/abc-gifs/${letter.toLowerCase()}.gif`;
  };

  const generateOptions = (correctAnswer: string): string[] => {
    const options = new Set<string>([correctAnswer]);
    // Only use A-Z letters
    const availableLetters = allLessons
      .filter(l => {
        const signName = l.sign_name;
        return signName && signName.length === 1 && /^[A-Z]$/.test(signName);
      })
      .map(l => l.sign_name);

    while (options.size < 4 && options.size < availableLetters.length) {
      const random = availableLetters[Math.floor(Math.random() * availableLetters.length)];
      options.add(random);
    }

    return Array.from(options).sort(() => Math.random() - 0.5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-lg">Loading quiz...</p>
          </div>
        </main>
      </div>
    );
  }

  // Setup Mode
  if (mode === 'setup') {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">ASL Quiz</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Test your knowledge of ASL signs
              </p>
            </div>

            {/* Quiz Mode Selection */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Select Quiz Mode</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectionMode('random-all')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectionMode === 'random-all'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <h3 className="font-semibold mb-1">Random - All</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Random signs from all categories
                  </p>
                </button>

                <button
                  onClick={() => setSelectionMode('random-category')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectionMode === 'random-category'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <h3 className="font-semibold mb-1">Category</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Random signs from one category
                  </p>
                </button>

                <button
                  onClick={() => setSelectionMode('custom')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectionMode === 'custom'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <h3 className="font-semibold mb-1">Custom</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose specific letters
                  </p>
                </button>
              </div>
            </Card>

            {/* Category Selection (for random-category mode) */}
            {selectionMode === 'random-category' && (
              <Card className="p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Select Category</h2>
                <div className="flex gap-2 flex-wrap">
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
              </Card>
            )}

            {/* Letter Selection (for custom mode) */}
            {selectionMode === 'custom' && (
              <Card className="p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  Select Letters ({selectedLetters.length} selected)
                </h2>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-4">
                  {alphabetLetters.map((letter) => (
                    <button
                      key={letter}
                      onClick={() => toggleLetter(letter)}
                      className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                        selectedLetters.includes(letter)
                          ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedLetters([...alphabetLetters])}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedLetters([])}
                  >
                    Clear All
                  </Button>
                </div>
              </Card>
            )}

            {/* Number of Questions */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Number of Questions</h2>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="26"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-2xl font-bold w-16 text-center">{numQuestions}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>5</span>
                <span>26</span>
              </div>
            </Card>

            {/* Start Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={startQuiz}
              disabled={
                (selectionMode === 'custom' && selectedLetters.length === 0) ||
                (selectionMode === 'random-category' && !selectedCategory)
              }
            >
              Start Quiz
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Quiz Mode
  if (mode === 'quiz' && quizQuestions.length > 0) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const options = questionOptions[currentQuestionIndex] || [];
    const userAnswer = userAnswers[currentQuestionIndex];

    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">
                  Question {currentQuestionIndex + 1} of {quizQuestions.length}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {Object.keys(userAnswers).length} answered
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <Card className="p-8 mb-6">
              <h2 className="text-2xl font-semibold mb-4 text-center">
                Which sign represents the letter:
              </h2>

              {/* Target Letter */}
              <div className="mb-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-12 flex items-center justify-center">
                <span className="text-9xl font-bold text-white">
                  {currentQuestion.sign_name}
                </span>
              </div>

              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Select the correct ASL sign for this letter
              </p>

              {/* Image Options */}
              <div className="grid grid-cols-2 gap-4">
                {options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`p-4 rounded-lg border-2 transition-all relative ${
                      userAnswer === option
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                      {!imageErrors[option] ? (
                        <img
                          src={getASLImageUrl(option)}
                          alt={`ASL sign option`}
                          className="w-full h-full object-contain p-2"
                          onError={() => setImageErrors(prev => ({ ...prev, [option]: true }))}
                        />
                      ) : (
                        <div className="text-4xl font-bold text-gray-400">?</div>
                      )}
                    </div>
                    {userAnswer === option && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button
                onClick={nextQuestion}
                disabled={!userAnswer}
              >
                {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Results Mode
  if (mode === 'results') {
    const percentage = Math.round((results.correct / results.total) * 100);

    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Results Header */}
            <Card className="p-8 mb-6 text-center">
              <h1 className="text-4xl font-bold mb-4">Quiz Complete!</h1>

              {/* Score Circle */}
              <div className="my-8">
                <div className="inline-flex items-center justify-center w-48 h-48 rounded-full border-8 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">
                      {percentage}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {results.correct} / {results.total} correct
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Message */}
              <div className="mb-6">
                {percentage === 100 && (
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                    Perfect! Outstanding work!
                  </p>
                )}
                {percentage >= 80 && percentage < 100 && (
                  <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                    Great job! Keep it up!
                  </p>
                )}
                {percentage >= 60 && percentage < 80 && (
                  <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
                    Good effort! Practice makes perfect!
                  </p>
                )}
                {percentage < 60 && (
                  <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
                    Keep practicing! You'll get there!
                  </p>
                )}
              </div>
            </Card>

            {/* Detailed Results */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Review Your Answers</h2>
              <div className="space-y-3">
                {quizQuestions.map((question, index) => {
                  const userAnswer = userAnswers[index];
                  const isCorrect = userAnswer === question.sign_name;

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        isCorrect
                          ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                          : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isCorrect ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                          <span className="font-medium">Question {index + 1}</span>
                        </div>
                        {!isCorrect && (
                          <div className="text-right space-y-1">
                            <div className="text-sm">
                              <span className="text-gray-600 dark:text-gray-400">You answered:</span>{' '}
                              <span className="font-semibold text-red-600 dark:text-red-400">
                                {userAnswer || 'Not answered'}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Correct answer:</span>{' '}
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {question.sign_name}
                              </span>
                            </div>
                          </div>
                        )}
                        {isCorrect && (
                          <div className="text-right">
                            <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                              Correct!
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={resetQuiz}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Quiz
              </Button>
              <Button
                onClick={() => router.push('/practice')}
                className="flex-1"
              >
                Practice Mode
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
