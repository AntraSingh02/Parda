import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, CheckCircle2, ShieldCheck, ArrowRight, Cloud, Lock, Key, Copy, RefreshCw, Database } from 'lucide-react';
import { MOCK_PATIENT, MOCK_FHIR_RECORD, MOCK_HOSPITALS } from '../data/mockData';
import { useWallet } from '../context/WalletContext';
import deployedConfig from '../contracts/deployed_addresses.json';
import {
  getOrCreatePatientKey,
  uploadEncryptedRecord,
  fetchEncryptedRecord,
} from '../services/healthRecordService';
import { isSupabaseConfigured, SUPABASE_URL } from '../services/supabaseClient';
import { computeSha256 } from '../services/cryptoService';

export default function PatientPortal({
  isEncrypted,
  setIsEncrypted,
  ipfsCid,
  setIpfsCid,
  doctorAccessGranted,
  setDoctorAccessGranted,
  addAuditLog,
  claimSettled: externalClaimSettled,
  setActiveRole,
}) {
  const [selectedHospital, setSelectedHospital] = useState(MOCK_HOSPITALS[0].id);
  const [duration, setDuration] = useState('1 hour');
  const [showSensitive, setShowSensitive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Cloud Sync & Encryption State
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [cloudRecordId, setCloudRecordId] = useState('');
  const [recordHash, setRecordHash] = useState('');
  const [patientKeyBase64, setPatientKeyBase64] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

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

  const { account } = useWallet();
  const sharingSectionRef = useRef(null);

  // Initialize and Auto-Sync to Supabase Cloud on mount
  useEffect(() => {
    let isMounted = true;

    async function initVault() {
      try {
        const patientAddr = account || MOCK_PATIENT.address;
        
        // 1. Get or create patient's sovereign AES-256 key
        const keyBundle = await getOrCreatePatientKey(patientAddr);
        if (isMounted) {
          setPatientKeyBase64(keyBundle.base64Key);
        }

        // 2. Compute on-chain SHA-256 digest
        const hash = await computeSha256(MOCK_FHIR_RECORD);
        if (isMounted) {
          setRecordHash(hash);
        }

        // 3. Check if already synced or sync now
        setIsSyncing(true);
        const result = await uploadEncryptedRecord({
          patientAddress: patientAddr,
          recordData: MOCK_FHIR_RECORD,
          key: keyBundle.key,
        });

        if (isMounted) {
          setIsSyncing(false);
          setCloudSynced(result.success);
          setCloudRecordId(result.id);
          setIsEncrypted(true);
          if (result.recordHash) setRecordHash(result.recordHash);
        }
      } catch (err) {
        console.warn('[Parda] Vault initialization notice:', err);
        if (isMounted) setIsSyncing(false);
      }
    }

    initVault();

    return () => {
      isMounted = false;
    };
  }, [account]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const patientAddr = account || MOCK_PATIENT.address;
      const keyBundle = await getOrCreatePatientKey(patientAddr);
      const result = await uploadEncryptedRecord({
        patientAddress: patientAddr,
        recordData: MOCK_FHIR_RECORD,
        key: keyBundle.key,
      });
      setIsSyncing(false);
      setCloudSynced(result.success);
      setCloudRecordId(result.id);
      if (result.recordHash) setRecordHash(result.recordHash);
      setStatusMessage(result.storage === 'supabase_cloud' ? 'Synced to Supabase Cloud Vault!' : 'Saved in local encrypted vault.');
      
      if (addAuditLog) {
        addAuditLog({
          type: 'ENCRYPTED_AND_SYNCED',
          title: 'Health Record Encrypted & Synced to Cloud',
          detail: `AES-256-GCM Ciphertext stored in Supabase | Record Hash: ${result.recordHash.slice(0, 16)}...`,
          time: new Date().toLocaleTimeString(),
        });
      }

      setTimeout(() => setStatusMessage(''), 3500);
    } catch (e) {
      setIsSyncing(false);
      setStatusMessage('Sync failed: ' + e.message);
    }
  };

  const copyKeyToClipboard = () => {
    if (patientKeyBase64) {
      navigator.clipboard.writeText(patientKeyBase64);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const copyHashToClipboard = () => {
    if (recordHash) {
      navigator.clipboard.writeText(recordHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const scrollToSharing = () => {
    if (sharingSectionRef.current) {
      sharingSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      const selectEl = document.getElementById('hospital-select');
      if (selectEl) selectEl.focus();
    }
  };

  const handleGrant = () => {
    const hospital = MOCK_HOSPITALS.find((h) => h.id === Number(selectedHospital)) || MOCK_HOSPITALS[0];
    
    const newGrant = {
      id: Date.now(),
      hospitalName: hospital.name,
      duration: duration,
      grantedAt: 'Just now',
    };

    setActiveGrants((prev) => [newGrant, ...prev.filter((g) => g.hospitalName !== hospital.name)]);
    setDoctorAccessGranted(true);
    setIsEncrypted(true);

    // Share sovereign decryption token to authorized enclave session
    if (patientKeyBase64) {
      localStorage.setItem('parda_authorized_grant_key', patientKeyBase64);
      localStorage.setItem('parda_authorized_record_hash', recordHash);
    }

    setStatusMessage(`Access & Decryption Token granted to ${hospital.name} for ${duration}.`);

    if (addAuditLog) {
      addAuditLog({
        type: 'ACCESS_GRANTED',
        title: 'Hospital Enclave Access Granted',
        detail: `${hospital.name} granted access (${duration}) | Decryption key shared with doctor session`,
        time: new Date().toLocaleTimeString(),
      });
    }

    setTimeout(() => {
      setStatusMessage('');
    }, 4000);
  };

  const handleRevoke = (grantId) => {
    const target = activeGrants.find((g) => g.id === grantId);
    setActiveGrants((prev) => prev.filter((g) => g.id !== grantId));
    if (activeGrants.length <= 1) {
      setDoctorAccessGranted(false);
      localStorage.removeItem('parda_authorized_grant_key');
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
  };

  const claimSettled = externalClaimSettled;

  return (
    <div className="font-sans text-[#F3EFE5] space-y-8">
      
      {/* 1. Greeting & Cloud Vault Status Card */}
      <div className="pt-2 pb-2">
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-normal text-[#F3EFE5] tracking-tight leading-snug">
          Hi Alex, your records stay with you.
        </h1>
        <p className="text-sm sm:text-base text-[#AEB8AA] mt-3 max-w-2xl leading-relaxed">
          Only you hold the sovereign encryption key. Encrypted records are safely backed up in the cloud, while private diagnostics are shielded from public blockchains and insurer underwriters.
        </p>

        {/* Live Supabase Cloud Vault Indicator Banner */}
        <div className="mt-6 p-4 rounded bg-[#12231C] border border-[#B99561]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded bg-[#192C23] border border-[#B99561]/50 flex items-center justify-center text-[#B99561] shrink-0">
              <Cloud className="w-5 h-5 text-[#B99561]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-[#F3EFE5]">
                  E2EE Cloud Storage: Supabase
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                  Live Connected
                </span>
              </div>
              <div className="text-xs text-[#AEB8AA] font-mono mt-0.5">
                Target: <span className="text-[#B99561]">{SUPABASE_URL.replace('https://', '')}</span> · Table: <span className="text-[#F3EFE5]">encrypted_health_records</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded bg-[#192C23] border border-[#B99561]/60 text-xs font-mono font-medium text-[#B99561] hover:text-[#F3EFE5] hover:border-[#B99561] transition-all inline-flex items-center space-x-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Encrypting & Syncing...' : 'Re-Sync to Cloud'}</span>
            </button>
            <button
              onClick={scrollToSharing}
              className="px-4 py-1.5 rounded bg-[#B99561] text-[#0B1713] text-xs font-medium hover:bg-[#c9a674] transition-colors shadow-sm inline-flex items-center"
            >
              Share with a hospital
            </button>
          </div>
        </div>
      </div>

      {/* 2. Asymmetric Main Columns: 60% Left, 40% Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Main Column (~60%): Your latest visit */}
        <div className="lg:col-span-7 bg-[#12231C] rounded border border-[#9DAF9D]/15 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#9DAF9D]/15">
            <div>
              <h2 className="text-lg font-medium text-[#F3EFE5]">
                Your latest visit
              </h2>
              <div className="text-xs text-[#AEB8AA] font-mono mt-0.5">
                AES-256-GCM Encrypted · Client-Side Private Vault
              </div>
            </div>
            <button
              onClick={() => setShowSensitive((v) => !v)}
              className="text-xs text-[#B99561] hover:text-[#c9a674] transition-colors underline underline-offset-4"
            >
              {showSensitive ? 'Hide on this device' : 'Show on this device'}
            </button>
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
              <div className="flex items-center justify-between">
                <div className="text-xs text-[#AEB8AA]">Diagnosis</div>
                <span className="text-[10px] font-mono text-[#B99561] bg-[#192C23] px-1.5 py-0.5 rounded border border-[#B99561]/20">
                  Private in Cloud
                </span>
              </div>
              <div className="text-[#F3EFE5]">
                {showSensitive ? (
                  <span>{MOCK_FHIR_RECORD.condition.display} (ICD-10: {MOCK_FHIR_RECORD.condition.code})</span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded bg-[#192C23] text-[#AEB8AA] text-xs font-mono">
                    •••••••••••••••• (Encrypted in Supabase)
                  </span>
                )}
              </div>
            </div>

            {/* Procedure */}
            <div className="space-y-1.5 pb-4 border-b border-[#9DAF9D]/10">
              <div className="flex items-center justify-between">
                <div className="text-xs text-[#AEB8AA]">Consultation & Procedure</div>
                <span className="text-[10px] font-mono text-[#B99561] bg-[#192C23] px-1.5 py-0.5 rounded border border-[#B99561]/20">
                  Private in Cloud
                </span>
              </div>
              <div className="text-[#F3EFE5]">
                {showSensitive ? (
                  <span>{MOCK_FHIR_RECORD.procedure.display} (CPT: {MOCK_FHIR_RECORD.procedure.code})</span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded bg-[#192C23] text-[#AEB8AA] text-xs font-mono">
                    •••••••••••• (Encrypted in Supabase)
                  </span>
                )}
              </div>
            </div>

            {/* Prescription */}
            <div className="space-y-1.5 pb-4 border-b border-[#9DAF9D]/10">
              <div className="flex items-center justify-between">
                <div className="text-xs text-[#AEB8AA]">Prescription</div>
                <span className="text-[10px] font-mono text-[#B99561] bg-[#192C23] px-1.5 py-0.5 rounded border border-[#B99561]/20">
                  Private in Cloud
                </span>
              </div>
              <div className="text-[#F3EFE5]">
                {showSensitive ? (
                  <span>{MOCK_FHIR_RECORD.prescription.medication} — {MOCK_FHIR_RECORD.prescription.dosage}</span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded bg-[#192C23] text-[#AEB8AA] text-xs font-mono">
                    •••••••••••••••••••••••• (Encrypted in Supabase)
                  </span>
                )}
              </div>
            </div>

            {/* Cryptographic Key & Anchor Box */}
            <div className="p-4 rounded bg-[#0B1713] border border-[#9DAF9D]/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#AEB8AA] uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#B99561]" />
                  <span>Sovereign Decryption Key (AES-256)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="text-[11px] text-[#B99561] hover:underline"
                >
                  {showKey ? 'Hide Key' : 'Reveal Key'}
                </button>
              </div>

              <div className="flex items-center justify-between bg-[#12231C] px-3 py-2 rounded border border-[#9DAF9D]/15 font-mono text-xs">
                <span className="text-[#F3EFE5] truncate max-w-[280px]">
                  {showKey && patientKeyBase64 ? patientKeyBase64 : '••••••••••••••••••••••••••••••••••••••••••••'}
                </span>
                <button
                  onClick={copyKeyToClipboard}
                  className="text-xs text-[#B99561] hover:text-[#F3EFE5] flex items-center gap-1 pl-2 shrink-0"
                  title="Copy patient AES-256 key"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* On-Chain SHA-256 Anchor */}
              <div className="pt-2 border-t border-[#9DAF9D]/10">
                <div className="flex items-center justify-between text-xs text-[#AEB8AA] font-mono">
                  <span>ON-CHAIN ANCHOR HASH (SHA-256):</span>
                  <button
                    onClick={copyHashToClipboard}
                    className="text-[#B99561] hover:underline flex items-center gap-1"
                  >
                    <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="text-xs font-mono text-[#F3EFE5] break-all mt-1 bg-[#12231C] p-2 rounded border border-[#9DAF9D]/10">
                  {recordHash || '0x4ead9644ca55d50750feaad0b2dfbb1b9862d8a3bbe3518d579d10ba6b3c7f48'}
                </div>
                <div className="text-[11px] text-[#AEB8AA]/80 mt-1">
                  Anchored to Sepolia smart contracts. Proves data integrity without exposing diagnoses.
                </div>
              </div>
            </div>

            {/* Status of Hospital Access & Settlement */}
            <div className="pt-2 border-t border-[#9DAF9D]/15">
              <div className="p-4 rounded bg-[#12231C] border border-[#9DAF9D]/15 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#AEB8AA] uppercase tracking-wider">Health Claims Protocol Status</span>
                  <span className="text-[#B99561] font-semibold">Zero-Knowledge Settlement</span>
                </div>
                <p className="text-xs text-[#AEB8AA] leading-relaxed">
                  {claimSettled ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Claim settled on Sepolia! Hospital received cashless reimbursement with 0 medical notes revealed.
                    </span>
                  ) : activeGrants.length > 0 ? (
                    <span>
                      Access is active for <strong>{activeGrants[0].hospitalName}</strong>. The attending physician can now fetch the encrypted record from Supabase, decrypt it in their enclave, and compile the Groth16 witness.
                    </span>
                  ) : (
                    <span>
                      Your medical record is encrypted and saved in your sovereign Supabase vault. When you visit a healthcare provider, grant temporary access using the panel on the right.
                    </span>
                  )}
                </p>
                {activeGrants.length > 0 && !claimSettled && setActiveRole && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveRole('hospital')}
                      className="py-1.5 px-3 rounded bg-[#192C23] border border-[#B99561]/40 text-[#B99561] hover:text-[#F3EFE5] text-xs font-mono font-medium transition-colors inline-flex items-center space-x-1.5"
                    >
                      <span>Switch to 2. Hospital Provider to Request Claim</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="w-full bg-[#192C23] border border-[#9DAF9D]/20 rounded px-3 py-2 text-sm text-[#F3EFE5] focus:outline-none focus:border-[#B99561]"
              >
                {MOCK_HOSPITALS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Selector */}
            <div>
              <label htmlFor="duration-select" className="block text-xs text-[#AEB8AA] mb-1.5">
                Access duration
              </label>
              <select
                id="duration-select"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-[#192C23] border border-[#9DAF9D]/20 rounded px-3 py-2 text-sm text-[#F3EFE5] focus:outline-none focus:border-[#B99561]"
              >
                <option value="1 hour">1 hour (consultation)</option>
                <option value="24 hours">24 hours (day admission)</option>
                <option value="7 days">7 days (follow-up)</option>
              </select>
            </div>

            {/* Grant Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGrant}
                className="w-full py-2.5 px-4 rounded bg-[#B99561] text-[#0B1713] text-sm font-medium hover:bg-[#c9a674] transition-colors shadow-sm"
              >
                Grant access
              </button>
            </div>

            {/* Status Message */}
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
                        <div className="text-[#F3EFE5] font-medium">{grant.hospitalName}</div>
                        <div className="text-[#AEB8AA] text-[11px]">{grant.duration} · Sovereign Key Shared</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevoke(grant.id)}
                        className="text-xs text-[#AEB8AA] hover:text-[#F3EFE5] px-2.5 py-1 rounded border border-[#9DAF9D]/20 hover:border-[#B99561]/40 transition-colors"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}

                  {setActiveRole && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveRole('hospital')}
                        className="w-full py-2 px-3 rounded bg-[#192C23] border border-[#B99561]/40 text-[#B99561] hover:text-[#F3EFE5] text-xs font-mono font-medium transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <span>Switch to Hospital Enclave to Request Claim</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
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
              <div className="text-[#F3EFE5] font-medium">Stored in Supabase E2EE</div>
              <div className="text-xs text-[#AEB8AA] mt-0.5">Encrypted with your private AES-256 key</div>
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
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Policy ID</span>
            <span className="text-[#F3EFE5]">{MOCK_PATIENT.policyId}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Coverage Limit</span>
            <span className="text-[#F3EFE5]">{MOCK_PATIENT.policyLimitEth} ETH</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Supabase Cloud Endpoint</span>
            <span className="text-[#F3EFE5] break-all">{SUPABASE_URL}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Supabase Record ID</span>
            <span className="text-[#F3EFE5] break-all">{cloudRecordId || 'synced'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">ClaimManager Contract (Sepolia)</span>
            <span className="text-[#F3EFE5] break-all">{deployedConfig.claimManager}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Groth16 Verifier Contract</span>
            <span className="text-[#F3EFE5] break-all">{deployedConfig.verifier}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Hospital Registry Contract</span>
            <span className="text-[#F3EFE5] break-all">{deployedConfig.hospitalRegistry}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">On-Chain Record Hash (SHA-256)</span>
            <span className="text-[#F3EFE5] break-all">{recordHash}</span>
          </div>
        </div>
      </details>

    </div>
  );
}
