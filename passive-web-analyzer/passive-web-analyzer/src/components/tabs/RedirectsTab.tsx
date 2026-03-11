import { ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import type { RedirectInfo, AppMode } from '../../types';
import { clsx } from 'clsx';

interface RedirectsTabProps {
  redirects: RedirectInfo;
  mode: AppMode;
}

export function RedirectsTab({ redirects, mode }: RedirectsTabProps) {
  const hops = redirects.chain;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={clsx('card-sm', redirects.httpToHttps ? 'border-emerald-500/20' : 'border-slate-700')}>
          <div className="flex items-center gap-2 mb-1">
            {redirects.httpToHttps ? (
              <CheckCircle size={14} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={14} className="text-slate-500" />
            )}
            <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">HTTP→HTTPS</span>
          </div>
          <div className={clsx('text-sm font-medium', redirects.httpToHttps ? 'text-emerald-400' : 'text-slate-500')}>
            {redirects.httpToHttps ? 'Upgrades correctly' : 'Not observed'}
          </div>
        </div>

        <div className={clsx('card-sm', redirects.excessiveRedirects ? 'border-orange-500/20' : 'border-slate-700')}>
          <div className="flex items-center gap-2 mb-1">
            {redirects.excessiveRedirects ? (
              <AlertTriangle size={14} className="text-orange-400" />
            ) : (
              <CheckCircle size={14} className="text-emerald-400" />
            )}
            <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Redirect Hops</span>
          </div>
          <div className={clsx('text-sm font-medium', redirects.excessiveRedirects ? 'text-orange-400' : 'text-white')}>
            {hops.length} hop{hops.length !== 1 ? 's' : ''}
            {redirects.excessiveRedirects && ' (excessive)'}
          </div>
        </div>

        <div className="card-sm">
          <div className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Final URL</div>
          <div className="text-sm text-accent font-mono truncate">{redirects.finalUrl}</div>
        </div>
      </div>

      {/* Redirect chain visualization */}
      {hops.length > 0 && (
        <div className="card">
          <h3 className="text-white font-semibold text-sm mb-4">Redirect Chain</h3>
          <div className="space-y-2">
            {hops.map((hop, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    hop.statusCode >= 300 && hop.statusCode < 400
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : hop.statusCode < 300
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  )}>
                    {hop.statusCode}
                  </div>
                  {i < hops.length - 1 && (
                    <div className="w-px h-4 bg-border mt-1" />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <div className="font-mono text-xs text-slate-300 break-all">{hop.url}</div>
                  {hop.location && (
                    <div className="flex items-center gap-1 mt-1 text-slate-600 text-xs">
                      <ArrowRight size={11} />
                      <span className="font-mono truncate">{hop.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Final destination */}
            <div className="flex items-start gap-3 mt-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle size={14} />
              </div>
              <div className="flex-1 pt-1">
                <div className="text-xs text-slate-500 mb-0.5">Final destination</div>
                <div className="font-mono text-xs text-emerald-300 break-all">{redirects.finalUrl}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {hops.length === 0 && (
        <div className="card-sm text-slate-500 text-sm text-center py-6">
          No redirects observed — direct response from target.
        </div>
      )}

      {mode === 'learner' && (
        <div className="card-sm bg-blue-500/5 border-blue-500/15 text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-300">About redirects:</strong> HTTP→HTTPS redirects are important for
          security — they ensure users who type the address without "https://" still get a secure connection.
          Excessive redirects (4+) slow down page loads and can negatively impact SEO.
        </div>
      )}
    </div>
  );
}
