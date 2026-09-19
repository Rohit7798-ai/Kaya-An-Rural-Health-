import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import { Field } from '../components/form/Field';
import { SegmentedControl } from '../components/form/SegmentedControl';
import { CollapsibleSection } from '../components/form/CollapsibleSection';
import { RecentRegistrationsRail } from '../components/RecentRegistrationsRail';
import { usePatientForm } from '../features/patients/usePatientForm';
import { useDuplicateCheck } from '../features/patients/useDuplicateCheck';
import { Button } from '../components/ui/Button';
import { offlineSyncService } from '../services/offlineSyncService';
import { Patient } from '../types';

const VILLAGE_OPTIONS = [
  'Wardha',
  'Jamunwadi',
  'Rampur',
  'Sundarpur',
  'Nagpur',
  'Deoli',
  'Hinganghat',
  'Seloo',
  'Arvi',
  'Samudrapur',
  'Ashti',
  'Karanja',
];

export const NewPatient: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    formData,
    updateField,
    isDirty,
    setIsDirty,
    errors,
    setErrors,
    autosaveStatus,
    lastSavedTime,
    draftPrompt,
    resumeDraft,
    discardDraft,
    validate,
    clearDraft,
    submitPatientForm,
  } = usePatientForm();

  // Collapsible sections state
  const [contactOpen, setContactOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [externalIdOpen, setExternalIdOpen] = useState(false);

  // Discard confirmation modal state
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  // Duplicate checker
  const { match: duplicatePatient, dismiss: dismissDuplicate } = useDuplicateCheck(
    formData.fullName,
    formData.village
  );

  // Field refs for programmatic focus on validation error
  const nameInputRef = useRef<HTMLInputElement>(null);
  const ageInputRef = useRef<HTMLInputElement>(null);
  const villageInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const emergencyInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLTextAreaElement>(null);
  const allergiesInputRef = useRef<HTMLInputElement>(null);
  const conditionsInputRef = useRef<HTMLInputElement>(null);
  const notesInputRef = useRef<HTMLTextAreaElement>(null);
  const legacyIdInputRef = useRef<HTMLInputElement>(null);

  // Focus autofocus field on mount
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Check URL query parameters for test states (?test=error or ?test=duplicate)
  useEffect(() => {
    const testMode = searchParams.get('test');
    if (testMode === 'error') {
      // Simulate validation error state
      setErrors({
        fullName: 'Full name is required.',
        age: 'Age is required.',
        gender: 'Please select sex.',
      });
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    } else if (testMode === 'duplicate') {
      // Pre-fill duplicate name & village
      updateField('fullName', 'Sunita Patil');
      updateField('age', '42');
      updateField('gender', 'Female');
      updateField('village', 'Wardha');
    }
  }, [searchParams, updateField, setErrors]);

  // Toast timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle Cancel / Back navigation with dirty check
  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      navigate('/patients');
    }
  };

  // Confirm discard
  const handleConfirmDiscard = () => {
    discardDraft();
    setShowDiscardModal(false);
    navigate('/patients');
  };

  // Submit handler
  const handleSubmit = async (andAddVisit: boolean = false) => {
    const { isValid, firstErrorField } = validate();

    if (!isValid) {
      // Focus jump to first invalid field and scroll with 12px offset
      if (firstErrorField === 'fullName') {
        nameInputRef.current?.focus();
        nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (firstErrorField === 'age') {
        ageInputRef.current?.focus();
        ageInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (firstErrorField === 'gender') {
        const genderEl = document.getElementById('field-gender');
        genderEl?.focus();
        genderEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      const { id: newPatientId } = await submitPatientForm();

      // Show olive success toast
      setToast({ message: 'Patient saved to offline register.', type: 'success' });

      // Navigate immediately
      if (andAddVisit) {
        navigate(`/visits/new?patientId=${newPatientId}`);
      } else {
        navigate(`/patients/${newPatientId}`);
      }
    } catch {
      // Show brick failure toast without navigating away
      setToast({ message: "Couldn't save patient. Try again.", type: 'danger' });
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc → trigger Cancel flow (warn if dirty)
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showDiscardModal) {
          setShowDiscardModal(false);
        } else {
          handleCancel();
        }
        return;
      }

      // ⌘⇧Enter / Ctrl+Shift+Enter → Save & add visit
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(true);
        return;
      }

      // ⌘Enter / Ctrl+Enter → Save patient
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, showDiscardModal, formData]);

  // Move to next input on Enter (does NOT submit)
  const handleInputKeyDown = (
    e: React.KeyboardEvent,
    nextInputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
    expandSection?: () => void
  ) => {
    if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      if (expandSection) {
        expandSection();
      }
      setTimeout(() => {
        nextInputRef?.current?.focus();
      }, 20);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* 
        Quick demo / evaluation strip to easily inspect all 3 required test states:
        (1) empty form, (2) validation error, (3) duplicate warning
      */}
      <div className="flex items-center justify-between pb-2 border-b border-border/40 text-[11px] font-sans text-text-muted">
        <span className="flex items-center gap-1">
          <span>Registration form test states:</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/patients/new')}
            className={`px-2 py-0.5 rounded-sm font-sans text-[11px] cursor-pointer ${
              !searchParams.get('test')
                ? 'bg-accent-soft text-accent font-medium border border-accent/30'
                : 'text-text-muted hover:text-text hover:bg-surface-alt'
            }`}
          >
            (1) Empty form
          </button>
          <span className="text-text-faint">·</span>
          <button
            type="button"
            onClick={() => navigate('/patients/new?test=error')}
            className={`px-2 py-0.5 rounded-sm font-sans text-[11px] cursor-pointer ${
              searchParams.get('test') === 'error'
                ? 'bg-accent-soft text-accent font-medium border border-accent/30'
                : 'text-text-muted hover:text-text hover:bg-surface-alt'
            }`}
          >
            (2) Validation error
          </button>
          <span className="text-text-faint">·</span>
          <button
            type="button"
            onClick={() => navigate('/patients/new?test=duplicate')}
            className={`px-2 py-0.5 rounded-sm font-sans text-[11px] cursor-pointer ${
              searchParams.get('test') === 'duplicate'
                ? 'bg-accent-soft text-accent font-medium border border-accent/30'
                : 'text-text-muted hover:text-text hover:bg-surface-alt'
            }`}
          >
            (3) Duplicate warning
          </button>
        </div>
      </div>

      {/* Main layout: Centered 640px form + sticky right rail at ≥1280px */}
      <div className="flex justify-center xl:justify-start xl:gap-8 max-w-5xl mx-auto w-full">
        {/* Form Container (max-width: 640px) */}
        <div className="w-full max-w-[640px] flex flex-col gap-5">
          {/* ── PAGE HEADER ── */}
          <div className="flex flex-col gap-2">
            {/* Back link (ghost, small): "← Patients" */}
            <div>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 font-sans text-xs text-text-muted hover:text-text cursor-pointer py-1 transition-colors duration-120 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-sm -ml-1 px-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Patients</span>
              </button>
            </div>

            {/* Serif page title: "New patient" (text-3xl, 400, Lora) */}
            <h1 className="font-serif text-3xl font-normal text-text tracking-tight leading-tight">
              New patient
            </h1>

            {/* Subtitle + Autosave Status row */}
            <div className="flex items-center justify-between text-xs font-sans text-text-muted">
              <span>Fill what you know. You can add the rest later.</span>
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

          {/* ── OFFLINE QUIET INLINE NOTE ── */}
          <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-sm text-xs font-sans text-text-muted shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-sync-ok shrink-0" aria-hidden="true" />
            <span>Offline. This patient will sync when you reconnect.</span>
          </div>

          {/* ── UNSAVED DRAFT NOTICE (ON MOUNT) ── */}
          {draftPrompt && (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-surface-alt border border-border rounded-sm text-xs font-sans text-text shadow-none">
              <span>
                You have an unsaved patient from{' '}
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

          {/* ── DUPLICATE WARNING CARD (NON-BLOCKING) ── */}
          {duplicatePatient && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-warning-soft/40 border border-warning/30 rounded-sm text-xs font-sans text-text shadow-none">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0" strokeWidth={1.5} />
                <span>
                  Possible duplicate:{' '}
                  <span className="font-medium text-text">{duplicatePatient.fullName}</span>{' '}
                  · <span className="font-mono tabular-nums">{duplicatePatient.age}F</span> ·{' '}
                  {duplicatePatient.village} ·{' '}
                  <span className="font-mono tabular-nums">{duplicatePatient.clinicId}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(`/patients/${duplicatePatient.id}`)}
                  className="font-sans text-xs font-medium text-text hover:text-accent py-1 px-2.5 bg-surface border border-border rounded-sm cursor-pointer"
                >
                  Open existing
                </button>
                <button
                  type="button"
                  onClick={dismissDuplicate}
                  className="font-sans text-xs text-text-muted hover:text-text py-1 px-1.5 cursor-pointer"
                >
                  Continue anyway
                </button>
              </div>
            </div>
          )}

          {/* ── MAIN FORM CARD ── */}
          <div className="bg-surface border border-border rounded-md p-8 shadow-none flex flex-col gap-6">
            {/* SECTION 1 — IDENTITY */}
            <div className="flex flex-col gap-4">
              <div className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium mb-1">
                Identity
              </div>

              {/* Full name * */}
              <Field
                id="field-fullName"
                label="Full name"
                required
                error={errors.fullName}
              >
                <input
                  id="field-fullName"
                  ref={nameInputRef}
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(e, ageInputRef)}
                  placeholder="e.g. Laxman Rathod"
                  className={`w-full h-9 px-3 bg-surface text-text text-sm rounded-sm border transition-colors duration-120 focus-visible:outline focus-visible:outline-2 ${
                    errors.fullName
                      ? 'border-danger focus-visible:outline-danger'
                      : 'border-border focus-visible:outline-accent'
                  }`}
                />
              </Field>

              {/* Age * and Sex * row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Age * */}
                <Field
                  id="field-age"
                  label="Age"
                  required
                  error={errors.age}
                >
                  <div className="relative flex items-center">
                    <input
                      id="field-age"
                      ref={ageInputRef}
                      type="number"
                      min={0}
                      max={120}
                      value={formData.age}
                      onChange={(e) => updateField('age', e.target.value)}
                      onKeyDown={(e) => handleInputKeyDown(e, villageInputRef)}
                      placeholder="0–120"
                      className={`w-full h-9 pl-3 pr-14 bg-surface text-text font-mono text-sm tabular-nums rounded-sm border transition-colors duration-120 focus-visible:outline focus-visible:outline-2 ${
                        errors.age
                          ? 'border-danger focus-visible:outline-danger'
                          : 'border-border focus-visible:outline-accent'
                      }`}
                    />
                    <span className="absolute right-3 font-sans text-xs text-text-muted pointer-events-none select-none">
                      years
                    </span>
                  </div>
                </Field>

                {/* Sex * */}
                <Field
                  id="field-gender"
                  label="Sex"
                  required
                  error={errors.gender}
                >
                  <SegmentedControl
                    id="field-gender"
                    name="Sex"
                    value={formData.gender}
                    onChange={(val) => updateField('gender', val)}
                    hasError={Boolean(errors.gender)}
                    options={[
                      { value: 'Female', label: 'Female' },
                      { value: 'Male', label: 'Male' },
                      { value: 'Other', label: 'Other' },
                    ]}
                  />
                </Field>
              </div>

              {/* Village */}
              <Field
                id="field-village"
                label="Village"
                helperText="Type or select from frequent clinic locations"
              >
                <input
                  id="field-village"
                  ref={villageInputRef}
                  type="text"
                  list="villages-list"
                  value={formData.village}
                  onChange={(e) => updateField('village', e.target.value)}
                  onKeyDown={(e) =>
                    handleInputKeyDown(e, phoneInputRef, () => setContactOpen(true))
                  }
                  placeholder="e.g. Wardha"
                  className="w-full h-9 px-3 bg-surface text-text text-sm rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors duration-120"
                />
                <datalist id="villages-list">
                  {VILLAGE_OPTIONS.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </Field>
            </div>

            {/* SECTION 2 — CONTACT (Collapsible) */}
            <CollapsibleSection
              title="Contact details"
              isOpen={contactOpen}
              onToggle={() => setContactOpen((prev) => !prev)}
            >
              {/* Phone with static +91 */}
              <Field id="field-phone" label="Phone">
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono text-xs text-text-muted select-none">
                    +91
                  </span>
                  <input
                    id="field-phone"
                    ref={phoneInputRef}
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    onKeyDown={(e) => handleInputKeyDown(e, emergencyInputRef)}
                    placeholder="98765 43210"
                    className="w-full h-9 pl-11 pr-3 bg-surface text-text font-mono text-sm tabular-nums rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors duration-120"
                  />
                </div>
              </Field>

              {/* Emergency Contact */}
              <Field id="field-emergency" label="Emergency contact">
                <input
                  id="field-emergency"
                  ref={emergencyInputRef}
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => updateField('emergencyContact', e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(e, addressInputRef)}
                  placeholder="e.g. Ramesh Patil (Brother)"
                  className="w-full h-9 px-3 bg-surface text-text text-sm rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors duration-120"
                />
              </Field>

              {/* Address */}
              <Field id="field-address" label="Address">
                <textarea
                  id="field-address"
                  ref={addressInputRef}
                  rows={2}
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="House number, landmark, sub-centre zone"
                  className="w-full p-2.5 bg-surface text-text text-sm rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors duration-120 resize-none"
                />
              </Field>
            </CollapsibleSection>

            {/* SECTION 3 — CLINICAL NOTES (Collapsible) */}
            <CollapsibleSection
              title="Clinical notes"
              isOpen={notesOpen}
              onToggle={() => setNotesOpen((prev) => !prev)}
            >
              {/* Known allergies */}
              <Field id="field-allergies" label="Known allergies">
                <input
                  id="field-allergies"
                  ref={allergiesInputRef}
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => updateField('allergies', e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(e, conditionsInputRef)}
                  placeholder="e.g. Penicillin, Sulfa"
                  className="w-full h-9 px-3 bg-surface text-text text-sm rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors duration-120"
                />
              </Field>

              {/* Chronic conditions */}
              <Field id="field-conditions" label="Chronic conditions">
                <input
                  id="field-conditions"
                  ref={conditionsInputRef}
                  type="text"
                  value={formData.chronicConditions}
                  onChange={(e) => updateField('chronicConditions', e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(e, notesInputRef)}
                  placeholder="e.g. Hypertension, Type 2 Diabetes"
                  className="w-full h-9 px-3 bg-surface text-text text-sm rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors duration-120"
                />
              </Field>

              {/* Free notes (Lora serif for input text) */}
              <Field id="field-notes" label="Free notes">
                <textarea
                  id="field-notes"
                  ref={notesInputRef}
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Observations, referral history, or triage context…"
                  className="w-full p-2.5 bg-surface text-text font-serif text-sm rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors duration-120 resize-none"
                />
              </Field>
            </CollapsibleSection>

            {/* SECTION 4 — EXTERNAL ID (Collapsible) */}
            <CollapsibleSection
              title="External ID"
              isOpen={externalIdOpen}
              onToggle={() => setExternalIdOpen((prev) => !prev)}
            >
              <Field
                id="field-legacyId"
                label="Legacy record ID"
                helperText="Use this if the patient already has a paper card number from another clinic."
              >
                <input
                  id="field-legacyId"
                  ref={legacyIdInputRef}
                  type="text"
                  value={formData.legacyId}
                  onChange={(e) => updateField('legacyId', e.target.value)}
                  placeholder="e.g. RH-2021-994"
                  className="w-full h-9 px-3 bg-surface text-text font-mono text-sm tabular-nums rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors duration-120"
                />
              </Field>
            </CollapsibleSection>
          </div>

          {/* ── FOOTER ACTION BAR ── */}
          <div className="sticky bottom-4 z-20 bg-surface border border-border rounded-md p-4 shadow-none flex items-center justify-between gap-4">
            {/* Left: ghost button "Cancel" */}
            <button
              type="button"
              onClick={handleCancel}
              className="h-11 px-3 text-sm font-sans font-medium text-text-muted hover:text-text cursor-pointer transition-colors duration-120 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Cancel
            </button>

            {/* Right: two action buttons */}
            <div className="flex items-center gap-3">
              {/* Secondary: "Save & add visit" */}
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="h-11 px-4 flex items-center gap-2 bg-surface text-text hover:bg-surface-alt border border-border text-sm font-sans font-medium rounded-sm transition-colors duration-120 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent select-none"
              >
                <span>Save & add visit</span>
                <kbd className="hidden sm:inline-flex items-center font-mono text-[10px] text-text-muted px-1.5 py-0.5 rounded-sm bg-surface-alt border border-border">
                  ⌘⇧↵
                </kbd>
              </button>

              {/* Primary: "Save patient" */}
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                className="h-11 min-w-[120px] px-5 flex items-center justify-center gap-2 bg-accent text-bg hover:bg-accent/90 border border-transparent text-sm font-sans font-medium rounded-sm transition-colors duration-120 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent select-none"
              >
                <span>Save patient</span>
                <kbd className="hidden sm:inline-flex items-center font-mono text-[10px] text-bg/90 px-1 py-0.5 rounded-sm bg-accent-hover">
                  ⌘↵
                </kbd>
              </button>
            </div>
          </div>
        </div>

        {/* Right rail (≥1280px only) */}
        <RecentRegistrationsRail />
      </div>

      {/* ── TOAST NOTIFICATION (BOTTOM LEFT) ── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-md shadow-none select-none text-sm font-sans ${
            toast.type === 'success'
              ? 'border-l-4 border-l-accent'
              : 'border-l-4 border-l-danger'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
          ) : (
            <AlertCircle className="w-4 h-4 text-danger shrink-0" strokeWidth={1.5} />
          )}
          <span className="text-text font-medium">{toast.message}</span>
        </div>
      )}

      {/* ── CONFIRM DISCARD MODAL (ON ESC / CANCEL IF DIRTY) ── */}
      {showDiscardModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discard-title"
        >
          <div className="w-full max-w-sm bg-surface border border-border rounded-md p-6 shadow-modal flex flex-col gap-4 text-left">
            <div>
              <h2 id="discard-title" className="font-sans font-medium text-base text-text">
                Discard this patient?
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
