import React, { useState } from 'react';
import { Shield, User, Building2, Landmark, CheckCircle2, Copy, RotateCcw, Eye, ShieldAlert } from 'lucide-react';

export default function Header({ activeRole, setActiveRole, currentAccount, onReplayIntro }) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (currentAccount?.address) {
      navigator.clipboard.writeText(currentAccount.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 lg:px-8 w-full bg-[#0B1713]/90 backdrop-blur-md border-b border-[#9DAF9D]/15 font-sans">
      <div className="max-w-7xl mx-auto py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-[#12231C] border border-[#B99561]/40 flex items-center justify-center text-[#B99561]">
            <Shield className="w-3 h-3" />
          </div>
          <span className="text-sm sm:text-base font-medium tracking-tight text-[#F3EFE5]">
            Parda
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#12231C] text-[#B99561] border border-[#B99561]/30 hidden sm:inline-block">
            ZKP Web3
          </span>
        </div>

        {/* Center: The Role & Verification Control */}
        <div className="flex flex-wrap items-center bg-[#12231C] p-0.5 sm:p-1 rounded border border-[#9DAF9D]/20 order-3 sm:order-2 w-full sm:w-auto justify-center gap-1" aria-label="Role switcher">
          <button
            onClick={() => setActiveRole('patient')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs transition-colors ${
              activeRole === 'patient'
                ? 'bg-[#192C23] text-[#F3EFE5] font-medium border border-[#B99561]/40 shadow-sm'
                : 'text-[#AEB8AA] hover:text-[#F3EFE5]'
            }`}
          >
            <User className="w-3 h-3 text-[#B99561]" />
            <span>1. Patient</span>
          </button>

          <button
            onClick={() => setActiveRole('hospital')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs transition-colors ${
              activeRole === 'hospital'
                ? 'bg-[#192C23] text-[#F3EFE5] font-medium border border-[#B99561]/40 shadow-sm'
                : 'text-[#AEB8AA] hover:text-[#F3EFE5]'
            }`}
          >
            <Building2 className="w-3 h-3 text-[#B99561]" />
            <span>2. Hospital</span>
          </button>

          <button
            onClick={() => setActiveRole('insurer')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs transition-colors ${
              activeRole === 'insurer'
                ? 'bg-[#192C23] text-[#F3EFE5] font-medium border border-[#B99561]/40 shadow-sm'
                : 'text-[#AEB8AA] hover:text-[#F3EFE5]'
            }`}
          >
            <Landmark className="w-3 h-3 text-[#B99561]" />
            <span>3. Insurer</span>
          </button>

          <div className="h-4 w-px bg-[#9DAF9D]/20 mx-0.5 hidden md:block" />

          <button
            onClick={() => setActiveRole('xray')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs transition-colors ${
              activeRole === 'xray'
                ? 'bg-purple-950/60 text-purple-200 font-medium border border-purple-500/40 shadow-sm'
                : 'text-purple-400 hover:text-purple-200'
            }`}
          >
            <Eye className="w-3 h-3 text-purple-400" />
            <span>Privacy X-Ray</span>
          </button>

          <button
            onClick={() => setActiveRole('redteam')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs transition-colors ${
              activeRole === 'redteam'
                ? 'bg-rose-950/60 text-rose-200 font-medium border border-rose-500/40 shadow-sm'
                : 'text-rose-400 hover:text-rose-200'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Red-Team</span>
          </button>
        </div>

        {/* Right: Replay Intro Icon Button & Wallet Chip */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs order-2 sm:order-3">
          <button
            onClick={onReplayIntro}
            aria-label="Replay intro"
            title="Replay intro"
            className="p-1.5 sm:p-2 rounded bg-[#12231C] hover:bg-[#192C23] border border-[#9DAF9D]/20 text-[#AEB8AA] hover:text-[#F3EFE5] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {currentAccount?.address && (
            <button
              onClick={copyAddress}
              title="Copy address"
              className="flex items-center space-x-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded bg-[#12231C] border border-[#9DAF9D]/20 hover:border-[#B99561]/40 text-[#AEB8AA] hover:text-[#F3EFE5] transition-colors text-[11px] sm:text-xs"
            >
              <span>{currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}</span>
              {copied ? (
                <CheckCircle2 className="w-3 h-3 text-[#B99561]" />
              ) : (
                <Copy className="w-3 h-3 text-[#AEB8AA]" />
              )}
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
