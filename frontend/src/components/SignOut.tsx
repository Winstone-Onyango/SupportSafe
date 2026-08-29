'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { getCurrentUser, logout } from '@/lib/auth';

function SignOut() {
  const router = useRouter();
  const [user, setUser] = React.useState<ReturnType<typeof getCurrentUser>>(null);

  React.useEffect(() => {
    const update = () => setUser(getCurrentUser());
    update();
    window.addEventListener('supportsafe-auth-changed', update);
    return () => window.removeEventListener('supportsafe-auth-changed', update);
  }, []);

  if (!user) return null;

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
