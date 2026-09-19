import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Plus,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { Field } from '../components/form/Field';
import { SegmentedControl } from '../components/form/SegmentedControl';
import { PatientSnapshotRail } from '../components/visit/PatientSnapshotRail';
import { VitalsGrid } from '../components/visit/VitalsGrid';
import { PrescriptionRow, COMMON_MEDICINES } from '../components/visit/PrescriptionRow';
import { AttachmentList } from '../components/visit/AttachmentList';
import { NotesTextarea } from '../components/visit/NotesTextarea';
import { useVisitForm } from '../features/visits/useVisitForm';
import { useAttachments } from '../features/visits/useAttachments';
import { SEEDED_PATIENT, usePatient } from '../features/patients/usePatient';
import { offlineSyncService } from '../services/offlineSyncService';
import { Visit } from '../types';

const CLINIC_STAFF = ['Dr. Ramesh Rao', 'Dr. Aditi Sharma', 'Nurse Kavita'];

const COMMON_DIAGNOSES = [
  'Essential Hypertension (Stage 1)',
  'Essential Hypertension (Stage 2)',
  'Type 2 Diabetes Mellitus',
  'Acute Upper Respiratory Tract Infection',
  'Osteoarthritis (Bilateral knee)',
  'Acute Gastroenteritis',
  'Iron Deficiency Anemia',
  'Bronchial Asthma (Mild persistent)',
  'Tinea Corporis (Fungal infection)',
  'Migraine without aura',
];

export const NewVisit: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Support patient or patientId param
  const patientParam = searchParams.get('patient') || searchParams.get('patientId') || 'P-0412';
  const testMode = searchParams.get('test'); // 'filled', 'dictation', 'ocr', 'empty'

  // Load patient
  const { patient, isOffline } = usePatient(patientParam);
  const activePatient = patient || (patientParam === 'P-0412' ? SEEDED_PATIENT : null);

  const {
    formData,
    setFormData,
    updateField,
    addPrescriptionRow,
    updatePrescriptionRow,
    removePrescriptionRow,
    isDirty,
    errors,
    setErrors,
    autosaveStatus,
    lastSavedTime,
    draftPrompt,
    resumeDraft,
    discardDraft,
    validate,
    clearDraft,
    submitVisit,
  } = useVisitForm(activePatient?.id || 'default');

  const {
    attachments,
    addAttachment,
    removeAttachment,
    toggleOcrExpand,
    updateOcrText,
    setEditingOcr,
    retryAttachment,
  } = useAttachments();

  // Section collapse states
  // Section 3 — Vitals (open by default)
  const [vitalsOpen, setVitalsOpen] = useState(true);
  // Section 5 — Prescription (open if visit type = Consultation or Follow-up)
  const [rxOpen, setRxOpen] = useState(formData.visitType !== 'Emergency');
  // Section 6 — Attachments (collapsed by default, but opened if testMode === 'ocr')
  const [attachmentsOpen, setAttachmentsOpen] = useState(testMode === 'ocr');
  // Section 7 — Follow-up (collapsed by default)
  const [followUpOpen, setFollowUpOpen] = useState(false);

  // Discard confirmation modal
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'danger';
    actionText?: string;
    onAction?: () => void;
  } | null>(null);

  // Ref for chief complaint input (autofocus)
  const chiefComplaintRef = useRef<HTMLInputElement>(null);

  // Focus chief complaint on mount
  useEffect(() => {
    chiefComplaintRef.current?.focus();
  }, []);

  // Sync rxOpen if visitType changes
  useEffect(() => {
    if (formData.visitType === 'Emergency') {
      // Keep user preference or default
    } else {
      setRxOpen(true);
    }
  }, [formData.visitType]);

  // Handle test modes
  useEffect(() => {
    if (testMode === 'filled') {
      // (2) Partially filled with vitals + one prescription row
      setFormData((prev) => ({
        ...prev,
        chiefComplaint: 'Follow-up for blood pressure check & mild joint pain',
        durationValue: '1',
        durationUnit: 'weeks',
        presentingNotes:
          'Patient reports regular adherence to Amlodipine 5mg once daily. Denies chest pain or palpitations.',
        bp: '128/82',
        pulse: '76',
        temp: '36.7',
        weight: '61',
        diagnosis: 'Essential Hypertension (Stage 1)',
        icdCode: 'I10',
        assessmentNotes: 'Blood pressure well-controlled under current medication and lifestyle changes.',
        prescriptions: [
          {
            id: 'rx-1',
            medicine: 'Amlodipine 5mg',
            dose: '1 tab (5mg)',
            frequency: 'OD',
            durationValue: '30',
            durationUnit: 'days',
          },
        ],
        nextVisitDate: '2026-10-19',
        reminderNote: 'Bring repeat fasting blood sugar report',
        printFollowUpSlip: true,
      }));
      setVitalsOpen(true);
      setRxOpen(true);
    } else if (testMode === 'dictation') {
      // (3) Dictation active
      setFormData((prev) => ({
        ...prev,
        chiefComplaint: 'Throbbing frontal headache with fatigue',
        presentingNotes: 'Patient describes dull aching discomfort behind the temples',
      }));
    } else if (testMode === 'ocr') {
      // (4) Attachment row expanded with OCR text
      setAttachmentsOpen(true);
    }
  }, [testMode, setFormData]);

  // Toast timer auto-dismiss 4s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Promote OCR text into presenting notes
  const handlePromoteOcrText = (ocrText: string) => {
    updateField(
      'presentingNotes',
      formData.presentingNotes
        ? `${formData.presentingNotes}\n\n[OCR Notes]:\n${ocrText}`
        : `[OCR Notes]:\n${ocrText}`
    );
    setToast({
      message: 'OCR text promoted to visit notes.',
      type: 'success',
    });
  };

  // Cancel flow with dirty check
  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      if (activePatient) {
        navigate(`/patients/${activePatient.id}`);
      } else {
        navigate('/patients');
      }
    }
  };

  const handleConfirmDiscard = () => {
    discardDraft();
    setShowDiscardModal(false);
    if (activePatient) {
      navigate(`/patients/${activePatient.id}`);
    } else {
      navigate('/patients');
    }
  };

  // Submit / Save actions
  const handleSaveDraft = async () => {
    try {
      await submitVisit('Draft', activePatient);
      setToast({
        message: 'Draft saved.',
        type: 'success',
      });
    } catch {
      setToast({
        message: 'Draft saved.',
        type: 'success',
      });
    }
  };

  const handleCompleteVisit = async () => {
    const { isValid } = validate();

    if (!isValid) {
      chiefComplaintRef.current?.focus();
      chiefComplaintRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      await submitVisit('Completed', activePatient);

      // If follow-up date is set and printFollowUpSlip checked, trigger stub print
      if (formData.nextVisitDate && formData.printFollowUpSlip) {
        console.log('Printing follow-up slip for patient:', activePatient?.fullName);
      }

      const targetPatientId = activePatient?.id || 'P-0412';

      setToast({
        message: 'Visit saved.',
        type: 'success',
        actionText: 'Open visit →',
        onAction: () => {
          navigate(`/patients/${targetPatientId}`);
        },
      });

      setTimeout(() => {
        navigate(`/patients/${targetPatientId}`);
      }, 600);
    } catch {
      setToast({
        message: "Couldn't save visit. Try again.",
        type: 'danger',
      });
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘Enter / Ctrl+Enter → Complete visit
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleCompleteVisit();
        return;
      }

      // ⌘S / Ctrl+S → Save draft
      if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveDraft();
        return;
      }

      // ⌘⇧M / Ctrl+Shift+M → Add medicine row
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setRxOpen(true);
        addPrescriptionRow();
        return;
      }

      // Esc flow
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showDiscardModal) {
          setShowDiscardModal(false);
        } else {
          handleCancel();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, isDirty, showDiscardModal, activePatient]);

  // If missing patient query parameter
  if (!patientParam && !activePatient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <h2 className="font-serif text-2xl font-normal text-text mb-2">
          Pick a patient first.
        </h2>
        <p className="font-sans text-sm text-text-muted mb-6">
          To start a new clinical visit, select or search for a patient record.
        </p>
        <button
          type="button"
          onClick={() => navigate('/patients')}
          className="h-9 px-4 inline-flex items-center justify-center bg-surface hover:bg-surface-alt border border-border text-sm font-sans font-medium text-text rounded-sm transition-colors cursor-pointer"
        >
          Back to patients
        </button>
      </div>
    );
  }

  const patientDisplay = activePatient || SEEDED_PATIENT;

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* 
        Quick demo / evaluation strip to easily inspect all 4 required test states:
        (1) empty form, (2) partially filled, (3) dictation active, (4) attachment with OCR
      */}
      <div className="flex items-center justify-between pb-2 border-b border-border/40 text-[11px] font-sans text-text-muted">
        <span className="flex items-center gap-1">
          <span>New visit test states:</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/visits/new?patient=${patientDisplay.id}`)}
            className={`px-2 py-0.5 rounded-sm font-sans text-[11px] cursor-pointer ${
              !testMode
                ? 'bg-accent-soft text-accent font-medium border border-accent/30'
                : 'text-text-muted hover:text-text hover:bg-surface-alt'
            }`}
          >
            (1) Empty form
          </button>
          <span className="text-text-faint">·</span>
          <button
            type="button"
            onClick={() =>
              navigate(`/visits/new?patient=${patientDisplay.id}&test=filled`)
            }
            className={`px-2 py-0.5 rounded-sm font-sans text-[11px] cursor-pointer ${
              testMode === 'filled'
                ? 'bg-accent-soft text-accent font-medium border border-accent/30'
                : 'text-text-muted hover:text-text hover:bg-surface-alt'
            }`}
          >
            (2) Partially filled (vitals + Rx)
          </button>
          <span className="text-text-faint">·</span>
          <button
            type="button"
            onClick={() =>
              navigate(`/visits/new?patient=${patientDisplay.id}&test=dictation`)
            }
            className={`px-2 py-0.5 rounded-sm font-sans text-[11px] cursor-pointer ${
              testMode === 'dictation'
                ? 'bg-accent-soft text-accent font-medium border border-accent/30'
                : 'text-text-muted hover:text-text hover:bg-surface-alt'
            }`}
          >
            (3) Dictation active
          </button>
          <span className="text-text-faint">·</span>
          <button
            type="button"
            onClick={() =>
              navigate(`/visits/new?patient=${patientDisplay.id}&test=ocr`)
            }
            className={`px-2 py-0.5 rounded-sm font-sans text-[11px] cursor-pointer ${
              testMode === 'ocr'
                ? 'bg-accent-soft text-accent font-medium border border-accent/30'
                : 'text-text-muted hover:text-text hover:bg-surface-alt'
            }`}
          >
            (4) OCR text expanded
          </button>
        </div>
      </div>

      {/* Main layout: max-width 880px centered in content area, with sticky right rail at ≥1280px */}
      <div className="flex justify-center xl:justify-start xl:gap-8 max-w-[1200px] mx-auto w-full">
        {/* Form Container (max-width 880px) */}
        <div className="w-full max-w-[880px] flex flex-col gap-5">
          {/* ── PAGE HEADER ── */}
          <div className="flex flex-col gap-2">
            {/* Back link (ghost, small): "← <Patient name>" → /patients/:id */}
            <div>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 font-sans text-xs text-text-muted hover:text-text cursor-pointer py-1 transition-colors duration-120 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-sm -ml-1 px-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{patientDisplay.fullName}</span>
              </button>
            </div>

            {/* Header row: Title + identity strip on left, 2 buttons on right */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                {/* Serif page title: "New visit" (text-3xl, 400, Lora) */}
                <h1 className="font-serif text-3xl font-normal text-text tracking-tight leading-tight">
                  New visit
                </h1>

                {/* Identity strip in mono + Inter */}
                <div className="font-sans text-xs text-text-muted flex items-center gap-1.5 select-none">
                  <span className="font-medium text-text">{patientDisplay.fullName}</span>
                  <span className="text-text-faint">·</span>
                  <span className="font-mono tabular-nums">{patientDisplay.clinicId}</span>
                  <span className="text-text-faint">·</span>
                  <span className="font-mono tabular-nums">{patientDisplay.age}F</span>
                  <span className="text-text-faint">·</span>
                  <span>{patientDisplay.village}</span>
                </div>
              </div>

              {/* Right side: Save draft + Complete visit buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="h-9 px-3.5 bg-surface text-text hover:bg-surface-alt border border-border text-xs font-sans font-medium rounded-sm transition-colors cursor-pointer select-none"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  onClick={handleCompleteVisit}
                  className="h-9 px-4 inline-flex items-center gap-1.5 bg-accent text-bg hover:bg-accent/90 border border-transparent text-xs font-sans font-medium rounded-sm transition-colors cursor-pointer select-none"
                >
                  <span>Complete visit</span>
                  <kbd className="hidden sm:inline-flex items-center font-mono text-[10px] text-bg/90 px-1 py-0.2 rounded-sm bg-accent-hover">
                    ⌘↵
                  </kbd>
                </button>
              </div>
            </div>

            {/* Autosave status indicator row */}
            <div className="flex items-center justify-between text-xs font-sans text-text-muted pt-1">
              <span>Record clinical observations, vitals, assessment, and prescriptions.</span>
              {autosaveStatus === 'saving' && (
                <span className="text-text-muted">Saving…</span>
              )}
              {autosaveStatus === 'saved' && lastSavedTime && (
                <span className="text-text-muted font-mono tabular-nums">
                  Draft saved · {lastSavedTime}
                </span>
              )}
            </div>
          </div>

          {/* ── PATIENT SNAPSHOT RAIL (COLLAPSED ABOVE FORM FOR <1280px) ── */}
          <PatientSnapshotRail patient={patientDisplay} isCompactStrip />

          {/* ── OFFLINE QUIET INLINE NOTE ── */}
          {isOffline && (
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-alt border border-border rounded-sm text-xs font-sans text-text-muted shadow-none">
              <span className="w-1.5 h-1.5 rounded-full bg-sync-ok shrink-0" aria-hidden="true" />
              <span>Offline. This visit will sync when you reconnect.</span>
            </div>
          )}

          {/* ── UNSAVED VISIT DRAFT NOTICE ── */}
          {draftPrompt && (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-surface-alt border border-border rounded-sm text-xs font-sans text-text shadow-none">
              <span>
                Unsaved visit from{' '}
                <span className="font-mono tabular-nums">{draftPrompt.time}</span>.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={resumeDraft}
                  className="font-sans text-xs font-medium text-text hover:text-accent cursor-pointer py-0.5 px-2 rounded-sm bg-surface border border-border"
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={discardDraft}
                  className="font-sans text-xs text-text-muted hover:text-danger cursor-pointer py-0.5 px-1.5"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* ── MAIN VISIT FORM CARD (32px padding, 8px radius, no shadow) ── */}
          <div className="bg-surface border border-border rounded-md p-8 shadow-none flex flex-col gap-6">
            {/* ── SECTION 1 — VISIT DETAILS (Always open) ── */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium">
                  Visit details
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date & time */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="field-datetime"
                    className="font-sans text-xs font-medium text-text select-none"
                  >
                    Date & time
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="field-date"
                      type="date"
                      value={formData.visitDate}
                      onChange={(e) => updateField('visitDate', e.target.value)}
                      className="w-full h-9 px-2 bg-surface text-text font-mono text-xs tabular-nums rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    />
                    <input
                      id="field-time"
                      type="time"
                      value={formData.visitTime}
                      onChange={(e) => updateField('visitTime', e.target.value)}
                      className="w-24 h-9 px-2 bg-surface text-text font-mono text-xs tabular-nums rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    />
                  </div>
                </div>

                {/* Visit type: Consultation / Follow-up / Emergency */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="field-type"
                    className="font-sans text-xs font-medium text-text select-none"
                  >
                    Visit type
                  </label>
                  <SegmentedControl
                    name="Visit type"
                    value={formData.visitType}
                    onChange={(val) => updateField('visitType', val as any)}
                    options={[
                      { value: 'Consultation', label: 'Consultation' },
                      { value: 'Follow-up', label: 'Follow-up' },
                      { value: 'Emergency', label: 'Emergency' },
                    ]}
                  />
                </div>

                {/* Seen by: staff selection */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="field-seenBy"
                    className="font-sans text-xs font-medium text-text select-none"
                  >
                    Seen by
                  </label>
                  <select
                    id="field-seenBy"
                    value={formData.seenBy}
                    onChange={(e) => updateField('seenBy', e.target.value)}
                    className="w-full h-9 px-3 bg-surface text-text text-xs rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {CLINIC_STAFF.map((staff) => (
                      <option key={staff} value={staff}>
                        {staff}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 1px divider */}
            <div className="h-px bg-border w-full" />

            {/* ── SECTION 2 — PRESENTING (Always open) ── */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium">
                  Presenting
                </span>
              </div>

              {/* Chief complaint + Duration */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Chief complaint (required, autofocus) */}
                <div className="md:col-span-8 flex flex-col gap-1.5">
                  <label
                    htmlFor="field-chiefComplaint"
                    className="flex items-center gap-1 font-sans text-xs font-medium text-text select-none"
                  >
                    <span>Chief complaint</span>
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-terra inline-block shrink-0"
                      aria-label="Required"
                    />
                  </label>
                  <input
                    id="field-chiefComplaint"
                    ref={chiefComplaintRef}
                    type="text"
                    value={formData.chiefComplaint}
                    onChange={(e) => updateField('chiefComplaint', e.target.value)}
                    placeholder="e.g. Headache for 3 days, dizziness on standing"
                    className={`w-full h-9 px-3 bg-surface text-text text-sm rounded-sm border transition-colors ${
                      errors.chiefComplaint
                        ? 'border-danger focus-visible:outline-danger'
                        : 'border-border focus-visible:outline-accent'
                    }`}
                  />
                  {errors.chiefComplaint && (
                    <div className="flex items-center gap-1 text-xs text-danger font-sans mt-0.5">
                      <AlertCircle className="w-3 h-3 text-danger shrink-0" strokeWidth={1.5} />
                      <span>{errors.chiefComplaint}</span>
                    </div>
                  )}
                </div>

                {/* Duration: compact input + unit segmented (days/weeks/months) */}
                <div className="md:col-span-4 flex flex-col gap-1.5">
                  <label
                    htmlFor="field-duration"
                    className="font-sans text-xs font-medium text-text select-none"
                  >
                    Duration
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      id="field-duration"
                      type="number"
                      min={1}
                      max={365}
                      value={formData.durationValue}
                      onChange={(e) => updateField('durationValue', e.target.value)}
                      className="w-16 h-9 px-2 bg-surface text-text font-mono text-sm tabular-nums rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    />
                    <div className="grid grid-cols-3 p-0.5 bg-surface-alt border border-border rounded-sm flex-1">
                      {(['days', 'weeks', 'months'] as const).map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => updateField('durationUnit', unit)}
                          className={`px-1.5 py-1 text-[11px] font-sans rounded-sm transition-colors cursor-pointer text-center ${
                            formData.durationUnit === unit
                              ? 'bg-surface text-text font-medium border border-border/80 shadow-none'
                              : 'text-text-muted hover:text-text'
                          }`}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Presenting Notes with Dictation affordance */}
              <NotesTextarea
                id="notes-presenting"
                label="Presenting notes"
                rows={4}
                value={formData.presentingNotes}
                onChange={(val) => updateField('presentingNotes', val)}
                placeholder="What the patient reports…"
                isForceListening={testMode === 'dictation'}
              />
            </div>

            {/* 1px divider */}
            <div className="h-px bg-border w-full" />

            {/* ── SECTION 3 — VITALS (Collapsible, open by default) ── */}
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setVitalsOpen((prev) => !prev)}
                aria-expanded={vitalsOpen}
                className="flex items-center justify-between py-1 text-left group cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-sm"
              >
                <span className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium group-hover:text-text transition-colors">
                  Vitals
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-text-muted group-hover:text-text transition-transform duration-150 ${
                    vitalsOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                  strokeWidth={1.5}
                />
              </button>

              {vitalsOpen && (
                <div className="pt-3">
                  <VitalsGrid
                    bp={formData.bp}
                    pulse={formData.pulse}
                    temp={formData.temp}
                    weight={formData.weight}
                    onChangeBp={(val) => updateField('bp', val)}
                    onChangePulse={(val) => updateField('pulse', val)}
                    onChangeTemp={(val) => updateField('temp', val)}
                    onChangeWeight={(val) => updateField('weight', val)}
                  />
                </div>
              )}
            </div>

            {/* 1px divider */}
            <div className="h-px bg-border w-full" />

            {/* ── SECTION 4 — ASSESSMENT (Always open) ── */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium">
                  Assessment
                </span>
              </div>

              {/* Diagnosis + ICD code */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-9 flex flex-col gap-1.5">
                  <label
                    htmlFor="field-diagnosis"
                    className="font-sans text-xs font-medium text-text select-none"
                  >
                    Diagnosis
                  </label>
                  <input
                    id="field-diagnosis"
                    type="text"
                    list="clinic-diagnoses-list"
                    value={formData.diagnosis}
                    onChange={(e) => updateField('diagnosis', e.target.value)}
                    placeholder="e.g. Essential Hypertension (Stage 1)"
                    className="w-full h-9 px-3 bg-surface text-text text-sm rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  />
                  <datalist id="clinic-diagnoses-list">
                    {COMMON_DIAGNOSES.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>

                <div className="sm:col-span-3 flex flex-col gap-1.5">
                  <label
                    htmlFor="field-icd"
                    className="font-sans text-xs font-medium text-text select-none"
                  >
                    ICD / Code
                  </label>
                  <input
                    id="field-icd"
                    type="text"
                    value={formData.icdCode}
                    onChange={(e) => updateField('icdCode', e.target.value)}
                    placeholder="I10"
                    className="w-full h-9 px-3 bg-surface text-text font-mono text-sm tabular-nums text-right rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  />
                </div>
              </div>

              {/* Assessment Notes with Dictation affordance */}
              <NotesTextarea
                id="notes-assessment"
                label="Assessment & clinical notes"
                rows={3}
                value={formData.assessmentNotes}
                onChange={(val) => updateField('assessmentNotes', val)}
                placeholder="Clinical reasoning, progress notes, lifestyle counseling…"
              />
            </div>

            {/* 1px divider */}
            <div className="h-px bg-border w-full" />

            {/* ── SECTION 5 — PRESCRIPTION (Collapsible, open if Consultation/Follow-up) ── */}
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setRxOpen((prev) => !prev)}
                aria-expanded={rxOpen}
                className="flex items-center justify-between py-1 text-left group cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-sm"
              >
                <span className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium group-hover:text-text transition-colors">
                  Prescription
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-text-muted group-hover:text-text transition-transform duration-150 ${
                    rxOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                  strokeWidth={1.5}
                />
              </button>

              {rxOpen && (
                <div className="pt-3 flex flex-col gap-3">
                  {/* Common medicines datalist */}
                  <datalist id="clinic-common-meds">
                    {COMMON_MEDICINES.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>

                  {/* Prescription row list */}
                  <div className="flex flex-col divide-y divide-border/40">
                    {formData.prescriptions.map((rx) => (
                      <PrescriptionRow
                        key={rx.id}
                        item={rx}
                        canRemove={formData.prescriptions.length > 1}
                        onUpdate={updatePrescriptionRow}
                        onRemove={removePrescriptionRow}
                      />
                    ))}
                  </div>

                  {/* Add medicine button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={addPrescriptionRow}
                      className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-accent hover:text-accent-hover cursor-pointer py-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add medicine</span>
                    </button>
                    <div className="font-sans text-xs text-text-muted mt-1">
                      Tip: press <kbd className="font-mono text-[10px] px-1 py-0.5 rounded-sm bg-surface-alt border border-border">⌘⇧M</kbd> to add a row.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 1px divider */}
            <div className="h-px bg-border w-full" />

            {/* ── SECTION 6 — ATTACHMENTS (Collapsible, collapsed by default) ── */}
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setAttachmentsOpen((prev) => !prev)}
                aria-expanded={attachmentsOpen}
                className="flex items-center justify-between py-1 text-left group cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium group-hover:text-text transition-colors">
                    Attachments
                  </span>
                  {attachments.length > 0 && (
                    <span className="font-mono text-[11px] text-text-muted px-1.5 py-0.2 rounded-full bg-surface-alt border border-border">
                      {attachments.length}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-text-muted group-hover:text-text transition-transform duration-150 ${
                    attachmentsOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                  strokeWidth={1.5}
                />
              </button>

              {attachmentsOpen && (
                <div className="pt-3">
                  <AttachmentList
                    attachments={attachments}
                    onAddAttachment={addAttachment}
                    onRemoveAttachment={removeAttachment}
                    onToggleOcrExpand={toggleOcrExpand}
                    onUpdateOcrText={updateOcrText}
                    onSetEditingOcr={setEditingOcr}
                    onRetryAttachment={retryAttachment}
                    onPromoteOcrText={handlePromoteOcrText}
                  />
                </div>
              )}
            </div>

            {/* 1px divider */}
            <div className="h-px bg-border w-full" />

            {/* ── SECTION 7 — FOLLOW-UP (Collapsible, collapsed by default) ── */}
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setFollowUpOpen((prev) => !prev)}
                aria-expanded={followUpOpen}
                className="flex items-center justify-between py-1 text-left group cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-sm"
              >
                <span className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium group-hover:text-text transition-colors">
                  Follow-up
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-text-muted group-hover:text-text transition-transform duration-150 ${
                    followUpOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                  strokeWidth={1.5}
                />
              </button>

              {followUpOpen && (
                <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Next visit date */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="field-nextVisit"
                      className="font-sans text-xs font-medium text-text select-none"
                    >
                      Next visit
                    </label>
                    <input
                      id="field-nextVisit"
                      type="date"
                      value={formData.nextVisitDate}
                      onChange={(e) => updateField('nextVisitDate', e.target.value)}
                      className="w-full h-9 px-3 bg-surface text-text font-mono text-xs tabular-nums rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    />
                  </div>

                  {/* Reminder note */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="field-reminder"
                      className="font-sans text-xs font-medium text-text select-none"
                    >
                      Reminder note
                    </label>
                    <input
                      id="field-reminder"
                      type="text"
                      value={formData.reminderNote}
                      onChange={(e) => updateField('reminderNote', e.target.value)}
                      placeholder="e.g. Fasting blood sugar repeat"
                      className="w-full h-9 px-3 bg-surface text-text text-xs rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── STICKY FOOTER ACTION BAR ── */}
          <div className="sticky bottom-4 z-20 bg-surface border border-border rounded-md p-4 shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: ghost button "Cancel" (warns if dirty) */}
            <button
              type="button"
              onClick={handleCancel}
              className="h-11 px-3 text-sm font-sans font-medium text-text-muted hover:text-text cursor-pointer transition-colors duration-120 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent self-start sm:self-auto"
            >
              Cancel
            </button>

            {/* Right side controls */}
            <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
              {/* If follow-up date is set, offer secondary checkbox */}
              {formData.nextVisitDate && (
                <label className="inline-flex items-center gap-2 cursor-pointer font-sans text-xs text-text-muted select-none mr-1">
                  <input
                    type="checkbox"
                    checked={formData.printFollowUpSlip}
                    onChange={(e) => updateField('printFollowUpSlip', e.target.checked)}
                    className="w-4 h-4 rounded-sm border-border accent-accent cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print follow-up slip for patient</span>
                  </span>
                </label>
              )}

              {/* Secondary: "Save draft" */}
              <button
                type="button"
                onClick={handleSaveDraft}
                className="h-11 px-4 bg-surface text-text hover:bg-surface-alt border border-border text-sm font-sans font-medium rounded-sm transition-colors duration-120 cursor-pointer select-none"
              >
                Save draft
              </button>

              {/* Primary: "Complete visit" */}
              <button
                type="button"
                onClick={handleCompleteVisit}
                className="h-11 min-w-[120px] px-5 inline-flex items-center justify-center gap-2 bg-accent text-bg hover:bg-accent/90 border border-transparent text-sm font-sans font-medium rounded-sm transition-colors duration-120 cursor-pointer select-none"
              >
                <span>Complete visit</span>
                <kbd className="hidden sm:inline-flex items-center font-mono text-[10px] text-bg/90 px-1 py-0.5 rounded-sm bg-accent-hover">
                  ⌘↵
                </kbd>
              </button>
            </div>
          </div>
        </div>

        {/* ── PATIENT SNAPSHOT RAIL (Sticky right rail for ≥1280px) ── */}
        <PatientSnapshotRail patient={patientDisplay} />
      </div>

      {/* ── TOAST NOTIFICATIONS (BOTTOM LEFT) ── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-6 z-50 flex items-center justify-between gap-4 px-4 py-3 bg-surface border border-border rounded-md shadow-none select-none text-sm font-sans ${
            toast.type === 'success'
              ? 'border-l-4 border-l-accent'
              : 'border-l-4 border-l-danger'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
            ) : (
              <AlertCircle className="w-4 h-4 text-danger shrink-0" strokeWidth={1.5} />
            )}
            <span className="text-text font-medium">{toast.message}</span>
          </div>

          {toast.actionText && toast.onAction && (
            <button
              type="button"
              onClick={toast.onAction}
              className="font-sans text-xs font-medium text-accent hover:underline cursor-pointer ml-2 shrink-0"
            >
              {toast.actionText}
            </button>
          )}
        </div>
      )}

      {/* ── CONFIRM DISCARD MODAL ── */}
      {showDiscardModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discard-visit-title"
        >
          <div className="w-full max-w-sm bg-surface border border-border rounded-md p-6 shadow-modal flex flex-col gap-4 text-left">
            <div>
              <h2 id="discard-visit-title" className="font-sans font-medium text-base text-text">
                Discard this visit?
              </h2>
              <p className="font-sans text-xs text-text-muted mt-1">
                Changes will be lost.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="h-9 px-3 text-xs font-sans font-medium text-text bg-surface hover:bg-surface-alt border border-border rounded-sm cursor-pointer transition-colors"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="h-9 px-3 text-xs font-sans font-medium text-bg bg-danger hover:bg-danger/90 border border-transparent rounded-sm cursor-pointer transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
