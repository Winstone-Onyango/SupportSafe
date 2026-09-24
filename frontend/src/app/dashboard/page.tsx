'use client';

// Live Twitter hashtag feed (renders nothing when the X API is unavailable)
import RealtimeList from '@/components/RealtimeList';
// Full list of saved victim reports with details and maps
import SavedReports from '@/components/SavedReports';
// Live Telegram channel feed
import TelegramReports from '@/components/TelegramReports';
// Next.js client-side navigation
import Link from 'next/link';
// Next.js dynamic import (for client-only components)
import dynamic from 'next/dynamic';
// React library
import React from 'react';
// Auth helpers: read the cached user profile and its TypeScript type
import { getCurrentUser, type AuthUser } from '@/lib/auth';

// The lordicon Player uses lottie-web which needs `document`;
// load it client-side only to avoid SSR prerender errors.
const LiveTitleNoSSR = dynamic(() => import('@/components/LiveTitle'), {
  ssr: false,
});

// The admin dashboard page. Only accessible to users with the "admin" role.
function Page() {
  // Local state holding the currently signed-in user (or null)
  const [user, setUser] = React.useState<AuthUser | null>(null);
  // Whether the initial auth check has completed
  const [ready, setReady] = React.useState(false);

  // Subscribe to auth changes so the page updates without a reload
  React.useEffect(() => {
    const update = () => {
      setUser(getCurrentUser());
      setReady(true);
    };
    update();
    window.addEventListener('supportsafe-auth-changed', update);
    return () => window.removeEventListener('supportsafe-auth-changed', update);
  }, []);

  // Show a loading indicator while we check auth state
  if (!ready) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  // If the user is not an admin (or not signed in), show an error message
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Not authorized
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-md">
          Only administrators can view the dashboard. Please sign in with an
          admin account to continue.
        </p>
        {/* Show a sign-in link for signed-out users */}
        {!user && (
          <Link href="/sign-in">
            <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200">
              Sign In
            </button>
          </Link>
        )}
      </div>
    );
  }

  // Admin view: the full dashboard with live feeds and saved reports
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col justify-center px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      {/* Animated "Live Updates" title */}
      <LiveTitleNoSSR />
      {/* Twitter hashtag reports (renders nothing while the X API is unavailable) */}
      <RealtimeList />
      {/* All saved victim reports: full details, Google Maps, urgency sorting */}
      <SavedReports />
      {/* Dedicated Telegram channel monitoring section */}
      <TelegramReports />
    </div>
  );
}

export default Page;