import React from 'react';
import { UploadFormErrors, UploadMetadata } from '@/types';
import { Input } from '../ui/Input';
import { Select, SelectOption } from '../ui/Select';

export interface DocumentMetadataFormProps {
  metadata: UploadMetadata;
  onChange: (updated: Partial<UploadMetadata>) => void;
  errors: UploadFormErrors;
  disabled?: boolean;
}

const countryOptions: SelectOption[] = [
  { value: 'Global', label: 'Global / All Regions' },
  { value: 'Germany', label: 'Germany (DE)' },
  { value: 'India', label: 'India (IN)' },
  { value: 'United States', label: 'United States (US)' },
  { value: 'United Kingdom', label: 'United Kingdom (UK)' },
  { value: 'Singapore', label: 'Singapore (SG)' },
  { value: 'China', label: 'China (CN)' },
  { value: 'France', label: 'France (FR)' },
  { value: 'Netherlands', label: 'Netherlands (NL)' },
  { value: 'Japan', label: 'Japan (JP)' },
  { value: 'Australia', label: 'Australia (AU)' },
  { value: 'Other', label: 'Other Country' },
];

const carrierOptions: SelectOption[] = [
  { value: 'All', label: 'All / Any Carrier' },
  { value: 'DHL Express', label: 'DHL Express' },
  { value: 'FedEx', label: 'FedEx' },
  { value: 'Maersk', label: 'Maersk Line' },
  { value: 'DB Schenker', label: 'DB Schenker' },
  { value: 'UPS', label: 'UPS Supply Chain' },
  { value: 'Hapag-Lloyd', label: 'Hapag-Lloyd' },
  { value: 'MSC', label: 'MSC Cargo' },
  { value: 'Other', label: 'Other Carrier' },
];

const documentTypeOptions: SelectOption[] = [
  { value: 'Customs Regulation', label: 'Customs Regulation' },
  { value: 'Shipping Policy', label: 'Shipping Policy' },
  { value: 'Carrier Agreement', label: 'Carrier Agreement' },
  { value: 'Import Requirement', label: 'Import Requirement' },
  { value: 'Export Requirement', label: 'Export Requirement' },
  { value: 'Dangerous Goods Restriction', label: 'Dangerous Goods Restriction' },
  { value: 'Other', label: 'Other' },
];

export const DocumentMetadataForm: React.FC<DocumentMetadataFormProps> = ({
  metadata,
  onChange,
  errors,
  disabled = false,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Document Name Field */}
      <div className="sm:col-span-2">
        <Input
          label="Document Name *"
          placeholder="e.g. Germany Import & Dangerous Goods Regulations 2026"
          value={metadata.documentName}
          onChange={(e) => onChange({ documentName: e.target.value })}
          error={errors.documentName}
          disabled={disabled}
          helperText="Enter a descriptive title for easy indexing and search grounding."
        />
      </div>

      {/* Document Type Dropdown */}
      <Select
        label="Document Type *"
        options={documentTypeOptions}
        placeholder="Select document type"
        value={metadata.documentType}
        onChange={(e) => onChange({ documentType: e.target.value })}
        error={errors.documentType}
        disabled={disabled}
      />

      {/* Country Dropdown */}
      <Select
        label="Country / Region"
        options={countryOptions}
        placeholder="Select country"
        value={metadata.country}
        onChange={(e) => onChange({ country: e.target.value })}
        error={errors.country}
        disabled={disabled}
      />

      {/* Carrier Dropdown */}
      <Select
        label="Carrier Agreement"
        options={carrierOptions}
        placeholder="Select carrier"
        value={metadata.carrier}
        onChange={(e) => onChange({ carrier: e.target.value })}
        error={errors.carrier}
        disabled={disabled}
      />

      {/* Version Input */}
      <Input
        label="Document Version"
        placeholder="e.g. 1.0 or 2026-v2"
        value={metadata.version}
        onChange={(e) => onChange({ version: e.target.value })}
        error={errors.version}
        disabled={disabled}
      />

      {/* Effective Date Picker */}
      <Input
        label="Effective Date"
        type="date"
        value={metadata.effectiveDate}
        onChange={(e) => onChange({ effectiveDate: e.target.value })}
        error={errors.effectiveDate}
        disabled={disabled}
      />

      {/* Expiry Date Picker */}
      <Input
        label="Expiry Date"
        type="date"
        value={metadata.expiryDate}
        onChange={(e) => onChange({ expiryDate: e.target.value })}
        error={errors.expiryDate}
        disabled={disabled}
      />
    </div>
  );
};
