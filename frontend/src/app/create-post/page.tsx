'use client';

import React, { useState, useEffect } from 'react';
import { InputForm } from '@/components/InputForm';
import Share from '@/components/Share';
import HorizontalLinearStepper from '@/components/MultiStep';
import ImageGen from '@/components/ImageGen';
function Page() {
  const [resImage, setResImage] = useState<string | null>(null);
  const [resText, setText] = useState<string | null>(null);
  const [resTextGemma, setTextGemma] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    // Move to the next step when resImage is set
    if (resText && resTextGemma) {
      setActiveStep(1);
    }
  }, [resText, resTextGemma]);

  useEffect(() => {
    // Move to the next step when resImage is set
    if (resImage) {
      setActiveStep(2);
    }
  }, [resImage]);

  useEffect(() => {
    if (shared) {
      setActiveStep(4);
    }
  }, [shared]);

  const stepContent = [
    <InputForm key="step1" setText={setText} setTextGemma={setTextGemma} />, // Step 1
    <ImageGen
      key="step2"
      text={resText || ''}
      setResImage={setResImage}
      textGemma={resTextGemma || ''}
    />, // Step 2
    <Share
      key="step3"
      imageURL={resImage || ''}
      setShared={setShared}
      resText={resText || ''}
    />, // Step 2
  ];

  return (
    <div className="flex items-center">
      <HorizontalLinearStepper
        activeStep={activeStep}
        stepContent={stepContent}
      />
    </div>
  );
}

export default Page;
