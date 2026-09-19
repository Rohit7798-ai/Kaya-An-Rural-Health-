import React from 'react';
import { SectionCard } from './SectionCard';
import { ThemeMode, DensityMode } from '../../features/theme/useTheme';

export interface AppearanceSectionProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  density: DensityMode;
  onDensityChange: (density: DensityMode) => void;
  reduceMotion: boolean;
  onReduceMotionChange: (enabled: boolean) => void;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  theme,
  onThemeChange,
  density,
  onDensityChange,
  reduceMotion,
  onReduceMotionChange,
}) => {
  return (
    <SectionCard id="section-appearance" title="Appearance">
      <div className="divide-y divide-border">
        {/* Row 1: Theme */}
        <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 setting-row">
          <div>
            <span className="text-sm font-sans text-text block">Theme</span>
            <span className="text-xs text-text-muted font-sans block mt-0.5">
              Interface lightness and contrast
            </span>
          </div>

          <div
            role="radiogroup"
            aria-label="Theme mode"
            className="inline-flex items-center p-0.5 bg-surface-alt border border-border rounded-sm gap-1 self-start sm:self-auto"
          >
            {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => {
              const isActive = theme === m;
              const label = m.charAt(0).toUpperCase() + m.slice(1);
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => onThemeChange(m)}
                  className={`h-8 px-3 text-xs font-sans rounded-sm transition-colors cursor-pointer select-none ${
                    isActive
                      ? 'bg-accent-soft text-accent border border-accent font-medium'
                      : 'text-text-muted hover:text-text hover:bg-surface border border-transparent'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Density */}
        <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 setting-row">
          <div>
            <span className="text-sm font-sans text-text block">Density</span>
            <span className="text-xs text-text-muted font-sans block mt-0.5">
              Vertical spacing on cards and lists
            </span>
          </div>

          <div
            role="radiogroup"
            aria-label="Display density"
            className="inline-flex items-center p-0.5 bg-surface-alt border border-border rounded-sm gap-1 self-start sm:self-auto"
          >
            {(['comfortable', 'compact'] as DensityMode[]).map((d) => {
              const isActive = density === d;
              const label = d.charAt(0).toUpperCase() + d.slice(1);
              return (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => onDensityChange(d)}
                  className={`h-8 px-3 text-xs font-sans rounded-sm transition-colors cursor-pointer select-none ${
                    isActive
                      ? 'bg-accent-soft text-accent border border-accent font-medium'
                      : 'text-text-muted hover:text-text hover:bg-surface border border-transparent'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Reduce motion */}
        <div className="py-3.5 flex items-center justify-between gap-3 setting-row">
          <div>
            <span className="text-sm font-sans text-text block">Reduce motion</span>
            <span className="text-xs text-text-muted font-sans block mt-0.5">
              Disable UI transitions for instant changes
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={reduceMotion}
            aria-label="Toggle reduce motion"
            onClick={() => onReduceMotionChange(!reduceMotion)}
            className={`w-11 h-6 rounded-full border p-0.5 transition-colors cursor-pointer flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
              reduceMotion ? 'bg-accent border-accent' : 'bg-surface-alt border-border'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-surface border border-border-strong transform transition-transform duration-150 ${
                reduceMotion ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </SectionCard>
  );
};
