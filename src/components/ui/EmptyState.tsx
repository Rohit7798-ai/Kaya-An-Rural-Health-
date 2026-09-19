import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionNode?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  actionNode,
  icon,
  className = '',
}) => {
  return (
    <div
      className={`py-12 px-6 flex flex-col items-center justify-center text-center max-w-md mx-auto ${className}`}
    >
      {icon && <div className="text-text-muted mb-3">{icon}</div>}
      <p className="font-serif text-lg text-text leading-relaxed mb-1">
        {title}
      </p>
      {description && (
        <p className="font-sans text-xs text-text-muted mb-4 max-w-sm">
          {description}
        </p>
      )}
      {actionNode ? (
        <div className="mt-2">{actionNode}</div>
      ) : actionLabel && onAction ? (
        <div className="mt-2">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
