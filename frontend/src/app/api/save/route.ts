import axios from 'axios';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const res = await axios.post(`${BACKEND_URL}/save-extracted-data`, data, {
      timeout: 60000,
    });
    return NextResponse.json({ data: res.data.status }, { status: 200 });
  } catch (error) {
    console.error('Failed to save report:', error);
    return NextResponse.json(
      { error: 'Failed to save the report' },
      { status: 500 }
    );
  }
}
