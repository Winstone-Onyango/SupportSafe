'use client';
// React namespace
import * as React from 'react';
// Material UI Box layout helper
import Box from '@mui/material/Box';
// Material UI Stepper components
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
// Check-circle icon for the completion state
import { CheckCircleIcon } from 'lucide-react';

// The four steps of the post-creation flow
const steps = [
  'Fill out the form',
  'Review and Generate Image',
  'Submit post',
  'Submission complete',
];

// Props: the current step index and the content to show at each step
interface HorizontalLinearStepperProps {
  activeStep: number;
  stepContent: React.ReactNode[];
}

// A Material UI stepper that drives the multi-step "Create Post" wizard.
export default function HorizontalLinearStepper({
  activeStep,
  stepContent,
}: HorizontalLinearStepperProps) {
  // State for the celebratory poem fetched on the final step
  const [poem, setPoem] = React.useState(null as string | null);

  // When we reach step 4 (the completion step), fetch a short poem from the API
  React.useEffect(() => {
    if (activeStep === 4 && !poem) {
      const generatePoem = async () => {
        try {
          // Ask the backend (which calls Gemini) for a 10-line poem
          const response = await fetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
              userInput: 'tell me 10 lines poem on equality and safety for everyone',
            }),
            headers: { 'Content-Type': 'application/json' },
          });

          const result = await response.json();
          if (result.reply) {
            setPoem(result.reply);
          }
        } catch (e) {
          // The poem is decorative — never block the UI if it fails
          console.log(e);
        }
      };

      generatePoem();
    }
  }, [activeStep, poem]);

  return (
    <div className="max-w-4xl mx-auto w-full px-2 sm:px-4 mt-4 sm:mt-6">
      {/* The stepper itself: highlights the current step */}
      <Stepper activeStep={activeStep}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length ? (
        // All steps completed: show a success message and the poem
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          mt={4}
        >
          <div className="flex items-center gap-1">
            <CheckCircleIcon style={{ fontSize: 60, color: 'green' }} />
            <Typography sx={{ ml: 2 }} variant="h5">
              Post successfully submitted!
            </Typography>
          </div>
          {poem && (
            <Box
              mt={4}
              p={4}
              sx={{
                fontFamily: 'Georgia, serif',
                fontSize: '1.2rem',
                backgroundColor: '#f9f9f9',
                borderLeft: '4px solid #4CAF50',
                color: '#555',
                textAlign: 'center',
                maxWidth: '600px',
                whiteSpace: 'pre-line',
              }}
            >
              {/* Render the poem one sentence per paragraph */}
              {poem.split('. ').map((line, index) => (
                <Typography key={index} variant="body1" gutterBottom>
                  {line.trim()}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      ) : (
        // Still in progress: render the content for the current step
        <Box sx={{ mt: 2, mb: 1 }}>{stepContent[activeStep]}</Box>
      )}
    </div>
  );
}