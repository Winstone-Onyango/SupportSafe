'use client';
// React library
import React from 'react';
// Avatech AI avatar hook (provides the rendered avatar element)
import { useAvatar } from '@avatechai/avatars/react';
// Guard: blocks admin accounts from viewing bot pages
import RequireNotAdmin from '@/components/RequireNotAdmin';

// Inner content: renders an interactive AI avatar for the therapy bot.
function TherapyBotContent() {
  // useAvatar returns a pre-configured avatar display element
  const { avatarDisplay } = useAvatar({
    avatarId: 'af3f42c9-d1d7-4e14-bd81-bf2e05fd11a3',
    scale: 1,
  });
  return (
    // Center the avatar in the available viewport space
    <div className="h-full flex items-center justify-center">
      {avatarDisplay}
    </div>
  );
}

// Page wrapper: only non-admins can see the therapy bot.
function Page() {
  return (
    <RequireNotAdmin>
      <TherapyBotContent />
    </RequireNotAdmin>
  );
}

export default Page;
