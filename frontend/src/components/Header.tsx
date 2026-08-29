import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

function Header() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient background that blends into the banner */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />

      {/* Decorative floating elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl dark:bg-blue-400/10" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl dark:bg-indigo-400/10" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-cyan-200/20 rounded-full blur-2xl dark:bg-cyan-400/5" />

      <div className="relative z-10 container mx-auto px-6 lg:px-12 py-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text content */}
          <div className="flex-1 flex flex-col gap-6 text-center lg:text-left">
            <h1 className="font-extrabold text-4xl md:text-5xl lg:text-6xl text-gray-800 dark:text-gray-100 leading-tight">
              Empower Survivors with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-400 dark:to-indigo-300">
                SupportSafe
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl lg:max-w-xl">
              SupportSafe is a discreet AI companion for anyone facing abuse —
              regardless of gender. Get help, confidential guidance, private mental
              health support, and trusted legal advice, all without exposing your
              situation.
            </p>

            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl lg:max-w-xl">
              Whether you need a safe way to ask for help, emotional support, or
              legal clarity, SupportSafe guides you gently and securely. Your safety
              is our priority.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
              <Link href="/create-post">
                <button className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg font-semibold text-white rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out flex items-center justify-center gap-2">
                  Report Now
                </button>
              </Link>
              <Link href="/sign-in">
                <button className="w-full sm:w-auto px-8 py-3 text-lg font-semibold text-blue-700 dark:text-blue-300 rounded-xl border-2 border-blue-700 dark:border-blue-300 shadow-md transform hover:scale-105 hover:bg-blue-700 hover:text-white dark:hover:bg-blue-300 dark:hover:text-slate-800 transition-all duration-200 ease-in-out flex items-center justify-center gap-2">
                  Sign In
                </button>
              </Link>
            </div>
          </div>

          {/* Banner image — perfectly blended and responsive */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-xl aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700">
              <Image
                src="/banner.png"
                alt="SupportSafe — helping survivors safely"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw"
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