import React, { useState, useMemo } from 'react';
import { Visit } from '../types';
import { VisitCard } from './VisitCard';
import { Button } from './ui/Button';
import { Plus } from 'lucide-react';

export interface VisitTimelineProps {
  visits: Visit[];
  isOffline?: boolean;
  onNewVisit: () => void;
  onOpenVisit?: (visitId: string) => void;
}

type FilterType = 'all' | 'CONSULT' | 'LAB' | 'RX';

export const VisitTimeline: React.FC<VisitTimelineProps> = ({
  visits,
  isOffline = false,
  onNewVisit,
  onOpenVisit,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');

  // Filter visits
  const filteredVisits = useMemo(() => {
    if (filter === 'all') return visits;
    return visits.filter((v) => (v.visitType || 'CONSULT') === filter);
  }, [visits, filter]);

  // Group visits by year (e.g. "2026", "2025", "2024", "2023")
  const groupedVisits = useMemo(() => {
    const groups: { year: string; visits: Visit[] }[] = [];
    const yearMap = new Map<string, Visit[]>();

    for (const v of filteredVisits) {
      // Extract 4-digit year from date (e.g. "14 Sep 2026" or "2026-09-14")
      const match = v.date.match(/\b(20\d\d)\b/);
      const year = match ? match[1] : 'Prior';
      if (!yearMap.has(year)) {
        yearMap.set(year, []);
      }
      yearMap.get(year)!.push(v);
    }

    // Sort years descending (newest first)
    const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b.localeCompare(a));
    for (const year of sortedYears) {
      groups.push({
        year,
        visits: yearMap.get(year)!,
      });
    }

    return groups;
  }, [filteredVisits]);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ── QUIET OFFLINE INLINE NOTE (above timeline, zero toast) ── */}
      {isOffline && (
        <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-sm text-xs font-sans text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-sync-ok shrink-0" aria-hidden="true" />
          <span>Offline. Showing cached records.</span>
        </div>
      )}

      {/* ── TOP CONTROL ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border/60">
        <div>
          <div className="font-sans text-xs text-text-muted">
            Timeline ·{' '}
            <span className="font-mono tabular-nums text-text font-medium">
              {visits.length}
            </span>{' '}
            {visits.length === 1 ? 'visit' : 'visits'}
          </div>
          <div className="font-sans text-[11px] text-text-faint mt-0.5">
            Newest first
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto select-none">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'CONSULT', label: 'Consultations' },
              { id: 'LAB', label: 'Labs' },
              { id: 'RX', label: 'Prescriptions' },
            ] as const
          ).map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`h-7 px-3 rounded-full text-xs font-sans font-medium transition-colors duration-120 whitespace-nowrap cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                  isActive
                    ? 'bg-accent-soft text-text border border-accent/40'
                    : 'text-text-muted hover:text-text hover:bg-surface-alt border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── EMPTY STATE (patient with 0 visits or filter yields 0) ── */}
      {visits.length === 0 ? (
        <div className="bg-surface border border-border rounded-md py-16 px-6 text-center flex flex-col items-center justify-center shadow-none">
          {/* CRITICAL RULE 4: Empty-state title is in Lora serif */}
          <h2 className="font-serif text-lg text-text leading-relaxed mb-1">
            No visits recorded for this patient.
          </h2>
          <p className="font-sans text-xs text-text-muted mb-5 max-w-sm">
            Start the first visit to begin their history.
          </p>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
            onClick={onNewVisit}
          >
            New visit
          </Button>
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="bg-surface border border-border rounded-md py-12 px-6 text-center flex flex-col items-center justify-center shadow-none">
          <h2 className="font-serif text-lg text-text leading-relaxed mb-1">
            No visits found for this filter.
          </h2>
          <p className="font-sans text-xs text-text-muted mb-4 max-w-sm">
            No records match the selected category in this patient's history.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
            Show all visits
          </Button>
        </div>
      ) : (
        /* ── TIMELINE ITEMS GROUPED BY YEAR ── */
        <div className="flex flex-col gap-6">
          {groupedVisits.map((group, groupIndex) => (
            <div key={group.year} className="flex flex-col gap-6">
              {/* Year divider with centered mono year */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-border" />
                <span className="font-mono text-sm text-text-muted tabular-nums px-1 select-none">
                  {group.year}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Visit cards in this year (24px gap between items) */}
              <div className="flex flex-col gap-6">
                {group.visits.map((visit) => (
                  <VisitCard
                    key={visit.id}
                    visit={visit}
                    onOpen={onOpenVisit}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
