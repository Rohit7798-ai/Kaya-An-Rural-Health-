import React, { useState, useEffect, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

export interface PaneDividerProps {
  splitPercent: number;
  onSplitChange: (newPercent: number) => void;
  minPercent?: number;
  maxPercent?: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const PaneDivider: React.FC<PaneDividerProps> = ({
  splitPercent,
  onSplitChange,
  minPercent = 40,
  maxPercent = 70,
  containerRef,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const totalWidth = rect.width;
      if (totalWidth <= 0) return;

      let newPercent = (currentX / totalWidth) * 100;
      newPercent = Math.max(minPercent, Math.min(maxPercent, newPercent));
      onSplitChange(Math.round(newPercent * 10) / 10);
    },
    [isDragging, containerRef, minPercent, maxPercent, onSplitChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSplitChange(Math.max(minPercent, splitPercent - 2));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSplitChange(Math.min(maxPercent, splitPercent + 2));
    }
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-valuenow={Math.round(splitPercent)}
      aria-valuemin={minPercent}
      aria-valuemax={maxPercent}
      aria-label="Resize panels"
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      className={`relative w-px bg-border hover:bg-accent focus-visible:bg-accent shrink-0 cursor-col-resize transition-colors select-none flex items-center justify-center ${
        isDragging ? 'bg-accent' : ''
      }`}
    >
      {/* 20px hit area around the 1px divider */}
      <div className="absolute inset-y-0 -left-2 -right-2 z-10" />

      {/* Floating Grip pill */}
      <div className="absolute top-1/2 -translate-y-1/2 z-20 w-4 h-9 bg-surface border border-border rounded-sm flex items-center justify-center text-text-muted hover:text-text hover:border-accent transition-colors shadow-none pointer-events-none">
        <GripVertical className="w-3 h-3" strokeWidth={1.5} />
      </div>
    </div>
  );
};
