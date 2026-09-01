import { exec } from 'child_process';
import cors from 'cors';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import voice from 'elevenlabs-node';
import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
// Get a free Gemini API key at https://aistudio.google.com/apikey
// (Keys from Google Cloud projects starting with "AQ." also work here.)
const geminiApiKey = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const genAI = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = process.env.ELEVEN_LABS_VOICE_ID || 'cgSgspJ2msm6clMCkdW9';

// Rhubarb Lip Sync executable. Download the Windows build from
// https://github.com/DanielSWolf/rhubarb-lip-sync/releases (v1.13.0), extract
// it into this backend folder (or set RHUBARB_PATH to the rhubarb.exe path).
const rhubarbCandidates = process.env.RHUBARB_PATH
  ? [process.env.RHUBARB_PATH]
  : [
      path.join(__dirname, 'Rhubarb-Lip-Sync-1.13.0-Windows', 'rhubarb.exe'),
      path.join(
        __dirname,
        'Rhubarb-Lip-Sync-1.13.0-Windows',
        'Rhubarb-Lip-Sync-1.13.0-Windows',
        'rhubarb.exe'
      ),
    ];
const rhubarbPath = rhubarbCandidates.find((p) => existsSync(p)) || rhubarbCandidates[0];

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('SupportSafe AI Avatar backend is running!');
});

app.get('/voices', async (req, res) => {
  try {
    res.send(await voice.getVoices(elevenLabsApiKey));
  } catch (error) {
    res
      .status(500)
      .send({ error: 'Failed to fetch voices. Check ELEVEN_LABS_API_KEY.' });
  }
});

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        error.stderr = stderr;
        reject(error);
      }
      resolve(stdout);
    });
  });
};

// Empty lip sync used when Rhubarb/ffmpeg are not available (audio still
// plays, the mouth just won't animate).
const emptyLipsync = () => ({
  metadata: { syncDataVersion: 1 },
  mouthCues: [],
});

const lipSyncMessage = async (message) => {
  const time = new Date().getTime();
  console.log(`Starting conversion for message ${message}`);
  await execCommand(
    `ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`
    // -y to overwrite the file
  );
  console.log(`Conversion done in ${new Date().getTime() - time}ms`);
  await execCommand(
    `"${rhubarbPath}" -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`
  );
  // -r phonetic is faster but less accurate
  console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
};

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    res.send({
      messages: [
        {
          text: 'Hello, I am your therapy assistant. How are you feeling today?',
          audio: await audioFileToBase64('audios/intro_0.wav'),
          lipsync: await readJsonTranscript('audios/intro_0.json'),
          facialExpression: 'smile',
          animation: 'Talking_1',
        },
        {
          text: "I'm here for you whenever you need someone to talk to!",
          audio: await audioFileToBase64('audios/intro_1.wav'),
          lipsync: await readJsonTranscript('audios/intro_1.json'),
          facialExpression: 'sad',
          animation: 'Crying',
        },
      ],
    });
    return;
  }

  if (!genAI) {
    res.send({
      messages: [
        {
          text: 'Please configure your GEMINI_API_KEY in the ai-avatar-backend/.env file!',
          audio: await audioFileToBase64('audios/api_0.wav'),
          lipsync: await readJsonTranscript('audios/api_0.json'),
          facialExpression: 'angry',
          animation: 'Angry',
        },
        {
          text: 'You can get a free key from aistudio.google.com/apikey',
          audio: await audioFileToBase64('audios/api_1.wav'),
          lipsync: await readJsonTranscript('audios/api_1.json'),
          facialExpression: 'smile',
          animation: 'Laughing',
        },
      ],
    });
    return;
  }

  // ---------------------------------------------------------------------------
  // 1. Generate the reply with Gemini
  // ---------------------------------------------------------------------------
  let messages;
  try {
    const systemInstruction =
      'You are a virtual therapy bot designed to provide emotional support and advice. ' +
      'Your goal is to listen empathetically and offer thoughtful, comforting advice. ' +
      'Respond ONLY with a JSON array of messages (max 3). Each message should include the following properties:\n' +
      '- text: The message you are sending to the user.\n' +
      '- facialExpression: The emotional tone of your message (e.g., smile, sad, calm, concerned, supportive).\n' +
      '- animation: The animation corresponding to the emotional tone (e.g., Talking_0, Talking_1, Talking_2, Idle).';

    const result = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      console.error(
        'Expected content parts not found in the response: ',
        JSON.stringify(result)
      );
      res
        .status(500)
        .send({ error: 'Unexpected response structure from Google Gemini API.' });
      return;
    }

    // Strip any Markdown code block formatting if present
    const cleanJsonString = rawText
      .replace(/^```json\s*\n?/, '')
      .replace(/^```\s*\n?/, '')
      .replace(/\n?```$/, '');

    messages = JSON.parse(cleanJsonString);
    console.log('Parsed JSON response:', messages);
  } catch (error) {
    console.error('Gemini API error:', error);
    res
      .status(500)
      .send({ error: 'Error generating response from Google Gemini API.' });
    return;
  }

  if (messages.messages) {
    messages = messages.messages; // Sometimes the model wraps the array in a "messages" property
  }

  // ---------------------------------------------------------------------------
  // 2. Generate speech + lip sync (only when ElevenLabs is configured)
  // ---------------------------------------------------------------------------
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    if (!elevenLabsApiKey) {
      // Graceful degradation: text-only reply without voice
      console.warn('ELEVEN_LABS_API_KEY is not set - returning text-only message.');
      message.audio = '';
      message.lipsync = emptyLipsync();
      continue;
    }

    try {
      // generate audio file
      const fileName = `audios/message_${i}.mp3`; // The name of your audio file
      const textInput = message.text; // The text you wish to convert to speech
      await voice.textToSpeech(elevenLabsApiKey, voiceID, fileName, textInput);
      // generate lipsync
      try {
        await lipSyncMessage(i);
      } catch (lipsyncError) {
        console.error(
          'Lip sync failed (is ffmpeg installed and Rhubarb-Lip-Sync extracted?):',
          lipsyncError.message
        );
        message.lipsync = emptyLipsync();
      }
      message.audio = await audioFileToBase64(fileName);
      if (!message.lipsync) {
        message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
      }
    } catch (ttsError) {
      console.error('Text-to-speech failed:', ttsError);
      message.audio = '';
      message.lipsync = emptyLipsync();
    }
  }

  res.send({ messages });
});

const readJsonTranscript = async (file) => {
  const data = await fs.readFile(file, 'utf8');
  return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
  const data = await fs.readFile(file);
  return data.toString('base64');
};

app.listen(port, () => {
  console.log(`SupportSafe AI Avatar backend listening on port ${port}`);
  console.log(
    `Gemini: ${geminiApiKey ? 'configured' : 'MISSING (set GEMINI_API_KEY in .env)'} | ` +
      `ElevenLabs: ${elevenLabsApiKey ? 'configured' : 'MISSING (voice disabled)'} | ` +
      `Model: ${GEMINI_MODEL}`
  );
});