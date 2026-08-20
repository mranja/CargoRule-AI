import React from 'react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  className = '',
}) => {
  const variantStyles = {
    info: 'bg-blue-50/80 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900/50',
    success: 'bg-emerald-50/80 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/50',
    warning: 'bg-amber-50/80 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/50',
    danger: 'bg-rose-50/80 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900/50',
  };

  return (
    <div
      role="alert"
      className={`flex gap-3 rounded-xl border p-4 text-xs leading-relaxed ${variantStyles[variant]} ${className}`}
    >
      {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
      <div className="flex-1 space-y-0.5">
        {title && <h4 className="font-semibold text-xs leading-tight">{title}</h4>}
        <div>{children}</div>
      </div>
    </div>
  );
};
