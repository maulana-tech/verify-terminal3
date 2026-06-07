import type {
  AuditEntry,
  SimulationStep,
  VendorProfile,
  VerifiableCredential,
} from "./types";

// In-memory simulated state variables
let vendorProfile: VendorProfile | null = null;
const credentials: VerifiableCredential[] = [];
const genesisEntry: AuditEntry = {
  index: 1,
  timestamp: new Date(Date.now() - 3600000).toISOString(),
  txHash:
    "0x" +
    Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join(""),
  actorDid: "did:t3n:genesis",
  targetDid: "did:t3n:registry",
  action: "CONTRACT_DEPLOY",
  details: "Deployed tee:user/contracts::vendor-compliance@1.0.0",
};
const ledger: AuditEntry[] = [{ ...genesisEntry }];
const activeDelegations: Record<string, boolean> = {};
// Session ownership token — hanya browser yang register yang boleh restore state
let ownerToken: string | null = null;

export class T3NService {
  private static instance: T3NService;
  private buyerDid = "did:t3n:buyer-corp-0x8f2d";
  private vendorDid = "";
  // biome-ignore lint/suspicious/noExplicitAny: dynamically loaded SDK
  private realClient: any = null;
  private realDid = "";

  private constructor() {}

  public static getInstance(): T3NService {
    if (!T3NService.instance) {
      T3NService.instance = new T3NService();
    }
    return T3NService.instance;
  }

  // Helper to load and initialize real T3nClient dynamically
  private async getRealClient() {
    const privateKey = process.env.T3N_PRIVATE_KEY;
    if (!privateKey) return null;

    if (this.realClient) return this.realClient;

    try {
      console.log("[T3N SDK] Dynamically loading @terminal3/t3n-sdk...");
      const sdk = await import("@terminal3/t3n-sdk");
      sdk.setEnvironment("testnet");
      const wasmComponent = await sdk.loadWasmComponent();
      const address = sdk.eth_get_address(privateKey);

      const client = new sdk.T3nClient({
        wasmComponent,
        handlers: {
          EthSign: sdk.metamask_sign(address, undefined, privateKey),
        },
      });

      this.realClient = client;
      return client;
    } catch (err) {
      console.error("[T3N SDK] Failed to initialize real T3nClient:", err);
      return null;
    }
  }

  // Helper to generate fake TX hash
  private generateTxHash(): string {
    return (
      "0x" +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("")
    );
  }

  // Helper to log to ledger
  private logAudit(
    actor: string,
    target: string,
    action: string,
    details: string,
  ) {
    const entry: AuditEntry = {
      index: ledger.length + 1,
      timestamp: new Date().toISOString(),
      txHash: this.generateTxHash(),
      actorDid: actor,
      targetDid: target,
      action: action,
      details: details,
    };
    ledger.push(entry);
  }

  public getBuyerDid(): string {
    return this.realDid || this.buyerDid;
  }

  public getOwnerToken(): string | null {
    return ownerToken;
  }

  public async getLedger(): Promise<AuditEntry[]> {
    return ledger;
  }

  public async getCredentials(): Promise<VerifiableCredential[]> {
    return credentials;
  }

  public async getVendorProfile(): Promise<VendorProfile | null> {
    return vendorProfile;
  }

  public isAuthorized(buyerDid: string): boolean {
    return !!activeDelegations[buyerDid];
  }

  // Reset semua state ke kondisi awal (unregister)
  public async resetAll(): Promise<void> {
    vendorProfile = null;
    credentials.length = 0;
    ledger.length = 0;
    ledger.push({
      ...genesisEntry,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    });
    for (const key of Object.keys(activeDelegations)) {
      delete activeDelegations[key];
    }
    ownerToken = null;
    this.vendorDid = "";
    this.realDid = "";
  }

  // Handshake with T3N Node
  public async handshake(): Promise<boolean> {
    const client = await this.getRealClient();
    if (client) {
      try {
        console.log("[T3N SDK] Running real testnet handshake...");
        await client.handshake();
        const sdk = await import("@terminal3/t3n-sdk");
        const privateKey = process.env.T3N_PRIVATE_KEY;
        if (!privateKey) throw new Error("Private key missing");
        const address = sdk.eth_get_address(privateKey);

        console.log("[T3N SDK] Authenticating on testnet...");
        const authResult = await client.authenticate(
          sdk.createEthAuthInput(address),
        );
        this.realDid =
          typeof authResult === "string"
            ? authResult
            : authResult?.value || authResult?.toString() || "";
        console.log(
          "[T3N SDK] Real authentication successful. DID:",
          this.realDid,
        );

        this.logAudit(
          "did:t3n:node-testnet",
          "did:t3n:session",
          "SESSION_HANDSHAKE",
          `[REAL SDK] Ephemeral session keys established on T3N testnet with DID: ${this.realDid}`,
        );
        return true;
      } catch (err: unknown) {
        console.error(
          "[T3N SDK] Real handshake failed, falling back to simulator:",
          err instanceof Error ? err.message : err,
        );
      }
    }

    // Simulating T3N Handshake & session key exchange
    await new Promise((resolve) => setTimeout(resolve, 800));
    this.logAudit(
      "did:t3n:node-0x1a",
      "did:t3n:session",
      "SESSION_HANDSHAKE",
      "Established secure session with Intel TDX Enclave",
    );
    return true;
  }

  // Register vendor and encrypt details in Storage Network
  public async registerVendor(
    profileInput: Omit<VendorProfile, "did" | "registered">,
    token?: string,
  ): Promise<VendorProfile> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const did = `did:t3n:vendor-${profileInput.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-0x4a9b`;
    this.vendorDid = did;

    const profile: VendorProfile = {
      ...profileInput,
      did,
      registered: true,
      registeredAt: new Date().toISOString(),
    };

    vendorProfile = profile;
    // Simpan session ownership token
    ownerToken = token || Math.random().toString(36).slice(2) + Date.now().toString(36);
    // By default, grant authorization to the default buyer agent
    activeDelegations[this.buyerDid] = true;

    this.logAudit(
      did,
      "did:t3n:storage",
      "DATA_INGESTION",
      `Uploaded encrypted KYC profiles (ML-KEM 768). Granted access to ${this.buyerDid}`,
    );

    return profile;
  }

  // Revoke data access
  public async revokeAccess(buyerDid: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    activeDelegations[buyerDid] = false;

    this.logAudit(
      this.vendorDid || "did:t3n:vendor-0x4a9b",
      buyerDid,
      "ACCESS_REVOCATION",
      "Revoked data-token delegation parameters for Buyer Agent",
    );

    return true;
  }

  // Enable data access again
  public async grantAccess(buyerDid: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    activeDelegations[buyerDid] = true;

    this.logAudit(
      this.vendorDid || "did:t3n:vendor-0x4a9b",
      buyerDid,
      "ACCESS_GRANT",
      "Granted data-token delegation parameters to Buyer Agent",
    );

    return true;
  }

  // Execute onboarding simulation with detailed event streaming callback
  public async executeOnboarding(
    vendorDid: string,
    buyerDid: string,
    onStep: (step: SimulationStep) => void,
  ): Promise<VerifiableCredential> {
    const step = (
      id: string,
      title: string,
      desc: string,
      status: SimulationStep["status"],
    ) => {
      onStep({
        id,
        title,
        description: desc,
        status,
        timestamp: new Date().toISOString(),
      });
    };

    // Step 1: Handshake
    step(
      "handshake",
      "Secure Handshake",
      "Initiating connection to T3N node and exchanging ephemeral session keys...",
      "running",
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
    step(
      "handshake",
      "Secure Handshake",
      "Established secure session. Ephemeral keys locked in TEE memory.",
      "success",
    );

    // Step 2: Auth checks
    step(
      "auth",
      "Identity Authentication",
      "Resolving decentralized identifiers (DIDs) and validating delegation tokens...",
      "running",
    );
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!this.isAuthorized(buyerDid)) {
      step(
        "auth",
        "Identity Authentication",
        "Verification failed: Access has been revoked by the vendor.",
        "failed",
      );
      this.logAudit(
        buyerDid,
        vendorDid,
        "ONBOARDING_REJECTED",
        "Onboarding failed due to missing authorization token",
      );
      throw new Error(
        "Access denied: Vendor has revoked authorization for this Buyer Agent.",
      );
    }
    step(
      "auth",
      "Identity Authentication",
      "Delegation tokens verified. Buyer Agent authorized to trigger TEE contract.",
      "success",
    );

    // Step 3: Decrypt
    step(
      "decrypt",
      "TEE Enclave Decryption",
      "Mounting Intel TDX secure enclave and decrypting vendor profile from IPFS (ML-KEM 768)...",
      "running",
    );
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const profile = vendorProfile;
    if (!profile) {
      step(
        "decrypt",
        "TEE Enclave Decryption",
        "Verification failed: No encrypted vendor profile found in decentralized storage.",
        "failed",
      );
      throw new Error("No vendor profile registered.");
    }
    step(
      "decrypt",
      "TEE Enclave Decryption",
      "Documents decrypted successfully inside isolated TEE memory space.",
      "success",
    );

    // Step 4: Sanctions check (mock HTTP whitelisted check)
    step(
      "sanctions",
      "Sanctions Screening",
      "Invoking whitelisted HTTPS endpoint to verify company against international databases (OFAC, UN lists)...",
      "running",
    );
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulating the external sanctions API result
    const isSanctioned = profile.companyName
      .toLowerCase()
      .includes("sanctioned");
    if (isSanctioned) {
      step(
        "sanctions",
        "Sanctions Screening",
        "Sanctions screening returned positive match: Company matches OFAC SDN list.",
        "failed",
      );
      this.logAudit(
        "did:t3n:tee-contract",
        vendorDid,
        "SANCTIONS_SCREENING_FAILED",
        "Vendor company matched sanctions list",
      );
      throw new Error(
        "Compliance check failed: Company is matched on the sanctions list.",
      );
    }
    step(
      "sanctions",
      "Sanctions Screening",
      "Sanctions screening completed: Clear (No matching entries found).",
      "success",
    );

    // Step 5: Document completeness & policy verification
    step(
      "policy",
      "Policy Validation",
      "Evaluating vendor profile for compliance with enterprise requirements...",
      "running",
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const hasKyc =
      profile.passportNumber && profile.taxId && profile.bankAccount;
    if (!hasKyc) {
      step(
        "policy",
        "Policy Validation",
        "Compliance check failed: Missing required fields (Passport or Tax ID).",
        "failed",
      );
      throw new Error("Compliance check failed: Missing required fields.");
    }
    step(
      "policy",
      "Policy Validation",
      "Policy validated. Company verification, representative KYC, and banking fields are complete.",
      "success",
    );

    // Step 6: Verifiable Credential issuance & Block commit
    step(
      "credential",
      "VC Issuance & Ledger Commit",
      "Generating W3C Smart Verifiable Credential (SVC) and writing audit trail to blockchain...",
      "running",
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const credId = `vc:t3n:compliance-${Math.floor(Math.random() * 1000000)}`;
    const newCredential: VerifiableCredential = {
      id: credId,
      subjectDid: vendorDid,
      issuerDid: "did:t3n:tee-contract-0x92f1",
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 1 year
      status: "valid",
      claims: {
        companyName: profile.companyName,
        country: "US", // default or resolved from profile
        sanctionsClear: true,
        kycVerified: true,
      },
    };

    // Save credential
    // Replace if exists
    const idx = credentials.findIndex((c) => c.subjectDid === vendorDid);
    if (idx >= 0) {
      credentials[idx] = newCredential;
    } else {
      credentials.push(newCredential);
    }

    this.logAudit(
      "did:t3n:tee-contract-0x92f1",
      buyerDid,
      "CREDENTIAL_ISSUANCE",
      `Issued Verifiable Credential ${credId} verifying compliance status for vendor ${vendorDid}`,
    );

    step(
      "credential",
      "VC Issuance & Ledger Commit",
      "Onboarding complete. Verifiable Credential delivered to Buyer Agent. Block committed.",
      "success",
    );

    return newCredential;
  }
}
