'use client';

import React from 'react';
import { DocumentProcessingStatus, ProcessingStep, ProcessingStepKey } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import {
  IconAlertCircle,
  IconCheck,
  IconCircle,
  IconCpu,
  IconDatabase,
  IconFileText,
  IconScissors,
  IconSpinner,
  IconUpload,
} from '../common/Icons';

export interface ProcessingStatusStepperProps {
  status: DocumentProcessingStatus;
  onReset?: () => void;
  onViewDocuments?: () => void;
  className?: string;
}

const defaultStepIcons: Record<ProcessingStepKey, React.ReactNode> = {
  UPLOADED: <IconUpload size={16} />,
  EXTRACTING: <IconFileText size={16} />,
  CHUNKING: <IconScissors size={16} />,
  EMBEDDING: <IconCpu size={16} />,
  INDEXING: <IconDatabase size={16} />,
  COMPLETED: <IconCheck size={16} />,
  FAILED: <IconAlertCircle size={16} />,
};

export const ProcessingStatusStepper: React.FC<ProcessingStatusStepperProps> = ({
  status,
  onReset,
  onViewDocuments,
  className = '',
}) => {
  const getStepIcon = (step: ProcessingStep) => {
    if (step.status === 'completed') {
      return <IconCheck size={14} className="text-white" />;
    }
    if (step.status === 'current') {
      return <IconSpinner size={14} className="text-blue-600 dark:text-blue-400" />;
    }
    if (step.status === 'failed') {
      return <IconAlertCircle size={14} className="text-rose-600 dark:text-rose-400" />;
    }
    return <IconCircle size={14} className="text-zinc-400 dark:text-zinc-600" />;
  };

  const getStepBadgeVariant = (stepStatus: ProcessingStep['status']) => {
    switch (stepStatus) {
      case 'completed':
        return 'success';
      case 'current':
        return 'primary';
      case 'failed':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <Card className={`p-5 sm:p-7 space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {status.documentName}
            </h3>
            <Badge
              variant={
                status.isComplete
                  ? 'success'
                  : status.isFailed
                  ? 'danger'
                  : 'primary'
              }
            >
              {status.isComplete
                ? 'INDEXED'
                : status.isFailed
                ? 'FAILED'
                : 'PROCESSING'}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Document ID: <code className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{status.documentId}</code>
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="w-full sm:w-48 space-y-1.5 shrink-0">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-zinc-500 dark:text-zinc-400">Progress</span>
            <span className="text-zinc-900 dark:text-zinc-100">
              {status.progressPercent}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out rounded-full ${
                status.isFailed
                  ? 'bg-rose-500'
                  : status.isComplete
                  ? 'bg-emerald-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${status.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Global Error Banner if Failed */}
      {status.isFailed && status.errorMessage && (
        <Alert variant="danger" title="Processing Error">
          {status.errorMessage}
        </Alert>
      )}

      {/* Timeline Stepper Container */}
      <div className="relative">
        {/* Desktop Horizontal Stepper Bar */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-3 relative">
          {status.steps.map((step, idx) => {
            const isLast = idx === status.steps.length - 1;
            return (
              <div key={step.key} className="flex flex-col items-start relative">
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`absolute top-4 left-8 right-0 h-0.5 z-0 ${
                      step.status === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  />
                )}

                {/* Icon Circle Marker */}
                <div className="flex items-center gap-2 z-10 mb-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                      step.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : step.status === 'current'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 shadow-xs'
                        : step.status === 'failed'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60'
                        : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                    }`}
                  >
                    {getStepIcon(step)}
                  </div>
                  <div className="text-zinc-400">
                    {defaultStepIcons[step.key]}
                  </div>
                </div>

                {/* Step Labels & Descriptions */}
                <div className="space-y-0.5 pr-2">
                  <span
                    className={`text-xs font-semibold block ${
                      step.status === 'completed'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : step.status === 'current'
                        ? 'text-blue-600 dark:text-blue-400'
                        : step.status === 'failed'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    {step.description}
                  </p>
                  {step.timestamp && (
                    <span className="text-[10px] text-zinc-400 font-mono block">
                      {step.timestamp}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile & Tablet Vertical Timeline Stepper */}
        <div className="lg:hidden space-y-4 relative pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 ml-3">
          {status.steps.map((step) => (
            <div key={step.key} className="relative pl-4 space-y-1">
              {/* Step Circle Pin on Border */}
              <div
                className={`absolute -left-[25px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  step.status === 'completed'
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : step.status === 'current'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : step.status === 'failed'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950'
                    : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                }`}
              >
                {getStepIcon(step)}
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold ${
                    step.status === 'completed'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : step.status === 'current'
                      ? 'text-blue-600 dark:text-blue-400'
                      : step.status === 'failed'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-zinc-400'
                  }`}
                >
                  {step.label}
                </span>
                <Badge variant={getStepBadgeVariant(step.status)} size="sm">
                  {step.status}
                </Badge>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {step.description}
              </p>

              {step.timestamp && (
                <span className="text-[10px] text-zinc-400 font-mono block">
                  {step.timestamp}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      {(onReset || onViewDocuments) && (
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Upload Another Document
            </button>
          )}

          {onViewDocuments && (
            <button
              type="button"
              onClick={onViewDocuments}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              View Document Management
            </button>
          )}
        </div>
      )}
    </Card>
  );
};
