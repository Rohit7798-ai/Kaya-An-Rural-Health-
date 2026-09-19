import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'lg',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6', // 24px padding per spec
  }[padding];

  return (
    <div
      {...props}
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-[8px] ${paddingStyles} ${className}`}
    >
      {children}
    </div>
  );
};
