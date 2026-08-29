import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('Authorization') || '';
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: authorization },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Auth me proxy error:', error);
    return NextResponse.json(
      { detail: 'Could not reach the authentication server' },
      { status: 502 }
    );
  }
}
