import React from 'react';
import { EmptyState } from '../common/EmptyState';
import { IconCarriers, IconGlobe } from '../common/Icons';

interface CoverageSectionProps {
  countries?: string[];
  carriers?: string[];
}

export const CoverageSection: React.FC<CoverageSectionProps> = ({
  countries = [],
  carriers = [],
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Countries Covered Container */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IconGlobe size={18} className="text-zinc-500 dark:text-zinc-400" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Countries Covered
            </h3>
          </div>
          <span className="text-xs font-medium text-zinc-400">Regional Rules</span>
        </div>

        {countries.length === 0 ? (
          <EmptyState
            title="No country data available"
            description="Upload destination-specific customs & trade agreements to populate covered regions."
            icon={<IconGlobe size={24} />}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {countries.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Carriers Covered Container */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IconCarriers size={18} className="text-zinc-500 dark:text-zinc-400" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Carriers Covered
            </h3>
          </div>
          <span className="text-xs font-medium text-zinc-400">Carrier Guidelines</span>
        </div>

        {carriers.length === 0 ? (
          <EmptyState
            title="No carrier data available"
            description="Upload carrier agreements (e.g. DHL, FedEx, Maersk) to index specific shipping policies."
            icon={<IconCarriers size={24} />}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {carriers.map((car, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {car}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
