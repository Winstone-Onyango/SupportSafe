'use client';

import * as React from 'react';
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronUp,
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
import { getToken } from '@/lib/auth';
import GoogleMap from '@/components/GoogleMap';

/**
 * Admin dashboard view of every report saved by victims.
 */

interface RawPost {
  _id?: string;
  status?: string;
  _source?: string;
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
  name?: string;
  severity?: string;
  description?: string;
  culprit?: string;
  other_info?: string;
  relationship_to_culprit?: string;
  relation?: string;
  contact_info?: string;
  location?: string;
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
    impactOnChildren: pick(
      raw['Impact on children'],
      d['Impact on children']
    ),
    otherInfo: pick(raw['Other info'], raw.other_info, d['Other info']),
    status: raw.status ?? 'pending',
    source: raw._source ?? '',
    createdAt: raw._id ? new Date(parseInt(raw._id.substring(0, 8), 16) * 1000) : null,
  };
}

const severityRank = (s: string): number => {
  const v = (s || '').toLowerCase();
  if (v.includes('severe') || v.includes('high')) return 3;
  if (v.includes('moderate') || v.includes('medium')) return 2;
  if (v.includes('mild') || v.includes('low')) return 1;
  return 0;
};

const statusBadgeClass = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    case 'resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    case 'closed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
  }
};

const severityBadgeClass = (severity: string): string => {
  const rank = severityRank(severity);
  if (rank >= 3) return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  if (rank === 2) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
};

const severityShortLabel = (severity: string): string => {
  const rank = severityRank(severity);
  if (rank >= 3) return 'HIGH';
  if (rank === 2) return 'MED';
  if (rank === 1) return 'LOW';
  return 'N/A';
};

const geocode = async (
  location: string
): Promise<{ lat: number; lng: number } | null> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch {
    // Geocoding failed silently
  }
  return null;
};

const parseCoordinates = (
  location: string
): { lat: number; lng: number } | null => {
  const match = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }
  return null;
};

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-500 dark:text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

function SavedReports() {
  const [reports, setReports] = React.useState<SavedReport[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [geoCache, setGeoCache] = React.useState<
    Record<string, { lat: number; lng: number } | null>
  >({});

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Include the admin JWT token so the backend authorizes the request
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/getPosts', { headers });
      if (res.ok) {
        const data = await res.json();
        const posts = Array.isArray(data) ? data : (data.posts ?? []);
        const normalized = posts.map(normalizePost);
        normalized.sort((a: SavedReport, b: SavedReport) => {
          const rankDiff = severityRank(b.severity) - severityRank(a.severity);
          if (rankDiff !== 0) return rankDiff;
          const aTime = a.createdAt?.getTime() ?? 0;
          const bTime = b.createdAt?.getTime() ?? 0;
          return bTime - aTime;
        });
        setReports(normalized);
      } else {
        setError('Failed to load reports');
        setReports([]);
      }
    } catch {
      setError('Could not reach the server');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const geocodeLocations = async () => {
      if (!reports) return;
      for (const report of reports) {
        if (!report.location || geoCache[report.location]) continue;
        const coords = parseCoordinates(report.location);
        if (coords) {
          setGeoCache((prev) => ({ ...prev, [report.location]: coords }));
        } else {
          const result = await geocode(report.location);
          setGeoCache((prev) => ({ ...prev, [report.location]: result }));
        }
      }
    };
    geocodeLocations();
  }, [reports, geoCache]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Saved Reports</h2>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full bg-gray-300" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Saved Reports -{' '}
          <span className="text-red-600 dark:text-red-400">{reports?.length ?? 0}</span> total
        </h2>
        <Button variant="outline" onClick={load} className="flex items-center gap-2">
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {(reports ?? []).map((report) => (
          <ReportCard
            key={report._id}
            report={report}
            expanded={expandedId === report._id}
            onToggle={() => toggleExpand(report._id)}
            geo={geoCache[report.location] ?? parseCoordinates(report.location) ?? null}
          />
        ))}
        {(reports ?? []).length === 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-slate-600 px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
            No reports saved yet. Reports will appear here when victims submit them.
          </div>
        )}
      </div>
    </div>
  );
}

function ReportCard({
  report,
  expanded,
  onToggle,
  geo,
}: {
  report: SavedReport;
  expanded: boolean;
  onToggle: () => void;
  geo: { lat: number; lng: number } | null;
}) {
  const hasCoords = geo && geo.lat !== undefined && geo.lng !== undefined;

  return (
    <div className="rounded-xl border shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
      <div className="p-4">
        {/* Header row with name, badges, and date */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
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

        {/* Location and inline map row */}
        {report.location && (
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <MapPin size={14} className="text-red-500" />
                <span className="font-medium">Location:</span>
                <span>{report.location}</span>
              </div>
              {hasCoords && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Coordinates: {geo.lat.toFixed(4)}, {geo.lng.toFixed(4)}
                </p>
              )}
            </div>
            {hasCoords && (
              <div className="w-full sm:w-56 h-36 rounded-lg overflow-hidden shrink-0">
                <GoogleMap
                  lat={geo.lat}
                  lng={geo.lng}
                  label={report.location}
                  height="100%"
                  zoom={14}
                />
              </div>
            )}
          </div>
        )}

        {/* Nature summary */}
        {report.nature && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
            <span className="font-medium">Nature: </span>
            {report.nature}
          </p>
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

      {/* Full details (expanded) */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-slate-600 p-4 bg-gray-50 dark:bg-slate-900/50 space-y-3">
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
                .join(' - ')}
            />
          )}
          {report.otherInfo && (
            <DetailRow
              icon={<MessageSquare size={15} />}
              label="Other info"
              value={report.otherInfo}
            />
          )}
          {hasCoords && (
            <div className="pt-2">
              <DetailRow
                icon={<MapPin size={15} />}
                label="Location on Map"
                value={report.location}
              />
              <div className="mt-2">
                <GoogleMap
                  lat={geo.lat}
                  lng={geo.lng}
                  label={report.location}
                  height="220px"
                  zoom={15}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SavedReports;