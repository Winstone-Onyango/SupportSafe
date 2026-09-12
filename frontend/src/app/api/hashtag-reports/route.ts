// Next.js server utilities
import { NextResponse } from 'next/server';
// HTTP client for proxying to the backend
import axios from 'axios';

// GET /api/hashtag-reports — fetches recent tweets containing the report hashtag.
// Query params: `hashtag` (defaults to #IloveSupportSafe) and `max_results`.
export async function GET(request: Request) {
  try {
    // Parse the optional query parameters
    const { searchParams } = new URL(request.url);
    const hashtag = searchParams.get('hashtag') || 'IloveSupportSafe';
    const maxResults = searchParams.get('max_results') || '25';

    // Forward the request to the backend's hashtag-monitoring endpoint
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/hashtag-reports`,
      { params: { hashtag, max_results: maxResults }, timeout: 300000 }
    );
    // Relay the backend's response (a list of decoded reports)
    return NextResponse.json(res.data, { status: 200 });
  } catch (error: unknown) {
    // Log for server-side debugging
    console.error('Hashtag report fetch failed:', error);
    // Forward the backend's own status/detail when available (e.g. 503 = X API unavailable)
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    }
    return NextResponse.json(
      { detail: 'Failed to fetch hashtag reports' },
      { status: 500 }
    );
  }
}