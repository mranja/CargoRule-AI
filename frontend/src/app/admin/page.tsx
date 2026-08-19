import React from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IconDocManage, IconUpload } from '@/components/common/Icons';

export default function AdminPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 mb-2">
            ADMIN CONSOLE
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Admin Dashboard Overview
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Manage logistics compliance documents, pipeline indexing jobs, and vector embeddings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/upload"
            className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs transition-all hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-900"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <IconUpload size={20} />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Upload Compliance Documents
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Upload PDF, DOCX, or text policy files with metadata (Country, Carrier, Effective Date) to begin AI chunking and embedding.
            </p>
          </Link>

          <Link
            href="/admin/documents"
            className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs transition-all hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-900"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <IconDocManage size={20} />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Document Management
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              View indexing status, re-process document embeddings, or delete outdated customs and carrier policies.
            </p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
