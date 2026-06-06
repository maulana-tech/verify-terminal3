"use client";

import {
  AlertTriangle,
  Check,
  Circle,
  Cpu,
  Play,
  Shield,
  Terminal,
} from "lucide-react";
import type { SimulationStep } from "@/lib/types";

interface SimulationPanelProps {
  steps: SimulationStep[];
  onboardStatus: "idle" | "running" | "success" | "failed";
  activeStepIndex: number;
}

export default function SimulationPanel({
  steps,
  onboardStatus,
  activeStepIndex,
}: SimulationPanelProps) {
  return (
    <div className="bg-oxblood/10 border border-gold/15 p-6 md:p-8 flex flex-col h-full backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 border-b border-gold/10">
        <div className="flex items-center space-x-3">
          <Cpu className="h-5 w-5 text-gold/80" />
          <h2 className="serif text-xl font-light text-bone tracking-wide">
            Intel TDX Enclave Live Simulation
          </h2>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-[9px] font-mono font-medium border bg-black text-gold/70 border-gold/15">
          Status: {onboardStatus.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1">
        {/* Step List (Left Column) */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-[10px] font-mono tracking-wider text-gold/80 uppercase mb-2">
            WASM Contract Execution Flow
          </h3>

          {onboardStatus === "idle" ? (
            <div className="border border-dashed border-gold/15 bg-black/20 p-8 flex flex-col items-center justify-center text-center space-y-3 h-[360px]">
              <Play className="h-8 w-8 text-gold/30 animate-pulse" />
              <span className="text-sm text-bone font-light font-mono tracking-wide uppercase">
                Ready for Onboarding
              </span>
              <p className="text-xs text-stone font-light max-w-[280px] leading-relaxed">
                Trigger the onboarding check on the Buyer side to watch the
                cryptographic TEE steps execute in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 h-[360px] overflow-y-auto pr-1">
              {steps.map((step, _idx) => {
                let statusColor = "border-gold/5 bg-black/20 text-stone/50";
                let indicator = (
                  <Circle className="h-4.5 w-4.5 text-stone/40 shrink-0 mt-0.5" />
                );

                if (step.status === "running") {
                  statusColor = "border-gold/45 bg-black/55 text-bone";
                  indicator = (
                    <div className="h-4.5 w-4.5 rounded-full border-2 border-t-transparent border-gold/70 animate-spin shrink-0 mt-0.5" />
                  );
                } else if (step.status === "success") {
                  statusColor = "border-verified/25 bg-verified/5 text-bone";
                  indicator = (
                    <Check className="h-4.5 w-4.5 text-verified shrink-0 mt-0.5" />
                  );
                } else if (step.status === "failed") {
                  statusColor = "border-red-900/35 bg-red-950/5 text-bone";
                  indicator = (
                    <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                  );
                }

                return (
                  <div
                    key={step.id}
                    className={`flex items-start space-x-3.5 p-3.5 border transition-all ${statusColor}`}
                  >
                    {indicator}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                          {step.title}
                        </span>
                        {step.timestamp && (
                          <span className="text-[9px] text-stone font-mono">
                            {new Date(step.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone font-light mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TEE Console Outputs (Right Column) */}
        <div className="bg-black/50 border border-gold/10 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-2 border-b border-gold/5 mb-3">
              <Terminal className="h-4 w-4 text-gold/60" />
              <span className="text-[10px] font-mono tracking-wider text-gold/70 uppercase">
                TEE Memory State
              </span>
            </div>

            <div className="font-mono text-[10px] text-stone space-y-2 leading-relaxed overflow-y-auto max-h-[280px]">
              {onboardStatus === "idle" && (
                <div className="text-stone/40 italic">
                  Enclave in standby mode. Awaiting host session.
                </div>
              )}
              {onboardStatus !== "idle" && (
                <>
                  <div className="text-stone/60">
                    [INFO] Loading WASM contract binary...
                  </div>
                  {activeStepIndex >= 0 && (
                    <div className="text-bone/90">
                      [OK] Handshake completed successfully. Session ID set.
                    </div>
                  )}
                  {activeStepIndex >= 1 && (
                    <>
                      <div className="text-stone/60">
                        [INFO] Querying DID resolver: resolving vendor
                        signature...
                      </div>
                      <div className="text-bone/90">
                        [OK] Verified delegator signature successfully. Token
                        valid.
                      </div>
                    </>
                  )}
                  {activeStepIndex >= 2 && (
                    <>
                      <div className="text-stone/60">
                        [INFO] Fetching encrypted files from Storage network...
                      </div>
                      <div className="text-stone/60">
                        [INFO] Decrypting package using ML-KEM-768 threshold
                        keys...
                      </div>
                      <div className="text-bone/90">
                        [OK] Credentials decrypted in isolated volatile memory.
                      </div>
                    </>
                  )}
                  {activeStepIndex >= 3 && (
                    <>
                      <div className="text-stone/60">
                        [INFO] Outbound HTTP call to whitelisted Sanctions API
                        endpoint...
                      </div>
                      {onboardStatus === "failed" &&
                      steps[3]?.status === "failed" ? (
                        <div className="text-red-400 font-semibold">
                          [CRITICAL] Sanctions check hit positive! Blocked.
                        </div>
                      ) : (
                        <div className="text-bone/90">
                          [OK] Sanctions check response: verified clear.
                        </div>
                      )}
                    </>
                  )}
                  {activeStepIndex >= 4 && (
                    <>
                      <div className="text-stone/60">
                        [INFO] Asserting document completeness checks (passport,
                        tax_id)...
                      </div>
                      <div className="text-bone/90">
                        [OK] Completed assertions. Profile adheres to Buyer
                        policies.
                      </div>
                    </>
                  )}
                  {activeStepIndex >= 5 && (
                    <>
                      <div className="text-stone/60">
                        [INFO] Initializing SVC signing sequence...
                      </div>
                      <div className="text-verified font-semibold">
                        [OK] SVC issued & verified with zk-proof envelope.
                      </div>
                      <div className="text-verified font-semibold">
                        [OK] Committed audit block to immutable ledger state.
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-gold/5 text-[9px] text-stone/50 leading-relaxed font-mono flex items-start space-x-1.5">
            <Shield className="h-3.5 w-3.5 text-gold/40 shrink-0 mt-0.5" />
            <span>
              All decrypted outputs in enclave memory are zeroed out immediately
              upon session termination.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
