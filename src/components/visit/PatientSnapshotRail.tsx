import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../../types';

export interface PatientSnapshotRailProps {
  patient: Patient;
  isCompactStrip?: boolean;
}

export const PatientSnapshotRail: React.FC<PatientSnapshotRailProps> = ({
  patient,
  isCompactStrip = false,
}) => {
  const navigate = useNavigate();

  // If rendering as compact strip above form (for <1280px)
  if (isCompactStrip) {
    return (
      <div className="xl:hidden w-full bg-surface border border-border rounded-md p-4 shadow-none flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-sans">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {/* Last visit */}
          <div className="flex items-center gap-1.5">
            <span className="uppercase tracking-[0.04em] text-text-muted font-medium text-[11px]">
              Last:
            </span>
            <span className="font-mono tabular-nums text-text">14 Mar 2026</span>
            <span className="text-text-muted">·</span>
            <span className="font-medium text-text">Hypertension follow-up</span>
          </div>

          {/* Vitals trend */}
          <div className="flex items-center gap-2 font-mono tabular-nums text-text-muted">
            <span>BP 138/86 → 128/82</span>
            <span>·</span>
            <span>Wt 63kg → 61kg</span>
          </div>

          {/* Alerts */}
          {patient.alerts && patient.alerts.length > 0 && (
            <div className="flex items-center gap-1.5">
              {patient.alerts.map((alert) => (
                <span
                  key={alert.id}
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-sans font-medium ${
                    alert.type === 'danger'
                      ? 'bg-danger-soft text-danger border border-danger/30'
                      : 'bg-warning-soft text-warning border border-warning/30'
                  }`}
                >
                  {alert.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Link */}
        <button
          type="button"
          onClick={() => navigate(`/patients/${patient.id}`)}
          className="shrink-0 text-left font-sans text-xs font-medium text-text-muted hover:text-text cursor-pointer transition-colors"
        >
          Open full history →
        </button>
      </div>
    );
  }

  // Large screen sticky rail (≥1280px)
  return (
    <aside
      aria-label="Patient snapshot safety rail"
      className="hidden xl:flex flex-col w-[280px] shrink-0 sticky top-6 bg-surface border border-border rounded-md p-5 shadow-none self-start"
    >
      {/* ── Section: Last visit ── */}
      <div className="flex flex-col gap-1">
        <div className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium">
          Last visit
        </div>
        <div className="font-mono text-xs tabular-nums text-text font-normal mt-0.5">
          14 Mar 2026
        </div>
        <div className="font-sans font-medium text-sm text-text">
          Hypertension follow-up
        </div>
        <div className="font-sans font-normal text-sm text-text-muted">
          Stage 1 HTN
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border w-full my-4" />

      {/* ── Section: Alerts ── */}
      <div className="flex flex-col gap-2">
        <div className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium">
          Alerts
        </div>
        {patient.alerts && patient.alerts.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {patient.alerts.map((alert) => (
              <span
                key={alert.id}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium select-none ${
                  alert.type === 'danger'
                    ? 'bg-danger-soft text-danger border border-danger/30'
                    : 'bg-warning-soft text-warning border border-warning/30'
                }`}
              >
                {alert.label}
              </span>
            ))}
          </div>
        ) : (
          <div className="font-sans text-xs text-text-muted">No active alerts</div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border w-full my-4" />

      {/* ── Section: Vitals trend ── */}
      <div className="flex flex-col gap-1.5">
        <div className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium">
          Vitals trend
        </div>
        <div className="font-mono text-xs tabular-nums text-text space-y-1 mt-0.5">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">BP</span>
            <span>138/86 → 128/82</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Wt</span>
            <span>63kg → 61kg</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border w-full my-4" />

      {/* Ghost text button: Open full history */}
      <button
        type="button"
        onClick={() => navigate(`/patients/${patient.id}`)}
        className="w-full py-1 text-left font-sans text-xs font-medium text-text-muted hover:text-text cursor-pointer transition-colors duration-120 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-sm"
      >
        Open full history →
      </button>
    </aside>
  );
};
