import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  children,
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalOpen;

  const handleToggle = () => {
    if (isControlled && controlledOnToggle) {
      controlledOnToggle();
    } else {
      setInternalOpen((prev) => !prev);
    }
  };

  return (
    <div className="flex flex-col">
      {/* 1px divider */}
      <div className="h-px bg-border w-full mb-4" />

      {/* Toggle Row */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="flex items-center justify-between py-1 text-left group cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-sm"
      >
        <span className="font-sans text-xs uppercase tracking-[0.04em] text-text-muted font-medium group-hover:text-text transition-colors">
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-text-muted group-hover:text-text transition-transform duration-150 ${
            open ? 'rotate-180' : 'rotate-0'
          }`}
          strokeWidth={1.5}
        />
      </button>

      {/* Collapsible Content */}
      {open && (
        <div className="flex flex-col gap-4 pt-4 pb-1">
          {children}
        </div>
      )}
    </div>
  );
};
