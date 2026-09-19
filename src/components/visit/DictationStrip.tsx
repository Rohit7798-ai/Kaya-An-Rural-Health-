import React, { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';

export interface DictationStripProps {
  transcript: string;
  onCancel: () => void;
  onInsert: () => void;
}

export const DictationStrip: React.FC<DictationStripProps> = ({
  transcript,
  onCancel,
  onInsert,
}) => {
  // Waveform animation simulation: 12 thin olive bars, 1px width, dynamic heights
  const [heights, setHeights] = useState<number[]>([
    4, 8, 12, 16, 10, 6, 14, 18, 8, 12, 6, 4,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeights(
        Array.from({ length: 12 }, () => Math.floor(4 + Math.random() * 16))
      );
    }, 120);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="region"
      aria-label="Live voice dictation"
      className="flex flex-col gap-2 p-3 bg-surface-alt border border-accent/40 rounded-sm mt-1.5"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Waveform + status instruction */}
        <div className="flex items-center gap-3">
          {/* Waveform: 12 thin olive bars, 1px width, no fill */}
          <div
            className="flex items-center gap-[3px] h-6 px-1"
            aria-hidden="true"
          >
            {heights.map((h, i) => (
              <span
                key={i}
                className="w-px bg-accent inline-block transition-all duration-100 ease-in-out"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>

          <span className="font-sans text-xs text-text-muted select-none">
            Listening. Speak clearly. Press <kbd className="font-mono text-[10px] px-1 py-0.5 rounded-sm bg-surface border border-border">Esc</kbd> to stop.
          </span>
        </div>

        {/* Right: Cancel & Insert buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-7 px-2.5 inline-flex items-center gap-1 font-sans text-xs text-text-muted hover:text-danger hover:bg-surface rounded-sm transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Cancel</span>
          </button>
          <button
            type="button"
            onClick={onInsert}
            className="h-7 px-3 inline-flex items-center gap-1 font-sans text-xs font-medium text-accent hover:bg-accent/10 border border-accent/40 rounded-sm transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
            <span>Insert</span>
          </button>
        </div>
      </div>

      {/* Real-time interim transcript preview if speaking */}
      {transcript && (
        <div className="font-serif text-xs text-text italic pl-1 border-l-2 border-accent/40">
          "{transcript}"
        </div>
      )}
    </div>
  );
};
