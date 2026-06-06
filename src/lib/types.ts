export interface VendorProfile {
  companyName: string;
  taxId: string;
  ownerName: string;
  passportNumber: string;
  bankName: string;
  bankAccount: string;
  did: string;
  registered: boolean;
  registeredAt?: string;
}

export interface VerifiableCredential {
  id: string;
  subjectDid: string;
  issuerDid: string;
  issuanceDate: string;
  expirationDate: string;
  status: "valid" | "revoked";
  claims: {
    companyName: string;
    country: string;
    sanctionsClear: boolean;
    kycVerified: boolean;
  };
}

export interface AuditEntry {
  index: number;
  timestamp: string;
  txHash: string;
  actorDid: string;
  targetDid: string;
  action: string;
  details: string;
}

export interface SimulationStep {
  id: string;
  title: string;
  description: string;
  status: "idle" | "running" | "success" | "failed";
  timestamp?: string;
}
