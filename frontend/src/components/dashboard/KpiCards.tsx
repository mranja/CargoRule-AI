import React from 'react';
import { KpiCard } from '../common/KpiCard';

interface KpiCardsProps {
  totalDocuments?: number;
  totalCountries?: number;
  totalCarriers?: number;
  totalQueries?: number;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  totalDocuments,
  totalCountries,
  totalCarriers,
  totalQueries,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <KpiCard
        label="Total Documents"
        value={totalDocuments !== undefined ? totalDocuments : '--'}
        subtext="Indexed in vector DB"
        iconName="documents"
        isPlaceholder={totalDocuments === undefined}
      />
      <KpiCard
        label="Countries Covered"
        value={totalCountries !== undefined ? totalCountries : '--'}
        subtext="Active destinations"
        iconName="countries"
        isPlaceholder={totalCountries === undefined}
      />
      <KpiCard
        label="Carriers Covered"
        value={totalCarriers !== undefined ? totalCarriers : '--'}
        subtext="Loaded shipping agreements"
        iconName="carriers"
        isPlaceholder={totalCarriers === undefined}
      />
      <KpiCard
        label="Recent Queries"
        value={totalQueries !== undefined ? totalQueries : '--'}
        subtext="RAG searches performed"
        iconName="history"
        isPlaceholder={totalQueries === undefined}
      />
    </div>
  );
};
