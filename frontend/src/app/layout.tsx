import type { Metadata } from 'next';
import './globals.css';
import { Roboto } from 'next/font/google';
import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'SupportSafe — Confidential Safety Support for Everyone',
  description: 'SupportSafe is a discreet AI companion for anyone facing abuse. Get help, confidential guidance, mental health support, and legal advice — regardless of gender.',
};

const roboto = Roboto({
  weight: ['100', '300', '500', '400', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
});

function AppShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${roboto.className} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="h-screen flex flex-col">
            <Navbar />
            <main className="flex flex-1 flex-col">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
