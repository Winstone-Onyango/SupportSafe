'use client';

import * as React from 'react';
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileUser,
  MapPin,
  MessageSquare,
  Nfc,
  PersonStanding,
  RefreshCw,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Admin dashboard view of every report saved by victims.
 *
 * Documents arrive in several shapes depending on how they were created:
 *  1. MultiStep form:  { Name, Location, 'Severity of domestic violence', ... }
 *  2. API posts:       { name, severity, culprit, location, ... }
 *  3. Decomposed text: { decomposed: { Name, 'Culprit details', ... } }
 *  4. Minimal:         { status: 'pending' }
 * Everything is normalized below so no information is ever lost or hidden.
 */

interface RawPost {
  _id?: string;
  status?: string;
  _source?: string;
  // Schema 1 (MultiStep form)
  Name?: string;
  Location?: string;
  'Preferred way of contact'?: string;
  'Contact info'?: string;
  'Frequency of domestic violence'?: string;
  'Relationship with perpetrator'?: string;
  'Severity of domestic violence'?: string;
  'Nature of domestic violence'?: string;
  'Impact on children'?: string;
  'Culprit details'?: string;
  'Other info'?: string;
  // Schema 2 (API posts)
  name?: string;
  severity?: string;
  description?: string;
  culprit?: string;
  other_info?: string;
  relationship_to_culprit?: string;
  relation?: string;
  contact_info?: string;
  location?: string;
  // Schema 3 (decomposed text)
  decomposed?: Record<string, string>;
}

interface SavedReport {
  _id: string;
  name: string;
  severity: string;
  nature: string;
  location: string;
  contactInfo: string;
  preferredContact: string;
  frequency: string;
  relationship: string;
  culprit: string;
  impactOnChildren: string;
  otherInfo: string;
  status: string;
  source: string;
  createdAt: Date | null;
}

/** "Not specified" placeholders carry no information. */
const pick = (...values: Array<string | undefined>): string => {
  for (const value of values) {
    const v = (value ?? '').toString().trim();
    if (v && v.toLowerCase() !== 'not specified') return v;
  }
  return '';
};

function normalizePost(raw: RawPost): SavedReport {
  const d = raw.decomposed ?? {};
  return {
    _id: raw._id ?? '',
    name: pick(raw.Name, raw.name, d.Name),
    severity: pick(
      raw['Severity of domestic violence'],
      raw.severity,
      d['Severity of domestic violence']
    ),
    nature: pick(
      raw['Nature of domestic violence'],
      raw.description,
      d['Nature of domestic violence']
    ),
    location: pick(raw.Location, raw.location, d.Location),
    contactInfo: pick(raw['Contact info'], raw.contact_info, d['Contact info']),
    preferredContact: pick(
      raw['Preferred way of contact'],
      d['Preferred way of contact']
    ),
    frequency: pick(
      raw['Frequency of domestic violence'],
      d['Frequency of domestic violence']
    ),
    relationship: pick(
      raw['Relationship with perpetrator'],
      raw.relationship_to_culprit,
      raw.relation,
      d['Relationship with perpetrator']
    ),
    culprit: pick(raw['Culprit details'], raw.culprit, d['Culprit details']),
    impactOnChildren: pick(raw['Impact on children'], d['Impact on children']),
    otherInfo: pick(raw['Other info'], raw.other_info, d['Other info']),
    status: (raw.status ?? 'unknown').toString().trim() || 'unknown',
    source: (raw._source ?? '').toString().trim(),
    createdAt: postIdDate(raw._id),
  };
}

/** MongoDB ObjectId embeds its creation time in the first 4 bytes. */
function postIdDate(id?: string): Date | null {
  if (!id || id.length < 8) return null;
  const seconds = parseInt(id.substring(0, 8), 16);
  if (Number.isNaN(seconds)) return null;
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

function severityRank(severity: string): number {
  const s = severity.toLowerCase();
  if (s.startsWith('very high') || s.includes('life-threatening')) return 4;
  if (s.startsWith('high')) return 3;
  if (s.startsWith('medium') || s.startsWith('moderate')) return 2;
  if (s.startsWith('low')) return 1;
  return 0;
}

function severityShortLabel(severity: string): string {
  return severity.split('(')[0].trim() || 'Unknown';
}

function severityBadgeClass(severity: string): string {
  const s = severity.toLowerCase();
  if (s.startsWith('very high')) return 'bg-red-600 text-white';
  if (s.startsWith('high')) return 'bg-yellow-500 text-white';
  if (s.startsWith('medium') || s.startsWith('moderate'))
    return 'bg-blue-500 text-white';
  if (s.startsWith('low')) return 'bg-green-500 text-white';
  return 'bg-gray-300 text-black';
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'closed') return 'bg-gray-500 text-white';
  if (s === 'open') return 'bg-orange-500 text-white';
  return 'bg-amber-500 text-white'; // pending
}

interface GeoLocation {
  lat?: number;
  lng?: number;
  query: string;
}

function parseLocation(location: string): GeoLocation {
  const raw = location.trim();
  if (!raw) return { query: '' };
  // "Latitude -1.092, Longitude 37.020" (MultiStep form format)
  const latMatch = raw.match(/latitude\s*(-?\d+(?:\.\d+)?)/i);
  const lngMatch = raw.match(/longitude\s*(-?\d+(?:\.\d+)?)/i);
  if (latMatch && lngMatch) {
    return {
      lat: parseFloat(latMatch[1]),
      lng: parseFloat(lngMatch[1]),
      query: `${latMatch[1]},${lngMatch[1]}`,
    };
  }
  // "-1.092, 37.020"
  const pair = raw.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (pair) {
    return {
      lat: parseFloat(pair[1]),
      lng: parseFloat(pair[2]),
      query: `${pair[1]},${pair[2]}`,
    };
  }
  // Free-text place, e.g. "Nairobi, Kenya"
  return { query: raw };
}

function mapsLink(geo: GeoLocation): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    geo.query
  )}`;
}

type SortMode = 'urgency' | 'newest';

function SavedReports() {
  const [reports, setReports] = React.useState<SavedReport[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [sortMode, setSortMode] = React.useState<SortMode>('urgency');
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(
    new Set()
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/getPosts');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Failed to load reports (${res.status})`);
      }
      const data = await res.json();
      setReports((Array.isArray(data) ? data : []).map(normalizePost));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load the saved reports. Is the backend running on port 8000?'
      );
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const sortedReports = React.useMemo(() => {
    if (!reports) return [];
    const list = [...reports];
    if (sortMode === 'newest') {
      list.sort(
        (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
      );
      return list;
    }
    // Urgency: most severe first, then unresolved (pending/open) before
    // closed, then newest.
    list.sort((a, b) => {
      const bySeverity =
        severityRank(b.severity) - severityRank(a.severity);
      if (bySeverity !== 0) return bySeverity;
      const aClosed = a.status.toLowerCase() === 'closed' ? 1 : 0;
      const bClosed = b.status.toLowerCase() === 'closed' ? 1 : 0;
      if (aClosed !== bClosed) return aClosed - bClosed;
      return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
    });
    return list;
  }, [reports, sortMode]);

  const urgentCount = React.useMemo(
    () => (reports ?? []).filter((r) => severityRank(r.severity) >= 3).length,
    [reports]
  );

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        <h2 className="text-xl font-semibold">Saved Reports</h2>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full bg-gray-300" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">
          Saved Reports{' '}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({sortedReports.length} total · {urgentCount} high urgency)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant={sortMode === 'urgency' ? 'default' : 'outline'}
            onClick={() => setSortMode('urgency')}
            className="h-8 px-3 text-xs"
          >
            Most urgent
          </Button>
          <Button
            variant={sortMode === 'newest' ? 'default' : 'outline'}
            onClick={() => setSortMode('newest')}
            className="h-8 px-3 text-xs"
          >
            Newest
          </Button>
          <Button
            variant="outline"
            onClick={load}
            className="h-8 px-3 text-xs flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertTriangle />
          <span>{error}</span>
        </div>
      )}

      {!error && sortedReports.length === 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-slate-600 px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          No saved reports yet. Reports created through the app will appear
          here.
        </div>
      )}

      <div className="space-y-3">
        {sortedReports.map((report) => (
          <ReportCard
            key={report._id}
            report={report}
            expanded={expandedIds.has(report._id)}
            onToggle={() => toggleExpanded(report._id)}
          />
        ))}
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-gray-500 dark:text-gray-400 shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

function ReportCard({
  report,
  expanded,
  onToggle,
}: {
  report: SavedReport;
  expanded: boolean;
  onToggle: () => void;
}) {
  const geo = parseLocation(report.location);
  const mapEmbedKey = process.env.NEXT_PUBLIC_MAP_KEY;
  return (
    <div className="rounded-xl border shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 p-4 space-y-3">
      {/* Header: identity + badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold flex items-center gap-1.5">
          <User size={16} className="text-gray-500" />
          {report.name || 'Anonymous'}
        </span>
        <span
          className={`text-[10px] px-2 py-1 rounded-full font-semibold ${severityBadgeClass(
            report.severity
          )}`}
        >
          {severityShortLabel(report.severity)}
        </span>
        <span
          className={`text-[10px] px-2 py-1 rounded-full font-semibold capitalize ${statusBadgeClass(
            report.status
          )}`}
        >
          {report.status}
        </span>
        {report.source && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400">
            via {report.source}
          </span>
        )}
        {report.createdAt && (
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <CalendarDays size={12} />
            {report.createdAt.toLocaleString()}
          </span>
        )}
      </div>

      {/* Collapsed summary: nature + quick map link */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
        {report.nature && (
          <span className="text-gray-600 dark:text-gray-300 flex-1 line-clamp-2">
            <span className="font-medium">Nature: </span>
            {report.nature}
          </span>
        )}
        {geo.query && (
          <a
            href={mapsLink(geo)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 underline underline-offset-2 flex items-center gap-1 w-fit"
          >
            <MapPin size={14} />
            {geo.lat !== undefined && geo.lng !== undefined
              ? `${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}`
              : geo.query}
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Full details (expanded) */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-slate-600 pt-3 space-y-3">
          {report.severity && (
            <DetailRow
              icon={<PersonStanding size={15} />}
              label="Severity of domestic violence"
              value={report.severity}
            />
          )}
          {report.nature && (
            <DetailRow
              icon={<PersonStanding size={15} />}
              label="Nature of domestic violence"
              value={report.nature}
            />
          )}
          {report.culprit && (
            <DetailRow
              icon={<FileUser size={15} />}
              label="Culprit details"
              value={report.culprit}
            />
          )}
          {report.relationship && (
            <DetailRow
              icon={<FileUser size={15} />}
              label="Relationship with perpetrator"
              value={report.relationship}
            />
          )}
          {report.frequency && (
            <DetailRow
              icon={<CalendarDays size={15} />}
              label="Frequency of incidents"
              value={report.frequency}
            />
          )}
          {report.impactOnChildren && (
            <DetailRow
              icon={<PersonStanding size={15} />}
              label="Impact on children"
              value={report.impactOnChildren}
            />
          )}
          {(report.contactInfo || report.preferredContact) && (
            <DetailRow
              icon={<Nfc size={15} />}
              label="Preferred way of contact"
              value={[report.preferredContact, report.contactInfo]
                .filter(Boolean)
                .join(' — ')}
            />
          )}
          {report.otherInfo && (
            <DetailRow
              icon={<MessageSquare size={15} />}
              label="Other info"
              value={report.otherInfo}
            />
          )}
          {geo.query && (
            <div className="space-y-2">
              <DetailRow
                icon={<MapPin size={15} />}
                label="Location"
                value={report.location}
              />
              {mapEmbedKey && geo.lat !== undefined && geo.lng !== undefined && (
                <iframe
                  width="100%"
                  height="240"
                  className="rounded-md border border-gray-300 dark:border-slate-600"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${mapEmbedKey}&q=${geo.lat},${geo.lng}`}
                ></iframe>
              )}
              <a
                href={mapsLink(geo)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 underline underline-offset-2"
              >
                <MapPin size={14} />
                Open in Google Maps
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Expand / collapse toggle */}
      <button
        onClick={onToggle}
        className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp size={14} />
            Hide details
          </>
        ) : (
          <>
            <ChevronDown size={14} />
            View full details
          </>
        )}
      </button>
    </div>
  );
}

export default SavedReports;