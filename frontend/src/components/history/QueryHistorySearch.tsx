'use client';

import React from 'react';
import { Input } from '../ui/Input';
import { IconClose, IconSearch } from '../common/Icons';

export interface QueryHistorySearchProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

export const QueryHistorySearch: React.FC<QueryHistorySearchProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search previous questions or answers...',
  className = '',
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        leftIcon={<IconSearch size={16} />}
        rightIcon={
          value ? (
            <button
              type="button"
              onClick={onClear}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              title="Clear search"
            >
              <IconClose size={14} />
            </button>
          ) : undefined
        }
      />
    </div>
  );
};
