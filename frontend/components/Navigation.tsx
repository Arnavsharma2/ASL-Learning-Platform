'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="border-b border-gray-800 bg-black/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <h1 className="text-xl font-light tracking-tight cursor-pointer hover:text-gray-400 transition-all group">
              <span className="relative">
                Learn ASL
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full" />
              </span>
            </h1>
          </Link>
          <div className="flex items-center gap-6">
            {/* Functional Links */}
            <Link href="/reference" className="text-sm hover:text-gray-400 transition-all relative group">
              Reference
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white/50 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/practice" className="text-sm hover:text-gray-400 transition-all relative group">
              Practice
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white/50 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/learn" className="text-sm hover:text-gray-400 transition-all relative group">
              Lessons
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white/50 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/quiz" className="text-sm hover:text-gray-400 transition-all relative group">
              Quiz
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white/50 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/time-challenge" className="text-sm hover:text-gray-400 transition-all relative group">
              Time Challenge
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white/50 transition-all duration-300 group-hover:w-full" />
            </Link>

            {/* User Actions */}
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/dashboard">
                      <Button variant="outline" className="border-white/30 text-white hover:bg-gray-900 hover:border-white/50">
                        Dashboard
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      onClick={handleSignOut}
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Link href="/auth/login">
                    <Button className="bg-white text-black hover:bg-gray-200">
                      Sign In
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
