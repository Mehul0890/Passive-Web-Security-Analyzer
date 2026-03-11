import { useState, useCallback, useRef } from 'react';
import { analyzeSite } from '../lib/api';
import { addHistoryEntry } from '../lib/history';
import type { ScanReport, ScanProgress } from '../types';

const PROGRESS_STEPS: ScanProgress[] = [
  'validating',
  'resolving',
  'fetching_headers',
  'fetching_ssl',
  'fetching_dns',
  'fetching_whois',
  'fetching_metadata',
  'building_findings',
  'done',
];

const STEP_LABELS: Record<ScanProgress, string> = {
  idle: 'Ready',
  validating: 'Validating target…',
  resolving: 'Resolving hostname…',
  fetching_headers: 'Fetching HTTP headers…',
  fetching_ssl: 'Retrieving SSL certificate…',
  fetching_dns: 'Collecting DNS records…',
  fetching_whois: 'Checking WHOIS data…',
  fetching_metadata: 'Extracting metadata…',
  building_findings: 'Building findings & scoring…',
  done: 'Analysis complete',
  error: 'Analysis failed',
};

export function useAnalyzer() {
  const [report, setReport] = useState<ScanReport | null>(null);
  const [progress, setProgress] = useState<ScanProgress>('idle');
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const simulateProgress = useCallback(() => {
    let stepIdx = 0;
    const steps = PROGRESS_STEPS.slice(0, -1); // don't include 'done'

    const advance = () => {
      if (stepIdx < steps.length) {
        const step = steps[stepIdx];
        setProgress(step);
        setProgressLabel(STEP_LABELS[step]);
        stepIdx++;
      }
    };

    advance();
    progressTimerRef.current = setInterval(() => {
      if (stepIdx < steps.length) {
        advance();
      } else {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      }
    }, 1400);
  }, []);

  const analyze = useCallback(
    async (url: string) => {
      if (!url.trim()) return;

      setError(null);
      setReport(null);
      setCurrentUrl(url.trim());

      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      simulateProgress();

      try {
        const result = await analyzeSite(url.trim());
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setProgress('done');
        setProgressLabel(STEP_LABELS['done']);
        setReport(result);
        addHistoryEntry(result);
      } catch (e) {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setProgress('error');
        setProgressLabel('Analysis failed');
        setError((e as Error).message || 'Analysis failed');
      }
    },
    [simulateProgress]
  );

  const reset = useCallback(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setReport(null);
    setProgress('idle');
    setProgressLabel('');
    setError(null);
    setCurrentUrl('');
  }, []);

  const isScanning = progress !== 'idle' && progress !== 'done' && progress !== 'error';

  return {
    report,
    progress,
    progressLabel,
    progressPercent: PROGRESS_STEPS.indexOf(progress) / (PROGRESS_STEPS.length - 1) * 100,
    error,
    currentUrl,
    isScanning,
    analyze,
    reset,
  };
}
