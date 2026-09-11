/**
 * Next.js route handler that proxies POST /api/auth/login to the Django
 * (FastAPI) backend. The browser never talks to the backend directly, which
 * keeps the backend URL out of client-side code and avoids CORS issues.
 */
import { NextRequest, NextResponse } from 'next/server';

// Base URL of the backend, configurable via environment for deployments.
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Handle POST requests from the login form.
export async function POST(request: NextRequest) {
  try {
    // Read the credentials ({ email, password }) from the request body.
    const body = await request.json();
    // Forward the credentials to the backend's login endpoint.
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    // Parse the backend's response (tokens or an error detail).
    const data = await response.json();
    // Relay the same status code and payload back to the browser.
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    // Log for server-side debugging; the user only gets a generic message.
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { detail: 'Could not reach the authentication server' },
      { status: 502 }
    );
  }
}
