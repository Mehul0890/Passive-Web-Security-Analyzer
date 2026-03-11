import React, { useState } from 'react';
import { Search, X, Zap, Globe, Lock, Info } from 'lucide-react';

interface HeroInputProps {
  onAnalyze: (url: string) => void;
  onReset: () => void;
  isScanning: boolean;
  currentUrl: string;
}

const EXAMPLES = [
  'example.com',
  'github.com',
  'news.ycombinator.com',
];

export function HeroInput({ onAnalyze, onReset, isScanning, currentUrl }: HeroInputProps) {
  const [value, setValue] = useState('');

  const handleAnalyze = () => {
    const url = value.trim() || currentUrl;
    if (url) onAnalyze(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAnalyze();
  };

  const handleExample = (ex: string) => {
    setValue(ex);
  };

  const handleClear = () => {
    setValue('');
    onReset();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* Hero headline */}
      <div className="text-center mb-8">
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-3 leading-tight">
          Passive Security{' '}
          <span className="text-accent">Intelligence</span>
        </h2>
        <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
          Enter any website URL to generate a free, non-intrusive security report
          using only publicly accessible data.
        </p>
      </div>

      {/* Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="example.com or https://example.com"
              className="input-field pl-9 pr-10"
              disabled={isScanning}
              autoFocus
            />
            {value && (
              <button
                onClick={() => setValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isScanning || (!value.trim() && !currentUrl)}
            className="btn-primary whitespace-nowrap"
          >
            {isScanning ? (
              <>
                <span className="w-4 h-4 border-2 border-void/30 border-t-void rounded-full animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <Zap size={15} />
                Analyze
              </>
            )}
          </button>

          {currentUrl && (
            <button onClick={handleClear} className="btn-secondary">
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Examples */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="text-slate-600 text-xs">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => handleExample(ex)}
            className="text-xs text-slate-500 hover:text-accent transition-colors font-mono border border-border/50 hover:border-accent/30 rounded px-2 py-0.5"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 flex items-start gap-2.5 p-3.5 rounded-lg bg-blue-500/5 border border-blue-500/15">
        <Info size={14} className="text-blue-400 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-500 leading-relaxed">
          <span className="text-slate-400 font-medium">Passive analysis only.</span>{' '}
          This tool performs no port scanning, fuzzing, exploitation, or intrusive
          enumeration. All data is collected via standard HTTP requests, public DNS,
          and SSL certificate metadata. No login attempts or active probing.
          <span className="text-slate-500 ml-1">
            <Lock size={11} className="inline -mt-0.5" /> Ethical &amp; legal by design.
          </span>
        </div>
      </div>
    </div>
  );
}
