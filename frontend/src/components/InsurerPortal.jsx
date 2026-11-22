import React, { useState } from 'react';
import { Landmark, ShieldCheck, Lock, Activity, AlertTriangle, Coins, CheckCircle, ExternalLink } from 'lucide-react';
import { MOCK_PATIENT } from '../data/mockData';

export default function InsurerPortal({
  claimSettled,
  auditLogs,
  addAuditLog,
}) {
  const [breakGlassReason, setBreakGlassReason] = useState("Patient unconscious after severe acute trauma - emergency allergy check");
  const [isBreakGlassActive, setIsBreakGlassActive] = useState(false);

  // Trigger Emergency Break-Glass
  const handleTriggerBreakGlass = () => {
    setIsBreakGlassActive(true);
    addAuditLog({
      type: 'EMERGENCY_BREAK_GLASS',
      title: 'EMERGENCY BREAK-GLASS TRIGGERED',
      detail: `First Responder accessed emergency health notes for ${MOCK_PATIENT.name}. Reason: "${breakGlassReason}"`,
      time: new Date().toLocaleTimeString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-teal-900/20 to-slate-900 border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Landmark className="w-4 h-4" />
              <span>Decentralized Insurance Underwriter</span>
            </div>
            <h2 className="text-2xl font-bold text-white">HealthShield Mutual Escrow</h2>
            <p className="text-sm text-slate-400 mt-1">
              Claims are settled autonomously via smart contracts and Zero-Knowledge Proofs. Medical details are never transmitted.
            </p>
          </div>
          <div className="flex items-center space-x-4 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div>
              <div className="text-xs text-slate-400">Total Pool Liquidity</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">10.0 ETH</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <div className="text-xs text-slate-400">Settled Payouts</div>
              <div className="text-sm font-bold text-white font-mono">{claimSettled ? "1.5 ETH" : "0.0 ETH"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Settlement Ledger & Emergency Break-Glass */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Settlement Claims Ledger */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">On-Chain Verified Claims Ledger</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
              Auto-Settled via Groth16
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3 px-3">Nullifier (Anti-Replay)</th>
                  <th className="py-3 px-3">Payout Destination</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Diagnosis Details</th>
                  <th className="py-3 px-3">Proof Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {claimSettled ? (
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-3 font-mono text-indigo-400">
                      0x2dc35...19f3
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-300">
                      0x7099...79C8 (St. Jude)
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-white">
                      1.5 ETH
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium text-[11px]">
                        <Lock className="w-3 h-3 text-indigo-400" />
                        <span>[REDACTED IN ZERO-KNOWLEDGE]</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>VERIFIED VALID</span>
                      </span>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">
                      No claims submitted yet. Use Hospital Portal to generate and submit a ZK claim.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Privacy Value Proposition Callout */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-400">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-semibold">Zero-Knowledge Verification Guarantee:</span> The smart contract checked that the hospital is licensed, the policy is valid, and the treatment is covered without ever exposing the ICD-10 diagnosis code or physician prescriptions to the insurer or public blockchain.
            </div>
          </div>
        </div>

        {/* Right: Emergency Break-Glass & Audit Trail */}
        <div className="lg:col-span-4 space-y-6">
          {/* Emergency Break-Glass Card (Bonus Feature) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center space-x-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-semibold text-white">Emergency Break-Glass</h3>
            </div>
            <p className="text-xs text-slate-400">
              Incapacitated patient override. First responders gain immediate access, permanently logged to an immutable on-chain audit trail.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={breakGlassReason}
                onChange={(e) => setBreakGlassReason(e.target.value)}
                placeholder="Reason for emergency access..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={handleTriggerBreakGlass}
                className="w-full flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2 rounded-xl transition-all text-xs shadow-lg shadow-rose-600/20"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Trigger Break-Glass Emergency Log</span>
              </button>
            </div>
          </div>

          {/* Live On-Chain Audit Trail Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">On-Chain Audit Trail</h3>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {auditLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-2.5 rounded-xl border text-xs ${
                    log.type === 'EMERGENCY_BREAK_GLASS'
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      : log.type === 'CLAIM_SETTLED'
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold mb-0.5">
                    <span>{log.title}</span>
                    <span className="text-[10px] opacity-60 font-mono">{log.time}</span>
                  </div>
                  <div className="text-[11px] opacity-80 break-words">{log.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
