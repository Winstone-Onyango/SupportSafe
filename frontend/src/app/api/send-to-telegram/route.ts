// HTTP client for proxying to the backend
import axios from 'axios';
// Next.js server utilities
import { NextResponse } from 'next/server';

// Backend base URL, configurable via environment
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// POST /api/send-to-telegram — posts the encoded image + caption to the
// SupportSafe Telegram channel via the backend bot.
export async function POST(req: Request) {
  try {
    // Parse the image URL and caption from the request body
    const { image_url, caption } = await req.json();
    // Forward the post request to the backend's Telegram bot endpoint
    const res = await axios.post(
      `${BACKEND_URL}/send-to-telegram`,
      { image_url, caption },
      { timeout: 60000 }
    );
    // Relay the backend's response to the browser
    return NextResponse.json(res.data, { status: 200 });
  } catch (error: unknown) {
    // Forward the backend's own status/detail (503 = not configured, 502 = API error)
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    }
    // Generic fallback with a human-readable message
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { detail: `Failed to reach the backend: ${message}` },
      { status: 500 }
    );
  }
}