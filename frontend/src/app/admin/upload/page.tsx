'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IconUpload } from '@/components/common/Icons';

export default function UploadPage() {
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('customs');
  const [country, setCountry] = useState('');
  const [carrier, setCarrier] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    // UI handle state for future API integration
    setTimeout(() => {
      setIsUploading(false);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <div className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 mb-2">
            ADMIN FEATURE
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Upload Compliance Document
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Add logistics policies, country rules, or carrier service agreements to the CargoRule RAG vector store.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
          {/* Document File Drag and Drop Placeholder Area */}
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-950/50 transition-colors hover:border-blue-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 mb-3">
              <IconUpload size={24} />
            </div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Drag & drop policy file or click to browse
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Supports PDF, DOCX, TXT (Max 25MB)
            </p>
            <input
              type="file"
              className="hidden"
              id="file-upload-input"
              accept=".pdf,.docx,.txt"
            />
            <label
              htmlFor="file-upload-input"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 cursor-pointer dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Select File
            </label>
          </div>

          {/* Document Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="doc-title" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Document Title
              </label>
              <input
                id="doc-title"
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. Germany Import Guidelines 2026"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="doc-type" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Document Type
              </label>
              <select
                id="doc-type"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="customs">Customs Regulations</option>
                <option value="carrier">Carrier Agreement</option>
                <option value="policy">Shipping Policy</option>
                <option value="restriction">Dangerous Goods Restriction</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="country" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Country (Optional)
              </label>
              <input
                id="country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Germany"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="carrier" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Carrier (Optional)
              </label>
              <input
                id="carrier"
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g. DHL Express"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <IconUpload size={16} />
              <span>{isUploading ? 'Processing Document...' : 'Upload & Process'}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
