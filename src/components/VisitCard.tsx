import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, MoreHorizontal } from 'lucide-react';
import { Visit } from '../types';
import { AttachmentChip } from './AttachmentChip';

export interface VisitCardProps {
  visit: Visit;
  onOpen?: (visitId: string) => void;
}

export const VisitCard: React.FC<VisitCardProps> = ({ visit, onOpen }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine visit type display and token-based pill styling
  const visitType = visit.visitType || 'CONSULT';
  const typeConfig = {
    CONSULT: {
      label: 'Consultation',
      className: 'bg-accent-soft text-accent border border-accent/20',
    },
    LAB: {
      label: 'Lab report',
      className: 'bg-surface-alt text-text-muted border border-border',
    },
    RX: {
      label: 'Prescription',
      className: 'bg-terra-soft text-terra border border-terra/20',
    },
  }[visitType];

  // Format vitals in single-line mono
  const formatVitals = () => {
    const v = visit.vitals;
    if (!v) return null;
    const parts: string[] = [];
    if (v.bloodPressureSystolic && v.bloodPressureDiastolic) {
      parts.push(`BP ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`);
    }
    if (v.pulseBpm) {
      parts.push(`P ${v.pulseBpm}`);
    }
    if (v.tempCelsius) {
      parts.push(`T ${v.tempCelsius}°C`);
    }
    if (v.weightKg) {
      parts.push(`Wt ${v.weightKg}kg`);
    }
    return parts.length > 0 ? parts.join(' · ') : null;
  };

  const vitalsText = formatVitals();

  // Prescription text formatted or joined from array
  const prescriptionDisplay =
    visit.prescriptionText ||
    (visit.prescriptions && visit.prescriptions.length > 0
      ? visit.prescriptions
          .map((rx) => `${rx.medication} ${rx.dosage} (${rx.frequency}) x ${rx.durationDays}d`)
          .join('\n')
      : 'None prescribed');

  // Handle open visit
  const handleOpenVisit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onOpen) {
      onOpen(visit.id);
    } else {
      navigate(`/visits/${visit.id}`);
    }
  };

  // Card keydown handler for Enter
  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      // If focused directly on card or non-interactive child, open visit
      if (target.tagName !== 'BUTTON' && target.tagName !== 'A') {
        e.preventDefault();
        handleOpenVisit();
      }
    }
  };

  return (
    <article
      tabIndex={0}
      onKeyDown={handleCardKeyDown}
      aria-label={`Visit on ${visit.date} · ${visit.time}`}
      className="bg-surface border border-border rounded-md p-6 shadow-none transition-colors duration-120 hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 select-text"
    >
      {/* ── HEADER ROW ── */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          {/* Date in IBM Plex Mono */}
          <div className="font-mono text-sm font-medium text-text tabular-nums tracking-tight">
            {visit.date} · {visit.time}
          </div>
          {/* Clinician subtitle in font-sans */}
          <div className="font-sans text-xs text-text-muted mt-0.5">
            Seen by {visit.clinicianName}
          </div>
        </div>

        {/* Visit type pill */}
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-sans font-medium whitespace-nowrap ${typeConfig.className}`}
        >
          {typeConfig.label}
        </span>
      </div>

      {/* ── BODY: 2-column mini grid (40% / 60%) ── */}
      <div className="grid grid-cols-1 md:grid-cols-10 gap-4 pt-4 pb-4">
        {/* Left mini-column: 40% (narrow) */}
        <div className="md:col-span-4 flex flex-col gap-3.5">
          {/* Chief Complaint */}
          <div>
            <div className="font-sans text-xs text-text-muted uppercase tracking-wider mb-1 font-medium">
              Chief complaint
            </div>
            <div className="font-sans font-medium text-md text-text leading-snug">
              {visit.chiefComplaint}
            </div>
          </div>

          {/* Vitals */}
          <div>
            <div className="font-sans text-xs text-text-muted uppercase tracking-wider mb-1 font-medium">
              Vitals
            </div>
            {vitalsText ? (
              <div className="font-mono text-xs text-text tabular-nums">
                {vitalsText}
              </div>
            ) : (
              <div className="font-sans text-xs text-text-muted">
                Not recorded
              </div>
            )}
          </div>
        </div>

        {/* Right mini-column: 60% (wide) */}
        <div className="md:col-span-6 flex flex-col gap-3.5">
          {/* Diagnosis */}
          <div>
            <div className="font-sans text-xs text-text-muted uppercase tracking-wider mb-1 font-medium">
              Diagnosis
            </div>
            <div className="font-sans font-medium text-md text-text leading-snug">
              {visit.diagnosis}
            </div>
          </div>

          {/* Prescription */}
          <div>
            <div className="font-sans text-xs text-text-muted uppercase tracking-wider mb-1 font-medium">
              Prescription
            </div>
            <div className="font-sans font-normal text-sm text-text whitespace-pre-line leading-relaxed">
              {prescriptionDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* ── FREE-TEXT NOTES (Lora Serif) ── */}
      {visit.clinicalNotes && (
        <div className="pt-2 pb-2">
          <div className="font-sans text-xs text-text-muted uppercase tracking-wider mb-1.5 font-medium">
            Notes
          </div>
          {/*
            CRITICAL RULE 4:
            Notes text is intentionally rendered in Lora serif (font-serif, text-md, line-height 1.6).
            "Show more" expands inline smoothly without layout jump.
          */}
          <p
            className={`font-serif text-md text-text leading-[1.6] transition-all duration-200 ${
              isExpanded ? '' : 'line-clamp-3'
            }`}
          >
            {visit.clinicalNotes}
          </p>
          {visit.clinicalNotes.length > 180 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
              }}
              className="mt-1 font-sans text-xs text-text-muted hover:text-text cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-sm py-0.5"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* ── ATTACHMENTS (if any) ── */}
      {visit.attachments && visit.attachments.length > 0 && (
        <div className="pt-3 pb-1">
          <div className="flex flex-wrap items-center gap-2">
            {visit.attachments.map((att) => (
              <AttachmentChip key={att.id} attachment={att} />
            ))}
          </div>
        </div>
      )}

      {/* ── FOOTER ROW ── */}
      <div className="flex items-center justify-between border-t border-border/70 pt-4 mt-4">
        {/* Left: ghost text button "Open full visit →" */}
        <button
          type="button"
          onClick={handleOpenVisit}
          className="font-sans text-sm font-medium text-text-muted hover:text-text cursor-pointer transition-colors duration-120 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-sm px-1 py-0.5 -ml-1"
        >
          Open full visit →
        </button>

        {/* Right: ghost icon buttons (Edit, More) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Edit visit"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/visits/${visit.id}`);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-alt transition-colors duration-120 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Pencil className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="More visit options"
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 flex items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-alt transition-colors duration-120 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </article>
  );
};
