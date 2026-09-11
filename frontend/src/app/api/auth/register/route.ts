/**
 * Next.js route handler that proxies POST /api/auth/register to the backend.
 * The signup form's payload is forwarded so the backend can create the
 * account and return tokens or a validation error.
 */
import { NextRequest, NextResponse } from 'next/server';

// Base URL of the backend, configurable via environment for deployments.
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Handle POST requests from the registration form.
export async function POST(request: NextRequest) {
  try {
    // Read the new account details from the request body.
    const body = await request.json();
    // Forward the details to the backend's register endpoint.
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    // Parse the backend's response (tokens or an error detail).
    const data = await response.json();
    // Relay the backend's status and payload to the browser.
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    // Log for server-side debugging; the user only gets a generic message.
    console.error('Register proxy error:', error);
    return NextResponse.json(
      { detail: 'Could not reach the authentication server' },
      { status: 502 }
    );
  }
}
