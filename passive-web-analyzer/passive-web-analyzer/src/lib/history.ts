import type { HistoryEntry, ScanReport, RiskLabel } from '../types';

const STORAGE_KEY = 'pwa_scan_history';
const MAX_ENTRIES = 50;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function addHistoryEntry(report: ScanReport): HistoryEntry {
  const entries = loadHistory();
  const entry: HistoryEntry = {
    id: report.id,
    target: report.overview.hostname,
    timestamp: report.timestamp,
    score: report.riskScore.score,
    label: report.riskScore.label as RiskLabel,
    summary: `${report.findings.length} findings — ${report.riskScore.label} risk`,
    report,
  };

  const filtered = entries.filter((e) => e.target !== entry.target);
  const updated = [entry, ...filtered].slice(0, MAX_ENTRIES);
  saveHistory(updated);
  return entry;
}

export function deleteHistoryEntry(id: string): void {
  const entries = loadHistory().filter((e) => e.id !== id);
  saveHistory(entries);
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
