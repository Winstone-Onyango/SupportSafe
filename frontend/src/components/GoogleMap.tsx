'use client';

import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface GoogleMapProps {
  lat: number;
  lng: number;
  label?: string;
  height?: string;
  zoom?: number;
  className?: string;
}

/**
 * Reusable Google Maps embed component for displaying a location.
 * Uses the Google Maps Embed API (no JavaScript SDK required).
 */
function GoogleMap({
  lat,
  lng,
  label,
  height = '300px',
  zoom = 14,
  className = '',
}: GoogleMapProps) {
  const mapKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_MAP_KEY;

  if (!mapKey) {
    return (
      <div
        className={`rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center text-gray-500 dark:text-gray-400 p-4">
          <MapPin className="mx-auto mb-2" size={32} />
          <p className="text-sm">Google Maps API key not configured</p>
          <p className="text-xs mt-1">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment</p>
        </div>
      </div>
    );
  }

  // Use the place mode with marker for precise location display
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${mapKey}&q=${lat},${lng}&zoom=${zoom}&maptype=roadmap`;

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-300 dark:border-slate-600 ${className}`}>
      <iframe
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={mapUrl}
        title={label || `Location at ${lat},${lng}`}
      />
      {label && (
        <div className="bg-white dark:bg-slate-800 px-3 py-2 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <MapPin size={14} className="text-red-500" />
            <span className="truncate">{label}</span>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Navigation size={12} />
            Directions
          </a>
        </div>
      )}
    </div>
  );
}

export default GoogleMap;
