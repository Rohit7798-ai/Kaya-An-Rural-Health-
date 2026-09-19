import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface RecentPatient {
  id: string;
  clinicId: string;
  name: string;
  village: string;
  time: string;
}

// 3 realistic seeded registrations from today
export const SEEDED_RECENT_REGISTRATIONS: RecentPatient[] = [
  {
    id: 'P-0412',
    clinicId: 'P-0412',
    name: 'Sunita Patil',
    village: 'Wardha',
    time: '09:15',
  },
  {
    id: 'P-0411',
    clinicId: 'P-0411',
    name: 'Ganesh Shinde',
    village: 'Jamunwadi',
    time: '08:42',
  },
  {
    id: 'P-0410',
    clinicId: 'P-0410',
    name: 'Anjali Deshmukh',
    village: 'Rampur',
    time: '08:20',
  },
];

export interface RecentRegistrationsRailProps {
  patients?: RecentPatient[];
}

export const RecentRegistrationsRail: React.FC<RecentRegistrationsRailProps> = ({
  patients = SEEDED_RECENT_REGISTRATIONS,
}) => {
  const navigate = useNavigate();

  return (
    <aside
      aria-label="Recently registered patients"
      className="hidden xl:block w-[280px] shrink-0 sticky top-6 self-start bg-surface border border-border rounded-md p-5 shadow-none"
    >
      {/* Muted uppercase label */}
      <div className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium mb-3">
        Recently registered
      </div>

      {/* Patient rows */}
      {patients.length === 0 ? (
        <p className="font-sans text-xs text-text-muted py-2">
          No registrations yet today.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border/60">
          {patients.slice(0, 5).map((p) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/patients/${p.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/patients/${p.id}`);
                }
              }}
              className="py-2.5 px-2 -mx-2 rounded-sm hover:bg-surface-alt transition-colors duration-120 cursor-pointer flex flex-col gap-0.5 select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              {/* Name in Inter 500, text-sm */}
              <span className="font-sans font-medium text-sm text-text truncate">
                {p.name}
              </span>
              {/* Mono ID + village in text-muted, text-xs */}
              <span className="font-sans text-xs text-text-muted flex items-center gap-1.5">
                <span className="font-mono tabular-nums text-text-muted">
                  {p.clinicId}
                </span>
                <span className="text-text-faint">·</span>
                <span className="truncate">{p.village}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 1px divider */}
      <div className="h-px bg-border/60 w-full mt-3 mb-3" />

      {/* Ghost button: View all patients */}
      <button
        type="button"
        onClick={() => navigate('/patients')}
        className="w-full py-1 text-left font-sans text-xs font-medium text-text-muted hover:text-text cursor-pointer transition-colors duration-120 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-sm"
      >
        View all patients →
      </button>
    </aside>
  );
};
