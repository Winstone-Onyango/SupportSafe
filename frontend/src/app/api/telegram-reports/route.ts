// HTTP client for proxying to the backend
import axios from 'axios';
// Next.js server utilities
import { NextResponse } from 'next/server';

// Backend base URL, configurable via environment
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// GET /api/telegram-reports — fetches all decoded posts from the
// SupportSafe Telegram channel (indexed by the backend bot).
export async function GET() {
  try {
    // Ask the backend for the list of decoded Telegram posts
    const res = await axios.get(`${BACKEND_URL}/telegram-reports`, {
      timeout: 120000,
    });
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