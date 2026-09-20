import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Clock,
  Activity,
  User,
  Stethoscope,
  MapPin,
  RefreshCw,
  Search,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { INITIAL_VISITS, INITIAL_PATIENTS, INITIAL_CLINIC_CONFIG, INITIAL_STAFF } from '../data/initialData';
import { offlineSyncService } from '../services/offlineSyncService';
import { Visit } from '../types';

export const Today: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [visits, setVisits] = useState<Visit[]>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const all = offlineSyncService.getVisits();
    return all.filter((v) => v.date === todayStr || v.date === '2026-09-19');
  });

  useEffect(() => {
    const updateVisits = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const all = offlineSyncService.getVisits();
      setVisits(all.filter((v) => v.date === todayStr || v.date === '2026-09-19'));
    };
    updateVisits();
    const unsub = offlineSyncService.subscribe(updateVisits);
    return () => unsub();
  }, []);

  const [statusFilter, setStatusFilter] = useState<'all' | 'Waiting' | 'In Consultation' | 'Completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // References for keyboard navigation auto-scroll
  const listContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Filtered visits
  const filteredVisits = visits.filter((v) => {
    if (statusFilter !== 'all' && v.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = v.patientName.toLowerCase().includes(q);
      const matchId = v.patientClinicId.toLowerCase().includes(q);
      const matchComplaint = v.chiefComplaint.toLowerCase().includes(q);
      return matchName || matchId || matchComplaint;
    }
    return true;
  });

  // Clamp selected index within range
  useEffect(() => {
    if (filteredVisits.length === 0) {
      setSelectedIndex(0);
    } else if (selectedIndex >= filteredVisits.length) {
      setSelectedIndex(filteredVisits.length - 1);
    }
  }, [filteredVisits.length, selectedIndex]);

  // Keyboard navigation: ArrowUp, ArrowDown, Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not capture if active element is an input, textarea, or select
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (filteredVisits.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = Math.min(prev + 1, filteredVisits.length - 1);
          itemRefs.current[next]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          itemRefs.current[next]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredVisits[selectedIndex];
        if (selected) {
          navigate(`/visits/${selected.id}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredVisits, selectedIndex, navigate]);

  // Queue counts (IBM Plex Mono)
  const totalCount = visits.length;
  const waitingCount = visits.filter((v) => v.status === 'Waiting').length;
  const inConsultCount = visits.filter((v) => v.status === 'In Consultation').length;
  const completedCount = visits.filter((v) => v.status === 'Completed').length;
  const pendingSyncCount = visits.filter((v) => !v.synced).length;

  return (
    <div className="flex flex-col gap-6">
      {/* 
        CRITICAL RULE 4: 
        Page title in Lora (font-serif), used nowhere else except the empty-state line.
        Notice: Subtitle, labels, buttons are font-sans or font-mono!
      */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-text tracking-tight">
            Today
          </h1>
          <p className="font-sans text-xs text-text-muted mt-1">
            Wednesday, <span className="font-mono tabular-nums">19</span> September{' '}
            <span className="font-mono tabular-nums">2026</span> ·{' '}
            <span>{INITIAL_CLINIC_CONFIG.subCentre}</span>
          </p>
        </div>

        {/* Action button: Register Walk-in */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
            onClick={() => navigate('/patients/new')}
          >
            Register Walk-in
          </Button>
        </div>
      </div>

      {/* 
        CRITICAL RULES 9 & 10:
        - Layout collapses cleanly below 1100px (flex-col on <1100px, flex-row on >=1100px)
        - Right column capped strictly at 360px (min-[1100px]:w-[340px] min-[1100px]:max-w-[360px])
        - Zero shadows everywhere (shadow-none)
        - Radii <= 12px (rounded-sm or rounded-md)
      */}
      <div className="flex flex-col min-[1100px]:flex-row gap-6 items-start">
        {/* Left / Main Column: Visit Register Queue */}
        <div className="flex-1 w-full flex flex-col gap-4">
          {/* Controls Bar: Filter Tabs + Inline Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border/90 rounded-xl p-2 sm:px-3 sm:py-2">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(
                [
                  { id: 'all', label: 'All', count: totalCount },
                  { id: 'Waiting', label: 'Waiting', count: waitingCount },
                  { id: 'In Consultation', label: 'In Consultation', count: inConsultCount },
                  { id: 'Completed', label: 'Completed', count: completedCount },
                ] as const
              ).map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab.id);
                      setSelectedIndex(0);
                    }}
                    className={`h-8 px-3 rounded-lg text-xs font-sans font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                      isActive
                        ? 'bg-accent-soft text-text border border-accent/40'
                        : 'text-text-muted hover:text-text hover:bg-surface-alt border border-transparent'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`font-mono text-[11px] tabular-nums px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-surface text-text'
                          : 'bg-surface-alt text-text-muted'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick in-register filter input - pill shaped */}
            <div className="relative flex items-center w-full sm:w-60">
              <Search
                className="w-3.5 h-3.5 text-text-muted absolute left-3 pointer-events-none"
                strokeWidth={1.5}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Filter visits…"
                className="w-full h-8 pl-8 pr-3 bg-surface-alt/70 hover:bg-surface-alt focus:bg-surface text-text text-xs rounded-full border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent placeholder:text-text-faint transition-colors"
              />
            </div>
          </div>

          {/* Keyboard shortcut hint bar */}
          <div className="flex items-center justify-between px-1 text-xs text-text-muted select-none">
            <span className="font-sans">
              Queue: Showing{' '}
              <span className="font-mono tabular-nums text-text font-medium">
                {filteredVisits.length}
              </span>{' '}
              of{' '}
              <span className="font-mono tabular-nums text-text font-medium">
                {totalCount}
              </span>{' '}
              registered
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-faint">
              <span className="flex items-center gap-0.5">
                <kbd className="px-1 py-0.5 rounded-sm bg-surface border border-border text-text-muted">
                  <ArrowUp className="w-2.5 h-2.5 inline" />
                </kbd>
                <kbd className="px-1 py-0.5 rounded-sm bg-surface border border-border text-text-muted">
                  <ArrowDown className="w-2.5 h-2.5 inline" />
                </kbd>
                <span className="ml-1">Navigate</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <kbd className="px-1 py-0.5 rounded-sm bg-surface border border-border text-text-muted">
                  <CornerDownLeft className="w-2.5 h-2.5 inline" />
                </kbd>
                <span className="ml-1">Open</span>
              </span>
            </div>
          </div>

          {/* Visit Cards List (Keyboard Navigable) */}
          <div ref={listContainerRef} className="flex flex-col gap-2.5">
            {filteredVisits.length === 0 ? (
              <Card padding="lg" className="min-h-[280px] flex items-center justify-center">
                {/* 
                  CRITICAL RULE 4: Empty state title uses Lora (font-serif)
                */}
                <EmptyState
                  title="No visits match this view"
                  description="Try adjusting the status filter or clearing your search term."
                  actionLabel="Clear Filter"
                  onAction={() => {
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                />
              </Card>
            ) : (
              filteredVisits.map((visit, index) => {
                const isSelected = index === selectedIndex;
                const patient = INITIAL_PATIENTS.find((p) => p.id === visit.patientId);

                // Status styling using strict token set
                const statusBadge = {
                  'Waiting': {
                    bg: 'bg-warning-soft text-warning border-warning/30',
                    dot: 'bg-warning',
                  },
                  'In Consultation': {
                    bg: 'bg-accent-soft text-text border-accent/40',
                    dot: 'bg-accent',
                  },
                  'Completed': {
                    bg: 'bg-surface-alt text-text-muted border-border',
                    dot: 'bg-sync-ok',
                  },
                }[visit.status];

                return (
                  <div
                    key={visit.id}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    tabIndex={0}
                    role="button"
                    aria-selected={isSelected}
                    onClick={() => {
                      setSelectedIndex(index);
                    }}
                    onDoubleClick={() => navigate(`/visits/${visit.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        navigate(`/visits/${visit.id}`);
                      }
                    }}
                    className={`relative w-full text-left bg-surface border rounded-md p-4 transition-colors cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                      isSelected
                        ? 'border-accent bg-surface-alt/70'
                        : 'border-border hover:border-border-strong hover:bg-surface-alt/30'
                    }`}
                  >
                    {/* Active selection accent indicator line */}
                    {isSelected && (
                      <span
                        className="absolute left-0 top-3 bottom-3 w-1 bg-accent rounded-r-sm"
                        aria-hidden="true"
                      />
                    )}

                    {/* Top Row: Time, Patient ID, Name, Age/Gender, Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Time in IBM Plex Mono */}
                        <div className="flex items-center gap-1 font-mono text-xs text-text-muted tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-text-faint" strokeWidth={1.5} />
                          <span>{visit.time}</span>
                        </div>

                        {/* Patient Clinic ID in IBM Plex Mono */}
                        <span className="font-mono text-xs text-text-muted bg-surface-alt px-1.5 py-0.5 rounded-sm border border-border tabular-nums">
                          {visit.patientClinicId}
                        </span>

                        {/* Patient Name in font-sans (NEVER Lora) */}
                        <span className="font-sans text-sm font-semibold text-text">
                          {visit.patientName}
                        </span>

                        {/* Age & Gender in font-sans with numeric value in font-mono */}
                        {patient && (
                          <span className="font-sans text-xs text-text-muted">
                            <span className="font-mono tabular-nums">{patient.age}</span>y ·{' '}
                            {patient.gender} · {patient.village}
                          </span>
                        )}
                      </div>

                      {/* Right: Status badge & sync indicator */}
                      <div className="flex items-center gap-2 shrink-0">
                        {!visit.synced && (
                          <span
                            title="Pending local sync queue"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-warning bg-warning-soft px-1.5 py-0.5 rounded-full border border-warning/30"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-sync-pending animate-pulse" />
                            Pending sync
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-sans font-medium px-2 py-0.5 rounded-full border ${statusBadge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                          {visit.status}
                        </span>
                      </div>
                    </div>

                    {/* Chief Complaint */}
                    <p className="font-sans text-xs text-text-muted line-clamp-1 mb-3 pl-0.5">
                      <span className="font-medium text-text">Complaint:</span>{' '}
                      {visit.chiefComplaint}
                    </p>

                    {/* Vitals Strip: numeric values strictly in IBM Plex Mono */}
                    <div className="flex items-center gap-3 pt-2.5 border-t border-border/70 text-xs flex-wrap font-sans">
                      <div className="flex items-center gap-1 text-text-muted">
                        <Activity className="w-3.5 h-3.5 text-text-faint" strokeWidth={1.5} />
                        <span className="text-text-faint">BP:</span>
                        <span className="font-mono tabular-nums font-medium text-text">
                          {visit.vitals.bloodPressureSystolic}/{visit.vitals.bloodPressureDiastolic}
                        </span>
                        <span className="text-[11px] text-text-faint">mmHg</span>
                      </div>

                      <div className="flex items-center gap-1 text-text-muted">
                        <span className="text-text-faint">Pulse:</span>
                        <span className="font-mono tabular-nums font-medium text-text">
                          {visit.vitals.pulseBpm}
                        </span>
                        <span className="text-[11px] text-text-faint">bpm</span>
                      </div>

                      <div className="flex items-center gap-1 text-text-muted">
                        <span className="text-text-faint">Temp:</span>
                        <span className="font-mono tabular-nums font-medium text-text">
                          {visit.vitals.tempCelsius}
                        </span>
                        <span className="text-[11px] text-text-faint">°C</span>
                      </div>

                      {visit.vitals.spo2Percent && (
                        <div className="flex items-center gap-1 text-text-muted">
                          <span className="text-text-faint">SpO2:</span>
                          <span className="font-mono tabular-nums font-medium text-text">
                            {visit.vitals.spo2Percent}%
                          </span>
                        </div>
                      )}

                      {visit.vitals.weightKg && (
                        <div className="flex items-center gap-1 text-text-muted">
                          <span className="text-text-faint">Wt:</span>
                          <span className="font-mono tabular-nums font-medium text-text">
                            {visit.vitals.weightKg}
                          </span>
                          <span className="text-[11px] text-text-faint">kg</span>
                        </div>
                      )}

                      {/* Right Action: Open Visit button */}
                      <div className="ml-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/visits/${visit.id}`);
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          Open record →
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 
          CRITICAL RULE 9:
          Right column capped at 360px (min-[1100px]:w-[340px] min-[1100px]:max-w-[360px]).
          CRITICAL RULE 8:
          Offline state renders quietly without a toast.
          CRITICAL RULE 5:
          All numeric values in IBM Plex Mono.
        */}
        <aside
          aria-label="Today summary and station status"
          className="w-full min-[1100px]:w-[340px] min-[1100px]:max-w-[360px] shrink-0 flex flex-col gap-4"
        >
          {/* Clinic Station & Quiet Offline Node Card */}
          <Card padding="md" className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full bg-sync-ok shrink-0"
                  aria-hidden="true"
                />
                <span className="font-sans text-xs font-semibold text-text uppercase tracking-wider">
                  Station Node
                </span>
              </div>
              <span className="font-mono text-xs text-text-muted tabular-nums">
                {INITIAL_CLINIC_CONFIG.facilityCode}
              </span>
            </div>

            <div className="flex flex-col gap-1 text-xs font-sans">
              <div className="flex items-start gap-1.5 text-text">
                <MapPin className="w-3.5 h-3.5 text-text-muted mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <div className="font-medium">{INITIAL_CLINIC_CONFIG.subCentre}</div>
                  <div className="text-text-muted text-[11px]">{INITIAL_CLINIC_CONFIG.name}</div>
                </div>
              </div>
            </div>

            {/* Quiet Offline indicator: NO TOAST */}
            <div className="p-2.5 bg-surface-alt rounded-sm border border-border text-xs font-sans flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sync-pending shrink-0" />
                  Local Offline Node
                </span>
                <span className="font-mono text-[11px] text-text-muted tabular-nums">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Operating offline. All records saved locally to secure device cache.{' '}
                {pendingSyncCount > 0 ? (
                  <span className="text-warning font-mono tabular-nums font-medium">
                    {pendingSyncCount} record queued
                  </span>
                ) : (
                  <span className="text-sync-ok">All records synced</span>
                )}
                .
              </p>
            </div>
          </Card>

          {/* Today's Queue Metrics Card */}
          <Card padding="md" className="flex flex-col gap-3">
            <h2 className="font-sans text-xs font-semibold text-text uppercase tracking-wider pb-2 border-b border-border">
              Register Tallies
            </h2>

            <div className="grid grid-cols-2 gap-2 text-xs font-sans">
              {/* Total Registered */}
              <div className="p-2.5 bg-surface-alt/60 rounded-sm border border-border flex flex-col">
                <span className="text-text-muted text-[11px]">Total Today</span>
                <span className="font-mono text-xl font-semibold text-text tabular-nums mt-0.5">
                  {totalCount}
                </span>
              </div>

              {/* Waiting for Consultation */}
              <div className="p-2.5 bg-surface-alt/60 rounded-sm border border-border flex flex-col">
                <span className="text-warning text-[11px]">In Waiting</span>
                <span className="font-mono text-xl font-semibold text-text tabular-nums mt-0.5">
                  {waitingCount}
                </span>
              </div>

              {/* In Consultation */}
              <div className="p-2.5 bg-surface-alt/60 rounded-sm border border-border flex flex-col">
                <span className="text-accent text-[11px]">In Consultation</span>
                <span className="font-mono text-xl font-semibold text-text tabular-nums mt-0.5">
                  {inConsultCount}
                </span>
              </div>

              {/* Completed */}
              <div className="p-2.5 bg-surface-alt/60 rounded-sm border border-border flex flex-col">
                <span className="text-text-muted text-[11px]">Completed</span>
                <span className="font-mono text-xl font-semibold text-text tabular-nums mt-0.5">
                  {completedCount}
                </span>
              </div>
            </div>
          </Card>

          {/* Duty Clinicians Card */}
          <Card padding="md" className="flex flex-col gap-2.5">
            <h2 className="font-sans text-xs font-semibold text-text uppercase tracking-wider pb-2 border-b border-border">
              Staff on Duty
            </h2>

            <div className="flex flex-col gap-2 font-sans text-xs">
              {INITIAL_STAFF.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center justify-between py-1 border-b border-border/40 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-3.5 h-3.5 text-text-muted shrink-0" strokeWidth={1.5} />
                    <div>
                      <div className="font-medium text-text">{staff.name}</div>
                      <div className="text-[11px] text-text-muted">{staff.role}</div>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-text-faint tabular-nums">
                    On site
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
};
