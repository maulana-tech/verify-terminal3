"use client";

import { Reveal } from "./Reveal";

const MODULES = [
  {
    n: "I",
    title: "Enclave Execution",
    body: "All sensitive corporate records are encrypted in storage and only decrypted inside Intel TDX secure hardware enclaves to execute compliance checks.",
  },
  {
    n: "II",
    title: "DID Identity",
    body: "Identity is represented by W3C Decentralized Identifiers (DIDs). Verify your company globally without revealing databases or key personnel details.",
  },
  {
    n: "III",
    title: "Zero-Knowledge VCs",
    body: "Generate Smart Verifiable Credentials (SVCs) that cryptographically prove compliance status while completely redacting raw passport numbers or banking digits.",
  },
  {
    n: "IV",
    title: "Granular Consent",
    body: "Grant explicit data access privileges to target buyers for execution. Revoke access instantly to completely block subsequent queries.",
  },
  {
    n: "V",
    title: "Audit Ledger",
    body: "Every query, verification, and consent change is logged onto an immutable cryptographic ledger, providing direct proof for regulatory reporting.",
  },
];

export function Modules() {
  return (
    <section
      id="platform"
      className="relative bg-obsidian py-32 md:py-44 px-6 md:px-16"
    >
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-[11px] tracking-[0.48em] uppercase text-gold/80 mb-8">
            § II · The Architecture
          </p>
        </Reveal>

        <Reveal delay={120}>
          <h3 className="serif text-bone text-4xl md:text-6xl font-light leading-[1.08] max-w-4xl">
            Five layers.
            <br />
            <span className="text-stone italic">Absolute data freedom.</span>
          </h3>
        </Reveal>

        <Reveal delay={240}>
          <p className="mt-8 text-stone max-w-2xl text-[16px] font-light leading-relaxed">
            V-VERIFY is powered by Terminal 3&apos;s secure identity broker SDK.
            A decentralized, enclave-mediated trust bridge designed for modern
            enterprises.
          </p>
        </Reveal>

        <div className="mt-20 border-t border-gold/15">
          {MODULES.map((m, i) => (
            <Reveal key={m.title} delay={i * 80}>
              <div className="group grid grid-cols-12 gap-6 py-10 md:py-14 border-b border-gold/15 hover:bg-gold/[0.015] transition-colors">
                <div className="col-span-12 md:col-span-2">
                  <span className="serif text-gold text-3xl font-light tracking-widest">
                    {m.n}
                  </span>
                </div>
                <div className="col-span-12 md:col-span-4">
                  <h4 className="serif text-bone text-3xl md:text-4xl font-light group-hover:translate-x-1 transition-transform">
                    {m.title}
                  </h4>
                </div>
                <div className="col-span-12 md:col-span-6">
                  <p className="text-stone leading-relaxed text-[16px] font-light">
                    {m.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
