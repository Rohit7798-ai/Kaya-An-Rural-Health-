import React, { useState } from 'react';
import { Patient } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input, Select } from '../common/Input';
import { ChevronLeft, Check, FilePlus } from 'lucide-react';

interface NewPatientScreenProps {
  onCancel: () => void;
  onSavePatient: (patient: Patient, andCreateVisit: boolean) => void;
  existingPatientCount: number;
}

export const NewPatientScreen: React.FC<NewPatientScreenProps> = ({
  onCancel,
  onSavePatient,
  existingPatientCount,
}) => {
  // Auto-generate next clinic ID
  const nextIdNum = 104 + existingPatientCount;
  const autoClinicId = `KAY-26-0${nextIdNum}`;

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [nationalId, setNationalId] = useState('');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required.';
    if (!age || isNaN(Number(age)) || Number(age) < 0 || Number(age) > 120) {
      errs.age = 'Enter a valid age between 0 and 120.';
    }
    if (!village.trim()) errs.village = 'Village / Settlement is required for clinic register.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (andCreateVisit: boolean) => {
    if (!validate()) return;

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      clinicId: autoClinicId,
      fullName: fullName.trim(),
      age: Number(age),
      gender,
      nationalId: nationalId.trim() || undefined,
      village: village.trim(),
      phone: phone.trim() || '',
      emergencyContactName: emergencyContactName.trim() || undefined,
      emergencyContactPhone: emergencyContactPhone.trim() || undefined,
      bloodGroup: bloodGroup || undefined,
      allergies: allergies.trim() || undefined,
      chronicConditions: chronicConditions.trim() || undefined,
      registeredDate: new Date().toISOString().split('T')[0],
      totalVisits: 0,
      synced: false,
    };

    onSavePatient(newPatient, andCreateVisit);
  };

  return (
    <div className="w-full max-w-[640px] mx-auto text-left pb-12">
      {/* Top back navigation & title */}
      <div className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={onCancel}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Cancel
          </Button>
          <div>
            <h1 className="text-[20px] font-semibold text-[var(--text)] tracking-tight">
              New Patient
            </h1>
            <p className="text-[13px] text-[var(--text-muted)]">
              Assigned register ID: <span className="font-mono-tabular font-medium text-[var(--text)]">{autoClinicId}</span>
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave(false);
        }}
        className="flex flex-col gap-6"
      >
        {/* Section 1: Identity */}
        <Card padding="md">
          <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-4">
            1. Patient Identity
          </h2>
          <div className="flex flex-col gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. Kamala Murmu"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
              }}
              error={errors.fullName}
              required
              autoFocus
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Age (years)"
                type="number"
                placeholder="e.g. 35"
                min="0"
                max="120"
                mono
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (errors.age) setErrors((prev) => ({ ...prev, age: '' }));
                }}
                error={errors.age}
                required
              />

              <Select
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                options={[
                  { value: 'Female', label: 'Female' },
                  { value: 'Male', label: 'Male' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>

            <Input
              label="National Health / ID Number (Optional)"
              placeholder="e.g. 9842-1049-5512"
              mono
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              helperText="Government identity or rural health card number"
            />
          </div>
        </Card>

        {/* Section 2: Contact & Village */}
        <Card padding="md">
          <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-4">
            2. Contact & Settlement
          </h2>
          <div className="flex flex-col gap-4">
            <Input
              label="Village / Settlement"
              placeholder="e.g. Rampur, Sector 4"
              value={village}
              onChange={(e) => {
                setVillage(e.target.value);
                if (errors.village) setErrors((prev) => ({ ...prev, village: '' }));
              }}
              error={errors.village}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="e.g. 98721 44320"
              mono
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              helperText="If patient has no phone, enter household or community worker contact"
            />

            <div className="grid grid-cols-2 gap-4 pt-1">
              <Input
                label="Emergency Contact Name"
                placeholder="e.g. Ramesh (Brother)"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
              />
              <Input
                label="Emergency Phone"
                placeholder="e.g. 98721 00000"
                mono
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Medical Notes & Background */}
        <Card padding="md">
          <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-4">
            3. Medical Background
          </h2>
          <div className="flex flex-col gap-4">
            <Select
              label="Blood Group"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              options={[
                { value: '', label: 'Select blood group if known…' },
                { value: 'A+', label: 'A Positive (A+)' },
                { value: 'A-', label: 'A Negative (A-)' },
                { value: 'B+', label: 'B Positive (B+)' },
                { value: 'B-', label: 'B Negative (B-)' },
                { value: 'O+', label: 'O Positive (O+)' },
                { value: 'O-', label: 'O Negative (O-)' },
                { value: 'AB+', label: 'AB Positive (AB+)' },
                { value: 'AB-', label: 'AB Negative (AB-)' },
              ]}
            />

            <Input
              label="Known Drug Allergies"
              placeholder="e.g. Penicillin, Sulfa, Aspirin"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              helperText="Leave empty if none reported"
            />

            <Input
              label="Chronic Conditions / Surgical History"
              placeholder="e.g. Hypertension, Diabetes, Asthma"
              value={chronicConditions}
              onChange={(e) => setChronicConditions(e.target.value)}
            />
          </div>
        </Card>

        {/* Action Buttons: Save + Save & new visit */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" size="lg" onClick={onCancel}>
            Cancel
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => handleSave(true)}
            icon={<FilePlus className="w-4 h-4" />}
          >
            Save & new visit
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={<Check className="w-4 h-4" />}
          >
            Save patient <span className="font-mono-tabular text-[12px] opacity-75 ml-1">⌘S</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
