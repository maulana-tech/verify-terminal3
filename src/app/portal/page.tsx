"use client";

import {
  Database,
  FileText,
  Layers,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AuditLedger from "@/components/AuditLedger";
import BuyerDashboard from "@/components/BuyerDashboard";
import SimulationPanel from "@/components/SimulationPanel";
import VendorDashboard from "@/components/VendorDashboard";
import type {
  AuditEntry,
  SimulationStep,
  VendorProfile,
  VerifiableCredential,
} from "@/lib/types";

const initialSteps: SimulationStep[] = [
  {
    id: "handshake",
    title: "Secure Handshake",
    description:
      "Initiating connection to T3N node and exchanging session keys...",
    status: "idle",
  },
  {
    id: "auth",
    title: "Identity Authentication",
    description:
      "Resolving decentralized identifiers (DIDs) and validating delegation tokens...",
    status: "idle",
  },
  {
    id: "decrypt",
    title: "TEE Enclave Decryption",
    description:
      "Mounting Intel TDX secure enclave and decrypting vendor profile from storage...",
    status: "idle",
  },
  {
    id: "sanctions",
    title: "Sanctions Screening",
    description:
      "Invoking whitelisted HTTPS endpoint to check sanctions list...",
    status: "idle",
  },
  {
    id: "policy",
    title: "Policy Validation",
    description:
      "Evaluating vendor profile for compliance with enterprise requirements...",
    status: "idle",
  },
  {
    id: "credential",
    title: "VC Issuance & Ledger Commit",
    description:
      "Generating W3C Smart Verifiable Credential (SVC) and writing audit trail...",
    status: "idle",
  },
];

export default function PortalPage() {
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(
    null,
  );
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [buyerDid, setBuyerDid] = useState("did:t3n:buyer-corp-0x8f2d");

  const [credential, setCredential] = useState<VerifiableCredential | null>(
    null,
  );
  const [ledger, setLedger] = useState<AuditEntry[]>([]);

  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [selectedVc, setSelectedVc] = useState<VerifiableCredential | null>(
    null,
  );

  const getRawTransactionJson = (entry: AuditEntry) => {
    return JSON.stringify(
      {
        blockIndex: entry.index,
        timestamp: entry.timestamp,
        txHash: entry.txHash,
        protocol: "T3N_AGENT_AUTH_v1.0",
        network: "t3n-testnet-public",
        enclave_attestation: {
          cpu_secure_mode: "Intel TDX (Trust Domain Extensions)",
          enclave_hash: `0x${entry.txHash.slice(2, 42)}f8a2`,
          measurement_status: "PASSED",
        },
        payload: {
          sender: entry.actorDid,
          recipient: entry.targetDid,
          action: entry.action,
          details: entry.details,
          handshake_cipher: "ML-KEM-768",
        },
      },
      null,
      2,
    );
  };

  const getRawVcAwardJson = (cred: VerifiableCredential) => {
    return JSON.stringify(
      {
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://t3n.network/contexts/compliance/v1",
        ],
        id: cred.id,
        type: ["VerifiableCredential", "T3NComplianceCredential"],
        issuer: cred.issuerDid,
        issuanceDate: cred.issuanceDate,
        expirationDate: cred.expirationDate,
        credentialSubject: {
          id: cred.subjectDid,
          complianceStatus: "CLEARED",
          sanctionsVerification: {
            status: "PASSED",
            checkedDatabases: ["OFAC_SDN", "EU_CFSP", "UN_SDN"],
            timestamp: cred.issuanceDate,
          },
          kycVerification: {
            status: "VERIFIED",
            claimsAttested: [
              "companyName",
              "taxId",
              "passportId",
              "bankAccount",
            ],
          },
        },
        proof: {
          type: "TeeEnclaveSignature2026",
          created: cred.issuanceDate,
          proofPurpose: "assertionMethod",
          verificationMethod: `${cred.issuerDid}#key-1`,
          jws: "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19...f8a292f1",
        },
      },
      null,
      2,
    );
  };

  const [onboardStatus, setOnboardStatus] = useState<
    "idle" | "running" | "success" | "failed"
  >("idle");
  const [onboardError, setOnboardError] = useState("");

  const [steps, setSteps] = useState<SimulationStep[]>(initialSteps);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data with localStorage sync to handle Vercel serverless cold starts
  const fetchData = useCallback(async () => {
    try {
      // 1. Try to load from localStorage first
      let localProfile: VendorProfile | null = null;
      let localAuth = false;
      let localCred: VerifiableCredential | null = null;
      let localLedger: AuditEntry[] = [];

      if (typeof window !== "undefined") {
        const p = localStorage.getItem("t3n_vendor_profile");
        const a = localStorage.getItem("t3n_is_authorized");
        const c = localStorage.getItem("t3n_credential");
        const l = localStorage.getItem("t3n_ledger");

        if (p) localProfile = JSON.parse(p);
        localAuth = a === "true";
        if (c) localCred = JSON.parse(c);
        if (l) localLedger = JSON.parse(l);
      }

      const vendorRes = await fetch("/api/vendor");
      const vendorData = await vendorRes.json();

      // If server-side is empty, but we have client-side data, restore it on the server
      if (!vendorData.profile && localProfile) {
        // Restore vendor profile on serverless memory
        await fetch("/api/vendor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(localProfile),
        });

        // Restore authorization status
        if (localAuth) {
          await fetch("/api/revoke", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "grant" }),
          });
        }

        // Re-fetch to synchronize state
        const refetchRes = await fetch("/api/vendor");
        const refetchData = await refetchRes.json();
        setVendorProfile(refetchData.profile);
        setIsAuthorized(refetchData.isAuthorized);
      } else {
        // Use server data and update localStorage
        setVendorProfile(vendorData.profile);
        setIsAuthorized(vendorData.isAuthorized);

        if (vendorData.profile) {
          localStorage.setItem(
            "t3n_vendor_profile",
            JSON.stringify(vendorData.profile),
          );
        } else {
          localStorage.removeItem("t3n_vendor_profile");
        }
        localStorage.setItem(
          "t3n_is_authorized",
          String(vendorData.isAuthorized),
        );
      }

      setBuyerDid(vendorData.buyerDid);

      const ledgerRes = await fetch("/api/ledger");
      const ledgerData = await ledgerRes.json();

      setLedger(ledgerData.ledger);
      if (ledgerData.ledger && ledgerData.ledger.length > 0) {
        localStorage.setItem("t3n_ledger", JSON.stringify(ledgerData.ledger));
      } else if (localLedger && localLedger.length > 0) {
        setLedger(localLedger);
      }

      const activeCred = ledgerData.credentials.find(
        (c: VerifiableCredential) =>
          c.subjectDid === (vendorData.profile?.did || localProfile?.did),
      );
      if (activeCred) {
        setCredential(activeCred);
        localStorage.setItem("t3n_credential", JSON.stringify(activeCred));
        setOnboardStatus("success");
      } else if (localCred) {
        setCredential(localCred);
        localStorage.setItem("t3n_credential", JSON.stringify(localCred));
        setOnboardStatus("success");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegister = async (
    profileData: Omit<VendorProfile, "did" | "registered">,
  ) => {
    const res = await fetch("/api/vendor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to register vendor profile");
    }

    // Reset buyer side when vendor details change
    setCredential(null);
    setOnboardStatus("idle");
    setOnboardError("");
    setSteps(initialSteps);
    setActiveStepIndex(-1);

    await fetchData();
  };

  const handleToggleAccess = async (action: "revoke" | "grant") => {
    const res = await fetch("/api/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Action failed");
    }

    await fetchData();
  };

  const handleTriggerOnboard = async (vendorDid: string) => {
    setOnboardStatus("running");
    setOnboardError("");
    setSteps(initialSteps.map((s) => ({ ...s, status: "idle" })));
    setActiveStepIndex(-1);
    setCredential(null);

    const eventSource = new EventSource(
      `/api/onboard?vendorDid=${encodeURIComponent(vendorDid)}&buyerDid=${encodeURIComponent(buyerDid)}`,
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "step") {
          const stepData: SimulationStep = data.step;
          setSteps((prevSteps) =>
            prevSteps.map((s) => (s.id === stepData.id ? stepData : s)),
          );

          const idx = initialSteps.findIndex((s) => s.id === stepData.id);
          setActiveStepIndex(idx);
        } else if (data.type === "complete") {
          setCredential(data.credential);
          localStorage.setItem(
            "t3n_credential",
            JSON.stringify(data.credential),
          );
          setOnboardStatus("success");
          eventSource.close();
          fetchData(); // Refresh ledger
        } else if (data.type === "error") {
          setOnboardError(data.message);
          setOnboardStatus("failed");

          // Mark running steps as failed
          setSteps((prevSteps) =>
            prevSteps.map((s) =>
              s.status === "running" ? { ...s, status: "failed" } : s,
            ),
          );

          eventSource.close();
          fetchData(); // Refresh ledger
        }
      } catch (err) {
        console.error("Error parsing SSE event:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      setOnboardError("Lost connection to the T3N enclave service.");
      setOnboardStatus("failed");
      eventSource.close();
      fetchData();
    };
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-black flex flex-col items-center justify-center space-y-4 min-h-screen">
        <RefreshCw className="h-8 w-8 text-gold animate-spin" />
        <span className="text-xs font-mono tracking-wider text-stone uppercase">
          Loading VendorVerify Agent Kit...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#050505] text-bone flex flex-col relative overflow-x-hidden min-h-screen">
      {/* Static Background Glows to optimize performance */}
      <div
        aria-hidden
        className="absolute -left-[15%] top-0 w-[55%] h-[65%] rounded-full blur-[160px] opacity-25 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(closest-side, rgba(200,164,93,0.25), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -right-[10%] top-[30%] w-[50%] h-[60%] pointer-events-none rounded-full blur-[160px] opacity-20 z-0"
        style={{
          background:
            "radial-gradient(closest-side, rgba(77,140,255,0.18), transparent 70%)",
        }}
      />

      {/* Global Navigation Header */}
      <header className="border-b border-gold/15 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-3.5 group cursor-pointer"
          >
            <div className="bg-oxblood border border-gold/25 p-2 rounded-sm group-hover:border-gold/50 transition-colors">
              <Layers className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h1 className="serif text-lg font-light text-bone tracking-wide group-hover:text-gold transition-colors">
                VendorVerify Agent
              </h1>
              <p className="text-[9px] text-stone tracking-[0.2em] font-mono uppercase mt-0.5">
                Terminal 3 ADK Trust Broker System
              </p>
            </div>
          </Link>

          {/* Navigation Links inside Header */}
          <div className="flex items-center space-x-8">
            <nav className="hidden md:flex items-center space-x-6 text-[10px] tracking-[0.2em] uppercase font-mono">
              <Link
                href="/portal"
                className="text-gold font-semibold border-b border-gold pb-1 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/portal/sandbox"
                className="text-stone hover:text-gold transition-colors"
              >
                Utility Sandbox
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-[10px] tracking-[0.2em] uppercase text-stone hover:text-gold border border-gold/20 hover:border-gold/50 px-4 py-1.5 transition-all font-mono"
              >
                ← Back to Site
              </Link>
              <div className="flex items-center space-x-2 text-[10px] font-mono px-3 py-1.5 bg-black border border-gold/15 rounded-sm">
                <ShieldCheck className="h-4 w-4 text-verified shrink-0" />
                <span className="text-stone">
                  T3N: <span className="text-gold">testnet</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8 relative z-10">
        {/* Two Dashboard Panels side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <VendorDashboard
            profile={vendorProfile}
            isAuthorized={isAuthorized}
            buyerDid={buyerDid}
            onRegister={handleRegister}
            onToggleAccess={handleToggleAccess}
          />
          <BuyerDashboard
            buyerDid={buyerDid}
            vendorProfile={vendorProfile}
            credential={credential}
            onboardStatus={onboardStatus}
            onboardError={onboardError}
            onTriggerOnboard={handleTriggerOnboard}
            onInspectVc={setSelectedVc}
          />
        </div>

        {/* Live Simulation Panel */}
        <SimulationPanel
          steps={steps}
          onboardStatus={onboardStatus}
          activeStepIndex={activeStepIndex}
        />

        {/* Cryptographic Audit Ledger */}
        <AuditLedger ledger={ledger} onInspectEntry={setSelectedEntry} />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gold/10 py-5 bg-black/45 text-center mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-[9px] tracking-widest text-stone/50 uppercase font-mono">
          Powered by Terminal 3 Network Private Execution Nodes · &quot;Access
          does not equal transfer.&quot;
        </div>
      </footer>

      {/* Audit Block Details Drawer (Full Viewport Height) */}
      {selectedEntry && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-xs">
          <button
            type="button"
            className="absolute inset-0 cursor-pointer w-full h-full bg-transparent border-0 outline-none"
            onClick={() => setSelectedEntry(null)}
            aria-label="Close"
          />

          <div className="relative w-full max-w-lg bg-[#050505] border-l border-gold/20 h-full flex flex-col shadow-2xl z-[101] animate-slide-in">
            <span className="absolute -top-px -left-px w-4 h-4 border-t border-l border-gold/40" />
            <span className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-gold/40" />

            <div className="flex items-center justify-between px-6 py-5 border-b border-gold/15 shrink-0 bg-black/40">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-gold" />
                <h3 className="serif text-bone text-lg font-light tracking-wide">
                  Block #{String(selectedEntry.index).padStart(3, "0")} Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="text-stone hover:text-gold transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="space-y-3.5 font-mono text-[11px] bg-black/45 p-4 border border-gold/10 rounded-sm">
                <div>
                  <span className="text-stone/60 block mb-0.5 uppercase tracking-wider text-[9px]">
                    ACTION TYPE
                  </span>
                  <span className="text-gold font-semibold uppercase">
                    {selectedEntry.action}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-gold/5">
                  <span className="text-stone/60 block mb-0.5 uppercase tracking-wider text-[9px]">
                    TIMESTAMP
                  </span>
                  <span className="text-bone">
                    {new Date(selectedEntry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-gold/5">
                  <span className="text-stone/60 block mb-0.5 uppercase tracking-wider text-[9px]">
                    TRANSACTION HASH
                  </span>
                  <span className="text-bone break-all">
                    {selectedEntry.txHash}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-gold/5">
                  <span className="text-stone/60 block mb-0.5 uppercase tracking-wider text-[9px]">
                    SENDER (ACTOR) DID
                  </span>
                  <span className="text-bone break-all">
                    {selectedEntry.actorDid}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-gold/5">
                  <span className="text-stone/60 block mb-0.5 uppercase tracking-wider text-[9px]">
                    RECIPIENT (TARGET) DID
                  </span>
                  <span className="text-bone break-all">
                    {selectedEntry.targetDid}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-mono tracking-wider text-gold/80 uppercase mb-2">
                  Execution attestation
                </h4>
                <div className="bg-oxblood/20 border border-gold/15 p-4 text-xs font-light text-bone leading-relaxed">
                  {selectedEntry.details}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-mono tracking-wider text-gold/80 uppercase mb-2">
                  Decentralized Ledger Block JSON
                </h4>
                <pre className="bg-black/80 border border-gold/10 p-4 rounded-sm text-[10px] font-mono text-gold/90 overflow-x-auto max-h-[35vh] leading-normal select-all">
                  {getRawTransactionJson(selectedEntry)}
                </pre>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gold/15 bg-black/45 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="text-[11px] font-mono tracking-widest uppercase text-gold border border-gold/40 hover:border-gold hover:bg-gold/5 px-6 py-2.5 transition-all cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verifiable Credential Drawer (Full Viewport Height) */}
      {selectedVc && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-xs">
          <button
            type="button"
            className="absolute inset-0 cursor-pointer w-full h-full bg-transparent border-0 outline-none"
            onClick={() => setSelectedVc(null)}
            aria-label="Close"
          />

          <div className="relative w-full max-w-lg bg-[#050505] border-l border-gold/20 h-full flex flex-col shadow-2xl z-[101] animate-slide-in">
            <span className="absolute -top-px -left-px w-4 h-4 border-t border-l border-gold/40" />
            <span className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-gold/40" />

            <div className="flex items-center justify-between px-6 py-5 border-b border-gold/15 shrink-0 bg-black/40">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gold" />
                <h3 className="serif text-bone text-lg font-light tracking-wide">
                  Smart Verifiable Credential (W3C JSON-LD)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVc(null)}
                className="text-stone hover:text-gold transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="font-sans text-xs text-stone font-light leading-relaxed">
                This signed payload is generated inside the Intel TDX TEE
                enclave node and committed to the on-chain registry. Any
                enterprise counterparty can resolve this standard JSON-LD W3C
                format using standard DID resolvers.
              </div>

              <pre className="bg-black/80 border border-gold/10 p-4 rounded-sm text-[10px] font-mono text-gold/90 overflow-x-auto max-h-[50vh] leading-normal select-all">
                {getRawVcAwardJson(selectedVc)}
              </pre>
            </div>

            <div className="px-6 py-4 border-t border-gold/15 bg-black/45 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedVc(null)}
                className="text-[11px] font-mono tracking-widest uppercase text-gold border border-gold/40 hover:border-gold hover:bg-gold/5 px-6 py-2.5 transition-all cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
