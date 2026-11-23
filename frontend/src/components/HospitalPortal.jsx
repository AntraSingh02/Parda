import React, { useState } from 'react';
import { 
  Building2, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles, 
  Send, 
  Coins, 
  FileCheck, 
  Lock, 
  Activity, 
  AlertTriangle, 
  HeartPulse, 
  X,
  RotateCcw,
  ShieldCheck,
  Server
} from 'lucide-react';
import { MOCK_PATIENT, MOCK_FHIR_RECORD, MOCK_HOSPITALS } from '../data/mockData';

export default function HospitalPortal({
  doctorAccessGranted,
  claimSettled,
  hospitalBalanceEth = 14.20,
  onSettleClaim,
  isBreakGlassActive,
  breakGlassReason,
  onTriggerBreakGlass,
  onRevokeBreakGlass,
  addAuditLog,
  setActiveRole
}) {
  const [claimAmount, setClaimAmount] = useState('1.5');
  const [isProving, setIsProving] = useState(false);
  const [proverStep, setProverStep] = useState(0);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [nullifier, setNullifier] = useState(null);
  const [showConstraintDetails, setShowConstraintDetails] = useState(false);

  // Emergency Trauma Break-Glass Modal State
  const [showBreakGlassModal, setShowBreakGlassModal] = useState(false);
  const [localBreakGlassReason, setLocalBreakGlassReason] = useState(
    "Patient unconscious after severe acute trauma - emergency allergy and blood type check"
  );
  const [breakGlassCertified, setBreakGlassCertified] = useState(false);

  // Dual Currency calculations & input bounds (1 ETH = ₹10,000 INR)
  const INR_PER_ETH = 10000;
  const numClaim = parseFloat(claimAmount) || 0;
  const claimInr = Math.round(numClaim * INR_PER_ETH);
  const isOverPolicyLimit = numClaim > 5.0;

  // Access is granted either via sovereign patient delegation OR emergency clinical break-glass
  const hasAccess = doctorAccessGranted || isBreakGlassActive;

  // Trigger Emergency Break-Glass after 2-step verification
  const handleConfirmBreakGlass = () => {
    if (!breakGlassCertified || !localBreakGlassReason.trim()) return;
    if (onTriggerBreakGlass) {
      onTriggerBreakGlass(localBreakGlassReason);
    }
    setShowBreakGlassModal(false);
  };

  // Stepped ZK Prover for 7 Constraints in claim_eligibility.circom
  const handleGenerateProof = () => {
    setIsProving(true);
    setProverStep(1);

    const stepInterval = 380;
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
                const generatedNullifier = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
                setNullifier(generatedNullifier);
                setProofGenerated(true);
                setIsProving(false);
                setProverStep(7);
                if (addAuditLog) {
                  addAuditLog({
                    type: 'PROOF_GENERATED',
                    title: 'Groth16 Zero-Knowledge Proof Generated (7 Constraints Satisfied)',
                    detail: `Nullifier: ${generatedNullifier.slice(0, 16)}... | EdDSA Signature & Diagnosis 100% hidden in witness`,
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
      setClaimSubmitted(true);

      const numClaimAmount = parseFloat(claimAmount) || 1.5;
      const spentNullifier = nullifier || ("0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));

      if (onSettleClaim) {
        onSettleClaim({
          amountEth: numClaimAmount,
          nullifier: spentNullifier,
          hospitalName: 'St. Jude Medical Center',
          payee: '0x7099...79C8 (St. Jude)'
        });
      }

      if (addAuditLog) {
        addAuditLog({
          type: 'CLAIM_SETTLED',
          title: 'Claim Verified & Settled via ClaimManager.sol',
          detail: `Transferred ${numClaimAmount} ETH (₹${(numClaimAmount * INR_PER_ETH).toLocaleString('en-IN')}) to St. Jude Medical Treasury | Nullifier ${spentNullifier.slice(0, 16)}... marked spent on-chain`,
          time: new Date().toLocaleTimeString(),
        });
      }
    }, 750);
  };

  // Reset Claim Form to allow multiple sequential claims
  const handleResetClaimForm = () => {
    setProofGenerated(false);
    setIsProving(false);
    setProverStep(0);
    setNullifier(null);
    setClaimSubmitted(false);
    setClaimAmount('1.5');
  };

  return (
    <div className="space-y-6 font-sans">

      {/* 2-Step Confirmation Modal for Emergency Break-Glass */}
      {showBreakGlassModal && (
        <div className="fixed inset-0 z-50 bg-forest-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-forest-900 border-2 border-amber-600/60 rounded-lg max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-sage-500/20 pb-4">
              <div className="flex items-center space-x-3 text-amber-500">
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-serif text-ivory-200">Emergency Trauma Break-Glass Protocol</h3>
                  <div className="text-[11px] font-mono text-sage-muted">AccessLog.sol • Sovereign Emergency Override</div>
                </div>
              </div>
              <button
                onClick={() => setShowBreakGlassModal(false)}
                className="text-sage-muted hover:text-ivory-200 p-1 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded bg-amber-500/10 border border-amber-500/25 text-xs text-sage-200 space-y-1.5 leading-relaxed font-sans">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>On-Chain Regulatory Audit Warning</span>
              </div>
              <p>
                You are activating an emergency medical override on an incapacitated patient. This action bypasses patient-held key delegation under medical necessity. An immutable cryptographic digest of this incident, your hospital provider key, and your stated medical justification will be permanently recorded on Ethereum (<code>AccessLog.sol</code>) for retrospective regulator inspection.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-sage-muted mb-1 font-sans">Clinical Justification (Reason for Emergency Override):</label>
                <textarea
                  rows={3}
                  value={localBreakGlassReason}
                  onChange={(e) => setLocalBreakGlassReason(e.target.value)}
                  placeholder="Detail acute clinical diagnosis, patient consciousness, or trauma resuscitation reason..."
                  className="w-full bg-forest-950 border border-sage-500/30 rounded p-3 text-ivory-200 font-sans text-xs focus:outline-none focus:border-brass-500"
                />
              </div>

              <label className="flex items-start space-x-2.5 text-[11px] text-sage-300 cursor-pointer select-none font-sans bg-forest-850 p-3 rounded border border-sage-500/15">
                <input
                  type="checkbox"
                  checked={breakGlassCertified}
                  onChange={(e) => setBreakGlassCertified(e.target.checked)}
                  className="mt-0.5 rounded border-sage-500 text-brass-500 focus:ring-0"
                />
                <span>
                  I certify under penalty of medical license revocation that this access is medically essential for immediate trauma resuscitation or acute care.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBreakGlassModal(false)}
                className="px-4 py-2 rounded bg-forest-800 hover:bg-forest-750 text-sage-muted hover:text-ivory-200 text-xs font-mono transition-colors cursor-pointer"
              >
                Cancel & Return
              </button>
              <button
                type="button"
                onClick={handleConfirmBreakGlass}
                disabled={!breakGlassCertified || !localBreakGlassReason.trim()}
                className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all flex items-center space-x-2 ${
                  breakGlassCertified && localBreakGlassReason.trim()
                    ? 'bg-amber-600 hover:bg-amber-500 text-forest-950 cursor-pointer shadow-lg shadow-amber-600/20'
                    : 'bg-forest-800 text-sage-600 cursor-not-allowed border border-sage-500/20'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Confirm Override & Log to AccessLog.sol</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Top Banner with Dual Currency Hospital Treasury */}
      <div className="parda-surface p-6 border border-brass-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-brass-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-brass-400" />
              <span>Hospital Clinical Enclave • Cryptographic Claim Engine</span>
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
              <div className="text-sm font-bold text-brass-400 font-mono">
                {hospitalBalanceEth.toFixed(2)} ETH <span className="text-[11px] text-sage-muted font-normal">(₹{(hospitalBalanceEth * INR_PER_ETH).toLocaleString('en-IN')})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!hasAccess ? (
        /* Permission Locked State with Emergency Break-Glass Option */
        <div className="parda-surface p-10 max-w-3xl mx-auto border border-sage-500/25 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded bg-forest-850 border border-brass-500/40 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7 text-brass-400" />
            </div>
            <h3 className="text-xl font-serif font-normal text-ivory-200">Patient Access Authorization Required</h3>
            <p className="text-xs sm:text-sm text-sage-muted leading-relaxed max-w-lg mx-auto font-sans">
              Under sovereign zero-knowledge healthcare rules, hospital enclaves cannot ingest patient records until the patient issues a client-side delegation in their Patient Vault.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Standard Delegation Pathway */}
            <div className="p-4 rounded bg-forest-850 border border-sage-500/20 flex flex-col justify-between space-y-3">
              <div>
                <div className="text-xs font-semibold text-ivory-200 flex items-center gap-1.5 mb-1 font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brass-400" />
                  <span>Standard Patient Consent</span>
                </div>
                <p className="text-[11px] text-sage-muted leading-relaxed font-sans">
                  Patient uses their client-side WebCrypto keypair to wrap a session key for St. Jude Medical Center.
                </p>
              </div>
              <button
                onClick={() => setActiveRole('patient')}
                className="btn-brass w-full inline-flex items-center justify-center space-x-2 font-mono text-xs font-semibold py-2 rounded cursor-pointer"
              >
                <span>Switch to Patient Vault</span>
                <ArrowRight className="w-3.5 h-3.5 text-brass-400" />
              </button>
            </div>

            {/* Emergency Trauma Break-Glass Pathway */}
            <div className="p-4 rounded bg-forest-850 border border-amber-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-1 font-sans">
                  <HeartPulse className="w-3.5 h-3.5 text-amber-400" />
                  <span>Emergency Trauma Override</span>
                </div>
                <p className="text-[11px] text-sage-muted leading-relaxed font-sans">
                  Incapacitated, comatose, or acute trauma patient? ER physicians can initiate an emergency clinical override (permanently logged to AccessLog.sol).
                </p>
              </div>
              <button
                onClick={() => setShowBreakGlassModal(true)}
                className="w-full inline-flex items-center justify-center space-x-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-300 font-mono text-xs font-semibold py-2 rounded transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Invoke Emergency Break-Glass</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Authorized Prover Workflow */
        <div className="space-y-6">

          {/* Emergency Break-Glass Active Status Banner */}
          {isBreakGlassActive && (
            <div className="p-4 rounded bg-amber-950/30 border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <HeartPulse className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-amber-300 font-sans flex items-center gap-2">
                    <span>EMERGENCY BREAK-GLASS OVERRIDE ACTIVE</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest-900 border border-amber-500/30 text-amber-400">
                      24h Temporary Window
                    </span>
                  </div>
                  <div className="text-sage-muted text-[11px] font-sans">
                    Reason: "{breakGlassReason || localBreakGlassReason}" • Permanently anchored to AccessLog.sol for regulatory audit.
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] shrink-0">
                <span className="text-emerald-400 bg-forest-900 px-2.5 py-1 rounded border border-emerald-500/30">
                  Blood: O+ | Allergy Alert: Penicillin
                </span>
                {onRevokeBreakGlass && (
                  <button
                    onClick={onRevokeBreakGlass}
                    className="px-2.5 py-1 rounded bg-forest-900 hover:bg-forest-850 border border-sage-500/30 text-sage-300 hover:text-ivory-200 transition-colors cursor-pointer text-[11px]"
                  >
                    Revoke Window
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tightly Balanced 2-Column Grid (Eliminating Dead Gaps) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* Left Column: Claim Parameters & Private Inputs */}
            <div className="parda-surface p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-sage-500/20 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded bg-forest-800 border border-sage-500/25 flex items-center justify-center text-brass-400">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-normal text-ivory-200">Clinical Claim Package</h3>
                    <div className="text-[11px] font-mono text-sage-muted">02.01 // CLINICAL ENCLAVE ATTESTATION</div>
                  </div>
                </div>

                {!isBreakGlassActive && (
                  <button
                    onClick={() => setShowBreakGlassModal(true)}
                    title="Open emergency trauma protocol"
                    className="text-[10px] font-mono px-2 py-1 rounded bg-forest-900 border border-amber-500/40 text-amber-400 hover:bg-forest-850 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <HeartPulse className="w-3 h-3 text-amber-400" />
                    <span>ER Break-Glass</span>
                  </button>
                )}
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

                {/* Claim Amount Input with Dual-Currency & Bound Check */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 font-mono text-xs">
                    <label className="text-sage-muted">CLAIM AMOUNT TO REQUEST</label>
                    <span className="text-brass-400 font-semibold text-[11px]">
                      ≈ ₹{claimInr.toLocaleString('en-IN')} INR (@ ₹{INR_PER_ETH.toLocaleString('en-IN')}/ETH)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="5.0"
                      disabled={proofGenerated}
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                      className={`w-full bg-forest-900 border rounded px-4 py-2.5 text-ivory-200 font-mono text-sm focus:outline-none ${
                        isOverPolicyLimit
                          ? 'border-rose-500/70 focus:border-rose-500 text-rose-300'
                          : proofGenerated
                          ? 'border-sage-500/20 opacity-70 cursor-not-allowed'
                          : 'border-sage-500/30 focus:border-brass-500'
                      }`}
                    />
                    <div className="absolute right-3.5 top-2.5 text-xs text-brass-400 font-mono font-bold">ETH</div>
                  </div>
                  {isOverPolicyLimit ? (
                    <p className="text-[11px] font-mono text-rose-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>Exceeds policy limit (5.0 ETH / ₹50,000). Prover circuit will reject this claim!</span>
                    </p>
                  ) : (
                    <p className="text-[11px] font-mono text-sage-muted mt-1">Must be &le; policy coverage limit (5.0 ETH / ₹50,000).</p>
                  )}
                </div>
              </div>

              {/* Action Button: Generate ZK Proof or Settle */}
              {!proofGenerated ? (
                <button
                  onClick={handleGenerateProof}
                  disabled={isProving || isOverPolicyLimit}
                  className={`btn-brass w-full flex items-center justify-center space-x-2 font-mono text-xs font-medium py-3 rounded cursor-pointer ${
                    isOverPolicyLimit ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
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

                  {!claimSubmitted ? (
                    <button
                      onClick={handleSubmitClaim}
                      disabled={isSubmitting}
                      className="btn-brass w-full flex items-center justify-center space-x-2 font-mono text-xs font-medium py-3 rounded cursor-pointer"
                    >
                      <Send className="w-4 h-4 text-brass-400" />
                      <span>{isSubmitting ? "Settling with ClaimManager.sol..." : `Submit ${claimAmount} ETH Claim to ClaimManager.sol`}</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-emerald-950/40 border border-emerald-500/40 rounded p-3.5 text-center text-xs text-emerald-400 font-mono space-y-1">
                        <div className="font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Claim Settled on Ethereum!</span>
                        </div>
                        <div className="text-[11px] text-sage-300">
                          {claimAmount} ETH (₹{claimInr.toLocaleString('en-IN')}) escrowed to St. Jude Treasury.
                        </div>
                      </div>

                      {/* Reset Button for Multiple Sequential Claims */}
                      <button
                        onClick={handleResetClaimForm}
                        className="w-full flex items-center justify-center space-x-2 bg-forest-850 hover:bg-forest-800 border border-brass-500/40 text-brass-300 hover:text-ivory-200 font-mono text-xs font-medium py-2.5 rounded transition-all cursor-pointer shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-brass-400" />
                        <span>Submit Another Shielded Claim</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: 7-Stage Zero-Knowledge Eligibility Sequence */}
            <div className="parda-surface p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-sage-500/20 pb-4">
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

              {/* Stepper Display with Progressive Disclosure */}
              {!isProving && !proofGenerated && !showConstraintDetails ? (
                <div className="space-y-3 font-sans text-xs">
                  <div className="p-4 rounded bg-forest-850 border border-sage-500/20 space-y-2.5">
                    <div className="font-semibold text-ivory-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-brass-400">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Pre-Proof Constraint Summary</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest-900 border border-sage-500/20 text-sage-300">
                        Zero Clinical Leakage
                      </span>
                    </div>
                    <p className="text-sage-muted text-xs leading-relaxed">
                      Groth16 zk-SNARK cryptographically satisfies 7 verification predicates entirely inside the hospital enclave before calldata transmission to Ethereum.
                    </p>
                    <ul className="space-y-1.5 font-mono text-[11px] text-sage-300 pt-1">
                      <li className="flex items-center gap-2">
                        <span className="text-brass-400">✓</span> 2-of-3 Regulator Multi-Sig Hospital License (Depth 8)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-brass-400">✓</span> In-Circuit EdDSA Baby Jubjub Signature
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-brass-400">✓</span> Private Covered Procedure Merkle Membership (Depth 6)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-brass-400">✓</span> 64-Bit Policy Cap & Expiration Range Validation
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-brass-400">✓</span> Poseidon Nullifier & Payout Recipient Binding
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowConstraintDetails(true)}
                    className="text-xs font-mono text-brass-400 hover:text-brass-300 underline underline-offset-4 cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Inspect all 7 technical mathematical constraints</span>
                    <span>→</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 font-mono text-xs">
                  {!isProving && !proofGenerated && (
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-sage-muted">Technical Circuit Predicates:</span>
                      <button
                        type="button"
                        onClick={() => setShowConstraintDetails(false)}
                        className="text-[11px] text-brass-400 hover:underline cursor-pointer"
                      >
                        Collapse view
                      </button>
                    </div>
                  )}
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
              )}

              {/* Public Signals Calldata Preview */}
              {proofGenerated && (
                <div className="bg-forest-850 border border-sage-500/20 rounded p-4 space-y-2 text-xs font-mono">
                  <div className="text-[11px] text-sage-muted uppercase tracking-wider flex items-center justify-between">
                    <span>Public Signals Ready for ClaimManager.sol:</span>
                    <span className="text-brass-400 font-bold">6 Scalars</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-ivory-200 pt-1">
                    <div>Nullifier: <span className="text-brass-400">{nullifier?.slice(0, 10)}...</span></div>
                    <div>Hospital Root: <span className="text-sage-300">0x2b81...0482</span></div>
                    <div>Policy Commitment: <span className="text-sage-300">0x498a...92e1</span></div>
                    <div>Claim Amount: <span className="text-brass-400">{claimAmount} ETH (₹{claimInr.toLocaleString('en-IN')})</span></div>
                    <div>Claim Day: <span className="text-sage-300">Day 20,050</span></div>
                    <div>Recipient: <span className="text-sage-300">0x7099...79C8</span></div>
                  </div>
                </div>
              )}

              {/* Active Enclave ZK Telemetry Card (Fills vertical space elegantly) */}
              <div className="bg-forest-850/80 border border-sage-500/15 rounded p-3.5 space-y-1.5 text-xs font-mono text-sage-muted">
                <div className="flex items-center justify-between text-ivory-200 font-sans font-medium text-xs">
                  <span className="flex items-center gap-1.5 text-brass-400">
                    <Server className="w-3.5 h-3.5" />
                    <span>Enclave Proof Telemetry</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-forest-900 px-2 py-0.5 rounded border border-emerald-500/30">
                    Groth16 (BN254)
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Circuit Constraints:</span>
                  <span className="text-ivory-200">14,208 R1CS</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>On-Chain Gas:</span>
                  <span className="text-ivory-200">~214,000 gas (EVM Pairing)</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Enclave Shield:</span>
                  <span className="text-emerald-400">Zero Clinical Leakage</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}
