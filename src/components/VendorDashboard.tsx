"use client";

import { AlertCircle, Building, Eye, EyeOff, Key, Shield } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { VendorProfile } from "@/lib/types";

interface VendorDashboardProps {
  profile: VendorProfile | null;
  isAuthorized: boolean;
  buyerDid: string;
  onRegister: (
    data: Omit<VendorProfile, "did" | "registered">,
  ) => Promise<void>;
  onToggleAccess: (action: "revoke" | "grant") => Promise<void>;
  onReset: () => Promise<void>;
}

export default function VendorDashboard({
  profile,
  isAuthorized,
  buyerDid,
  onRegister,
  onToggleAccess,
  onReset,
}: VendorDashboardProps) {
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  const [showPii, setShowPii] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [error, setError] = useState("");

  const handleAutofill = () => {
    setCompanyName("AeroSpace Ventures Inc.");
    setTaxId("US-EIN-9920194A");
    setOwnerName("Marcus Aurelius");
    setPassportNumber("P-9201948");
    setBankName("Global Institutional Bank");
    setBankAccount("GIB-US-9910-4820");
  };

  const handleAutofillSanctioned = () => {
    setCompanyName("Sanctioned Arms Corp.");
    setTaxId("US-EIN-6666666B");
    setOwnerName("Victor Bout");
    setPassportNumber("P-0000000");
    setBankName("Offshore Havens Ltd");
    setBankAccount("OHL-CH-8820-1110");
  };

  // One-click fill + submit
  const handleQuickRegister = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      await onRegister({
        companyName: "AeroSpace Ventures Inc.",
        taxId: "US-EIN-9920194A",
        ownerName: "Marcus Aurelius",
        passportNumber: "P-9201948",
        bankName: "Global Institutional Bank",
        bankAccount: "GIB-US-9910-4820",
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !companyName ||
      !taxId ||
      !ownerName ||
      !passportNumber ||
      !bankName ||
      !bankAccount
    ) {
      setError("Please fill in all compliance fields.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onRegister({
        companyName,
        taxId,
        ownerName,
        passportNumber,
        bankName,
        bankAccount,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-oxblood/10 border border-gold/15 p-6 md:p-8 flex flex-col h-full justify-between backdrop-blur-sm">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-gold/10">
          <div className="flex items-center space-x-3">
            <Building className="h-5 w-5 text-gold/80" />
            <h2 className="serif text-xl font-light text-bone tracking-wide">
              Vendor Management Portal
            </h2>
          </div>
          <span className="text-[10px] tracking-[0.32em] uppercase text-gold/60 font-mono">
            Vendor Agent
          </span>
        </div>

        {profile?.registered ? (
          <div className="mt-6 space-y-6">
            <div className="bg-black/45 p-4 border border-gold/10 rounded-sm">
              <div className="flex items-center space-x-2 text-gold/70 text-[10px] tracking-wider uppercase font-mono mb-1.5">
                <Key className="h-3.5 w-3.5" />
                <span>Decentralized Identifier (DID)</span>
              </div>
              <div className="text-xs font-mono text-bone break-all select-all leading-relaxed">
                {profile.did}
              </div>
              <div className="mt-2 text-[10px] text-stone font-light font-mono">
                Registered on T3N:{" "}
                {profile.registeredAt
                  ? new Date(profile.registeredAt).toLocaleString()
                  : ""}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-mono tracking-wider text-gold/80 uppercase">
                  Encrypted KYC Credentials
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPii(!showPii)}
                  className="flex items-center space-x-1.5 text-[10px] tracking-wider uppercase font-mono text-stone hover:text-bone transition-colors"
                >
                  {showPii ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 text-stone" />
                      <span>Mask PII</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 text-stone" />
                      <span>Reveal PII</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2">
                {[
                  {
                    label: "Company Name",
                    val: profile.companyName,
                    pii: false,
                  },
                  { label: "Tax ID", val: profile.taxId, pii: true },
                  {
                    label: "Representative Owner",
                    val: profile.ownerName,
                    pii: false,
                  },
                  {
                    label: "Passport Number",
                    val: profile.passportNumber,
                    pii: true,
                  },
                  {
                    label: "Settlement Bank Name",
                    val: profile.bankName,
                    pii: false,
                  },
                  {
                    label: "Bank Account Number",
                    val: profile.bankAccount,
                    pii: true,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center text-xs py-2.5 px-3 bg-black/30 border border-gold/5"
                  >
                    <span className="text-stone font-light">{item.label}</span>
                    <span className="font-mono text-bone/90 font-light">
                      {item.pii && !showPii
                        ? "•••••••••••• (Encrypted in T3N)"
                        : item.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gold/10 space-y-3">
              <h3 className="text-[10px] font-mono tracking-wider text-gold/80 uppercase">
                Access & Trust Governance
              </h3>
              <div className="bg-black/40 border border-gold/10 p-4 rounded-sm space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone font-light">
                    Buyer Agent Authorization
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-sm font-mono text-[9px] font-medium border ${
                      isAuthorized
                        ? "bg-verified/10 text-verified border-verified/30"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {isAuthorized ? "GRANTED" : "REVOKED"}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-stone break-all">
                  Recipient: {buyerDid}
                </div>
                <div className="flex space-x-2 pt-1">
                  {isAuthorized ? (
                    <button
                      type="button"
                      onClick={() => onToggleAccess("revoke")}
                      className="flex-1 text-center py-2 bg-red-950/20 hover:bg-red-900/30 text-red-300 border border-red-900/40 text-[10px] tracking-wider uppercase font-mono transition-colors cursor-pointer"
                    >
                      Revoke Data Authorization
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleAccess("grant")}
                      className="flex-1 text-center py-2 border border-gold/30 hover:border-gold hover:text-bone text-gold text-[10px] tracking-wider uppercase font-mono transition-colors cursor-pointer"
                    >
                      Grant Data Authorization
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Unregister / Reset ── */}
            <div className="pt-4 border-t border-red-900/20 space-y-2">
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="w-full text-center py-2 text-[10px] font-mono tracking-wider uppercase text-red-400/70 hover:text-red-400 border border-red-900/20 hover:border-red-900/50 transition-colors cursor-pointer"
                >
                  Unregister &amp; Reset Demo
                </button>
              ) : (
                <div className="bg-red-950/15 border border-red-900/30 p-3 space-y-2.5">
                  <p className="text-[10px] font-mono text-red-300 leading-relaxed">
                    Ini akan menghapus semua data vendor, credential, dan audit
                    log dari server dan browser. Yakin?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsResetting(true);
                        setConfirmReset(false);
                        await onReset();
                        setIsResetting(false);
                      }}
                      disabled={isResetting}
                      className="flex-1 py-2 bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-900/40 text-[10px] tracking-wider uppercase font-mono transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isResetting ? "Resetting..." : "Ya, Hapus Semua"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="flex-1 py-2 border border-gold/20 hover:border-gold/40 text-stone hover:text-bone text-[10px] tracking-wider uppercase font-mono transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* ── Quick Register Banner ── */}
            <div className="bg-gold/5 border border-gold/25 p-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono text-gold uppercase tracking-wider font-semibold">
                  ⚡ Quick Register Demo
                </div>
                <div className="text-[10px] text-stone font-light mt-0.5">
                  Isi &amp; daftar langsung pakai data demo valid — 1 klik selesai.
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickRegister}
                disabled={isSubmitting}
                className="shrink-0 bg-gold hover:bg-gold/85 disabled:opacity-50 text-black font-mono font-semibold text-[10px] tracking-widest uppercase px-4 py-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                {isSubmitting ? "Registering..." : "Daftar Sekarang"}
              </button>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-mono tracking-wider text-gold/80 uppercase">
                Atau isi manual
              </h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleAutofill}
                  className="text-[9px] font-mono text-stone hover:text-gold border border-gold/10 px-2 py-0.5 transition-colors cursor-pointer"
                >
                  Autofill Valid
                </button>
                <button
                  type="button"
                  onClick={handleAutofillSanctioned}
                  className="text-[9px] font-mono text-stone hover:text-red-400 border border-gold/10 px-2 py-0.5 transition-colors cursor-pointer"
                >
                  Autofill Sanctioned
                </button>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label
                  htmlFor="company-name"
                  className="block text-[10px] text-stone font-mono tracking-wide uppercase mb-1"
                >
                  Company Registered Name
                </label>
                <input
                  id="company-name"
                  type="text"
                  placeholder="e.g. AeroSpace Ventures Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-black/60 border border-gold/15 px-3 py-2 text-xs text-bone focus:outline-none focus:border-gold/45 font-light"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="tax-id"
                    className="block text-[10px] text-stone font-mono tracking-wide uppercase mb-1"
                  >
                    Tax ID / EIN
                  </label>
                  <input
                    id="tax-id"
                    type="text"
                    placeholder="e.g. US-EIN-9920194A"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full bg-black/60 border border-gold/15 px-3 py-2 text-xs text-bone focus:outline-none focus:border-gold/45 font-light"
                  />
                </div>
                <div>
                  <label
                    htmlFor="owner-name"
                    className="block text-[10px] text-stone font-mono tracking-wide uppercase mb-1"
                  >
                    Representative Owner
                  </label>
                  <input
                    id="owner-name"
                    type="text"
                    placeholder="e.g. Marcus Aurelius"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-black/60 border border-gold/15 px-3 py-2 text-xs text-bone focus:outline-none focus:border-gold/45 font-light"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="passport-number"
                  className="block text-[10px] text-stone font-mono tracking-wide uppercase mb-1"
                >
                  Representative Passport ID
                </label>
                <input
                  id="passport-number"
                  type="text"
                  placeholder="e.g. P-9201948"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  className="w-full bg-black/60 border border-gold/15 px-3 py-2 text-xs text-bone focus:outline-none focus:border-gold/45 font-light font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="bank-name"
                    className="block text-[10px] text-stone font-mono tracking-wide uppercase mb-1"
                  >
                    Settlement Bank Name
                  </label>
                  <input
                    id="bank-name"
                    type="text"
                    placeholder="e.g. Global Institutional Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-black/60 border border-gold/15 px-3 py-2 text-xs text-bone focus:outline-none focus:border-gold/45 font-light"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bank-account"
                    className="block text-[10px] text-stone font-mono tracking-wide uppercase mb-1"
                  >
                    Bank Account Number / IBAN
                  </label>
                  <input
                    id="bank-account"
                    type="text"
                    placeholder="e.g. GIB-US-9910-4820"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full bg-black/60 border border-gold/15 px-3 py-2 text-xs text-bone focus:outline-none focus:border-gold/45 font-light font-mono"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-400 text-xs bg-red-950/10 border border-red-900/30 p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gold hover:bg-gold/90 text-black py-2.5 font-mono tracking-widest2 uppercase text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? "Registering..."
                : "Encrypt & Register DID on T3N"}
            </button>
          </form>
        )}
      </div>

      {profile?.registered && (
        <div className="mt-6 p-3 bg-black/20 border border-gold/10 text-[10px] leading-relaxed text-stone flex items-start space-x-2">
          <Shield className="h-4 w-4 text-gold/70 shrink-0 mt-0.5" />
          <span>
            Credentials are encrypted client-side using Post-Quantum Threshold
            Cryptography before being written to the storage subnet. Raw values
            are strictly inaccessible to the Buyer Agent.
          </span>
        </div>
      )}
    </div>
  );
}
