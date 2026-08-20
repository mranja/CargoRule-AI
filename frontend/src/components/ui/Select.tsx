import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      helperText,
      error,
      placeholder = 'Select an option',
      className = '',
      id,
      disabled,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={inputId}
          disabled={disabled}
          value={value}
          onChange={onChange}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-2 disabled:bg-zinc-100 disabled:opacity-60 dark:bg-zinc-950 dark:text-zinc-100 dark:disabled:bg-zinc-900 ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-zinc-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-zinc-800'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {error ? (
          <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
