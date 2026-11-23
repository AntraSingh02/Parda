import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PardaOpeningSequence from './components/PardaOpeningSequence';
import PatientPortal from './components/PatientPortal';
import HospitalPortal from './components/HospitalPortal';
import InsurerPortal from './components/InsurerPortal';
import PrivacyXRay from './components/PrivacyXRay';
import RedTeamPanel from './components/RedTeamPanel';
import { MOCK_ACCOUNTS } from './data/mockData';

const ALLOWED_ROLES = ['patient', 'hospital', 'insurer', 'xray', 'redteam'];

export default function App() {
  // 1. Read Role from URI Query String (?role=patient | hospital | insurer | xray | redteam)
  const [activeRole, setActiveRoleState] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('role');
      if (ALLOWED_ROLES.includes(p)) return p;
    }
    return 'patient';
  });

  // 2. Synchronize Role changes to the Browser URI (?role=...)
  const handleRoleChange = (role) => {
    if (ALLOWED_ROLES.includes(role)) {
      setActiveRoleState(role);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('role', role);
        window.history.replaceState({ role }, '', url.toString());
      }
    }
  };

  // 3. Listen to browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search).get('role');
      if (ALLOWED_ROLES.includes(p)) {
        setActiveRoleState(p);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Dedicated full-screen interactive Parda intro control (?intro=1)
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('intro');
      if (p === '1') return true;
      if (p === '0') return false;
      return !sessionStorage.getItem('parda_intro_seen_v4');
    }
    return false;
  });

  const handleIntroComplete = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('parda_intro_seen_v4', 'true');
    }
    setShowIntro(false);
  };
  
  // Shared Workflow State
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [ipfsCid, setIpfsCid] = useState('bafybeic23ae33cd09cec6723c0b92cb16438072');
  const [doctorAccessGranted, setDoctorAccessGranted] = useState(false);
  const [claimSettled, setClaimSettled] = useState(false);
  const [hospitalBalance, setHospitalBalance] = useState('14.20 ETH');

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState([
    {
      type: 'INIT',
      title: 'Insurance Pool Initialized',
      detail: 'Liquidity funded with 10.0 ETH | Approved Hospital Merkle Root Set',
      time: '04:00:00 AM',
    },
    {
      type: 'RECORD_PINNED',
      title: 'Patient Encrypted Record Anchored',
      detail: 'CID: bafybeic23ae33cd09cec... | SHA-256 On-Chain Ciphertext Commitment',
      time: '04:02:15 AM',
    }
  ]);

  const addAuditLog = (log) => {
    setAuditLogs((prev) => [log, ...prev]);
  };

  const currentAccount = MOCK_ACCOUNTS[activeRole] || MOCK_ACCOUNTS['patient'];

  return (
    <div className="min-h-screen bg-forest-900 text-ivory-200 flex flex-col justify-between selection:bg-brass-500 selection:text-forest-950 font-sans">
      
      {/* ===================================================================== */}
      {/* 1. DEDICATED FULL-SCREEN PARDA INTERACTIVE INTRO (ON CLEAN LOAD / REPLAY) */}
      {/* ===================================================================== */}
      {showIntro && (
        <PardaOpeningSequence onComplete={handleIntroComplete} />
      )}

      {/* Top Header Navigation with URI-Linked Tabs */}
      <Header
        activeRole={activeRole}
        setActiveRole={handleRoleChange}
        currentAccount={currentAccount}
        onReplayIntro={() => setShowIntro(true)}
      />

      {/* ===================================================================== */}
      {/* 2. THE WORKING DAPP DASHBOARD */}
      {/* ===================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeRole === 'hospital' && (
          <h1 className="text-xl sm:text-2xl font-serif font-normal text-[#F3EFE5] mb-6">
            Hospital Provider Enclave
          </h1>
        )}
        {activeRole === 'insurer' && (
          <h1 className="text-xl sm:text-2xl font-serif font-normal text-[#F3EFE5] mb-6">
            Underwriter Settlement Ledger
          </h1>
        )}

        {/* Active Role or Verification Panel */}
        <section>
          {activeRole === 'patient' && (
            <PatientPortal
              isEncrypted={isEncrypted}
              setIsEncrypted={setIsEncrypted}
              ipfsCid={ipfsCid}
              setIpfsCid={setIpfsCid}
              doctorAccessGranted={doctorAccessGranted}
              setDoctorAccessGranted={setDoctorAccessGranted}
              addAuditLog={addAuditLog}
            />
          )}

          {activeRole === 'hospital' && (
            <HospitalPortal
              doctorAccessGranted={doctorAccessGranted}
              claimSettled={claimSettled}
              setClaimSettled={setClaimSettled}
              hospitalBalance={hospitalBalance}
              setHospitalBalance={setHospitalBalance}
              addAuditLog={addAuditLog}
              setActiveRole={handleRoleChange}
            />
          )}

          {activeRole === 'insurer' && (
            <InsurerPortal
              claimSettled={claimSettled}
              auditLogs={auditLogs}
              addAuditLog={addAuditLog}
            />
          )}

          {activeRole === 'xray' && (
            <PrivacyXRay
              claimSettled={claimSettled}
            />
          )}

          {activeRole === 'redteam' && (
            <RedTeamPanel
              addAuditLog={addAuditLog}
            />
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-sage-500/20 bg-forest-950 py-6 text-xs text-sage-muted font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-ivory-200 tracking-wide font-serif">PARDA PROTOCOL</span>
            <span>•</span>
            <span>BUILT FOR HACK-A-SOL 5.0 (W3-01)</span>
          </div>
          <span className="text-brass-400/90">
            Circom 2.1 + Groth16 zk-SNARKs + Solidity 0.8.20 + HL7 FHIR R4
          </span>
        </div>
      </footer>

    </div>
  );
}
