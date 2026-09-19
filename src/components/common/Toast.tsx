import React, { useEffect } from 'react';
import { ToastMessage } from '../../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 p-3 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-[6px] text-[13px] ${
        isSuccess ? 'border-l-4 border-l-[var(--success)]' : 'border-l-4 border-l-[var(--danger)]'
      }`}
    >
      <div className="flex-1 font-normal leading-snug">{toast.message}</div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-[var(--text-muted)] hover:text-[var(--text)] text-[11px] font-mono-tabular ml-2 cursor-pointer"
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
};
