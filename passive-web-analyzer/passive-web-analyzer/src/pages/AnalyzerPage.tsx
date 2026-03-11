import { useState } from 'react';
import { Header } from '../components/sections/Header';
import { HeroInput } from '../components/sections/HeroInput';
import { ScanProgressBar } from '../components/sections/ScanProgress';
import { AnalyzerDashboard } from '../components/sections/AnalyzerDashboard';
import { useAnalyzer } from '../hooks/useAnalyzer';
import type { AppMode } from '../types';
import { AlertCircle } from 'lucide-react';

export function AnalyzerPage() {
  const [mode, setMode] = useState<AppMode>('learner');
  const { report, progress, progressLabel, progressPercent, error, currentUrl, isScanning, analyze, reset } = useAnalyzer();

  const handleReanalyze = (url: string) => {
    reset();
    setTimeout(() => analyze(url), 100);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero input always visible at top */}
        <HeroInput
          onAnalyze={analyze}
          onReset={reset}
          isScanning={isScanning}
          currentUrl={currentUrl}
        />

        {/* Progress */}
        {isScanning && (
          <ScanProgressBar
            progress={progress}
            label={progressLabel}
            percent={progressPercent}
            url={currentUrl}
          />
        )}

        {/* Error state */}
        {progress === 'error' && error && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-6 animate-slide-up">
            <div className="card border-red-500/30 bg-red-500/5">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-red-400 font-semibold text-sm mb-1">Analysis Failed</h3>
                  <p className="text-slate-400 text-sm">{error}</p>
                  <p className="text-slate-600 text-xs mt-2">
                    This may be caused by the target blocking requests, a DNS resolution failure, a network timeout,
                    or an invalid URL. Please check the URL and try again.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report */}
        {report && (
          <AnalyzerDashboard
            report={report}
            mode={mode}
            onModeChange={setMode}
            onReanalyze={handleReanalyze}
          />
        )}

        {/* Empty state */}
        {!report && !isScanning && progress === 'idle' && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: '🔒',
                  title: 'SSL & HTTPS',
                  desc: 'Certificate validity, expiry, issuer, and TLS configuration analysis.',
                },
                {
                  icon: '🛡️',
                  title: 'Security Headers',
                  desc: 'Check for 9 critical HTTP security headers including CSP, HSTS, and more.',
                },
                {
                  icon: '🌐',
                  title: 'DNS Intelligence',
                  desc: 'A, MX, NS, TXT records with SPF and DMARC email security detection.',
                },
                {
                  icon: '🍪',
                  title: 'Cookie Analysis',
                  desc: 'Inspect Secure, HttpOnly, and SameSite flags on response cookies.',
                },
                {
                  icon: '↪️',
                  title: 'Redirect Chains',
                  desc: 'Follow all HTTP redirects and verify HTTP-to-HTTPS upgrades.',
                },
                {
                  icon: '📊',
                  title: 'Risk Scoring',
                  desc: 'Deterministic weighted scoring based on real findings — no guesswork.',
                },
              ].map((feat) => (
                <div key={feat.title} className="card-sm hover:border-accent/20 transition-colors">
                  <div className="text-2xl mb-2">{feat.icon}</div>
                  <h3 className="text-white text-sm font-semibold mb-1">{feat.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border/50 py-6 text-center text-slate-700 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Passive Web Security Analyzer Pro — Free, open, non-intrusive</span>
          <span>No scanning. No hacking. No data storage. Passive analysis only.</span>
        </div>
      </footer>
    </div>
  );
}
