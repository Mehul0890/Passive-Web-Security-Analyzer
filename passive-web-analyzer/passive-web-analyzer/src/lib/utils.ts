import type { Severity, RiskLabel } from '../types';

export function severityColor(s: Severity | string): string {
  const map: Record<string, string> = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    moderate: 'text-yellow-400',
    low: 'text-blue-400',
    info: 'text-slate-400',
  };
  return map[s] || 'text-slate-400';
}

export function severityBg(s: Severity | string): string {
  const map: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    moderate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    info: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  return map[s] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
}

export function riskColor(label: RiskLabel | string): string {
  const map: Record<string, string> = {
    Critical: 'text-red-400',
    High: 'text-orange-400',
    Moderate: 'text-yellow-400',
    Low: 'text-blue-400',
    Minimal: 'text-emerald-400',
  };
  return map[label] || 'text-slate-400';
}

export function riskBg(label: RiskLabel | string): string {
  const map: Record<string, string> = {
    Critical: 'bg-red-500/10 border-red-500/30 text-red-400',
    High: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    Moderate: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    Low: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    Minimal: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  };
  return map[label] || 'bg-slate-500/10 border-slate-500/30 text-slate-400';
}

export function statusBadge(status: string): string {
  const map: Record<string, string> = {
    complete: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    partial: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    unavailable: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    restricted: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    blocked: 'bg-red-500/10 text-red-400 border-red-500/20',
    timed_out: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return map[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function truncate(str: string, max: number): string {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function scoreToGradient(score: number): string {
  if (score >= 90) return 'from-emerald-500 to-emerald-400';
  if (score >= 70) return 'from-blue-500 to-blue-400';
  if (score >= 50) return 'from-yellow-500 to-yellow-400';
  if (score >= 30) return 'from-orange-500 to-orange-400';
  return 'from-red-600 to-red-400';
}

export function scoreToColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 70) return '#3b82f6';
  if (score >= 50) return '#eab308';
  if (score >= 30) return '#f97316';
  return '#ef4444';
}
