// Next.js server utilities
import { NextResponse } from 'next/server';

// GET /api/postbyid/[id] — fetches a single report by its MongoDB id.
// In Next.js 15, `params` is a Promise that must be awaited.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Extract the post id from the route params
  const { id } = await params;

  try {
    // Replace with your backend server URL
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/get-post/${id}`
    );

    // Relay a failure from the backend to the browser
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch post' },
        { status: response.status }
      );
    }

    // Parse the post data and return it
    const post = await response.json();
    return NextResponse.json(post);
  } catch {
    // Generic error — the actual error is logged server-side
    return NextResponse.json(
      { error: 'An error occurred while fetching the post' },
      { status: 500 }
    );
  }
}
