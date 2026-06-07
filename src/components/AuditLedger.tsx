"use client";

import { Check, Copy, Database, Eye, X } from "lucide-react";
import React from "react";
import type { AuditEntry } from "@/lib/types";

interface AuditLedgerProps {
  ledger: AuditEntry[];
}

export default function AuditLedger({ ledger }: AuditLedgerProps) {
  const [copiedHash, setCopiedHash] = React.useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = React.useState<AuditEntry | null>(
    null,
  );

  const handleCopyHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Generate simulated raw transaction payload for the inspector
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

  return (
    <div className="bg-oxblood/10 border border-gold/15 p-6 md:p-8 flex flex-col h-full relative">
      <div className="absolute inset-0 backdrop-blur-sm -z-10" />
      <div className="flex items-center justify-between pb-4 border-b border-gold/10 mb-6">
        <div className="flex items-center space-x-3">
          <Database className="h-5 w-5 text-gold/80" />
          <h2 className="serif text-xl font-light text-bone tracking-wide">
            Cryptographic Audit Trail
          </h2>
        </div>
        <span className="text-[10px] tracking-wider text-gold/60 font-mono">
          Total Blocks: {ledger.length}
        </span>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gold/10 text-[9px] text-gold/80 uppercase tracking-wider font-mono">
              <th className="py-3 px-3">Block</th>
              <th className="py-3 px-3">Timestamp</th>
              <th className="py-3 px-3">Action</th>
              <th className="py-3 px-3">Actor / Target DID</th>
              <th className="py-3 px-3">Transaction Hash</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold/5 text-xs">
            {[...ledger].reverse().map((entry) => (
              <tr
                key={entry.index}
                onClick={() => setSelectedEntry(entry)}
                className="hover:bg-black/40 transition-colors cursor-pointer group"
              >
                <td className="py-3.5 px-3 font-mono font-bold text-gold/90">
                  #{String(entry.index).padStart(3, "0")}
                </td>
                <td className="py-3.5 px-3 text-stone font-mono whitespace-nowrap">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </td>
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <span
                    className={`inline-flex px-1.5 py-0.5 rounded-sm font-mono text-[9px] border ${
                      entry.action.includes("FAILED") ||
                      entry.action.includes("REJECTED")
                        ? "bg-red-950/15 text-red-400 border-red-900/35"
                        : entry.action.includes("REVOCATION")
                          ? "bg-amber-950/15 text-amber-400 border-amber-900/35"
                          : entry.action.includes("SUCCESS") ||
                              entry.action.includes("GRANT") ||
                              entry.action.includes("ISSUANCE")
                            ? "bg-verified/10 text-verified border-verified/25"
                            : "bg-black/60 text-stone border-gold/10"
                    }`}
                  >
                    {entry.action}
                  </span>
                </td>
                <td className="py-3.5 px-3 font-mono text-[10px] text-bone/80 max-w-[200px] truncate">
                  <div className="truncate">Actor: {entry.actorDid}</div>
                  <div className="truncate text-stone/60 mt-0.5">
                    Target: {entry.targetDid}
                  </div>
                </td>
                <td className="py-3.5 px-3 font-mono text-[11px] text-stone">
                  <div className="flex items-center space-x-1.5">
                    <span className="select-all">
                      {entry.txHash.slice(0, 10)}...{entry.txHash.slice(-8)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopyHash(entry.txHash, e)}
                      className="text-stone/40 hover:text-gold transition-colors cursor-pointer"
                      title="Copy transaction hash"
                    >
                      {copiedHash === entry.txHash ? (
                        <Check className="h-3 w-3 text-verified" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-right">
                  <button
                    type="button"
                    className="inline-flex items-center space-x-1 text-[9px] font-mono tracking-wider uppercase text-gold/60 border border-gold/15 group-hover:border-gold/60 group-hover:text-gold px-2.5 py-1 transition-all bg-black/25"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Inspect</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transaction Details Drawer */}
      {selectedEntry && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-xs">
          {/* Backdrop click to close */}
          <button
            type="button"
            className="absolute inset-0 cursor-pointer w-full h-full bg-transparent border-0 outline-none"
            onClick={() => setSelectedEntry(null)}
            aria-label="Close"
          />

          <div className="relative w-full max-w-lg bg-[#050505] border-l border-gold/20 h-full flex flex-col shadow-2xl z-[101] animate-slide-in">
            {/* Corner ornaments on left edge */}
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
              {/* Core block details */}
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

              {/* Precise Enclave execution logs */}
              <div>
                <h4 className="text-[10px] font-mono tracking-wider text-gold/80 uppercase mb-2">
                  Execution attestation
                </h4>
                <div className="bg-oxblood/20 border border-gold/15 p-4 text-xs font-light text-bone leading-relaxed">
                  {selectedEntry.details}
                </div>
              </div>

              {/* Raw JSON payload */}
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
    </div>
  );
}
