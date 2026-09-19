import React, { useState } from 'react';
import { SectionCard } from './SectionCard';
import { ClinicInfo, UserRole } from '../../features/settings/useSettings';

export interface ClinicSectionProps {
  info: ClinicInfo;
  onSave: (newInfo: ClinicInfo) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  userRole: UserRole;
  isOffline?: boolean;
}

export const ClinicSection: React.FC<ClinicSectionProps> = ({
  info,
  onSave,
  userRole,
  isOffline,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<ClinicInfo>(info);
  const [errors, setErrors] = useState<{ clinicName?: string; facilityCode?: string }>({});

  const isAdmin = userRole === 'Admin';

  const handleStartEdit = () => {
    setFormData(info);
    setErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(info);
    setErrors({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    const newErrors: { clinicName?: string; facilityCode?: string } = {};
    if (!formData.clinicName.trim()) {
      newErrors.clinicName = 'Clinic name is required';
    }
    if (!formData.facilityCode.trim()) {
      newErrors.facilityCode = 'Facility code is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const res = await onSave(formData);
    if (res.success) {
      setIsEditing(false);
      setErrors({});
    }
  };

  const headerAction = isAdmin ? (
    isEditing ? (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="h-8 px-3 text-xs font-sans text-text-muted hover:text-text bg-surface-alt hover:bg-border/60 border border-border rounded-sm cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="h-8 px-3 text-xs font-sans font-medium text-surface bg-accent hover:bg-accent-hover rounded-sm cursor-pointer transition-colors"
        >
          Save
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={handleStartEdit}
        className="h-8 px-3 text-xs font-sans text-text-muted hover:text-text hover:bg-surface-alt rounded-sm border border-transparent hover:border-border transition-colors cursor-pointer"
      >
        Edit
      </button>
    )
  ) : null;

  return (
    <SectionCard id="section-clinic" title="Clinic" headerAction={headerAction}>
      {isEditing ? (
        <div className="divide-y divide-border">
          {/* Clinic Name */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 setting-row">
            <label htmlFor="clinic-name-input" className="text-sm text-text-muted font-sans">
              Clinic name
            </label>
            <div className="flex flex-col items-end">
              <input
                id="clinic-name-input"
                type="text"
                value={formData.clinicName}
                onChange={(e) => {
                  setFormData({ ...formData, clinicName: e.target.value });
                  if (errors.clinicName) setErrors({ ...errors, clinicName: undefined });
                }}
                className={`h-8 px-2.5 bg-surface-alt border text-text font-sans text-sm rounded-sm w-full sm:w-72 text-left sm:text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                  errors.clinicName ? 'border-danger' : 'border-border'
                }`}
              />
              {errors.clinicName && (
                <span className="text-xs text-danger mt-1 font-sans">{errors.clinicName}</span>
              )}
            </div>
          </div>

          {/* Facility Code */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2 setting-row">
            <div className="pt-1.5">
              <label htmlFor="facility-code-input" className="text-sm text-text-muted font-sans block">
                Facility code
              </label>
            </div>
            <div className="flex flex-col items-start sm:items-end w-full sm:w-72">
              <input
                id="facility-code-input"
                type="text"
                value={formData.facilityCode}
                onChange={(e) => {
                  setFormData({ ...formData, facilityCode: e.target.value });
                  if (errors.facilityCode) setErrors({ ...errors, facilityCode: undefined });
                }}
                className={`h-8 px-2.5 bg-surface-alt border text-text font-mono text-sm rounded-sm w-full text-left sm:text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                  errors.facilityCode ? 'border-danger' : 'border-border'
                }`}
              />
              <span className="text-xs text-text-muted mt-1 text-left sm:text-right font-sans">
                Used for district reporting. Change only if instructed.
              </span>
              {errors.facilityCode && (
                <span className="text-xs text-danger mt-1 font-sans">{errors.facilityCode}</span>
              )}
            </div>
          </div>

          {/* District */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 setting-row">
            <label htmlFor="district-input" className="text-sm text-text-muted font-sans">
              District
            </label>
            <input
              id="district-input"
              type="text"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="h-8 px-2.5 bg-surface-alt border border-border text-text font-sans text-sm rounded-sm w-full sm:w-72 text-left sm:text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>

          {/* State */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 setting-row">
            <label htmlFor="state-input" className="text-sm text-text-muted font-sans">
              State
            </label>
            <input
              id="state-input"
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="h-8 px-2.5 bg-surface-alt border border-border text-text font-sans text-sm rounded-sm w-full sm:w-72 text-left sm:text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>

          {/* Time zone */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 setting-row">
            <label htmlFor="timezone-input" className="text-sm text-text-muted font-sans">
              Time zone
            </label>
            <input
              id="timezone-input"
              type="text"
              value={formData.timeZone}
              onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
              className="h-8 px-2.5 bg-surface-alt border border-border text-text font-sans text-sm rounded-sm w-full sm:w-72 text-left sm:text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>

          {/* Default language */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 setting-row">
            <label htmlFor="lang-input" className="text-sm text-text-muted font-sans">
              Default language
            </label>
            <input
              id="lang-input"
              type="text"
              value={formData.defaultLanguage}
              onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
              className="h-8 px-2.5 bg-surface-alt border border-border text-text font-sans text-sm rounded-sm w-full sm:w-72 text-left sm:text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>
        </div>
      ) : (
        <dl className="divide-y divide-border m-0">
          <div className="py-3.5 flex items-center justify-between gap-4 setting-row">
            <dt className="text-sm text-text-muted font-sans">Clinic name</dt>
            <dd className="text-sm font-medium text-text font-sans m-0">{info.clinicName}</dd>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4 setting-row">
            <dt className="text-sm text-text-muted font-sans">Facility code</dt>
            <dd className="text-sm font-mono text-text m-0">{info.facilityCode}</dd>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4 setting-row">
            <dt className="text-sm text-text-muted font-sans">District</dt>
            <dd className="text-sm font-medium text-text font-sans m-0">{info.district}</dd>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4 setting-row">
            <dt className="text-sm text-text-muted font-sans">State</dt>
            <dd className="text-sm font-medium text-text font-sans m-0">{info.state}</dd>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4 setting-row">
            <dt className="text-sm text-text-muted font-sans">Time zone</dt>
            <dd className="text-sm text-text font-sans m-0">
              Asia/Kolkata <span className="font-mono text-xs text-text-muted">(GMT+5:30)</span>
            </dd>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4 setting-row">
            <dt className="text-sm text-text-muted font-sans">Default language</dt>
            <dd className="text-sm font-medium text-text font-sans m-0">{info.defaultLanguage}</dd>
          </div>
        </dl>
      )}
    </SectionCard>
  );
};
