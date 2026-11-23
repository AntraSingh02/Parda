import React, { useState } from 'react';
import { 
  Shield, 
  User, 
  Building2, 
  Landmark, 
  CheckCircle2, 
  Copy, 
  RotateCcw, 
  Eye, 
  ShieldAlert, 
  Wallet, 
  Power, 
  Loader2, 
  ExternalLink 
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

export default function Header({ activeRole, setActiveRole, currentAccount, onReplayIntro }) {
  const [copied, setCopied] = useState(false);
  const { 
    account, 
    balance, 
    isSepolia, 
    isConnecting, 
    isLiveMode, 
    toggleLiveMode, 
    connectWallet, 
    disconnectWallet, 
    switchToSepolia 
  } = useWeb3();

  const copyAddress = (addr) => {
    if (addr) {
      navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 lg:px-8 w-full bg-[#0B1713]/90 backdrop-blur-md border-b border-[#9DAF9D]/15 font-sans">
      <div className="max-w-7xl mx-auto py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Brand & Mode Switch */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-[#12231C] border border-[#B99561]/40 flex items-center justify-center text-[#B99561]">
              <Shield className="w-3 h-3" />
            </div>
            <span className="text-sm sm:text-base font-medium tracking-tight text-[#F3EFE5]">
              Parda
            </span>
          </div>

          {/* Dual-Mode Toggle Pill */}
          <button
            onClick={toggleLiveMode}
            title={isLiveMode ? "Switch to Fast Demo Mode (Simulated)" : "Switch to Live Sepolia Mode (MetaMask)"}
            className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
              isLiveMode 
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/40' 
                : 'bg-[#12231C] text-[#AEB8AA] border-[#9DAF9D]/20 hover:text-[#F3EFE5]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span>{isLiveMode ? '⚡ Sepolia Live' : '🧪 Demo Mode'}</span>
          </button>
        </div>

        {/* Center: The Role & Verification Control */}
        <div className="flex flex-wrap items-center bg-[#12231C] p-0.5 sm:p-1 rounded border border-[#9DAF9D]/20 order-3 sm:order-2 w-full sm:w-auto justify-center gap-1" aria-label="Role switcher">
          <button
            onClick={() => setActiveRole('patient')}
            title="Press [1] to switch to Patient"
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs transition-colors cursor-pointer ${
              activeRole === 'patient'
                ? 'bg-[#192C23] text-[#F3EFE5] font-medium border border-[#B99561]/40 shadow-sm'
                : 'text-[#AEB8AA] hover:text-[#F3EFE5]'
            }`}
          >
            <User className="w-3 h-3 text-[#B99561]" />
            <span>1. Patient</span>
            <span className="text-[9px] opacity-40 font-mono hidden lg:inline">[1]</span>
          </button>

          <button
            onClick={() => setActiveRole('hospital')}
            title="Press [2] to switch to Hospital"
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs transition-colors cursor-pointer ${
              activeRole === 'hospital'
                ? 'bg-[#192C23] text-[#F3EFE5] font-medium border border-[#B99561]/40 shadow-sm'
                : 'text-[#AEB8AA] hover:text-[#F3EFE5]'
            }`}
          >
            <Building2 className="w-3 h-3 text-[#B99561]" />
            <span>2. Hospital</span>
            <span className="text-[9px] opacity-40 font-mono hidden lg:inline">[2]</span>
          </button>

          <button
            onClick={() => setActiveRole('insurer')}
            title="Press [3] to switch to Insurer"
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs transition-colors cursor-pointer ${
              activeRole === 'insurer'
                ? 'bg-[#192C23] text-[#F3EFE5] font-medium border border-[#B99561]/40 shadow-sm'
                : 'text-[#AEB8AA] hover:text-[#F3EFE5]'
            }`}
          >
            <Landmark className="w-3 h-3 text-[#B99561]" />
            <span>3. Insurer</span>
            <span className="text-[9px] opacity-40 font-mono hidden lg:inline">[3]</span>
          </button>

          <div className="h-4 w-px bg-[#9DAF9D]/20 mx-0.5 hidden md:block" />

          <button
            onClick={() => setActiveRole('xray')}
            title="Press [4] to view Privacy X-Ray"
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs transition-colors cursor-pointer ${
              activeRole === 'xray'
                ? 'bg-purple-950/60 text-purple-200 font-medium border border-purple-500/40 shadow-sm'
                : 'text-purple-400 hover:text-purple-200'
            }`}
          >
            <Eye className="w-3 h-3 text-purple-400" />
            <span>Privacy X-Ray</span>
            <span className="text-[9px] opacity-40 font-mono hidden lg:inline">[4]</span>
          </button>

          <button
            onClick={() => setActiveRole('redteam')}
            title="Press [5] to run Red-Team Attacks"
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs transition-colors cursor-pointer ${
              activeRole === 'redteam'
                ? 'bg-rose-950/60 text-rose-200 font-medium border border-rose-500/40 shadow-sm'
                : 'text-rose-400 hover:text-rose-200'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Red-Team</span>
            <span className="text-[9px] opacity-40 font-mono hidden lg:inline">[5]</span>
          </button>
        </div>

        {/* Right: Intro button & Web3 / Account Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs order-2 sm:order-3">
          <button
            onClick={onReplayIntro}
            aria-label="Replay intro"
            title="Replay intro animation (Esc)"
            className="p-1.5 sm:p-2 rounded bg-[#12231C] hover:bg-[#192C23] border border-[#9DAF9D]/20 text-[#AEB8AA] hover:text-[#F3EFE5] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* If Live Mode is ON: Show MetaMask Wallet controls */}
          {isLiveMode ? (
            !account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-gradient-to-r from-amber-600/30 to-amber-500/20 hover:from-amber-600/40 hover:to-amber-500/30 border border-amber-500/50 text-amber-200 text-[11px] sm:text-xs font-mono font-medium transition-all shadow-sm cursor-pointer"
              >
                {isConnecting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                ) : (
                  <Wallet className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>Connect MetaMask</span>
              </button>
            ) : !isSepolia ? (
              <button
                onClick={switchToSepolia}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-amber-950/70 border border-amber-500/60 text-amber-300 text-[11px] sm:text-xs font-mono transition-all cursor-pointer animate-pulse"
                title="Your wallet is on a different network. Click to switch to Sepolia."
              >
                <span>⚠️ Switch to Sepolia</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1 bg-[#12231C] border border-emerald-500/30 rounded px-2 py-1 text-[11px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Connected to Sepolia" />
                <span className="text-emerald-400 font-semibold hidden md:inline">Sepolia:</span>
                <button
                  onClick={() => copyAddress(account)}
                  title="Click to copy connected address"
                  className="text-ivory-200 hover:text-white flex items-center space-x-1 cursor-pointer"
                >
                  <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
                  {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-sage-muted" />}
                </button>
                <span className="text-brass-400 font-bold ml-1 hidden lg:inline">({balance} ETH)</span>
                <button
                  onClick={disconnectWallet}
                  title="Disconnect MetaMask"
                  className="ml-1 text-sage-muted hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                >
                  <Power className="w-3 h-3" />
                </button>
              </div>
            )
          ) : (
            /* Demo Mode: Show active simulated role address */
            activeRole === 'xray' ? (
              <div className="flex items-center space-x-1 px-2.5 py-1 sm:py-1.5 rounded bg-purple-950/40 border border-purple-500/30 text-purple-300 text-[11px] sm:text-xs font-mono">
                <Eye className="w-3 h-3 text-purple-400" />
                <span>Inspector (Diagnostic)</span>
              </div>
            ) : activeRole === 'redteam' ? (
              <div className="flex items-center space-x-1 px-2.5 py-1 sm:py-1.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px] sm:text-xs font-mono">
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                <span>Adversary (Audit)</span>
              </div>
            ) : currentAccount?.address ? (
              <button
                onClick={() => copyAddress(currentAccount.address)}
                title={`Simulated ${currentAccount.roleLabel}: Click to copy address`}
                className="flex items-center space-x-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded bg-[#12231C] border border-[#9DAF9D]/20 hover:border-[#B99561]/40 text-[#AEB8AA] hover:text-[#F3EFE5] transition-colors text-[11px] sm:text-xs cursor-pointer font-mono"
              >
                <span className="text-[#B99561] font-semibold">{currentAccount.roleLabel}:</span>
                <span>{currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}</span>
                {copied ? (
                  <CheckCircle2 className="w-3 h-3 text-[#B99561]" />
                ) : (
                  <Copy className="w-3 h-3 text-[#AEB8AA]" />
                )}
              </button>
            ) : null
          )}
        </div>

      </div>
    </header>
  );
}
