'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  AlertCircle,
  CheckCircle2,
  EyeOff,
  RefreshCw,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface TelegramReport {
  message_id: number;
  chat_title?: string | null;
  chat_username?: string | null;
  author: string;
  text: string;
  has_image: boolean;
  decoded_from?: string | null;
  decoded_text: string;
  has_message: boolean;
  telegram_date?: number | null;
}

/**
 * Admin dashboard section: live feed of the SupportSafe Telegram channel.
 * Every post made in the channel (by victims or by the share flow) is
 * indexed by the backend bot, decoded (steganography), and shown here.
 */
function TelegramReports() {
  const [reports, setReports] = React.useState<TelegramReport[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [telegramConfigured, setTelegramConfigured] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/telegram-reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports ?? []);
        setTelegramConfigured(true);
      } else {
        const body = await res.json().catch(() => ({}));
        if (res.status === 503 || body.configured === false) {
          setTelegramConfigured(false);
          setReports([]);
        } else {
          setTelegramConfigured(true);
          setError(body.detail || 'Failed to load the channel feed');
          setReports([]);
        }
      }
    } catch {
      setError('Could not reach the Telegram monitoring service');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const decodedCount = (reports ?? []).filter((r) => r.has_message).length;

  if (loading) {
    return (
      <div className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold">Telegram Channel — Live Feed</h2>
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full bg-gray-300" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-8 w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Telegram Channel —{' '}
          <span className="text-sky-600 dark:text-sky-400">Live Feed</span>
        </h2>
        <Button variant="outline" onClick={load} className="flex items-center gap-2">
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        {(reports ?? []).length} channel post(s) ·{' '}
        <span className="font-semibold text-green-700 dark:text-green-300">
          {decodedCount} decoded message(s)
        </span>
      </p>

      {!telegramConfigured && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/30 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span>
            Telegram channel monitoring is not active yet. Create a bot with{' '}
            <code>@BotFather</code>, add it as an administrator of your channel
            (with &quot;Post messages&quot;), then set{' '}
            <code>TELEGRAM_BOT_TOKEN</code> and{' '}
            <code>TELEGRAM_CHANNEL_ID</code> in your <code>.env</code> file and
            restart the backend.
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Channel posts */}
      <div className="space-y-4">
        {telegramConfigured && (reports ?? []).length === 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-slate-600 px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
            No posts in the channel yet. Posts shared by victims and messages
            sent in the channel will appear here automatically.
          </div>
        )}
        {(reports ?? []).map((report) => (
          <div
            key={report.message_id}
            className="rounded-xl border shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 p-4 flex flex-col sm:flex-row gap-4"
          >
            <div className="sm:w-40 sm:h-40 w-full h-40 relative rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 shrink-0">
              {report.has_image ? (
                <Image
                  src={`/api/telegram-image?message_id=${report.message_id}`}
                  alt={`Channel post image from ${report.author}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <EyeOff size={24} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold flex items-center gap-1.5">
                  <Send size={14} className="text-sky-500" />
                  {report.author}
                </span>
                {report.telegram_date && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(report.telegram_date * 1000).toLocaleString()}
                  </span>
                )}
                {report.chat_username && (
                  <a
                    href={`https://t.me/${report.chat_username}/${report.message_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-600 dark:text-sky-400 underline underline-offset-2"
                  >
                    View in Telegram
                  </a>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 break-words whitespace-pre-line">
                {report.text || '(no text)'}
              </p>
              {report.has_message ? (
                <div className="rounded-lg border border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30 px-3 py-2 text-sm text-green-800 dark:text-green-200">
                  <div className="flex items-center gap-1.5 font-semibold mb-1">
                    <CheckCircle2 size={16} />
                    Hidden message decoded
                    {report.decoded_from && (
                      <span className="font-normal text-xs opacity-70">
                        (from {report.decoded_from})
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-line break-words">
                    {report.decoded_text}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-slate-600 dark:bg-slate-700/50 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <ShieldAlert size={14} />
                  No hidden message found in this post.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TelegramReports;