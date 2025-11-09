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
    <nav className="border-b bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 cursor-pointer">
              ASL Learning
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/practice">
              <Button variant="outline">Practice</Button>
            </Link>
            <Link href="/learn">
              <Button variant="outline">Lessons</Button>
            </Link>
            <Link href="/quiz">
              <Button variant="outline">Quiz</Button>
            </Link>
            <Link href="/reference">
              <Button variant="outline">Reference</Button>
            </Link>
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/dashboard">
                      <Button variant="outline">Dashboard</Button>
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </span>
                      <Button variant="outline" onClick={handleSignOut}>
                        Sign Out
                      </Button>
                    </div>
                  </>
                ) : (
                  <Link href="/auth/login">
                    <Button>Sign In</Button>
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

