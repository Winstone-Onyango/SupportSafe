'use client';

import Link from 'next/link';
import React from 'react';
import { getCurrentUser, type AuthUser } from '@/lib/auth';

/**
 * Blocks admin accounts from viewing the wrapped content.
 *
 * Admins get a monitoring-only experience (Dashboard), so the bot pages
 * (Law Bot / Therapy Bot) are off-limits even when accessed directly by URL.
 */
function RequireNotAdmin({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const update = () => {
      setUser(getCurrentUser());
      setReady(true);
    };
    update();
    window.addEventListener('supportsafe-auth-changed', update);
    return () => window.removeEventListener('supportsafe-auth-changed', update);
  }, []);

  if (!ready) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  if (user?.role === 'admin') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Not authorized
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-md">
          Administrator accounts have a monitoring-only view. The bot pages are
          not available for admins.
        </p>
        <Link href="/dashboard">
          <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200">
            Go to Dashboard
          </button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

export default RequireNotAdmin;