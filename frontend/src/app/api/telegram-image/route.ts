import axios from 'axios';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/**
 * Proxies channel-post images from the backend so the Telegram bot token
 * never reaches the browser.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('message_id');
  if (!messageId) {
    return NextResponse.json({ detail: 'message_id is required' }, { status: 400 });
  }
  try {
    const res = await axios.get(`${BACKEND_URL}/telegram-image`, {
      params: { message_id: messageId },
      responseType: 'arraybuffer',
      timeout: 60000,
    });
    return new NextResponse(Buffer.from(res.data), {
      status: 200,
      headers: {
        'Content-Type': res.headers['content-type'] || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { detail: `Failed to fetch image: ${message}` },
      { status: 500 }
    );
  }
}