/**
 * Next.js route handler that proxies GET /api/auth/me to the backend.
 * The client's Authorization header is forwarded so the backend can
 * validate the JWT and return the signed-in user's profile.
 */
import { NextRequest, NextResponse } from 'next/server';

// Base URL of the backend, configurable via environment for deployments.
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Handle GET requests for the current user's session.
export async function GET(request: NextRequest) {
  try {
    // Pass through the browser's Authorization header (Bearer token).
    const authorization = request.headers.get('Authorization') || '';
    // Ask the backend who the token belongs to.
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: authorization },
    });
    // Parse the user profile (or an error detail) from the backend.
    const data = await response.json();
    // Relay the backend's status and payload to the browser.
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    // Log for server-side debugging; the user only gets a generic message.
    console.error('Auth me proxy error:', error);
    return NextResponse.json(
      { detail: 'Could not reach the authentication server' },
      { status: 502 }
    );
  }
}
