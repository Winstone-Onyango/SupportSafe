// HTTP client for proxying to the backend
import axios from 'axios';
// Next.js server utilities
import { NextResponse } from 'next/server';

// Backend base URL, configurable via environment
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// POST /api/save — saves the extracted report details to the database.
// The body is the decomposed report data produced by the /api/decompose step.
export async function POST(req: Request) {
  try {
    // Parse the report data from the request body
    const data = await req.json();

    // Forward the data to the backend's save endpoint
    const res = await axios.post(`${BACKEND_URL}/save-extracted-data`, data, {
      timeout: 60000,
    });
    // Return the backend's status (e.g. "saved") to the browser
    return NextResponse.json({ data: res.data.status }, { status: 200 });
  } catch (error) {
    // Log for server-side debugging
    console.error('Failed to save report:', error);
    return NextResponse.json(
      { error: 'Failed to save the report' },
      { status: 500 }
    );
  }
}
