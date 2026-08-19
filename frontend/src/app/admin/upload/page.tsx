'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
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
    setTimeout(() => {
      setIsUploading(false);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <PageHeader
          title="Upload Compliance Document"
          badge="ADMIN FEATURE"
          description="Add logistics policies, country rules, or carrier service agreements to the CargoRule RAG vector store."
        />

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <Input
                label="Document Title"
                placeholder="e.g. Germany Import Guidelines 2026"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
              />

              <div className="space-y-1.5">
                <label
                  htmlFor="doc-type"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Document Type
                </label>
                <select
                  id="doc-type"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="customs">Customs Regulations</option>
                  <option value="carrier">Carrier Agreement</option>
                  <option value="policy">Shipping Policy</option>
                  <option value="restriction">Dangerous Goods Restriction</option>
                </select>
              </div>

              <Input
                label="Country (Optional)"
                placeholder="e.g. Germany"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />

              <Input
                label="Carrier (Optional)"
                placeholder="e.g. DHL Express"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="submit"
                isLoading={isUploading}
                leftIcon={<IconUpload size={16} />}
              >
                {isUploading ? 'Processing Document...' : 'Upload & Process'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
