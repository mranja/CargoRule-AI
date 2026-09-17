import React from 'react';
import Link from 'next/link';
import { IconAsk, IconSparkles, IconDocuments, IconArrowRight } from '../common/Icons';

export const WelcomeSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0F172A] via-[#090E1A] to-[#060911] p-6 sm:p-8 text-white shadow-xl border border-white/[0.08]">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute -right-16 -bottom-16 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute right-1/3 -top-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Subtle Micro-Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur-md border border-white/[0.1]">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            </span>
            <span className="text-[11px] font-mono tracking-wide uppercase text-zinc-300">
              RAG Engine Active • 1536-D Vector Sync
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Logistics Compliance Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
            Query cross-border tariff schedules, dangerous goods policies, and carrier restrictions in real-time with source-grounded citations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/documents"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.07] px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-200 border border-white/[0.1] hover:bg-white/[0.12] hover:text-white transition-all backdrop-blur-xs"
          >
            <IconDocuments size={16} />
            <span>Manage Policies</span>
          </Link>
          <Link
            href="/ask"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <IconAsk size={16} />
            <span>Ask CargoRule</span>
            <IconArrowRight size={14} className="opacity-70" />
          </Link>
        </div>
      </div>
    </section>
  );
};
