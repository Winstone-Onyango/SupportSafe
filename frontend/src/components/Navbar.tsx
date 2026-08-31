'use client';
import Link from 'next/link';
import React from 'react';
import { LoginDropdown } from './LoginDropdown';
import { ModeToggle } from './ModeToggle';
import SignOut from './SignOut';
import { usePathname } from 'next/navigation';
import { getCurrentUser, type AuthUser } from '@/lib/auth';

function NavContent({ pathname }: { pathname: string }) {
  const isActive = (href: string) => pathname === href;
  const [user, setUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    const update = () => setUser(getCurrentUser());
    update();
    window.addEventListener('supportsafe-auth-changed', update);
    return () => window.removeEventListener('supportsafe-auth-changed', update);
  }, []);

  const linkClass = (href: string) =>
    `${
      isActive(href) ? 'text-blue-700 font-semibold' : 'hover:text-blue-700'
    } transition-colors duration-200`;

  return (
    <nav className="w-full h-16 px-4 sm:px-6 flex items-center justify-between border-b shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <Link
        href={'/'}
        className="font-bold text-2xl tracking-wide text-blue-700 hover:text-indigo-600 transition-colors duration-200"
      >
        Support<span className="text-indigo-700">Safe</span>
      </Link>
      <div className="flex items-center justify-center gap-10 font-medium text-gray-600">
        <Link href="/" className={linkClass('/')}>
          Home
        </Link>
        {user?.role !== 'admin' && (
          <Link href="/create-post" className={linkClass('/create-post')}>
            Create Post
          </Link>
        )}
        {user?.role === 'admin' && (
          <Link href="/dashboard" className={linkClass('/dashboard')}>
            Dashboard
          </Link>
        )}
        {(user?.role !== 'admin' || !user) && (
          <>
            <Link href="/lawbot" className={linkClass('/lawbot')}>
              Law Bot
            </Link>
            <Link
              href="https://ai-avatar-frontend-coral.vercel.app/"
              className={linkClass('/therapybot')}
            >
              Therapy Bot
            </Link>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <LoginDropdown />
        <SignOut />
      </div>
    </nav>
  );
}

function Navbar() {
  const pathname = usePathname();
  return <NavContent pathname={pathname} />;
}

export default Navbar;
