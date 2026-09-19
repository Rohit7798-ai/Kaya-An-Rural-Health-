import React, { useState, useEffect, useRef } from 'react';
import { Patient } from '../../types';
import { Search, X, UserPlus, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
  onNewPatient: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  patients,
  onSelectPatient,
  onNewPatient,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();
  const results = trimmed
    ? patients.filter(
        (p) =>
          p.fullName.toLowerCase().includes(trimmed) ||
          p.clinicId.toLowerCase().includes(trimmed) ||
          p.village.toLowerCase().includes(trimmed) ||
          (p.nationalId && p.nationalId.toLowerCase().includes(trimmed)) ||
          p.phone.includes(trimmed)
      )
    : patients.slice(0, 6);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelectPatient(results[selectedIndex].id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Find Patient"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border)] rounded-[8px] modal-hairline-shadow overflow-hidden flex flex-col text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input field */}
        <div className="flex items-center px-4 border-b border-[var(--border)] bg-[var(--surface)]">
          <Search className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search patient by name, ID, or village… (use ↑ ↓, Enter)"
            className="w-full h-14 px-3 bg-transparent text-[16px] text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono-tabular bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--border)] rounded-[4px]">
            Esc
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)] p-2">
          {results.length === 0 ? (
            <div className="py-8 text-center px-4">
              <p className="font-clinical-notes text-[15px] text-[var(--text-muted)] mb-2">
                No patients found matching "{query}"
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNewPatient();
                }}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent)] hover:underline cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Register as new patient
              </button>
            </div>
          ) : (
            results.map((patient, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={patient.id}
                  onClick={() => {
                    onSelectPatient(patient.id);
                    onClose();
                  }}
                  className={`p-3 rounded-[6px] flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--accent-soft)] text-[var(--text)] border border-[var(--accent)]/30'
                      : 'hover:bg-[var(--surface-alt)]'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-medium text-[14px] text-[var(--text)] truncate">
                      {patient.fullName}
                    </p>
                    <p className="text-[12px] text-[var(--text-muted)] font-mono-tabular">
                      {patient.clinicId} · {patient.age}y {patient.gender[0]} · {patient.village}
                    </p>
                  </div>

                  <span className="text-[12px] font-mono-tabular text-[var(--text-muted)] shrink-0">
                    Open chart →
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[var(--surface-alt)] border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono-tabular">
          <span>↑ ↓ Navigate</span>
          <span>↵ Open Patient Chart</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
};
