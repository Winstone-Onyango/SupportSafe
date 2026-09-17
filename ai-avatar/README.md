# SupportSafe AI Avatar (Therapy Bot / AI Companion)

A 3‑D, voice‑enabled companion that lives inside the SupportSafe Next.js app. It
answers empathetically **(Gemini)**, speaks back with **(ElevenLabs)** and
animates its mouth in sync with the voice **(Rhubarb Lip Sync)**.

The companion is split across three small services that you run together:

| Service | Port | Source | What it does |
|---------|------|--------|--------------|
| Avatar backend (LLM + voice + lip sync) | `3001` | `ai-avatar/ai-avatar-backend/index.js` | Replies via Gemini, generates speech with ElevenLabs, produces mouth‑cue data with Rhubarb |
| Avatar frontend (3D scene) | `5173` | `ai-avatar/ai-avatar-frontend/` | Renders the 3D avatar, transcript panel, and chat input using `react-three-fiber` |
| SupportSafe Next.js app | `3000` | `frontend/` | Hosts `/therapybot`, which embeds the avatar app in an `<iframe>` and proxies chat requests via `/api/avatar-chat` |

## Requirements

* **Node 20+** (`node` / `npm`)
* **ffmpeg** (ships the `ffmpeg` + `ffprobe` binaries). Add to your `PATH`.
* **Rhubarb Lip Sync** – extract the Windows build into `ai-avatar/ai-avatar-backend/`
  * Download: https://github.com/DanielSWolf/rhubarb-lip-sync/releases (v1.13.0)
  * Look for `Rhubarb-Lip-Sync-1.13.0-Windows/rhubarb.exe`
  * …or set `RHUBARB_PATH` / drop `rhubarb.exe` next to `index.js`.
* API keys in `ai-avatar/ai-avatar-backend/.env`:
  * `GEMINI_API_KEY` – https://aistudio.google.com/apikey
  * `ELEVEN_LABS_API_KEY` – https://elevenlabs.io (free tier works)

## Running locally

1. **Backend** (port 3001)
   ```bash
   cd ai-avatar/ai-avatar-backend
   npm install            # one-time
   node index.js          # or: npm run dev  (nodemon auto-reloads on change)
   ```
   You should see, in the console:
   ```
   SupportSafe AI Avatar backend listening on port 3001
   Gemini: configured | ElevenLabs: configured | Model: gemini-3.6-flash
   Voice: ... | speech model: eleven_multilingual_v2 | speed: 0.85 | stability: 0.5
   Lip sync: rhubarb found at ...
   ```

2. **Avatar frontend** (port 5173)
   ```bash
   cd ai-avatar/ai-avatar-frontend
   npm install            # one-time
   npm run dev
   ```

3. **SupportSafe app** (port 3000)
   ```bash
   cd frontend
   npm run dev
   ```
   Then open http://localhost:3000 and click the **Therapy Bot** tab.

## How the three parts connect

* `frontend/src/app/api/avatar-chat/route.ts` proxies the chat request from the
  Next.js page to the avatar backend on port 3001, then returns the reply, the
  base64 audio, and the mouth-cue JSON. This sidesteps CORS entirely.
* `ai-avatar/ai-avatar-frontend/src/hooks/useChat.jsx` posts to port 3001
  directly (it is the standalone dev entry; in the Next.js iframe it still works
  because Vite's dev server sets CORS headers).
* A service probe (`/api/avatar-chat` GET) drives the status chips in the Therapy
  Bot page so you instantly know if the backend or avatar engine is down.

## Tuning the voice

All optional, set in `ai-avatar/ai-avatar-backend/.env`:

```
ELEVEN_LABS_SPEED=0.85            # 0.7–1.2 only; lower = slower / calmer
ELEVEN_LABS_STABILITY=0.5         # 0 = more emotion, 1 = steadier voice
ELEVEN_LABS_SIMILARITY_BOOST=0.75
ELEVEN_LABS_STYLE=0
ELEVEN_LABS_MODEL_ID=eleven_multilingual_v2   # supports `speed`
```

`speed` is clamped to `[0.7, 1.2]` (the API's validated range) to avoid failed
requests. `0.85` measures roughly 20% slower than the default and reads at a
calm ~110 wpm — well suited to a therapy conversation.

## If you see a green "Voice + AI online" but the avatar doesn't speak

1. Open the browser DevTools console on `localhost:5173` — the avatar frontend
   logs connection / audio errors there.
2. Check the backend log: a missing ElevenLabs key falls back to silent,
   text-only replies.
3. Make sure ffmpeg is on your `PATH` (the lip-sync step needs it). If Rhubarb or
   ffmpeg is unavailable, the avatar automatically falls back to a synthetic,
   duration-based mouth pattern so the mouth always moves.

