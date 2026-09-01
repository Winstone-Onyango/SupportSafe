import axios from 'axios';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const res = await axios.get(`${BACKEND_URL}/telegram-reports`, {
      timeout: 120000,
    });
    return NextResponse.json(res.data, { status: 200 });
  } catch (error: unknown) {
    // Forward the backend's own status/detail (503 = not configured, 502 = API error)
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { detail: `Failed to reach the backend: ${message}` },
      { status: 500 }
    );
  }
}