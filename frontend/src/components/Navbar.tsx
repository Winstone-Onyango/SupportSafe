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
// Icons: hamburger / close for the mobile menu, tick for the active section
import { Check, Menu, X } from 'lucide-react';

// One navigable section of the app.
interface NavItem {
  href: string;
  label: string;
}

// Inner component that receives the current pathname and renders the nav.
// Kept separate so `usePathname()` (a hook) is called in the outer `Navbar`.
function NavContent({ pathname }: { pathname: string }) {
  // Returns true when the given href matches the current route (active link)
  const isActive = (href: string) => pathname === href;
  // Local state holding the currently signed-in user (or null)
  const [user, setUser] = React.useState<AuthUser | null>(null);
  // Whether the mobile dropdown menu is open
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  // The dropdown panel and its trigger, so taps outside can close the menu
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  // Subscribe to auth changes so the nav updates without a page reload
  React.useEffect(() => {
    const update = () => setUser(getCurrentUser());
    update();
    window.addEventListener('supportsafe-auth-changed', update);
    return () => window.removeEventListener('supportsafe-auth-changed', update);
  }, []);

  // Build the className for a desktop nav link: highlight when active, hover otherwise
  const linkClass = (href: string) =>
    `${
      isActive(href)
        ? 'text-blue-700 font-semibold dark:text-blue-400'
        : 'hover:text-blue-700 dark:hover:text-blue-400'
    } transition-colors duration-200`;

  // Build the className for a dropdown (mobile) nav row
  const mobileLinkClass = (href: string) =>
    isActive(href)
      ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-slate-800 dark:text-blue-300'
      : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-200 dark:hover:bg-slate-800 dark:active:bg-slate-700';

  // The set of navigation links, conditionally built by role (same rules as
  // before: admins only see the dashboard, everyone else sees the bot pages).
  const visibleLinks: NavItem[] = [{ href: '/', label: 'Home' }];
  // Create Post — visible to non-admins only
  if (user?.role !== 'admin') {
    visibleLinks.push({ href: '/create-post', label: 'Create Post' });
  }
  // Dashboard — visible to admins only
  if (user?.role === 'admin') {
    visibleLinks.push({ href: '/dashboard', label: 'Dashboard' });
  }
  // Law Bot and Therapy Bot — visible to non-admins (or signed-out users)
  if (user?.role !== 'admin' || !user) {
    visibleLinks.push({ href: '/lawbot', label: 'Law Bot' });
    // Therapy Bot — the 3D AI companion (runs inside SupportSafe)
    visibleLinks.push({ href: '/therapybot', label: 'Therapy Bot' });
  }

  // Chosen a section? Close the dropdown as soon as the route changes.
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Phones behave like a native menu: a tap outside (or Escape) dismisses it.
  React.useEffect(() => {
    if (!mobileMenuOpen) return;

    const closeOnOutsideTap = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      // Taps on the panel itself are handled by the links
      if (menuRef.current?.contains(target)) return;
      // The hamburger button toggles the menu itself
      if (buttonRef.current?.contains(target)) return;
      setMobileMenuOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideTap);
    document.addEventListener('touchstart', closeOnOutsideTap);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideTap);
      document.removeEventListener('touchstart', closeOnOutsideTap);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileMenuOpen]);

  // Growing past the mobile breakpoint (tablet/desktop) hides the dropdown,
  // so drop the open state too and keep the button in sync.
  React.useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const syncState = () => {
      if (desktop.matches) setMobileMenuOpen(false);
    };
    desktop.addEventListener('change', syncState);
    return () => desktop.removeEventListener('change', syncState);
  }, []);

  return (
    // Top nav bar with a translucent backdrop blur. `relative z-40` keeps the
    // mobile dropdown painted above the page content it overlaps.
    <nav className="relative z-40 w-full px-4 sm:px-6 lg:px-8 border-b shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="relative max-w-7xl mx-auto h-16 flex items-center justify-between gap-2">
        {/* Logo / brand name */}
        <Link
          href={'/'}
          className="shrink-0 font-bold text-xl sm:text-2xl tracking-wide text-blue-700 hover:text-indigo-600 transition-colors duration-200"
        >
          Support<span className="text-indigo-700">Safe</span>
        </Link>

        {/* Desktop Navigation Links (hidden on small screens) */}
        <div className="hidden md:flex items-center justify-center gap-8 font-medium text-gray-600 dark:text-gray-300">
          {visibleLinks.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right side controls: theme toggle, auth dropdown, sign out.
            The controls stay icon/short on phones so the header never wraps. */}
        <div className="flex items-center gap-1 sm:gap-2">
          <ModeToggle />
          <LoginDropdown />
          {/* Sign out lives in the top bar on tablet/desktop; on phones it is
              offered inside the sections dropdown to keep the bar uncluttered. */}
          <div className="hidden md:block">
            <SignOut />
          </div>

          {/* Mobile menu button — toggles the dropdown below (same side) */}
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="md:hidden -mr-1 p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-slate-800 dark:active:bg-slate-700 transition-colors"
            aria-label={mobileMenuOpen ? 'Close sections menu' : 'Open sections menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-sections-menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Sections dropdown — a right-side panel that hangs from the
          button. Tapping the hamburger again (or a section, or outside) closes
          it, so the user browses every section without leaving the page. */}
      {mobileMenuOpen && (
        <div
          ref={menuRef}
          id="mobile-sections-menu"
          className="md:hidden absolute right-0 top-full z-50 mt-2 max-h-[calc(100dvh-5rem)] w-64 origin-top-right overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150 dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Sections
          </p>

          {/* Every section the current role can open, with the active one ticked */}
          {visibleLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between gap-2 rounded-xl px-3 py-3 text-base font-medium transition-colors ${mobileLinkClass(
                item.href
              )}`}
            >
              {item.label}
              {isActive(item.href) && <Check size={18} className="shrink-0" />}
            </Link>
          ))}

          {/* Account row: the signed-in email plus sign out. SignOut renders
              nothing when nobody is signed in, so the row stays clean. */}
          <div className="mt-2 border-t border-gray-200 pt-2 dark:border-slate-700">
            {user?.email && (
              <p className="truncate px-3 pb-1 text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            )}
            <div className="pt-1 [&>button]:w-full [&>button]:justify-center md:hidden">
              <SignOut />
            </div>
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
