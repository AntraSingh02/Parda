import React, { useState } from 'react';
import { Building2, Cpu, CheckCircle2, ArrowRight, ShieldAlert, Sparkles, Send, Coins, FileCheck } from 'lucide-react';
import { MOCK_PATIENT, MOCK_FHIR_RECORD, MOCK_HOSPITALS } from '../data/mockData';

export default function HospitalPortal({
  doctorAccessGranted,
  claimSettled,
  setClaimSettled,
  hospitalBalance,
  setHospitalBalance,
  addAuditLog,
  setActiveRole
}) {
  const [claimAmount, setClaimAmount] = useState('1.5');
  const [isProving, setIsProving] = useState(false);
  const [proverStep, setProverStep] = useState(0);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nullifier, setNullifier] = useState(null);

  // Stepped ZK Prover Simulation
  const handleGenerateProof = () => {
    setIsProving(true);
    setProverStep(1);

    setTimeout(() => {
      setProverStep(2);
      setTimeout(() => {
        setProverStep(3);
        setTimeout(() => {
          setProverStep(4);
          setTimeout(() => {
            const generatedNullifier = "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
            setNullifier(generatedNullifier);
            setProofGenerated(true);
            setIsProving(false);
            setProverStep(5);
            addAuditLog({
              type: 'PROOF_GENERATED',
              title: 'Groth16 Zero-Knowledge Proof Generated',
              detail: `Nullifier: ${generatedNullifier.slice(0, 16)}... | Diagnosis & Procedure 100% hidden`,
              time: new Date().toLocaleTimeString(),
            });
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  // Submit Claim to InsuranceSettlement.sol
  const handleSubmitClaim = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setClaimSettled(true);
      const newBal = (parseFloat(hospitalBalance) + parseFloat(claimAmount)).toFixed(2) + " ETH";
      setHospitalBalance(newBal);

      addAuditLog({
        type: 'CLAIM_SETTLED',
        title: 'Claim Verified & Settled Automatically on Blockchain',
        detail: `Transferred ${claimAmount} ETH to St. Jude Medical Treasury | Nullifier spent`,
        time: new Date().toLocaleTimeString(),
      });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-slate-900 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>Provider Claim Engine</span>
            </div>
            <h2 className="text-2xl font-bold text-white">St. Jude Medical Center</h2>
            <p className="text-sm text-slate-400 mt-1">
              Prove insurance policy eligibility and claim validity to the insurer without disclosing patient medical records.
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="text-right">
              <div className="text-xs text-slate-400">Hospital Treasury Balance</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">{hospitalBalance}</div>
            </div>
          </div>
        </div>
      </div>

      {!doctorAccessGranted ? (
        /* Permission Locked State */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Patient Access Permission Required</h3>
          <p className="text-sm text-slate-400 mb-6">
            Under sovereign health rules, you cannot view patient records or submit claims until the patient authorizes your hospital in their Patient Portal.
          </p>
          <button
            onClick={() => setActiveRole('patient')}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
          >
            <span>Switch to Patient Portal to Grant Access</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Authorized Prover Workflow */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Claim Parameters */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Patient Record & Claim Inputs</h3>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Patient</span>
                  <span className="font-semibold text-white">{MOCK_PATIENT.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Policy ID</span>
                  <span className="font-mono text-indigo-400">{MOCK_PATIENT.policyId}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Max Coverage</span>
                  <span className="font-semibold text-emerald-400">{MOCK_PATIENT.policyLimitEth} ETH</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Policy Expiration</span>
                  <span className="text-slate-300">{MOCK_PATIENT.policyExpiry} (Active)</span>
                </div>
              </div>

              {/* Private Clinical Details */}
              <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300 font-medium">Private Clinical Diagnosis:</span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono">Kept Secret</span>
                </div>
                <div className="text-sm font-semibold text-white">{MOCK_FHIR_RECORD.condition.display}</div>
                <div className="text-xs text-slate-400 font-mono">ICD-10: {MOCK_FHIR_RECORD.condition.code} | CPT: {MOCK_FHIR_RECORD.procedure.code}</div>
              </div>

              {/* Claim Amount Input */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Claim Amount to Request (ETH)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    max="5.0"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">ETH (~$1,500)</div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Must be $\le$ policy coverage limit (5.0 ETH).</p>
              </div>

              {/* Step 1 Button: Generate ZK Proof */}
              {!proofGenerated ? (
                <button
                  onClick={handleGenerateProof}
                  disabled={isProving}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25"
                >
                  <Cpu className="w-4 h-4" />
                  <span>{isProving ? "Synthesizing Groth16 Proof..." : "Generate Zero-Knowledge Proof"}</span>
                </button>
              ) : (
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Proof Generated & Witness Synthesized!</span>
                  </div>
                  <span className="font-mono text-emerald-400">Groth16</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive ZK Proof Pipeline */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-semibold text-white">Zero-Knowledge Circuit Verification (Circom)</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                  claim_verifier.circom
                </span>
              </div>

              {/* Stepper Display */}
              <div className="space-y-3 mt-4">
                {[
                  { step: 1, title: '1. Licensed Hospital Merkle Membership', desc: 'Validates hospital ID in approved licensed root using Poseidon hashing.' },
                  { step: 2, title: '2. Active Policy Expiry Constraint', desc: 'Proves currentTimestamp <= policyExpiryTimestamp (2030) without leaking dates.' },
                  { step: 3, title: '3. Coverage Cap Validation', desc: `Proves claimAmount (${claimAmount} ETH) <= maxPolicyCoverage (5.0 ETH).` },
                  { step: 4, title: '4. Anti-Replay Nullifier Generation', desc: 'Derives unique claimNullifier = Poseidon(policySecret, claimId).' },
                ].map((item) => {
                  const isDone = proverStep > item.step || proofGenerated;
                  const isCurrent = proverStep === item.step;
                  return (
                    <div
                      key={item.step}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-emerald-950/10 border-emerald-500/30'
                          : isCurrent
                          ? 'bg-indigo-950/30 border-indigo-500 animate-pulse'
                          : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isDone ? 'text-emerald-400' : isCurrent ? 'text-indigo-400' : 'text-slate-400'}`}>
                          {item.title}
                        </span>
                        {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Public Signals Preview */}
              {proofGenerated && (
                <div className="mt-4 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-400 space-y-1">
                  <div className="text-indigo-400 font-semibold mb-1">Public Signals Visible to Blockchain & Insurer:</div>
                  <div>• Claim Amount: {claimAmount} ETH</div>
                  <div>• Nullifier Hash: {nullifier?.slice(0, 24)}...</div>
                  <div>• Hospital Merkle Root: 0x162786...897185</div>
                  <div className="text-emerald-400">• Diagnosis Code: [REDACTED IN ZERO KNOWLEDGE]</div>
                </div>
              )}
            </div>

            {/* Step 2 Button: Submit Claim */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              {!claimSettled ? (
                <button
                  onClick={handleSubmitClaim}
                  disabled={!proofGenerated || isSubmitting}
                  className={`w-full flex items-center justify-center space-x-2 font-medium py-3 rounded-xl transition-all ${
                    proofGenerated
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Submitting to Blockchain..." : "Submit Claim to Smart Contract & Settle"}</span>
                </button>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-1">
                  <div className="flex items-center justify-center space-x-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Claim Settled & Payout Released!</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Hospital Treasury credited with +{claimAmount} ETH. Nullifier marked spent on-chain.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
