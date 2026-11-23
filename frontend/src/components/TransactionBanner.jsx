import React from 'react';
import { ExternalLink, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

export default function TransactionBanner() {
  const { txStatus, dismissTxStatus } = useWeb3();

  if (!txStatus) return null;

  const isPending = txStatus.status === 'pending';
  const isSuccess = txStatus.status === 'success';
  const isError = txStatus.status === 'error';

  return (
    <aside
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 max-w-md w-full p-4 rounded-lg border shadow-2xl backdrop-blur-md transition-all duration-300 font-sans ${
        isPending
          ? 'bg-[#12231C]/95 border-[#B99561]/60 text-[#F3EFE5]'
          : isSuccess
          ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100'
          : 'bg-rose-950/95 border-rose-500/60 text-rose-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {isPending && <Loader2 className="w-5 h-5 animate-spin text-[#B99561]" />}
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                {isPending ? 'Sepolia Broadcast' : isSuccess ? 'Sepolia Confirmed' : 'Transaction Error'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 border border-white/10">
                Ethereum Sepolia
              </span>
            </div>

            <p className="text-xs text-opacity-90 leading-relaxed break-words">
              {txStatus.message}
            </p>

            {txStatus.explorerUrl && (
              <a
                href={txStatus.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#B99561] hover:underline pt-1"
              >
                <span>View on Sepolia Etherscan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        <button
          onClick={dismissTxStatus}
          className="text-white/60 hover:text-white p-1 rounded transition-colors"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
