import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import type { Finding, Severity, AppMode } from '../../types';
import { severityBg, severityColor } from '../../lib/utils';
import { clsx } from 'clsx';

interface FindingsTabProps {
  findings: Finding[];
  mode: AppMode;
}

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'moderate', 'low', 'info'];

export function FindingsTab({ findings, mode }: FindingsTabProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterSev, setFilterSev] = useState<Severity | 'all'>('all');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [search, setSearch] = useState('');

  const categories = Array.from(new Set(findings.map((f) => f.category))).sort();

  const filtered = findings
    .filter((f) => filterSev === 'all' || f.severity === filterSev)
    .filter((f) => filterCat === 'all' || f.category === filterCat)
    .filter((f) =>
      !search ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={14} className="text-slate-500" />
        <input
          type="text"
          placeholder="Search findings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field w-48 py-1.5 text-xs"
        />
        <select
          value={filterSev}
          onChange={(e) => setFilterSev(e.target.value as Severity | 'all')}
          className="input-field w-auto py-1.5 text-xs cursor-pointer"
        >
          <option value="all">All severities</option>
          {SEVERITY_ORDER.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="input-field w-auto py-1.5 text-xs cursor-pointer"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="text-slate-600 text-xs ml-auto">
          {filtered.length} / {findings.length} findings
        </span>
      </div>

      {findings.length === 0 && (
        <div className="card text-center py-10 text-slate-500">
          <p>No findings detected.</p>
        </div>
      )}

      {filtered.length === 0 && findings.length > 0 && (
        <div className="card text-center py-8 text-slate-500 text-sm">
          No findings match your filters.
        </div>
      )}

      {/* Findings list */}
      <div className="space-y-2">
        {filtered.map((f) => (
          <div
            key={f.id}
            className={clsx(
              'border rounded-xl overflow-hidden transition-all duration-150',
              f.severity === 'critical' ? 'border-red-500/30' :
              f.severity === 'high' ? 'border-orange-500/25' :
              f.severity === 'moderate' ? 'border-yellow-500/25' :
              f.severity === 'low' ? 'border-blue-500/20' : 'border-border',
              'bg-panel'
            )}
          >
            <button
              className="w-full flex items-start gap-3 p-4 text-left"
              onClick={() => toggle(f.id)}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className={clsx('badge border shrink-0 uppercase text-xs', severityBg(f.severity))}>
                  {f.severity}
                </span>
                <span className="text-white text-sm font-medium leading-snug">{f.title}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-slate-600 text-xs hidden sm:block">{f.category}</span>
                <span className="text-slate-500 text-xs">conf: <span className={f.confidence === 'high' ? 'text-emerald-400' : f.confidence === 'medium' ? 'text-yellow-400' : 'text-slate-400'}>{f.confidence}</span></span>
                {expanded === f.id ? (
                  <ChevronUp size={14} className="text-slate-500" />
                ) : (
                  <ChevronDown size={14} className="text-slate-500" />
                )}
              </div>
            </button>

            {expanded === f.id && (
              <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border/50 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div className="bg-surface rounded-lg p-3">
                    <div className="text-slate-500 text-xs mb-1.5 font-medium uppercase tracking-wide">Evidence</div>
                    <div className="text-slate-300 text-xs font-mono leading-relaxed">{f.evidence}</div>
                  </div>

                  {mode === 'analyst' ? (
                    <div className="bg-surface rounded-lg p-3">
                      <div className="text-slate-500 text-xs mb-1.5 font-medium uppercase tracking-wide">Analyst Note</div>
                      <div className="text-slate-300 text-xs leading-relaxed">{f.analystNote}</div>
                    </div>
                  ) : (
                    <div className="bg-surface rounded-lg p-3">
                      <div className="text-slate-500 text-xs mb-1.5 font-medium uppercase tracking-wide">What This Means</div>
                      <div className="text-slate-300 text-xs leading-relaxed">{f.learnerExplanation}</div>
                    </div>
                  )}
                </div>

                {mode === 'analyst' && (
                  <div className="bg-surface rounded-lg p-3">
                    <div className="text-slate-500 text-xs mb-1.5 font-medium uppercase tracking-wide">Technical Details</div>
                    <div className="text-slate-300 text-xs leading-relaxed font-mono">{f.technicalDetails}</div>
                  </div>
                )}

                <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-3">
                  <div className="text-blue-400 text-xs mb-1 font-medium uppercase tracking-wide">Recommendation</div>
                  <div className="text-slate-300 text-xs leading-relaxed">{f.recommendation}</div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>ID: {f.id}</span>
                  <span>·</span>
                  <span>Category: {f.category}</span>
                  <span>·</span>
                  <span className={severityColor(f.severity)}>Severity: {f.severity}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
