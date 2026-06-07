"use client";

import {
  Activity,
  CheckCircle,
  Clock,
  FileText,
  Globe,
  Shield,
  ShieldAlert,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { VendorProfile, VerifiableCredential } from "@/lib/types";

interface BuyerDashboardProps {
  buyerDid: string;
  vendorProfile: VendorProfile | null;
  credential: VerifiableCredential | null;
  onboardStatus: "idle" | "running" | "success" | "failed";
  onboardError: string;
  onTriggerOnboard: (vendorDid: string) => Promise<void>;
}

export default function BuyerDashboard({
  buyerDid,
  vendorProfile,
  credential,
  onboardStatus,
  onboardError,
  onTriggerOnboard,
}: BuyerDashboardProps) {
  const [inputDid, setInputDid] = useState("");
  const [simulatedYield, setSimulatedYield] = useState(0.0);

  useEffect(() => {
    if (onboardStatus !== "success") {
      setSimulatedYield(0.0);
      return;
    }
    const interval = setInterval(() => {
      setSimulatedYield((y) => y + 0.000027);
    }, 150);
    return () => clearInterval(interval);
  }, [onboardStatus]);

  const handleUseRegisteredVendor = () => {
    if (vendorProfile?.did) {
      setInputDid(vendorProfile.did);
    }
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetDid = inputDid || vendorProfile?.did;
    if (!targetDid) return;
    onTriggerOnboard(targetDid);
  };

  return (
    <div className="bg-oxblood/10 border border-gold/15 p-6 md:p-8 flex flex-col h-full justify-between backdrop-blur-sm">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-gold/10">
          <div className="flex items-center space-x-3">
            <Globe className="h-5 w-5 text-gold/80" />
            <h2 className="serif text-xl font-light text-bone tracking-wide">
              Buyer Compliance Dashboard
            </h2>
          </div>
          <span className="text-[10px] tracking-[0.32em] uppercase text-gold/60 font-mono">
            Buyer Agent
          </span>
        </div>

        <div className="mt-6 space-y-5">
          {/* Buyer DID Card */}
          <div className="bg-black/45 p-4 border border-gold/10 rounded-sm">
            <div className="flex items-center space-x-2 text-gold/70 text-[10px] tracking-wider uppercase font-mono mb-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>Enterprise Identity (DID)</span>
            </div>
            <div className="text-xs font-mono text-bone break-all select-all leading-relaxed">
              {buyerDid}
            </div>
          </div>

          {/* Trigger Section */}
          <form onSubmit={handleOnboardSubmit} className="space-y-3">
            <div className="flex justify-between items-center">
              <label
                htmlFor="vendor-did-input"
                className="text-[10px] font-mono tracking-wider text-gold/80 uppercase"
              >
                Initiate Compliance Onboarding
              </label>
              {vendorProfile?.did && vendorProfile.did !== inputDid && (
                <button
                  type="button"
                  onClick={handleUseRegisteredVendor}
                  className="text-[9px] font-mono text-stone hover:text-gold border border-gold/10 px-2 py-0.5 transition-colors cursor-pointer"
                >
                  Use Registered Vendor DID
                </button>
              )}
            </div>

            <div className="flex space-x-2">
              <input
                id="vendor-did-input"
                type="text"
                placeholder="Enter Vendor's did:t3n:..."
                value={inputDid}
                onChange={(e) => setInputDid(e.target.value)}
                className="flex-1 bg-black/60 border border-gold/15 px-3 py-2 text-xs text-bone focus:outline-none focus:border-gold/45 font-mono"
              />
              <button
                type="submit"
                disabled={
                  onboardStatus === "running" ||
                  (!inputDid && !vendorProfile?.did)
                }
                className="bg-gold hover:bg-gold/90 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-mono tracking-wide text-xs px-4 py-2 transition-colors cursor-pointer"
              >
                {onboardStatus === "running" ? "Verifying..." : "Verify Vendor"}
              </button>
            </div>
          </form>

          {/* Verification Result Section */}
          {onboardStatus !== "idle" && (
            <div className="space-y-4 pt-2">
              <h3 className="text-[10px] font-mono tracking-wider text-gold/80 uppercase">
                Verification Verdict
              </h3>

              {onboardStatus === "running" && (
                <div className="bg-black/45 border border-gold/10 p-6 rounded-sm flex flex-col items-center justify-center space-y-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold/60"></div>
                  <span className="text-xs text-stone font-mono">
                    Running TEE Compliance Contract...
                  </span>
                </div>
              )}

              {onboardStatus === "failed" && (
                <div className="bg-red-950/15 border border-red-900/30 p-4 rounded-sm space-y-2">
                  <div className="flex items-center space-x-2 text-red-400 text-xs font-semibold uppercase tracking-wider font-mono">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>Compliance Blocked</span>
                  </div>
                  <p className="text-xs text-red-300 font-mono pl-6 leading-relaxed">
                    {onboardError}
                  </p>
                </div>
              )}

              {onboardStatus === "success" && credential && (
                <div className="space-y-3">
                  {/* Status Banner */}
                  <div className="bg-verified/10 border border-verified/30 p-4 rounded-sm flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-verified shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-verified uppercase tracking-wider font-mono">
                        Identity Sealed
                      </div>
                      <div className="text-[11px] text-stone mt-0.5 leading-relaxed font-light">
                        Verifiable Credential generated and signed inside the
                        TDX TEE enclave.
                      </div>
                    </div>
                  </div>

                  {/* VC Inspection Card */}
                  <div className="bg-black/40 border border-gold/10 rounded-sm p-4 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-gold/5">
                      <div className="flex items-center space-x-1.5 text-gold/80 text-xs font-mono">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Verifiable Credential</span>
                      </div>
                      <span className="text-[9px] font-mono text-stone tracking-wide uppercase">
                        {credential.id}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-light">
                      <div className="flex justify-between items-center">
                        <span className="text-stone">Subject DID</span>
                        <span className="font-mono text-bone max-w-[200px] truncate select-all">
                          {credential.subjectDid}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone">Issuer DID</span>
                        <span className="font-mono text-stone max-w-[200px] truncate">
                          {credential.issuerDid}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone">Issued On</span>
                        <span className="font-mono text-bone flex items-center space-x-1">
                          <Clock className="h-3 w-3 mr-0.5 text-stone" />
                          {new Date(credential.issuanceDate).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Claims Redaction Demo */}
                    <div className="bg-[#0c0c0e]/95 border border-gold/5 p-3.5 rounded-sm space-y-2">
                      <div className="flex items-center justify-between text-[9px] font-semibold text-gold/80 uppercase tracking-wider font-mono pb-1 border-b border-gold/5">
                        <span>Attested Claims</span>
                        <span className="text-verified text-[8px] font-mono border border-verified/20 bg-verified/5 px-1.5 py-0.5 rounded-sm animate-seal-pulse">
                          TEE Secure Verified
                        </span>
                      </div>

                      <div className="space-y-2.5 text-[11px] font-light">
                        <div className="flex justify-between items-center">
                          <span className="text-stone">Legal Company Name</span>
                          <span className="font-mono text-bone font-semibold">
                            {credential.claims.companyName}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-stone">
                            Sanctions Screening
                          </span>
                          <span className="text-verified font-mono">
                            CLEARED (OFAC Checked)
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-stone">KYC Verification</span>
                          <span className="text-verified font-mono">
                            VERIFIED (Representative Clear)
                          </span>
                        </div>

                        <div className="pt-2.5 border-t border-gold/5 space-y-2 text-stone/50 font-mono text-[10px]">
                          <div className="flex justify-between">
                            <span>Tax ID Number</span>
                            <span className="text-gold/50">
                              [REDACTED (TE-SECURE)]
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Passport ID</span>
                            <span className="text-gold/50">
                              [REDACTED (TE-SECURE)]
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bank Account Details</span>
                            <span className="text-gold/50">
                              [REDACTED (TE-SECURE)]
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agent Escrow & Yield Automation Card */}
                  <div className="bg-oxblood/20 border border-gold/25 rounded-sm p-4 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between pb-2 border-b border-gold/10">
                      <div className="flex items-center space-x-1.5 text-gold/90 text-xs font-mono">
                        <Activity className="h-3.5 w-3.5 text-gold" />
                        <span>Agent Escrow & Automation</span>
                      </div>
                      <span className="text-[8px] font-mono border border-gold/30 text-gold bg-gold/5 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-semibold">
                        APY Active
                      </span>
                    </div>

                    <div className="space-y-3 font-mono text-[10px]">
                      <div className="flex justify-between items-center text-stone">
                        <span>Locked Escrow Balance</span>
                        <span className="text-bone font-semibold">
                          5,000.00 USDC
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-stone">
                        <span>Yield Optimizer Protocol</span>
                        <span className="text-gold">
                          Aave V3 Escrow Optimizer
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-stone">
                        <span>Current Escrow Yield</span>
                        <span className="text-verified font-bold">
                          5.42% APY
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-stone bg-black/45 p-2 rounded-sm border border-gold/5">
                        <span className="flex items-center">
                          <TrendingUp className="h-3 w-3 text-verified mr-1" />
                          Accrued Yield
                        </span>
                        <span className="text-verified font-bold">
                          {simulatedYield.toFixed(6)} USDC
                        </span>
                      </div>

                      <div className="pt-2 border-t border-gold/5 flex flex-col space-y-1.5 text-stone/75 leading-relaxed">
                        <div className="flex items-center space-x-2 text-[9px] text-verified">
                          <span className="h-1.5 w-1.5 rounded-full bg-verified animate-ping" />
                          <span>Auto-Payout Agent: Active</span>
                        </div>
                        <div className="text-[9px]">
                          Payout triggers automatically on the 1st of every
                          month subject to T3N continuous compliance check.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-3 bg-black/20 border border-gold/10 text-[10px] leading-relaxed text-stone flex items-start space-x-2 font-light">
        <UserCheck className="h-4 w-4 text-gold/70 shrink-0 mt-0.5" />
        <span>
          Compliance checks verify the counterparty DID directly against
          whitelist rules inside isolated Intel TDX CPU enclaves. The Buyer
          Agent receives only the cryptographic proof.
        </span>
      </div>
    </div>
  );
}
