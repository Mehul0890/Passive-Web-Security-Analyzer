import { Lightbulb, TrendingUp } from 'lucide-react';
import type { Recommendation, AppMode } from '../../types';
import { severityBg } from '../../lib/utils';
import { clsx } from 'clsx';

interface RecommendationsTabProps {
  recommendations: Recommendation[];
  mode: AppMode;
}

const PRIORITY_ORDER = ['critical', 'high', 'moderate', 'low'];

export function RecommendationsTab({ recommendations, mode }: RecommendationsTabProps) {
  const sorted = [...recommendations].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
  );

  if (sorted.length === 0) {
    return (
      <div className="card text-center py-12">
        <TrendingUp size={36} className="text-emerald-400 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-2">No Recommendations</h3>
        <p className="text-slate-500 text-sm">Excellent — no actionable security recommendations found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-slate-500 text-xs">
        {sorted.length} recommendation{sorted.length !== 1 ? 's' : ''} ordered by priority
      </div>

      {sorted.map((rec, i) => (
        <div key={rec.id} className="card hover:border-accent/20 transition-colors">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-6 h-6 rounded bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 text-accent text-xs font-bold font-mono">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-white font-semibold text-sm">{rec.title}</h4>
                <span className={clsx('badge border text-xs uppercase', severityBg(rec.priority))}>
                  {rec.priority}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 ml-9">
            <div>
              <div className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-wide">Why</div>
              <div className="text-slate-300 text-sm leading-relaxed">
                {mode === 'learner' ? rec.learnerNote : rec.reason}
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium mb-1">
                <Lightbulb size={12} />
                Security Benefit
              </div>
              <div className="text-slate-400 text-xs leading-relaxed">{rec.benefit}</div>
            </div>

            {rec.findingRef && (
              <div className="text-slate-600 text-xs">
                Related finding: <span className="font-mono text-slate-500">{rec.findingRef}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
