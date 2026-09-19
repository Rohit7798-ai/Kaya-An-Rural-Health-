import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Plus, MoreHorizontal, Printer, Download, Trash2, Edit3, ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { Patient } from '../types';

export interface PatientHeaderProps {
  patient: Patient;
  onNewVisit: () => void;
  onEditPatient: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  onNewVisit,
  onEditPatient,
}) => {
  const navigate = useNavigate();

  const genderLetter =
    patient.gender === 'Female' ? 'F' : patient.gender === 'Male' ? 'M' : 'O';

  return (
    <div className="flex flex-col gap-3 pb-6 border-b border-border w-full">
      {/* Back link (ghost, small) */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-1.5 font-sans text-xs text-text-muted hover:text-text cursor-pointer py-1 transition-colors duration-120 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-sm -ml-1 px-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Patients</span>
        </button>
      </div>

      {/* Main Header Row: Name & Identity strip on left, Actions on right */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
        <div>
          {/* 
            CRITICAL RULE 4:
            Patient full name is strictly in serif (Lora, text-3xl, 400).
          */}
          <h1 className="font-serif text-3xl font-normal text-text tracking-tight leading-tight">
            {patient.fullName}
          </h1>

          {/* Identity strip on ONE line */}
          <div className="flex items-center gap-1.5 font-sans text-xs text-text-muted mt-1.5 whitespace-nowrap overflow-x-auto">
            {/* Mono ID */}
            <span className="font-mono tabular-nums text-text font-medium">
              {patient.clinicId}
            </span>
            <span className="text-text-faint">·</span>

            {/* Age + Gender e.g. "42F" with age in mono */}
            <span>
              <span className="font-mono tabular-nums">{patient.age}</span>
              <span>{genderLetter}</span>
            </span>
            <span className="text-text-faint">·</span>

            {/* Village */}
            <span>{patient.village}</span>
            <span className="text-text-faint">·</span>

            {/* Mono phone */}
            <span className="font-mono tabular-nums">{patient.phone}</span>
          </div>
        </div>

        {/* Right side: "New visit" + "⋯" overflow menu */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-1.5">
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
              onClick={onNewVisit}
            >
              New visit
            </Button>
            <kbd className="hidden sm:inline-flex items-center font-mono text-xs text-text-muted px-1.5 py-1 rounded-sm bg-surface border border-border select-none">
              ⌘V
            </kbd>
          </div>

          {/* Radix Overflow Menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label="More patient actions"
                className="w-9 h-9 flex items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-alt active:bg-border/30 border border-border transition-colors duration-120 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="min-w-[190px] bg-surface border border-border rounded-md shadow-none p-1 z-50 text-left font-sans text-sm"
              >
                <DropdownMenu.Item
                  onClick={onEditPatient}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-text hover:bg-surface-alt cursor-pointer outline-none focus:bg-surface-alt transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
                  <span>Edit patient</span>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-text hover:bg-surface-alt cursor-pointer outline-none focus:bg-surface-alt transition-colors"
                >
                  <Printer className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
                  <span>Print record</span>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onClick={() => {
                    // Export stub
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-text hover:bg-surface-alt cursor-pointer outline-none focus:bg-surface-alt transition-colors"
                >
                  <Download className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
                  <span>Export as PDF</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-px bg-border my-1" />

                <DropdownMenu.Item
                  onClick={() => {
                    // Archive stub
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-danger hover:bg-danger-soft/50 cursor-pointer outline-none focus:bg-danger-soft/50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-danger" strokeWidth={1.5} />
                  <span>Archive patient</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </div>
  );
};
