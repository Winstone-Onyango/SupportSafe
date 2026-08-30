import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hashtag = searchParams.get('hashtag') || 'IloveSupportSafe';
    const maxResults = searchParams.get('max_results') || '25';

    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/hashtag-reports`,
      { params: { hashtag, max_results: maxResults }, timeout: 300000 }
    );
    return NextResponse.json(res.data, { status: 200 });
  } catch (error: unknown) {
    console.error('Hashtag report fetch failed:', error);
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    }
    return NextResponse.json(
      { detail: 'Failed to fetch hashtag reports' },
      { status: 500 }
    );
  }
}