import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../types';

export interface PatientResultRowProps {
  patient: Patient;
  isSelected?: boolean;
}

export const PatientResultRow: React.FC<PatientResultRowProps> = ({
  patient,
  isSelected = false,
}) => {
  const navigate = useNavigate();
  const genderLetter =
    patient.gender === 'Female' ? 'F' : patient.gender === 'Male' ? 'M' : 'O';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/patients/${patient.clinicId || patient.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          navigate(`/patients/${patient.clinicId || patient.id}`);
        }
      }}
      className={`flex items-center justify-between p-3.5 bg-surface border rounded-md cursor-pointer transition-colors duration-120 select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
        isSelected
          ? 'border-accent bg-surface-alt/70'
          : 'border-border hover:border-border-strong hover:bg-surface-alt/40'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-mono text-xs tabular-nums text-text-muted bg-surface-alt px-1.5 py-0.5 rounded-sm border border-border shrink-0">
          {patient.clinicId}
        </span>
        <span className="font-sans font-medium text-sm text-text truncate">
          {patient.fullName}
        </span>
        <span className="font-sans text-xs text-text-muted shrink-0">
          <span className="font-mono tabular-nums">{patient.age}</span>
          {genderLetter} · {patient.village}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs font-sans text-text-muted shrink-0">
        <span>
          Visits:{' '}
          <span className="font-mono tabular-nums text-text font-medium">
            {patient.totalVisits}
          </span>
        </span>
        <span>
          Last:{' '}
          <span className="font-mono tabular-nums">
            {patient.lastVisitRelative || 'Never'}
          </span>
        </span>
      </div>
    </div>
  );
};
