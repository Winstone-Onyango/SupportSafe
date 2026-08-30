import axios from 'axios';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/** POST with one retry to survive transient socket resets (ECONNRESET). */
async function postWithRetry(url: string, body: unknown, tries = 2) {
  let lastErr: unknown;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return await axios.post(url, body, { timeout: 120000 });
    } catch (err: unknown) {
      lastErr = err;
      const code =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.code || (err as any)?.cause?.code;
      // Only retry transient connection failures, not HTTP 4xx/5xx responses.
      const isTransient = ['ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'ECONNREFUSED'].includes(code);
      if (!isTransient || attempt === tries - 1) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastErr;
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const text: string = data.resText;
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'A message is required to process the report' },
        { status: 400 }
      );
    }
    const res = await postWithRetry(`${BACKEND_URL}/text-decomposition`, {
      text,
    });
    return NextResponse.json(
      { decomposed: res.data.extracted_data },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Report decomposition failed:', error);
    return NextResponse.json(
      { error: 'Failed to process the report details' },
      { status: 500 }
    );
  }
}