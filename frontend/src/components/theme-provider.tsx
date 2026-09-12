'use client';

// React namespace
import * as React from 'react';
// The actual next-themes provider (renamed to avoid a name clash)
import { ThemeProvider as NextThemesProvider } from 'next-themes';
// TypeScript types for the provider's props
import { type ThemeProviderProps } from 'next-themes/dist/types';

// Thin wrapper around next-themes so the rest of the app can import
// a single, consistently-named ThemeProvider from @/components/theme-provider.
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Delegate everything (attribute, defaultTheme, etc.) to next-themes
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
