/**
 * Next.js route handler that proxies chat requests to Google Gemini.
 *
 * The browser sends the user's message here instead of calling Gemini
 * directly, which keeps GEMINI_API_KEY on the server. The reply is returned
 * as { reply: string } for the chat UI to render.
 */
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API key, only available server-side (never bundled for the client).
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Handle POST requests containing { userInput: string }.
export async function POST(req: Request) {
  try {
    // Extract the user's message from the JSON body.
    const { userInput } = await req.json();

    // Initialize the Google Generative AI client.
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
    // Use the fast Gemini chat model.
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    // Call the model to generate content based on user input.
    const result = await model.generateContent(userInput);

    // Return the model's text answer to the browser.
    return NextResponse.json({ reply: result.response.text() });
  } catch (error) {
    // Log for server-side debugging; the user only gets a generic message.
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'There was an issue processing your request.' },
      { status: 500 }
    );
  }
}
