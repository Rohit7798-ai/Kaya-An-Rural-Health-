import React, { useState } from 'react';
import { ClinicConfig, StaffUser, Patient, Visit } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Download, Moon, Sun, Shield, RotateCcw, Check, Users } from 'lucide-react';

interface SettingsScreenProps {
  clinicConfig: ClinicConfig;
  onUpdateClinicConfig: (config: ClinicConfig) => void;
  staffList: StaffUser[];
  currentUser: StaffUser;
  onSwitchUser: (user: StaffUser) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  patients: Patient[];
  visits: Visit[];
  onResetData: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  clinicConfig,
  onUpdateClinicConfig,
  staffList,
  currentUser,
  onSwitchUser,
  darkMode,
  onToggleDarkMode,
  patients,
  visits,
  onResetData,
  onShowToast,
}) => {
  const [name, setName] = useState(clinicConfig.name);
  const [facilityCode, setFacilityCode] = useState(clinicConfig.facilityCode);
  const [district, setDistrict] = useState(clinicConfig.district);
  const [subCentre, setSubCentre] = useState(clinicConfig.subCentre);
  const [inCharge, setInCharge] = useState(clinicConfig.inChargeDoctor);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleSaveClinicInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateClinicConfig({
      ...clinicConfig,
      name,
      facilityCode,
      district,
      subCentre,
      inChargeDoctor: inCharge,
    });
    onShowToast('Clinic information updated.', 'success');
  };

  // Export Patients as CSV
  const handleExportPatientsCSV = () => {
    const headers = ['Clinic_ID', 'Full_Name', 'Age', 'Gender', 'Village', 'Phone', 'Allergies', 'Registered_Date', 'Total_Visits'];
    const rows = patients.map((p) => [
      `"${p.clinicId}"`,
      `"${p.fullName.replace(/"/g, '""')}"`,
      p.age,
      `"${p.gender}"`,
      `"${p.village.replace(/"/g, '""')}"`,
      `"${p.phone}"`,
      `"${(p.allergies || '').replace(/"/g, '""')}"`,
      `"${p.registeredDate}"`,
      p.totalVisits,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kaya_patient_register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('Patient register CSV downloaded.', 'success');
  };

  // Export Visits as CSV
  const handleExportVisitsCSV = () => {
    const headers = ['Visit_ID', 'Date', 'Time', 'Patient_ID', 'Patient_Name', 'Chief_Complaint', 'Diagnosis', 'Clinician', 'Status'];
    const rows = visits.map((v) => [
      `"${v.id}"`,
      `"${v.date}"`,
      `"${v.time}"`,
      `"${v.patientClinicId}"`,
      `"${v.patientName.replace(/"/g, '""')}"`,
      `"${v.chiefComplaint.replace(/"/g, '""')}"`,
      `"${(v.diagnosis || '').replace(/"/g, '""')}"`,
      `"${v.clinicianName.replace(/"/g, '""')}"`,
      `"${v.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kaya_consultation_register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('Consultation register CSV downloaded.', 'success');
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto text-left pb-16">
      {/* Header */}
      <div className="mb-6 border-b border-[var(--border)] pb-4">
        <h1 className="text-[22px] font-semibold text-[var(--text)] tracking-tight">
          Clinic Settings & Administration
        </h1>
        <p className="text-[14px] text-[var(--text-muted)] mt-0.5">
          Facility credentials, staff accounts, local backups, and appearance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Clinic Info & Staff Users (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Clinic Information Card */}
          <Card padding="md">
            <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-4">
              Facility Information
            </h2>
            <form onSubmit={handleSaveClinicInfo} className="flex flex-col gap-4">
              <Input
                label="Health Facility Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Facility Registry Code"
                  mono
                  value={facilityCode}
                  onChange={(e) => setFacilityCode(e.target.value)}
                />
                <Input
                  label="Health District / Block"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Sub-Centre / Sector"
                  value={subCentre}
                  onChange={(e) => setSubCentre(e.target.value)}
                />
                <Input
                  label="Medical Officer In-Charge"
                  value={inCharge}
                  onChange={(e) => setInCharge(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="md" icon={<Check className="w-4 h-4" />}>
                  Save facility details
                </Button>
              </div>
            </form>
          </Card>

          {/* Clinical Staff Accounts */}
          <Card padding="md">
            <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-3">
              Staff User Accounts
            </h2>
            <div className="divide-y divide-[var(--border)]">
              {staffList.map((staff) => (
                <div key={staff.id} className="py-3 flex items-center justify-between gap-3 text-[14px]">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--text)]">{staff.name}</p>
                      {currentUser.id === staff.id && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] font-medium">
                          Active user
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[var(--text-muted)]">
                      {staff.role} · PIN: <span className="font-mono-tabular">{staff.pin}</span>
                    </p>
                  </div>

                  {currentUser.id !== staff.id && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        onSwitchUser(staff);
                        onShowToast(`Switched active user to ${staff.name}`, 'success');
                      }}
                    >
                      Switch to user
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Theme, Data Export & Privacy (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Appearance / Theme (Default Light, Optional Dark) */}
          <Card padding="md">
            <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-3">
              Interface Appearance
            </h2>
            <div className="flex items-center justify-between p-3 bg-[var(--surface-alt)] rounded-[6px] text-[14px]">
              <div>
                <p className="font-medium text-[var(--text)]">Theme Mode</p>
                <p className="text-[12px] text-[var(--text-muted)]">
                  {darkMode ? 'Dark mode (night shifts)' : 'Light paper mode (daylight default)'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={onToggleDarkMode}
                icon={darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              >
                {darkMode ? 'Set to light' : 'Set to dark'}
              </Button>
            </div>
          </Card>

          {/* Government / Health Department Data Export (CSV) */}
          <Card padding="md">
            <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-3">
              Data Export & Offline Backup
            </h2>
            <p className="text-[13px] text-[var(--text-muted)] mb-4">
              Download comma-separated register files for statutory reporting or backup.
            </p>

            <div className="flex flex-col gap-2.5">
              <Button
                variant="secondary"
                size="md"
                onClick={handleExportPatientsCSV}
                icon={<Download className="w-4 h-4" />}
                className="justify-start px-4 w-full"
              >
                Export Patient Register (CSV)
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={handleExportVisitsCSV}
                icon={<Download className="w-4 h-4" />}
                className="justify-start px-4 w-full"
              >
                Export Consultation Log (CSV)
              </Button>
            </div>
          </Card>

          {/* Data Privacy & Storage */}
          <Card padding="md">
            <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[var(--accent)]" />
              Patient Privacy & Local Security
            </h2>
            <div className="text-[13px] text-[var(--text-muted)] leading-relaxed flex flex-col gap-2">
              <p>
                All medical histories and visit notes are held strictly inside this workstation's browser sandbox storage.
              </p>
              <p>
                No telemetry, advertising tracking, or unauthorized external cloud transfers are executed.
              </p>
            </div>
          </Card>

          {/* Reset Demo Data */}
          <Card padding="md">
            <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--danger)] mb-2">
              Reset Clinic Register
            </h2>
            <p className="text-[13px] text-[var(--text-muted)] mb-3">
              Reset all patient records and consultation history back to clean default demonstration data.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmResetOpen(true)}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset to initial clinic records
            </Button>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      {confirmResetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-6 modal-hairline-shadow text-left">
            <h2 className="text-[18px] font-semibold text-[var(--danger)] mb-2">
              Reset Clinic Register?
            </h2>
            <p className="text-[14px] text-[var(--text-muted)] mb-5 leading-relaxed">
              This will discard all recently registered patients and new visit notes and restore the original 7 demonstration patients. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setConfirmResetOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="md"
                onClick={() => {
                  onResetData();
                  setConfirmResetOpen(false);
                  onShowToast('Clinic register reset to original demo records.', 'success');
                }}
              >
                Yes, reset records
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
