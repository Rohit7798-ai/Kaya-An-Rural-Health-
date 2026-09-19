import React from 'react';
import { X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  message: string;
  type?: 'success' | 'danger' | 'warning' | 'info';
  onDismiss?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onDismiss,
  className = '',
}) => {
  // Left accent bar color
  const accentBarClass = {
    success: 'border-l-accent',
    danger: 'border-l-danger',
    warning: 'border-l-warning',
    info: 'border-l-info',
  }[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-between gap-3 min-w-[280px] max-w-md p-3.5 bg-surface text-text rounded-sm border border-border border-l-4 ${accentBarClass} shadow-modal text-left transition-all ${className}`}
    >
      <p className="font-sans text-sm text-text leading-snug flex-1">
        {message}
      </p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="p-1 rounded-sm text-text-muted hover:text-text hover:bg-surface-alt transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
};

export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'danger' | 'warning' | 'info';
}

export interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={() => onDismiss(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};
