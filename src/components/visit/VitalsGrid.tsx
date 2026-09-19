import React from 'react';

export interface VitalsGridProps {
  bp: string;
  pulse: string;
  temp: string;
  weight: string;
  onChangeBp: (val: string) => void;
  onChangePulse: (val: string) => void;
  onChangeTemp: (val: string) => void;
  onChangeWeight: (val: string) => void;
}

export const VitalsGrid: React.FC<VitalsGridProps> = ({
  bp,
  pulse,
  temp,
  weight,
  onChangeBp,
  onChangePulse,
  onChangeTemp,
  onChangeWeight,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {/* 4 compact inputs in one row (2 on narrow) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* BP */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="vital-bp"
            className="font-sans text-xs font-medium text-text select-none"
          >
            BP
          </label>
          <div className="relative flex items-center">
            <input
              id="vital-bp"
              type="text"
              value={bp}
              onChange={(e) => onChangeBp(e.target.value)}
              placeholder="128/82"
              className="w-full h-9 px-3 bg-surface text-text font-mono text-sm tabular-nums rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors"
            />
          </div>
        </div>

        {/* Pulse */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="vital-pulse"
            className="font-sans text-xs font-medium text-text select-none"
          >
            Pulse
          </label>
          <div className="relative flex items-center">
            <input
              id="vital-pulse"
              type="text"
              value={pulse}
              onChange={(e) => onChangePulse(e.target.value)}
              placeholder="78"
              className="w-full h-9 px-3 bg-surface text-text font-mono text-sm tabular-nums rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors"
            />
          </div>
        </div>

        {/* Temp */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="vital-temp"
            className="font-sans text-xs font-medium text-text select-none"
          >
            Temp
          </label>
          <div className="relative flex items-center">
            <input
              id="vital-temp"
              type="text"
              value={temp}
              onChange={(e) => onChangeTemp(e.target.value)}
              placeholder="36.8"
              className="w-full h-9 pl-3 pr-8 bg-surface text-text font-mono text-sm tabular-nums rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors"
            />
            <span className="absolute right-2.5 font-sans text-xs text-text-muted select-none pointer-events-none">
              °C
            </span>
          </div>
        </div>

        {/* Weight */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="vital-weight"
            className="font-sans text-xs font-medium text-text select-none"
          >
            Weight
          </label>
          <div className="relative flex items-center">
            <input
              id="vital-weight"
              type="text"
              value={weight}
              onChange={(e) => onChangeWeight(e.target.value)}
              placeholder="61"
              className="w-full h-9 pl-3 pr-8 bg-surface text-text font-mono text-sm tabular-nums rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors"
            />
            <span className="absolute right-2.5 font-sans text-xs text-text-muted select-none pointer-events-none">
              kg
            </span>
          </div>
        </div>
      </div>

      {/* Muted small helper text */}
      <div className="font-sans text-xs text-text-muted">
        Leave blank what you didn't measure.
      </div>
    </div>
  );
};
