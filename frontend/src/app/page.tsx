'use client';

import React from 'react';
import HeroBackground from '@/components/hero/HeroBackground';
import StatsSection from '@/components/stats/StatsSection';
import Footer from '@/components/footer/Footer';

const heroImages = [
  '/assets/Seeking%20help.jpg',
  '/assets/AI%20companion.jpg',
  '/assets/banner.jpg',
  '/assets/Therapy%20bot.jpg',
];

const statsData = [
  {
    imageSrc: '/assets/Stop%20GBV.jpg',
    title: 'Stop GBV',
    description: '',
    percentage: '',
    label: '',
  },
  {
    imageSrc: '/assets/GBV1.jpg',
    title: 'GBV - 1',
    description: '',
    percentage: '',
    label: '',
  },
  {
    imageSrc: '/assets/GBV2.jpg',
    title: 'GBV - 2',
    description: '',
    percentage: '',
    label: '',
  },
  {
    imageSrc: '/assets/GBV3.jpg',
    title: 'GBV - 3',
    description: '',
    percentage: '',
    label: '',
  },
];

export default function Home() {
  const [currentImage, setCurrentImage] = React.useState(0);

  return (
    <main className="flex-1">
      {/* Hero Section with Background Slideshow */}
      <HeroBackground
        currentImage={currentImage}
        onImageChange={setCurrentImage}
        imageUrls={heroImages}
        currentMessage={''}
      />

      {/* Statistics Section with GBV Images */}
      <StatsSection stats={statsData} flowImages={heroImages} />

      <section className="bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <blockquote className="border-l-4 border-rose-400 pl-5 italic text-lg md:text-xl lg:text-2xl leading-relaxed text-slate-700">
            “I firmly believe today that the only way to stop violence against women is to speak out and refused to be silenced.”
            <span className="mt-3 block text-sm md:text-base font-medium not-italic text-slate-500">
              — Zainab Salbi
            </span>
          </blockquote>

          <p className="text-center text-sm md:text-base italic text-slate-600 tracking-wide">
            Healing begins when you know you don&apos;t have to face it alone.
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}

