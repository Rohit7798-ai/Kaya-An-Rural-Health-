import React, { useState } from 'react';
import { Patient, Visit } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  FilePlus,
  Edit3,
  Printer,
  ChevronLeft,
  AlertCircle,
  Clock,
  Calendar,
  User,
  Heart,
  Pill,
} from 'lucide-react';

interface PatientProfileScreenProps {
  patient: Patient;
  visits: Visit[];
  onBack: () => void;
  onNewVisit: (patient: Patient) => void;
  onOpenVisitNotes: (visit: Visit) => void;
  onEditPatient: (patient: Patient) => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export const PatientProfileScreen: React.FC<PatientProfileScreenProps> = ({
  patient,
  visits,
  onBack,
  onNewVisit,
  onOpenVisitNotes,
  onEditPatient,
  onShowToast,
}) => {
  // Visits for this patient, sorted newest first
  const patientVisits = visits
    .filter((v) => v.patientId === patient.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handlePrint = () => {
    window.print();
    onShowToast(`Print register summary queued for ${patient.fullName}`, 'success');
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto text-left">
      {/* Sticky Action Bar & Back Nav */}
      <div className="sticky top-0 z-10 bg-[var(--bg)]/95 backdrop-blur-none border-b border-[var(--border)] py-3 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={onBack}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-[20px] font-semibold text-[var(--text)] tracking-tight">
              {patient.fullName}
            </h1>
            <span className="font-mono-tabular text-[12px] text-[var(--text-muted)]">
              {patient.clinicId} · {patient.village}
            </span>
          </div>
        </div>

        {/* Sticky Action Bar: New visit, Edit, Print */}
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => onNewVisit(patient)}
            icon={<FilePlus className="w-4 h-4" />}
          >
            New visit <span className="ml-1 font-mono-tabular text-[11px] opacity-75">V</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => onEditPatient(patient)}
            icon={<Edit3 className="w-4 h-4" />}
          >
            Edit profile
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={handlePrint}
            icon={<Printer className="w-4 h-4" />}
            title="Print patient summary register"
          >
            Print
          </Button>
        </div>
      </div>

      {/* Two-Column Layout: Left Demographics (4 cols) | Right Visits Timeline (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Demographics Card (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card padding="md">
            <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-4">
              Patient Demographics
            </h2>

            <div className="flex flex-col gap-3 text-[14px]">
              <div className="pb-3 border-b border-[var(--border)]">
                <span className="text-[12px] text-[var(--text-muted)] block">Full Name</span>
                <span className="font-semibold text-[16px] text-[var(--text)]">
                  {patient.fullName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[var(--border)]">
                <div>
                  <span className="text-[12px] text-[var(--text-muted)] block">Age & Sex</span>
                  <span className="font-mono-tabular font-medium text-[var(--text)]">
                    {patient.age} years · {patient.gender}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] text-[var(--text-muted)] block">Blood Group</span>
                  <span className="font-mono-tabular font-medium text-[var(--text)]">
                    {patient.bloodGroup || 'Not typed'}
                  </span>
                </div>
              </div>

              <div className="pb-3 border-b border-[var(--border)]">
                <span className="text-[12px] text-[var(--text-muted)] block">Village / Settlement</span>
                <span className="font-medium text-[var(--text)]">{patient.village}</span>
              </div>

              <div className="pb-3 border-b border-[var(--border)]">
                <span className="text-[12px] text-[var(--text-muted)] block">Primary Phone</span>
                <span className="font-mono-tabular font-medium text-[var(--text)]">
                  {patient.phone || 'None registered'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[var(--border)]">
                <div>
                  <span className="text-[12px] text-[var(--text-muted)] block">Clinic ID</span>
                  <span className="font-mono-tabular text-[13px] text-[var(--text)]">
                    {patient.clinicId}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] text-[var(--text-muted)] block">National ID</span>
                  <span className="font-mono-tabular text-[13px] text-[var(--text-muted)]">
                    {patient.nationalId || 'None'}
                  </span>
                </div>
              </div>

              {patient.emergencyContactName && (
                <div className="pb-3 border-b border-[var(--border)]">
                  <span className="text-[12px] text-[var(--text-muted)] block">
                    Emergency Contact
                  </span>
                  <span className="text-[13px] text-[var(--text)]">
                    {patient.emergencyContactName} ({patient.emergencyContactPhone || 'No phone'})
                  </span>
                </div>
              )}

              <div>
                <span className="text-[12px] text-[var(--text-muted)] block">Registration Date</span>
                <span className="font-mono-tabular text-[13px] text-[var(--text-muted)]">
                  {patient.registeredDate}
                </span>
              </div>
            </div>
          </Card>

          {/* Medical Alerts / Chronic Conditions */}
          <Card padding="md">
            <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-[var(--terra)]" />
              Clinical Alerts
            </h2>

            <div className="flex flex-col gap-3">
              <div className="p-3 bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-[6px]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--danger)] block">
                  Allergies
                </span>
                <p className="text-[13px] font-medium text-[var(--danger)] mt-0.5">
                  {patient.allergies || 'No known allergies reported'}
                </p>
              </div>

              {patient.chronicConditions && (
                <div className="p-3 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[6px]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--info)] block">
                    Chronic Conditions
                  </span>
                  <p className="text-[13px] text-[var(--text)] mt-0.5">
                    {patient.chronicConditions}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Timeline of Visits (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[var(--text)]">
              Clinical Visit Timeline ({patientVisits.length})
            </h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNewVisit(patient)}
              icon={<FilePlus className="w-3.5 h-3.5" />}
            >
              New visit
            </Button>
          </div>

          {patientVisits.length === 0 ? (
            <Card padding="lg">
              <div className="py-12 text-center">
                <p className="font-clinical-notes text-[17px] text-[var(--text)] mb-2">
                  No previous clinic visits recorded for this patient.
                </p>
                <p className="text-[13px] text-[var(--text-muted)] mb-4">
                  Start the initial consultation or triage now.
                </p>
                <Button variant="primary" size="md" onClick={() => onNewVisit(patient)}>
                  Create first visit
                </Button>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {patientVisits.map((visit) => (
                <Card key={visit.id} padding="md" className="transition-colors hover:border-[var(--border-strong)]">
                  {/* Visit Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tabular font-semibold text-[15px] text-[var(--text)]">
                          {visit.date} · {visit.time}
                        </span>
                        <Badge
                          variant={
                            visit.status === 'Completed'
                              ? 'neutral'
                              : visit.status === 'In Consultation'
                              ? 'terra'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {visit.status}
                        </Badge>
                      </div>
                      <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                        Attended by {visit.clinicianName} ({visit.clinicianRole})
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onOpenVisitNotes(visit)}
                    >
                      Open note
                    </Button>
                  </div>

                  {/* Chief Complaint & Diagnosis */}
                  <div className="py-3 flex flex-col gap-2">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
                        Chief Complaint
                      </span>
                      <p className="text-[14px] text-[var(--text)] font-medium mt-0.5">
                        {visit.chiefComplaint}
                      </p>
                    </div>

                    {visit.diagnosis && (
                      <div className="p-2.5 bg-[var(--surface-alt)] rounded-[6px] border border-[var(--border)]">
                        <span className="text-[11px] uppercase tracking-wider text-[var(--accent)] font-medium">
                          Diagnosis {visit.icdCode ? `(${visit.icdCode})` : ''}
                        </span>
                        <p className="text-[14px] font-medium text-[var(--text)] mt-0.5">
                          {visit.diagnosis}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Vitals Row */}
                  {(visit.vitals.bloodPressureSystolic ||
                    visit.vitals.tempCelsius ||
                    visit.vitals.pulseBpm ||
                    visit.vitals.spo2Percent ||
                    visit.vitals.weightKg) && (
                    <div className="py-2.5 px-3 bg-[var(--surface-alt)]/60 rounded-[6px] flex flex-wrap items-center gap-4 text-[12px] font-mono-tabular text-[var(--text)] mb-3">
                      {visit.vitals.bloodPressureSystolic && (
                        <span>
                          <strong className="font-medium text-[var(--text-muted)]">BP:</strong>{' '}
                          {visit.vitals.bloodPressureSystolic}/{visit.vitals.bloodPressureDiastolic} mmHg
                        </span>
                      )}
                      {visit.vitals.tempCelsius && (
                        <span>
                          <strong className="font-medium text-[var(--text-muted)]">Temp:</strong>{' '}
                          {visit.vitals.tempCelsius}°C
                        </span>
                      )}
                      {visit.vitals.pulseBpm && (
                        <span>
                          <strong className="font-medium text-[var(--text-muted)]">Pulse:</strong>{' '}
                          {visit.vitals.pulseBpm} bpm
                        </span>
                      )}
                      {visit.vitals.spo2Percent && (
                        <span>
                          <strong className="font-medium text-[var(--text-muted)]">SpO2:</strong>{' '}
                          {visit.vitals.spo2Percent}%
                        </span>
                      )}
                      {visit.vitals.weightKg && (
                        <span>
                          <strong className="font-medium text-[var(--text-muted)]">Weight:</strong>{' '}
                          {visit.vitals.weightKg} kg
                        </span>
                      )}
                    </div>
                  )}

                  {/* Clinical Notes in Lora serif font */}
                  {visit.clinicalNotes && (
                    <div className="mb-3">
                      <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium block mb-1">
                        Clinical Notes
                      </span>
                      <p className="font-clinical-notes text-[15px] leading-relaxed text-[var(--text)] whitespace-pre-line p-3 bg-[var(--bg)]/50 border border-[var(--border)] rounded-[6px]">
                        {visit.clinicalNotes}
                      </p>
                    </div>
                  )}

                  {/* Prescriptions */}
                  {visit.prescriptions.length > 0 && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium block mb-1">
                        Prescribed Medications ({visit.prescriptions.length})
                      </span>
                      <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-[6px] bg-[var(--surface)] text-[13px]">
                        {visit.prescriptions.map((rx) => (
                          <div key={rx.id} className="p-2.5 flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-[var(--text)]">
                                {rx.medication} · {rx.dosage}
                              </p>
                              <p className="text-[12px] text-[var(--text-muted)]">
                                {rx.frequency} for {rx.durationDays} days
                                {rx.instructions ? ` (${rx.instructions})` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
