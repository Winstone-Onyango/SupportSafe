// Server-side bridge between the SupportSafe Next.js app and the AI avatar
// backend (Gemini for the reply, ElevenLabs for the voice, Rhubarb for lip sync).
//
// Talking to the backend from the server keeps the API keys out of the browser
// and sidesteps CORS entirely.
import { NextResponse } from 'next/server';

// Where the avatar backend listens. Override with AVATAR_BACKEND_URL.
const BACKEND_URL = process.env.AVATAR_BACKEND_URL || 'http://localhost:3001';

// Heartbeat used by the Therapy Bot page to show whether the avatar service is
// reachable, so we can render a helpful message instead of a blank frame.
export async function GET() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${BACKEND_URL}/`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    const text = await response.text();
    return NextResponse.json({
      online: true,
      backend: BACKEND_URL,
      message: text,
    });
  } catch (error) {
    return NextResponse.json({
      online: false,
      backend: BACKEND_URL,
      error: error instanceof Error ? error.message : 'Unreachable',
    });
  } finally {
    clearTimeout(timer);
  }
}

// Forwards a chat message to the avatar backend and returns the reply, the
// base64 audio and the lip-sync mouth cues.
export async function POST(request: Request) {
  let payload: { message?: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';
  if (!message) {
    return NextResponse.json({ error: 'A "message" field is required.' }, { status: 400 });
  }

  // Speech generation plus lip sync can take a while, so allow a long timeout.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data ?? { error: `Avatar backend responded with ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      {
        error: aborted
          ? 'The avatar backend took too long to respond.'
          : 'Could not reach the avatar backend. Is it running on port 3001?',
      },
      { status: 504 }
    );
  } finally {
    clearTimeout(timer);
  }
}
