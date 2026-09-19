import React, { useState, useEffect, useRef } from 'react';
import { Visit, Patient, PrescriptionItem } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input, Select } from '../common/Input';
import { Badge } from '../common/Badge';
import { AttachmentViewerModal } from './AttachmentViewerModal';
import {
  ChevronLeft,
  Mic,
  MicOff,
  Paperclip,
  Check,
  Plus,
  Trash2,
  Save,
  Clock,
  User,
  AlertTriangle,
} from 'lucide-react';

interface VisitNotesScreenProps {
  visit: Visit;
  patient: Patient;
  onBack: () => void;
  onSaveVisit: (updatedVisit: Visit, markCompleted?: boolean) => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export const VisitNotesScreen: React.FC<VisitNotesScreenProps> = ({
  visit,
  patient,
  onBack,
  onSaveVisit,
  onShowToast,
}) => {
  // Form states
  const [chiefComplaint, setChiefComplaint] = useState(visit.chiefComplaint || '');
  const [status, setStatus] = useState<'Waiting' | 'In Consultation' | 'Completed'>(
    visit.status || 'In Consultation'
  );

  // Vitals
  const [bpSys, setBpSys] = useState<string>(
    visit.vitals.bloodPressureSystolic ? String(visit.vitals.bloodPressureSystolic) : ''
  );
  const [bpDia, setBpDia] = useState<string>(
    visit.vitals.bloodPressureDiastolic ? String(visit.vitals.bloodPressureDiastolic) : ''
  );
  const [pulse, setPulse] = useState<string>(
    visit.vitals.pulseBpm ? String(visit.vitals.pulseBpm) : ''
  );
  const [temp, setTemp] = useState<string>(
    visit.vitals.tempCelsius ? String(visit.vitals.tempCelsius) : ''
  );
  const [spo2, setSpo2] = useState<string>(
    visit.vitals.spo2Percent ? String(visit.vitals.spo2Percent) : ''
  );
  const [weight, setWeight] = useState<string>(
    visit.vitals.weightKg ? String(visit.vitals.weightKg) : ''
  );

  // Diagnosis
  const [diagnosis, setDiagnosis] = useState(visit.diagnosis || '');
  const [icdCode, setIcdCode] = useState(visit.icdCode || '');

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>(
    visit.prescriptions || []
  );

  // Free-text notes
  const [clinicalNotes, setClinicalNotes] = useState(visit.clinicalNotes || '');

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving…' | 'Unsaved changes'>('Saved');
  const lastSavedRef = useRef<string>(JSON.stringify({ chiefComplaint, clinicalNotes, diagnosis }));

  // Voice dictation
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Attachment & OCR modal state
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [ocrImageUrl, setOcrImageUrl] = useState('');
  const [ocrImageTitle, setOcrImageTitle] = useState('');
  const [ocrText, setOcrText] = useState('');

  // 3s Autosave loop
  useEffect(() => {
    const currentPayload = JSON.stringify({
      chiefComplaint,
      bpSys,
      bpDia,
      pulse,
      temp,
      spo2,
      weight,
      diagnosis,
      icdCode,
      prescriptions,
      clinicalNotes,
      status,
    });

    if (currentPayload !== lastSavedRef.current) {
      setSaveStatus('Unsaved changes');

      const timeout = setTimeout(() => {
        setSaveStatus('Saving…');
        const updatedVisit: Visit = {
          ...visit,
          chiefComplaint,
          status,
          diagnosis,
          icdCode: icdCode || undefined,
          vitals: {
            bloodPressureSystolic: bpSys ? Number(bpSys) : undefined,
            bloodPressureDiastolic: bpDia ? Number(bpDia) : undefined,
            pulseBpm: pulse ? Number(pulse) : undefined,
            tempCelsius: temp ? Number(temp) : undefined,
            spo2Percent: spo2 ? Number(spo2) : undefined,
            weightKg: weight ? Number(weight) : undefined,
          },
          prescriptions,
          clinicalNotes,
          lastModified: new Date().toISOString(),
        };

        onSaveVisit(updatedVisit, false);
        lastSavedRef.current = currentPayload;
        setSaveStatus('Saved');
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [
    chiefComplaint,
    bpSys,
    bpDia,
    pulse,
    temp,
    spo2,
    weight,
    diagnosis,
    icdCode,
    prescriptions,
    clinicalNotes,
    status,
    visit,
    onSaveVisit,
  ]);

  // Voice dictation integration via browser Web Speech API
  const toggleDictation = () => {
    if (isDictating) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsDictating(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onShowToast(
        'Speech dictation is not supported in this browser. You can type notes directly.',
        'error'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Clinical English / Indian English

      recognition.onstart = () => {
        setIsDictating(true);
        onShowToast('Listening… Speak your clinical findings.', 'success');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }
        if (transcript) {
          setClinicalNotes((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
        }
      };

      recognition.onerror = () => {
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setIsDictating(false);
      onShowToast('Could not access microphone.', 'error');
    }
  };

  // Add prescription item
  const handleAddPrescription = (medName?: string, defaultDose?: string, defaultFreq?: string) => {
    const newItem: PrescriptionItem = {
      id: `rx-${Date.now()}`,
      medication: medName || '',
      dosage: defaultDose || '',
      frequency: defaultFreq || 'Twice daily',
      durationDays: 5,
      instructions: '',
    };
    setPrescriptions((prev) => [...prev, newItem]);
  };

  const handleUpdatePrescription = (id: string, field: keyof PrescriptionItem, val: any) => {
    setPrescriptions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemovePrescription = (id: string) => {
    setPrescriptions((prev) => prev.filter((item) => item.id !== id));
  };

  // Attach sample paper note or upload
  const handleAttachPaperNote = () => {
    setOcrImageTitle('Outpatient Register Slip');
    setOcrImageUrl('sample-clinical-slip');
    setOcrText(
      `Patient attended with morning occipital headache and dizziness x 4 days. Missed regular anti-hypertensive medication. BP measured at 154/96 mmHg. Heart sounds regular. Advised resuming daily Amlodipine 5mg and salt reduction.`
    );
    setOcrModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setOcrImageTitle(file.name);
      setOcrImageUrl(reader.result as string);
      // Simulate OCR extraction from uploaded image
      setOcrText(
        `Scanned Register Entry: ${file.name.replace(/\.[^/.]+$/, '')}\nFindings: Vitals recorded in triage. Complaining of persistent cough and mild chest tightness. Prescribed oral antibiotic and bronchodilator syrup. Follow up in 5 days.`
      );
      setOcrModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleManualSave = (complete: boolean) => {
    const updatedVisit: Visit = {
      ...visit,
      chiefComplaint,
      status: complete ? 'Completed' : status,
      diagnosis,
      icdCode: icdCode || undefined,
      vitals: {
        bloodPressureSystolic: bpSys ? Number(bpSys) : undefined,
        bloodPressureDiastolic: bpDia ? Number(bpDia) : undefined,
        pulseBpm: pulse ? Number(pulse) : undefined,
        tempCelsius: temp ? Number(temp) : undefined,
        spo2Percent: spo2 ? Number(spo2) : undefined,
        weightKg: weight ? Number(weight) : undefined,
      },
      prescriptions,
      clinicalNotes,
      lastModified: new Date().toISOString(),
    };

    onSaveVisit(updatedVisit, complete);
    setSaveStatus('Saved');
    onShowToast(complete ? 'Consultation completed and saved.' : 'Visit notes saved.', 'success');
    if (complete) {
      onBack();
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto text-left pb-16">
      {/* Sticky Top Header: Patient Context + Autosave + Primary Actions */}
      <div className="sticky top-0 z-10 bg-[var(--bg)]/95 backdrop-blur-none border-b border-[var(--border)] py-3 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={onBack}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Back
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-semibold text-[var(--text)]">
                {patient.fullName}
              </h1>
              <span className="font-mono-tabular text-[12px] text-[var(--text-muted)]">
                {patient.age}y {patient.gender[0]} · {patient.clinicId} · {patient.village}
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-muted)]">
              Consultation with {visit.clinicianName} · Visit ID: <span className="font-mono-tabular">{visit.id}</span>
            </p>
          </div>
        </div>

        {/* Status, Autosave text, Save Actions */}
        <div className="flex items-center gap-3">
          {/* Quiet autosave text */}
          <span className="text-[12px] font-mono-tabular text-[var(--text-muted)] select-none">
            {saveStatus}
          </span>

          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            options={[
              { value: 'Waiting', label: 'Waiting' },
              { value: 'In Consultation', label: 'In Consultation' },
              { value: 'Completed', label: 'Completed' },
            ]}
            className="h-9 text-[13px] w-36"
          />

          <Button
            variant="secondary"
            size="md"
            onClick={() => handleManualSave(false)}
            icon={<Save className="w-4 h-4" />}
            title="Save visit (⌘S)"
          >
            Save
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => handleManualSave(true)}
            icon={<Check className="w-4 h-4" />}
          >
            Complete visit
          </Button>
        </div>
      </div>

      {/* Allergies Alert Banner (if patient has any) */}
      {patient.allergies && (
        <div className="mb-5 p-3 bg-[var(--danger-soft)] border border-[var(--danger)]/30 rounded-[6px] flex items-center gap-2 text-[13px] text-[var(--danger)]">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Patient Allergy Alert:</strong> {patient.allergies}
          </span>
        </div>
      )}

      {/* Two Column Layout: Left Structured Fields (6 cols) | Right Free-Text Notes & OCR (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Structured Clinical Fields (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* 1. Chief Complaint */}
          <Card padding="md">
            <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-3">
              Chief Complaint & Reason for Visit
            </h2>
            <Input
              placeholder="e.g. Fever x 3 days, watery diarrhea, headache…"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="text-[15px]"
            />
          </Card>

          {/* 2. Structured Vitals */}
          <Card padding="md">
            <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-3">
              Triage Vitals
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[12px] font-medium text-[var(--text-muted)] block mb-1">
                  BP (Systolic / Dia)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="120"
                    value={bpSys}
                    onChange={(e) => setBpSys(e.target.value)}
                    className="w-full h-10 px-2.5 text-center font-mono-tabular text-[14px] bg-[var(--surface)] border border-[var(--border)] rounded-[6px]"
                  />
                  <span className="text-[var(--text-faint)]">/</span>
                  <input
                    type="number"
                    placeholder="80"
                    value={bpDia}
                    onChange={(e) => setBpDia(e.target.value)}
                    className="w-full h-10 px-2.5 text-center font-mono-tabular text-[14px] bg-[var(--surface)] border border-[var(--border)] rounded-[6px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[var(--text-muted)] block mb-1">
                  Pulse (bpm)
                </label>
                <input
                  type="number"
                  placeholder="76"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="w-full h-10 px-3 font-mono-tabular text-[14px] bg-[var(--surface)] border border-[var(--border)] rounded-[6px]"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[var(--text-muted)] block mb-1">
                  Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="37.0"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  className="w-full h-10 px-3 font-mono-tabular text-[14px] bg-[var(--surface)] border border-[var(--border)] rounded-[6px]"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[var(--text-muted)] block mb-1">
                  SpO2 (%)
                </label>
                <input
                  type="number"
                  placeholder="98"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="w-full h-10 px-3 font-mono-tabular text-[14px] bg-[var(--surface)] border border-[var(--border)] rounded-[6px]"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[var(--text-muted)] block mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="55.0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full h-10 px-3 font-mono-tabular text-[14px] bg-[var(--surface)] border border-[var(--border)] rounded-[6px]"
                />
              </div>
            </div>
          </Card>

          {/* 3. Clinical Diagnosis */}
          <Card padding="md">
            <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-3">
              Clinical Assessment & Diagnosis
            </h2>
            <div className="flex flex-col gap-3">
              <Input
                label="Diagnosis"
                placeholder="e.g. Acute Gastroenteritis, Malaria, Stage 1 HTN…"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
              <Input
                label="ICD-10 / Protocol Code (Optional)"
                placeholder="e.g. A09, B51, I10"
                mono
                value={icdCode}
                onChange={(e) => setIcdCode(e.target.value)}
              />
            </div>
          </Card>

          {/* 4. Prescriptions Table */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]">
                Prescriptions & Dispensary
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddPrescription()}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add drug
              </Button>
            </div>

            {/* Quick formulary chips */}
            <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-[var(--text-muted)]">Formulary quick-add:</span>
              <button
                type="button"
                onClick={() => handleAddPrescription('Paracetamol', '500 mg', 'Three times daily')}
                className="px-2 py-1 bg-[var(--surface-alt)] hover:bg-[var(--border)] text-[var(--text)] rounded border border-[var(--border)] cursor-pointer"
              >
                + Paracetamol
              </button>
              <button
                type="button"
                onClick={() => handleAddPrescription('Oral Rehydration Salts (ORS)', '1 sachet in 1L water', 'Frequent sips')}
                className="px-2 py-1 bg-[var(--surface-alt)] hover:bg-[var(--border)] text-[var(--text)] rounded border border-[var(--border)] cursor-pointer"
              >
                + ORS
              </button>
              <button
                type="button"
                onClick={() => handleAddPrescription('Amoxicillin', '500 mg', 'Three times daily')}
                className="px-2 py-1 bg-[var(--surface-alt)] hover:bg-[var(--border)] text-[var(--text)] rounded border border-[var(--border)] cursor-pointer"
              >
                + Amoxicillin
              </button>
              <button
                type="button"
                onClick={() => handleAddPrescription('Amlodipine', '5 mg', 'Once daily morning')}
                className="px-2 py-1 bg-[var(--surface-alt)] hover:bg-[var(--border)] text-[var(--text)] rounded border border-[var(--border)] cursor-pointer"
              >
                + Amlodipine
              </button>
            </div>

            {prescriptions.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-[var(--border)] rounded-[6px]">
                <p className="font-clinical-notes text-[14px] text-[var(--text-muted)] mb-1">
                  No medications prescribed yet.
                </p>
                <p className="text-[12px] text-[var(--text-faint)]">
                  Add a medication or pick from the clinic formulary above.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {prescriptions.map((rx, idx) => (
                  <div
                    key={rx.id}
                    className="p-3 bg-[var(--surface-alt)]/50 border border-[var(--border)] rounded-[6px] flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tabular text-[12px] font-semibold text-[var(--text-muted)]">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePrescription(rx.id)}
                        className="text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer p-1"
                        title="Remove drug"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Drug name (e.g. Paracetamol)"
                        value={rx.medication}
                        onChange={(e) => handleUpdatePrescription(rx.id, 'medication', e.target.value)}
                        className="h-9 px-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-[4px] text-[13px]"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 500 mg)"
                        value={rx.dosage}
                        onChange={(e) => handleUpdatePrescription(rx.id, 'dosage', e.target.value)}
                        className="h-9 px-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-[4px] text-[13px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Frequency (e.g. TDS)"
                        value={rx.frequency}
                        onChange={(e) => handleUpdatePrescription(rx.id, 'frequency', e.target.value)}
                        className="h-9 px-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-[4px] text-[13px]"
                      />
                      <input
                        type="number"
                        placeholder="Days (e.g. 5)"
                        value={rx.durationDays || ''}
                        onChange={(e) =>
                          handleUpdatePrescription(rx.id, 'durationDays', Number(e.target.value))
                        }
                        className="h-9 px-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-[4px] text-[13px] font-mono-tabular"
                      />
                      <input
                        type="text"
                        placeholder="Instructions (e.g. after food)"
                        value={rx.instructions || ''}
                        onChange={(e) =>
                          handleUpdatePrescription(rx.id, 'instructions', e.target.value)
                        }
                        className="h-9 px-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-[4px] text-[13px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Free-Text Clinical Notes + Dictate + Attach OCR (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4 sticky top-20">
          <Card padding="md" className="flex flex-col min-h-[580px]">
            {/* Header: Title + Dictate + Attach */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]">
                  Clinical Examination & Progress Notes
                </h2>
                <span className="text-[12px] text-[var(--text-faint)]">
                  Serif typography (Lora) for long-form reading
                </span>
              </div>

              {/* Action Buttons: Dictate & Attach */}
              <div className="flex items-center gap-2">
                {/* Dictate Button */}
                <Button
                  variant={isDictating ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={toggleDictation}
                  icon={
                    isDictating ? (
                      <Mic className="w-3.5 h-3.5 animate-pulse text-[#FDFBF7]" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )
                  }
                  title="Voice dictation (speech-to-text)"
                >
                  {isDictating ? 'Listening…' : 'Dictate'}
                </Button>

                {/* Attach File / Scan OCR */}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <span className="inline-flex items-center justify-center gap-1.5 h-8 px-3 text-[13px] font-medium rounded-[6px] bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-alt)] select-none">
                    <Paperclip className="w-3.5 h-3.5" />
                    Attach
                  </span>
                </label>

                {/* Sample slip quick button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAttachPaperNote}
                  title="View sample paper register slip OCR"
                >
                  OCR Demo
                </Button>
              </div>
            </div>

            {/* Dictating active banner */}
            {isDictating && (
              <div className="mt-2 p-2 bg-[var(--accent-soft)] text-[var(--accent)] text-[12px] font-medium rounded-[4px] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
                Listening to speech… Transcribing into clinical notes.
              </div>
            )}

            {/* Clinical Notes Editor (in serif font Lora, calm paper feel) */}
            <div className="flex-1 mt-3 flex flex-col">
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Write clinical findings, physical examination, systemic exam (CVS, RS, P/A), laboratory observations, and patient instructions here…"
                className="flex-1 w-full min-h-[460px] p-4 font-clinical-notes text-[15px] leading-relaxed bg-[var(--bg)] border border-[var(--border)] rounded-[6px] focus:border-[var(--accent)] text-[var(--text)] resize-y"
              />
            </div>

            {/* Note footer */}
            <div className="pt-3 mt-auto border-t border-[var(--border)] flex items-center justify-between text-[12px] text-[var(--text-muted)] font-mono-tabular">
              <span>{clinicalNotes.split(/\s+/).filter(Boolean).length} words</span>
              <span>Autosaving every 3s · Local storage protected</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Attachment & OCR Viewer Modal */}
      <AttachmentViewerModal
        isOpen={ocrModalOpen}
        onClose={() => setOcrModalOpen(false)}
        imageUrl={ocrImageUrl}
        imageTitle={ocrImageTitle}
        initialOcrText={ocrText}
        onConfirmText={(confirmedText) => {
          setClinicalNotes((prev) =>
            prev
              ? `${prev}\n\n[OCR Paper Register Note]:\n${confirmedText}`
              : `[OCR Paper Register Note]:\n${confirmedText}`
          );
          onShowToast('OCR extracted text inserted into clinical notes.', 'success');
        }}
      />
    </div>
  );
};
