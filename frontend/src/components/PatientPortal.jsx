import React, { useState, useRef } from 'react';
import { HeartPulse, AlertTriangle, ShieldCheck, ExternalLink, Loader2 } from 'lucide-react';
import { MOCK_PATIENT, MOCK_FHIR_RECORD, MOCK_HOSPITALS } from '../data/mockData';
import { useWeb3 } from '../context/Web3Context';

export default function PatientPortal({
  isEncrypted,
  setIsEncrypted,
  ipfsCid,
  setIpfsCid,
  doctorAccessGranted,
  setDoctorAccessGranted,
  claimSettled,
  settledClaims = [],
  isBreakGlassActive,
  breakGlassReason,
  onRevokeBreakGlass,
  addAuditLog,
}) {
  const { isLiveMode, account, executeContractTx, connectWallet } = useWeb3();
  const [isTransacting, setIsTransacting] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(MOCK_HOSPITALS[0].id);
  const [duration, setDuration] = useState('1 hour'); // '1 hour' | '24 hours' | 'until I revoke'
  const [showSensitive, setShowSensitive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeGrants, setActiveGrants] = useState(() => {
    if (doctorAccessGranted) {
      return [{
        id: 1,
        hospitalName: 'St. Jude Medical Center',
        duration: '1 hour',
        grantedAt: 'Just now',
      }];
    }
    return [];
  });

  const sharingSectionRef = useRef(null);

  const scrollToSharing = () => {
    if (sharingSectionRef.current) {
      sharingSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      const selectEl = document.getElementById('hospital-select');
      if (selectEl) selectEl.focus();
    }
  };

  const handleGrant = async () => {
    const hospital = MOCK_HOSPITALS.find((h) => h.id === Number(selectedHospital)) || MOCK_HOSPITALS[0];
    const durationSec = duration === '1 hour' ? 3600 : duration === '24 hours' ? 86400 : 0;
    const recordCid = ipfsCid || 'bafybeic23ae33cd09cec6723c0b92cb16438072';

    if (isLiveMode) {
      if (!account) {
        setStatusMessage('Connecting MetaMask...');
        const userAcc = await connectWallet();
        if (!userAcc) {
          setStatusMessage('⚠️ Please connect MetaMask to broadcast on Sepolia.');
          return;
        }
      }

      try {
        setIsTransacting(true);
        setStatusMessage('Prompting MetaMask signature for grantAccess...');

        const result = await executeContractTx({
          contractName: 'AccessRegistry',
          methodName: 'grantAccess',
          args: [hospital.address, recordCid, durationSec],
          actionTitle: `Granting ${hospital.name} Access on Sepolia`,
        });

        const newGrant = {
          id: Date.now(),
          hospitalName: hospital.name,
          duration: duration,
          grantedAt: 'Confirmed on Sepolia',
          txHash: result.hash,
          explorerUrl: result.explorerUrl,
        };

        setActiveGrants((prev) => [newGrant, ...prev.filter((g) => g.hospitalName !== hospital.name)]);
        setDoctorAccessGranted(true);
        setIsEncrypted(true);
        setStatusMessage(`✅ Access granted on Sepolia: ${result.hash.slice(0, 10)}...`);

        if (addAuditLog) {
          addAuditLog({
            type: 'ACCESS_GRANTED',
            title: 'On-Chain Hospital Enclave Access Granted (Sepolia)',
            detail: `${hospital.name} granted access (${duration}) | Tx: ${result.hash.slice(0, 12)}...`,
            time: new Date().toLocaleTimeString(),
            explorerUrl: result.explorerUrl,
          });
        }
      } catch (err) {
        console.error('Grant error:', err);
        setStatusMessage(`❌ Tx Error: ${err.reason || err.message}`);
      } finally {
        setIsTransacting(false);
      }
    } else {
      const newGrant = {
        id: Date.now(),
        hospitalName: hospital.name,
        duration: duration,
        grantedAt: 'Just now',
      };

      setActiveGrants((prev) => [newGrant, ...prev.filter((g) => g.hospitalName !== hospital.name)]);
      setDoctorAccessGranted(true);
      setIsEncrypted(true);
      setStatusMessage(`Access granted to ${hospital.name} for ${duration}.`);

      if (addAuditLog) {
        addAuditLog({
          type: 'ACCESS_GRANTED',
          title: 'Hospital Enclave Access Granted',
          detail: `${hospital.name} granted access (${duration})`,
          time: new Date().toLocaleTimeString(),
        });
      }

      setTimeout(() => {
        setStatusMessage('');
      }, 4000);
    }
  };

  const handleRevoke = async (grantId) => {
    const target = activeGrants.find((g) => g.id === grantId);
    const hospital = MOCK_HOSPITALS.find((h) => h.name === target?.hospitalName) || MOCK_HOSPITALS[0];
    const recordCid = ipfsCid || 'bafybeic23ae33cd09cec6723c0b92cb16438072';

    if (isLiveMode && account) {
      try {
        setIsTransacting(true);
        setStatusMessage('Prompting MetaMask for revokeAccess...');

        const result = await executeContractTx({
          contractName: 'AccessRegistry',
          methodName: 'revokeAccess',
          args: [hospital.address, recordCid],
          actionTitle: `Revoking ${hospital.name} Access on Sepolia`,
        });

        setActiveGrants((prev) => prev.filter((g) => g.id !== grantId));
        if (activeGrants.length <= 1) {
          setDoctorAccessGranted(false);
        }
        setStatusMessage(`✅ Access revoked on Sepolia!`);

        if (addAuditLog) {
          addAuditLog({
            type: 'ACCESS_REVOKED',
            title: 'On-Chain Access Revoked (Sepolia)',
            detail: `Revoked permission for ${target ? target.hospitalName : 'hospital'} | Tx: ${result.hash.slice(0, 12)}...`,
            time: new Date().toLocaleTimeString(),
            explorerUrl: result.explorerUrl,
          });
        }
      } catch (err) {
        console.error('Revoke error:', err);
        setStatusMessage(`❌ Revocation failed: ${err.reason || err.message}`);
      } finally {
        setIsTransacting(false);
      }
    } else {
      setActiveGrants((prev) => prev.filter((g) => g.id !== grantId));
      if (activeGrants.length <= 1) {
        setDoctorAccessGranted(false);
      }
      setStatusMessage(`Access revoked${target ? ` for ${target.hospitalName}` : ''}.`);

      if (addAuditLog) {
        addAuditLog({
          type: 'ACCESS_REVOKED',
          title: 'Hospital Enclave Access Revoked',
          detail: `Revoked permission for ${target ? target.hospitalName : 'hospital'}`,
          time: new Date().toLocaleTimeString(),
        });
      }

      setTimeout(() => {
        setStatusMessage('');
      }, 3500);
    }
  };

  const latestClaim = settledClaims[0];
  const claimAmountEth = latestClaim ? latestClaim.amountEth : 1.5;
  const claimAmountInr = Math.round(claimAmountEth * 10000);
  const claimNullifier = latestClaim ? latestClaim.nullifier : '0x2dc35...19f3';
  const claimHospital = latestClaim ? latestClaim.hospitalName : 'St. Jude Medical Center';

  return (
    <div className="font-sans text-[#F3EFE5] space-y-8">

      {/* Sovereign Emergency Break-Glass Alert Banner */}
      {isBreakGlassActive && (
        <div className="p-4 rounded bg-amber-950/40 border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 shrink-0">
              <HeartPulse className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="font-semibold text-amber-300 font-sans flex items-center gap-2">
                <span>EMERGENCY CLINICAL ACCESS RECORDED ON ETHEREUM</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest-900 border border-amber-500/30 text-amber-400">
                  AccessLog.sol
                </span>
              </div>
              <p className="text-sage-muted text-[11px] font-sans mt-0.5">
                St. Jude Medical ER physician invoked emergency break-glass for acute trauma resuscitation: "{breakGlassReason || 'Emergency clinical triage'}". Immutable proof hash anchored to block.
              </p>
            </div>
          </div>
          {onRevokeBreakGlass && (
            <button
              onClick={onRevokeBreakGlass}
              className="px-3 py-1.5 rounded bg-forest-900 hover:bg-forest-850 border border-amber-500/40 text-amber-300 font-mono text-xs transition-colors cursor-pointer shrink-0"
            >
              Close Emergency Window
            </button>
          )}
        </div>
      )}

      {/* Settled Claims & Privacy Receipts Banner */}
      {claimSettled && (
        <div className="p-5 rounded bg-emerald-950/40 border border-emerald-500/40 space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
            <div className="flex items-center space-x-2 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base font-serif font-normal text-ivory-200">Autonomous Claim Settlement Receipt</h2>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-forest-900 border border-emerald-500/30 text-emerald-400 font-bold">
              100% PRIVATE • ZERO EXPOSURE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="bg-forest-900/80 p-3 rounded border border-sage-500/15">
              <div className="text-[10px] text-sage-muted uppercase">Disbursed Amount</div>
              <div className="text-sm font-bold text-ivory-200 mt-0.5">₹{claimAmountInr.toLocaleString('en-IN')} ({claimAmountEth.toFixed(2)} ETH)</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Paid from Escrow Pool</div>
            </div>
            <div className="bg-forest-900/80 p-3 rounded border border-sage-500/15">
              <div className="text-[10px] text-sage-muted uppercase">Treating Provider</div>
              <div className="text-sm font-semibold text-ivory-200 mt-0.5">{claimHospital}</div>
              <div className="text-[10px] text-brass-400 mt-0.5">Licensed In-Circuit Leaf</div>
            </div>
            <div className="bg-forest-900/80 p-3 rounded border border-sage-500/15">
              <div className="text-[10px] text-sage-muted uppercase">Privacy Guarantee</div>
              <div className="text-sm font-semibold text-emerald-400 mt-0.5">0 Bytes Medical Leak</div>
              <div className="text-[10px] text-sage-muted mt-0.5">Diagnosis Blinded in SNARK</div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-sage-300 bg-forest-900/60 p-2.5 rounded border border-sage-500/10 flex flex-wrap items-center justify-between gap-1">
            <span>Nullifier: <span className="text-brass-400 font-bold">{claimNullifier.slice(0, 16)}...</span> (Spent On-Chain)</span>
            <span className="text-sage-muted">Contract: ClaimManager.sol • Checks-Effects-Interactions</span>
          </div>
        </div>
      )}
      
      {/* 1. Greeting Section */}
      <div className="pt-2 pb-2">
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-normal text-[#F3EFE5] tracking-tight leading-snug">
          Hi Alex, your records stay with you.
        </h1>
        <p className="text-sm sm:text-base text-[#AEB8AA] mt-3 max-w-2xl leading-relaxed">
          Only you control who sees your health history and for how long. Insurance underwriters never receive raw doctor notes or diagnostics.
        </p>
        <div className="mt-6">
          <button
            onClick={scrollToSharing}
            className="px-5 py-2.5 rounded bg-[#B99561] text-[#0B1713] text-sm font-medium hover:bg-[#c9a674] transition-colors shadow-sm inline-flex items-center cursor-pointer"
          >
            Share with a hospital
          </button>
        </div>
      </div>

      {/* 2. Asymmetric Main Columns: 60% Left, 40% Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Main Column (~60%): Your latest visit */}
        <div className="lg:col-span-7 bg-[#12231C] rounded border border-[#9DAF9D]/15 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#9DAF9D]/15">
            <h2 className="text-lg font-medium text-[#F3EFE5]">
              Your latest visit
            </h2>
            <div className="flex items-center space-x-2">
              {showSensitive && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#192C23] text-emerald-300 border border-emerald-500/30 hidden sm:inline-block">
                  Decrypted locally in browser RAM
                </span>
              )}
              <button
                onClick={() => setShowSensitive((v) => !v)}
                className="text-xs text-[#B99561] hover:text-[#c9a674] transition-colors underline underline-offset-4 cursor-pointer"
              >
                {showSensitive ? 'Hide on this device' : 'Show on this device'}
              </button>
            </div>
          </div>

          {/* Readable Clinical Summary */}
          <div className="space-y-5 text-sm">
            
            {/* Visit metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-4 border-b border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA] text-xs">Date & Facility</span>
              <span className="text-[#F3EFE5] font-medium">
                {MOCK_FHIR_RECORD.condition.recordedDate} · St. Jude Medical Center
              </span>
            </div>

            {/* Condition / Diagnosis */}
            <div className="space-y-1.5 pb-4 border-b border-[#9DAF9D]/10">
              <div className="text-xs text-[#AEB8AA]">Diagnosis</div>
              <div className="text-[#F3EFE5]">
                {showSensitive ? (
                  <span>{MOCK_FHIR_RECORD.condition.display} (ICD-10: {MOCK_FHIR_RECORD.condition.code})</span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded bg-[#192C23] text-[#AEB8AA] text-xs">
                    •••••••••••••••• (Hidden on this device)
                  </span>
                )}
              </div>
            </div>

            {/* Procedure */}
            <div className="space-y-1.5 pb-4 border-b border-[#9DAF9D]/10">
              <div className="text-xs text-[#AEB8AA]">Consultation & Procedure</div>
              <div className="text-[#F3EFE5]">
                {showSensitive ? (
                  <span>{MOCK_FHIR_RECORD.procedure.display} (CPT: {MOCK_FHIR_RECORD.procedure.code})</span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded bg-[#192C23] text-[#AEB8AA] text-xs">
                    •••••••••••• (Hidden on this device)
                  </span>
                )}
              </div>
            </div>

            {/* Prescription */}
            <div className="space-y-1.5">
              <div className="text-xs text-[#AEB8AA]">Prescription</div>
              <div className="text-[#F3EFE5]">
                {showSensitive ? (
                  <span>{MOCK_FHIR_RECORD.prescription.medication} — {MOCK_FHIR_RECORD.prescription.dosage}</span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded bg-[#192C23] text-[#AEB8AA] text-xs">
                    •••••••••••••••••••••••• (Hidden on this device)
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Side Column (~40%): Who can see your record */}
        <div
          ref={sharingSectionRef}
          className="lg:col-span-5 bg-[#12231C] rounded border border-[#9DAF9D]/15 p-6 sm:p-8 space-y-6"
        >
          <div className="pb-4 border-b border-[#9DAF9D]/15">
            <h2 className="text-lg font-medium text-[#F3EFE5]">
              Who can see your record
            </h2>
          </div>

          <div className="space-y-4">
            {/* Hospital Selector */}
            <div>
              <label htmlFor="hospital-select" className="block text-xs text-[#AEB8AA] mb-1.5">
                Hospital
              </label>
              <select
                id="hospital-select"
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(Number(e.target.value))}
                className="w-full bg-[#192C23] border border-[#9DAF9D]/20 rounded px-3 py-2 text-sm text-[#F3EFE5] focus:outline-none focus:border-[#B99561] transition-colors"
              >
                {MOCK_HOSPITALS.map((h) => (
                  <option key={h.id} value={h.id} className="bg-[#12231C]">
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Segmented Control for Duration */}
            <div>
              <span className="block text-xs text-[#AEB8AA] mb-1.5">
                Access duration
              </span>
              <div className="grid grid-cols-3 gap-1 bg-[#0B1713] p-1 rounded border border-[#9DAF9D]/15">
                {[
                  '1 hour',
                  '24 hours',
                  'until I revoke',
                ].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`py-1.5 text-xs rounded transition-colors ${
                      duration === d
                        ? 'bg-[#192C23] text-[#F3EFE5] font-medium shadow-sm'
                        : 'text-[#AEB8AA] hover:text-[#F3EFE5]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Grant Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGrant}
                disabled={isTransacting}
                className="w-full py-2.5 px-4 rounded bg-[#B99561] text-[#0B1713] text-sm font-medium hover:bg-[#c9a674] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isTransacting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0B1713]" />
                    <span>Confirming on Sepolia...</span>
                  </>
                ) : (
                  <span>{isLiveMode ? 'Sign & Grant on Sepolia' : 'Grant access'}</span>
                )}
              </button>
            </div>

            {/* Status Message (only shown on actual action) */}
            {statusMessage && (
              <p className="text-xs text-[#B99561] pt-1">
                {statusMessage}
              </p>
            )}

            {/* Short list of active access with Revoke buttons */}
            <div className="pt-4 border-t border-[#9DAF9D]/15 space-y-3">
              <span className="block text-xs text-[#AEB8AA]">
                Active permissions
              </span>
              {activeGrants.length === 0 ? (
                <p className="text-xs text-[#AEB8AA]/70 italic">
                  No hospitals currently have access.
                </p>
              ) : (
                <div className="space-y-2">
                  {activeGrants.map((grant) => (
                    <div
                      key={grant.id}
                      className="flex items-center justify-between py-2 border-b border-[#9DAF9D]/10 last:border-b-0 text-xs"
                    >
                      <div>
                        <div className="text-[#F3EFE5] font-medium flex items-center space-x-2">
                          <span>{grant.hospitalName}</span>
                          {grant.explorerUrl && (
                            <a
                              href={grant.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono text-[#B99561] hover:underline flex items-center space-x-0.5"
                              title="View on Sepolia Etherscan"
                            >
                              <span>Sepolia Tx</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        <div className="text-[#AEB8AA] text-[11px]">{grant.duration} • {grant.grantedAt}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevoke(grant.id)}
                        disabled={isTransacting}
                        className="text-xs text-[#AEB8AA] hover:text-[#F3EFE5] px-2.5 py-1 rounded border border-[#9DAF9D]/20 hover:border-[#B99561]/40 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* 3. Horizontal Three-Step Strip Under Main Content */}
      <div className="border-t border-[#9DAF9D]/15 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div className="flex items-start space-x-3">
            <span className="w-6 h-6 rounded-full bg-[#12231C] border border-[#9DAF9D]/30 flex items-center justify-center text-xs text-[#B99561] shrink-0 mt-0.5">
              1
            </span>
            <div>
              <div className="text-[#F3EFE5] font-medium">Stored privately</div>
              <div className="text-xs text-[#AEB8AA] mt-0.5">Records remain on your local device</div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span className="w-6 h-6 rounded-full bg-[#12231C] border border-[#9DAF9D]/30 flex items-center justify-center text-xs text-[#B99561] shrink-0 mt-0.5">
              2
            </span>
            <div>
              <div className="text-[#F3EFE5] font-medium">Proof created</div>
              <div className="text-xs text-[#AEB8AA] mt-0.5">Hospital creates a proof without sharing notes</div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span className="w-6 h-6 rounded-full bg-[#12231C] border border-[#9DAF9D]/30 flex items-center justify-center text-xs text-[#B99561] shrink-0 mt-0.5">
              3
            </span>
            <div>
              <div className="text-[#F3EFE5] font-medium">Verified</div>
              <div className="text-xs text-[#AEB8AA] mt-0.5">Claim settles on-chain with zero data leakage</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Collapsed Technical Details */}
      <details className="group border border-[#9DAF9D]/15 rounded bg-[#12231C] overflow-hidden">
        <summary className="px-5 py-3.5 text-xs text-[#AEB8AA] cursor-pointer hover:text-[#F3EFE5] transition-colors select-none flex items-center justify-between">
          <span>Technical details</span>
          <span className="text-xs group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <div className="px-5 pb-5 pt-2 border-t border-[#9DAF9D]/10 font-mono text-xs text-[#AEB8AA] space-y-2.5">
          <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-sans text-xs flex items-start space-x-2">
            <span className="shrink-0 font-bold">⚠️ Sovereign Custody Warning:</span>
            <span>Your private decryption keys reside strictly in this browser's WebCrypto enclave (IndexedDB). Export or back up your keys before clearing browser site data or migrating devices.</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Policy ID</span>
            <span className="text-[#F3EFE5]">{MOCK_PATIENT.policyId}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Coverage Limit</span>
            <span className="text-[#F3EFE5]">{MOCK_PATIENT.policyLimitEth} ETH (₹50,000)</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Client Key Management</span>
            <span className="text-[#F3EFE5]">WebCrypto ECDH P-256 + ECDSA P-256</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">DEK Encryption</span>
            <span className="text-[#F3EFE5]">AES-256-GCM + Ephemeral ECDH Key Wrapping</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Claim Manager Contract</span>
            <span className="text-[#F3EFE5] break-all">0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Hospital Registry (2-of-3 Multi-Sig)</span>
            <span className="text-[#F3EFE5] break-all">0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">HL7 Schema</span>
            <span className="text-[#F3EFE5]">FHIR R4 JSON-LD</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">IPFS CID</span>
            <span className="text-[#F3EFE5] break-all">{ipfsCid}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Anchored Ciphertext SHA-256</span>
            <span className="text-[#F3EFE5] break-all">0x131bc61030e2849f...9e195b (Ciphertext Only)</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Circom Nullifier</span>
            <span className="text-[#F3EFE5] break-all">Poseidon(policySalt, recordId)</span>
          </div>
        </div>
      </details>

    </div>
  );
}
