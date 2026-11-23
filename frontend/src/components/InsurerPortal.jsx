import React from 'react';
import { Landmark, ShieldCheck, Lock, Activity, Coins, CheckCircle, BarChart3, EyeOff } from 'lucide-react';

export default function InsurerPortal({
  claimSettled,
  poolBalanceEth = 10.00,
  totalSettledEth = 0.00,
  settledClaims = [],
  auditLogs = [],
  addAuditLog,
}) {
  const INR_PER_ETH = 10000;
  const latestClaim = settledClaims[0];

  // Dynamic Chart values reflecting incoming settled claims
  const newClaimsCount = settledClaims.length > 1 ? settledClaims.length - 1 : (claimSettled ? 1 : 0);
  const todayProofCount = 12 + newClaimsCount;
  const peakProofCount = Math.max(14, todayProofCount);
  const sunY = Math.max(6, 22 - (newClaimsCount * 4));

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Forest & Brass Accents & Dual Currency */}
      <div className="parda-surface p-6 border border-brass-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-brass-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <Landmark className="w-4 h-4 text-brass-400" />
              <span>Decentralized Underwriter Vault • Zero Medical Data Exposed</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-ivory-200 tracking-tight">
              HealthShield Mutual Escrow
            </h2>
            <p className="text-xs sm:text-sm text-sage-muted max-w-2xl font-sans">
              Underwriters receive zero electronic health records. Claim disbursements are authorized autonomously by smart contracts evaluating Circom zk-SNARK validity proofs.
            </p>
          </div>
          
          <div className="flex items-center space-x-4 bg-forest-900/90 border border-sage-500/20 rounded p-3.5 font-mono text-xs shrink-0">
            <div>
              <div className="text-sage-muted text-[10px] uppercase">Total Pool Liquidity</div>
              <div className="text-sm font-bold text-brass-400 font-mono">
                {poolBalanceEth.toFixed(2)} ETH <span className="text-[11px] text-sage-muted font-normal">(₹{(poolBalanceEth * INR_PER_ETH).toLocaleString('en-IN')})</span>
              </div>
            </div>
            <div className="h-8 w-px bg-sage-500/20" />
            <div>
              <div className="text-sage-muted text-[10px] uppercase">Settled Payouts</div>
              <div className="text-sm font-bold text-ivory-200 font-mono">
                {totalSettledEth.toFixed(2)} ETH <span className="text-[11px] text-sage-muted font-normal">(₹{(totalSettledEth * INR_PER_ETH).toLocaleString('en-IN')})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid: Settlement Ledger & Telemetry Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Claims Settlement Ledger Table (Zero Clinical Disclosure) */}
        <div className="lg:col-span-8 parda-surface p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sage-500/20 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded bg-forest-800 border border-sage-500/25 flex items-center justify-center text-brass-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-serif font-normal text-ivory-200">On-Chain Verified Claims Ledger</h3>
                <div className="text-[11px] font-mono text-sage-muted">03.01 // STRICTLY ZERO MEDICAL DATA EXPOSED</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-forest-900 border border-sage-500/30 text-sage-300">
              {settledClaims.length} Active {settledClaims.length === 1 ? 'Proof' : 'Proofs'} Anchored
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-forest-900/90 text-sage-muted border-b border-sage-500/20 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3.5">Nullifier Hash</th>
                  <th className="py-3 px-3.5">Hospital Payee</th>
                  <th className="py-3 px-3.5">Amount (ETH / INR)</th>
                  <th className="py-3 px-3.5">Clinical Privacy</th>
                  <th className="py-3 px-3.5">Proof Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-500/10">
                {/* Dynamically mapped settled claims */}
                {settledClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-forest-850 transition-colors">
                    <td className="py-3.5 px-3.5 text-brass-400 font-bold" title={claim.nullifier}>
                      {claim.nullifier.slice(0, 10)}...{claim.nullifier.slice(-4)}
                    </td>
                    <td className="py-3.5 px-3.5 text-ivory-200">
                      {claim.payee}
                    </td>
                    <td className="py-3.5 px-3.5 font-bold text-ivory-200">
                      {claim.amountEth.toFixed(2)} ETH <span className="text-[11px] text-sage-muted font-normal">(₹{(claim.amountEth * INR_PER_ETH).toLocaleString('en-IN')})</span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-forest-900 border border-sage-500/20 text-sage-muted text-[10px]">
                        <EyeOff className="w-3 h-3 text-brass-400" />
                        <span>[100% REDACTED IN ZK]</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className="inline-flex items-center space-x-1 text-brass-400 font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-brass-400" />
                        <span>{claim.status || 'VERIFIED VALID'}</span>
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Simulated Blocked Duplicate Nullifier Attack Demonstration */}
                <tr className="bg-forest-900/60 border-y border-brass-500/30 hover:bg-forest-850 transition-colors">
                  <td className="py-3.5 px-3.5 text-sage-muted font-bold">
                    0x7c814...00ae
                  </td>
                  <td className="py-3.5 px-3.5 text-sage-muted">
                    0x15d3...6A65 (Metropolitan)
                  </td>
                  <td className="py-3.5 px-3.5 font-bold text-sage-muted">
                    2.80 ETH <span className="text-[11px] text-sage-muted/70 font-normal">(₹28,000)</span>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-forest-900 text-brass-400 border border-brass-500/30 text-[10px]">
                      <span>DUPLICATE NULLIFIER</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 text-brass-400 font-semibold">
                    ✖ REPLAY BLOCKED ON-CHAIN
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 7-Day Verification Volume Chart (Dynamic Proofs Reflection) */}
          <div className="p-4 rounded bg-forest-850 border border-sage-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-sage-muted">
              <span className="flex items-center gap-1.5 text-ivory-200 font-semibold">
                <BarChart3 className="w-3.5 h-3.5 text-brass-400" />
                <span>7-Day Cryptographic Proof Volume</span>
              </span>
              <span className="text-brass-400">
                Peak: {peakProofCount} proofs/day • 0 data leaks ({todayProofCount} proofs today)
              </span>
            </div>
            
            <div className="w-full pt-2">
              <svg viewBox="0 0 280 80" className="w-full h-20 overflow-visible">
                <defs>
                  <linearGradient id="forestBrassGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B99561" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#12231C" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                <polygon 
                  fill="url(#forestBrassGrad)" 
                  points={`15,60 55,45 95,50 135,25 175,35 215,15 265,${sunY} 265,80 15,80`} 
                />
                <polyline
                  fill="none"
                  stroke="#B99561"
                  strokeWidth="1.75"
                  points={`15,60 55,45 95,50 135,25 175,35 215,15 265,${sunY}`}
                />
                <circle cx="15" cy="60" r="3" fill="#B99561" stroke="#0B1713" strokeWidth="1" />
                <circle cx="55" cy="45" r="3" fill="#B99561" stroke="#0B1713" strokeWidth="1" />
                <circle cx="95" cy="50" r="3" fill="#B99561" stroke="#0B1713" strokeWidth="1" />
                <circle cx="135" cy="25" r="3" fill="#B99561" stroke="#0B1713" strokeWidth="1" />
                <circle cx="175" cy="35" r="3" fill="#B99561" stroke="#0B1713" strokeWidth="1" />
                <circle cx="215" cy="15" r="3" fill="#B99561" stroke="#0B1713" strokeWidth="1" />
                <circle cx="265" cy={sunY} r="3.5" fill="#B99561" stroke="#0B1713" strokeWidth="1" />
              </svg>
              <div className="flex justify-between text-[9px] font-mono text-sage-muted mt-1 px-1">
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
                <span className="text-brass-400 font-bold">TODAY ({todayProofCount})</span>
              </div>
            </div>
          </div>

          {/* Privacy Value Guarantee Callout */}
          <div className="bg-forest-850 border border-sage-500/20 rounded p-4 flex items-start space-x-3 text-xs text-sage-muted font-sans">
            <Lock className="w-4 h-4 text-brass-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-ivory-200 font-semibold">Zero-Knowledge Verification Guarantee:</span> The smart contract mathematically verified that the hospital is licensed, the policy is active, and the claim is within limits without revealing ICD-10 diagnosis codes or physician prescriptions to the underwriter or public nodes.
            </div>
          </div>
        </div>

        {/* Right: Public Signals, Actuarial Reserves & Live Audit Feed */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Public Calldata Signals Card */}
          <div className="parda-surface p-6 space-y-3.5 border border-brass-500/30">
            <div className="flex items-center justify-between border-b border-sage-500/20 pb-3">
              <div className="flex items-center space-x-2 text-brass-400">
                <ShieldCheck className="w-4 h-4 text-brass-400" />
                <h3 className="text-base font-serif font-normal text-ivory-200">Public Signals (6 Fields)</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest-900 border border-brass-500/30 text-brass-400">
                EVM Calldata
              </span>
            </div>
            <p className="text-xs text-sage-muted leading-relaxed font-sans">
              Strictly zero medical inputs reach the contract. The ClaimManager verifies these 6 public field elements:
            </p>
            <div className="space-y-1.5 font-mono text-[11px] text-sage-muted bg-forest-850 p-3 rounded border border-sage-500/15">
              <div>
                <span className="text-brass-400">[0] nullifier:</span>{' '}
                {latestClaim ? `${latestClaim.nullifier.slice(0, 16)}...` : 'Poseidon(salt, recordId)'}
              </div>
              <div><span className="text-brass-400">[1] hospitalRoot:</span> 2-of-3 Multi-Sig Root</div>
              <div><span className="text-brass-400">[2] commitment:</span> Policy Hash Anchor</div>
              <div>
                <span className="text-brass-400">[3] claimAmount:</span>{' '}
                {latestClaim 
                  ? `₹${(latestClaim.amountEth * INR_PER_ETH).toLocaleString('en-IN')} (${latestClaim.amountEth.toFixed(2)} ETH)` 
                  : '₹15,000 (1.50 ETH)'}
              </div>
              <div><span className="text-brass-400">[4] claimDay:</span> Day 20,050</div>
              <div>
                <span className="text-brass-400">[5] recipient:</span>{' '}
                {latestClaim ? latestClaim.payee : '0x7099...79C8 (St. Jude)'}
              </div>
            </div>
          </div>

          {/* Actuarial Escrow & Solvency Status Card */}
          <div className="parda-surface p-6 space-y-3.5 border border-emerald-500/30">
            <div className="flex items-center justify-between border-b border-sage-500/20 pb-3">
              <div className="flex items-center space-x-2 text-brass-400">
                <Coins className="w-4 h-4 text-brass-400" />
                <h3 className="text-base font-serif font-normal text-ivory-200">Actuarial Reserve & Solvency</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest-900 border border-emerald-500/30 text-emerald-400 font-bold">
                {poolBalanceEth > 0 ? '100% SOLVENT' : 'DEPLETED'}
              </span>
            </div>
            <p className="text-xs text-sage-muted leading-relaxed font-sans">
              Escrow liquidity is strictly segregated from underwriting operations. Autonomous disbursements execute only when Groth16 circuit proofs satisfy all 7 constraints.
            </p>
            <div className="space-y-2 font-mono text-[11px] bg-forest-850 p-3 rounded border border-sage-500/15">
              <div className="flex justify-between items-center">
                <span className="text-sage-muted">Liquidity Reserve:</span>
                <span className="text-ivory-200 font-bold">
                  {poolBalanceEth.toFixed(2)} ETH (₹{(poolBalanceEth * INR_PER_ETH).toLocaleString('en-IN')})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sage-muted">Settled Payouts:</span>
                <span className="text-brass-400 font-bold">
                  {totalSettledEth.toFixed(2)} ETH (₹{(totalSettledEth * INR_PER_ETH).toLocaleString('en-IN')})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sage-muted">Regulator Multi-Sig:</span>
                <span className="text-brass-400 font-semibold">2-of-3 Quorum Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sage-muted">Medical Data Exposure:</span>
                <span className="text-emerald-400 font-semibold">0% (Shielded in ZK)</span>
              </div>
            </div>
          </div>

          {/* Live On-Chain Audit Trail Feed */}
          <div className="parda-surface p-6 space-y-3.5">
            <div className="flex items-center space-x-2 border-b border-sage-500/20 pb-3">
              <Activity className="w-4 h-4 text-brass-400" />
              <h3 className="text-base font-serif font-normal text-ivory-200">On-Chain Audit Trail</h3>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 font-mono text-xs">
              {auditLogs.map((log, index) => (
                <div
                  key={index}
                  className="p-3 rounded border bg-forest-850 border-sage-500/15 text-sage-muted transition-all"
                >
                  <div className="flex items-center justify-between font-semibold mb-1 text-ivory-200">
                    <span>{log.title}</span>
                    <span className="text-[10px] text-sage-600">{log.time}</span>
                  </div>
                  <div className="text-[11px] opacity-85 break-words font-sans">{log.detail}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
