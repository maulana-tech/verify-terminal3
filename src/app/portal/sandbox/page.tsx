"use client";

import { Layers, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import IntegrationSandbox from "@/components/IntegrationSandbox";
import type { VendorProfile, VerifiableCredential } from "@/lib/types";

export default function SandboxPage() {
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(
    null,
  );
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [_buyerDid, setBuyerDid] = useState("did:t3n:buyer-corp-0x8f2d");
  const [credential, setCredential] = useState<VerifiableCredential | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const vendorRes = await fetch("/api/vendor");
      const vendorData = await vendorRes.json();
      setVendorProfile(vendorData.profile);
      setIsAuthorized(vendorData.isAuthorized);
      setBuyerDid(vendorData.buyerDid);

      const ledgerRes = await fetch("/api/ledger");
      const ledgerData = await ledgerRes.json();

      const activeCred = ledgerData.credentials.find(
        (c: VerifiableCredential) => c.subjectDid === vendorData.profile?.did,
      );
      if (activeCred) {
        setCredential(activeCred);
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

  if (isLoading) {
    return (
      <div className="flex-1 bg-black flex flex-col items-center justify-center space-y-4 min-h-screen">
        <RefreshCw className="h-8 w-8 text-gold animate-spin" />
        <span className="text-xs font-mono tracking-wider text-stone uppercase">
          Loading Integration Sandbox...
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
                className="text-stone hover:text-gold transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/portal/sandbox"
                className="text-gold font-semibold border-b border-gold pb-1 transition-colors"
              >
                Utility Sandbox
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link
                href="/portal"
                className="text-[10px] tracking-[0.2em] uppercase text-stone hover:text-gold border border-gold/20 hover:border-gold/50 px-4 py-1.5 transition-all font-mono"
              >
                ← Back to Dashboard
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
        <div className="mb-4">
          <span className="text-[10px] text-gold font-mono tracking-[0.2em] uppercase">
            Enterprise Sandbox
          </span>
          <h2 className="serif text-3xl font-light text-bone mt-1 tracking-wide">
            Decentralized Credential Sandbox
          </h2>
          <p className="text-xs text-stone font-light mt-1.5 max-w-2xl leading-relaxed">
            Here you can test real-world scenarios where other services, payroll
            providers, and DeFi lending contracts interact with the DID and
            Verifiable Credential (VC) issued on the VendorVerify Portal.
          </p>
        </div>

        {/* Real-World Utility Integration Sandbox */}
        <IntegrationSandbox
          vendorProfile={vendorProfile}
          credential={credential}
          isAuthorized={isAuthorized}
        />
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
