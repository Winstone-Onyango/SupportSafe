'use client';
// Next.js client-side navigation
import Link from 'next/link';
// React library
import React from 'react';
// Dropdown that shows sign-in or the user's name
import { LoginDropdown } from './LoginDropdown';
// Light/dark/system theme switcher
import { ModeToggle } from './ModeToggle';
// Sign out button (only rendered when a user is signed in)
import SignOut from './SignOut';
// Hook that returns the current route path
import { usePathname } from 'next/navigation';
// Auth helpers: read the cached user profile and its TypeScript type
import { getCurrentUser, type AuthUser } from '@/lib/auth';
// Hamburger / close icons for the mobile menu
import { Menu, X } from 'lucide-react';

// Inner component that receives the current pathname and renders the nav.
// Kept separate so `usePathname()` (a hook) is called in the outer `Navbar`.
function NavContent({ pathname }: { pathname: string }) {
  // Returns true when the given href matches the current route (active link)
  const isActive = (href: string) => pathname === href;
  // Local state holding the currently signed-in user (or null)
  const [user, setUser] = React.useState<AuthUser | null>(null);
  // Whether the mobile dropdown menu is open
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Subscribe to auth changes so the nav updates without a page reload
  React.useEffect(() => {
    const update = () => setUser(getCurrentUser());
    update();
    window.addEventListener('supportsafe-auth-changed', update);
    return () => window.removeEventListener('supportsafe-auth-changed', update);
  }, []);

  // Build the className for a nav link: highlight when active, hover otherwise
  const linkClass = (href: string) =>
    `${
      isActive(href) ? 'text-blue-700 font-semibold' : 'hover:text-blue-700'
    } transition-colors duration-200`;

  // The set of navigation links, conditionally rendered by role
  const navLinks = (
    <>
      {/* Home link — visible to everyone */}
      <Link href="/" className={linkClass('/')}>
        Home
      </Link>
      {/* Create Post — visible to non-admins only */}
      {user?.role !== 'admin' && (
        <Link href="/create-post" className={linkClass('/create-post')}>
          Create Post
        </Link>
      )}
      {/* Dashboard — visible to admins only */}
      {user?.role === 'admin' && (
        <Link href="/dashboard" className={linkClass('/dashboard')}>
          Dashboard
        </Link>
      )}
      {/* Law Bot and Therapy Bot — visible to non-admins (or signed-out users) */}
      {(user?.role !== 'admin' || !user) && (
        <>
          <Link href="/lawbot" className={linkClass('/lawbot')}>
            Law Bot
          </Link>
          {/* Therapy Bot — the 3D AI companion (runs inside SupportSafe) */}
          <Link href="/therapybot" className={linkClass('/therapybot')}>
            Therapy Bot
          </Link>
        </>
      )}
    </>
  );

  return (
    // Sticky top nav bar with a translucent backdrop blur
    <nav className="w-full px-4 sm:px-6 lg:px-8 border-b shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
        {/* Logo / brand name */}
        <Link
          href={'/'}
          className="font-bold text-2xl tracking-wide text-blue-700 hover:text-indigo-600 transition-colors duration-200"
        >
          Support<span className="text-indigo-700">Safe</span>
        </Link>

        {/* Desktop Navigation Links (hidden on small screens) */}
        <div className="hidden md:flex items-center justify-center gap-8 font-medium text-gray-600 dark:text-gray-300">
          {navLinks}
        </div>

        {/* Right side controls: theme toggle, auth dropdown, sign out */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          <LoginDropdown />
          <SignOut />
          
          {/* Mobile menu button — toggles the dropdown below */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu — only rendered when the hamburger is open */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 pb-4">
          <div className="flex flex-col gap-2 pt-2 px-2 font-medium text-gray-600 dark:text-gray-300">
            {/* Clone each link so we can add padding + close-on-click behavior */}
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

// Outer component: reads the current route and passes it to NavContent.
function Navbar() {
  const pathname = usePathname();
  return <NavContent pathname={pathname} />;
}

export default Navbar;
