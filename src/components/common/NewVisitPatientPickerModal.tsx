import React, { useState } from 'react';
import { Patient } from '../../types';
import { Button } from './Button';
import { Search, UserPlus, X, FilePlus } from 'lucide-react';

interface NewVisitPatientPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onNewPatient: () => void;
}

export const NewVisitPatientPickerModal: React.FC<NewVisitPatientPickerModalProps> = ({
  isOpen,
  onClose,
  patients,
  onSelectPatient,
  onNewPatient,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = search.trim()
    ? patients.filter(
        (p) =>
          p.fullName.toLowerCase().includes(search.toLowerCase()) ||
          p.clinicId.toLowerCase().includes(search.toLowerCase()) ||
          p.village.toLowerCase().includes(search.toLowerCase())
      )
    : patients;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-[8px] modal-hairline-shadow flex flex-col max-h-[80vh] text-left">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-semibold text-[var(--text)]">
              Select Patient for New Visit
            </h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Choose an existing patient from register or register a walk-in
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-alt)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-alt)]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, or village…"
              className="w-full h-10 pl-9 pr-3 bg-[var(--surface)] border border-[var(--border)] rounded-[6px] text-[14px]"
              autoFocus
            />
          </div>
        </div>

        {/* Patients list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)] p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-clinical-notes text-[15px] text-[var(--text)] mb-2">
                No matching patient found.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onNewPatient();
                }}
                icon={<UserPlus className="w-3.5 h-3.5" />}
              >
                Register as new patient
              </Button>
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectPatient(p);
                  onClose();
                }}
                className="p-3 rounded-[6px] hover:bg-[var(--surface-alt)] cursor-pointer flex items-center justify-between transition-colors"
              >
                <div>
                  <p className="font-medium text-[14px] text-[var(--text)]">{p.fullName}</p>
                  <p className="text-[12px] text-[var(--text-muted)] font-mono-tabular">
                    {p.clinicId} · {p.age}y {p.gender[0]} · {p.village}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPatient(p);
                    onClose();
                  }}
                  icon={<FilePlus className="w-3.5 h-3.5" />}
                >
                  Start visit
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose();
              onNewPatient();
            }}
            icon={<UserPlus className="w-3.5 h-3.5" />}
          >
            New patient
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
