'use client';
// React library
import React from 'react';
// Guard: blocks admin accounts from viewing bot pages
import RequireNotAdmin from '@/components/RequireNotAdmin';
// Icons for the status chips and action buttons
import { AlertTriangle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';

// The 3D avatar experience (ai-avatar/ai-avatar-frontend) is a standalone Vite
// app because it needs react-three-fiber for the WebGL avatar. SupportSafe
// embeds it here so the Therapy Bot lives inside the main app.
const AVATAR_APP_URL =
  process.env.NEXT_PUBLIC_AVATAR_APP_URL || 'http://localhost:5173';

// The avatar app needs the ai-avatar backend for the LLM reply, the voice and
// the lip-sync data. Both are probed so we can explain what is missing.
type ServiceStatus = 'checking' | 'online' | 'offline';

// Small coloured chip showing whether a dependency is reachable.
function StatusChip({
  label,
  status,
}: {
  label: string;
  status: ServiceStatus;
}) {
  const tone =
    status === 'online'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'offline'
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          status === 'online'
            ? 'bg-emerald-500'
            : status === 'offline'
              ? 'bg-rose-500'
              : 'bg-amber-500 animate-pulse'
        }`}
      />
      {label}
      {status === 'offline' && ' offline'}
    </span>
  );
}

// Inner content: wires up the embedded avatar companion.
function TherapyBotContent() {
  // Reachability of the two services the companion depends on.
  const [backend, setBackend] = React.useState<ServiceStatus>('checking');
  const [avatarApp, setAvatarApp] = React.useState<ServiceStatus>('checking');
  // Bumping this remounts the iframe (used by the Retry button).
  const [frameKey, setFrameKey] = React.useState(0);
  // True while a connectivity probe is in flight (drives the spinner state).
  const [probing, setProbing] = React.useState(true);

  // Probes both services and reports whether everything is up.
  const checkServices = React.useCallback(async () => {
    let appUp = false;

    // A no-cors request resolves for any reachable origin and rejects when the
    // server is not listening, which is all we need to know.
    try {
      await fetch(AVATAR_APP_URL, { mode: 'no-cors', cache: 'no-store' });
      appUp = true;
    } catch {
      appUp = false;
    }

    let backendUp = false;
    try {
      const response = await fetch('/api/avatar-chat', { cache: 'no-store' });
      const data = await response.json();
      backendUp = Boolean(data?.online);
    } catch {
      backendUp = false;
    }

    setAvatarApp(appUp ? 'online' : 'offline');
    setBackend(backendUp ? 'online' : 'offline');

    return appUp && backendUp;
  }, []);

  // Poll while something is still down, then stop once the companion is ready.
  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      setProbing(true);
      const everythingUp = await checkServices();
      if (cancelled) return;
      setProbing(false);
      if (!everythingUp) {
        timer = setTimeout(run, 5000);
      }
    };

    setBackend('checking');
    setAvatarApp('checking');
    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [checkServices, frameKey]);

  const retry = () => setFrameKey((key) => key + 1);

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header: title, dependency status and actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-white/80 px-4 py-3 backdrop-blur dark:bg-slate-900/80">
        <div>
          <h1 className="text-lg font-bold text-blue-700 dark:text-blue-400">
            AI Companion
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Talk or type as much or as little as you want. Everything stays
            private.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusChip label="Avatar engine" status={avatarApp} />
          <StatusChip label="Voice + AI" status={backend} />

          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
          >
            <RefreshCw size={14} />
            Retry
          </button>

          {/* Escape hatch: open the companion full screen in its own tab */}
          <a
            href={AVATAR_APP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
          >
            <ExternalLink size={14} />
            Open full screen
          </a>
        </div>
      </div>

      {/* Body: the avatar app itself, or setup instructions while it starts */}
      <div className="relative flex-1 min-h-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        {avatarApp === 'checking' ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm font-medium">Connecting to your companion...</p>
          </div>
        ) : avatarApp === 'offline' ? (
          <div className="flex h-full items-center justify-center p-6">
            <div className="max-w-xl rounded-2xl border border-amber-200 bg-white/90 p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800/90">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 shrink-0 text-amber-500" />
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    The avatar engine is not running yet
                  </h2>
                  <p>
                    The companion renders its 3D avatar with{' '}
                    <code className="rounded bg-gray-100 px-1 dark:bg-slate-700">
                      react-three-fiber
                    </code>
                    , so it runs as a small separate service. Start it with:
                  </p>
                  <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
{`cd ai-avatar/ai-avatar-backend
node index.js

cd ai-avatar/ai-avatar-frontend
npm run dev`}
                  </pre>
                  <p>
                    Expect the avatar app on{' '}
                    <span className="font-medium">{AVATAR_APP_URL}</span> and the
                    backend on port 3001. Then press Retry.
                  </p>
                  <button
                    type="button"
                    onClick={retry}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
                  >
                    {probing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Retry connection
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <iframe
              key={frameKey}
              src={`${AVATAR_APP_URL}/?embedded=1`}
              title="SupportSafe AI Companion"
              // autoplay lets the companion speak as soon as a reply arrives
              allow="autoplay; fullscreen"
              className="h-full w-full border-0"
            />
            {backend === 'offline' && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3">
                <p className="rounded-full bg-rose-600/95 px-4 py-2 text-xs font-semibold text-white shadow-lg">
                  Voice and AI replies are offline - start the avatar backend on
                  port 3001.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Page wrapper: only non-admins can see the therapy bot.
function Page() {
  return (
    <RequireNotAdmin>
      <TherapyBotContent />
    </RequireNotAdmin>
  );
}

export default Page;
