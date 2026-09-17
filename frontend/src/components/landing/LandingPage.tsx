'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  IconBox,
  IconAsk,
  IconShieldCheck,
  IconGlobe,
  IconCarriers,
  IconDocuments,
  IconFileText,
  IconCheck,
  IconArrowRight,
  IconSparkles,
  IconDatabase,
  IconClock,
  IconChevronRight,
  IconSearch,
} from '@/components/common/Icons';

const sampleQueries = [
  'What documents are required to export lithium batteries to Germany?',
  'What are FedEx dangerous goods size and packaging constraints?',
  'Does Japan Civil Aviation Bureau require JCAB Form A-19 for air cargo?',
  'What certificates are needed for cold-chain pharmaceutical shipments?',
];

export const LandingPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [selectedPrompt, setSelectedPrompt] = useState(sampleQueries[0]);
  const [activeTab, setActiveTab] = useState<'regulations' | 'carriers' | 'citations'>('regulations');

  const handleStartQuery = (queryText: string) => {
    if (isAuthenticated) {
      router.push(`/ask?q=${encodeURIComponent(queryText)}`);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(`/ask?q=${queryText}`)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* 1. Global Navigation Bar */}
      <nav className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <IconBox size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                CargoRule <span className="text-blue-600 dark:text-blue-400">AI</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">Logistics Intelligence</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Platform Features
            </a>
            <a href="#architecture" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              RAG Architecture
            </a>
            <a href="#coverage" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Global Coverage
            </a>
            <a href="#audit" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Compliance Audit
            </a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer"
              >
                <span>Open Dashboard</span>
                <IconArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-zinc-100 dark:hover:bg-zinc-900 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer"
                >
                  <span>Get Started</span>
                  <IconChevronRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-zinc-100 dark:border-zinc-900">
        <div className="absolute inset-0 bg-radial-[at_top_center] from-blue-50/50 via-transparent to-transparent dark:from-blue-950/20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 mb-6 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            Next-Gen RAG for International Trade & Dangerous Goods
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-4xl mx-auto leading-tight sm:leading-none">
            Instant, Verified Answers for{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Global Cargo Compliance
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate costly customs delays, compliance penalties, and carrier rejections.
            CargoRule AI indexes international customs regulations, carrier agreements, and shipping policies with source-backed citations.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={isAuthenticated ? '/dashboard' : '/signup'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:shadow-blue-500/35 transition-all cursor-pointer"
            >
              <span>{isAuthenticated ? 'Go to Workspace' : 'Start Using CargoRule AI'}</span>
              <IconArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-all shadow-xs"
            >
              <span>Sign In & Verify Compliance</span>
              <IconSparkles size={16} className="text-blue-600 dark:text-blue-400" />
            </Link>
          </div>

          {/* Interactive Hero Query Explorer Card */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl border border-zinc-200 bg-white/95 p-5 sm:p-7 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/95 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <IconAsk size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Live Retrieval Engine Preview
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Select a sample question or type your own cargo scenario
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Vector Index Synced
              </span>
            </div>

            {/* Prompt Suggestion Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {sampleQueries.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPrompt(q)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left cursor-pointer ${
                    selectedPrompt === q
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                      : 'border-zinc-200 bg-zinc-50/70 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Query Preview Box */}
            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <IconSearch size={18} className="text-zinc-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {selectedPrompt}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleStartQuery(selectedPrompt)}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
              >
                <span>Query Engine</span>
                <IconArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Numbers & KPIs Ribbon */}
      <section className="py-12 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400">100%</div>
              <div className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">Grounded in Truth</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Zero ungrounded hallucinations</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100">&lt; 850ms</div>
              <div className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">Retrieval Latency</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Dense vector similarity search</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400">1536-D</div>
              <div className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">Dense Embeddings</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Cosine similarity matching</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100">Audit Ready</div>
              <div className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">Source Citations</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Exact chunk IDs & paragraphs</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Feature Showcase */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
            Engineered For Logistics Teams
          </h2>
          <h3 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Complete compliance lifecycle in one unified platform
          </h3>
          <p className="mt-3 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            From initial document upload to automated text extraction, chunking, and instant cross-border policy answers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-5">
                <IconDocuments size={24} />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Automated Document Pipeline
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                Upload PDFs, DOCX, and text policy files with automated magic-byte verification, section-aware chunking, and real-time embedding indexing.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <li className="flex items-center gap-2">
                <IconCheck size={14} className="text-emerald-500 shrink-0" />
                <span>PDF, DOCX, and TXT format parsing</span>
              </li>
              <li className="flex items-center gap-2">
                <IconCheck size={14} className="text-emerald-500 shrink-0" />
                <span>Automatic rollback on processing failure</span>
              </li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-5">
                <IconGlobe size={24} />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Carrier & Country Filtering
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                Execute filtered vector retrieval tailored specifically to DHL, Maersk, FedEx, or country-specific import/export trade barriers.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <li className="flex items-center gap-2">
                <IconCheck size={14} className="text-emerald-500 shrink-0" />
                <span>Metadata normalization across global ports</span>
              </li>
              <li className="flex items-center gap-2">
                <IconCheck size={14} className="text-emerald-500 shrink-0" />
                <span>Synchronized vector store updates on edits</span>
              </li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-5">
                <IconShieldCheck size={24} />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Audited Source Citations
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                Every generated compliance response is stamped with exact source citations, similarity confidence ratings, and persistent query logs.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <li className="flex items-center gap-2">
                <IconCheck size={14} className="text-emerald-500 shrink-0" />
                <span>Immutable audit trail for compliance verification</span>
              </li>
              <li className="flex items-center gap-2">
                <IconCheck size={14} className="text-emerald-500 shrink-0" />
                <span>Strict prompt-injection barrier boundaries</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. RAG Architecture Diagram Section */}
      <section id="architecture" className="py-20 bg-zinc-50 dark:bg-zinc-900/40 border-t border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              How It Works
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              End-to-End Grounded Retrieval Architecture
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mb-2">01. Ingestion</div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Upload & Clean</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Regulations and tariff rules are validated with magic bytes, extracted, and cleaned of formatting noise.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mb-2">02. Chunk & Embed</div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">1536-D Vectors</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Segmented into section-aware chunks with metadata (country, carrier, date) and converted into vector embeddings.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mb-2">03. Retrieval</div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Cosine Similarity</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Matches compliance queries with top-K relevant chunks under strict metadata filtering guards.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mb-2">04. Generation</div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Grounded Synthesis</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Synthesizes actionable compliance answers strictly constrained to retrieved context with exact source citations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call to Action Banner */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 sm:p-14 text-white text-center shadow-xl shadow-blue-500/20">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to automate logistics compliance?
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
              Sign in to explore the dashboard, query customs requirements across 100+ countries, and manage carrier rules seamlessly.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-semibold text-blue-600 shadow-md hover:bg-blue-50 transition-all cursor-pointer"
              >
                <span>Sign In to Dashboard</span>
                <IconArrowRight size={15} />
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition-all cursor-pointer backdrop-blur-xs"
              >
                <span>Create New Account</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-zinc-200 bg-white py-10 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white">
              <IconBox size={14} />
            </div>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">CargoRule AI</span>
            <span>— Logistics & Customs Compliance Intelligence</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-200">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-zinc-900 dark:hover:text-zinc-200">
              Register
            </Link>
            <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-200">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
