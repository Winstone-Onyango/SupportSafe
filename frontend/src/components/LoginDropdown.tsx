'use client';

// React namespace (useState, useEffect)
import * as React from 'react';
// Next.js client-side navigation
import Link from 'next/link';
// Next.js router for programmatic navigation
import { useRouter } from 'next/navigation';
// shadcn/ui button
import { Button } from '@/components/ui/button';
// shadcn/ui dropdown menu parts
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Auth helpers: read cached user, sign out, and the user type
import { getCurrentUser, logout, type AuthUser } from '@/lib/auth';

// Conditionally renders either a "Sign In" button (when signed out)
// or a dropdown with the user's name and actions (when signed in).
export function LoginDropdown() {
  const router = useRouter();
  // Local state holding the currently signed-in user (or null)
  const [user, setUser] = React.useState<AuthUser | null>(null);

  // Subscribe to auth changes so the UI updates without a page reload
  React.useEffect(() => {
    const update = () => setUser(getCurrentUser());
    update();
    window.addEventListener('supportsafe-auth-changed', update);
    return () => window.removeEventListener('supportsafe-auth-changed', update);
  }, []);

  // When no user is signed in, render a simple sign-in link
  if (!user) {
    return (
      <Link href="/sign-in">
        {/* Slightly tighter on phones so the header row never wraps */}
        <Button variant="outline" className="px-3 sm:px-4">
          Sign In
        </Button>
      </Link>
    );
  }

  // When a user is signed in, render a dropdown with their info and actions
  return (
    <DropdownMenu>
      {/* The trigger shows the user's name (or email), truncated on phones */}
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="max-w-[8.5rem] px-3 sm:max-w-none sm:px-4">
          <span className="truncate">{user.name || user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      {/* Menu is capped to the viewport width so it never sticks out on phones */}
      <DropdownMenuContent
        align="end"
        className="w-56 max-w-[calc(100vw-2rem)]"
      >
        {/* Header row: the user's email */}
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Admin shortcut to the dashboard */}
        {user.role === 'admin' && (
          <DropdownMenuItem onClick={() => router.push('/dashboard')}>
            Dashboard
          </DropdownMenuItem>
        )}
        {/* Sign out: clear the session and return to the home page */}
        <DropdownMenuItem
          onClick={() => {
            logout();
            router.push('/');
          }}
        >
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
