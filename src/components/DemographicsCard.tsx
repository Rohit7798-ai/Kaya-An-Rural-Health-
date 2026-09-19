import React from 'react';
import { Patient } from '../types';

export interface DemographicsCardProps {
  patient: Patient;
  onEditPatient: () => void;
}

export const DemographicsCard: React.FC<DemographicsCardProps> = ({
  patient,
  onEditPatient,
}) => {
  const alerts = patient.alerts || [];

  return (
    <aside
      aria-label="Patient Demographics"
      className="sticky top-6 w-full min-[1100px]:w-[280px] shrink-0 bg-surface border border-border rounded-md p-6 shadow-none flex flex-col gap-5 select-text"
    >
      {/* ── SECTION: IDENTITY ── */}
      <div>
        <h2 className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium mb-3">
          Identity
        </h2>
        <div className="flex flex-col text-sm font-sans divide-y divide-border">
          {/* Full name (Inter 500) */}
          <div className="flex items-baseline justify-between py-2.5 first:pt-0">
            <span className="text-text-muted">Full name</span>
            <span className="font-sans font-medium text-text text-right truncate max-w-[150px]">
              {patient.fullName}
            </span>
          </div>

          {/* Age (IBM Plex Mono) */}
          <div className="flex items-baseline justify-between py-2.5">
            <span className="text-text-muted">Age</span>
            <span className="font-mono tabular-nums text-text">
              {patient.age}
            </span>
          </div>

          {/* Sex (IBM Plex Mono) */}
          <div className="flex items-baseline justify-between py-2.5">
            <span className="text-text-muted">Sex</span>
            <span className="font-mono tabular-nums text-text">
              {patient.gender}
            </span>
          </div>

          {/* Village (IBM Plex Mono) */}
          <div className="flex items-baseline justify-between py-2.5">
            <span className="text-text-muted">Village</span>
            <span className="font-mono tabular-nums text-text">
              {patient.village}
            </span>
          </div>

          {/* Phone (IBM Plex Mono) */}
          <div className="flex items-baseline justify-between py-2.5">
            <span className="text-text-muted">Phone</span>
            <span className="font-mono tabular-nums text-text text-xs">
              {patient.phone}
            </span>
          </div>

          {/* External ID (IBM Plex Mono) */}
          <div className="flex items-baseline justify-between py-2.5 last:pb-0">
            <span className="text-text-muted">External ID</span>
            <span className="font-mono tabular-nums text-text font-medium">
              {patient.clinicId}
            </span>
          </div>
        </div>
      </div>

      {/* 1px divider */}
      <div className="h-px bg-border w-full" />

      {/* ── SECTION: ALERTS ── */}
      <div>
        <h2 className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium mb-3">
          Alerts
        </h2>
        {alerts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {alerts.map((alert) => {
              const isDanger = alert.type === 'danger';
              const isWarning = alert.type === 'warning';
              return (
                <span
                  key={alert.id}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-sans font-medium whitespace-nowrap ${
                    isDanger
                      ? 'bg-danger-soft text-danger border border-danger/20'
                      : isWarning
                      ? 'bg-warning-soft text-warning border border-warning/20'
                      : 'bg-surface-alt text-text-muted border border-border'
                  }`}
                >
                  {alert.label}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="font-sans text-xs text-text-muted">
            No alerts recorded.
          </p>
        )}
      </div>

      {/* 1px divider */}
      <div className="h-px bg-border w-full" />

      {/* ── SECTION: SUMMARY ── */}
      <div>
        <h2 className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium mb-3">
          Summary
        </h2>
        <div className="flex flex-col text-sm font-sans divide-y divide-border">
          {/* Total visits */}
          <div className="flex items-baseline justify-between py-2.5 first:pt-0">
            <span className="text-text-muted">Total visits</span>
            <span className="font-mono tabular-nums text-text font-medium">
              {patient.totalVisits}
            </span>
          </div>

          {/* Last visit */}
          <div className="flex items-baseline justify-between py-2.5">
            <span className="text-text-muted">Last visit</span>
            <span className="font-mono tabular-nums text-text">
              {patient.lastVisitRelative || 'Never'}
            </span>
          </div>

          {/* First seen */}
          <div className="flex items-baseline justify-between py-2.5 last:pb-0">
            <span className="text-text-muted">First seen</span>
            <span className="font-mono tabular-nums text-text">
              {patient.firstSeenDate || patient.registeredDate}
            </span>
          </div>
        </div>
      </div>

      {/* 1px divider */}
      <div className="h-px bg-border w-full" />

      {/* One ghost button full width: "Edit patient" */}
      <button
        type="button"
        onClick={onEditPatient}
        className="w-full h-9 rounded-sm font-sans text-sm font-medium text-text bg-transparent hover:bg-surface-alt active:bg-border/30 border border-border/80 transition-colors duration-120 cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        Edit patient
      </button>
    </aside>
  );
};
