import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { CookieEntry, AppMode } from '../../types';
import { clsx } from 'clsx';

interface CookiesTabProps {
  cookies: CookieEntry[];
  mode: AppMode;
}

function Flag({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border',
      active
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : 'bg-red-500/10 text-red-400 border-red-500/20'
    )}>
      {active ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {label}
    </span>
  );
}

export function CookiesTab({ cookies, mode }: CookiesTabProps) {
  if (cookies.length === 0) {
    return (
      <div className="card text-center py-10 text-slate-500">
        <p className="text-sm">No Set-Cookie headers found in the response.</p>
        {mode === 'learner' && (
          <p className="text-xs mt-2 text-slate-600">
            This site either doesn't use cookies on its main page, or uses JavaScript to set them after load.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-slate-500 text-xs">
        {cookies.length} cookie{cookies.length !== 1 ? 's' : ''} detected in HTTP response headers
      </div>

      {cookies.map((c, i) => {
        const hasIssues = c.issues.length > 0;
        return (
          <div
            key={i}
            className={clsx(
              'card border-l-2',
              hasIssues ? 'border-l-orange-500/60' : 'border-l-emerald-500/60'
            )}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                {hasIssues ? (
                  <AlertTriangle size={15} className="text-orange-400 shrink-0" />
                ) : (
                  <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                )}
                <span className="font-mono text-white font-medium text-sm">{c.name}</span>
              </div>
              <div className="text-xs text-slate-500 text-right">
                {c.expires ? `Expires: ${c.expires}` : 'Session cookie'}
              </div>
            </div>

            {/* Security flags */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Flag active={c.secure} label="Secure" />
              <Flag active={c.httpOnly} label="HttpOnly" />
              <Flag
                active={!!c.sameSite && c.sameSite.toLowerCase() !== 'none'}
                label={`SameSite${c.sameSite ? `=${c.sameSite}` : ''}`}
              />
            </div>

            {/* Metadata */}
            <div className="flex gap-4 text-xs text-slate-600 font-mono mb-3">
              {c.path && <span>path={c.path}</span>}
              {c.domain && <span>domain={c.domain}</span>}
            </div>

            {/* Issues */}
            {c.issues.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {c.issues.map((issue, j) => (
                  <div key={j} className="flex items-start gap-2 bg-orange-500/5 border border-orange-500/15 rounded-lg px-3 py-2">
                    <AlertTriangle size={12} className="text-orange-400 mt-0.5 shrink-0" />
                    <span className="text-orange-300 text-xs">{issue}</span>
                  </div>
                ))}
              </div>
            )}

            {mode === 'learner' && hasIssues && (
              <div className="mt-3 text-xs text-slate-500 bg-surface rounded-lg p-3 border border-border/50 leading-relaxed">
                <strong className="text-slate-400">Why this matters:</strong> Cookie security flags protect users from
                session hijacking and cross-site attacks. The <code className="text-accent">Secure</code> flag ensures
                the cookie is only sent over HTTPS, <code className="text-accent">HttpOnly</code> blocks JavaScript
                access to prevent XSS theft, and <code className="text-accent">SameSite</code> prevents CSRF attacks.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
