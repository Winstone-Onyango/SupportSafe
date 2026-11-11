'use client';

// React namespace
import * as React from 'react';
// The actual next-themes provider (renamed to avoid a name clash)
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

// Thin wrapper around next-themes so the rest of the app can import
// a single, consistently-named ThemeProvider from @/components/theme-provider.
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Delegate everything (attribute, defaultTheme, etc.) to next-themes
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
