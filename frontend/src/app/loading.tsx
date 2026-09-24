// Spinning loader icon
import { Loader2 } from 'lucide-react';
import React from 'react';

// Route-level fallback shown while a page segment is being fetched
function loading() {
  return (
    // Centered spinner that fills whatever space the page has
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <Loader2 size={24} className="animate-spin" />
    </div>
  );
}

// Next.js picks this up automatically as the loading UI
export default loading;

