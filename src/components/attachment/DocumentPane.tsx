import React, { useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Move,
  FileText,
} from 'lucide-react';
import { AttachmentRecord } from '../../features/attachments/mockOcr';

export interface DocumentPaneProps {
  attachment: AttachmentRecord;
  zoom: number;
  pan: { x: number; y: number };
  rotation: number;
  isPanning: boolean;
  highlightedLineId?: string | null;
  onSelectLine?: (lineId: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToWidth: () => void;
  onRotateClockwise: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
}

export const DocumentPane: React.FC<DocumentPaneProps> = ({
  attachment,
  zoom,
  pan,
  rotation,
  isPanning,
  highlightedLineId,
  onSelectLine,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToWidth,
  onRotateClockwise,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const getRowHighlightClass = (lineId: string) => {
    if (highlightedLineId === lineId) {
      return 'bg-accent/15 ring-2 ring-accent/60 transition-all';
    }
    return 'hover:bg-black/5 transition-colors cursor-pointer';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-alt/40 overflow-hidden relative select-none">
      {/* Top Toolbar */}
      <div className="h-11 px-4 bg-surface border-b border-border flex items-center justify-between gap-3 shrink-0 z-10">
        {/* Left: Document details in mono */}
        <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
          <FileText className="w-3.5 h-3.5 text-text-muted shrink-0" strokeWidth={1.5} />
          <span className="font-medium text-text truncate max-w-[180px]">
            {attachment.filename}
          </span>
          <span className="text-text-faint">·</span>
          <span>Scanned Document</span>
        </div>

        {/* Right: Zoom & Orientation Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoom <= 50}
            className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt disabled:opacity-40 rounded-sm cursor-pointer transition-colors"
            title="Zoom out (-)"
          >
            <ZoomOut className="w-4 h-4" strokeWidth={1.5} />
          </button>

          {/* Zoom % in IBM Plex Mono */}
          <button
            type="button"
            onClick={onResetZoom}
            className="h-8 px-2 flex items-center justify-center font-mono text-xs font-medium text-text hover:bg-surface-alt rounded-sm cursor-pointer transition-colors"
            title="Reset to 100% (0)"
          >
            {zoom}%
          </button>

          <button
            type="button"
            onClick={onZoomIn}
            disabled={zoom >= 300}
            className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt disabled:opacity-40 rounded-sm cursor-pointer transition-colors"
            title="Zoom in (+)"
          >
            <ZoomIn className="w-4 h-4" strokeWidth={1.5} />
          </button>

          <div className="w-px h-4 bg-border mx-1" />

          <button
            type="button"
            onClick={onFitToWidth}
            className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt rounded-sm cursor-pointer transition-colors"
            title="Fit to width"
          >
            <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={onRotateClockwise}
            className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt rounded-sm cursor-pointer transition-colors"
            title="Rotate 90° clockwise (r)"
          >
            <RotateCw className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Pannable & Zoomable Canvas */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        className={`flex-1 overflow-hidden relative flex items-center justify-center bg-bg/60 p-6 ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Helper Hint bottom-left */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 bg-surface/90 border border-border rounded-sm text-[11px] font-mono text-text-muted shadow-none">
          <Move className="w-3 h-3 text-text-faint" strokeWidth={1.5} />
          <span>Click + drag to pan · Scroll to zoom</span>
        </div>

        {/* The Document Canvas Container */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.12s ease-out',
          }}
          className="relative shrink-0 pointer-events-auto"
        >
          {/* Document Sheet (Simulated High-Resolution Scan) */}
          <div className="w-[520px] min-h-[740px] bg-[#FAF8F5] text-[#26221C] border border-border-strong rounded-[4px] p-8 font-sans shadow-none relative">
            {/* Watermark / PHC Emblem */}
            <div
              onClick={() => onSelectLine?.('l1')}
              className={`border-b-2 border-[#26221C]/80 pb-4 mb-5 flex items-start justify-between rounded-sm p-1 ${
                highlightedLineId === 'l1' ? 'ring-2 ring-accent/60 bg-accent/10' : ''
              }`}
            >
              <div>
                <div className="text-[11px] font-mono font-bold tracking-widest text-[#26221C]/70 uppercase">
                  Government Health Services · Rural Health Mission
                </div>
                <h2 className="text-lg font-bold tracking-tight text-[#26221C] font-sans mt-0.5">
                  SHANTI RURAL HEALTH LABORATORY
                </h2>
                <div className="text-xs text-[#26221C]/70">
                  Sub-Centre Sector 4 · Jamunwadi PHC · Facility Code: PHC-WB-7412
                </div>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="font-bold text-[#4F6B47] uppercase text-[11px] border border-[#4F6B47] px-1.5 py-0.5 rounded-[3px] inline-block mb-1">
                  OFFICIAL RECORD
                </div>
                <div className="text-text-muted">Ref: BIO-2026-0891</div>
              </div>
            </div>

            {/* Patient Header Block */}
            <div
              onClick={() => onSelectLine?.('l2')}
              className={`bg-[#F0EBE1] border border-[#DDD5C5] rounded-[3px] p-3 mb-5 grid grid-cols-2 gap-y-2 text-xs font-mono cursor-pointer ${
                highlightedLineId === 'l2' || highlightedLineId === 'l3'
                  ? 'ring-2 ring-accent/60 bg-accent/10'
                  : 'hover:border-[#26221C]/40'
              }`}
            >
              <div>
                <span className="text-[#26221C]/60">Patient Name: </span>
                <strong className="text-[#26221C] font-sans text-sm">{attachment.patientName}</strong>
              </div>
              <div>
                <span className="text-[#26221C]/60">Reg No: </span>
                <strong className="text-[#26221C]">{attachment.patientClinicId}</strong>
              </div>
              <div>
                <span className="text-[#26221C]/60">Age / Gender: </span>
                <span>42 Yrs / Female</span>
              </div>
              <div>
                <span className="text-[#26221C]/60">Date of Collection: </span>
                <span>14-03-2026 08:30 AM</span>
              </div>
              <div className="col-span-2">
                <span className="text-[#26221C]/60">Referring Clinician: </span>
                <span>Dr. Asha Rao, Medical Officer</span>
              </div>
            </div>

            {/* Test Results Table */}
            <div className="mb-6">
              <div className="text-xs font-bold font-sans uppercase tracking-wider text-[#26221C] border-b border-[#26221C]/40 pb-1 mb-2">
                DEPARTMENT OF CLINICAL BIOCHEMISTRY — LIPID PROFILE
              </div>
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="border-b border-[#DDD5C5] text-[#26221C]/70 font-mono text-[11px]">
                    <th className="py-1.5 font-medium">Investigation</th>
                    <th className="py-1.5 font-medium text-right">Result</th>
                    <th className="py-1.5 font-medium text-center">Units</th>
                    <th className="py-1.5 font-medium">Biological Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD5C5]/60 font-mono text-xs">
                  <tr
                    onClick={() => onSelectLine?.('l4')}
                    className={getRowHighlightClass('l4')}
                  >
                    <td className="py-2 font-sans font-medium text-[#26221C]">Total Cholesterol</td>
                    <td className="py-2 text-right font-bold text-[#26221C]">184</td>
                    <td className="py-2 text-center text-[#26221C]/60">mg/dL</td>
                    <td className="py-2 text-[#26221C]/80">Desirable: &lt; 200</td>
                  </tr>
                  <tr
                    onClick={() => onSelectLine?.('l5')}
                    className={getRowHighlightClass('l5')}
                  >
                    <td className="py-2 font-sans font-medium text-[#26221C]">Serum Triglycerides</td>
                    <td className="py-2 text-right font-bold text-[#B4552F]">142</td>
                    <td className="py-2 text-center text-[#26221C]/60">mg/dL</td>
                    <td className="py-2 text-[#26221C]/80">Normal: &lt; 150</td>
                  </tr>
                  <tr
                    onClick={() => onSelectLine?.('l6')}
                    className={getRowHighlightClass('l6')}
                  >
                    <td className="py-2 font-sans font-medium text-[#26221C]">HDL Cholesterol</td>
                    <td className="py-2 text-right font-bold text-[#26221C]">46</td>
                    <td className="py-2 text-center text-[#26221C]/60">mg/dL</td>
                    <td className="py-2 text-[#26221C]/80">Target: &gt; 50</td>
                  </tr>
                  <tr
                    onClick={() => onSelectLine?.('l7')}
                    className={getRowHighlightClass('l7')}
                  >
                    <td className="py-2 font-sans font-medium text-[#26221C]">LDL Cholesterol (Calc)</td>
                    <td className="py-2 text-right font-bold text-[#B4552F]">110</td>
                    <td className="py-2 text-center text-[#26221C]/60">mg/dL</td>
                    <td className="py-2 text-[#26221C]/80">Optimal: &lt; 100</td>
                  </tr>
                  <tr
                    onClick={() => onSelectLine?.('l8')}
                    className={getRowHighlightClass('l8')}
                  >
                    <td className="py-2 font-sans font-medium text-[#26221C]">VLDL Cholesterol</td>
                    <td className="py-2 text-right font-bold text-[#26221C]">28.4</td>
                    <td className="py-2 text-center text-[#26221C]/60">mg/dL</td>
                    <td className="py-2 text-[#26221C]/80">Normal: 10 - 30</td>
                  </tr>
                  <tr
                    onClick={() => onSelectLine?.('l9')}
                    className={getRowHighlightClass('l9')}
                  >
                    <td className="py-2 font-sans font-medium text-[#26221C]">Total / HDL Ratio</td>
                    <td className="py-2 text-right font-bold text-[#26221C]">4.0</td>
                    <td className="py-2 text-center text-[#26221C]/60">ratio</td>
                    <td className="py-2 text-[#26221C]/80">Low Risk: &lt; 4.5</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notes & Impression */}
            <div
              onClick={() => onSelectLine?.('l10')}
              className={`border-t border-[#DDD5C5] pt-3 text-xs mb-8 rounded-sm p-1.5 cursor-pointer ${
                highlightedLineId === 'l10' || highlightedLineId === 'l11'
                  ? 'ring-2 ring-accent/60 bg-accent/10'
                  : 'hover:bg-black/5'
              }`}
            >
              <div className="font-mono text-[11px] text-[#26221C]/70 uppercase font-bold mb-1">
                Clinical Impression & Recommendations:
              </div>
              <p className="font-serif text-[13px] leading-relaxed text-[#26221C]">
                Borderline LDL elevation (110 mg/dL) with preserved HDL levels. Normal triglycerides on fasting specimen. Advise dietary modification with reduction in saturated fats and refined oils. Repeat lipid profile in 3 months.
              </p>
            </div>

            {/* Signatures & Laboratory Stamp */}
            <div className="flex items-end justify-between pt-6 border-t border-[#26221C]/20">
              <div className="relative">
                {/* Simulated Rubber Stamp */}
                <div className="w-28 h-12 border-2 border-[#4F6B47] text-[#4F6B47] rounded-[3px] flex flex-col items-center justify-center font-mono text-[9px] uppercase font-bold transform -rotate-3 select-none opacity-85">
                  <span>SHANTI LAB</span>
                  <span>VERIFIED 14-03-2026</span>
                  <span>BATCH #4</span>
                </div>
              </div>

              <div className="text-right text-xs">
                <div className="font-serif italic text-sm text-[#26221C] mb-1">
                  K. Sharma
                </div>
                <div className="font-mono text-[11px] text-[#26221C]/70">
                  Senior Lab Technologist
                </div>
                <div className="font-mono text-[10px] text-[#26221C]/50">
                  Reg No: WB-LT-88412
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
