import { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';

// Small helper that resolves the status pill shown in the header.
const useStatusLabel = () => {
  const { loading, speaking, message } = useChat();
  if (loading) return { label: 'Thinking', tone: 'thinking' };
  if (speaking) return { label: 'Speaking', tone: 'speaking' };
  if (message) return { label: 'Ready', tone: 'ready' };
  return { label: 'Ready to listen', tone: 'ready' };
};

// Colored dot + label describing what the companion is currently doing.
const StatusPill = () => {
  const { label, tone } = useStatusLabel();
  const dot =
    tone === 'speaking'
      ? 'bg-emerald-500 animate-pulse'
      : tone === 'thinking'
        ? 'bg-amber-500 animate-pulse'
        : 'bg-blue-500';

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
};

// Readable transcript so the conversation is never lost when the voice ends.
const Transcript = () => {
  const { transcript, loading } = useChat();
  const scrollRef = useRef(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [transcript, loading]);

  return (
    // Phones: narrower panel beside the compact header card. Wider screens:
    // the roomy max-w-sm panel.
    <div className="pointer-events-auto flex max-h-[38vh] w-[58vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/75 shadow-lg backdrop-blur-md sm:max-h-[45vh] sm:w-full">
      <div className="border-b border-slate-200/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:px-4 sm:py-2 sm:text-xs">
        Conversation
      </div>
      <div
        ref={scrollRef}
        className="flex flex-col gap-2 overflow-y-auto px-2 py-2 sm:px-3 sm:py-3"
      >
        {transcript.length === 0 && (
          <p className="px-1 py-2 text-xs italic text-slate-500 sm:text-sm">
            Share what you are going through. I am here, and this is a safe space.
          </p>
        )}
        {transcript.map((entry) => (
          <div
            key={entry.id}
            className={`max-w-[88%] break-words rounded-2xl px-3 py-2 text-xs leading-relaxed sm:text-sm ${
              entry.role === 'user'
                ? 'self-end bg-blue-600 text-white'
                : 'self-start bg-white text-slate-800 shadow-sm'
            }`}
          >
            {entry.text}
          </div>
        ))}
        {loading && (
          <div className="self-start rounded-2xl bg-white px-3 py-2 text-xs text-slate-400 shadow-sm sm:text-sm">
            <span className="animate-pulse">...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const UI = ({ hidden, ...props }) => {
  const input = useRef();
  const { chat, loading, message, cameraZoomed, setCameraZoomed } = useChat();

  const sendMessage = () => {
    const text = input.current?.value?.trim();
    if (!text) return;
    chat(text);
    input.current.value = '';
    input.current.focus();
  };

  if (hidden) {
    return null;
  }

  // The field stays usable while the avatar speaks so you can keep the
  // conversation going; audio simply queues up behind the current reply.
  const busy = loading && !message;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0 rounded-2xl border border-white/60 bg-white/75 p-2.5 shadow-lg backdrop-blur-md sm:p-4">
          <h1 className="text-base font-black leading-tight text-slate-900 sm:text-xl">
            Support<span className="text-indigo-700">Safe</span> Companion
          </h1>
          <p className="text-[11px] leading-snug text-slate-600 sm:text-sm">
            A private, judgement-free space to talk.
          </p>
          <div className="mt-2">
            <StatusPill />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <Transcript />
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setCameraZoomed(!cameraZoomed)}
          className="pointer-events-auto rounded-full bg-white/75 px-4 py-1.5 text-[11px] font-semibold text-slate-700 shadow backdrop-blur-md transition hover:bg-white sm:py-2 sm:text-xs"
        >
          {cameraZoomed ? 'Zoom out' : 'Zoom in'}
        </button>

        <div className="pointer-events-auto flex w-full max-w-screen-sm items-center gap-2">
          {/* 16px text stops iOS Safari from zooming in when the field is focused */}
          <input
            className="w-full rounded-xl border border-white/60 bg-white/80 p-3 text-base text-slate-800 placeholder:italic placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 sm:p-4"
            placeholder="Type a message..."
            ref={input}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
          />
          <button
            type="button"
            disabled={busy}
            aria-label="Send message"
            onClick={sendMessage}
            className={`shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold uppercase text-white shadow-lg transition hover:bg-blue-700 sm:px-8 sm:py-4 sm:text-base ${
              busy ? 'cursor-not-allowed opacity-40' : ''
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};