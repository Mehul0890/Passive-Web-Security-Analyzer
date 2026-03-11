import { Loader2, CheckCircle } from 'lucide-react';
import type { ScanProgress as ScanProgressType } from '../../types';

interface ScanProgressProps {
  progress: ScanProgressType;
  label: string;
  percent: number;
  url: string;
}

const STEPS: Array<{ key: ScanProgressType; label: string }> = [
  { key: 'validating', label: 'Validating' },
  { key: 'resolving', label: 'Resolving' },
  { key: 'fetching_headers', label: 'Headers' },
  { key: 'fetching_ssl', label: 'SSL/TLS' },
  { key: 'fetching_dns', label: 'DNS' },
  { key: 'fetching_metadata', label: 'Metadata' },
  { key: 'building_findings', label: 'Analysis' },
];

const STEP_ORDER = STEPS.map((s) => s.key);

export function ScanProgressBar({ progress, label, percent, url }: ScanProgressProps) {
  const currentIdx = STEP_ORDER.indexOf(progress);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-8 animate-slide-up">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Loader2 size={16} className="text-accent animate-spin" />
            <span className="text-white font-medium text-sm">{label}</span>
          </div>
          <span className="text-slate-500 text-xs font-mono">{url}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-border rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((step, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={[
                    'w-2 h-2 rounded-full transition-all duration-300',
                    done ? 'bg-emerald-400' : active ? 'bg-accent animate-pulse' : 'bg-border',
                  ].join(' ')}
                />
                <span
                  className={[
                    'text-xs transition-colors hidden sm:block',
                    done ? 'text-emerald-400' : active ? 'text-accent' : 'text-slate-600',
                  ].join(' ')}
                >
                  {done ? <CheckCircle size={10} className="inline" /> : null} {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
