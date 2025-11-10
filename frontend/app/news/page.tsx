'use client';

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function NewsPage() {
  const newsItems = [
    {
      date: '10/14/2025',
      author: 'Platform Team',
      title: 'Announcing Real-Time ASL Recognition with 98.98% Accuracy',
      excerpt: 'We are excited to announce that our platform now achieves 98.98% accuracy in real-time ASL sign recognition, powered by advanced machine learning models running entirely in the browser.',
    },
    {
      date: '9/15/2025',
      author: 'Engineering Team',
      title: 'Client-Side AI: No Server Required for Sign Recognition',
      excerpt: 'Our latest update enables full sign language recognition to run entirely in your browser using ONNX models, eliminating the need for server-side processing and ensuring privacy.',
    },
    {
      date: '3/11/2025',
      author: 'Research Team',
      title: 'The Quest for AI-Powered Sign Language Education',
      excerpt: 'We explore how AI and machine learning are transforming sign language education, making it more accessible and effective than ever before.',
    },
    {
      date: '3/10/2025',
      author: 'Platform Team',
      title: 'Join Our Mission',
      excerpt: 'We are building a platform that places AI at the center of sign language education. Join us in revolutionizing how people learn and communicate through sign language.',
    },
  ];

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
            <h1 className="text-5xl md:text-6xl font-light mb-12">News</h1>
            <div className="space-y-12">
              {newsItems.map((item, index) => (
                <motion.article
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="border-b border-gray-800 pb-8"
                >
                  <div className="text-sm text-gray-500 mb-2">{item.date}</div>
                  <div className="text-sm text-gray-500 mb-4">{item.author}</div>
                  <h2 className="text-2xl md:text-3xl font-light mb-4">{item.title}</h2>
                  <p className="text-lg text-gray-300 leading-relaxed mb-4">{item.excerpt}</p>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Read More →
                  </Link>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

