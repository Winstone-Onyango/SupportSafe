// Spinning loader icon
import { Loader2 } from 'lucide-react';
import React from 'react';

// Route-level fallback shown while a page segment is being fetched
function loading() {
  return (
    // Centered spinner, nudged up so it appears centred under the navbar
    <div className="h-screen flex items-center justify-center">
      <Loader2 size={24} className="animate-spin -mt-[80px]" />
    </div>
  );
}

// Next.js picks this up automatically as the loading UI
export default loading;

