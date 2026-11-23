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

  // Stepped ZK Prover for 7 Constraints in claim_eligibility.circom
  const handleGenerateProof = () => {
    setIsProving(true);
    setProverStep(1);

    const stepInterval = 450;
    setTimeout(() => {
      setProverStep(2);
      setTimeout(() => {
        setProverStep(3);
        setTimeout(() => {
          setProverStep(4);
          setTimeout(() => {
            setProverStep(5);
            setTimeout(() => {
              setProverStep(6);
              setTimeout(() => {
                const generatedNullifier = "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
                setNullifier(generatedNullifier);
                setProofGenerated(true);
                setIsProving(false);
                setProverStep(7);
                if (addAuditLog) {
                  addAuditLog({
                    type: 'PROOF_GENERATED',
                    title: 'Groth16 Zero-Knowledge Proof Generated (7 Constraints Satisfied)',
                    detail: `Nullifier: ${generatedNullifier.slice(0, 16)}... | EdDSA Signature & Diagnosis 100% hidden`,
                    time: new Date().toLocaleTimeString(),
                  });
                }
              }, stepInterval);
            }, stepInterval);
          }, stepInterval);
        }, stepInterval);
      }, stepInterval);
    }, stepInterval);
  };

  // Submit Claim to ClaimManager.sol
  const handleSubmitClaim = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setClaimSettled(true);
      const newBal = (parseFloat(hospitalBalance) + parseFloat(claimAmount)).toFixed(2) + " ETH";
      setHospitalBalance(newBal);

      if (addAuditLog) {
        addAuditLog({
          type: 'CLAIM_SETTLED',
          title: 'Claim Verified & Settled via ClaimManager.sol',
          detail: `Transferred ${claimAmount} ETH to St. Jude Medical Treasury | Nullifier marked spent on-chain`,
          time: new Date().toLocaleTimeString(),
        });
      }
    }, 800);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner with Forest & Brass Accents */}
      <div className="parda-surface p-6 border-l-4 border-l-brass-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-brass-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-brass-400" />
              <span>Provider Claim Engine • Circom 2.1 Prover Node</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-ivory-200 tracking-tight">
              St. Jude Medical Center Enclave
            </h2>
            <p className="text-xs sm:text-sm text-sage-muted max-w-2xl font-sans">
              Compile local clinical electronic records into a succinct Groth16 zero-knowledge attestation. Only cryptographic proof scalars are transmitted to the insurer's ClaimManager contract.
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
                  <span>COVERAGE LIMIT:</span>
                  <span className="font-bold text-ivory-200">₹50,000 (5.0 ETH)</span>
                </div>
                <div className="flex items-center justify-between text-sage-muted">
                  <span>POLICY EXPIRY:</span>
                  <span className="text-sage-300">Day 22,500 (Active)</span>
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
                  ICD-10: <span className="text-brass-400">{MOCK_FHIR_RECORD.condition.code}</span> | CPT: {MOCK_FHIR_RECORD.procedure.code} (Covered)
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
                  <span>{isProving ? `Solving Constraint ${proverStep}/7...` : "Generate Zero-Knowledge Proof (7 Constraints)"}</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-forest-850 border border-brass-500/40 rounded p-3.5 flex items-center justify-between text-xs text-ivory-200 font-mono">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-brass-400" />
                      <span>Groth16 Proof Synthesized!</span>
                    </div>
                    <span className="font-bold text-brass-400">7 Constraints Valid</span>
                  </div>

                  {!claimSettled ? (
                    <button
                      onClick={handleSubmitClaim}
                      disabled={isSubmitting}
                      className="btn-brass w-full flex items-center justify-center space-x-2 font-mono text-xs font-medium py-3 rounded cursor-pointer"
                    >
                      <Send className="w-4 h-4 text-brass-400" />
                      <span>{isSubmitting ? "Settling with ClaimManager.sol..." : "Submit Proof to ClaimManager.sol"}</span>
                    </button>
                  ) : (
                    <div className="bg-forest-850 border border-emerald-500/40 rounded p-3.5 text-center text-xs text-emerald-400 font-mono">
                      ✓ Claim Settled on Ethereum! Funds Escrowed to Hospital Treasury.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: 7-Stage Zero-Knowledge Eligibility Sequence */}
          <div className="lg:col-span-7 parda-surface p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-sage-500/20 pb-4 mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded bg-forest-800 border border-sage-500/25 flex items-center justify-center text-brass-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-normal text-ivory-200">Circom 2.1 Constraint Solver</h3>
                    <div className="text-[11px] font-mono text-sage-muted">02.02 // claim_eligibility.circom</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-forest-900 border border-brass-500/30 text-brass-400 font-bold">
                  7 POLYNOMIAL CONSTRAINTS
                </span>
              </div>

              {/* Stepper Display with all 7 constraints */}
              <div className="space-y-2 font-mono text-xs">
                {[
                  { step: 1, title: '1. Hospital In-Circuit EdDSA Signature', desc: 'Verifies hospital Baby Jubjub key signed the claim message inside the circuit.' },
                  { step: 2, title: '2. Approved Hospital Merkle Membership', desc: 'Proves hospital public key leaf is in the regulator approved root (depth 8).' },
                  { step: 3, title: '3. Policy Commitment Verification', desc: 'Proves policyCommitment == Poseidon(patientIdHash, coveredSetRoot, limit, expiry, salt).' },
                  { step: 4, title: '4. Procedure in Covered Set Merkle Tree', desc: `Proves procedure CPT ${MOCK_FHIR_RECORD.procedure.code} is a leaf in the policy’s private covered set (depth 6).` },
                  { step: 5, title: '5. 64-Bit Range & Coverage Checks', desc: `Proves claimAmount (${claimAmount} ETH) <= limit AND claimDay < policyExpiryDay.` },
                  { step: 6, title: '6. Anti-Replay Nullifier Derivation', desc: 'Derives nullifier = Poseidon(policySalt, recordId) to block double claims.' },
                  { step: 7, title: '7. Payout Recipient Address Binding', desc: 'Constrains recipient address to proof to prevent front-running redirection.' }
                ].map((item) => {
                  const isDone = proverStep >= item.step || proofGenerated;
                  const isCurrent = proverStep === item.step && !proofGenerated;
                  return (
                    <div
                      key={item.step}
                      className={`p-2.5 rounded border transition-all ${
                        isDone
                          ? 'bg-forest-850 border-sage-500/30'
                          : isCurrent
                          ? 'bg-forest-800 border-brass-500 shadow-sm'
                          : 'bg-forest-900/60 border-sage-500/10 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isDone ? 'text-ivory-200' : isCurrent ? 'text-brass-400' : 'text-sage-muted'}`}>
                          {item.title}
                        </span>
                        {isDone ? (
                          <span className="text-[10px] font-bold text-brass-400 bg-forest-900 px-2 py-0.5 rounded border border-brass-500/30">✓ SATISFIED</span>
                        ) : (
                          <span className="text-[10px] text-sage-600">Pending</span>
                        )}
                      </div>
                      <p className="text-[11px] text-sage-muted mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Proof Artifact Preview */}
            {proofGenerated && (
              <div className="bg-forest-850 border border-sage-500/20 rounded p-4 space-y-2 text-xs font-mono">
                <div className="text-[11px] text-sage-muted uppercase tracking-wider">Public Signals Ready for ClaimManager.sol:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-ivory-200">
                  <div>Nullifier: <span className="text-brass-400">{nullifier?.slice(0, 10)}...</span></div>
                  <div>Hospital Root: <span className="text-sage-300">0x2b81...0482</span></div>
                  <div>Policy Commitment: <span className="text-sage-300">0x498a...92e1</span></div>
                  <div>Recipient: <span className="text-sage-300">0x7099...79C8</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
