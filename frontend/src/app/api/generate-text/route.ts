// HTTP client for proxying to the backend
import axios from 'axios';
// Next.js server utilities
import { NextResponse } from 'next/server';

// Backend base URL, configurable via environment
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Shape of the request body: all the fields from the incident-report form
interface GenerateTextRequestData {
  name: string;
  phone: string;
  email: string;
  location: { lat: number; lng: number };
  occurrenceDuration: number;
  frequency: number;
  visibleInjuries: 'Yes' | 'No';
  preferredContact: string[];
  culprit: string;
  currentSituation: string;
}

// POST /api/generate-text — proxies text generation to the backend.
// The backend combines the form fields into a prompt and calls Gemini/Gemma
// to produce a discreet message the victim can share.
export async function POST(req: Request) {
  try {
    // Parse the form data from the request body
    const data: GenerateTextRequestData = await req.json();
    // Remap the field names to match the backend's expected schema
    const updatedData = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      location: data.location,
      duration_of_abuse: data.occurrenceDuration,
      frequency_of_incidents: data.frequency,
      preferred_contact_method: data.preferredContact,
      culprit_description: data.culprit,
      current_situation: data.currentSituation,
    };

    console.log('received data:', updatedData);
    // Forward the remapped data to the backend's text-generation endpoint
    const res = await axios.post(
      `${BACKEND_URL}/text-generation`,
      updatedData,
      { timeout: 120000 }
    );
    console.log('Text next api:', res.data.gemini_response);
    // const res = {
    //   data: {
    //     gemini_response:
    //       "This is an urgent plea for help. My name is Kavikumar M and I need immediate assistance. I am located at 13.0646016, 80.2062336. I am reporting a child abuse situation and I am afraid for the child's safety. This has been happening for 10 years, and it happens on average 7 times a week. I need to speak to someone right now.  The abuser is a person with dark skin. The child is currently being hurt and needs your immediate help. Please call me at 9025313327. I need you to come as soon as possible. The situation is incredibly serious and I fear for the child's well-being. ",
    //   },
    // };
    // Return both the Gemini and Gemma responses so the user can pick one
    return NextResponse.json(
      {
        gemini_response: res.data.gemini_response,
        gemma_response: res.data.gemma_response,
      },
      { status: 200 }
    );
  } catch (error) {
    // Log for server-side debugging
    console.error('Text generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate the message text' },
      { status: 500 }
    );
  }
}
