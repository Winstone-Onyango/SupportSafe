// HTTP client for proxying to the backend
import axios from 'axios';
// Next.js server utilities
import { NextRequest, NextResponse } from 'next/server';

// Shape of the request body: the id of the issue to close
interface CloseIssueRequest {
  issueId: string;
}

// POST /api/closeIssue — proxies the request to the backend so the
// frontend doesn't need to know the backend URL.
export async function POST(request: NextRequest) {
  try {
    // Extract the issue id from the JSON body
    const { issueId } = (await request.json()) as CloseIssueRequest;
    // Forward the close request to the backend
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/close-issue/${issueId}`
    );
    // Relay the backend's response to the browser
    return NextResponse.json(response.data, { status: 200 });
  } catch {
    // Generic error — the backend's actual error is logged server-side
    return NextResponse.json(
      { error: 'Failed to close issue' },
      { status: 500 }
    );
  }
}
