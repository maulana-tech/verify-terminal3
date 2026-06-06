"use client";

import { Reveal } from "./Reveal";

export function Passport() {
  return (
    <section
      id="solutions"
      className="relative bg-obsidian py-32 md:py-44 px-6 md:px-16 overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute -right-[10%] top-[10%] w-[50%] h-[60%] rounded-full blur-[160px] opacity-40"
        style={{
          background:
            "radial-gradient(closest-side, rgba(200,164,93,0.3), transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <Reveal>
            <p className="text-[11px] tracking-[0.48em] uppercase text-gold/80 mb-8">
              § III · The Credential
            </p>
          </Reveal>

          <Reveal delay={120}>
            <h3 className="serif text-bone text-4xl md:text-6xl font-light leading-[1.08]">
              From vendor
              <br />
              <span className="text-stone italic">to verified.</span>
            </h3>
          </Reveal>

          <Reveal delay={240}>
            <p className="mt-8 text-stone max-w-md text-[16px] font-light leading-relaxed">
              Every onboarded vendor receives a Smart Verifiable Credential — a
              cryptographically signed document containing trust scores,
              sanctions status, and regulatory history. Easily read by
              enterprise buyers, verifiable on-chain, and protected by enclaves.
            </p>
          </Reveal>

          <Reveal delay={360}>
            <div className="mt-10 flex items-center gap-3 text-[11px] tracking-[0.32em] uppercase text-gold/80">
              <span className="block w-8 h-px bg-gold/60" />
              <span>W3C DID · Intel TDX Enclaves · T3N SDK</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <div className="relative">
            {/* document card */}
            <div className="relative border border-gold/30 bg-oxblood/40 backdrop-blur-sm p-10 md:p-12 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
              {/* corner ornaments */}
              <span className="absolute -top-px -left-px w-6 h-6 border-t border-l border-gold" />
              <span className="absolute -top-px -right-px w-6 h-6 border-t border-r border-gold" />
              <span className="absolute -bottom-px -left-px w-6 h-6 border-b border-l border-gold" />
              <span className="absolute -bottom-px -right-px w-6 h-6 border-b border-r border-gold" />

              <div className="flex items-start justify-between mb-10">
                <div>
                  <p className="text-[10px] tracking-[0.48em] uppercase text-gold/70 mb-3">
                    Smart Verifiable Credential
                  </p>
                  <p className="serif text-bone text-3xl font-light tracking-wide">
                    Acme Global Corp
                  </p>
                </div>
                <div className="relative w-14 h-14 rounded-full border border-gold/60 flex items-center justify-center animate-seal-pulse">
                  <span className="serif text-gold text-xl">V</span>
                  <span className="absolute inset-0 rounded-full border border-gold/20 scale-110" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-7 gap-x-8 font-mono text-[11px]">
                <PassportRow k="Issuer" v="did:t3n:buyer-corp" />
                <PassportRow k="Subject" v="did:t3n:acme-global" />
                <PassportRow k="Enclave ID" v="Intel TDX #48A1" />
                <PassportRow k="Credential ID" v="#vc-89241" />
                <PassportRow k="Sanctions Status" v="Clear" />
                <PassportRow k="Audit Ledger" v="Committed" />
                <PassportRow k="Status" v="Verified" highlight />
                <PassportRow k="Access Token" v="did:t3n:delegated" />
              </div>

              <div className="gold-rule mt-10 mb-6 opacity-60" />
              <div className="flex items-center justify-between text-[10px] tracking-[0.32em] uppercase text-stone/80">
                <span>TEE Certified Credential</span>
                <span className="text-gold/80">
                  Terminal 3 Network · Testnet
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PassportRow({
  k,
  v,
  highlight = false,
}: {
  k: string;
  v: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-stone/60 uppercase tracking-[0.24em] text-[9px] mb-1.5">
        {k}
      </p>
      <p className={highlight ? "text-verified" : "text-bone"}>{v}</p>
    </div>
  );
}
