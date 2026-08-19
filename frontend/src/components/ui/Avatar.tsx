import React from 'react';

export interface AvatarProps {
  src?: string;
  name?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  initials,
  size = 'md',
  className = '',
}) => {
  const computedInitials =
    initials ||
    (name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      : 'OP');

  const sizeStyles = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
  };

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 ${sizeStyles[size]} ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || 'User avatar'}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{computedInitials}</span>
      )}
    </div>
  );
};
