'use client';

import React from 'react';
import HeroBackground from '@/components/hero/HeroBackground';
import StatsSection from '@/components/stats/StatsSection';
import Footer from '@/components/footer/Footer';

const heroImages = [
  '/assets/Seeking%20help.jpg',
  '/assets/AI%20companion.jpg',
  '/assets/banner.png',
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

      {/* Footer */}
      <Footer />
    </main>
  );
}

