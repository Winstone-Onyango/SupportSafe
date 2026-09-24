'use client';

// React hooks for state and side effects
import React, { useState, useEffect } from 'react';
// The incident-report form (step 1)
import { InputForm } from '@/components/InputForm';
// The share panel (step 3)
import Share from '@/components/Share';
// The multi-step wizard wrapper
import HorizontalLinearStepper from '@/components/MultiStep';
// The image generator (step 2)
import ImageGen from '@/components/ImageGen';

// The "Create Post" page: a 4-step wizard that guides a victim through
// filling out a report, generating an image, hiding their message in it,
// and sharing it to Telegram or Twitter.
function Page() {
  // The final image URL (set after the user picks one in step 2)
  const [resImage, setResImage] = useState<string | null>(null);
  // The primary generated text (from Gemini)
  const [resText, setText] = useState<string | null>(null);
  // The secondary generated text (from Gemma)
  const [resTextGemma, setTextGemma] = useState<string | null>(null);
  // The current step index (0-based; 4 = completed)
  const [activeStep, setActiveStep] = useState(0);
  // Whether the user has shared the post
  const [shared, setShared] = useState(false);

  // When both texts are ready, advance from step 0 to step 1
  useEffect(() => {
    // Move to the next step when resImage is set
    if (resText && resTextGemma) {
      setActiveStep(1);
    }
  }, [resText, resTextGemma]);

  // When an image is selected, advance from step 1 to step 2
  useEffect(() => {
    // Move to the next step when resImage is set
    if (resImage) {
      setActiveStep(2);
    }
  }, [resImage]);

  // When the post is shared, jump to step 4 (completion)
  useEffect(() => {
    if (shared) {
      setActiveStep(4);
    }
  }, [shared]);

  // The content rendered at each step
  const stepContent = [
    // Step 0: the incident-report form
    <InputForm key="step1" setText={setText} setTextGemma={setTextGemma} />,
    // Step 1: the image generator
    <ImageGen
      key="step2"
      text={resText || ''}
      setResImage={setResImage}
      textGemma={resTextGemma || ''}
    />,
    // Step 2: the share panel
    <Share
      key="step3"
      imageURL={resImage || ''}
      setShared={setShared}
      resText={resText || ''}
    />,
  ];

  return (
    <div className="flex items-start sm:items-center justify-center px-1 py-4 sm:px-4 sm:py-12">
      {/* The wizard: renders the stepper + the current step's content */}
      <HorizontalLinearStepper
        activeStep={activeStep}
        stepContent={stepContent}
      />
    </div>
  );
}

export default Page;