'use client';

import React from 'react';
import { getCurrentUser, type AuthUser } from '@/lib/auth';

interface HeroBackgroundProps {
  currentImage: number;
  onImageChange: (index: number) => void;
  imageUrls: string[];
  imageMessages?: string[];
  currentMessage?: string;
}

const HeroBackground: React.FC<HeroBackgroundProps> = ({
  currentImage,
  onImageChange,
  imageUrls,
  currentMessage,
}) => {
  const [user, setUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    const updateUser = () => setUser(getCurrentUser());
    updateUser();
    window.addEventListener('supportsafe-auth-changed', updateUser);

    return () => window.removeEventListener('supportsafe-auth-changed', updateUser);
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      onImageChange((currentImage + 1) % imageUrls.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentImage, onImageChange, imageUrls.length]);

  const heroTag = currentMessage || 'Trusted support for every step';
  const shouldShowCtaButtons = !user || user.role !== 'admin';

  return (
    <section className="relative isolate overflow-hidden bg-slate-950">
      <div className="absolute inset-0">
        {imageUrls.map((url, index) => (
          <div
            key={url}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentImage ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
            }`}
            style={{
              backgroundImage: `url(${url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-slate-950/45" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/70 to-slate-900/20" />

      <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100 backdrop-blur-sm shadow-lg shadow-slate-950/20">
            {heroTag}
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Empower Survivors with{' '}
            <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              SupportSafe
            </span>
          </h1>

          <p className="mt-5 text-lg font-semibold text-blue-100 sm:text-xl">
            You deserve to feel safe. You deserve to be heard.
          </p>

          <p className="mt-4 text-base leading-7 text-blue-100/90 sm:text-lg">
            If you&apos;re facing abuse, you don&apos;t have to face it alone. SupportSafe gives you a discreet way to seek help, understand your rights, and find a safe space to talk and receive emotional support without judgment.
          </p>

          <p className="mt-3 text-base leading-7 text-blue-100/80 sm:text-lg">
            Your story matters. Your safety matters. And taking the first step can start here.
          </p>

          {shouldShowCtaButtons && (
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:translate-y-[-1px] hover:shadow-xl hover:shadow-blue-900/40">
                Report Now
              </button>
              <button className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white hover:text-slate-900">
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroBackground;