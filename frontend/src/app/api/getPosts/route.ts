// app/api/posts/route.js
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Forward the authorization header from the client if present
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

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
      return NextResponse.json(
        { message: `Error fetching posts: ${response.statusText}` },
        { status: response.status }
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
