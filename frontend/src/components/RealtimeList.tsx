'use client';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  CheckCircle2,
  EyeOff,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { REPORT_HASHTAG } from './Share';

interface HashtagReport {
  tweet_id: string;
  author: string;
  text: string;
  image_url?: string | null;
  decoded_from?: string | null;
  decoded_text: string;
  has_message: boolean;
  created_at?: string | null;
}

function RealtimeList() {
  const [reports, setReports] = React.useState<HashtagReport[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [twitterConfigured, setTwitterConfigured] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/hashtag-reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports ?? []);
        setTwitterConfigured(true);
      } else {
        const body = await res.json().catch(() => ({}));
        if (res.status === 503 || body.configured === false) {
          setTwitterConfigured(false);
          setReports([]);
        } else {
          setTwitterConfigured(true);
          setError(body.detail || 'Failed to load hashtag reports');
          setReports([]);
        }
      }
    } catch {
      setError('Could not reach the report monitoring service');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const decodedCount = (reports ?? []).filter((r) => r.has_message).length;

  // Twitter/X hashtag monitoring is dormant while the X API is unavailable
  // (not configured or out of credits). The whole section hides itself so no
  // payment errors clutter the dashboard - and reappears automatically once
  // the API works again. Saved reports and Telegram live in their own
  // sections on the dashboard page.
  if (!twitterConfigured || error) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        <h2 className="text-xl font-semibold">
          Live Reports — #{REPORT_HASHTAG}
        </h2>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full bg-gray-300" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4 w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Live Reports —{' '}
          <span className="text-blue-700 dark:text-blue-300">
            #{REPORT_HASHTAG}
          </span>
        </h2>
        <Button variant="outline" onClick={load} className="flex items-center gap-2">
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        {reports?.length ?? 0} post(s) found with the hashtag ·{' '}
        <span className="font-semibold text-green-700 dark:text-green-300">
          {decodedCount} decoded message(s)
        </span>
      </p>

      {!twitterConfigured && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/30 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span>
            Twitter API credentials are not configured, so hashtag monitoring is
            unavailable. Add <code>TWITTER_BEARER_TOKEN</code> (plus the posting
            keys) to your <code>.env</code> file to enable it. Locally saved
            reports are shown below in the meantime.
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Decoded hashtag reports */}
      <div className="space-y-4">
        {(reports ?? []).map((report) => (
          <div
            key={report.tweet_id}
            className="rounded-xl border shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 p-4 flex flex-col sm:flex-row gap-4"
          >
            <div className="sm:w-40 sm:h-40 w-full h-40 relative rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 shrink-0">
              {report.image_url ? (
                <Image
                  src={report.image_url}
                  alt={`Report image from @${report.author}`}
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
                <span className="font-semibold">@{report.author}</span>
                {report.created_at && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(report.created_at).toLocaleString()}
                  </span>
                )}
                <Link
                  href={`https://twitter.com/${report.author}/status/${report.tweet_id}`}
                  target="_blank"
                  className="text-xs text-blue-600 dark:text-blue-400 underline underline-offset-2"
                >
                  View post
                </Link>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 break-words">
                {report.text}
              </p>
              {report.has_message ? (
                <div className="rounded-lg border border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30 px-3 py-2 text-sm text-green-800 dark:text-green-200">
                  <div className="flex items-center gap-1.5 font-semibold mb-1">
                    <CheckCircle2 size={16} />
                    Hidden message decoded
                  </div>
                  <p className="whitespace-pre-line break-words">
                    {report.decoded_text}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-slate-600 dark:bg-slate-700/50 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <ShieldAlert size={14} />
                  No hidden message found in this image (it may have been
                  re-encoded by the platform).
                </div>
              )}
            </div>
          </div>
        ))}
        {twitterConfigured && (reports ?? []).length === 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-slate-600 px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
            No posts with #{REPORT_HASHTAG} found yet. Reports will appear here
            automatically once victims share their encoded images with the
            hashtag.
          </div>
        )}
      </div>

    </div>
  );
}

export default RealtimeList;