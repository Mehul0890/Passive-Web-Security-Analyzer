import { Shield, Activity } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20">
            <Shield size={18} className="text-accent" />
          </div>
          <div>
            <h1 className="font-display font-bold text-base text-white leading-none tracking-tight">
              Passive Web Security Analyzer
              <span className="text-accent ml-1.5 text-sm font-semibold">Pro</span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Non-intrusive security intelligence · Public data only</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Activity size={12} className="text-emerald-400" />
            <span className="text-emerald-400 text-xs font-medium">Passive Mode</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 border border-border rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Free & Open
          </div>
        </div>
      </div>
    </header>
  );
}
