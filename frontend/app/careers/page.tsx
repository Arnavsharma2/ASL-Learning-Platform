'use client';

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';

export default function CareersPage() {
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
            <h1 className="text-5xl md:text-6xl font-light mb-12">Careers</h1>
            <div className="space-y-8 text-lg md:text-xl text-gray-300 leading-relaxed">
              <p>
                We're always looking for talented individuals who share our passion for using 
                technology to improve sign language education.
              </p>
              <p>
                If you're interested in working on cutting-edge AI, computer vision, or educational 
                technology, we'd love to hear from you.
              </p>
              <div className="mt-12 pt-8 border-t border-gray-800">
                <p className="text-white mb-4">Open Positions:</p>
                <p className="text-gray-400">
                  Currently, we're not actively hiring, but we're always open to connecting with 
                  exceptional candidates. Please reach out to us at{' '}
                  <a href="/contact" className="text-white hover:text-gray-400 underline">contact</a>.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

