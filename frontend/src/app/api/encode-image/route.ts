// Next.js server utilities
import { NextResponse } from 'next/server';
// HTTP client for proxying to the backend
import axios from 'axios';

// Shape of the request body: the message to hide and the image URL to hide it in
interface EncodeImageRequestData {
  text: string;
  img_url?: string;
}

// POST /api/encode-image — hides a victim's message inside an image (steganography).
// The browser calls this route so the backend URL stays server-side.
export async function POST(req: Request) {
  try {
    // Parse the request body
    const data: EncodeImageRequestData = await req.json();
    // Reject empty messages — nothing to hide
    if (!data.text || !data.text.trim()) {
      return NextResponse.json(
        { error: 'A message to hide is required' },
        { status: 400 }
      );
    }

    // Forward the encode request to the backend (3-minute timeout for large images)
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/encode-image`,
      { text: data.text, img_url: data.img_url },
      { timeout: 180000 }
    );
    // Return the URL of the encoded image to the browser
    return NextResponse.json(
      { encodedImage: res.data.encoded_image_url },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Log for server-side debugging
    console.error('Image encoding failed:', error);
    let detail = 'Failed to encode the message into the image';
    // Surface the backend's own error message when available
    if (axios.isAxiosError(error)) {
      const backendDetail = error.response?.data?.detail;
      if (typeof backendDetail === 'string') detail = backendDetail;
    }
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}