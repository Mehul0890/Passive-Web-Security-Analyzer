import {
  Globe, Link2, Server, Lock, Shield, AlertTriangle,
  CheckCircle, XCircle, Clock, Database, Calendar
} from 'lucide-react';
import type { ScanReport } from '../../types';
import { ScoreRing } from '../ui/ScoreRing';
import { riskBg, formatDate, statusBadge } from '../../lib/utils';
import { clsx } from 'clsx';

interface SummaryCardsProps {
  report: ScanReport;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: boolean;
}

function MetricCard({ icon, label, value, sub, accent }: MetricCardProps) {
  return (
    <div className={clsx('card-sm flex flex-col gap-2', accent && 'border-accent/20')}>
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-white font-medium text-sm leading-snug truncate">{value}</div>
      {sub && <div className="text-slate-600 text-xs truncate">{sub}</div>}
    </div>
  );
}

export function SummaryCards({ report }: SummaryCardsProps) {
  const { overview, ssl, riskScore, findings, dataQuality } = report;
  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const highCount = findings.filter((f) => f.severity === 'high').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 animate-slide-up">
      {/* Score + summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 mb-4">

        {/* Score card */}
        <div className="card flex items-center gap-6 min-w-[280px]">
          <ScoreRing score={riskScore.score} size={110} label="/100" />
          <div>
            <div className={clsx('badge border text-sm font-semibold mb-2', riskBg(riskScore.label))}>
              {riskScore.label} Risk
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-[200px]">
              {riskScore.rationale}
            </p>
            <div className="flex gap-3 mt-3">
              {criticalCount > 0 && (
                <span className="text-red-400 text-xs font-medium">
                  <XCircle size={12} className="inline mr-1" />{criticalCount} critical
                </span>
              )}
              {highCount > 0 && (
                <span className="text-orange-400 text-xs font-medium">
                  <AlertTriangle size={12} className="inline mr-1" />{highCount} high
                </span>
              )}
              {criticalCount === 0 && highCount === 0 && (
                <span className="text-emerald-400 text-xs font-medium">
                  <CheckCircle size={12} className="inline mr-1" />No critical issues
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Overview grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          <MetricCard
            icon={<Globe size={14} />}
            label="Target"
            value={overview.hostname}
            sub={overview.inputUrl}
          />
          <MetricCard
            icon={<Link2 size={14} />}
            label="Final URL"
            value={
              <a
                href={overview.finalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline truncate block text-sm"
              >
                {overview.finalUrl}
              </a>
            }
          />
          <MetricCard
            icon={<Server size={14} />}
            label="IP Address"
            value={overview.ipAddress || 'Unavailable'}
            sub={overview.serverHeader ? `Server: ${overview.serverHeader}` : undefined}
          />
          <MetricCard
            icon={<CheckCircle size={14} />}
            label="HTTP Status"
            value={
              <span className={overview.httpStatus && overview.httpStatus < 400 ? 'text-emerald-400' : 'text-red-400'}>
                {overview.httpStatus ?? 'N/A'}
              </span>
            }
            sub={overview.responseTimeMs ? `${overview.responseTimeMs}ms response` : undefined}
          />
          <MetricCard
            icon={<Lock size={14} />}
            label="HTTPS"
            value={
              ssl.available ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={13} /> Enabled
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1">
                  <XCircle size={13} /> Not Present
                </span>
              )
            }
          />
          <MetricCard
            icon={<Shield size={14} />}
            label="SSL Certificate"
            value={
              ssl.available ? (
                ssl.expired ? (
                  <span className="text-red-400">Expired</span>
                ) : ssl.daysRemaining !== undefined ? (
                  <span className={ssl.daysRemaining < 30 ? 'text-yellow-400' : 'text-emerald-400'}>
                    {ssl.daysRemaining}d remaining
                  </span>
                ) : (
                  <span className="text-emerald-400">Valid</span>
                )
              ) : (
                <span className="text-slate-500">Not Available</span>
              )
            }
            sub={ssl.issuer ? `Issued by: ${ssl.issuer}` : undefined}
          />
          <MetricCard
            icon={<AlertTriangle size={14} />}
            label="Findings"
            value={
              <span className={findings.length > 5 ? 'text-orange-400' : 'text-yellow-400'}>
                {findings.length} total
              </span>
            }
            sub={`${report.recommendations.length} recommendations`}
          />
          <MetricCard
            icon={<Database size={14} />}
            label="Data Quality"
            value={
              <span className={clsx('badge border text-xs', statusBadge(dataQuality.overall))}>
                {dataQuality.overall}
              </span>
            }
          />
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-1.5 text-slate-600 text-xs">
        <Calendar size={12} />
        <span>Scanned {formatDate(report.timestamp)}</span>
        {overview.durationMs > 0 && (
          <>
            <span>·</span>
            <Clock size={12} />
            <span>{(overview.durationMs / 1000).toFixed(1)}s</span>
          </>
        )}
      </div>
    </div>
  );
}
