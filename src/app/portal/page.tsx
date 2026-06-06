"use client";

import { Layers, RefreshCw, ShieldCheck } from "lucide-react";
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

  const [onboardStatus, setOnboardStatus] = useState<
    "idle" | "running" | "success" | "failed"
  >("idle");
  const [onboardError, setOnboardError] = useState("");

  const [steps, setSteps] = useState<SimulationStep[]>(initialSteps);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const vendorRes = await fetch("/api/vendor");
      const vendorData = await vendorRes.json();
      setVendorProfile(vendorData.profile);
      setIsAuthorized(vendorData.isAuthorized);
      setBuyerDid(vendorData.buyerDid);

      const ledgerRes = await fetch("/api/ledger");
      const ledgerData = await ledgerRes.json();
      setLedger(ledgerData.ledger);

      const activeCred = ledgerData.credentials.find(
        (c: VerifiableCredential) => c.subjectDid === vendorData.profile?.did,
      );
      if (activeCred) {
        setCredential(activeCred);
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
      {/* Drifting Gold Background Circle */}
      <div
        aria-hidden
        className="absolute -left-[15%] top-0 w-[55%] h-[65%] rounded-full blur-[160px] opacity-40 pointer-events-none animate-drift-gold z-0"
        style={{
          background:
            "radial-gradient(closest-side, rgba(200,164,93,0.25), transparent 70%)",
        }}
      />

      {/* Drifting Blue Background Circle */}
      <div
        aria-hidden
        className="absolute -right-[10%] top-[30%] w-[50%] h-[60%] pointer-events-none rounded-full blur-[160px] opacity-35 animate-drift-blue z-0"
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
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8 relative z-10">
        {/* Two Dashboard Panels */}
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
          />
        </div>

        {/* Live Simulation Panel */}
        <SimulationPanel
          steps={steps}
          onboardStatus={onboardStatus}
          activeStepIndex={activeStepIndex}
        />

        {/* Cryptographic Audit Ledger */}
        <AuditLedger ledger={ledger} />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gold/10 py-5 bg-black/45 text-center mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-[9px] tracking-widest text-stone/50 uppercase font-mono">
          Powered by Terminal 3 Network Private Execution Nodes · &quot;Access
          does not equal transfer.&quot;
        </div>
      </footer>
    </div>
  );
}
