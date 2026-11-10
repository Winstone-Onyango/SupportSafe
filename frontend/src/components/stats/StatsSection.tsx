'use client';

import React from 'react';
import Image from 'next/image';

interface StatsSectionProps {
  stats: {
    imageSrc: string;
    title: string;
    description: string;
    percentage: string;
    label: string;
  }[];
  flowImages?: string[];
}

const StatsSection: React.FC<StatsSectionProps> = ({ stats, flowImages }) => {
  const problemImages = stats.slice(0, 4).map((item) => item.imageSrc);

  const supportSteps = (flowImages && flowImages.length >= 4 ? flowImages : [...problemImages, ...problemImages])
    .slice(0, 4)
    .map((image, index) => ({
      image,
      title: ['Discreet help', 'Safety guidance', 'Support plan', 'Therapy support'][index] || `Step ${index + 1}`,
      description:
        index === 0
          ? 'Private first contact when someone feels unsafe or unsure.'
          : index === 1
            ? 'Clear guidance to understand risks and choose safer next steps.'
            : index === 2
              ? 'A structured plan that helps someone move from panic to progress.'
              : 'Professional support and recovery care when healing begins.',
    }));

  const problemCardStyles = [
    'md:row-span-2 md:rotate-[-2deg]',
    'md:translate-y-8 md:rotate-[1.5deg]',
    'md:-translate-y-3 md:rotate-[2.5deg]',
    'md:translate-y-10 md:rotate-[-1.5deg]',
  ];

  return (
    <section className="bg-[#f3e9dc] py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="min-h-[100vh] rounded-[30px] border border-[#8c5b3c]/20 bg-[#f7f0e6] p-5 shadow-[0_18px_50px_-24px_rgba(73,45,26,0.6)] sm:p-8 lg:p-10">
          <div className="mb-8 text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7a4d2d]">
              The problem
            </p>
            <h2 className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-[#2a170e] sm:text-4xl lg:text-5xl">
              Many survivors are afraid, isolated, and unsure where to turn.
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="space-y-5 text-[#4a2d1d]">
              <p className="text-base leading-7 sm:text-lg">
                In many homes and communities, abuse is hidden behind silence, fear, and shame. Survivors often stay quiet because they do not know what is happening, do not trust the systems around them, or are worried about being judged, embarrassed, or unsafe.
              </p>

              <p className="text-base leading-7 sm:text-lg">
                That silence makes it harder to ask for help early. It keeps people stuck in fear and leaves them carrying emotional pain alone. SupportSafe is built to break that isolation by giving people a safer place to understand their situation and take the next step with confidence.
              </p>

              <div className="rounded-[22px] border border-[#8c5b3c]/20 bg-[#ead8c2] p-4 shadow-inner shadow-[#8a5d3d]/10">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b412a]">
                  Why it matters
                </p>
                <p className="mt-2 text-base leading-7 text-[#3f261c]">
                  Delayed help can increase trauma, risk, and emotional exhaustion. People need discreet guidance, a clear understanding of their options, and a supportive path to recovery.
                </p>
              </div>
            </div>

            <div className="grid auto-rows-[180px] gap-4 sm:grid-cols-2">
              {problemImages.map((image, index) => (
                <article
                  key={`${image}-${index}`}
                  className={`post-card group relative overflow-hidden border border-[#8b5d3d]/25 bg-[#d9c4a5] shadow-[0_18px_40px_-24px_rgba(49,28,14,0.75)] ${problemCardStyles[index]}`}
                  style={{ animationDelay: `${index * 150}ms`, clipPath: 'polygon(3% 5%, 12% 1%, 22% 4%, 32% 0%, 42% 6%, 54% 1%, 63% 7%, 73% 2%, 84% 6%, 94% 1%, 98% 8%, 100% 22%, 97% 35%, 100% 48%, 95% 62%, 100% 74%, 96% 88%, 90% 96%, 72% 100%, 58% 95%, 45% 99%, 29% 96%, 14% 100%, 0% 94%, 2% 76%, 0% 62%, 2% 47%, 0% 24%)', borderRadius: '18px' }}
                >
                  <div className="relative h-full min-h-[180px] overflow-hidden">
                    <Image
                      src={image}
                      alt={`SupportSafe issue ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#241812]/80 via-[#241812]/20 to-transparent" />
                    <div className="absolute inset-0 border border-white/10" />
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f7e5d8]">
                      Real story
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 min-h-[100vh] rounded-[30px] border border-[#36271d]/10 bg-[#2a1d17] p-5 text-white shadow-[0_30px_60px_-25px_rgba(20,12,10,0.8)] sm:p-8 lg:p-10">
          <div className="mb-8 text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d9b99a]">
              How it works
            </p>
            <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-[#f9f1eb] sm:text-4xl">
              How we get you there in 4 steps.
            </h3>
          </div>

          <div className="grid gap-5 lg:grid-cols-4">
            {supportSteps.map((step, index) => (
              <div
                key={step.title}
                className="step-card flex h-full flex-col rounded-[26px] border border-[#d7b695]/15 bg-[#f9efe5]/5 p-4 text-[#f7efe8] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-300 hover:-translate-y-1 hover:bg-[#f9efe5]/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d9b99a]/15 text-sm font-bold text-[#f3d7ba]">
                    {index + 1}
                  </div>
                  <p className="text-base font-semibold text-[#fffaf5]">{step.title}</p>
                </div>

                <div className="relative mt-4 h-44 overflow-hidden rounded-2xl border border-[#d7b695]/15 bg-[#1b120f]">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 25vw"
                    className="object-cover"
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-[#eadfd4]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes paperFade {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .post-card {
          animation: paperFade 0.8s ease-out both;
          position: relative;
          filter: sepia(0.2) saturate(0.8) contrast(1.05);
        }

        .post-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14), transparent 18%),
            radial-gradient(circle at 78% 30%, rgba(120,73,37,0.2), transparent 20%),
            linear-gradient(135deg, rgba(255,255,255,0.10), transparent 28%, rgba(60,34,14,0.18) 68%, transparent 100%);
          pointer-events: none;
        }

        .post-card::after {
          content: '';
          position: absolute;
          inset: 2% 2% 2% 2%;
          border: 1px solid rgba(90,51,30,0.18);
          pointer-events: none;
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
        }

        @media (max-width: 767px) {
          .post-card:nth-child(odd) {
            transform: translateY(9px) rotate(-1deg);
          }

          .post-card:nth-child(even) {
            transform: translateY(-8px) rotate(1.5deg);
          }
        }
      `}</style>
    </section>
  );
};

export default StatsSection;