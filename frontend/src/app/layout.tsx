// Type-only import for the page metadata definition
import type { Metadata } from 'next';
// Global (Tailwind) stylesheet applied to every route
import './globals.css';
// Google Font used across the app
import { Roboto } from 'next/font/google';
// Type-only React import for the children prop
import type { ReactNode } from 'react';
// App navigation bar shown on every page
import Navbar from '@/components/Navbar';
// next-themes provider (light/dark/system)
import { ThemeProvider } from '@/components/theme-provider';
// Toast notification host
import { Toaster } from 'react-hot-toast';

// SEO metadata shared by all pages
export const metadata: Metadata = {
  title: 'SupportSafe — Confidential Safety Support for Everyone',
  description: 'SupportSafe is a discreet AI companion for anyone facing abuse. Get help, confidential guidance, mental health support, and legal advice — regardless of gender.',
};

// Load Roboto in the weights the design uses
const roboto = Roboto({
  weight: ['100', '300', '500', '400', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
});

// Shared HTML shell: theme provider + navbar + toaster around each page
function AppShell({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: next-themes mutates <html> class before hydration
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${roboto.className} antialiased`}
        suppressHydrationWarning
      >
        {/* Theme switching (attribute="class" toggles the "dark" class) */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Full-height column: navbar on top, page content fills the rest */}
          <div className="h-screen flex flex-col">
            <Navbar />
            <main className="flex flex-1 flex-col">{children}</main>
          </div>
          {/* Toast portal (success/error popups) */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

// Root layout wrapping every route with the shared shell
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Render the shell around the active page
  return <AppShell>{children}</AppShell>;
}

