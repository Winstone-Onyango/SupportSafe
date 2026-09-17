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
    <div className="pointer-events-auto flex max-h-[45vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/75 shadow-lg backdrop-blur-md">
      <div className="border-b border-slate-200/70 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        Conversation
      </div>
      <div ref={scrollRef} className="flex flex-col gap-2 overflow-y-auto px-3 py-3">
        {transcript.length === 0 && (
          <p className="px-1 py-2 text-sm italic text-slate-500">
            Share what you are going through. I am here, and this is a safe space.
          </p>
        )}
        {transcript.map((entry) => (
          <div
            key={entry.id}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              entry.role === 'user'
                ? 'self-end bg-blue-600 text-white'
                : 'self-start bg-white text-slate-800 shadow-sm'
            }`}
          >
            {entry.text}
          </div>
        ))}
        {loading && (
          <div className="self-start rounded-2xl bg-white px-3 py-2 text-sm text-slate-400 shadow-sm">
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
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-2xl border border-white/60 bg-white/75 p-4 shadow-lg backdrop-blur-md">
          <h1 className="text-xl font-black leading-tight text-slate-900">
            Support<span className="text-indigo-700">Safe</span> Companion
          </h1>
          <p className="text-sm text-slate-600">
            A private, judgement-free space to talk.
          </p>
          <div className="mt-2">
            <StatusPill />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Transcript />
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => setCameraZoomed(!cameraZoomed)}
          className="pointer-events-auto rounded-full bg-white/75 px-4 py-2 text-xs font-semibold text-slate-700 shadow backdrop-blur-md transition hover:bg-white"
        >
          {cameraZoomed ? 'Zoom out' : 'Zoom in'}
        </button>

        <div className="pointer-events-auto flex w-full max-w-screen-sm items-center gap-2">
          <input
            className="w-full rounded-xl border border-white/60 bg-white/80 p-4 text-slate-800 placeholder:italic placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
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
            onClick={sendMessage}
            className={`rounded-xl bg-blue-600 px-8 py-4 font-semibold uppercase text-white shadow-lg transition hover:bg-blue-700 ${
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