import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface FieldProps {
  id?: string;
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({
  id,
  label,
  required = false,
  helperText,
  error,
  className = '',
  children,
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Label above the field, always. Never floating labels. */}
      <label
        htmlFor={id}
        className="flex items-center gap-1 font-sans text-xs font-medium text-text select-none"
      >
        <span>{label}</span>
        {/* Required fields show a small terra dot next to the label (not an asterisk) */}
        {required && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-terra inline-block shrink-0"
            title="Required field"
            aria-label="Required"
          />
        )}
      </label>

      {/* Field Control */}
      {children}

      {/* Error or Helper text below the field */}
      {error ? (
        <div
          id={id ? `${id}-error` : undefined}
          role="alert"
          className="flex items-center gap-1 text-xs text-danger font-sans mt-0.5"
        >
          <AlertCircle className="w-3 h-3 text-danger shrink-0" strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <div
          id={id ? `${id}-helper` : undefined}
          className="text-xs text-text-muted font-sans mt-0.5"
        >
          {helperText}
        </div>
      ) : null}
    </div>
  );
};
