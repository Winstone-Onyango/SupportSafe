// clsx builds conditional class-name strings
import { clsx, type ClassValue } from 'clsx';
// twMerge resolves conflicting Tailwind classes (e.g. "p-2 p-4" -> "p-4")
import { twMerge } from 'tailwind-merge';

// Standard shadcn/ui helper: merge conditional Tailwind class lists safely
export function cn(...inputs: ClassValue[]) {
  // clsx combines the inputs, twMerge de-duplicates conflicting utilities
  return twMerge(clsx(inputs));
}

// Function to convert coordinates to city name
// Reverse-geocode latitude/longitude into a human-readable place name
export const fetchCityName = async (lat: number, lng: number) => {
  // Network failures must never crash the UI — fall back gracefully
  try {
    // Call the OpenCage reverse-geocoding API with the project key
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}&q=${lat}%2C${lng}`
    );
    // Parse the geocoding results
    const data = await response.json();
    // Prefer the state/province name; fall back when the API found nothing
    return data.results[0]?.components?.state || 'Unknown location';
  } catch (error) {
    // Log the failure for debugging and degrade gracefully
    console.error('Error fetching city name:', error);
    // Generic placeholder shown in the UI
    return 'Unknown location';
  }
};

// Strip parenthesised annotations from a place name (e.g. "Nairobi (Kenya)" -> "Nairobi")
export function cleanText(text: string) {
  return text.replace(/\s?\(.*?\)/g, '').trim(); // Removes anything inside parentheses
}

