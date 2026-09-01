'use client';

import RealtimeList from '@/components/RealtimeList';
import TelegramReports from '@/components/TelegramReports';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import React from 'react';
import { getCurrentUser, type AuthUser } from '@/lib/auth';

// The lordicon Player uses lottie-web which needs `document`;
// load it client-side only to avoid SSR prerender errors.
const LiveTitleNoSSR = dynamic(() => import('@/components/LiveTitle'), {
  ssr: false,
});

function Page() {
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

  return (
    <div className=" flex flex-col justify-center mx-auto max-w-5xl w-full p-4">
      <LiveTitleNoSSR />
      <RealtimeList />
      {/* Dedicated Telegram channel monitoring section */}
      <TelegramReports />
    </div>
  );
}

export default Page;
