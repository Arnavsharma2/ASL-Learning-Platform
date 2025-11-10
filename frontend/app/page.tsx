'use client';

import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

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
