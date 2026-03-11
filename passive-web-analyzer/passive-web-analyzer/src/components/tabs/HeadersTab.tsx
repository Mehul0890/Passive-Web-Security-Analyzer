import { CheckCircle, XCircle } from 'lucide-react';
import type { HeaderEntry, AppMode } from '../../types';
import { severityBg } from '../../lib/utils';
import { clsx } from 'clsx';

interface HeadersTabProps {
  headers: HeaderEntry[];
  mode: AppMode;
}

export function HeadersTab({ headers, mode }: HeadersTabProps) {
  const present = headers.filter((h) => h.present);
  const missing = headers.filter((h) => !h.present);

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="card-sm flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
          <CheckCircle size={14} />
          {present.length} headers present
        </div>
        <div className="flex items-center gap-1.5 text-red-400 text-sm font-medium">
          <XCircle size={14} />
          {missing.length} missing
        </div>
        <div className="ml-auto h-1.5 w-32 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${(present.length / headers.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Header table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium w-6"></th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Header</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium hidden md:table-cell">Value</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium w-24 hidden sm:table-cell">Severity</th>
            </tr>
          </thead>
          <tbody>
            {headers.map((h, i) => (
              <tr key={h.name} className={clsx('border-b border-border/50 last:border-0 transition-colors hover:bg-white/2', i % 2 === 0 && 'bg-surface/30')}>
                <td className="px-4 py-3.5">
                  {h.present ? (
                    <CheckCircle size={15} className="text-emerald-400" />
                  ) : (
                    <XCircle size={15} className="text-red-400" />
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="font-mono text-sm text-white">{h.name}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{h.description}</div>
                  {!h.present && mode === 'learner' && (
                    <div className="text-slate-600 text-xs mt-1 leading-relaxed">
                      <span className="text-amber-500">Impact:</span> {h.impact}
                    </div>
                  )}
                  {!h.present && (
                    <div className="text-blue-400/80 text-xs mt-1 font-mono">{h.recommendation}</div>
                  )}
                </td>
                <td className="px-4 py-3.5 hidden md:table-cell">
                  {h.value ? (
                    <span className="font-mono text-xs text-emerald-300 bg-emerald-500/5 border border-emerald-500/15 rounded px-2 py-0.5 inline-block max-w-xs truncate">
                      {h.value}
                    </span>
                  ) : (
                    <span className="text-slate-600 text-xs italic">Not present</span>
                  )}
                </td>
                <td className="px-4 py-3.5 hidden sm:table-cell">
                  {!h.present && (
                    <span className={clsx('badge border text-xs uppercase', severityBg(h.severity))}>
                      {h.severity}
                    </span>
                  )}
                  {h.present && (
                    <span className="badge border text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase">
                      present
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
