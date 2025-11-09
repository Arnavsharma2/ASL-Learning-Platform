'use client';

import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { HandRaisedIcon, BookOpenIcon, ChartBarIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          {/* Hero Content */}
          <motion.div
            className="text-center space-y-8 mb-20"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="inline-block">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
                <SparklesIcon className="w-4 h-4" />
                AI-Powered Learning Platform
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white"
            >
              Learn{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                American Sign Language
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            >
              Master ASL with real-time hand tracking, interactive lessons, and personalized feedback powered by AI
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
            >
              <Link href="/practice">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
                  Start Practicing
                  <HandRaisedIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/learn">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Browse Lessons
                  <BookOpenIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Card className="p-8 h-full hover:shadow-xl transition-shadow duration-300 border-2 hover:border-blue-200 dark:hover:border-blue-800">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <HandRaisedIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Real-Time Detection</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  See your hand signs tracked in real-time using MediaPipe technology with instant visual feedback
                </p>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="p-8 h-full hover:shadow-xl transition-shadow duration-300 border-2 hover:border-purple-200 dark:hover:border-purple-800">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <BookOpenIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Interactive Lessons</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Learn the ASL alphabet and common words with step-by-step guidance and practice exercises
                </p>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="p-8 h-full hover:shadow-xl transition-shadow duration-300 border-2 hover:border-green-200 dark:hover:border-green-800">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <ChartBarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Track Progress</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Monitor your learning journey with detailed statistics, charts, and personalized achievements
                </p>
              </Card>
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 py-12 px-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">20+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">ASL Signs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">95%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-2">30fps</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Detection</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">Free</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Forever</div>
            </div>
          </motion.div>

          {/* Tech Stack Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-16 text-center"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Powered by industry-leading technologies
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-600 dark:text-gray-400">
              <span className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">Next.js 14</span>
              <span className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">FastAPI</span>
              <span className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">MediaPipe</span>
              <span className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">TensorFlow.js</span>
              <span className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">Supabase</span>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
