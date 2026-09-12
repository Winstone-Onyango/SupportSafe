// HTTP client for proxying to the backend
import axios from 'axios';
// Next.js server utilities
import { NextResponse } from 'next/server';

// Backend base URL, configurable via environment
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/** POST with one retry to survive transient socket resets (ECONNRESET). */
async function postWithRetry(url: string, body: unknown, tries = 2) {
  let lastErr: unknown;
  // Try up to `tries` times, only retrying on transient network errors
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      // 2-minute timeout for the decomposition call (it calls an LLM)
      return await axios.post(url, body, { timeout: 120000 });
    } catch (err: unknown) {
      lastErr = err;
      // Extract the error code (e.g. ECONNRESET, EPIPE)
      const code =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.code || (err as any)?.cause?.code;
      // Only retry transient connection failures, not HTTP 4xx/5xx responses.
      const isTransient = ['ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'ECONNREFUSED'].includes(code);
      if (!isTransient || attempt === tries - 1) {
        throw err;
      }
      // Wait 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastErr;
}

// POST /api/decompose — sends the generated text to the backend so it can
// extract structured fields (name, location, severity, etc.) via LLM.
export async function POST(req: Request) {
  try {
    // Parse the request body
    const data = await req.json();
    const text: string = data.resText;
    // Reject empty text — nothing to decompose
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'A message is required to process the report' },
        { status: 400 }
      );
    }
    // Forward the text to the backend's decomposition endpoint (with retry)
    const res = await postWithRetry(`${BACKEND_URL}/text-decomposition`, {
      text,
    });
    // Return the extracted structured data to the browser
    return NextResponse.json(
      { decomposed: res.data.extracted_data },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Log for server-side debugging
    console.error('Report decomposition failed:', error);
    return NextResponse.json(
      { error: 'Failed to process the report details' },
      { status: 500 }
    );
  }
}