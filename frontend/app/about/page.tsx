'use client';

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <main className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-light mb-12">About</h1>
            <div className="space-y-8 text-lg md:text-xl text-gray-300 leading-relaxed">
              <p>
                We are building the world's first AI-powered sign language learning platform 
                that combines real-time hand tracking, machine learning, and personalized education 
                to revolutionize how people learn American Sign Language.
              </p>
              <p>
                Our mission is to make sign language education accessible, accurate, and engaging 
                through cutting-edge technology. By placing AI at the center of the learning experience, 
                we enable learners to practice and master ASL with real-time feedback and adaptive 
                lesson plans.
              </p>
              <p>
                The platform uses advanced computer vision and machine learning models to recognize 
                sign language gestures in real-time, providing instant feedback and tracking progress 
                as learners develop their skills.
              </p>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

