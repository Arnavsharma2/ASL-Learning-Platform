'use client';

import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
            
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {/* Frontend */}
              <div className="text-center">
                <h3 className="text-2xl font-normal mb-8 text-gray-300">Frontend</h3>
                <div className="flex flex-wrap justify-center gap-6 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" alt="Next.js" className="w-16 h-16" />
                    <span className="text-xs text-gray-400">Next.js</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" alt="TypeScript" className="w-16 h-16" />
                    <span className="text-xs text-gray-400">TypeScript</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg" alt="Tailwind" className="w-16 h-16" />
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
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg" alt="Supabase" className="w-16 h-16" />
                    <span className="text-xs text-gray-400">Supabase</span>
                  </div>
                </div>
              </div>

              {/* Backend */}
              <div className="text-center">
                <h3 className="text-2xl font-normal mb-8 text-gray-300">Backend</h3>
                <div className="flex flex-wrap justify-center gap-6 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg" alt="FastAPI" className="w-16 h-16" />
                    <span className="text-xs text-gray-400">FastAPI</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt="Python" className="w-16 h-16" />
                    <span className="text-xs text-gray-400">Python</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg" alt="PyTorch" className="w-16 h-16" />
                    <span className="text-xs text-gray-400">PyTorch</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" alt="PostgreSQL" className="w-16 h-16" />
                    <span className="text-xs text-gray-400">PostgreSQL</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-teal-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">SQL</span>
                    </div>
                    <span className="text-xs text-gray-400">SQLAlchemy</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/opencv/opencv-original.svg" alt="OpenCV" className="w-16 h-16" />
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
            
            {/* Training Data */}
            {(() => {
              // Training history data (87 epochs)
              const trainLoss = [0.850, 0.341, 0.288, 0.256, 0.234, 0.225, 0.210, 0.205, 0.191, 0.189, 0.177, 0.181, 0.175, 0.170, 0.166, 0.160, 0.164, 0.157, 0.159, 0.153, 0.150, 0.152, 0.145, 0.140, 0.141, 0.135, 0.134, 0.134, 0.135, 0.133, 0.130, 0.132, 0.126, 0.124, 0.127, 0.123, 0.128, 0.121, 0.122, 0.123, 0.118, 0.118, 0.115, 0.117, 0.113, 0.113, 0.120, 0.115, 0.111, 0.115, 0.114, 0.111, 0.109, 0.107, 0.109, 0.109, 0.115, 0.101, 0.105, 0.111, 0.102, 0.107, 0.107, 0.099, 0.100, 0.105, 0.104, 0.104, 0.100, 0.098, 0.099, 0.096, 0.102, 0.096, 0.095, 0.101, 0.094, 0.095, 0.095, 0.096, 0.097, 0.098, 0.097, 0.093];
              const trainAcc = [76.62, 89.58, 91.27, 92.27, 93.03, 93.35, 93.79, 94.00, 94.34, 94.36, 94.85, 94.68, 94.82, 95.11, 95.05, 95.24, 95.17, 95.45, 95.35, 95.58, 95.78, 95.54, 95.95, 95.97, 95.85, 96.08, 96.08, 96.20, 96.11, 96.21, 96.19, 96.15, 96.34, 96.37, 96.28, 96.48, 96.30, 96.46, 96.53, 96.35, 96.59, 96.56, 96.62, 96.64, 96.76, 96.67, 96.57, 96.68, 96.76, 96.67, 96.66, 96.85, 96.84, 96.85, 96.90, 96.86, 96.71, 97.06, 96.90, 96.86, 96.98, 96.87, 96.85, 97.02, 97.09, 97.00, 97.05, 96.92, 97.15, 97.14, 97.20, 97.15, 97.07, 97.34, 97.16, 96.97, 97.26, 97.28, 97.30, 97.18, 97.20, 97.19, 97.23, 97.38];
              const valLoss = [0.186, 0.161, 0.173, 0.119, 0.120, 0.099, 0.100, 0.071, 0.071, 0.071, 0.069, 0.066, 0.073, 0.062, 0.056, 0.076, 0.060, 0.062, 0.071, 0.053, 0.050, 0.057, 0.066, 0.050, 0.055, 0.063, 0.059, 0.077, 0.047, 0.061, 0.050, 0.057, 0.042, 0.049, 0.053, 0.044, 0.050, 0.045, 0.055, 0.044, 0.042, 0.041, 0.039, 0.044, 0.077, 0.041, 0.045, 0.044, 0.063, 0.043, 0.054, 0.037, 0.038, 0.042, 0.039, 0.036, 0.039, 0.037, 0.038, 0.040, 0.035, 0.036, 0.034, 0.038, 0.040, 0.039, 0.044, 0.034, 0.033, 0.067, 0.033, 0.037, 0.039, 0.051, 0.036, 0.036, 0.039, 0.036, 0.033, 0.035, 0.035, 0.039, 0.034, 0.033];
              const valAcc = [94.47, 95.16, 94.39, 96.71, 96.09, 97.38, 97.21, 98.05, 97.99, 97.98, 98.06, 98.29, 97.95, 98.46, 98.40, 97.68, 98.27, 98.18, 97.95, 98.53, 98.66, 98.35, 98.00, 98.68, 98.39, 98.25, 97.86, 97.67, 98.79, 98.13, 98.47, 98.08, 98.90, 98.49, 98.35, 98.54, 98.59, 98.64, 98.24, 98.82, 98.79, 98.94, 98.88, 98.79, 97.25, 98.92, 98.75, 98.65, 97.89, 98.81, 98.41, 98.92, 98.87, 98.86, 98.95, 98.92, 98.94, 98.94, 98.85, 98.81, 98.99, 98.96, 99.13, 98.90, 98.75, 98.89, 98.69, 99.13, 99.18, 97.33, 99.15, 98.98, 98.91, 98.35, 99.11, 98.98, 98.83, 99.11, 99.10, 99.01, 99.08, 98.82, 99.06, 99.08];
              
              const chartData = trainLoss.map((_, i) => ({
                epoch: i + 1,
                trainLoss: trainLoss[i],
                valLoss: valLoss[i],
                trainAcc: trainAcc[i],
                valAcc: valAcc[i],
              }));

              return (
                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                  {/* Loss Chart */}
                  <Card className="p-6 bg-gray-900 border-gray-800">
                    <h3 className="text-xl font-normal mb-6 text-gray-300">Training & Validation Loss</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="epoch" 
                          stroke="#9CA3AF"
                          style={{ fontSize: '12px' }}
                          label={{ value: 'Epoch', position: 'insideBottom', offset: -5, style: { fill: '#9CA3AF' } }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          style={{ fontSize: '12px' }}
                          label={{ value: 'Loss', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          labelStyle={{ color: '#F3F4F6' }}
                        />
                        <Legend wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="trainLoss" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          name="Training Loss"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="valLoss" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          name="Validation Loss"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Accuracy Chart */}
                  <Card className="p-6 bg-gray-900 border-gray-800">
                    <h3 className="text-xl font-normal mb-6 text-gray-300">Training & Validation Accuracy</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="epoch" 
                          stroke="#9CA3AF"
                          style={{ fontSize: '12px' }}
                          label={{ value: 'Epoch', position: 'insideBottom', offset: -5, style: { fill: '#9CA3AF' } }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          style={{ fontSize: '12px' }}
                          domain={[90, 100]}
                          label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          labelStyle={{ color: '#F3F4F6' }}
                          formatter={(value: number) => `${value.toFixed(2)}%`}
                        />
                        <Legend wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="trainAcc" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          name="Training Accuracy"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="valAcc" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          name="Validation Accuracy"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <p className="text-xs text-gray-500 text-center">
                        Best Validation Accuracy: <span className="text-green-400 font-semibold">99.18%</span>
                      </p>
                    </div>
                  </Card>
                </div>
              );
            })()}
          </motion.section>

          {/* Flowchart Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mb-32"
          >
            <h2 className="text-4xl md:text-5xl font-light text-center mb-16">
              Recognition Pipeline
            </h2>
            
            <div className="max-w-5xl mx-auto">
              <Card className="p-8 bg-gray-900 border-gray-800">
                <div className="relative">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg border-2 border-blue-400">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mt-4 mb-2">Webcam Input</h3>
                    <p className="text-sm text-gray-400 text-center max-w-xs">User shows hand sign to camera in real-time</p>
                  </div>

                  {/* Arrow Down */}
                  <div className="flex justify-center mb-8">
                    <svg className="w-8 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg border-2 border-purple-400">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mt-4 mb-2">MediaPipe Detection</h3>
                    <p className="text-sm text-gray-400 text-center max-w-xs">Extracts 21 hand landmarks (x, y, z coordinates)</p>
                  </div>

                  {/* Arrow Down */}
                  <div className="flex justify-center mb-8">
                    <svg className="w-8 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg border-2 border-orange-400">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mt-4 mb-2">Feature Extraction</h3>
                    <p className="text-sm text-gray-400 text-center max-w-xs">Flattens landmarks to 63 features (21 × 3 coordinates)</p>
                  </div>

                  {/* Arrow Down */}
                  <div className="flex justify-center mb-8">
                    <svg className="w-8 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg border-2 border-green-400">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mt-4 mb-2">ONNX Inference</h3>
                    <p className="text-sm text-gray-400 text-center max-w-xs">MLP model predicts sign (A-Z) with confidence score using GPU acceleration</p>
                  </div>

                  {/* Arrow Down */}
                  <div className="flex justify-center mb-8">
                    <svg className="w-8 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  {/* Step 5 */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg border-2 border-red-400">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mt-4 mb-2">Display Result</h3>
                    <p className="text-sm text-gray-400 text-center max-w-xs">Shows detected letter (A-Z) and confidence percentage in real-time</p>
                  </div>

                  {/* Arrow Down */}
                  <div className="flex justify-center mb-8">
                    <svg className="w-8 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  {/* Step 6 */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg border-2 border-teal-400">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mt-4 mb-2">Progress Tracking</h3>
                    <p className="text-sm text-gray-400 text-center max-w-xs">Saves practice session to database via FastAPI (if logged in)</p>
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
            
            <div className="max-w-6xl mx-auto">
              <Card className="p-8 bg-gray-900 border-gray-800">
                <div className="relative">
                  {/* Frontend Client */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg border-2 border-blue-400">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mt-4 mb-2">Frontend API Client</h3>
                    <p className="text-sm text-gray-400 text-center max-w-xs">lib/api.ts sends HTTP requests</p>
                  </div>

                  {/* Arrow Down */}
                  <div className="flex justify-center mb-8">
                    <svg className="w-8 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  {/* FastAPI Server */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg border-2 border-green-400">
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg" alt="FastAPI" className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-semibold mt-4 mb-2">FastAPI Server</h3>
                    <p className="text-sm text-gray-400 text-center max-w-xs">REST API endpoints on port 8000</p>
                  </div>

                  {/* Arrow Down */}
                  <div className="flex justify-center mb-8">
                    <svg className="w-8 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  {/* Routes - Split into two columns */}
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* Lessons Route */}
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg border-2 border-cyan-400">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mt-4 mb-2">Lessons API</h3>
                      <p className="text-sm text-gray-400 text-center">CRUD operations for lessons</p>
                    </div>

                    {/* Progress Route */}
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg border-2 border-yellow-400">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mt-4 mb-2">Progress API</h3>
                      <p className="text-sm text-gray-400 text-center">Track user learning progress</p>
                    </div>
                  </div>

                  {/* Arrows converging */}
                  <div className="flex justify-center mb-8">
                    <div className="relative w-32 h-16">
                      <svg className="absolute left-0 top-0 w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <svg className="absolute right-0 top-0 w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>

                  {/* Database */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg border-2 border-indigo-400">
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" alt="PostgreSQL" className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-semibold mt-4 mb-2">Supabase PostgreSQL</h3>
                    <p className="text-sm text-gray-400 text-center max-w-xs">Stores lessons and user progress data</p>
                  </div>

                  {/* Arrow Down */}
                  <div className="flex justify-center mb-8">
                    <svg className="w-8 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  {/* SQLAlchemy ORM */}
                  <div className="flex flex-col items-center mb-12">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg border-2 border-teal-400">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mt-4 mb-2">SQLAlchemy ORM</h3>
                    <p className="text-sm text-gray-400 text-center max-w-xs">Database models (Lessons, UserProgress)</p>
                  </div>

                  {/* Training Pipeline - Separate section */}
                  <div className="border-t border-gray-800 pt-8">
                    <div className="flex flex-col items-center mb-8">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg border-2 border-red-400">
                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg" alt="PyTorch" className="w-12 h-12" />
                      </div>
                      <h3 className="text-xl font-semibold mt-4 mb-2">Training Pipeline</h3>
                      <p className="text-sm text-gray-400 text-center max-w-xs">PyTorch model training & ONNX export</p>
                    </div>

                    {/* Arrow Down */}
                    <div className="flex justify-center mb-8">
                      <svg className="w-8 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>

                    {/* PyTorch Training */}
                    <div className="flex flex-col items-center mb-8">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg border-2 border-orange-400">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mt-4 mb-2">PyTorch Training</h3>
                      <p className="text-sm text-gray-400 text-center max-w-xs">train.py - MLP model training on 87K+ samples</p>
                    </div>

                    {/* Arrow Down */}
                    <div className="flex justify-center mb-8">
                      <svg className="w-8 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>

                    {/* ONNX Export */}
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg border-2 border-amber-400">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mt-4 mb-2">ONNX Export</h3>
                      <p className="text-sm text-gray-400 text-center max-w-xs">Exported to frontend/public/models/ for browser inference</p>
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
