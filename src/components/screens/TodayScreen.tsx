import React, { useState } from 'react';
import { Visit, Patient } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { UserPlus, FilePlus, Search, ArrowRight, Clock, UserCheck } from 'lucide-react';

interface TodayScreenProps {
  visits: Visit[];
  patients: Patient[];
  onOpenVisitNotes: (visit: Visit) => void;
  onNewPatient: () => void;
  onNewVisit: () => void;
  onOpenSearch: () => void;
  onOpenPatientProfile: (patientId: string) => void;
  clinicName: string;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  visits,
  patients,
  onOpenVisitNotes,
  onNewPatient,
  onNewVisit,
  onOpenSearch,
  onOpenPatientProfile,
  clinicName,
}) => {
  const [filter, setFilter] = useState<'All' | 'Waiting' | 'In Consultation' | 'Completed'>('All');

  // Filter today's visits
  const todayDate = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter((v) => v.date === todayDate || v.date === '2026-09-19');

  const filteredVisits = todayVisits.filter((v) => {
    if (filter === 'All') return true;
    return v.status === filter;
  });

  const waitingCount = todayVisits.filter((v) => v.status === 'Waiting').length;
  const inConsultCount = todayVisits.filter((v) => v.status === 'In Consultation').length;
  const completedCount = todayVisits.filter((v) => v.status === 'Completed').length;

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="w-full max-w-[1280px] mx-auto text-left">
      {/* Top Header: Date + Clinic Name */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--text)] tracking-tight">Today</h1>
          <p className="text-[14px] text-[var(--text-muted)] mt-0.5">
            {formattedDate} · {clinicName}
          </p>
        </div>

        {/* Status count summary */}
        <div className="flex items-center gap-3 text-[13px]">
          <span className="text-[var(--text-muted)]">Queue summary:</span>
          <span className="font-mono-tabular font-medium text-[var(--warning)]">
            {waitingCount} waiting
          </span>
          <span className="text-[var(--border-strong)]">·</span>
          <span className="font-mono-tabular font-medium text-[var(--accent)]">
            {inConsultCount} in consult
          </span>
          <span className="text-[var(--border-strong)]">·</span>
          <span className="font-mono-tabular font-medium text-[var(--text-muted)]">
            {completedCount} completed
          </span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Today's Appointments & Queue (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Segmented Filter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-[var(--surface-alt)] p-1 rounded-[6px] border border-[var(--border)]">
              {(['All', 'Waiting', 'In Consultation', 'Completed'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`h-8 px-3 text-[13px] font-medium rounded-[4px] transition-colors cursor-pointer select-none ${
                    filter === tab
                      ? 'bg-[var(--surface)] text-[var(--text)] shadow-none border border-[var(--border-strong)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <span className="text-[12px] font-mono-tabular text-[var(--text-muted)]">
              {filteredVisits.length} {filteredVisits.length === 1 ? 'patient' : 'patients'}
            </span>
          </div>

          {/* Visits Table / List */}
          <Card padding="none">
            {filteredVisits.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <p className="font-clinical-notes text-[17px] text-[var(--text)] mb-2">
                  No patients in this queue right now.
                </p>
                <p className="text-[13px] text-[var(--text-muted)] mb-4">
                  Register a walk-in patient or check in an arrival.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="secondary" size="md" onClick={onNewPatient}>
                    New patient
                  </Button>
                  <Button variant="primary" size="md" onClick={onNewVisit}>
                    New visit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {/* Table Header */}
                <div className="grid grid-cols-12 px-6 py-3 text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-[0.04em]">
                  <div className="col-span-2">Time</div>
                  <div className="col-span-4">Patient & ID</div>
                  <div className="col-span-4">Chief Complaint / Triage</div>
                  <div className="col-span-2 text-right">Action</div>
                </div>

                {/* Table Rows */}
                {filteredVisits.map((visit) => {
                  const patient = patients.find((p) => p.id === visit.patientId);

                  return (
                    <div
                      key={visit.id}
                      className="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-[var(--surface-alt)]/40 transition-colors group text-[14px]"
                    >
                      {/* Time */}
                      <div className="col-span-2 flex flex-col">
                        <span className="font-mono-tabular font-medium text-[var(--text)]">
                          {visit.time}
                        </span>
                        <div className="mt-1">
                          <Badge
                            variant={
                              visit.status === 'Waiting'
                                ? 'warning'
                                : visit.status === 'In Consultation'
                                ? 'terra'
                                : 'success'
                            }
                            size="sm"
                          >
                            {visit.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Patient & ID */}
                      <div className="col-span-4 min-w-0 pr-3">
                        <button
                          type="button"
                          onClick={() => onOpenPatientProfile(visit.patientId)}
                          className="font-medium text-[var(--text)] hover:text-[var(--accent)] hover:underline truncate text-left block cursor-pointer"
                        >
                          {visit.patientName}
                        </button>
                        <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)] mt-0.5">
                          <span className="font-mono-tabular">{visit.patientClinicId}</span>
                          {patient && (
                            <>
                              <span>·</span>
                              <span>
                                {patient.age}y {patient.gender[0]}
                              </span>
                              <span>·</span>
                              <span className="truncate">{patient.village}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Complaint & Vitals preview */}
                      <div className="col-span-4 min-w-0 pr-3">
                        <p className="text-[13px] text-[var(--text)] truncate leading-snug">
                          {visit.chiefComplaint}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] font-mono-tabular text-[var(--text-muted)] mt-1">
                          {visit.vitals.bloodPressureSystolic && (
                            <span>
                              BP {visit.vitals.bloodPressureSystolic}/{visit.vitals.bloodPressureDiastolic}
                            </span>
                          )}
                          {visit.vitals.tempCelsius && (
                            <span>· {visit.vitals.tempCelsius}°C</span>
                          )}
                          {visit.vitals.pulseBpm && <span>· {visit.vitals.pulseBpm} bpm</span>}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="col-span-2 flex justify-end">
                        <Button
                          variant={visit.status === 'In Consultation' ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => onOpenVisitNotes(visit)}
                          title="Open clinical notes for this visit"
                        >
                          {visit.status === 'Completed' ? 'View note' : 'Open note'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Quick Actions & Clinic Glance (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Quick Actions Card */}
          <Card padding="md">
            <h2 className="text-[15px] font-semibold text-[var(--text)] mb-3">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                size="lg"
                onClick={onNewPatient}
                icon={<UserPlus className="w-4 h-4" />}
                className="justify-start px-4 w-full"
              >
                New patient <span className="ml-auto font-mono-tabular text-[12px] opacity-75">N</span>
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={onNewVisit}
                icon={<FilePlus className="w-4 h-4" />}
                className="justify-start px-4 w-full"
              >
                New visit <span className="ml-auto font-mono-tabular text-[12px] text-[var(--text-faint)]">V</span>
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={onOpenSearch}
                icon={<Search className="w-4 h-4" />}
                className="justify-start px-4 w-full"
              >
                Find patient <span className="ml-auto font-mono-tabular text-[12px] text-[var(--text-faint)]">⌘K</span>
              </Button>
            </div>
          </Card>

          {/* Clinic Day Statistics */}
          <Card padding="md">
            <h2 className="text-[15px] font-semibold text-[var(--text)] mb-3">Today's Clinic Register</h2>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[13px] py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Total registrations</span>
                <span className="font-mono-tabular font-medium text-[var(--text)]">
                  {patients.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px] py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Visits logged today</span>
                <span className="font-mono-tabular font-medium text-[var(--text)]">
                  {todayVisits.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px] py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Average consult time</span>
                <span className="font-mono-tabular font-medium text-[var(--text)]">8.5 min</span>
              </div>
              <div className="flex items-center justify-between text-[13px] py-1">
                <span className="text-[var(--text-muted)]">Offline sync status</span>
                <span className="font-mono-tabular font-medium text-[var(--accent)]">
                  Ready (local-first)
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Notice Card */}
          <div className="p-4 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[8px] text-[13px] text-[var(--text-muted)] leading-relaxed">
            <p className="font-medium text-[var(--text)] mb-1">Rural Clinic Note</p>
            Patients without phone numbers can be searched by village or family name. Press <kbd className="px-1 py-0.5 text-[11px] font-mono-tabular bg-[var(--surface)] border border-[var(--border)] rounded">⌘K</kbd> anywhere.
          </div>
        </div>
      </div>
    </div>
  );
};
