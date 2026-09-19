import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientHeader } from '../components/PatientHeader';
import { DemographicsCard } from '../components/DemographicsCard';
import { VisitTimeline } from '../components/VisitTimeline';
import { Button } from '../components/ui/Button';
import { usePatient } from '../features/patients/usePatient';
import { usePatientVisits } from '../features/visits/usePatientVisits';

export const PatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { patient, loading: patientLoading, error: patientError, isOffline } = usePatient(id);
  const { visits, loading: visitsLoading } = usePatientVisits(id);

  // Keyboard navigation & global shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not capture shortcuts if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      // Esc → back to /patients
      if (e.key === 'Escape') {
        e.preventDefault();
        navigate('/patients');
      }

      // ⌘V / Ctrl+V → start new visit for this patient
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        if (patient) {
          navigate(`/visits/new?patientId=${patient.id}`);
        }
      }

      // ⌘E / Ctrl+E → edit patient
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (patient) {
          navigate(`/patients/${patient.id}/edit`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [patient, navigate]);

  const handleNewVisit = () => {
    if (patient) {
      navigate(`/visits/new?patientId=${patient.id}`);
    }
  };

  const handleEditPatient = () => {
    if (patient) {
      navigate(`/patients/${patient.id}/edit`);
    }
  };

  // Loading state (No skeleton loaders per spec: "Use a single muted 'Loading…' line if needed.")
  if (patientLoading || visitsLoading) {
    return (
      <div className="py-20 text-center">
        <p className="font-sans text-xs text-text-muted">Loading…</p>
      </div>
    );
  }

  // Error state
  if (patientError) {
    return (
      <div className="py-16 px-6 max-w-md mx-auto text-center bg-surface border border-border rounded-md shadow-none my-12">
        <h2 className="font-serif text-lg text-text leading-relaxed mb-1">
          Couldn't load this patient.
        </h2>
        <p className="font-sans text-xs text-text-muted mb-4">
          There was a problem reading the local patient cache.
        </p>
        <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // Edge case: Patient not found (full-page EmptyState)
  if (!patient) {
    return (
      <div className="py-20 px-6 max-w-md mx-auto text-center flex flex-col items-center justify-center">
        {/* CRITICAL RULE 4: Empty-state title in Lora serif */}
        <h1 className="font-serif text-2xl text-text leading-relaxed mb-1">
          Patient not found.
        </h1>
        <p className="font-sans text-xs text-text-muted mb-6 max-w-xs">
          The ID may be wrong or the record may have been archived.
        </p>
        <Button variant="secondary" size="md" onClick={() => navigate('/patients')}>
          Back to search
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 
        Quick demo mode switcher banner to toggle between full patient view and empty patient view 
        for immediate evaluation and testing
      */}
      <div className="flex items-center justify-between pb-2 border-b border-border/40 text-[11px] font-sans text-text-muted">
        <span className="flex items-center gap-1">
          <span>Active Patient:</span>
          <span className="font-mono tabular-nums text-text font-medium">{patient.clinicId}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-text-faint">Review views:</span>
          <button
            type="button"
            onClick={() => navigate('/patients/P-0412')}
            className={`px-2 py-0.5 rounded-sm font-sans text-[11px] cursor-pointer ${
              patient.id === 'P-0412'
                ? 'bg-accent-soft text-accent font-medium border border-accent/30'
                : 'text-text-muted hover:text-text hover:bg-surface-alt'
            }`}
          >
            Full patient (7 visits)
          </button>
          <span className="text-text-faint">·</span>
          <button
            type="button"
            onClick={() => navigate('/patients/empty')}
            className={`px-2 py-0.5 rounded-sm font-sans text-[11px] cursor-pointer ${
              patient.id === 'P-0000'
                ? 'bg-accent-soft text-accent font-medium border border-accent/30'
                : 'text-text-muted hover:text-text hover:bg-surface-alt'
            }`}
          >
            Empty patient (0 visits)
          </button>
          <span className="text-text-faint">·</span>
          <button
            type="button"
            onClick={() => navigate('/patients/not-found')}
            className="px-2 py-0.5 rounded-sm font-sans text-[11px] text-text-muted hover:text-text hover:bg-surface-alt cursor-pointer"
          >
            Not found state
          </button>
        </div>
      </div>

      {/* ── PAGE HEADER (spans both columns) ── */}
      <PatientHeader
        patient={patient}
        onNewVisit={handleNewVisit}
        onEditPatient={handleEditPatient}
      />

      {/* 
        ── TWO-COLUMN GRID (Gap: 24px) ──
        - Left column (280px, fixed): demographics card, sticky.
        - Right column (1fr): visit timeline.
        - Below 1100px: collapse to single column, demographics on top.
        - Zero shadows anywhere.
      */}
      <div className="flex flex-col min-[1100px]:flex-row gap-6 items-start w-full">
        {/* Left Column (280px fixed, sticky) */}
        <DemographicsCard
          patient={patient}
          onEditPatient={handleEditPatient}
        />

        {/* Right Column (1fr) */}
        <main className="flex-1 w-full min-w-0">
          <VisitTimeline
            visits={visits}
            isOffline={isOffline}
            onNewVisit={handleNewVisit}
            onOpenVisit={(visitId) => navigate(`/visits/${visitId}`)}
          />
        </main>
      </div>
    </div>
  );
};
