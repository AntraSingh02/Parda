export const MOCK_PATIENT = {
  id: "patient-001",
  name: "Alex Doe",
  dob: "1992-05-14",
  gender: "Non-binary",
  policyId: "POL-987654-ZKP",
  policyLimitEth: "5.0",
  policyExpiry: "2030-12-31",
  address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
};

export const MOCK_FHIR_RECORD = {
  resourceType: "Bundle",
  id: "fhir-bundle-alex-doe-2024",
  type: "collection",
  timestamp: "2024-11-23T04:00:00Z",
  patient: {
    name: "Alex Doe",
    mrn: "MRN-8849201",
  },
  condition: {
    code: "I10",
    display: "Essential (primary) hypertension - Stage 1",
    severity: "Moderate",
    recordedDate: "2024-11-20",
    private: true,
  },
  procedure: {
    code: "99213",
    display: "Office or other outpatient visit, 20-29 minutes",
    status: "completed",
    costEth: "1.5",
    private: true,
  },
  prescription: {
    medication: "Lisinopril 10mg Oral Tablet",
    dosage: "Once daily with water",
    refills: 3,
    private: true,
  },
  coverage: {
    payor: "HealthShield Mutual Decentralized Pool",
    policyCommitment: "0x498a1c8f...92e1",
    status: "active",
  }
};

export const MOCK_HOSPITALS = [
  {
    id: 101,
    name: "St. Jude Medical Center",
    licenseNo: "LIC-NY-2024-8849",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    isApproved: true,
  },
  {
    id: 102,
    name: "Metropolitan General Hospital",
    licenseNo: "LIC-CA-2023-1102",
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    isApproved: true,
  },
];

export const MOCK_NULLIFIER = "0x2dc35a81e9f4b0028c7921a4f910482910482019482710482019f3";

export const MOCK_ACCOUNTS = {
  patient: {
    name: "Alex Doe",
    roleLabel: "Patient",
    role: "patient",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    balance: "2.45 ETH",
  },
  hospital: {
    name: "St. Jude Medical",
    roleLabel: "Hospital",
    role: "hospital",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    balance: "14.20 ETH",
  },
  insurer: {
    name: "HealthShield Mutual",
    roleLabel: "Insurer",
    role: "insurer",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    balance: "100.0 ETH",
  },
  xray: {
    name: "Privacy X-Ray",
    roleLabel: "Inspector",
    role: "xray",
    address: "0x000000000000000000000000000000000000XRAY",
    balance: "Read-Only View",
  },
  redteam: {
    name: "Red-Team Audit",
    roleLabel: "Security",
    role: "redteam",
    address: "0x000000000000000000000000000000000000ATCK",
    balance: "Adversarial Suite",
  },
};
