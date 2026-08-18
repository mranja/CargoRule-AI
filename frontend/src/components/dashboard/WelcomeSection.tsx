import React from 'react';
import Link from 'next/link';
import { IconAsk, IconSparkles } from '../common/Icons';

export const WelcomeSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-zinc-900 to-slate-900 p-6 sm:p-8 text-white shadow-md border border-zinc-800">
      {/* Background Decorative Pattern */}
      <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute right-1/3 -top-12 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md border border-blue-400/20">
            <IconSparkles size={14} className="text-blue-300" />
            <span>AI Compliance Assistant</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Search global customs regulations, shipping policies, and carrier agreements in natural language. Powered by Retrieval-Augmented Generation (RAG).
          </p>
        </div>

        <div className="flex shrink-0">
          <Link
            href="/ask"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg hover:bg-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            <IconAsk size={18} />
            <span>Ask CargoRule</span>
          </Link>
        </div>
      </div>
    </section>
  );
};
