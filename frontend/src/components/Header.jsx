import React from 'react';
import { Shield, User, Building2, Landmark, CheckCircle2, Copy } from 'lucide-react';

export default function Header({ activeRole, setActiveRole, currentAccount }) {
  const [copied, setCopied] = React.useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(currentAccount.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">Parda</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  ZKP Health Web3
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Zero-Knowledge Health Records & Instant Claims Settlement</p>
            </div>
          </div>

          {/* Three-Role Switcher Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveRole('patient')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeRole === 'patient'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>1. Patient</span>
            </button>

            <button
              onClick={() => setActiveRole('hospital')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeRole === 'hospital'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>2. Hospital</span>
            </button>

            <button
              onClick={() => setActiveRole('insurer')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeRole === 'insurer'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>3. Insurer</span>
            </button>
          </div>

          {/* Connected Identity / Preset Wallet */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="text-right">
              <div className="text-xs font-medium text-slate-300">{currentAccount.name}</div>
              <div className="text-xs text-indigo-400 font-mono">{currentAccount.balance}</div>
            </div>
            <button
              onClick={copyAddress}
              title="Copy Address"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-mono transition-colors"
            >
              <span>{currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}</span>
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
