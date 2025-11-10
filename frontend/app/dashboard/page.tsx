'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { progressApi } from '@/lib/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface UserStats {
  user_id: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy_rate: number;
  avg_lesson_accuracy: number;
  lessons_practiced: number;
}

interface PracticeSession {
  id: number;
  sign_detected: string;
  confidence: number;
  is_correct: number;
  timestamp: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [statsData, sessionsData] = await Promise.all([
          progressApi.getUserStats(user.id),
          progressApi.getUserSessions(user.id, 20),
        ]);
        setStats(statsData);
        setSessions(sessionsData);
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Prepare chart data
  const accuracyOverTime = sessions
    .slice()
    .reverse()
    .map((session, index) => ({
      attempt: index + 1,
      accuracy: session.is_correct ? 100 : 0,
      confidence: Math.round(session.confidence * 100),
    }));

  // Group sessions by sign
  const signFrequency = sessions.reduce((acc, session) => {
    const sign = session.sign_detected || 'Unknown';
    acc[sign] = (acc[sign] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const signData = Object.entries(signFrequency)
    .map(([sign, count]) => ({ sign, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <Navigation />

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Dashboard</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your progress...</p>
              </div>
            ) : error ? (
              <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="space-y-4">
                  <p className="text-red-700 dark:text-red-400 font-semibold">Error loading dashboard</p>
                  <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
                  <div className="pt-4 border-t border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-300 mb-2">Troubleshooting:</p>
                    <ul className="text-sm text-red-600 dark:text-red-300 list-disc list-inside space-y-1">
                      <li>Make sure the backend server is running on port 8000</li>
                      <li>Check that your Supabase database is configured correctly</li>
                      <li>Verify your .env.local has the correct API_URL</li>
                      <li>Check the browser console for more details</li>
                    </ul>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="p-6">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Total Attempts
                    </h3>
                    <p className="text-3xl font-bold">{stats?.total_attempts || 0}</p>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Correct Attempts
                    </h3>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {stats?.correct_attempts || 0}
                    </p>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Accuracy Rate
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {stats?.accuracy_rate ? Math.round(stats.accuracy_rate) : 0}%
                    </p>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Lessons Practiced
                    </h3>
                    <p className="text-3xl font-bold">{stats?.lessons_practiced || 0}</p>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Accuracy Over Time</h3>
                    {accuracyOverTime.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={accuracyOverTime}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="attempt" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="accuracy"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Accuracy (%)"
                          />
                          <Line
                            type="monotone"
                            dataKey="confidence"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="Confidence (%)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No data yet. Start practicing to see your progress!
                      </div>
                    )}
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Most Practiced Signs</h3>
                    {signData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={signData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="sign" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No data yet. Start practicing to see your progress!
                      </div>
                    )}
          </Card>
                </div>

                {/* Recent Sessions */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Practice Sessions</h3>
                  {sessions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Sign</th>
                            <th className="text-left p-2">Confidence</th>
                            <th className="text-left p-2">Result</th>
                            <th className="text-left p-2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.slice(0, 10).map((session) => (
                            <tr key={session.id} className="border-b">
                              <td className="p-2">{session.sign_detected || 'Unknown'}</td>
                              <td className="p-2">
                                {Math.round(session.confidence * 100)}%
                              </td>
                              <td className="p-2">
                                {session.is_correct !== null && session.is_correct !== undefined ? (
                                  <span
                                    className={`px-2 py-1 rounded text-sm ${
                                      session.is_correct === 1
                                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                    }`}
                                  >
                                    {session.is_correct === 1 ? 'Correct' : 'Incorrect'}
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded text-sm bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400">
                                    N/A
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-sm text-gray-600 dark:text-gray-400">
                                {new Date(session.timestamp).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No practice sessions yet. Start practicing to track your progress!
                    </div>
                  )}
                </Card>
              </>
            )}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
