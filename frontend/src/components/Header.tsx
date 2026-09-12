'use client';

// Next.js optimized image component
import Image from 'next/image';
// Next.js client-side navigation
import Link from 'next/link';
// React library
import React from 'react';
// Auth helpers: read the cached user profile and its TypeScript type
import { getCurrentUser, type AuthUser } from '@/lib/auth';

// Landing-page hero section shown on the home route.
// Displays a headline, supporting copy, and a banner image.
// The CTA buttons change based on the signed-in user's role.
function Header() {
  // Local state holding the currently signed-in user (or null)
  const [user, setUser] = React.useState<AuthUser | null>(null);

  // Subscribe to auth changes so the buttons update without a page reload
  React.useEffect(() => {
    // Read the cached profile on mount
    const update = () => setUser(getCurrentUser());
    update();
    // Listen for the custom event fired by saveSession/logout
    window.addEventListener('supportsafe-auth-changed', update);
    // Clean up the listener when the component unmounts
    return () => window.removeEventListener('supportsafe-auth-changed', update);
  }, []);

  return (
    // Hero section: full viewport height (minus navbar), centered content
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden py-12 sm:py-16 lg:py-20">
      {/* Gradient background that blends into the banner */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />

      {/* Decorative floating blurred circles for visual depth */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl dark:bg-blue-400/10" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl dark:bg-indigo-400/10" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-cyan-200/20 rounded-full blur-2xl dark:bg-cyan-400/5" />

      {/* Content container, layered above the decorative background */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Two-column layout on large screens, stacked on mobile */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left column: headline, description, and call-to-action buttons */}
          <div className="flex-1 flex flex-col gap-5 text-center lg:text-left">
            {/* Main heading with the app name highlighted in a gradient */}
            <h1 className="font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-800 dark:text-gray-100 leading-tight">
              Empower Survivors with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-400 dark:to-indigo-300">
                SupportSafe
              </span>
            </h1>

            {/* Empathy-driven subheading */}
            <p className="font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-800 dark:text-gray-100 leading-snug max-w-2xl mx-auto lg:mx-0">
              You deserve to feel safe. You deserve to be heard.
            </p>

            {/* Primary description paragraph */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {`If you're facing abuse, you don't have to face it alone. SupportSafe
              gives you a discreet way to seek help, understand your rights, and
              find a safe space to talk and receive emotional support without
              judgment and without having to explain everything at once.`}
            </p>

            {/* Reinforcing closing line */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Your story matters. Your safety matters. And taking the first step
              can start here.
            </p>

            {/* CTA button group — layout changes from column (mobile) to row (desktop) */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 justify-center lg:justify-start">
              {/* Admins go straight to the dashboard */}
              {user?.role === 'admin' ? (
                <Link href="/dashboard">
                  <button className="w-full sm:w-auto px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold text-white rounded-xl border-2 border-blue-700 bg-blue-700 dark:border-blue-300 dark:bg-blue-300 dark:text-slate-800 shadow-md transform hover:scale-105 hover:bg-blue-800 hover:text-white dark:hover:bg-blue-200 transition-all duration-200 ease-in-out flex items-center justify-center gap-2">
                    Go to Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  {/* Primary action for all users: file a report */}
                  <Link href="/create-post">
                    <button className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-base sm:text-lg font-semibold text-white rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out flex items-center justify-center gap-2">
                      Report Now
                    </button>
                  </Link>
                  {/* Secondary action for signed-out users only: sign in */}
                  {!user && (
                    <Link href="/sign-in">
                      <button className="w-full sm:w-auto px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-300 rounded-xl border-2 border-blue-700 dark:border-blue-300 shadow-md transform hover:scale-105 hover:bg-blue-700 hover:text-white dark:hover:bg-blue-300 dark:hover:text-slate-800 transition-all duration-200 ease-in-out flex items-center justify-center gap-2">
                        Sign In
                      </button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right column: the banner image, responsive and blended into the background */}
          <div className="flex-1 flex justify-center lg:justify-end w-full lg:w-auto">
            <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700">
              <Image
                src="/banner.png"
                alt="SupportSafe — helping survivors safely"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                className="object-cover object-center"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Header;