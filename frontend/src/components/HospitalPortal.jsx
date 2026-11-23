import React, { useState } from 'react';
import { Building2, Cpu, CheckCircle2, ArrowRight, ShieldAlert, Sparkles, Send, Coins, FileCheck, Lock, Activity } from 'lucide-react';
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
          }, 550);
        }, 550);
      }, 550);
    }, 550);
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
        title: 'Claim Verified & Settled on Sepolia Testnet',
        detail: `Transferred ${claimAmount} ETH to St. Jude Medical Treasury | Nullifier marked spent`,
        time: new Date().toLocaleTimeString(),
      });
    }, 900);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Forest & Brass Accents */}
      <div className="parda-surface p-6 border-l-4 border-l-brass-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-brass-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-brass-400" />
              <span>Provider Claim Engine • Circom Prover Node</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-ivory-200 tracking-tight">
              St. Jude Medical Center Enclave
            </h2>
            <p className="text-xs sm:text-sm text-sage-muted max-w-2xl font-sans">
              Compile local clinical electronic records into a succinct zero-knowledge attestation. Only cryptographic proof scalars are transmitted across the boundary to the blockchain.
            </p>
          </div>
          
          <div className="flex items-center space-x-3 bg-forest-900/90 border border-sage-500/20 rounded p-3.5 font-mono text-xs shrink-0">
            <div className="text-right">
              <div className="text-sage-muted text-[10px] uppercase">Hospital Treasury</div>
              <div className="text-sm font-bold text-brass-400 font-mono">{hospitalBalance}</div>
            </div>
          </div>
        </div>
      </div>

      {!doctorAccessGranted ? (
        /* Permission Locked State */
        <div className="parda-surface p-12 text-center max-w-2xl mx-auto border border-sage-500/25">
          <div className="w-14 h-14 rounded bg-forest-850 border border-brass-500/40 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7 text-brass-400" />
          </div>
          <h3 className="text-xl font-serif font-normal text-ivory-200 mb-2">Patient Access Authorization Required</h3>
          <p className="text-xs sm:text-sm text-sage-muted mb-6 leading-relaxed max-w-md mx-auto font-sans">
            Under sovereign zero-knowledge healthcare rules, hospital enclaves cannot ingest patient records until the patient issues an on-chain grant in their Patient Vault.
          </p>
          <button
            onClick={() => setActiveRole('patient')}
            className="btn-brass inline-flex items-center space-x-2 font-mono text-xs font-semibold px-5 py-2.5 rounded cursor-pointer"
          >
            <span>Switch to Patient Vault to Grant Access</span>
            <ArrowRight className="w-4 h-4 text-brass-400" />
          </button>
        </div>
      ) : (
        /* Authorized Prover Workflow */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Claim Parameters & Private Inputs */}
          <div className="lg:col-span-5 parda-surface p-6 space-y-5">
            <div className="flex items-center space-x-2.5 border-b border-sage-500/20 pb-4">
              <div className="w-8 h-8 rounded bg-forest-800 border border-sage-500/25 flex items-center justify-center text-brass-400">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-serif font-normal text-ivory-200">Witness Formulation</h3>
                <div className="text-[11px] font-mono text-sage-muted">02.01 // LOCAL PRIVATE WITNESS INGESTION</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-forest-850 border border-sage-500/20 rounded p-4 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-sage-muted">
                  <span>PATIENT:</span>
                  <span className="font-semibold text-ivory-200">{MOCK_PATIENT.name}</span>
                </div>
                <div className="flex items-center justify-between text-sage-muted">
                  <span>POLICY ID:</span>
                  <span className="text-brass-400 font-bold">{MOCK_PATIENT.policyId}</span>
                </div>
                <div className="flex items-center justify-between text-sage-muted">
                  <span>MAX COVERAGE:</span>
                  <span className="font-bold text-ivory-200">{MOCK_PATIENT.policyLimitEth} ETH</span>
                </div>
                <div className="flex items-center justify-between text-sage-muted">
                  <span>POLICY EXPIRY:</span>
                  <span className="text-sage-300">{MOCK_PATIENT.policyExpiry} (Active)</span>
                </div>
              </div>

              {/* Private Clinical Details Card with Protected Tag */}
              <div className="bg-forest-850 border border-sage-500/25 rounded p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sage-300 font-medium font-sans">Private Clinical Condition:</span>
                  <span className="px-2 py-0.5 rounded bg-forest-900 text-brass-400 text-[10px] font-mono border border-brass-500/30">
                    Protected in Enclave
                  </span>
                </div>
                <div className="text-sm font-semibold text-ivory-200 font-sans">{MOCK_FHIR_RECORD.condition.display}</div>
                <div className="text-xs text-sage-muted font-mono">
                  ICD-10: <span className="text-brass-400">{MOCK_FHIR_RECORD.condition.code}</span> | CPT: {MOCK_FHIR_RECORD.procedure.code}
                </div>
              </div>

              {/* Claim Amount Input */}
              <div>
                <label className="block text-xs font-mono text-sage-muted mb-1.5">CLAIM AMOUNT TO REQUEST (ETH)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    max="5.0"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    className="w-full bg-forest-900 border border-sage-500/30 rounded px-4 py-2.5 text-ivory-200 font-mono text-sm focus:outline-none focus:border-brass-500"
                  />
                  <div className="absolute right-3.5 top-2.5 text-xs text-brass-400 font-mono font-bold">ETH</div>
                </div>
                <p className="text-[11px] font-mono text-sage-muted mt-1">Must be &le; policy coverage limit (5.0 ETH).</p>
              </div>

              {/* Action Button: Generate ZK Proof */}
              {!proofGenerated ? (
                <button
                  onClick={handleGenerateProof}
                  disabled={isProving}
                  className="btn-brass w-full flex items-center justify-center space-x-2 font-mono text-xs font-medium py-3 rounded cursor-pointer"
                >
                  <Cpu className="w-4 h-4 text-brass-400" />
                  <span>{isProving ? "Synthesizing Groth16 Circuit Proof..." : "Generate Zero-Knowledge Proof"}</span>
                </button>
              ) : (
                <div className="bg-forest-850 border border-brass-500/40 rounded p-3.5 flex items-center justify-between text-xs text-ivory-200 font-mono">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brass-400" />
                    <span>Proof Generated & Witness Synthesized!</span>
                  </div>
                  <span className="font-bold text-brass-400">Groth16 Valid</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: 5-Stage Zero-Knowledge Eligibility Sequence */}
          <div className="lg:col-span-7 parda-surface p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-sage-500/20 pb-4 mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded bg-forest-800 border border-sage-500/25 flex items-center justify-center text-brass-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-normal text-ivory-200">Circom Constraint Solver</h3>
                    <div className="text-[11px] font-mono text-sage-muted">02.02 // claim_verifier.circom</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-forest-900 border border-sage-500/30 text-sage-300">
                  5 POLYNOMIAL CONSTRAINTS
                </span>
              </div>

              {/* Stepper Display */}
              <div className="space-y-2.5 mt-4 font-mono text-xs">
                {[
                  { step: 1, title: '1. Licensed Hospital Merkle Membership', desc: 'Validates hospital ID in approved licensed root using Poseidon hashing.' },
                  { step: 2, title: '2. Active Policy Expiry Constraint', desc: 'Proves currentTimestamp <= policyExpiryTimestamp (2030) without leaking dates.' },
                  { step: 3, title: '3. Coverage Cap Validation', desc: `Proves claimAmount (${claimAmount} ETH) <= maxPolicyCoverage (5.0 ETH).` },
                  { step: 4, title: '4. Anti-Replay Nullifier Generation', desc: 'Derives unique claimNullifier = Poseidon(policySecret, claimId).' },
                  { step: 5, title: '5. Smart Contract Nullifier Attestation', desc: 'Asserts nullifier unspent on-chain to block duplicate claim fraud.' }
                ].map((item) => {
                  const isDone = proverStep >= item.step || proofGenerated;
                  const isCurrent = proverStep === item.step && !proofGenerated;
                  return (
                    <div
                      key={item.step}
                      className={`p-3 rounded border transition-all ${
                        isDone
                          ? 'bg-forest-850 border-sage-500/30'
                          : isCurrent
                          ? 'bg-forest-800 border-brass-500'
                          : 'bg-forest-900/60 border-sage-500/10 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isDone ? 'text-ivory-200' : isCurrent ? 'text-brass-400' : 'text-sage-muted'}`}>
                          {item.title}
                        </span>
                        {isDone ? (
                          <span className="text-[10px] font-bold text-brass-400 bg-forest-900 px-2 py-0.5 rounded border border-brass-500/30">✓ PASSED</span>
                        ) : (
                          <span className="text-[10px] text-sage-600">Not yet checked</span>
                        )}
                      </div>
                      <p className="text-[11px] text-sage-muted mt-1 font-sans">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Public Signals Preview */}
              {proofGenerated && (
                <div className="mt-4 bg-forest-900 border border-sage-500/20 rounded p-3.5 font-mono text-[11px] text-sage-muted space-y-1.5">
                  <div className="text-brass-400 font-bold mb-1">Public Signals Transmitted Across Boundary to Blockchain:</div>
                  <div>• Claim Amount: {claimAmount} ETH</div>
                  <div>• Nullifier Hash: {nullifier?.slice(0, 24)}... (Unique Anti-Replay)</div>
                  <div>• Merkle Root: 0x162786...897185</div>
                  <div className="text-ivory-200 font-bold">• Diagnosis ICD-10: [100% REDACTED IN ZERO KNOWLEDGE]</div>
                </div>
              )}
            </div>

            {/* Step 2 Button: Submit Claim On-Chain */}
            <div className="pt-4 border-t border-sage-500/20">
              {!claimSettled ? (
                <button
                  onClick={handleSubmitClaim}
                  disabled={!proofGenerated || isSubmitting}
                  className={`w-full flex items-center justify-center space-x-2 font-mono text-xs font-semibold py-3 rounded transition-all ${
                    proofGenerated
                      ? 'btn-brass cursor-pointer'
                      : 'bg-forest-900 text-sage-600 cursor-not-allowed border border-sage-500/20'
                  }`}
                >
                  <Send className="w-4 h-4 text-brass-400" />
                  <span>{isSubmitting ? "Broadcasting to Sepolia Smart Contract..." : "Submit Claim to Smart Contract & Settle Payout"}</span>
                </button>
              ) : (
                <div className="bg-forest-850 border border-brass-500/40 rounded p-4 text-center space-y-1 font-mono">
                  <div className="flex items-center justify-center space-x-2 text-ivory-200 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-brass-400" />
                    <span>Claim Settled & Liquidity Transferred!</span>
                  </div>
                  <p className="text-xs text-sage-muted">
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
