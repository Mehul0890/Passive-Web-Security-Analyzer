import { Lock, CheckCircle, XCircle, AlertTriangle, Calendar } from 'lucide-react';
import type { SslInfo, AppMode } from '../../types';
import { clsx } from 'clsx';

interface SslTabProps {
  ssl: SslInfo;
  mode: AppMode;
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border/50 last:border-0">
      <span className="text-slate-500 text-sm w-36 shrink-0">{label}</span>
      <span className={clsx('text-sm text-right break-all', mono ? 'font-mono text-xs text-slate-300' : 'text-white')}>
        {value}
      </span>
    </div>
  );
}

export function SslTab({ ssl, mode }: SslTabProps) {
  if (!ssl.available) {
    return (
      <div className="card text-center py-12">
        <XCircle size={40} className="text-red-400 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-2">HTTPS Not Available</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          {mode === 'learner'
            ? 'This site is not using HTTPS. All data sent between you and this site can be seen by others on the same network — similar to sending a postcard instead of a sealed letter.'
            : 'No TLS observed on final URL. Certificate negotiation was not performed.'}
        </p>
        {ssl.error && (
          <div className="mt-4 text-xs text-slate-600 font-mono bg-surface rounded p-3 inline-block">
            Error: {ssl.error}
          </div>
        )}
      </div>
    );
  }

  const daysClass =
    ssl.daysRemaining === undefined
      ? ''
      : ssl.expired
      ? 'text-red-400'
      : ssl.daysRemaining < 14
      ? 'text-red-400'
      : ssl.daysRemaining < 30
      ? 'text-yellow-400'
      : 'text-emerald-400';

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={clsx(
        'card-sm flex items-center gap-3',
        ssl.expired ? 'border-red-500/30 bg-red-500/5' :
        ssl.selfSigned ? 'border-yellow-500/30 bg-yellow-500/5' :
        'border-emerald-500/20 bg-emerald-500/5'
      )}>
        {ssl.expired ? (
          <XCircle size={20} className="text-red-400" />
        ) : ssl.selfSigned ? (
          <AlertTriangle size={20} className="text-yellow-400" />
        ) : (
          <CheckCircle size={20} className="text-emerald-400" />
        )}
        <div>
          <div className={clsx('font-semibold text-sm',
            ssl.expired ? 'text-red-400' : ssl.selfSigned ? 'text-yellow-400' : 'text-emerald-400'
          )}>
            {ssl.expired ? 'Certificate Expired' : ssl.selfSigned ? 'Self-Signed Certificate' : 'Valid HTTPS Certificate'}
          </div>
          {mode === 'learner' && (
            <div className="text-xs text-slate-500 mt-0.5">
              {ssl.expired
                ? 'This certificate has expired. Browsers will show security warnings to visitors.'
                : ssl.selfSigned
                ? 'This certificate was not issued by a trusted authority. Browsers may warn visitors.'
                : 'This site uses a valid TLS certificate from a trusted certificate authority.'}
            </div>
          )}
        </div>
        {ssl.daysRemaining !== undefined && !ssl.expired && (
          <div className="ml-auto text-right">
            <div className={clsx('font-bold text-2xl font-display', daysClass)}>{ssl.daysRemaining}</div>
            <div className="text-slate-500 text-xs">days left</div>
          </div>
        )}
        {ssl.expired && ssl.daysRemaining !== undefined && (
          <div className="ml-auto text-right">
            <div className="text-red-400 font-bold text-2xl font-display">{Math.abs(ssl.daysRemaining)}</div>
            <div className="text-slate-500 text-xs">days ago</div>
          </div>
        )}
      </div>

      {/* Certificate details */}
      <div className="card">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
          <Lock size={14} className="text-accent" />
          Certificate Details
        </h3>
        <InfoRow label="Subject" value={ssl.subject || 'Unavailable'} mono />
        <InfoRow label="Issuer" value={ssl.issuer || 'Unavailable'} mono />
        {ssl.serialNumber && <InfoRow label="Serial Number" value={ssl.serialNumber} mono />}
        <InfoRow
          label="Valid From"
          value={
            <span className="flex items-center gap-1.5">
              <Calendar size={12} className="text-slate-500" />
              {ssl.validFrom || 'Unavailable'}
            </span>
          }
        />
        <InfoRow
          label="Valid Until"
          value={
            <span className={clsx('flex items-center gap-1.5', daysClass || 'text-white')}>
              <Calendar size={12} className="text-slate-500" />
              {ssl.validTo || 'Unavailable'}
            </span>
          }
        />
        <InfoRow
          label="Days Remaining"
          value={
            ssl.daysRemaining !== undefined ? (
              <span className={daysClass}>
                {ssl.expired ? `Expired ${Math.abs(ssl.daysRemaining)} days ago` : `${ssl.daysRemaining} days`}
              </span>
            ) : 'Unavailable'}
        />
        <InfoRow
          label="Self-Signed"
          value={
            ssl.selfSigned === undefined ? 'Unknown' :
            ssl.selfSigned ? <span className="text-yellow-400">Yes — Not trusted by browsers</span> :
            <span className="text-emerald-400">No — CA issued</span>
          }
        />
      </div>

      {/* SANs */}
      {ssl.sanEntries && ssl.sanEntries.length > 0 && (
        <div className="card">
          <h3 className="text-white font-semibold mb-3 text-sm">
            Subject Alternative Names ({ssl.sanEntries.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {ssl.sanEntries.slice(0, 30).map((san, i) => (
              <span key={i} className="font-mono text-xs bg-surface border border-border rounded px-2 py-0.5 text-slate-300">
                {san}
              </span>
            ))}
            {ssl.sanEntries.length > 30 && (
              <span className="text-slate-600 text-xs">+{ssl.sanEntries.length - 30} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
