// app/api/posts/route.js
// HTTP client for proxying to the backend
import axios from 'axios';
// Next.js server utilities
import { NextResponse } from 'next/server';

// GET /api/getPosts — fetches all admin-visible posts from the backend.
// The optional Authorization header is forwarded so the backend can verify the session.
export async function GET(request: Request) {
  try {
    // Forward the authorization header from the client if present
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Ask the backend for all admin-visible posts
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/get-admin-posts`,
      { headers }
    );

    if (response.status === 200) {
      // The backend returns a JSON array directly; wrap it in an object
      // so the frontend can destructure { posts: [...] } consistently
      const posts = Array.isArray(response.data) ? response.data : [];
      return NextResponse.json({ posts }, { status: 200 });
    } else {
      // Non-200 responses carry a status text for debugging
      return NextResponse.json(
        { message: `Error fetching posts: ${response.statusText}` },
        { status: response.status }
      );
    }
  } catch (error) {
    // Extract a human-readable message from the error
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
