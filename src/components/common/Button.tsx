import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  title,
  ...props
}) => {
  // Height and font styling based on size token
  const sizeStyles = {
    sm: 'h-8 px-3 text-[13px] gap-1.5',
    md: 'h-10 px-4 text-[15px] gap-2',
    lg: 'h-12 px-5 text-[15px] gap-2.5',
  }[size];

  // Colors strictly conforming to design tokens (no blue, no purple, no gradients)
  const variantStyles = {
    primary:
      'bg-[var(--accent)] text-[#FDFBF7] hover:bg-[var(--accent-hover)] border border-transparent font-medium shadow-none',
    secondary:
      'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-alt)] font-medium',
    ghost:
      'bg-transparent text-[var(--text)] hover:bg-[var(--surface-alt)] border border-transparent font-medium',
    destructive:
      'bg-[var(--surface)] text-[var(--danger)] border border-[var(--danger)] hover:bg-[var(--danger-soft)] font-medium',
  }[variant];

  return (
    <button
      {...props}
      title={title}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center rounded-[6px] transition-colors duration-120 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-h-[36px] ${sizeStyles} ${variantStyles} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};
