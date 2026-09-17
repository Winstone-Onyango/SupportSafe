import { exec } from 'child_process';
import cors from 'cors';
import dotenv from 'dotenv';
import { existsSync, readdirSync } from 'fs';
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

// --- ElevenLabs text-to-speech tuning -------------------------------------
// These are sent as `voice_settings` on every request so the avatar speaks at a
// calm, natural therapy-assistant pace (a `speed` of 1.0 is the API default;
// values below 1.0 slow the delivery down).
const ELEVEN_LABS_MODEL_ID = process.env.ELEVEN_LABS_MODEL_ID || 'eleven_multilingual_v2';
const ELEVEN_LABS_STABILITY = Number(process.env.ELEVEN_LABS_STABILITY ?? 0.5);
const ELEVEN_LABS_SIMILARITY_BOOST = Number(
  process.env.ELEVEN_LABS_SIMILARITY_BOOST ?? 0.75
);
const ELEVEN_LABS_STYLE = Number(process.env.ELEVEN_LABS_STYLE ?? 0);
const ELEVEN_LABS_SPEAKER_BOOST =
  (process.env.ELEVEN_LABS_SPEAKER_BOOST ?? 'true').toLowerCase() !== 'false';
// How many replies are voiced at once (ElevenLabs rate-limits bursts).
const ELEVEN_LABS_CONCURRENCY = Number(process.env.ELEVEN_LABS_CONCURRENCY ?? 2);

// ElevenLabs only accepts speed values between 0.7 and 1.2, so clamp whatever
// the environment provides to keep text-to-speech from being rejected.
const ELEVEN_LABS_SPEED = Math.min(
  1.2,
  Math.max(0.7, Number(process.env.ELEVEN_LABS_SPEED ?? 0.85) || 0.85)
);

// `speed` is only accepted by some models. If the API rejects it we retry the
// request without it so a reply never ends up silent.
let elevenLabsSupportsSpeed = true;

// --- Avatar capabilities ---------------------------------------------------
// These MUST stay in sync with the assets used by the 3D avatar frontend:
//   facial expressions -> `facialExpressions` in ai-avatar-frontend/src/components/Avatar.jsx
//   animations         -> clip names inside ai-avatar-frontend/public/models/animations.glb
const FACIAL_EXPRESSIONS = [
  'default',
  'smile',
  'funnyFace',
  'sad',
  'surprised',
  'angry',
  'crazy',
];
const ANIMATIONS = [
  'Idle',
  'Talking_0',
  'Talking_1',
  'Talking_2',
  'Angry',
  'Crying',
  'Laughing',
  'Terrified',
];

// The model often invents emotion names ("concerned", "supportive", ...). Those
// silently do nothing in the avatar, so map them onto a real expression.
const EXPRESSION_ALIASES = {
  concerned: 'sad',
  worried: 'sad',
  sad: 'sad',
  empathetic: 'sad',
  supportive: 'smile',
  happy: 'smile',
  warm: 'smile',
  calm: 'default',
  neutral: 'default',
  serious: 'default',
  shock: 'surprised',
  surprised: 'surprised',
  angry: 'angry',
  frustrated: 'angry',
  playful: 'funnyFace',
  silly: 'funnyFace',
  distressed: 'crazy',
};

// Maps whatever the LLM produced onto a supported expression.
const normalizeExpression = (value) => {
  const key = typeof value === 'string' ? value.trim() : '';
  if (FACIAL_EXPRESSIONS.includes(key)) return key;
  const lower = key.toLowerCase();
  if (FACIAL_EXPRESSIONS.includes(lower)) return lower;
  return EXPRESSION_ALIASES[lower] || 'default';
};

// Maps whatever the LLM produced onto a real animation clip in animations.glb.
const normalizeAnimation = (value) => {
  const key = typeof value === 'string' ? value.trim() : '';
  if (ANIMATIONS.includes(key)) return key;
  const lower = key.toLowerCase();
  const exact = ANIMATIONS.find((name) => name.toLowerCase() === lower);
  if (exact) return exact;
  if (lower.includes('talk')) return 'Talking_1';
  if (lower.includes('cry')) return 'Crying';
  if (lower.includes('laugh')) return 'Laughing';
  if (lower.includes('angry')) return 'Angry';
  if (lower.includes('fear') || lower.includes('terrif')) return 'Terrified';
  return 'Talking_1';
};

// Rhubarb Lip Sync executable. Download the Windows build from
// https://github.com/DanielSWolf/rhubarb-lip-sync/releases (v1.13.0), extract
// it into this backend folder (or set RHUBARB_PATH to the rhubarb.exe path).
// On Linux hosts (Docker/Render/Railway) the binary is auto-discovered under
// /opt/rhubarb regardless of the zip's internal folder layout.
const findRhubarbBinary = (dir) => {
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        const found = findRhubarbBinary(full);
        if (found) return found;
      } else if (entry.name === 'rhubarb' || entry.name === 'rhubarb.exe') {
        return full;
      }
    }
  }
  return null;
};

const rhubarbCandidates = [
  ...(process.env.RHUBARB_PATH ? [process.env.RHUBARB_PATH] : []),
  path.join(__dirname, 'Rhubarb-Lip-Sync-1.13.0-Windows', 'rhubarb.exe'),
  path.join(
    __dirname,
    'Rhubarb-Lip-Sync-1.13.0-Windows',
    'Rhubarb-Lip-Sync-1.13.0-Windows',
    'rhubarb.exe'
  ),
  // Linux deployment: extracted into /opt/rhubarb by the Dockerfile
  ...(['/opt/rhubarb'].filter((dir) => existsSync(dir))),
];
const rhubarbPath =
  rhubarbCandidates.find((p) => existsSync(p)) ||
  findRhubarbBinary('/opt/rhubarb') ||
  rhubarbCandidates[0];

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('SupportSafe AI Avatar backend is running!');
});

app.get('/voices', async (req, res) => {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': elevenLabsApiKey },
    });
    if (!response.ok) {
      throw new Error(`ElevenLabs returned ${response.status}`);
    }
    res.send(await response.json());
  } catch (error) {
    console.error('Failed to fetch voices:', error.message);
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

// Reads the duration (in seconds) of an audio file using ffprobe (ships with
// ffmpeg). Returns 0 when ffprobe is unavailable.
const probeAudioDuration = async (file) => {
  try {
    const output = await execCommand(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`
    );
    const duration = Number.parseFloat(String(output).trim());
    return Number.isFinite(duration) && duration > 0 ? duration : 0;
  } catch {
    return 0;
  }
};

// Fallback used when Rhubarb cannot run (missing binary / ffmpeg). It builds an
// evenly spaced mouth pattern from the real audio duration so the avatar still
// "talks" instead of standing frozen with a closed mouth.
const syntheticLipsync = (duration) => {
  const total = duration > 0 ? duration : 3;
  const shapes = ['C', 'D', 'E', 'B', 'C', 'F'];
  const step = 0.12; // seconds per mouth shape
  const mouthCues = [];
  let time = 0;
  let index = 0;
  while (time < total) {
    const end = Math.min(time + step, total);
    mouthCues.push({
      start: Number(time.toFixed(2)),
      end: Number(end.toFixed(2)),
      value: shapes[index % shapes.length],
    });
    time = end;
    index += 1;
  }
  // Small rests at the start/end keep the mouth from looking glued open.
  mouthCues.unshift({ start: 0, end: 0.04, value: 'X' });
  mouthCues.push({
    start: Number(total.toFixed(2)),
    end: Number((total + 0.04).toFixed(2)),
    value: 'X',
  });
  return { metadata: { syncDataVersion: 1, duration: total }, mouthCues };
};

// Converts text to speech with ElevenLabs and writes an mp3 into audios/.
// `voice_settings` (including `speed`) keeps the delivery calm and consistent.
const generateSpeech = async (text, fileName, attempt = 1) => {
  const url = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voiceID}`);
  url.searchParams.set('output_format', 'mp3_44100_128');

  const requestSpeech = async (includeSpeed) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text,
        model_id: ELEVEN_LABS_MODEL_ID,
        voice_settings: {
          stability: ELEVEN_LABS_STABILITY,
          similarity_boost: ELEVEN_LABS_SIMILARITY_BOOST,
          style: ELEVEN_LABS_STYLE,
          use_speaker_boost: ELEVEN_LABS_SPEAKER_BOOST,
          ...(includeSpeed ? { speed: ELEVEN_LABS_SPEED } : {}),
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      const error = new Error(
        `ElevenLabs text-to-speech failed (${response.status}): ${detail.slice(
          0,
          300
        )}`
      );
      error.status = response.status;
      throw error;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(fileName, buffer);
  };

  try {
    await requestSpeech(elevenLabsSupportsSpeed);
  } catch (error) {
    // Older / non-multilingual models reject `speed`; disable it and retry once.
    if (
      elevenLabsSupportsSpeed &&
      (error.status === 400 || error.status === 422)
    ) {
      console.warn('ElevenLabs rejected `speed` - retrying without it.');
      elevenLabsSupportsSpeed = false;
      await requestSpeech(false);
      return;
    }

    // Rate limiting (429) and transient 5xx errors are retried with backoff so
    // a busy moment never leaves a reply silent.
    if ((error.status === 429 || error.status >= 500) && attempt <= 3) {
      const delay = 700 * attempt;
      console.warn(
        `ElevenLabs returned ${error.status}; retrying in ${delay}ms (attempt ${attempt}).`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      await generateSpeech(text, fileName, attempt + 1);
      return;
    }

    throw error;
  }
};

// Runs `worker` over `items` with a bounded number of concurrent jobs. The
// ElevenLabs concurrency limit means firing every message at once makes it
// reject some of them, so we keep the parallel requests modest.
const mapWithConcurrency = async (items, limit, worker) => {
  const size = Math.max(1, Math.min(limit, items.length));
  let nextIndex = 0;

  const runners = Array.from({ length: size }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index], index);
    }
  });

    await Promise.all(runners);
};

// Retries an async function (the Gemini call) on transient errors such as 503
// (model overloaded) or 502/504. Backoff grows exponentially so a quick overload
// usually succeeds on the next attempt.
const retry = async (fn, retries = 3, delay = 800) => {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (error) {
      const status = error?.status || error?.code;
      const retryable =
        status === 503 ||
        status === 502 ||
        status === 504 ||
        status === 429 ||
        String(error?.message || '').includes('UNAVAILABLE');
      if (!retryable || attempt >= retries) {
        throw error;
      }
      attempt += 1;
      console.warn(
        `Retryable error (attempt ${attempt}/${retries}): ${error.message}. Retrying in ${delay}ms.`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};


// The LLM returns a high-level emotion name. The avatar model (Wolf3D_Head)
// ships with 52 ARKit blendshapes, so each emotion is translated into real
// facial-muscle weights here instead of a mere emoji.
// ARKit blendshape weights for each facial expression the avatar supports. The
// backend resolves the emotion the LLM chose into these weights and ships them
// with the reply, so the face always matches the words.
const FACIAL_EXPRESSION_PRESETS = {
  default: { browInnerUp: 0.18, mouthSmileLeft: 0.12, mouthSmileRight: 0.12 },
  smile: {
    mouthSmileLeft: 0.6,
    mouthSmileRight: 0.6,
    cheekSquintLeft: 0.35,
    cheekSquintRight: 0.35,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.3,
  },
  funnyFace: {
    tongueOut: 0.7,
    mouthSmileLeft: 0.45,
    mouthSmileRight: 0.45,
    eyeWideLeft: 0.45,
    eyeWideRight: 0.45,
  },
  sad: {
    mouthFrownLeft: 0.65,
    mouthFrownRight: 0.65,
    mouthLowerDownLeft: 0.35,
    mouthLowerDownRight: 0.35,
    browInnerUp: 0.75,
    eyeSquintLeft: 0.35,
    eyeSquintRight: 0.35,
  },
  surprised: {
    eyeWideLeft: 0.85,
    eyeWideRight: 0.85,
    browOuterUpLeft: 0.7,
    browOuterUpRight: 0.7,
    jawOpen: 0.35,
  },
  angry: {
    browDownLeft: 0.8,
    browDownRight: 0.8,
    mouthPressLeft: 0.55,
    mouthPressRight: 0.55,
    noseSneerLeft: 0.3,
    noseSneerRight: 0.3,
  },
  crazy: {
    eyeWideLeft: 0.65,
    eyeWideRight: 0.65,
    mouthRight: 0.45,
    mouthSmileLeft: 0.35,
    mouthSmileRight: 0.35,
    browOuterUpLeft: 0.5,
    browOuterUpRight: 0.5,
  },
};

// Runs ffmpeg + Rhubarb over the generated audio and returns the mouth cues.
const lipSyncMessage = async (baseName) => {
  const time = new Date().getTime();
  console.log(`Starting lip sync for ${baseName}`);
  const mp3File = `audios/${baseName}.mp3`;
  const wavFile = `audios/${baseName}.wav`;
  const jsonFile = `audios/${baseName}.json`;

  await execCommand(`ffmpeg -y -i "${mp3File}" "${wavFile}"`);
  console.log(`Conversion done in ${new Date().getTime() - time}ms`);
  await execCommand(
    `"${rhubarbPath}" -f json -o "${jsonFile}" "${wavFile}" -r phonetic`
  );
  // -r phonetic is faster but less accurate
  console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
  return readJsonTranscript(jsonFile);
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
      '- text: The message you are sending to the user. Keep each message to 1-3 short sentences so it is comfortable to listen to.\n' +
      `- facialExpression: The emotional tone of your message. It MUST be exactly one of: ${FACIAL_EXPRESSIONS.join(', ')}.\n` +
      `- animation: The body animation for the message. It MUST be exactly one of: ${ANIMATIONS.join(', ')}. ` +
      'Use a Talking_* clip while speaking and Idle when not.';

        const rawText = (
      await retry(() =>
        genAI.models.generateContent({
          model: GEMINI_MODEL,
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        })
      )
    )?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      console.error('Expected content parts not found in the response:');
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
  if (!Array.isArray(messages)) {
    messages = [messages]; // Never let a single object break the loop below
  }
  messages = messages.filter(
    (message) => message && typeof message.text === 'string' && message.text.trim()
  );

  // Guarantee the avatar always receives values it can actually render: a real
  // expression name, a real animation clip, and the ARKit blendshape weights
  // that make the emotion visible on the face.
  messages.forEach((message) => {
    message.facialExpression = normalizeExpression(message.facialExpression);
    message.animation = normalizeAnimation(message.animation);
    message.facialExpressionData =
      FACIAL_EXPRESSION_PRESETS[message.facialExpression] ||
      FACIAL_EXPRESSION_PRESETS.default;
  });

  if (messages.length === 0) {
    res
      .status(502)
      .send({ error: 'The language model returned no usable messages.' });
    return;
  }

  // ---------------------------------------------------------------------------
  // 2. Generate speech + lip sync (only when ElevenLabs is configured)
  // ---------------------------------------------------------------------------
  // Unique per-request prefix so two people chatting at once never overwrite
  // each other's audio/lip-sync files.
  const requestId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Voice + lip sync for each message. With no ElevenLabs key we degrade to a
  // text-only reply so the conversation still works.
  if (!elevenLabsApiKey) {
    console.warn('ELEVEN_LABS_API_KEY is not set - returning text-only messages.');
    messages.forEach((message) => {
      message.audio = '';
      message.lipsync = emptyLipsync();
    });
    res.send({ messages });
    return;
  }

  // Speech synthesis and lip sync are the slow part of a reply. They run with a
  // small amount of concurrency (not all at once) because ElevenLabs rejects
  // bursts, and each message is independent so one failure never silences the
  // rest of the reply.
  await mapWithConcurrency(messages, ELEVEN_LABS_CONCURRENCY, async (message, i) => {
    try {
      const baseName = `message_${requestId}_${i}`;
      const fileName = `audios/${baseName}.mp3`;
      // Generate the spoken audio (with a controlled, calm speaking speed).
      await generateSpeech(message.text, fileName);

      // Generate the lip sync. If Rhubarb/ffmpeg is unavailable we fall back
      // to a duration-based mouth pattern so the avatar still animates.
      try {
        message.lipsync = await lipSyncMessage(baseName);
      } catch (lipsyncError) {
        console.error(
          'Lip sync failed (is ffmpeg installed and Rhubarb-Lip-Sync extracted?):',
          lipsyncError.message
        );
        message.lipsync = syntheticLipsync(await probeAudioDuration(fileName));
      }

      if (!message.lipsync?.mouthCues?.length) {
        const duration =
          message.lipsync?.metadata?.duration ||
          (await probeAudioDuration(fileName));
        message.lipsync = syntheticLipsync(duration);
      }

      message.audio = await audioFileToBase64(fileName);
    } catch (ttsError) {
      console.error('Text-to-speech failed:', ttsError.message);
      message.audio = '';
      message.lipsync = emptyLipsync();
    }
  });

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
  console.log(
    `Voice: ${voiceID} | speech model: ${ELEVEN_LABS_MODEL_ID} | ` +
      `speed: ${ELEVEN_LABS_SPEED} | stability: ${ELEVEN_LABS_STABILITY}`
  );
  console.log(
    `Lip sync: rhubarb ${
      existsSync(rhubarbPath) ? `found at ${rhubarbPath}` : 'NOT FOUND (using fallback)'
    }`
  );
});