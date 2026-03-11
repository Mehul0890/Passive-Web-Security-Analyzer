import React from 'react';
import { Download, FileText, FileJson, Globe } from 'lucide-react';
import type { ScanReport } from '../../types';
import { exportJson, exportTxt, exportHtml } from '../../lib/export';
import { formatDate } from '../../lib/utils';

interface ExportTabProps {
  report: ScanReport;
}

export function ExportTab({ report }: ExportTabProps) {
  return (
    <div className="space-y-4">
      <div className="text-slate-500 text-xs">
        All exports are generated client-side in your browser. No data is uploaded.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card hover:border-accent/20 transition-colors cursor-pointer" onClick={() => exportJson(report)}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <FileJson size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">JSON Report</h3>
              <p className="text-slate-500 text-xs">Machine-readable</p>
            </div>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed mb-4">
            Complete raw report in JSON format. Ideal for programmatic processing, custom integrations, and archiving.
          </p>
          <button className="btn-primary w-full justify-center text-sm py-2" onClick={(e: React.MouseEvent) => { e.stopPropagation(); exportJson(report); }}>
            <Download size={14} />
            Export JSON
          </button>
        </div>

        <div className="card hover:border-accent/20 transition-colors cursor-pointer" onClick={() => exportTxt(report)}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-slate-500/10 border border-slate-500/20">
              <FileText size={18} className="text-slate-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Plain Text</h3>
              <p className="text-slate-500 text-xs">Human-readable</p>
            </div>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed mb-4">
            Formatted text report with all findings, headers, SSL details, DNS records, and recommendations.
          </p>
          <button className="btn-primary w-full justify-center text-sm py-2" onClick={(e: React.MouseEvent) => { e.stopPropagation(); exportTxt(report); }}>
            <Download size={14} />
            Export TXT
          </button>
        </div>

        <div className="card hover:border-accent/20 transition-colors cursor-pointer" onClick={() => exportHtml(report)}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Globe size={18} className="text-orange-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">HTML Report</h3>
              <p className="text-slate-500 text-xs">Shareable document</p>
            </div>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed mb-4">
            Styled HTML document suitable for sharing with stakeholders, clients, or teams. Open in any browser.
          </p>
          <button className="btn-primary w-full justify-center text-sm py-2" onClick={(e: React.MouseEvent) => { e.stopPropagation(); exportHtml(report); }}>
            <Download size={14} />
            Export HTML
          </button>
        </div>
      </div>

      <div className="card-sm bg-surface/50">
        <h4 className="text-white text-xs font-semibold mb-2 uppercase tracking-wide">Report Summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-slate-500">Target</div>
            <div className="text-white font-mono">{report.overview.hostname}</div>
          </div>
          <div>
            <div className="text-slate-500">Scanned</div>
            <div className="text-white">{formatDate(report.timestamp)}</div>
          </div>
          <div>
            <div className="text-slate-500">Risk Score</div>
            <div className="text-white">{report.riskScore.score}/100 — {report.riskScore.label}</div>
          </div>
          <div>
            <div className="text-slate-500">Findings</div>
            <div className="text-white">{report.findings.length} total</div>
          </div>
        </div>
      </div>
    </div>
  );
}
