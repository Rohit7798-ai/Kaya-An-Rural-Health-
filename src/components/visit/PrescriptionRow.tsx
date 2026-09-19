import React from 'react';
import { X } from 'lucide-react';
import { PrescriptionRowItem } from '../../features/visits/useVisitForm';

export const COMMON_MEDICINES = [
  'Amlodipine 5mg',
  'Metformin 500mg',
  'Paracetamol 500mg',
  'Amoxicillin 500mg',
  'Cetirizine 10mg',
  'Pantoprazole 40mg',
  'Ibuprofen 400mg',
  'Telmisartan 40mg',
  'Atorvastatin 10mg',
  'Azithromycin 500mg',
  'Salbutamol inhaler 100mcg',
  'ORS Oral Rehydration Salts',
  'Iron & Folic Acid tablet',
];

export interface PrescriptionRowProps {
  item: PrescriptionRowItem;
  canRemove: boolean;
  onUpdate: (id: string, updates: Partial<PrescriptionRowItem>) => void;
  onRemove: (id: string) => void;
}

export const PrescriptionRow: React.FC<PrescriptionRowProps> = ({
  item,
  canRemove,
  onUpdate,
  onRemove,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end py-1">
      {/* Medicine column (5 cols) */}
      <div className="sm:col-span-4 flex flex-col gap-1">
        <label
          htmlFor={`rx-med-${item.id}`}
          className="font-sans text-xs font-medium text-text select-none"
        >
          Medicine
        </label>
        <input
          id={`rx-med-${item.id}`}
          type="text"
          list="clinic-common-meds"
          value={item.medicine}
          onChange={(e) => onUpdate(item.id, { medicine: e.target.value })}
          placeholder="e.g. Amlodipine 5mg"
          className="w-full h-9 px-3 bg-surface text-text text-sm rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors"
        />
      </div>

      {/* Dose column (2 cols) */}
      <div className="sm:col-span-2 flex flex-col gap-1">
        <label
          htmlFor={`rx-dose-${item.id}`}
          className="font-sans text-xs font-medium text-text select-none"
        >
          Dose
        </label>
        <input
          id={`rx-dose-${item.id}`}
          type="text"
          value={item.dose}
          onChange={(e) => onUpdate(item.id, { dose: e.target.value })}
          placeholder="e.g. 500mg"
          className="w-full h-9 px-2.5 bg-surface text-text font-mono text-sm tabular-nums rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors"
        />
      </div>

      {/* Frequency column (2 cols) */}
      <div className="sm:col-span-2 flex flex-col gap-1">
        <label
          htmlFor={`rx-freq-${item.id}`}
          className="font-sans text-xs font-medium text-text select-none"
        >
          Frequency
        </label>
        <select
          id={`rx-freq-${item.id}`}
          value={item.frequency}
          onChange={(e) =>
            onUpdate(item.id, {
              frequency: e.target.value as PrescriptionRowItem['frequency'],
            })
          }
          className="w-full h-9 px-2 bg-surface text-text font-mono text-xs tabular-nums rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors"
        >
          <option value="OD">OD (1x daily)</option>
          <option value="BD">BD (2x daily)</option>
          <option value="TDS">TDS (3x daily)</option>
          <option value="QID">QID (4x daily)</option>
          <option value="PRN">PRN (As needed)</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Duration column (3 cols) */}
      <div className="sm:col-span-3 flex flex-col gap-1">
        <label
          htmlFor={`rx-dur-${item.id}`}
          className="font-sans text-xs font-medium text-text select-none"
        >
          Duration
        </label>
        <div className="flex items-center gap-1">
          <input
            id={`rx-dur-${item.id}`}
            type="number"
            min={1}
            max={365}
            value={item.durationValue}
            onChange={(e) => onUpdate(item.id, { durationValue: e.target.value })}
            className="w-16 h-9 px-2 bg-surface text-text font-mono text-sm tabular-nums rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors"
          />
          {/* Segmented days / weeks */}
          <div className="grid grid-cols-2 p-0.5 bg-surface-alt border border-border rounded-sm">
            <button
              type="button"
              onClick={() => onUpdate(item.id, { durationUnit: 'days' })}
              className={`px-2 py-1 text-[11px] font-sans rounded-sm transition-colors cursor-pointer ${
                item.durationUnit === 'days'
                  ? 'bg-surface text-text font-medium border border-border/80 shadow-none'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              days
            </button>
            <button
              type="button"
              onClick={() => onUpdate(item.id, { durationUnit: 'weeks' })}
              className={`px-2 py-1 text-[11px] font-sans rounded-sm transition-colors cursor-pointer ${
                item.durationUnit === 'weeks'
                  ? 'bg-surface text-text font-medium border border-border/80 shadow-none'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              wks
            </button>
          </div>
        </div>
      </div>

      {/* Trailing: ghost X to remove (1 col) */}
      <div className="sm:col-span-1 flex items-center justify-end pb-1">
        <button
          type="button"
          disabled={!canRemove}
          onClick={() => onRemove(item.id)}
          title={canRemove ? 'Remove prescription' : 'Cannot remove sole prescription'}
          aria-label="Remove prescription"
          className={`h-9 w-9 flex items-center justify-center rounded-sm transition-colors duration-120 ${
            canRemove
              ? 'text-text-muted hover:text-danger hover:bg-danger-soft/40 cursor-pointer'
              : 'text-text-faint opacity-40 cursor-not-allowed'
          }`}
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};
