import React, { useRef } from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  id?: string;
  name: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  hasError?: boolean;
}

export function SegmentedControl<T extends string = string>({
  id,
  name,
  options,
  value,
  onChange,
  hasError = false,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = options.findIndex((opt) => opt.value === value);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % options.length;
      onChange(options[nextIndex].value);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      onChange(options[prevIndex].value);
    }
  };

  return (
    <div
      id={id}
      ref={containerRef}
      role="radiogroup"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={name}
      className={`grid grid-cols-3 gap-1 p-1 bg-surface-alt border rounded-sm transition-colors duration-120 select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
        hasError ? 'border-danger' : 'border-border'
      }`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={-1}
            onClick={() => onChange(opt.value)}
            className={`h-8 px-2 flex items-center justify-center text-xs font-sans rounded-sm transition-colors duration-120 cursor-pointer ${
              isSelected
                ? 'bg-surface text-text font-medium border border-border/80 shadow-none'
                : 'text-text-muted hover:text-text hover:bg-surface/50 border border-transparent'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
