import { useState } from 'react';
import {
  LayoutDashboard, AlertTriangle, Shield, Lock, Cookie,
  Globe, FileText, GitBranch, Lightbulb, History, GitCompare,
  Download, Eye, Code2, Database
} from 'lucide-react';
import type { ScanReport, AppMode } from '../../types';
import { SummaryCards } from './SummaryCards';
import { OverviewTab } from '../tabs/OverviewTab';
import { FindingsTab } from '../tabs/FindingsTab';
import { HeadersTab } from '../tabs/HeadersTab';
import { SslTab } from '../tabs/SslTab';
import { CookiesTab } from '../tabs/CookiesTab';
import { DnsTab } from '../tabs/DnsTab';
import { MetadataTab } from '../tabs/MetadataTab';
import { RedirectsTab } from '../tabs/RedirectsTab';
import { RecommendationsTab } from '../tabs/RecommendationsTab';
import { HistoryTab } from '../tabs/HistoryTab';
import { CompareTab } from '../tabs/CompareTab';
import { ExportTab } from '../tabs/ExportTab';
import { clsx } from 'clsx';

interface AnalyzerDashboardProps {
  report: ScanReport;
  mode: AppMode;
  onModeChange: (m: AppMode) => void;
  onReanalyze: (url: string) => void;
}

interface TabDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

export function AnalyzerDashboard({ report, mode, onModeChange, onReanalyze }: AnalyzerDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const criticalFindings = report.findings.filter((f) => ['critical', 'high'].includes(f.severity)).length;
  const missingHeaders = report.headers.filter((h) => !h.present).length;

  const TABS: TabDef[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
    { id: 'findings', label: 'Findings', icon: <AlertTriangle size={14} />, badge: report.findings.length },
    { id: 'headers', label: 'Headers', icon: <Shield size={14} />, badge: missingHeaders > 0 ? missingHeaders : undefined },
    { id: 'ssl', label: 'SSL/TLS', icon: <Lock size={14} /> },
    { id: 'cookies', label: 'Cookies', icon: <Cookie size={14} />, badge: report.cookies.length },
    { id: 'dns', label: 'DNS', icon: <Globe size={14} /> },
    { id: 'metadata', label: 'Metadata', icon: <FileText size={14} /> },
    { id: 'redirects', label: 'Redirects', icon: <GitBranch size={14} /> },
    { id: 'recommendations', label: 'Fixes', icon: <Lightbulb size={14} />, badge: report.recommendations.length },
    { id: 'history', label: 'History', icon: <History size={14} /> },
    { id: 'compare', label: 'Compare', icon: <GitCompare size={14} /> },
    { id: 'export', label: 'Export', icon: <Download size={14} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      {/* Summary cards */}
      <SummaryCards report={report} />

      {/* Mode toggle + tab bar */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        {/* Tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150',
                activeTab === tab.id
                  ? 'bg-accent/10 text-accent border border-accent/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={clsx(
                  'min-w-[18px] h-4 px-1 rounded-full text-xs flex items-center justify-center font-bold',
                  activeTab === tab.id
                    ? 'bg-accent/20 text-accent'
                    : tab.id === 'findings' && criticalFindings > 0
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-slate-700 text-slate-400'
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-0 bg-surface border border-border rounded-lg p-0.5">
          <button
            onClick={() => onModeChange('learner')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              mode === 'learner' ? 'bg-accent/10 text-accent' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Eye size={12} />
            Learner
          </button>
          <button
            onClick={() => onModeChange('analyst')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              mode === 'analyst' ? 'bg-accent/10 text-accent' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Code2 size={12} />
            Analyst
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && <OverviewTab report={report} mode={mode} />}
        {activeTab === 'findings' && <FindingsTab findings={report.findings} mode={mode} />}
        {activeTab === 'headers' && <HeadersTab headers={report.headers} mode={mode} />}
        {activeTab === 'ssl' && <SslTab ssl={report.ssl} mode={mode} />}
        {activeTab === 'cookies' && <CookiesTab cookies={report.cookies} mode={mode} />}
        {activeTab === 'dns' && <DnsTab dns={report.dns} mode={mode} />}
        {activeTab === 'metadata' && <MetadataTab metadata={report.metadata} mode={mode} />}
        {activeTab === 'redirects' && <RedirectsTab redirects={report.redirects} mode={mode} />}
        {activeTab === 'recommendations' && <RecommendationsTab recommendations={report.recommendations} mode={mode} />}
        {activeTab === 'history' && (
          <HistoryTab
            onReanalyze={(url) => { onReanalyze(url); }}
            currentReport={report}
          />
        )}
        {activeTab === 'compare' && <CompareTab currentReport={report} />}
        {activeTab === 'export' && <ExportTab report={report} />}
      </div>
    </div>
  );
}
