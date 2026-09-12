// Next.js server utilities
import { NextResponse } from 'next/server';
// HTTP client for proxying to the backend
import axios from 'axios';

// Shape of the request body: the generated text and the image prompt
interface GenerateImageRequestData {
  generatedText: string;
  imagePrompt: string;
}

// POST /api/generate-image — proxies image generation to the backend.
// The browser sends the prompt; the backend calls the image-generation model.
export async function POST(req: Request) {
  try {
    // Parse the request body
    const data: GenerateImageRequestData = await req.json();
    console.log('Received data:', data);

    // Forward the prompt to the backend's image-generation endpoint
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/generate-image`,
      { prompt: data.imagePrompt }
    );
    // const res = {
    //   data: {
    //     image_urls: [
    //       'https://images.pexels.com/photos/1133957/pexels-photo-1133957.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    //       'https://images.pexels.com/photos/247599/pexels-photo-247599.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    //       'https://img-cdn.pixlr.com/image-generator/history/65bb506dcb310754719cf81f/ede935de-1138-4f66-8ed7-44bd16efc709/small.webp',
    //     ],
    //   },
    // };
    // console.log('Image Generation /api/generate-image:', res.data);
    // Extract the array of generated image URLs
    const imageUrls = res.data.image_urls; // Array of image URLs
    // Return the URLs so the user can pick one
    return NextResponse.json({ images: imageUrls }, { status: 200 });
  } catch (error: unknown) {
    // Log for server-side debugging
    console.error('Image generation failed:', error);
    let detail = 'Failed to generate images';
    // Surface the backend's own error message when available
    if (axios.isAxiosError(error)) {
      const backendDetail = error.response?.data?.detail;
      if (typeof backendDetail === 'string') detail = backendDetail;
    }
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
