"use client";

import { Check, Copy, Database, Eye } from "lucide-react";
import React from "react";
import type { AuditEntry } from "@/lib/types";

interface AuditLedgerProps {
  ledger: AuditEntry[];
  onInspectEntry: (entry: AuditEntry) => void;
}

export default function AuditLedger({
  ledger,
  onInspectEntry,
}: AuditLedgerProps) {
  const [copiedHash, setCopiedHash] = React.useState<string | null>(null);

  const handleCopyHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
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
                onClick={() => onInspectEntry(entry)}
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
    </div>
  );
}
