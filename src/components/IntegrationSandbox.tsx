"use client";

import {
  Activity,
  Coins,
  CreditCard,
  Lock,
  ShieldCheck,
  Unlock,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import type { VendorProfile, VerifiableCredential } from "@/lib/types";

interface IntegrationSandboxProps {
  vendorProfile: VendorProfile | null;
  credential: VerifiableCredential | null;
  isAuthorized: boolean;
  onAutofillDemo?: () => Promise<void>;
}

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
            `LOAN APPROVED: Aave V3 Institutional Borrowing pool unlocked. verified VC (Subject: ${credential.subjectDid}). Maximum credit limit granted: 50,000.00 USDC at 4.25% APR against Real-World Assets.`,
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

  return (
    <div className="bg-oxblood/10 border border-gold/15 p-6 md:p-8 flex flex-col relative overflow-hidden backdrop-blur-none">
      <div className="absolute inset-0 backdrop-blur-sm -z-10" />

      <div className="flex items-center justify-between pb-4 border-b border-gold/10 mb-6">
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

      <p className="text-xs text-stone font-light leading-relaxed mb-6">
        Simulate how external applications, smart contracts, and finance
        protocols consume the DIDs and Verifiable Credentials (VCs) created
        inside our system. Revoke or grant access in the dashboard to see
        outcomes shift dynamically.
      </p>

      {/* Tabs */}
      <div className="flex border-b border-gold/10 mb-6 font-mono text-[10px] uppercase tracking-wider">
        <button
          type="button"
          onClick={() => {
            setActiveTab("sso");
            setStatusText("");
            setStatusType("idle");
          }}
          className={`pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === "sso"
              ? "border-gold text-gold font-semibold"
              : "border-transparent text-stone hover:text-bone"
          }`}
        >
          1. B2B SSO Portal
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("payout");
            setStatusText("");
            setStatusType("idle");
          }}
          className={`pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === "payout"
              ? "border-gold text-gold font-semibold"
              : "border-transparent text-stone hover:text-bone"
          }`}
        >
          2. Escrow Payout
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("lending");
            setStatusText("");
            setStatusType("idle");
          }}
          className={`pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === "lending"
              ? "border-gold text-gold font-semibold"
              : "border-transparent text-stone hover:text-bone"
          }`}
        >
          3. DeFi Lending Pool
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
        {/* Scenario Details */}
        <div className="md:col-span-3 space-y-4">
          {activeTab === "sso" && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gold/80 text-xs font-mono">
                <UserCheck className="h-4 w-4" />
                <span>Single Sign-On (SSO) Authentication</span>
              </div>
              <p className="text-xs text-stone leading-relaxed font-light">
                Enterprise portals require partner verification. Instead of
                registering password credentials or exposing private vendor
                databases, the Vendor authenticates using their **T3N DID**. The
                portal resolves the identity cryptographically.
              </p>
              <div className="bg-black/35 p-3 border border-gold/5 text-[10px] text-stone/80 font-mono space-y-1">
                <div>Provider: Oracle Procurement Enterprise Gateway</div>
                <div>Method: W3C DID Document Resolution</div>
                <div>Status: Awaiting Handshake Request</div>
              </div>
            </div>
          )}

          {activeTab === "payout" && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gold/80 text-xs font-mono">
                <CreditCard className="h-4 w-4" />
                <span>Escrow Smart Contract Automation</span>
              </div>
              <p className="text-xs text-stone leading-relaxed font-light">
                Corporate payroll releases funds (USDC) from escrow to the
                vendor. To remain compliant, the contract triggers an enclave
                check. The TEE reads the decrypted bank details, confirms
                sanctions status, and releases funds without exposing raw data
                to the public ledger.
              </p>
              <div className="bg-black/35 p-3 border border-gold/5 text-[10px] text-stone/80 font-mono space-y-1">
                <div>Contract: EscrowComplianceBroker.sol</div>
                <div>Balance: 5,000.00 USDC</div>
                <div>Rule: Active compliance VC is mandatory for release</div>
              </div>
            </div>
          )}

          {activeTab === "lending" && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gold/80 text-xs font-mono">
                <Coins className="h-4 w-4" />
                <span>RWA Institutional Lending Pool</span>
              </div>
              <p className="text-xs text-stone leading-relaxed font-light">
                Aave Institutional Liquidity Pools allow businesses to borrow
                capital using Real-World Assets. Before allowing interactions,
                the pool verifies that the borrower holds a T3N-signed
                compliance credential verifying they are not on any global
                sanctions list.
              </p>
              <div className="bg-black/35 p-3 border border-gold/5 text-[10px] text-stone/80 font-mono space-y-1">
                <div>Pool: Aave RWA Institutional USD V3</div>
                <div>Required: T3NComplianceCredential (OFAC: CLEARED)</div>
                <div>Borrow Limit: Up to 50,000.00 USDC</div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSimulate(activeTab)}
            disabled={isLoading}
            className="bg-gold hover:bg-gold/90 text-black px-6 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? "Executing Handshake..." : `Run Simulation`}
          </button>
        </div>

        {/* Console Outputs */}
        <div className="md:col-span-2 border border-gold/10 bg-black/45 p-4 rounded-sm min-h-[180px] flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono text-stone/60 uppercase tracking-wider mb-2 pb-1.5 border-b border-gold/5">
              Sandbox Console Output
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gold/60"></div>
                <span className="text-[10px] font-mono text-stone">
                  Resolving credential claims...
                </span>
              </div>
            )}

            {!isLoading && statusType === "idle" && (
              <div className="text-[10px] font-mono text-stone/40 italic py-4">
                Click &quot;Run Simulation&quot; to execute this identity
                integration workflow.
              </div>
            )}

            {!isLoading && statusType === "success" && (
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-verified text-[10px] font-mono font-semibold uppercase">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Success: Claim Verified</span>
                </div>
                <p className="text-[11px] font-mono text-bone leading-relaxed">
                  {statusText}
                </p>
              </div>
            )}

            {!isLoading && statusType === "error" && (
              <div className="space-y-2.5">
                <div className="flex items-center space-x-1.5 text-red-400 text-[10px] font-mono font-semibold uppercase">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Blocked: Compliance Failure</span>
                </div>
                <p className="text-[11px] font-mono text-red-300 leading-relaxed font-light">
                  {statusText}
                </p>
                {statusText.includes("SSO FAILED") && onAutofillDemo && (
                  <button
                    type="button"
                    onClick={async () => {
                      await onAutofillDemo();
                    }}
                    className="mt-2 w-full bg-gold/15 hover:bg-gold/25 text-gold border border-gold/30 px-3 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer text-center"
                  >
                    Quick Autofill & Register Demo Vendor
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-gold/5 flex justify-between items-center text-[9px] font-mono text-stone/40">
            <span>Network: Terminal 3 Testnet</span>
            {statusType === "success" && (
              <span className="text-verified flex items-center">
                <Unlock className="h-2.5 w-2.5 mr-0.5" /> Checked
              </span>
            )}
            {statusType === "error" && (
              <span className="text-red-400 flex items-center">
                <Lock className="h-2.5 w-2.5 mr-0.5" /> Locked
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
