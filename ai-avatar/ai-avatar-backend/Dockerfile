# SupportSafe AI Avatar backend — production image for Render / Railway
FROM node:20-slim

# ffmpeg is required for the mp3 -> wav conversion before lip sync
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg ca-certificates curl unzip \
    && rm -rf /var/lib/apt/lists/*

# Rhubarb Lip Sync (official Linux build). index.js auto-discovers the binary
# under /opt/rhubarb, so the zip's internal folder layout doesn't matter.
# If this download or the binary ever fails, the backend degrades gracefully
# to audio-only (no mouth animation) instead of crashing.
RUN curl -fsSL -o /tmp/rhubarb.zip \
      https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/Rhubarb-Lip-Sync-1.13.0-Linux.zip \
    && unzip -q /tmp/rhubarb.zip -d /opt/rhubarb \
    && find /opt/rhubarb -type f -name rhubarb -exec chmod +x {} + \
    && rm /tmp/rhubarb.zip

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY index.js .

# The backend writes generated mp3/wav/json files here at runtime
RUN mkdir -p audios

ENV NODE_ENV=production
# Render injects PORT automatically; the app falls back to 3000
EXPOSE 3000

CMD ["node", "index.js"]
