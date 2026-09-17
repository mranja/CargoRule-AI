'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  IconBox,
  IconShieldCheck,
  IconAlertCircle,
  IconSpinner,
  IconArrowRight,
  IconCheck,
} from '@/components/common/Icons';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        err instanceof Error ? err.message : 'Invalid credentials. Please verify and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoAccount: 'admin' | 'ops') => {
    if (isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (demoAccount === 'admin') {
        await login({
          email: 'admin@cargorule.ai',
          password: 'admin123',
        });
      } else {
        await login({
          email: 'ops@cargorule.ai',
          password: 'user123',
        });
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to authenticate demo account.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Brand Logo & Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <IconBox size={22} />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            CargoRule <span className="text-blue-600 dark:text-blue-400">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Sign in to your workspace
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Access the logistics compliance copilot, document repository, and audit trails.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200/80 dark:border-zinc-800 rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <IconAlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1-Click Quick Demo Presets */}
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                Quick Demo Accounts (Evaluation)
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400">
                Sandbox login
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 dark:border-amber-900/60 dark:bg-zinc-900 dark:hover:bg-amber-950/50 shadow-2xs transition-all cursor-pointer disabled:opacity-50 text-center"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <IconShieldCheck size={14} className="text-amber-600 shrink-0" />
                  <span>Admin Account</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">admin@cargorule.ai</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('ops')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 dark:border-blue-900/60 dark:bg-zinc-900 dark:hover:bg-blue-950/50 shadow-2xs transition-all cursor-pointer disabled:opacity-50 text-center"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
                  <IconCheck size={14} className="text-blue-600 shrink-0" />
                  <span>Operations Account</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">ops@cargorule.ai</span>
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400 font-medium">
                Or sign in with email
              </span>
            </div>
          </div>

          {/* Standard Form */}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-2.5 text-[11px] text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800">
              <IconShieldCheck size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Role and permissions are automatically verified from your organization directory.</span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <IconSpinner size={16} className="animate-spin" />
                    <span>Signing in...</span>
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

          {/* Footer Navigation */}
          <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            <span>Don&apos;t have an account? </span>
            <Link
              href="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign up now
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          >
            ? Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
