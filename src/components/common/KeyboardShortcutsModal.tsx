import React from 'react';
import { Button } from './Button';
import { X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘K or /', label: 'Global patient search' },
    { key: 'N', label: 'New patient registration' },
    { key: 'V', label: 'New clinical visit' },
    { key: 'T', label: 'Go to Today queue' },
    { key: 'P', label: 'Go to Patient register' },
    { key: 'R', label: 'Go to Clinic reports' },
    { key: 'S', label: 'Go to Settings' },
    { key: 'Q', label: 'Open offline sync queue' },
    { key: '⌘S', label: 'Save active form / record' },
    { key: 'Esc', label: 'Close open dialog or search' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-none p-4"
    >
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-6 modal-hairline-shadow flex flex-col gap-4 text-left">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div>
            <h2 className="text-[18px] font-semibold text-[var(--text)]">Keyboard Shortcuts</h2>
            <p className="text-[13px] text-[var(--text-muted)]">
              Designed for fast navigation without a mouse
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-alt)] cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col divide-y divide-[var(--border)]">
          {shortcuts.map((sc) => (
            <div key={sc.key} className="py-2.5 flex items-center justify-between text-[13px]">
              <span className="text-[var(--text)]">{sc.label}</span>
              <kbd className="px-2 py-1 text-[12px] font-mono-tabular bg-[var(--surface-alt)] text-[var(--text)] border border-[var(--border)] rounded-[4px]">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="secondary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
