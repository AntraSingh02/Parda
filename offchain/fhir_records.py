"""
HL7 FHIR Record Generator for Hack-a-Sol 5.0 (WEB3 - W3-01)
Generates compliant FHIR R4 JSON resources for Patient, Condition (Diagnosis),
and Insurance Coverage without exposing sensitive fields on-chain.
"""

import json
from datetime import datetime

def generate_fhir_record(patient_id="patient-001", hospital_name="St. Jude General Hospital"):
    """
    Creates a standardized HL7 FHIR Bundle containing:
    1. Patient Demographics
    2. Medical Condition (Private Diagnosis)
    3. Procedure (Private Treatment)
    4. Coverage (Insurance Policy Reference)
    """
    timestamp = datetime.utcnow().isoformat() + "Z"

    fhir_bundle = {
        "resourceType": "Bundle",
        "type": "collection",
        "timestamp": timestamp,
        "entry": [
            {
                "fullUrl": f"urn:uuid:{patient_id}",
                "resource": {
                    "resourceType": "Patient",
                    "id": patient_id,
                    "active": True,
                    "name": [{"use": "official", "family": "Doe", "given": ["Alex"]}],
                    "gender": "other",
                    "birthDate": "1992-05-14"
                }
            },
            {
                "fullUrl": "urn:uuid:condition-001",
                "resource": {
                    "resourceType": "Condition",
                    "id": "condition-001",
                    "clinicalStatus": {
                        "coding": [{
                            "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                            "code": "active"
                        }]
                    },
                    "category": [{
                        "coding": [{
                            "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                            "code": "encounter-diagnosis"
                        }]
                    }],
                    "code": {
                        "coding": [{
                            "system": "http://hl7.org/fhir/sid/icd-10-cm",
                            "code": "I10",
                            "display": "Essential (primary) hypertension"
                        }],
                        "text": "Essential Hypertension Stage 1"
                    },
                    "subject": {"reference": f"Patient/{patient_id}"}
                }
            },
            {
                "fullUrl": "urn:uuid:procedure-001",
                "resource": {
                    "resourceType": "Procedure",
                    "id": "procedure-001",
                    "status": "completed",
                    "code": {
                        "coding": [{
                            "system": "http://www.ama-assn.org/go/cpt",
                            "code": "99213",
                            "display": "Office or other outpatient visit, 20-29 minutes"
                        }]
                    },
                    "subject": {"reference": f"Patient/{patient_id}"},
                    "performer": [{"actor": {"display": hospital_name}}]
                }
            },
            {
                "fullUrl": "urn:uuid:coverage-001",
                "resource": {
                    "resourceType": "Coverage",
                    "id": "coverage-001",
                    "status": "active",
                    "beneficiary": {"reference": f"Patient/{patient_id}"},
                    "payor": [{"display": "Decentralized Health Shield Mutual"}],
                    "period": {
                        "start": "2024-01-01",
                        "end": "2030-12-31"
                    }
                }
            }
        ]
    }
    return fhir_bundle

if __name__ == "__main__":
    record = generate_fhir_record()
    print("Generated HL7 FHIR Healthcare Bundle:")
    print(json.dumps(record, indent=2))
