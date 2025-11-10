'use client';

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';

export default function TeamPage() {
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
            <h1 className="text-5xl md:text-6xl font-light mb-12">Team</h1>
            <div className="space-y-8 text-lg md:text-xl text-gray-300 leading-relaxed">
              <p>
                Our team is composed of passionate engineers, researchers, and educators dedicated 
                to advancing sign language learning through technology.
              </p>
              <p>
                We combine expertise in machine learning, computer vision, and educational technology 
                to build tools that make a real difference in people's lives.
              </p>
              <p className="text-gray-500 mt-12">
                Interested in joining our mission? Check out our{' '}
                <a href="/careers" className="text-white hover:text-gray-400 underline">careers page</a>.
              </p>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

