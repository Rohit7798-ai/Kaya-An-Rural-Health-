import React, { useState } from 'react';
import { Visit, Patient } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { FilePlus, Search, ArrowRight, Calendar, User } from 'lucide-react';

interface VisitsListScreenProps {
  visits: Visit[];
  patients: Patient[];
  onOpenVisitNotes: (visit: Visit) => void;
  onNewVisit: () => void;
  onOpenPatientProfile: (patientId: string) => void;
}

export const VisitsListScreen: React.FC<VisitsListScreenProps> = ({
  visits,
  patients,
  onOpenVisitNotes,
  onNewVisit,
  onOpenPatientProfile,
}) => {
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredVisits = visits.filter((v) => {
    if (filterDate && v.date !== filterDate) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.patientName.toLowerCase().includes(q) ||
        v.patientClinicId.toLowerCase().includes(q) ||
        v.chiefComplaint.toLowerCase().includes(q) ||
        v.diagnosis.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full max-w-[1280px] mx-auto text-left">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--text)] tracking-tight">
            Consultation Register
          </h1>
          <p className="text-[14px] text-[var(--text-muted)] mt-0.5">
            Log of all clinical outpatient consultations and triage records
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onNewVisit}
          icon={<FilePlus className="w-4 h-4" />}
        >
          New visit <span className="font-mono-tabular text-[12px] opacity-75 ml-1">V</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter visits by patient, complaint, diagnosis…"
            className="w-full h-10 pl-10 pr-3 bg-[var(--surface)] border border-[var(--border)] rounded-[6px] text-[14px]"
          />
        </div>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="h-10 px-3 bg-[var(--surface)] border border-[var(--border)] rounded-[6px] text-[13px] font-mono-tabular text-[var(--text)]"
          title="Filter by specific visit date"
        />

        {filterDate && (
          <Button variant="ghost" size="sm" onClick={() => setFilterDate('')}>
            Clear date
          </Button>
        )}
      </div>

      {/* Table */}
      <Card padding="none">
        {filteredVisits.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-clinical-notes text-[17px] text-[var(--text)] mb-2">
              No visits found for this criteria.
            </p>
            <p className="text-[13px] text-[var(--text-muted)] mb-4">
              Clear filters or record a new clinical consultation.
            </p>
            <Button variant="primary" size="md" onClick={onNewVisit}>
              New visit
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            <div className="grid grid-cols-12 px-6 py-3 text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-[0.04em]">
              <div className="col-span-2">Date & Time</div>
              <div className="col-span-4">Patient & Village</div>
              <div className="col-span-4">Diagnosis / Complaint</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {filteredVisits.map((visit) => {
              const patient = patients.find((p) => p.id === visit.patientId);

              return (
                <div
                  key={visit.id}
                  className="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-[var(--surface-alt)]/40 transition-colors text-[14px]"
                >
                  <div className="col-span-2">
                    <span className="font-mono-tabular font-medium text-[var(--text)] block">
                      {visit.date}
                    </span>
                    <span className="font-mono-tabular text-[12px] text-[var(--text-muted)]">
                      {visit.time}
                    </span>
                  </div>

                  <div className="col-span-4 min-w-0 pr-3">
                    <button
                      type="button"
                      onClick={() => onOpenPatientProfile(visit.patientId)}
                      className="font-medium text-[var(--text)] hover:text-[var(--accent)] hover:underline truncate block text-left cursor-pointer"
                    >
                      {visit.patientName}
                    </button>
                    <span className="text-[12px] text-[var(--text-muted)] font-mono-tabular">
                      {visit.patientClinicId} {patient ? `· ${patient.village}` : ''}
                    </span>
                  </div>

                  <div className="col-span-4 min-w-0 pr-3">
                    <p className="text-[13px] font-medium text-[var(--text)] truncate">
                      {visit.diagnosis || visit.chiefComplaint}
                    </p>
                    <p className="text-[12px] text-[var(--text-muted)] truncate">
                      {visit.clinicianName}
                    </p>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onOpenVisitNotes(visit)}
                    >
                      Open note
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
