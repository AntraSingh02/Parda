import React, { useState, useRef } from 'react';
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

  const handleGrant = () => {
    const hospital = MOCK_HOSPITALS.find((h) => h.id === Number(selectedHospital)) || MOCK_HOSPITALS[0];
    
    // Add to active grants
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
  };

  const handleRevoke = (grantId) => {
    const target = activeGrants.find((g) => g.id === grantId);
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
  };

  return (
    <div className="font-sans text-[#F3EFE5] space-y-12">
      
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
            className="px-5 py-2.5 rounded bg-[#B99561] text-[#0B1713] text-sm font-medium hover:bg-[#c9a674] transition-colors shadow-sm inline-flex items-center"
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
                className="w-full py-2.5 px-4 rounded bg-[#B99561] text-[#0B1713] text-sm font-medium hover:bg-[#c9a674] transition-colors shadow-sm"
              >
                Grant access
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
                        <div className="text-[#F3EFE5] font-medium">{grant.hospitalName}</div>
                        <div className="text-[#AEB8AA] text-[11px]">{grant.duration}</div>
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
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Policy ID</span>
            <span className="text-[#F3EFE5]">{MOCK_PATIENT.policyId}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Coverage Limit</span>
            <span className="text-[#F3EFE5]">{MOCK_PATIENT.policyLimitEth} ETH</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Access Registry Contract</span>
            <span className="text-[#F3EFE5] break-all">0x5FbDB2315678afecb367f032d93F642f64180aa3</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Verifier Contract</span>
            <span className="text-[#F3EFE5] break-all">0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512</span>
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
            <span className="text-[#AEB8AA]/70">Commitment Hash</span>
            <span className="text-[#F3EFE5] break-all">0x8f9b2d41a7e201bb...9a21e0</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Circom Nullifier</span>
            <span className="text-[#F3EFE5] break-all">0x7c8149d92b0...00ae</span>
          </div>
        </div>
      </details>

    </div>
  );
}
