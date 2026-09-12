'use client';

// React namespace (not strictly required here, but consistent with the codebase)
import * as React from 'react';
// Sun and moon icons for the toggle button
import { Moon, Sun } from 'lucide-react';
// next-themes hook for switching themes
import { useTheme } from 'next-themes';

// shadcn/ui button
import { Button } from '@/components/ui/button';
// shadcn/ui dropdown menu parts
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Theme switcher dropdown: light / dark / system.
export function ModeToggle() {
  // setTheme comes from the next-themes provider
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      {/* Toggle button: shows a sun in light mode and a moon in dark mode */}
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      {/* Dropdown with the three theme options */}
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
