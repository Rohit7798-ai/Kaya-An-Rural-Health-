import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      startAdornment,
      endAdornment,
      mono = false,
      id,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full flex flex-col text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-text-muted mb-1.5 select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {startAdornment && (
            <div className="absolute left-3 flex items-center pointer-events-none text-text-muted">
              {startAdornment}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={`w-full h-10 px-3 bg-surface text-text text-sm rounded-sm border transition-colors ${
              error ? 'border-danger' : 'border-border hover:border-border-strong'
            } ${mono ? 'font-mono' : 'font-sans'} ${startAdornment ? 'pl-9' : ''} ${
              endAdornment ? 'pr-9' : ''
            } focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:bg-surface-alt disabled:text-text-muted disabled:cursor-not-allowed ${className}`}
            {...props}
          />

          {endAdornment && (
            <div className="absolute right-3 flex items-center text-text-muted">
              {endAdornment}
            </div>
          )}
        </div>

        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-danger mt-1 font-sans">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-xs text-text-muted mt-1 font-sans">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
