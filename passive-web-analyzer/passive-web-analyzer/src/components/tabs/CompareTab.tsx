import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import type { ScanReport, HistoryEntry, Finding, HeaderEntry } from '../../types';
import { loadHistory } from '../../lib/history';
import { riskBg, formatDate } from '../../lib/utils';
import { clsx } from 'clsx';

interface CompareTabProps {
  currentReport: ScanReport;
}

interface DiffRowProps {
  label: string;
  oldVal: string;
  newVal: string;
  better?: boolean | null; // true = improved, false = worsened, null = neutral
}

function DiffRow({ label, oldVal, newVal, better }: DiffRowProps) {
  const same = oldVal === newVal;
  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="py-2.5 pr-4 text-xs text-slate-500 w-40 shrink-0">{label}</td>
      <td className="py-2.5 pr-4 text-xs font-mono text-slate-400">{oldVal || '—'}</td>
      <td className="py-2.5 pr-4">
        <ArrowRight size={12} className="text-slate-600" />
      </td>
      <td className={clsx('py-2.5 text-xs font-mono', same ? 'text-slate-500' : better === true ? 'text-emerald-400' : better === false ? 'text-red-400' : 'text-yellow-300')}>
        {newVal || '—'}
        {!same && (
          <span className="ml-2">
            {better === true && <TrendingUp size={11} className="inline text-emerald-400" />}
            {better === false && <TrendingDown size={11} className="inline text-red-400" />}
            {better === null && <Minus size={11} className="inline text-slate-500" />}
          </span>
        )}
      </td>
    </tr>
  );
}

export function CompareTab({ currentReport }: CompareTabProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    const h = loadHistory().filter((e) => e.id !== currentReport.id);
    setHistory(h);
    if (h.length > 0) setSelectedId(h[0].id);
  }, [currentReport.id]);

  const selected = history.find((e) => e.id === selectedId);

  if (history.length === 0) {
    return (
      <div className="card text-center py-10 text-slate-500">
        <p className="text-sm">No previous scans to compare against.</p>
        <p className="text-xs mt-1 text-slate-600">Run more scans to enable comparison.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Scan selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-slate-400 text-sm">Compare with:</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="input-field w-auto py-1.5 text-xs"
        >
          {history.map((e) => (
            <option key={e.id} value={e.id}>
              {e.target} — {formatDate(e.timestamp)} — {e.score}/100
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <>
          {/* Score comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card text-center">
              <div className="text-slate-500 text-xs mb-2">Previous ({selected.target})</div>
              <div className={clsx('text-4xl font-display font-bold', riskBg(selected.label).split(' ')[1])}>
                {selected.score}
              </div>
              <div className={clsx('badge border text-xs mt-2', riskBg(selected.label))}>{selected.label}</div>
              <div className="text-slate-600 text-xs mt-2">{formatDate(selected.timestamp)}</div>
            </div>
            <div className="card text-center border-accent/20">
              <div className="text-slate-500 text-xs mb-2">Current ({currentReport.overview.hostname})</div>
              <div className={clsx('text-4xl font-display font-bold', riskBg(currentReport.riskScore.label).split(' ')[1])}>
                {currentReport.riskScore.score}
              </div>
              <div className={clsx('badge border text-xs mt-2', riskBg(currentReport.riskScore.label))}>{currentReport.riskScore.label}</div>
              <div className="text-slate-600 text-xs mt-2">{formatDate(currentReport.timestamp)}</div>
            </div>
          </div>

          {/* Detailed diff */}
          <div className="card overflow-auto">
            <h3 className="text-white font-semibold text-sm mb-4">Comparison Details</h3>
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-slate-600 pb-2 pr-4 font-medium">Field</th>
                  <th className="text-left text-xs text-slate-600 pb-2 pr-4 font-medium">Previous</th>
                  <th className="pb-2 pr-4 w-4"></th>
                  <th className="text-left text-xs text-slate-600 pb-2 font-medium">Current</th>
                </tr>
              </thead>
              <tbody>
                <DiffRow
                  label="Risk Score"
                  oldVal={`${selected.report.riskScore.score}/100`}
                  newVal={`${currentReport.riskScore.score}/100`}
                  better={currentReport.riskScore.score > selected.report.riskScore.score}
                />
                <DiffRow
                  label="Risk Label"
                  oldVal={selected.report.riskScore.label}
                  newVal={currentReport.riskScore.label}
                  better={null}
                />
                <DiffRow
                  label="Total Findings"
                  oldVal={String(selected.report.findings.length)}
                  newVal={String(currentReport.findings.length)}
                  better={currentReport.findings.length < selected.report.findings.length}
                />
                <DiffRow
                  label="Critical Findings"
                  oldVal={String(selected.report.findings.filter(f => f.severity === 'critical').length)}
                  newVal={String(currentReport.findings.filter(f => f.severity === 'critical').length)}
                  better={
                    currentReport.findings.filter(f => f.severity === 'critical').length <
                    selected.report.findings.filter(f => f.severity === 'critical').length
                  }
                />
                <DiffRow
                  label="HTTPS"
                  oldVal={selected.report.ssl.available ? 'Yes' : 'No'}
                  newVal={currentReport.ssl.available ? 'Yes' : 'No'}
                  better={!selected.report.ssl.available && currentReport.ssl.available}
                />
                <DiffRow
                  label="SSL Days Left"
                  oldVal={selected.report.ssl.daysRemaining !== undefined ? `${selected.report.ssl.daysRemaining}d` : 'N/A'}
                  newVal={currentReport.ssl.daysRemaining !== undefined ? `${currentReport.ssl.daysRemaining}d` : 'N/A'}
                  better={null}
                />
                <DiffRow
                  label="Missing Headers"
                  oldVal={String(selected.report.headers.filter(h => !h.present).length)}
                  newVal={String(currentReport.headers.filter(h => !h.present).length)}
                  better={
                    currentReport.headers.filter(h => !h.present).length <
                    selected.report.headers.filter(h => !h.present).length
                  }
                />
                <DiffRow
                  label="Cookies Found"
                  oldVal={String(selected.report.cookies.length)}
                  newVal={String(currentReport.cookies.length)}
                  better={null}
                />
                <DiffRow
                  label="SPF Record"
                  oldVal={selected.report.dns.spfFound ? 'Present' : 'Missing'}
                  newVal={currentReport.dns.spfFound ? 'Present' : 'Missing'}
                  better={!selected.report.dns.spfFound && currentReport.dns.spfFound}
                />
                <DiffRow
                  label="DMARC Record"
                  oldVal={selected.report.dns.dmarcFound ? 'Present' : 'Missing'}
                  newVal={currentReport.dns.dmarcFound ? 'Present' : 'Missing'}
                  better={!selected.report.dns.dmarcFound && currentReport.dns.dmarcFound}
                />
                <DiffRow
                  label="HTTP→HTTPS Redirect"
                  oldVal={selected.report.redirects.httpToHttps ? 'Yes' : 'No'}
                  newVal={currentReport.redirects.httpToHttps ? 'Yes' : 'No'}
                  better={!selected.report.redirects.httpToHttps && currentReport.redirects.httpToHttps}
                />
                <DiffRow
                  label="Final URL"
                  oldVal={selected.report.overview.finalUrl}
                  newVal={currentReport.overview.finalUrl}
                  better={null}
                />
                <DiffRow
                  label="Response Time"
                  oldVal={selected.report.overview.responseTimeMs ? `${selected.report.overview.responseTimeMs}ms` : 'N/A'}
                  newVal={currentReport.overview.responseTimeMs ? `${currentReport.overview.responseTimeMs}ms` : 'N/A'}
                  better={
                    currentReport.overview.responseTimeMs !== undefined &&
                    selected.report.overview.responseTimeMs !== undefined
                      ? currentReport.overview.responseTimeMs < selected.report.overview.responseTimeMs
                      : null
                  }
                />
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
