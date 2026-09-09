'use client';

import React, { useState } from 'react';
import { DocumentRecord, UploadMetadata } from '@/types';
import { updateDocument, deleteDocument } from '@/services/api';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select, SelectOption } from '../ui/Select';
import { EmptyState } from '../ui/EmptyState';
import { Alert } from '../ui/Alert';
import {
  IconClose,
  IconDocuments,
  IconEdit,
  IconSearch,
  IconTrash,
} from '../common/Icons';

export interface DocumentManagementTableProps {
  documents: DocumentRecord[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onUploadClick?: () => void;
}

const statusFilterOptions: SelectOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'indexed', label: 'Indexed' },
  { value: 'processing', label: 'Processing' },
  { value: 'error', label: 'Error / Failed' },
];

const documentTypeOptions: SelectOption[] = [
  { value: 'Customs Regulation', label: 'Customs Regulation' },
  { value: 'Shipping Policy', label: 'Shipping Policy' },
  { value: 'Carrier Agreement', label: 'Carrier Agreement' },
  { value: 'Import Requirement', label: 'Import Requirement' },
  { value: 'Export Requirement', label: 'Export Requirement' },
  { value: 'Restricted Items List', label: 'Restricted Items List' },
];

export const DocumentManagementTable: React.FC<DocumentManagementTableProps> = ({
  documents = [],
  isLoading = false,
  onRefresh,
  onUploadClick,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit Modal State
  const [editingDoc, setEditingDoc] = useState<DocumentRecord | null>(null);
  const [editForm, setEditForm] = useState<UploadMetadata>({
    documentName: '',
    country: '',
    carrier: '',
    documentType: 'Customs Regulation',
    effectiveDate: '',
    expiryDate: '',
    version: '1.0',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Delete Modal State
  const [deletingDoc, setDeletingDoc] = useState<DocumentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter Documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      (doc.country && doc.country.toLowerCase().includes(search.toLowerCase())) ||
      (doc.carrier && doc.carrier.toLowerCase().includes(search.toLowerCase())) ||
      doc.type.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'error'
        ? doc.status === 'error' || doc.status === 'failed'
        : doc.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  // Open Edit Modal
  const handleOpenEdit = (doc: DocumentRecord) => {
    setEditingDoc(doc);
    setEditForm({
      documentName: doc.title,
      country: doc.country || '',
      carrier: doc.carrier || '',
      documentType: doc.type || 'Customs Regulation',
      effectiveDate: doc.effectiveDate || '',
      expiryDate: doc.expiryDate || '',
      version: doc.version || '1.0',
    });
    setUpdateError('');
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    setIsUpdating(true);
    setUpdateError('');

    try {
      await updateDocument(editingDoc.id, editForm);
      setEditingDoc(null);
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update document metadata');
    } finally {
      setIsUpdating(false);
    }
  };

  // Submit Delete Action
  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;

    setIsDeleting(true);
    try {
      await deleteDocument(deletingDoc.id);
      setDeletingDoc(null);
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      console.error('Failed to delete document:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by name, country, carrier, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<IconSearch size={16} />}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-44">
              <Select
                options={statusFilterOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>

            {(search || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Document Table Card */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <div className="h-5 w-1/3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={
                documents.length === 0
                  ? 'No documents indexed yet'
                  : 'No matching documents found'
              }
              description={
                documents.length === 0
                  ? 'Upload customs regulations, shipping policies, or carrier agreements to build your AI compliance knowledge base.'
                  : 'Try broadening your search criteria or resetting filters.'
              }
              icon={<IconDocuments size={24} />}
              actionLabel={documents.length === 0 ? 'Upload Document' : undefined}
              onAction={documents.length === 0 ? onUploadClick : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Document Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Carrier</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Effective</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100 max-w-xs">
                      <div className="flex flex-col">
                        <span className="truncate">{doc.title}</span>
                        {doc.fileName && (
                          <span className="text-[10px] text-zinc-400 font-mono font-normal">
                            {doc.fileName} {doc.chunkCount ? `• ${doc.chunkCount} chunks` : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="info" size="sm">
                        {doc.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-medium">{doc.country || 'Global'}</td>
                    <td className="px-4 py-3.5 font-medium">{doc.carrier || 'All'}</td>
                    <td className="px-4 py-3.5 font-mono text-[11px]">{doc.version || '1.0'}</td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          doc.status === 'indexed' || doc.status === 'processed'
                            ? 'success'
                            : doc.status === 'processing'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500 font-mono text-[11px]">
                      {formatDate(doc.effectiveDate)}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500 font-mono text-[11px]">
                      {formatDate(doc.expiryDate)}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-400 font-mono text-[10px]">
                      {formatDate(doc.updatedAt || doc.uploadedAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(doc)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                          title="Edit document metadata"
                        >
                          <IconEdit size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingDoc(doc)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete document"
                        >
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Document Metadata Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-lg p-6 space-y-5 shadow-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Edit Document Metadata
              </h3>
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <IconClose size={18} />
              </button>
            </div>

            {updateError && (
              <Alert variant="danger" title="Update Failed">
                {updateError}
              </Alert>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <Input
                label="Document Name / Title *"
                value={editForm.documentName}
                onChange={(e) => setEditForm({ ...editForm, documentName: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Country"
                  placeholder="e.g. Germany"
                  value={editForm.country || ''}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                />
                <Input
                  label="Carrier"
                  placeholder="e.g. DHL"
                  value={editForm.carrier || ''}
                  onChange={(e) => setEditForm({ ...editForm, carrier: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Document Type"
                  options={documentTypeOptions}
                  value={editForm.documentType}
                  onChange={(e) => setEditForm({ ...editForm, documentType: e.target.value })}
                />
                <Input
                  label="Version"
                  placeholder="e.g. 1.0"
                  value={editForm.version}
                  onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Effective Date"
                  type="date"
                  value={editForm.effectiveDate}
                  onChange={(e) => setEditForm({ ...editForm, effectiveDate: e.target.value })}
                />
                <Input
                  label="Expiry Date"
                  type="date"
                  value={editForm.expiryDate}
                  onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingDoc(null)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isUpdating}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Confirm Document Deletion
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-zinc-900 dark:text-zinc-100">{deletingDoc.title}</strong>?
              This action will remove the document and all associated vector embeddings from the CargoRule AI knowledge index.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingDoc(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
              >
                Delete Document
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
