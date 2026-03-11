import { FileText, Globe, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import type { MetadataInfo, AppMode } from '../../types';
import { clsx } from 'clsx';

interface MetadataTabProps {
  metadata: MetadataInfo;
  mode: AppMode;
}

function MetaRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-border/50 last:border-0">
      <span className="text-slate-500 text-xs w-32 shrink-0 uppercase tracking-wide font-medium mt-0.5">{label}</span>
      <span className={clsx('text-sm break-words flex-1', mono ? 'font-mono text-xs text-slate-300' : 'text-white')}>
        {value || <span className="text-slate-600 italic">Not present</span>}
      </span>
    </div>
  );
}

function FileStatus({ exists, label }: { exists: boolean | null; label: string }) {
  if (exists === null) return (
    <div className="flex items-center gap-2 py-3 border-b border-border/50">
      <MinusCircle size={14} className="text-slate-500" />
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-slate-600 text-xs ml-auto">Unknown</span>
    </div>
  );
  return (
    <div className={clsx(
      'flex items-center gap-2 py-3 border-b border-border/50',
    )}>
      {exists ? (
        <CheckCircle size={14} className="text-emerald-400" />
      ) : (
        <XCircle size={14} className="text-slate-600" />
      )}
      <span className="text-white text-sm">{label}</span>
      <span className={clsx('ml-auto text-xs', exists ? 'text-emerald-400' : 'text-slate-500')}>
        {exists ? 'Found' : 'Not found'}
      </span>
    </div>
  );
}

export function MetadataTab({ metadata, mode }: MetadataTabProps) {
  return (
    <div className="space-y-4">
      {/* Page metadata */}
      <div className="card">
        <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <FileText size={14} className="text-accent" />
          Page Metadata
        </h3>
        <MetaRow label="Title" value={metadata.title} />
        <MetaRow label="Description" value={metadata.description} />
        <MetaRow label="Canonical URL" value={metadata.canonical} mono />
        <MetaRow label="Language" value={metadata.language} />
        <MetaRow label="Generator" value={
          metadata.generator ? (
            <span className="font-mono text-xs text-yellow-300 bg-yellow-500/5 border border-yellow-500/15 rounded px-2 py-0.5">
              {metadata.generator}
            </span>
          ) : null
        } />
        <MetaRow label="OG Title" value={metadata.ogTitle} />
        <MetaRow label="OG Description" value={metadata.ogDescription} />
      </div>

      {/* Crawler files */}
      <div className="card">
        <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <Globe size={14} className="text-accent" />
          Crawler Files
        </h3>
        <FileStatus exists={metadata.robotsTxt} label="/robots.txt" />
        <FileStatus exists={metadata.sitemapXml} label="/sitemap.xml" />
      </div>

      {mode === 'learner' && metadata.generator && (
        <div className="card-sm bg-yellow-500/5 border-yellow-500/15">
          <p className="text-xs text-yellow-300 leading-relaxed">
            <strong>Note on Generator Tag:</strong> The <code className="font-mono">generator</code> meta tag reveals
            the CMS or framework used to build this site (e.g., WordPress, Drupal). While not a direct vulnerability,
            this information can help attackers target known weaknesses in that platform.
            Consider removing this tag in production.
          </p>
        </div>
      )}
    </div>
  );
}
