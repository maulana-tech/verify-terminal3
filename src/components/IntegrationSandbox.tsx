"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Coins,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Terminal,
  Unlock,
  UserCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { VendorProfile, VerifiableCredential } from "@/lib/types";

interface IntegrationSandboxProps {
  vendorProfile: VendorProfile | null;
  credential: VerifiableCredential | null;
  isAuthorized: boolean;
  onAutofillDemo?: () => Promise<void>;
}

const TABS = [
  {
    id: "sso" as const,
    label: "B2B SSO Portal",
    icon: UserCheck,
    number: "01",
  },
  {
    id: "payout" as const,
    label: "Escrow Payout",
    icon: CreditCard,
    number: "02",
  },
  {
    id: "lending" as const,
    label: "DeFi Lending Pool",
    icon: Coins,
    number: "03",
  },
];

const SCENARIO_META = {
  sso: {
    title: "Single Sign-On (SSO) Authentication",
    icon: UserCheck,
    description:
      "Enterprise portals require partner verification. Instead of registering password credentials or exposing private vendor databases, the Vendor authenticates using their T3N DID. The portal resolves the identity cryptographically — zero centralized storage.",
    specs: [
      { label: "Provider", value: "Oracle Procurement Enterprise Gateway" },
      { label: "Method", value: "W3C DID Document Resolution" },
      { label: "Protocol", value: "ML-KEM-768 Handshake" },
    ],
  },
  payout: {
    title: "Escrow Smart Contract Automation",
    icon: CreditCard,
    description:
      "Corporate payroll releases funds (USDC) from escrow to the vendor. The contract triggers an enclave check — TEE reads decrypted bank details, confirms sanctions status, and releases funds without exposing raw data to the public ledger.",
    specs: [
      { label: "Contract", value: "EscrowComplianceBroker.sol" },
      { label: "Balance", value: "5,000.00 USDC" },
      { label: "Rule", value: "Active compliance VC mandatory for release" },
    ],
  },
  lending: {
    title: "RWA Institutional Lending Pool",
    icon: Coins,
    description:
      "Aave Institutional Liquidity Pools allow businesses to borrow capital using Real-World Assets. The pool verifies the borrower holds a T3N-signed compliance credential proving they are not on any global sanctions list.",
    specs: [
      { label: "Pool", value: "Aave RWA Institutional USD V3" },
      { label: "Required", value: "T3NComplianceCredential (OFAC: CLEARED)" },
      { label: "Borrow Limit", value: "Up to 50,000.00 USDC" },
    ],
  },
};

export default function IntegrationSandbox({
  vendorProfile,
  credential,
  isAuthorized,
  onAutofillDemo,
}: IntegrationSandboxProps) {
  const [activeTab, setActiveTab] = useState<"sso" | "payout" | "lending">(
    "sso",
  );
  const [statusText, setStatusText] = useState("");
  const [statusType, setStatusType] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);

  const handleSimulate = (type: "sso" | "payout" | "lending") => {
    setIsLoading(true);
    setStatusText("");
    setStatusType("idle");

    setTimeout(() => {
      setIsLoading(false);
      if (type === "sso") {
        if (vendorProfile?.registered) {
          setStatusType("success");
          setStatusText(
            `SSO SUCCESS: Securely logged into Oracle Procurement Network. Resolved Identity DID: "${vendorProfile.did}". Profile verified for representative "${vendorProfile.ownerName}" with zero centralized storage of credentials.`,
          );
        } else {
          setStatusType("error");
          setStatusText(
            "SSO FAILED: No registered decentralized identity (DID) found. Please go to the Vendor panel and register your compliance information first.",
          );
        }
      } else if (type === "payout") {
        if (credential && isAuthorized) {
          setStatusType("success");
          setStatusText(
            `PAYOUT COMPLETED: Escrow Smart Contract unlocked 5,000.00 USDC. TEE Intel TDX enclave decrypted banking details internally to execute direct deposit to "${vendorProfile?.bankName}" (Account: [REDACTED BY TEE]).`,
          );
        } else {
          setStatusType("error");
          setStatusText(
            "PAYOUT BLOCKED: Transaction aborted by Escrow Contract. Reason: Vendor's compliance certificate (VC) is either missing or access authorization has been REVOKED by the vendor.",
          );
        }
      } else if (type === "lending") {
        if (credential && isAuthorized) {
          setStatusType("success");
          setStatusText(
            `LOAN APPROVED: Aave V3 Institutional Borrowing pool unlocked. Verified VC (Subject: ${credential.subjectDid}). Maximum credit limit granted: 50,000.00 USDC at 4.25% APR against Real-World Assets.`,
          );
        } else {
          setStatusType("error");
          setStatusText(
            "LOAN DENIED: Institutional Lending Pool restriction. A valid W3C Compliance VC signed by a whitelisted T3N enclave node is required to access the liquidity pool.",
          );
        }
      }
    }, 1200);
  };

  const scenario = SCENARIO_META[activeTab];
  const ScenarioIcon = scenario.icon;

  return (
    <div className="bg-oxblood/10 border border-gold/15 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-sm -z-10" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-gold/10">
        <div className="flex items-center space-x-3">
          <Activity className="h-5 w-5 text-gold/80" />
          <h2 className="serif text-xl font-light text-bone tracking-wide">
            Real-World Utility Integration Sandbox
          </h2>
        </div>
        <span className="text-[10px] tracking-wider text-gold/60 font-mono uppercase">
          Utility Sandbox
        </span>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-gold/10 px-6 md:px-8 font-mono text-[10px] uppercase tracking-wider">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setStatusText("");
                setStatusType("idle");
              }}
              className={`flex items-center space-x-1.5 pb-3 pt-4 px-4 border-b-2 transition-all cursor-pointer ${
                active
                  ? "border-gold text-gold font-semibold"
                  : "border-transparent text-stone hover:text-bone"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.number}</span>
            </button>
          );
        })}
      </div>

      {/* Body: two-column on large screens, stacked on small */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gold/8">

        {/* LEFT — Scenario Info */}
        <div className="p-6 md:p-8 space-y-5">
          <div className="flex items-center space-x-2 text-gold/80 text-xs font-mono">
            <ScenarioIcon className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{scenario.title}</span>
          </div>

          <p className="text-sm text-stone leading-relaxed font-light">
            {scenario.description}
          </p>

          {/* Spec table */}
          <div className="bg-black/35 border border-gold/8 divide-y divide-gold/5">
            {scenario.specs.map((s) => (
              <div
                key={s.label}
                className="flex items-start justify-between px-4 py-2.5 text-[11px] font-mono"
              >
                <span className="text-stone/60 uppercase tracking-wider text-[9px] pt-0.5 shrink-0 mr-4">
                  {s.label}
                </span>
                <span className="text-bone/80 text-right">{s.value}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleSimulate(activeTab)}
            disabled={isLoading}
            className="w-full sm:w-auto bg-gold hover:bg-gold/90 text-black px-8 py-3 font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Executing Handshake...</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                <span>Run Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT — Console Output */}
        <div className="p-6 md:p-8 flex flex-col space-y-4">
          {/* Console header bar */}
          <div className="flex items-center space-x-2">
            <Terminal className="h-4 w-4 text-gold/50" />
            <span className="text-[10px] font-mono text-stone/60 uppercase tracking-widest">
              Sandbox Console Output
            </span>
          </div>

          {/* Output area */}
          <div className="flex-1 bg-black/55 border border-gold/10 rounded-sm min-h-[260px] flex flex-col">

            {/* Idle */}
            {!isLoading && statusType === "idle" && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full border border-gold/15 flex items-center justify-center">
                  <Terminal className="h-4 w-4 text-gold/30" />
                </div>
                <p className="text-[11px] font-mono text-stone/40 italic leading-relaxed max-w-[240px]">
                  Click &quot;Run Simulation&quot; to execute this identity
                  integration workflow.
                </p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border border-gold/20 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-gold/60 animate-spin" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gold/40 animate-ping" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-[11px] font-mono text-stone uppercase tracking-wider">
                    Resolving credential claims...
                  </p>
                  <p className="text-[10px] font-mono text-stone/40">
                    TEE Enclave handshake in progress
                  </p>
                </div>
              </div>
            )}

            {/* Success */}
            {!isLoading && statusType === "success" && (
              <div className="flex-1 flex flex-col p-5 space-y-4">
                {/* Status badge */}
                <div className="flex items-center space-x-2 bg-verified/8 border border-verified/25 px-4 py-3 rounded-sm">
                  <CheckCircle className="h-4 w-4 text-verified shrink-0" />
                  <span className="text-[11px] font-mono font-semibold text-verified uppercase tracking-wider">
                    Success: Claim Verified
                  </span>
                </div>

                {/* Message body */}
                <div className="flex-1 bg-black/40 border border-verified/10 p-4 rounded-sm">
                  <p className="text-sm font-mono text-bone leading-relaxed">
                    {statusText}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] font-mono text-stone/40 pt-1 border-t border-gold/5">
                  <span>Network: Terminal 3 Testnet</span>
                  <span className="text-verified flex items-center space-x-1">
                    <Unlock className="h-3 w-3" />
                    <span>Access Granted</span>
                  </span>
                </div>
              </div>
            )}

            {/* Error / Blocked */}
            {!isLoading && statusType === "error" && (
              <div className="flex-1 flex flex-col p-5 space-y-4">
                {/* Status badge */}
                <div className="flex items-center space-x-2 bg-red-950/20 border border-red-800/30 px-4 py-3 rounded-sm">
                  <Lock className="h-4 w-4 text-red-400 shrink-0" />
                  <span className="text-[11px] font-mono font-semibold text-red-400 uppercase tracking-wider">
                    Blocked: Compliance Failure
                  </span>
                </div>

                {/* Message body — large, readable */}
                <div className="flex-1 bg-red-950/10 border border-red-900/20 p-5 rounded-sm space-y-3">
                  <div className="flex items-start space-x-2.5">
                    <AlertTriangle className="h-4 w-4 text-red-400/70 shrink-0 mt-0.5" />
                    <p className="text-sm font-mono text-red-200 leading-relaxed">
                      {statusText}
                    </p>
                  </div>

                  {/* Reason breakdown if payout or lending */}
                  {(statusText.includes("PAYOUT BLOCKED") ||
                    statusText.includes("LOAN DENIED")) && (
                    <div className="mt-3 pt-3 border-t border-red-900/20 space-y-1.5 text-[10px] font-mono">
                      <div className="flex items-center space-x-2 text-stone/60">
                        <span className="text-red-500">✗</span>
                        <span>
                          Vendor VC:{" "}
                          <span className="text-red-400">
                            {credential ? "PRESENT" : "MISSING"}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-stone/60">
                        <span className="text-red-500">✗</span>
                        <span>
                          Buyer Authorization:{" "}
                          <span className="text-red-400">
                            {isAuthorized ? "GRANTED" : "REVOKED"}
                          </span>
                        </span>
                      </div>
                      <p className="text-stone/40 pt-1">
                        → Go to Dashboard → Buyer Agent → Verify Vendor to
                        issue a compliance VC.
                      </p>
                    </div>
                  )}
                </div>

                {/* Autofill shortcut for SSO failure */}
                {statusText.includes("SSO FAILED") && onAutofillDemo && (
                  <button
                    type="button"
                    disabled={isAutofilling}
                    onClick={async () => {
                      setIsAutofilling(true);
                      await onAutofillDemo();
                      setIsAutofilling(false);
                    }}
                    className="w-full bg-gold/10 hover:bg-gold/20 text-gold border border-gold/25 px-4 py-3 text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer text-center flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isAutofilling ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Zap className="h-3.5 w-3.5" />
                    )}
                    <span>Quick Autofill &amp; Register Demo Vendor</span>
                  </button>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] font-mono text-stone/40 pt-1 border-t border-gold/5">
                  <span>Network: Terminal 3 Testnet</span>
                  <span className="text-red-400 flex items-center space-x-1">
                    <Lock className="h-3 w-3" />
                    <span>Access Denied</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
