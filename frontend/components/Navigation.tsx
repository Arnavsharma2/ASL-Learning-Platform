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
    <nav className="border-b border-gray-800 bg-black">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <h1 className="text-xl font-light tracking-tight cursor-pointer hover:text-gray-400 transition-colors">
              Learn ASL
            </h1>
          </Link>
          <div className="flex items-center gap-6">
            {/* Functional Links */}
            <Link href="/practice" className="text-sm hover:text-gray-400 transition-colors">
              Practice
            </Link>
            <Link href="/learn" className="text-sm hover:text-gray-400 transition-colors">
              Lessons
            </Link>
            <Link href="/quiz" className="text-sm hover:text-gray-400 transition-colors">
              Quiz
            </Link>
            <Link href="/reference" className="text-sm hover:text-gray-400 transition-colors">
              Reference
            </Link>

            {/* User Actions */}
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/dashboard">
                      <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-900">
                        Dashboard
                      </Button>
                    </Link>
                    <Link href="/settings">
                      <Button variant="ghost" className="text-sm text-gray-400 hover:text-white">
                        Settings
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
