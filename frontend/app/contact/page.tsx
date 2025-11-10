'use client';

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
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
            <h1 className="text-5xl md:text-6xl font-light mb-12">Contact</h1>
            <div className="space-y-8 text-lg md:text-xl text-gray-300 leading-relaxed">
              <p>
                We'd love to hear from you. Whether you have questions about our platform, 
                want to collaborate, or are interested in learning more, please reach out.
              </p>
              <div className="mt-12 pt-8 border-t border-gray-800 space-y-6">
                <div>
                  <h3 className="text-white text-xl mb-2">General Inquiries</h3>
                  <a 
                    href="mailto:contact@asllearning.com" 
                    className="text-gray-400 hover:text-white underline"
                  >
                    contact@asllearning.com
                  </a>
                </div>
                <div>
                  <h3 className="text-white text-xl mb-2">Press & Media</h3>
                  <a 
                    href="mailto:press@asllearning.com" 
                    className="text-gray-400 hover:text-white underline"
                  >
                    press@asllearning.com
                  </a>
                </div>
                <div>
                  <h3 className="text-white text-xl mb-2">Partnerships</h3>
                  <a 
                    href="mailto:partnerships@asllearning.com" 
                    className="text-gray-400 hover:text-white underline"
                  >
                    partnerships@asllearning.com
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

