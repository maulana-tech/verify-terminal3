"use client";

import Image from "next/image";
import Link from "next/link";
import { Reveal } from "./Reveal";

export function FinalCTA() {
  return (
    <section
      id="company"
      className="relative bg-obsidian py-40 md:py-56 px-6 overflow-hidden border-t border-gold/10"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(200,164,93,0.12), transparent 60%)",
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center">
        <Reveal>
          <div className="relative w-20 h-24 mx-auto opacity-90">
            <Image
              src="/fhox-logo.png"
              alt=""
              fill
              sizes="80px"
              className="object-contain"
            />
          </div>
        </Reveal>

        <Reveal delay={120}>
          <h3 className="serif text-bone text-4xl md:text-6xl font-light leading-[1.05] mt-12">
            Compliance solved without data friction
            <span className="text-gold">.</span>
          </h3>
        </Reveal>

        <Reveal delay={240}>
          <p className="mt-8 text-stone text-[17px] max-w-xl mx-auto font-light leading-relaxed">
            Verify your corporate standing using Terminal 3&apos;s secure
            enclave system.
            <br className="hidden md:block" />
            Zero data compromise. Absolute control over your identity.
          </p>
        </Reveal>

        <Reveal delay={360}>
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              href="/portal"
              className="group inline-flex items-center gap-6 border border-gold bg-gold/[0.04] hover:bg-gold/[0.08] px-10 py-4 transition-all"
            >
              <span className="text-[11px] tracking-[0.42em] uppercase text-gold">
                Enter Portal
              </span>
              <span className="text-gold text-lg group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>
            <a
              href="https://terminal3.io/"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] tracking-[0.42em] uppercase text-stone hover:text-bone px-6 py-4 transition-colors"
            >
              Read the docs
            </a>
          </div>
        </Reveal>
      </div>

      <footer className="relative mt-32 max-w-6xl mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] tracking-[0.32em] uppercase text-stone/50">
        <span>V-VERIFY · v1.0</span>
        <span>Terminal 3 ADK · Intel TDX · W3C DIDs</span>
        <span>Enterprise Data Freedom · 2026</span>
      </footer>
    </section>
  );
}
