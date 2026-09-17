'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { IconAdmin, IconDashboard, IconAsk } from '../common/Icons';

export const AdminAccessDenied: React.FC = () => {
  const router = useRouter();
  const { user, loginAsRole } = useAuth();

  return (
    <div className="py-12 px-4 max-w-2xl mx-auto">
      <Card className="p-8 text-center space-y-6 border-amber-200 dark:border-amber-900/50 bg-gradient-to-b from-amber-50/40 via-white to-transparent dark:from-amber-950/20 dark:via-zinc-900 dark:to-transparent">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 shadow-xs">
          <IconAdmin size={32} />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            ADMINISTRATOR PRIVILEGES REQUIRED
          </span>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Access Restricted to Compliance Administrators
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            You are currently signed in as <span className="font-semibold text-zinc-800 dark:text-zinc-200">{user?.name || 'Operations User'}</span> with the <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[11px]">{user?.role || 'user'}</span> role.
            Administrative metrics, vector sync telemetry, and document management are restricted to administrator accounts.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            leftIcon={<IconDashboard size={16} />}
            onClick={() => router.push('/dashboard')}
          >
            Return to Dashboard
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={<IconAsk size={16} />}
            onClick={() => router.push('/ask')}
          >
            Ask CargoRule AI
          </Button>

          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              loginAsRole('admin');
              router.refresh();
            }}
            className="text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 text-xs font-semibold"
          >
            Switch to Admin Demo Account →
          </Button>
        </div>
      </Card>
    </div>
  );
};
