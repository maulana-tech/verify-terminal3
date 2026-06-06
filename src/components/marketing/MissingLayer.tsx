"use client";

import { Reveal } from "./Reveal";

const MISSING = [
  {
    n: "01",
    k: "Data Exposure",
    v: "Vendors must share raw corporate tax IDs, bank details, and passports with third parties.",
  },
  {
    n: "02",
    k: "Static Checks",
    v: "Compliance reviews rely on static checklists that are outdated the day they are signed.",
  },
  {
    n: "03",
    k: "Trust Asymmetry",
    v: "Buyers demand full disclosure; vendors fear trade secret leaks and identity theft.",
  },
  {
    n: "04",
    k: "Perpetual Access",
    v: "Permissions are granted indefinitely, and manual intervention is required to revoke them.",
  },
  {
    n: "05",
    k: "Brittle Audits",
    v: "No verifiable cryptographic trail exists of compliance checks for regulatory reviews.",
  },
];

export function MissingLayer() {
  return (
    <section className="relative bg-obsidian py-32 md:py-44 px-6 md:px-16 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#F4EFE7 1px, transparent 1px), linear-gradient(90deg, #F4EFE7 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        <Reveal>
          <p className="text-[11px] tracking-[0.48em] uppercase text-gold/80 mb-8">
            § I · The Trust Friction
          </p>
        </Reveal>

        <Reveal delay={120}>
          <h3 className="serif text-bone text-4xl md:text-6xl font-light leading-[1.08] max-w-4xl">
            Onboarding needs proof.
            <br />
            <span className="text-stone italic">
              It doesn&apos;t need exposure.
            </span>
          </h3>
        </Reveal>

        <Reveal delay={240}>
          <div className="gold-rule mt-16 mb-16 max-w-md" />
        </Reveal>

        <div className="grid md:grid-cols-2 gap-x-20 gap-y-12 md:gap-y-16">
          {MISSING.map((item, i) => (
            <Reveal key={item.n} delay={120 * i}>
              <div className="flex gap-6 border-l border-gold/15 pl-6 hover:border-gold/60 transition-colors">
                <span className="serif text-gold/70 text-2xl font-light">
                  {item.n}
                </span>
                <div>
                  <h4 className="serif text-bone text-2xl md:text-3xl font-light mb-3">
                    {item.k}
                  </h4>
                  <p className="text-stone leading-relaxed text-[15px] font-light">
                    {item.v}
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
