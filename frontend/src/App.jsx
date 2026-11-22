import React, { useState } from 'react';
import Header from './components/Header';
import PatientPortal from './components/PatientPortal';
import HospitalPortal from './components/HospitalPortal';
import InsurerPortal from './components/InsurerPortal';
import { MOCK_ACCOUNTS } from './data/mockData';

export default function App() {
  const [activeRole, setActiveRole] = useState('patient'); // 'patient' | 'hospital' | 'insurer'
  
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
      detail: 'Liquidity funded with 10.0 ETH | Approved Hospital Root Set',
      time: '04:00:00 AM',
    },
    {
      type: 'RECORD_PINNED',
      title: 'Patient Encrypted Record Anchored',
      detail: 'CID: bafybeic23ae33cd09cec... | SHA-256 On-Chain Commitment',
      time: '04:02:15 AM',
    }
  ]);

  const addAuditLog = (log) => {
    setAuditLogs((prev) => [log, ...prev]);
  };

  const currentAccount = MOCK_ACCOUNTS[activeRole];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header with Role Switcher */}
      <Header
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        currentAccount={currentAccount}
      />

      {/* Main Workflow View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
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
            setActiveRole={setActiveRole}
          />
        )}

        {activeRole === 'insurer' && (
          <InsurerPortal
            claimSettled={claimSettled}
            auditLogs={auditLogs}
            addAuditLog={addAuditLog}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Parda • Built for Hack-a-Sol 5.0 (Track 4: Web3 · W3-01)</span>
          <span className="font-mono text-indigo-400/80">Circom 2.1 + Groth16 + Solidity 0.8.20 + HL7 FHIR</span>
        </div>
      </footer>
    </div>
  );
}
