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
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" alt="Tailwind" className="w-16 h-16" />
                    <span className="text-xs text-gray-400">Tailwind</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                        <circle cx="9" cy="12" r="1.5" fill="white"/>
                        <circle cx="15" cy="12" r="1.5" fill="white"/>
                        <path d="M8 16h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className="text-xs text-gray-400">MediaPipe</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="white"/>
                        <path d="M9 9h6M9 15h6M9 12h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                        <circle cx="18" cy="6" r="2" fill="white"/>
                      </svg>
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
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlalchemy/sqlalchemy-original.svg" alt="SQLAlchemy" className="w-16 h-16" />
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
                    <h3 className="text-xl font-normal mb-6 text-gray-300 text-center">Training & Validation Loss</h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart 
                        data={chartData} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="epoch" 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 11 }}
                          label={{ 
                            value: 'Epoch', 
                            position: 'insideBottom', 
                            offset: -10, 
                            style: { fill: '#9CA3AF', fontSize: 12 } 
                          }}
                          interval={10}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 11 }}
                          label={{ 
                            value: 'Loss', 
                            angle: -90, 
                            position: 'insideLeft', 
                            offset: 10,
                            style: { fill: '#9CA3AF', fontSize: 12, textAnchor: 'middle' } 
                          }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151', 
                            borderRadius: '8px',
                            padding: '8px 12px'
                          }}
                          labelStyle={{ color: '#F3F4F6', marginBottom: '4px', fontSize: '12px' }}
                          formatter={(value: number) => value.toFixed(4)}
                        />
                        <Legend 
                          wrapperStyle={{ 
                            color: '#9CA3AF', 
                            fontSize: '12px',
                            paddingTop: '20px'
                          }}
                          verticalAlign="bottom"
                        />
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
                    <h3 className="text-xl font-normal mb-6 text-gray-300 text-center">Training & Validation Accuracy</h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart 
                        data={chartData} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="epoch" 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 11 }}
                          label={{ 
                            value: 'Epoch', 
                            position: 'insideBottom', 
                            offset: -10, 
                            style: { fill: '#9CA3AF', fontSize: 12 } 
                          }}
                          interval={10}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 11 }}
                          domain={[90, 100]}
                          label={{ 
                            value: 'Accuracy (%)', 
                            angle: -90, 
                            position: 'insideLeft', 
                            offset: 10,
                            style: { fill: '#9CA3AF', fontSize: 12, textAnchor: 'middle' } 
                          }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151', 
                            borderRadius: '8px',
                            padding: '8px 12px'
                          }}
                          labelStyle={{ color: '#F3F4F6', marginBottom: '4px', fontSize: '12px' }}
                          formatter={(value: number) => `${value.toFixed(2)}%`}
                        />
                        <Legend 
                          wrapperStyle={{ 
                            color: '#9CA3AF', 
                            fontSize: '12px',
                            paddingTop: '20px'
                          }}
                          verticalAlign="bottom"
                        />
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

        </div>
      </main>
    </div>
  );
}
