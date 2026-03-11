import { Globe, Server, Clock, FileType, Link2, Wifi } from 'lucide-react';
import type { ScanReport, AppMode } from '../../types';
import { statusBadge, formatDate } from '../../lib/utils';
import { clsx } from 'clsx';

interface OverviewTabProps {
  report: ScanReport;
  mode: AppMode;
}

function Row({ icon, label, value, mono = false }: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 py-3.5 border-b border-border/50 last:border-0">
      <div className="text-slate-600 mt-0.5 shrink-0">{icon}</div>
      <span className="text-slate-500 text-sm w-36 shrink-0">{label}</span>
      <span className={clsx('text-sm flex-1 break-all', mono && 'font-mono text-xs text-slate-300')}>
        {value}
      </span>
    </div>
  );
}

export function OverviewTab({ report, mode }: OverviewTabProps) {
  const { overview, dataQuality } = report;

  return (
    <div className="space-y-4">
      {/* Request details */}
      <div className="card">
        <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <Globe size={14} className="text-accent" />
          Request Details
        </h3>

        <Row icon={<Globe size={14} />} label="Input URL" value={overview.inputUrl} mono />
        <Row icon={<Link2 size={14} />} label="Normalized URL" value={overview.normalizedUrl} mono />
        <Row icon={<Globe size={14} />} label="Hostname" value={overview.hostname} mono />
        <Row
          icon={<Link2 size={14} />}
          label="Final URL"
          value={
            <a href={overview.finalUrl} target="_blank" rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              {overview.finalUrl}
            </a>
          }
        />
        <Row icon={<Server size={14} />} label="IP Address" value={overview.ipAddress || <span className="text-slate-600 italic">Unavailable</span>} mono />
        <Row
          icon={<Wifi size={14} />}
          label="HTTP Status"
          value={
            <span className={overview.httpStatus && overview.httpStatus < 400 ? 'text-emerald-400' : 'text-red-400'}>
              {overview.httpStatus ?? 'N/A'}
            </span>
          }
        />
        <Row icon={<Clock size={14} />} label="Response Time" value={overview.responseTimeMs ? `${overview.responseTimeMs}ms` : 'N/A'} />
        <Row icon={<FileType size={14} />} label="Content Type" value={overview.contentType || <span className="text-slate-600 italic">Not reported</span>} mono />
        <Row icon={<Server size={14} />} label="Server Header" value={overview.serverHeader || <span className="text-slate-600 italic">Not disclosed</span>} mono />
        <Row icon={<Clock size={14} />} label="Scanned At" value={formatDate(overview.timestamp)} />
      </div>

      {/* Data quality breakdown */}
      <div className="card">
        <h3 className="text-white font-semibold text-sm mb-4">Data Collection Quality</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(dataQuality.modules).map(([mod, status]) => (
            <div key={mod} className="flex items-center gap-2">
              <span className={clsx('badge border text-xs', statusBadge(status))}>{status}</span>
              <span className="text-slate-400 text-xs capitalize">{mod}</span>
            </div>
          ))}
        </div>

        {mode === 'learner' && (
          <div className="mt-4 text-xs text-slate-500 leading-relaxed border-t border-border pt-3">
            Data quality shows how successfully each module collected information.
            <strong className="text-slate-400"> Complete</strong> = full data collected.
            <strong className="text-slate-400"> Partial</strong> = some data missing.
            <strong className="text-slate-400"> Unavailable</strong> = data could not be retrieved (target may be blocking requests).
          </div>
        )}
      </div>
    </div>
  );
}
