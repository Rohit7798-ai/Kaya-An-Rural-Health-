import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, mono, id, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1 w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-[var(--text)] select-none"
          >
            {label}
            {props.required && <span className="text-[var(--danger)] ml-0.5">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`h-10 px-3 bg-[var(--surface)] text-[var(--text)] border rounded-[6px] transition-colors duration-120 text-[15px] placeholder:text-[var(--text-faint)] ${
            mono ? 'font-mono-tabular' : ''
          } ${
            error
              ? 'border-[var(--danger)] focus:border-[var(--danger)]'
              : 'border-[var(--border)] hover:border-[var(--border-strong)]'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-[12px] text-[var(--danger)] leading-none mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-[12px] text-[var(--text-muted)] leading-none mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  helperText,
  error,
  options,
  id,
  className = '',
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 w-full text-left">
      {label && (
        <label
          htmlFor={selectId}
          className="text-[13px] font-medium text-[var(--text)] select-none"
        >
          {label}
          {props.required && <span className="text-[var(--danger)] ml-0.5">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`h-10 px-3 bg-[var(--surface)] text-[var(--text)] border rounded-[6px] transition-colors duration-120 text-[15px] ${
          error
            ? 'border-[var(--danger)]'
            : 'border-[var(--border)] hover:border-[var(--border-strong)]'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-[12px] text-[var(--danger)] leading-none mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-[12px] text-[var(--text-muted)] leading-none mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};
