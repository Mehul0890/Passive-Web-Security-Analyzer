import { useState, useEffect } from 'react';
import { Trash2, Clock, RotateCcw, ExternalLink } from 'lucide-react';
import type { HistoryEntry } from '../../types';
import { loadHistory, deleteHistoryEntry, clearHistory } from '../../lib/history';
import { riskBg, formatDate } from '../../lib/utils';
import { clsx } from 'clsx';

interface HistoryTabProps {
  onReanalyze: (url: string) => void;
  onCompare?: (entry: HistoryEntry) => void;
  currentReport?: { id: string } | null;
}

export function HistoryTab({ onReanalyze, onCompare, currentReport }: HistoryTabProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  const handleDelete = (id: string) => {
    deleteHistoryEntry(id);
    setEntries(loadHistory());
  };

  const handleClearAll = () => {
    if (confirm('Clear all scan history? This cannot be undone.')) {
      clearHistory();
      setEntries([]);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="card text-center py-12 text-slate-500">
        <Clock size={36} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No scan history yet.</p>
        <p className="text-xs mt-1 text-slate-600">History is stored locally in your browser.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs">{entries.length} scan{entries.length !== 1 ? 's' : ''} stored locally</span>
        <button onClick={handleClearAll} className="btn-secondary text-xs text-red-400 hover:text-red-300 hover:border-red-500/30">
          <Trash2 size={12} />
          Clear All
        </button>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => {
          const isCurrent = currentReport?.id === entry.id;
          return (
            <div
              key={entry.id}
              className={clsx(
                'card-sm flex items-center gap-3',
                isCurrent && 'border-accent/30 bg-accent/5'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-mono text-sm font-medium truncate">{entry.target}</span>
                  {isCurrent && (
                    <span className="badge bg-accent/10 text-accent border-accent/20 text-xs">current</span>
                  )}
                  <span className={clsx('badge border text-xs', riskBg(entry.label))}>
                    {entry.label}
                  </span>
                  <span className="text-slate-500 text-xs font-bold">{entry.score}/100</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-slate-600 text-xs">
                  <Clock size={11} />
                  {formatDate(entry.timestamp)}
                  <span>·</span>
                  <span>{entry.summary}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {onCompare && !isCurrent && (
                  <button
                    onClick={() => onCompare(entry)}
                    className="btn-secondary text-xs py-1"
                    title="Compare with current scan"
                  >
                    <ExternalLink size={11} />
                    Compare
                  </button>
                )}
                <button
                  onClick={() => onReanalyze(entry.target)}
                  className="btn-secondary text-xs py-1"
                  title="Re-analyze this target"
                >
                  <RotateCcw size={11} />
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="btn-secondary text-xs py-1 text-red-400 hover:text-red-300"
                  title="Delete this entry"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-600 text-center border-t border-border pt-3">
        Scan history is stored only in your browser's localStorage. Clearing browser data will remove it.
      </div>
    </div>
  );
}
