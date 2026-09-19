import React from 'react';
import {
  Check,
  Copy,
  RotateCcw,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  Edit3,
  AlignLeft,
} from 'lucide-react';
import { AttachmentRecord, OcrLine as OcrLineType } from '../../features/attachments/mockOcr';
import { OcrLine } from './OcrLine';

export interface OcrPaneProps {
  attachment: AttachmentRecord;
  lines: OcrLineType[];
  rawText: string;
  saveStatus: 'saved' | 'saving';
  isDirty: boolean;
  lowConfidenceCount: number;
  isRawMode: boolean;
  copied: boolean;
  promotedToNotes: boolean;
  onToggleRawMode: () => void;
  onUpdateLine: (lineId: string, newText: string) => void;
  onAcceptSuggestion: (lineId: string, wordId: string) => void;
  onUpdateWordText: (lineId: string, wordId: string, newText: string) => void;
  onUpdateFullRawText: (text: string) => void;
  onResetToOriginal: () => void;
  onCopyText: () => void;
  onPromoteToClinicalNotes: () => void;
  onConfirmAndAttach: () => void;
  onUnconfirm: () => void;
  onRerunOcr: () => void;
  onBackToContext: () => void;
}

export const OcrPane: React.FC<OcrPaneProps> = ({
  attachment,
  lines,
  rawText,
  saveStatus,
  isDirty,
  lowConfidenceCount,
  isRawMode,
  copied,
  promotedToNotes,
  onToggleRawMode,
  onUpdateLine,
  onAcceptSuggestion,
  onUpdateWordText,
  onUpdateFullRawText,
  onResetToOriginal,
  onCopyText,
  onPromoteToClinicalNotes,
  onConfirmAndAttach,
  onUnconfirm,
  onRerunOcr,
  onBackToContext,
}) => {
  const isProcessing = attachment.status === 'processing';
  const isFailed = attachment.status === 'failed';
  const isConfirmed = attachment.status === 'confirmed';

  return (
    <div className="flex-1 flex flex-col h-full bg-surface border-l border-border overflow-hidden select-text">
      {/* Top Status & Toolbar */}
      <div className="h-11 px-4 bg-surface border-b border-border flex items-center justify-between gap-3 shrink-0">
        {/* Left: Status Pill + Confidence */}
        <div className="flex items-center gap-3">
          {/* Status Pill (pills 999px) */}
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-sans font-medium border border-accent/20">
              <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
              <span>Confirmed</span>
            </span>
          ) : isProcessing ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-warning-soft text-warning text-xs font-sans font-medium border border-warning/20">
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse shrink-0" />
              <span>Extracting text…</span>
            </span>
          ) : isFailed ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-danger-soft text-danger text-xs font-sans font-medium border border-danger/20">
              <span className="w-2 h-2 rounded-full bg-danger shrink-0" />
              <span>OCR failed</span>
            </span>
          ) : lowConfidenceCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-warning-soft text-warning text-xs font-sans font-medium border border-warning/20">
              <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
              <span>Needs review</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-sans font-medium border border-accent/20">
              <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
              <span>OCR ready</span>
            </span>
          )}

          {/* Confidence % in IBM Plex Mono */}
          {!isProcessing && !isFailed && (
            <span className="font-mono text-xs text-text-muted">
              {attachment.overallConfidence}% confidence
            </span>
          )}

          {/* Low confidence count warning */}
          {!isProcessing && !isFailed && lowConfidenceCount > 0 && (
            <span className="font-mono text-xs text-terra flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-terra" />
              <span>{lowConfidenceCount} low-confidence {lowConfidenceCount === 1 ? 'word' : 'words'}</span>
            </span>
          )}

          {/* Autosave status indicator */}
          <span className="font-mono text-xs text-text-faint">
            {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
          </span>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1.5">
          {/* Mode Switcher */}
          <button
            type="button"
            onClick={onToggleRawMode}
            disabled={isProcessing || isFailed}
            className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text hover:bg-surface-alt rounded-sm cursor-pointer transition-colors disabled:opacity-40"
            title={isRawMode ? 'Switch to line review' : 'Switch to plain text editor'}
          >
            {isRawMode ? (
              <>
                <AlignLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Line view</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Raw editor</span>
              </>
            )}
          </button>

          {/* Copy Text */}
          <button
            type="button"
            onClick={onCopyText}
            disabled={isProcessing || isFailed}
            className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text hover:bg-surface-alt rounded-sm cursor-pointer transition-colors disabled:opacity-40"
            title="Copy OCR text to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                <span className="text-accent font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Copy text</span>
              </>
            )}
          </button>

          {/* Reset to Original if dirty */}
          {isDirty && (
            <button
              type="button"
              onClick={onResetToOriginal}
              className="h-8 px-2.5 inline-flex items-center gap-1 text-xs text-text-muted hover:text-text hover:bg-surface-alt rounded-sm cursor-pointer transition-colors"
              title="Reset OCR text to initial scanned results"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* State 1: OCR Processing */}
        {isProcessing && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center mb-4">
              <FileText className="w-5 h-5 text-accent animate-pulse" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-lg text-text mb-1">
              Extracting text from document…
            </h3>
            <p className="font-sans text-xs text-text-muted max-w-sm mb-6">
              Analyzing image layers, detecting column boundaries, and performing optical character recognition.
            </p>
            {/* Subtle Progress Bar (No gradient) */}
            <div className="w-64 h-1.5 bg-surface-alt rounded-full overflow-hidden">
              <div className="h-full bg-accent animate-pulse w-3/4 rounded-full" />
            </div>
          </div>
        )}

        {/* State 2: Failed OCR */}
        {isFailed && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-10 h-10 rounded-full bg-danger-soft flex items-center justify-center mb-4">
              <AlertCircle className="w-5 h-5 text-danger" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-lg text-text mb-1">
              OCR extraction failed
            </h3>
            <p className="font-sans text-xs text-text-muted max-w-sm mb-6 leading-relaxed">
              Unable to parse text characters with sufficient clarity. The paper scan may have low contrast or severe skew. You can retry the OCR scan or transcribe the document manually.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onRerunOcr}
                className="h-9 px-4 bg-accent text-surface hover:bg-accent-hover font-sans text-xs font-medium rounded-sm cursor-pointer transition-colors"
              >
                Retry OCR scan
              </button>
              <button
                type="button"
                onClick={onToggleRawMode}
                className="h-9 px-4 bg-surface-alt hover:bg-border text-text font-sans text-xs font-medium rounded-sm border border-border cursor-pointer transition-colors"
              >
                Transcribe manually
              </button>
            </div>
          </div>
        )}

        {/* State 3: Ready or Confirmed — Text Body */}
        {!isProcessing && !isFailed && (
          <div className="flex flex-col gap-4">
            {/* Confirmation Banner if Confirmed */}
            {isConfirmed && (
              <div className="p-3 bg-accent-soft border border-accent/30 rounded-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent text-surface flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5" strokeWidth={2} />
                  </span>
                  <div>
                    <div className="font-sans text-xs font-medium text-text">
                      Confirmed by {attachment.confirmedBy || 'Dr. Asha Rao'}
                    </div>
                    <div className="font-mono text-[11px] text-text-muted">
                      {attachment.confirmedAt || '19 Sep 2026 10:24'} · Attached to {attachment.contextTitle}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onUnconfirm}
                    className="px-2.5 py-1 text-xs text-text-muted hover:text-text rounded-sm cursor-pointer"
                  >
                    Edit again
                  </button>
                  <button
                    type="button"
                    onClick={onBackToContext}
                    className="px-3 py-1 bg-accent text-surface hover:bg-accent-hover text-xs font-medium rounded-sm cursor-pointer"
                  >
                    Return to visit
                  </button>
                </div>
              </div>
            )}

            {/* Low-confidence guidance strip if unconfirmed */}
            {!isConfirmed && lowConfidenceCount > 0 && (
              <div className="p-2.5 bg-terra-soft/30 border border-terra/30 rounded-sm flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-terra shrink-0" />
                  <span className="text-text">
                    <strong>{lowConfidenceCount} words</strong> marked with dotted terra underline. Click any word to accept suggestions or edit.
                  </span>
                </div>
              </div>
            )}

            {/* Editor Area: Raw Mode vs Structured Line Mode */}
            {isRawMode ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={rawText}
                  onChange={(e) => onUpdateFullRawText(e.target.value)}
                  rows={20}
                  className="w-full p-4 bg-surface-alt/30 border border-border text-text font-serif text-[15px] leading-relaxed rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent resize-none placeholder:text-text-faint"
                  placeholder="Type or edit clinical OCR transcription here…"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 border border-border/70 rounded-sm p-3 bg-surface">
                {lines.map((line) => (
                  <OcrLine
                    key={line.id}
                    line={line}
                    onUpdateLine={onUpdateLine}
                    onAcceptSuggestion={onAcceptSuggestion}
                    onUpdateWordText={onUpdateWordText}
                  />
                ))}
              </div>
            )}

            {/* Promote to Clinical Notes Button */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <button
                type="button"
                onClick={onPromoteToClinicalNotes}
                disabled={promotedToNotes}
                className="h-8 px-3 inline-flex items-center gap-2 bg-surface hover:bg-surface-alt text-text border border-border rounded-sm text-xs font-sans font-medium cursor-pointer transition-colors"
                title="Append this extracted text directly to the patient's active visit notes"
              >
                {promotedToNotes ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                    <span className="text-accent">Inserted into visit notes</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
                    <span>Insert into visit notes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="h-14 px-4 bg-surface border-t border-border flex items-center justify-between gap-3 shrink-0">
        {/* Left: Keyboard shortcuts hint in IBM Plex Mono */}
        <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-text-muted">
          <span><strong className="text-text font-medium">⌘↵</strong> Confirm</span>
          <span><strong className="text-text font-medium">⌘S</strong> Save</span>
          <span><strong className="text-text font-medium">Esc</strong> Back</span>
          <span><strong className="text-text font-medium">+ / -</strong> Zoom</span>
        </div>

        {/* Right: Confirm & Attach Button */}
        <div className="flex items-center gap-2 ml-auto">
          {isConfirmed ? (
            <button
              type="button"
              onClick={onBackToContext}
              className="h-9 px-4 inline-flex items-center gap-2 bg-accent text-surface hover:bg-accent-hover font-sans text-xs font-medium rounded-sm cursor-pointer transition-colors"
            >
              <span>Back to visit record</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirmAndAttach}
              disabled={isProcessing}
              className="h-9 px-4 inline-flex items-center gap-2 bg-accent text-surface hover:bg-accent-hover font-sans text-xs font-medium rounded-sm cursor-pointer transition-colors disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Confirm & attach</span>
              <kbd className="font-mono text-[10px] bg-accent-hover px-1.5 py-0.5 rounded-sm opacity-90">
                ⌘↵
              </kbd>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
