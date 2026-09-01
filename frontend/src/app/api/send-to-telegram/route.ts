import axios from 'axios';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    const { image_url, caption } = await req.json();
    const res = await axios.post(
      `${BACKEND_URL}/send-to-telegram`,
      { image_url, caption },
      { timeout: 60000 }
    );
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