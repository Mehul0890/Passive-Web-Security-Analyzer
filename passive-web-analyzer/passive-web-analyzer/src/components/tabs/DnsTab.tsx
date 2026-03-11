import { CheckCircle, XCircle, Info } from 'lucide-react';
import type { DnsInfo, AppMode } from '../../types';
import { statusBadge } from '../../lib/utils';
import { clsx } from 'clsx';

interface DnsTabProps {
  dns: DnsInfo;
  mode: AppMode;
}

function RecordSection({
  type,
  values,
  status,
  description,
}: {
  type: string;
  values: string[];
  status: string;
  description?: string;
}) {
  return (
    <div className="py-3.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="font-mono text-accent font-semibold text-sm w-14 shrink-0">{type}</span>
        {values.length > 0 ? (
          <CheckCircle size={13} className="text-emerald-400 shrink-0" />
        ) : (
          <XCircle size={13} className="text-slate-600 shrink-0" />
        )}
        <span className={clsx('badge border text-xs', statusBadge(status))}>
          {values.length > 0 ? `${values.length} record${values.length !== 1 ? 's' : ''}` : status}
        </span>
        {description && (
          <span className="text-slate-600 text-xs hidden md:block">{description}</span>
        )}
      </div>
      {values.length > 0 ? (
        <div className="ml-16 space-y-1">
          {values.map((v, i) => (
            <div key={i} className="font-mono text-xs text-slate-300 bg-surface border border-border/50 rounded px-2.5 py-1.5">
              {v}
            </div>
          ))}
        </div>
      ) : (
        <div className="ml-16 text-slate-600 text-xs italic">
          {status === 'unavailable' ? 'No records found' : status === 'error' ? 'Lookup failed' : 'Not present'}
        </div>
      )}
    </div>
  );
}

export function DnsTab({ dns, mode }: DnsTabProps) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        <div className={clsx('card-sm flex items-center gap-2',
          dns.spfFound ? 'border-emerald-500/20' : 'border-red-500/20'
        )}>
          {dns.spfFound ? <CheckCircle size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
          <span className="text-sm text-white">SPF</span>
          <span className={clsx('text-xs', dns.spfFound ? 'text-emerald-400' : 'text-red-400')}>
            {dns.spfFound ? 'Configured' : 'Missing'}
          </span>
        </div>
        <div className={clsx('card-sm flex items-center gap-2',
          dns.dmarcFound ? 'border-emerald-500/20' : 'border-red-500/20'
        )}>
          {dns.dmarcFound ? <CheckCircle size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
          <span className="text-sm text-white">DMARC</span>
          <span className={clsx('text-xs', dns.dmarcFound ? 'text-emerald-400' : 'text-red-400')}>
            {dns.dmarcFound ? 'Configured' : 'Missing'}
          </span>
        </div>
      </div>

      {/* DNS records */}
      <div className="card">
        <h3 className="text-white font-semibold text-sm mb-4">DNS Records</h3>
        <RecordSection type="A" values={dns.a.values} status={dns.a.status} description="IPv4 addresses" />
        <RecordSection type="AAAA" values={dns.aaaa.values} status={dns.aaaa.status} description="IPv6 addresses" />
        <RecordSection type="MX" values={dns.mx.values} status={dns.mx.status} description="Mail exchange servers" />
        <RecordSection type="NS" values={dns.ns.values} status={dns.ns.status} description="Authoritative nameservers" />
        <RecordSection type="CNAME" values={dns.cname.values} status={dns.cname.status} description="Canonical name alias" />
        <RecordSection type="TXT" values={dns.txt.values} status={dns.txt.status} description="Text records (includes SPF, DMARC, verification)" />
      </div>

      {/* SPF/DMARC details */}
      {(dns.spfRecord || dns.dmarcRecord) && (
        <div className="card">
          <h3 className="text-white font-semibold text-sm mb-3">Email Authentication Records</h3>
          {dns.spfRecord && (
            <div className="mb-3">
              <div className="text-slate-500 text-xs mb-1 font-medium">SPF Record</div>
              <div className="font-mono text-xs bg-surface border border-border/50 rounded p-2.5 text-emerald-300">
                {dns.spfRecord}
              </div>
            </div>
          )}
          {dns.dmarcRecord && (
            <div>
              <div className="text-slate-500 text-xs mb-1 font-medium">DMARC Record</div>
              <div className="font-mono text-xs bg-surface border border-border/50 rounded p-2.5 text-emerald-300">
                {dns.dmarcRecord}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'learner' && (
        <div className="card-sm bg-blue-500/5 border-blue-500/15">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-blue-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-300">About DNS Security:</strong> SPF and DMARC records protect your domain from email spoofing.
              SPF lists which servers can send email on behalf of your domain.
              DMARC tells email providers what to do when an email fails these checks — preventing fake emails from reaching users.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
