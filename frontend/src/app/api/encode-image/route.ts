import { NextResponse } from 'next/server';
import axios from 'axios';

interface EncodeImageRequestData {
  text: string;
  img_url?: string;
}

export async function POST(req: Request) {
  try {
    const data: EncodeImageRequestData = await req.json();
    if (!data.text || !data.text.trim()) {
      return NextResponse.json(
        { error: 'A message to hide is required' },
        { status: 400 }
      );
    }

    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/encode-image`,
      { text: data.text, img_url: data.img_url },
      { timeout: 180000 }
    );
    return NextResponse.json(
      { encodedImage: res.data.encoded_image_url },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Image encoding failed:', error);
    let detail = 'Failed to encode the message into the image';
    if (axios.isAxiosError(error)) {
      const backendDetail = error.response?.data?.detail;
      if (typeof backendDetail === 'string') detail = backendDetail;
    }
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}