'use client';

import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [showNotification, setShowNotification] = useState(true);

  // Hide notification if user has dismissed it (stored in localStorage)
  useEffect(() => {
    const dismissed = localStorage.getItem('backend-loading-notification-dismissed');
    if (dismissed === 'true') {
      setShowNotification(false);
    }
  }, []);

  const handleDismiss = () => {
    setShowNotification(false);
    localStorage.setItem('backend-loading-notification-dismissed', 'true');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Backend Loading Notification */}
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="fixed top-20 right-4 z-50 max-w-sm"
        >
          <Card className="p-4 bg-gray-900 border-gray-800 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-1 text-white">Initial Loading</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Please allow 30-45 seconds for services to load initially. The backend is hosted on Render's free tier and may need to spin up.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-6xl mx-auto">
          {/* Hero Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-32"
          >
            <h1 className="text-6xl md:text-8xl font-light tracking-tight mb-8">
              Learn Sign Language
              <br />
              <span className="font-normal">with Computer Vision</span>
            </h1>
          </motion.div>

          {/* Call to Action */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-32"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link href="/practice">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 bg-white text-black hover:bg-gray-200 transition-all border-2 border-white"
                >
                  Start Learning
                </Button>
              </Link>
              <Link href="/learn">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white hover:text-black transition-all"
                >
                  Browse Lessons
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/quiz" className="text-gray-400 hover:text-white transition-colors">
                Quiz
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/reference" className="text-gray-400 hover:text-white transition-colors">
                Reference
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                Dashboard
              </Link>
              {user && (
                <>
                  <span className="text-gray-600">•</span>
                  <Link href="/settings" className="text-gray-400 hover:text-white transition-colors">
                    Settings
                  </Link>
                </>
              )}
            </div>
          </motion.section>

          {/* How I Built It Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-32"
          >
            <h2 className="text-4xl md:text-5xl font-light text-center mb-16">
              Built with:
            </h2>
            
            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              {/* Frontend */}
              <div className="text-center">
                <h3 className="text-2xl font-normal mb-8 text-gray-300">Frontend</h3>
                <div className="flex flex-wrap justify-center gap-6 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-black">N</span>
                    </div>
                    <span className="text-xs text-gray-400">Next.js</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">TS</span>
                    </div>
                    <span className="text-xs text-gray-400">TypeScript</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">TW</span>
                    </div>
                    <span className="text-xs text-gray-400">Tailwind</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">MP</span>
                    </div>
                    <span className="text-xs text-gray-400">MediaPipe</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">ONNX</span>
                    </div>
                    <span className="text-xs text-gray-400">ONNX Runtime</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">SB</span>
                    </div>
                    <span className="text-xs text-gray-400">Supabase</span>
                  </div>
                </div>
              </div>

              {/* Backend */}
              <div className="text-center">
                <h3 className="text-2xl font-normal mb-8 text-gray-300">Backend</h3>
                <div className="flex flex-wrap justify-center gap-6 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">FA</span>
                    </div>
                    <span className="text-xs text-gray-400">FastAPI</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-orange-400 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">PY</span>
                    </div>
                    <span className="text-xs text-gray-400">Python</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">PT</span>
                    </div>
                    <span className="text-xs text-gray-400">PyTorch</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">PG</span>
                    </div>
                    <span className="text-xs text-gray-400">PostgreSQL</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-teal-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">SQL</span>
                    </div>
                    <span className="text-xs text-gray-400">SQLAlchemy</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">CV</span>
                    </div>
                    <span className="text-xs text-gray-400">OpenCV</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Training Graphs Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-32"
          >
            <h2 className="text-4xl md:text-5xl font-light text-center mb-16">
              Training Graphs
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="p-6 bg-gray-900 border-gray-800">
                <h3 className="text-xl font-normal mb-4 text-gray-300">Model Performance</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Test Accuracy:</span>
                    <span className="text-green-400 font-semibold">98.98%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model Type:</span>
                    <span className="text-white">MLP (Multi-Layer Perceptron)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Input Features:</span>
                    <span className="text-white">63 (21 landmarks × 3 coords)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Output Classes:</span>
                    <span className="text-white">28 (A-Z + del + space)</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="text-xs text-gray-500">
                      Trained on Kaggle ASL Alphabet dataset with PyTorch, exported to ONNX for browser inference.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gray-900 border-gray-800">
                <h3 className="text-xl font-normal mb-4 text-gray-300">Training Details</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Dataset:</span>
                    <span className="text-white">ASL Alphabet (Kaggle)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Training Samples:</span>
                    <span className="text-white">87,000+ images</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Validation Split:</span>
                    <span className="text-white">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Optimization:</span>
                    <span className="text-white">Adam Optimizer</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="text-xs text-gray-500">
                      Model optimized for real-time inference with GPU acceleration via WebGL.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.section>

          {/* Flowchart Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mb-32"
          >
            <h2 className="text-4xl md:text-5xl font-light text-center mb-16">
              Flowchart
            </h2>
            
            <div className="max-w-4xl mx-auto">
              <Card className="p-8 bg-gray-900 border-gray-800">
                <div className="space-y-6">
                  {/* Flow steps */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Webcam Input</h3>
                      <p className="text-sm text-gray-400">User shows hand sign to camera</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-6">
                    <div className="w-1 h-12 bg-gray-700"></div>
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 -ml-6">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">MediaPipe Detection</h3>
                      <p className="text-sm text-gray-400">Extracts 21 hand landmarks (x, y, z coordinates)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-6">
                    <div className="w-1 h-12 bg-gray-700"></div>
                    <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 -ml-6">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Feature Extraction</h3>
                      <p className="text-sm text-gray-400">Flattens landmarks to 63 features (21 × 3)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-6">
                    <div className="w-1 h-12 bg-gray-700"></div>
                    <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 -ml-6">
                      <span className="text-white font-bold">4</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">ONNX Inference</h3>
                      <p className="text-sm text-gray-400">MLP model predicts sign with confidence score</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-6">
                    <div className="w-1 h-12 bg-gray-700"></div>
                    <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 -ml-6">
                      <span className="text-white font-bold">5</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Display Result</h3>
                      <p className="text-sm text-gray-400">Shows detected letter (A-Z) and confidence percentage</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-6">
                    <div className="w-1 h-12 bg-gray-700"></div>
                    <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 -ml-6">
                      <span className="text-white font-bold">6</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Progress Tracking</h3>
                      <p className="text-sm text-gray-400">Saves practice session to database (if logged in)</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </motion.section>

          {/* Backend Architecture Flowchart */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="mb-32"
          >
            <h2 className="text-4xl md:text-5xl font-light text-center mb-16">
              Backend Architecture
            </h2>
            
            <div className="max-w-5xl mx-auto">
              <Card className="p-8 bg-gray-900 border-gray-800">
                <div className="space-y-6">
                  {/* Frontend to Backend */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">FE</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Frontend API Client</h3>
                      <p className="text-sm text-gray-400">Sends requests via lib/api.ts</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-6">
                    <div className="w-1 h-12 bg-gray-700"></div>
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 -ml-6">
                      <span className="text-white text-xs font-bold">API</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">FastAPI Server</h3>
                      <p className="text-sm text-gray-400">REST API endpoints on port 8000</p>
                    </div>
                  </div>

                  {/* Routes Branch */}
                  <div className="flex items-center gap-4 ml-6">
                    <div className="w-1 h-12 bg-gray-700"></div>
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 -ml-6">
                      <span className="text-white text-xs font-bold">RT</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">API Routes</h3>
                      <p className="text-sm text-gray-400">lessons.py & progress.py</p>
                    </div>
                  </div>

                  {/* Two parallel paths */}
                  <div className="grid md:grid-cols-2 gap-6 ml-20">
                    {/* Lessons Path */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-1 h-8 bg-gray-700"></div>
                        <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0 -ml-4">
                          <span className="text-white text-xs font-bold">L</span>
                        </div>
                        <div>
                          <h4 className="text-base font-semibold mb-1">Lessons API</h4>
                          <p className="text-xs text-gray-400">CRUD operations</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Path */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-1 h-8 bg-gray-700"></div>
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 -ml-4">
                          <span className="text-white text-xs font-bold">P</span>
                        </div>
                        <div>
                          <h4 className="text-base font-semibold mb-1">Progress API</h4>
                          <p className="text-xs text-gray-400">Track user progress</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Both converge to Database */}
                  <div className="flex items-center gap-4 ml-6">
                    <div className="w-1 h-12 bg-gray-700"></div>
                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 -ml-6">
                      <span className="text-white text-xs font-bold">DB</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Supabase PostgreSQL</h3>
                      <p className="text-sm text-gray-400">Stores lessons and user progress</p>
                    </div>
                  </div>

                  {/* SQLAlchemy Models */}
                  <div className="flex items-center gap-4 ml-6">
                    <div className="w-1 h-12 bg-gray-700"></div>
                    <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 -ml-6">
                      <span className="text-white text-xs font-bold">ORM</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">SQLAlchemy ORM</h3>
                      <p className="text-sm text-gray-400">Database models (Lessons, UserProgress)</p>
                    </div>
                  </div>

                  {/* Training Pipeline (separate branch) */}
                  <div className="mt-8 pt-8 border-t border-gray-800">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">ML</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Training Pipeline</h3>
                        <p className="text-sm text-gray-400">PyTorch model training & ONNX export</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-6 mt-4">
                      <div className="w-1 h-12 bg-gray-700"></div>
                      <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 -ml-6">
                        <span className="text-white text-xs font-bold">PT</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">PyTorch Training</h3>
                        <p className="text-sm text-gray-400">train.py - MLP model training</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-6">
                      <div className="w-1 h-12 bg-gray-700"></div>
                      <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 -ml-6">
                        <span className="text-white text-xs font-bold">EX</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">ONNX Export</h3>
                        <p className="text-sm text-gray-400">Exported to frontend/public/models/</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </motion.section>

        </div>
      </main>
    </div>
  );
}
