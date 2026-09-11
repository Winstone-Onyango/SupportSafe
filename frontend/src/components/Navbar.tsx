'use client';
import Link from 'next/link';
import React from 'react';
import { LoginDropdown } from './LoginDropdown';
import { ModeToggle } from './ModeToggle';
import SignOut from './SignOut';
import { usePathname } from 'next/navigation';
import { getCurrentUser, type AuthUser } from '@/lib/auth';
import { Menu, X } from 'lucide-react';

function NavContent({ pathname }: { pathname: string }) {
  const isActive = (href: string) => pathname === href;
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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

  const navLinks = (
    <>
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
            href="https://support-safe.vercel.app/"
            className={linkClass('/therapybot')}
          >
            Therapy Bot
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="w-full px-4 sm:px-6 lg:px-8 border-b shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={'/'}
          className="font-bold text-2xl tracking-wide text-blue-700 hover:text-indigo-600 transition-colors duration-200"
        >
          Support<span className="text-indigo-700">Safe</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center justify-center gap-8 font-medium text-gray-600 dark:text-gray-300">
          {navLinks}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          <LoginDropdown />
          <SignOut />
          
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 pb-4">
          <div className="flex flex-col gap-2 pt-2 px-2 font-medium text-gray-600 dark:text-gray-300">
            {React.Children.map(navLinks, (child) =>
              React.isValidElement(child)
                ? React.cloneElement(child as React.ReactElement<{ className?: string; onClick?: () => void }>, {
                    className: `${(child.props as { className?: string }).className} py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800`,
                    onClick: () => setMobileMenuOpen(false),
                  })
                : child
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function Navbar() {
  const pathname = usePathname();
  return <NavContent pathname={pathname} />;
}

export default Navbar;
