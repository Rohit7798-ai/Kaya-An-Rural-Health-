import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export interface DeleteDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicName: string;
  onConfirmDelete: () => void;
}

export const DeleteDataModal: React.FC<DeleteDataModalProps> = ({
  isOpen,
  onClose,
  clinicName,
  onConfirmDelete,
}) => {
  const [typedName, setTypedName] = useState('');

  // Reset input when opened
  useEffect(() => {
    if (isOpen) {
      setTypedName('');
    }
  }, [isOpen]);

  // Handle Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMatch = typedName.trim() === clinicName.trim();

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch) return;
    onConfirmDelete();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-data-modal-title"
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-[1px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface border border-border rounded-md p-6 sm:p-8 max-w-[480px] w-full shadow-modal text-left animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-danger-soft flex items-center justify-center text-danger shrink-0">
            <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <h2
            id="delete-data-modal-title"
            className="font-sans font-medium text-lg text-text tracking-tight"
          >
            Delete all clinic data?
          </h2>
        </div>

        <p className="font-sans text-sm text-text-muted leading-relaxed mb-6">
          Every patient, visit, and attachment will be permanently removed from this device and the server. This cannot be undone.
        </p>

        <form onSubmit={handleConfirm} className="flex flex-col gap-5">
          <div>
            <label htmlFor="confirm-clinic-name-input" className="block text-xs font-sans font-medium text-text mb-1.5">
              Type <span className="font-mono text-text bg-surface-alt px-1.5 py-0.5 rounded-sm border border-border">{clinicName}</span> to confirm
            </label>
            <input
              id="confirm-clinic-name-input"
              autoFocus
              type="text"
              required
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Type the clinic name to confirm"
              className="w-full h-9 px-3 bg-surface-alt border border-border text-text font-sans text-sm rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-danger"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-xs font-sans text-text-muted hover:text-text bg-surface-alt hover:bg-border/60 border border-border rounded-sm cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMatch}
              className="h-9 px-4 text-xs font-sans font-medium text-surface bg-danger hover:bg-danger/90 rounded-sm cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete everything
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
