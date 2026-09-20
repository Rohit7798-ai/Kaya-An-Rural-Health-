import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Base classes
    const base =
      'inline-flex items-center justify-center font-sans font-medium transition-colors cursor-pointer select-none whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

    // Variant classes
    const variants = {
      primary: 'bg-accent text-surface hover:bg-accent-hover active:bg-accent-hover border border-transparent',
      secondary: 'bg-surface text-text border border-border hover:bg-surface-alt active:bg-border/40',
      ghost: 'bg-transparent text-text hover:bg-surface-alt active:bg-border/30 border border-transparent',
      destructive: 'bg-danger text-surface hover:bg-danger/90 active:bg-danger border border-transparent',
    };

    // Size classes
    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
      md: 'h-9 px-4 text-sm rounded-md gap-2',
      lg: 'h-11 px-5 text-md rounded-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
        ) : (
          icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
        )}
        <span>{children}</span>
        {!loading && icon && iconPosition === 'right' && (
          <span className="shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
