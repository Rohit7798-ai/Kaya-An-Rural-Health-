import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'terra';
  children: React.ReactNode;
  mono?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  mono = false,
  size = 'md',
}) => {
  const variantStyles = {
    success: 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30',
    warning: 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/30',
    danger: 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]/30',
    info: 'bg-[var(--surface-alt)] text-[var(--info)] border-[var(--border)]',
    neutral: 'bg-[var(--surface-alt)] text-[var(--text-muted)] border-[var(--border)]',
    terra: 'bg-[var(--terra-soft)] text-[var(--terra)] border-[var(--terra)]/30',
  }[variant];

  const sizeStyles = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-[12px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] border font-medium whitespace-nowrap leading-none ${sizeStyles} ${
        mono ? 'font-mono-tabular' : ''
      } ${variantStyles}`}
    >
      {children}
    </span>
  );
};
