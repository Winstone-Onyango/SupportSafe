'use client';

// React namespace (not strictly needed, but consistent)
import * as React from 'react';
// Next.js router for programmatic navigation
import { useRouter } from 'next/navigation';
// shadcn/ui button
import { Button } from '@/components/ui/button';
// Lock icon for the illustration
import { LockIcon } from 'lucide-react';

// The sign-up page. Registration is disabled — only pre-configured admin
// accounts can sign in. This page explains that and links to the sign-in page.
export default function SignUpPage() {
  const router = useRouter();

  return (
    // Full-screen centered layout with a gradient background
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Card container */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Lock icon illustration */}
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <LockIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          {/* Heading */}
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Registration Disabled
          </h1>
          {/* Explanation */}
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Admin accounts are pre-configured. Please use your assigned
            credentials to sign in.
          </p>
          {/* Button to go to the sign-in page */}
          <Button
            onClick={() => router.push('/sign-in')}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl"
          >
            Go to Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
