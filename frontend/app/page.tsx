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

        </div>
      </main>
    </div>
  );
}
