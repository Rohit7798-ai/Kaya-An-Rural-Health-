import React from 'react';

export interface SectionCardProps {
  id: string;
  title: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  id,
  title,
  headerAction,
  children,
  className = '',
}) => {
  return (
    <section
      id={id}
      className={`bg-surface border border-border rounded-md p-8 shadow-none scroll-mt-20 text-left ${className}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-4 pb-6 border-b border-border">
        <h2 className="font-sans font-medium text-lg text-text tracking-tight">
          {title}
        </h2>
        {headerAction && (
          <div className="flex items-center gap-2">
            {headerAction}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="pt-6 setting-card-body">
        {children}
      </div>
    </section>
  );
};
