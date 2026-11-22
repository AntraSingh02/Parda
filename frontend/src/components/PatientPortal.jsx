import React, { useState } from 'react';
import { Lock, Unlock, ShieldCheck, FileText, Share2, Clock, CheckCircle, Database, AlertCircle } from 'lucide-react';
import { MOCK_PATIENT, MOCK_FHIR_RECORD, MOCK_HOSPITALS } from '../data/mockData';

export default function PatientPortal({
  isEncrypted,
  setIsEncrypted,
  ipfsCid,
  setIpfsCid,
  doctorAccessGranted,
  setDoctorAccessGranted,
  addAuditLog,
}) {
  const [selectedHospital, setSelectedHospital] = useState(MOCK_HOSPITALS[0].id);
  const [accessDuration, setAccessDuration] = useState('3600');
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Handle Client-Side Encryption
  const handleEncryptAndPin = () => {
    setIsEncrypting(true);
    setTimeout(() => {
      const generatedCid = "bafybeic" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setIpfsCid(generatedCid);
      setIsEncrypted(true);
      setIsEncrypting(false);
      addAuditLog({
        type: 'RECORD_PINNED',
        title: 'FHIR Record Encrypted & Pinned to IPFS',
        detail: `CID: ${generatedCid} | Anchored with SHA-256`,
        time: new Date().toLocaleTimeString(),
      });
    }, 800);
  };

  // Handle Grant Access
  const handleGrantAccess = () => {
    setDoctorAccessGranted(true);
    const durationLabel = accessDuration === '3600' ? '1 Hour' : accessDuration === '86400' ? '24 Hours' : 'Permanent';
    addAuditLog({
      type: 'ACCESS_GRANTED',
      title: 'Doctor Access Granted (On-Chain)',
      detail: `St. Jude Medical granted access for ${durationLabel} | Record: ${ipfsCid.slice(0, 16)}...`,
      time: new Date().toLocaleTimeString(),
    });
  };

  // Handle Revoke Access
  const handleRevokeAccess = () => {
    setDoctorAccessGranted(false);
    addAuditLog({
      type: 'ACCESS_REVOKED',
      title: 'Doctor Access Revoked (On-Chain)',
      detail: `Access revoked from St. Jude Medical`,
      time: new Date().toLocaleTimeString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Sovereign Health Vault</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome, {MOCK_PATIENT.name}</h2>
            <p className="text-sm text-slate-400 mt-1">
              Your health data is encrypted client-side. The blockchain only stores your access permissions and verification hashes.
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="text-right">
              <div className="text-xs text-slate-400">Policy Commitment</div>
              <div className="text-xs font-mono font-medium text-emerald-400">{MOCK_PATIENT.policyId}</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <div className="text-xs text-slate-400">Coverage Limit</div>
              <div className="text-sm font-bold text-white">{MOCK_PATIENT.policyLimitEth} ETH</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: HL7 FHIR Medical Record */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Electronic Health Record (HL7 FHIR)</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
              FHIR R4 JSON
            </span>
          </div>

          <div className="space-y-4">
            {/* Diagnosis Card */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400 font-medium">Condition / Diagnosis (Sensitive)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Hidden in ZKP</span>
                </span>
              </div>
              <div className="text-base font-semibold text-white">{MOCK_FHIR_RECORD.condition.display}</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                ICD-10 Code: <span className="text-indigo-400">{MOCK_FHIR_RECORD.condition.code}</span> | Recorded: {MOCK_FHIR_RECORD.condition.recordedDate}
              </div>
            </div>

            {/* Treatment & Prescription */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
                <span className="text-xs text-slate-400 font-medium">Procedure & Consultation</span>
                <div className="text-sm font-semibold text-white mt-1">{MOCK_FHIR_RECORD.procedure.display}</div>
                <div className="text-xs text-slate-400 mt-1 font-mono">CPT Code: {MOCK_FHIR_RECORD.procedure.code}</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
                <span className="text-xs text-slate-400 font-medium">Prescription</span>
                <div className="text-sm font-semibold text-white mt-1">{MOCK_FHIR_RECORD.prescription.medication}</div>
                <div className="text-xs text-slate-400 mt-1">{MOCK_FHIR_RECORD.prescription.dosage}</div>
              </div>
            </div>

            {/* Encryption & IPFS Pin Action */}
            <div className="pt-2">
              {!isEncrypted ? (
                <button
                  onClick={handleEncryptAndPin}
                  disabled={isEncrypting}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isEncrypting ? "Encrypting with AES-256-GCM..." : "1. Encrypt Record & Pin to IPFS"}</span>
                </button>
              ) : (
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Client-Side Encryption Active (AES-256-GCM)</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 break-all">
                    <span className="text-slate-500">IPFS CID:</span> {ipfsCid}
                  </div>
                  <div className="text-xs font-mono text-slate-400 break-all">
                    <span className="text-slate-500">Ciphertext:</span> 8f9b2d...9a21e0 (Plaintext never leaves device)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Permission & Doctor Access Control */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Share2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Access Control (AccessRegistry.sol)</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Grant time-bound decryption permissions for licensed doctors. You can revoke access at any time on-chain.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Select Licensed Hospital / Doctor</label>
                <select
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {MOCK_HOSPITALS.map((h) => (
                    <option key={h.id} value={h.id}>{h.name} ({h.licenseNo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Access Duration (Time-Bound)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '1 Hour', val: '3600' },
                    { label: '24 Hours', val: '86400' },
                    { label: 'Permanent', val: '0' },
                  ].map((d) => (
                    <button
                      key={d.val}
                      onClick={() => setAccessDuration(d.val)}
                      className={`text-xs py-2 rounded-lg font-medium border transition-colors ${
                        accessDuration === d.val
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                {!doctorAccessGranted ? (
                  <button
                    onClick={handleGrantAccess}
                    disabled={!isEncrypted}
                    className={`w-full flex items-center justify-center space-x-2 font-medium py-2.5 rounded-xl transition-all ${
                      isEncrypted
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Unlock className="w-4 h-4" />
                    <span>2. Grant Access to Hospital</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-emerald-300">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>Active Grant: St. Jude Medical</span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">1h left</span>
                    </div>

                    <button
                      onClick={handleRevokeAccess}
                      className="w-full flex items-center justify-center space-x-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-medium py-2.5 rounded-xl transition-all text-xs"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Revoke Doctor Access</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center space-x-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>All grant/revoke events emit immutable on-chain logs.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
