import React, { useState, useEffect, useRef } from 'react';
import { Patient } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Search, UserPlus, ArrowRight, X } from 'lucide-react';

interface PatientSearchScreenProps {
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
  onNewPatient: () => void;
  onNewVisitForPatient: (patient: Patient) => void;
  initialQuery?: string;
}

export const PatientSearchScreen: React.FC<PatientSearchScreenProps> = ({
  patients,
  onSelectPatient,
  onNewPatient,
  onNewVisitForPatient,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmedQuery = query.trim().toLowerCase();

  const filteredPatients = trimmedQuery
    ? patients.filter((p) => {
        return (
          p.fullName.toLowerCase().includes(trimmedQuery) ||
          p.clinicId.toLowerCase().includes(trimmedQuery) ||
          p.village.toLowerCase().includes(trimmedQuery) ||
          (p.nationalId && p.nationalId.toLowerCase().includes(trimmedQuery)) ||
          p.phone.includes(trimmedQuery)
        );
      })
    : patients;

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation for results list (Up, Down, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredPatients.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredPatients[selectedIndex]) {
        onSelectPatient(filteredPatients[selectedIndex].id);
      }
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto text-left">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--text)] tracking-tight">
            Patient Register
          </h1>
          <p className="text-[14px] text-[var(--text-muted)] mt-0.5">
            Search across registered village records, IDs, and phone contacts
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onNewPatient}
          icon={<UserPlus className="w-4 h-4" />}
        >
          New patient <span className="font-mono-tabular text-[12px] opacity-75 ml-1">N</span>
        </Button>
      </div>

      {/* Full-width Search Bar */}
      <div className="mb-6 relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 absolute left-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by name, ID, or village… (use ↑ and ↓ to select, Enter to open)"
            className="w-full h-12 pl-12 pr-10 bg-[var(--surface)] border border-[var(--border)] rounded-[6px] text-[16px] text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent)] transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 w-7 h-7 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 px-1 text-[12px] text-[var(--text-muted)] font-mono-tabular">
          <span>
            {filteredPatients.length} matching {filteredPatients.length === 1 ? 'record' : 'records'}
          </span>
          <span>Press Enter to view selected chart</span>
        </div>
      </div>

      {/* Results Table */}
      <Card padding="none">
        {filteredPatients.length === 0 ? (
          <div className="py-20 px-6 text-center">
            <p className="font-clinical-notes text-[17px] text-[var(--text)] mb-2">
              Search by name, ID, or village.
            </p>
            <p className="text-[13px] text-[var(--text-muted)] mb-5">
              No matching patient records found in local clinic storage.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={onNewPatient}
              icon={<UserPlus className="w-4 h-4" />}
            >
              Register new patient
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-6 py-3 text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-[0.04em]">
              <div className="col-span-3">Patient Name</div>
              <div className="col-span-2">Clinic ID</div>
              <div className="col-span-2">Age / Sex</div>
              <div className="col-span-2">Village</div>
              <div className="col-span-1">Visits</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table Rows */}
            {filteredPatients.map((patient, index) => {
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={patient.id}
                  onClick={() => onSelectPatient(patient.id)}
                  className={`grid grid-cols-12 px-6 py-3.5 items-center transition-colors cursor-pointer text-[14px] ${
                    isSelected
                      ? 'bg-[var(--accent-soft)]/60 border-l-[3px] border-l-[var(--accent)] pl-[21px]'
                      : 'hover:bg-[var(--surface-alt)]/50 border-l-[3px] border-l-transparent'
                  }`}
                >
                  {/* Name & Phone */}
                  <div className="col-span-3 min-w-0 pr-2">
                    <p className="font-medium text-[var(--text)] truncate">{patient.fullName}</p>
                    <p className="text-[12px] text-[var(--text-muted)] font-mono-tabular">
                      {patient.phone || 'No phone'}
                    </p>
                  </div>

                  {/* Clinic ID */}
                  <div className="col-span-2">
                    <span className="font-mono-tabular text-[13px] text-[var(--text)]">
                      {patient.clinicId}
                    </span>
                  </div>

                  {/* Age / Sex */}
                  <div className="col-span-2 text-[13px] text-[var(--text)] font-mono-tabular">
                    {patient.age}y · {patient.gender}
                  </div>

                  {/* Village */}
                  <div className="col-span-2 text-[13px] text-[var(--text)] truncate">
                    {patient.village}
                  </div>

                  {/* Visits */}
                  <div className="col-span-1 text-[13px] font-mono-tabular text-[var(--text)]">
                    {patient.totalVisits}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNewVisitForPatient(patient)}
                      title="Create visit for this patient"
                    >
                      New visit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectPatient(patient.id)}
                      title="Open full chart"
                    >
                      Chart →
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
