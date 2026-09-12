'use client';
// React library
import React from 'react';
// Next.js router for programmatic navigation
import { useRouter } from 'next/navigation';
// shadcn/ui button
import { Button } from './ui/button';
// Auth helpers: read cached user and sign out
import { getCurrentUser, logout } from '@/lib/auth';

// Sign Out button. Only renders when a user is signed in.
function SignOut() {
  const router = useRouter();
  // Local state holding the currently signed-in user (or null)
  const [user, setUser] = React.useState<ReturnType<typeof getCurrentUser>>(null);

  // Subscribe to auth changes so the button appears/disappears without a reload
  React.useEffect(() => {
    const update = () => setUser(getCurrentUser());
    update();
    window.addEventListener('supportsafe-auth-changed', update);
    return () => window.removeEventListener('supportsafe-auth-changed', update);
  }, []);

  // Nothing to render when no one is signed in
  if (!user) return null;

  // Clear the session and send the user back to the home page
  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  return (
    <Button variant={'outline'} onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}

export default SignOut;
