'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  IconBox,
  IconAlertCircle,
  IconSpinner,
  IconArrowRight,
  IconEye,
  IconShieldCheck,
} from '@/components/common/Icons';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await login({
        email: email.trim(),
        password: password.trim(),
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Invalid credentials. Please verify your email and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-[#090D16] flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-blue-600/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-40 right-1/4 w-[600px] h-[350px] bg-gradient-to-br from-blue-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Top Brand Logo & Header */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
            <IconBox size={22} />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            CargoRule <span className="text-blue-600 dark:text-blue-400">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sign in to your account
        </h2>
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
          Enterprise trade compliance copilot and regulatory document intelligence.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="relative backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 py-8 px-6 shadow-2xl shadow-zinc-950/5 border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 animate-in fade-in duration-150">
              <IconAlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Work Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <IconEye size={16} />
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <IconSpinner size={16} className="animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <IconArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Assurance Badge */}
          <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
            <IconShieldCheck size={14} className="text-emerald-500 shrink-0" />
            <span>Encrypted with SHA-512 & HMAC-SHA256 Token Auth</span>
          </div>

          {/* Footer Navigation */}
          <div className="mt-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
            <span>Don&apos;t have an account? </span>
            <Link
              href="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Sign up now
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            ← Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
