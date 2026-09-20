import React, { useState, useMemo } from 'react';
import {
  Check,
  Copy,
  RotateCcw,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Edit3,
  AlignLeft,
  Table,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';
import { AttachmentRecord, OcrLine as OcrLineType } from '../../features/attachments/mockOcr';
import { LowConfidenceIssue, ClinicalFinding } from '../../features/attachments/useOcrText';
import { OcrLine } from './OcrLine';

export interface OcrPaneProps {
  attachment: AttachmentRecord;
  lines: OcrLineType[];
  rawText: string;
  saveStatus: 'saved' | 'saving';
  isDirty: boolean;
  lowConfidenceCount: number;
  lowConfidenceIssues?: LowConfidenceIssue[];
  currentIssue?: LowConfidenceIssue | null;
  activeIssueIndex?: number;
  viewMode?: 'lines' | 'table' | 'raw';
  highlightedLineId?: string | null;
  searchQuery?: string;
  parsedClinicalFindings?: ClinicalFinding[];
  isRawMode: boolean;
  copied: boolean;
  promotedToNotes: boolean;
  onSetViewMode?: (mode: 'lines' | 'table' | 'raw') => void;
  onSetSearchQuery?: (q: string) => void;
  onSetHighlightedLineId?: (id: string | null) => void;
  onGoToNextIssue?: () => void;
  onGoToPrevIssue?: () => void;
  onAcceptAllSuggestions?: () => void;
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
  lowConfidenceIssues = [],
  currentIssue = null,
  activeIssueIndex = 0,
  viewMode = 'lines',
  highlightedLineId = null,
  searchQuery = '',
  parsedClinicalFindings = [],
  isRawMode,
  copied,
  promotedToNotes,
  onSetViewMode,
  onSetSearchQuery,
  onSetHighlightedLineId,
  onGoToNextIssue,
  onGoToPrevIssue,
  onAcceptAllSuggestions,
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

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [copiedFindings, setCopiedFindings] = useState(false);

  // Search match count
  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const q = searchQuery.toLowerCase();
    return lines.filter((l) => l.rawText.toLowerCase().includes(q)).length;
  }, [lines, searchQuery]);

  const handleCopyFindings = () => {
    if (parsedClinicalFindings.length === 0) return;
    const tableStr = parsedClinicalFindings
      .map((f) => `${f.testName}: ${f.value} ${f.unit} [${f.referenceRange}] (${f.statusLabel})`)
      .join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(tableStr);
      setCopiedFindings(true);
      setTimeout(() => setCopiedFindings(false), 2000);
    }
  };

  const wordCount = useMemo(() => {
    return rawText.trim().split(/\s+/).filter(Boolean).length;
  }, [rawText]);

  return (
    <div className="flex-1 flex flex-col h-full bg-surface border-l border-border overflow-hidden select-text">
      {/* ── TOP STATUS & TOOLBAR ── */}
      <div className="h-11 px-3.5 bg-surface border-b border-border flex items-center justify-between gap-2 shrink-0">
        {/* Left: Status Pill + Confidence Score */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Status Badge */}
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-sans font-medium border border-accent/20 shrink-0">
              <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
              <span>Confirmed</span>
            </span>
          ) : isProcessing ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-warning-soft text-warning text-xs font-sans font-medium border border-warning/20 shrink-0">
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse shrink-0" />
              <span>Extracting…</span>
            </span>
          ) : isFailed ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-danger-soft text-danger text-xs font-sans font-medium border border-danger/20 shrink-0">
              <span className="w-2 h-2 rounded-full bg-danger shrink-0" />
              <span>OCR failed</span>
            </span>
          ) : lowConfidenceCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-terra-soft/40 text-terra text-xs font-sans font-medium border border-terra/30 shrink-0">
              <span className="w-2 h-2 rounded-full bg-terra shrink-0" />
              <span>{lowConfidenceCount} flagged</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-sans font-medium border border-accent/20 shrink-0">
              <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
              <span>OCR ready</span>
            </span>
          )}

          {/* Confidence Meter */}
          {!isProcessing && !isFailed && (
            <span className="font-mono text-xs text-text-muted hidden md:inline">
              {attachment.overallConfidence}% conf.
            </span>
          )}

          {/* Autosave pulse */}
          <span className="font-mono text-[11px] text-text-faint hidden sm:inline">
            {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
          </span>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* View Mode Switcher Pills */}
          <div className="flex items-center bg-surface-alt p-0.5 rounded-sm border border-border">
            <button
              type="button"
              onClick={() => onSetViewMode?.('lines')}
              className={`px-2 py-1 text-xs font-sans rounded-sm transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'lines'
                  ? 'bg-surface text-text font-medium shadow-none'
                  : 'text-text-muted hover:text-text'
              }`}
              title="Line-by-line review view"
            >
              <AlignLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Lines</span>
            </button>

            {parsedClinicalFindings.length > 0 && (
              <button
                type="button"
                onClick={() => onSetViewMode?.('table')}
                className={`px-2 py-1 text-xs font-sans rounded-sm transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'table'
                    ? 'bg-surface text-text font-medium shadow-none'
                    : 'text-text-muted hover:text-text'
                }`}
                title="Structured clinical table view"
              >
                <Table className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Findings</span>
                <span className="text-[10px] font-mono px-1 rounded-sm bg-accent-soft text-accent font-medium">
                  {parsedClinicalFindings.length}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSetViewMode?.('raw')}
              className={`px-2 py-1 text-xs font-sans rounded-sm transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'raw'
                  ? 'bg-surface text-text font-medium shadow-none'
                  : 'text-text-muted hover:text-text'
              }`}
              title="Plain text / raw editor view"
            >
              <Edit3 className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Raw</span>
            </button>
          </div>

          {/* In-Transcript Search Toggle */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`w-8 h-8 flex items-center justify-center rounded-sm cursor-pointer transition-colors ${
              isSearchOpen || searchQuery
                ? 'bg-accent-soft text-accent font-medium'
                : 'text-text-muted hover:text-text hover:bg-surface-alt'
            }`}
            title="Search in transcription (⌘F)"
          >
            <Search className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>

          {/* Copy Full Text */}
          <button
            type="button"
            onClick={onCopyText}
            disabled={isProcessing || isFailed}
            className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text hover:bg-surface-alt rounded-sm cursor-pointer transition-colors disabled:opacity-40"
            title="Copy full transcription text"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
                <span className="text-accent font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="hidden md:inline">Copy</span>
              </>
            )}
          </button>

          {/* Reset if dirty */}
          {isDirty && (
            <button
              type="button"
              onClick={onResetToOriginal}
              className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt rounded-sm cursor-pointer transition-colors"
              title="Reset OCR text to initial scan results"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* ── OPTIONAL SEARCH BAR ── */}
      {isSearchOpen && (
        <div className="px-4 py-2 bg-surface-alt/60 border-b border-border flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-100">
          <Search className="w-3.5 h-3.5 text-text-muted shrink-0" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => onSetSearchQuery?.(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-text text-xs placeholder:text-text-faint focus:outline-none font-sans"
          />
          {searchQuery && (
            <span className="text-[11px] font-mono text-text-muted px-1.5 py-0.5 rounded-sm bg-surface border border-border">
              {matchCount} {matchCount === 1 ? 'match' : 'matches'}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              onSetSearchQuery?.('');
              setIsSearchOpen(false);
            }}
            className="text-text-muted hover:text-text p-1 rounded-sm cursor-pointer"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* ── RAPID REVIEW BAR ("Issue Stepper") for Low Confidence Words ── */}
      {!isConfirmed && !isProcessing && !isFailed && lowConfidenceCount > 0 && currentIssue && (
        <div className="px-4 py-2 bg-terra-soft/20 border-b border-terra/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-terra shrink-0" />
            <span className="font-mono text-[11px] text-text-muted shrink-0">
              Word <strong className="text-terra">{activeIssueIndex + 1}</strong> of{' '}
              <strong className="text-terra">{lowConfidenceCount}</strong>:
            </span>
            <span className="font-serif text-[13px] text-text font-medium truncate">
              "{currentIssue.word.text}"
            </span>
            {currentIssue.word.suggestion && (
              <span className="text-text-muted font-sans text-xs flex items-center gap-1 truncate">
                <ArrowRight className="w-3 h-3 text-text-faint shrink-0" />
                <span className="text-accent font-medium truncate">
                  {currentIssue.word.suggestion}
                </span>
                <span className="font-mono text-[10px] text-text-faint">
                  ({Math.round(currentIssue.word.confidence * 100)}%)
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Prev / Next issue buttons */}
            <div className="flex items-center border border-border rounded-sm bg-surface">
              <button
                type="button"
                onClick={onGoToPrevIssue}
                className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt rounded-l-sm cursor-pointer transition-colors"
                title="Previous flagged word"
              >
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={onGoToNextIssue}
                className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt rounded-r-sm cursor-pointer transition-colors"
                title="Next flagged word"
              >
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Accept Single Suggestion */}
            {currentIssue.word.suggestion && (
              <button
                type="button"
                onClick={() =>
                  onAcceptSuggestion(currentIssue.lineId, currentIssue.word.id)
                }
                className="h-7 px-2.5 bg-accent text-surface hover:bg-accent-hover text-xs font-medium rounded-sm inline-flex items-center gap-1 cursor-pointer transition-colors"
                title="Accept this suggestion"
              >
                <Check className="w-3 h-3" strokeWidth={2} />
                <span>Accept</span>
              </button>
            )}

            {/* Accept All Suggestions */}
            {onAcceptAllSuggestions && (
              <button
                type="button"
                onClick={onAcceptAllSuggestions}
                className="h-7 px-2.5 bg-surface hover:bg-surface-alt text-text border border-border text-xs font-medium rounded-sm inline-flex items-center gap-1 cursor-pointer transition-colors"
                title="Accept all suggestions at once"
              >
                <CheckCheck className="w-3 h-3 text-accent" strokeWidth={1.5} />
                <span>Accept all ({lowConfidenceCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto p-5">
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
              Analyzing layout blocks, aligning tables, and resolving clinical characters.
            </p>
            <div className="w-64 h-1.5 bg-surface-alt rounded-full overflow-hidden">
              <div className="h-full bg-accent animate-pulse w-3/4 rounded-full" />
            </div>
          </div>
        )}

        {/* State 2: OCR Failed */}
        {isFailed && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-10 h-10 rounded-full bg-danger-soft flex items-center justify-center mb-4">
              <AlertCircle className="w-5 h-5 text-danger" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-lg text-text mb-1">
              OCR extraction failed
            </h3>
            <p className="font-sans text-xs text-text-muted max-w-sm mb-6 leading-relaxed">
              Unable to read document characters with required accuracy. You can re-run the scan or transcribe into the raw editor manually.
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

        {/* State 3: Ready or Confirmed */}
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

            {/* VIEW MODE 1: LINE REVIEW */}
            {viewMode === 'lines' && (
              <div className="flex flex-col gap-0.5 border border-border/70 rounded-sm p-3 bg-surface shadow-none">
                {lines.map((line) => (
                  <OcrLine
                    key={line.id}
                    line={line}
                    isHighlighted={highlightedLineId === line.id}
                    searchQuery={searchQuery}
                    activeWordId={
                      currentIssue && currentIssue.lineId === line.id
                        ? currentIssue.word.id
                        : undefined
                    }
                    onHoverLine={(id) => onSetHighlightedLineId?.(id)}
                    onUpdateLine={onUpdateLine}
                    onAcceptSuggestion={onAcceptSuggestion}
                    onUpdateWordText={onUpdateWordText}
                  />
                ))}
              </div>
            )}

            {/* VIEW MODE 2: STRUCTURED CLINICAL FINDINGS TABLE */}
            {viewMode === 'table' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-sans text-xs font-semibold text-text uppercase tracking-wider">
                      Extracted Laboratory Investigations
                    </h4>
                    <p className="text-[11px] text-text-muted">
                      Structured clinical parameters parsed directly from the scanned document.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyFindings}
                    className="h-7 px-2.5 inline-flex items-center gap-1.5 text-xs bg-surface-alt hover:bg-border text-text border border-border rounded-sm cursor-pointer transition-colors"
                  >
                    {copiedFindings ? (
                      <>
                        <Check className="w-3 h-3 text-accent" strokeWidth={2} />
                        <span className="text-accent font-medium">Copied table</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" strokeWidth={1.5} />
                        <span>Copy table</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="border border-border rounded-sm overflow-hidden bg-surface">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-surface-alt/70 border-b border-border font-mono text-[11px] text-text-muted">
                        <th className="py-2 px-3 font-medium">Investigation</th>
                        <th className="py-2 px-3 font-medium text-right">Observed Value</th>
                        <th className="py-2 px-3 font-medium">Reference Range</th>
                        <th className="py-2 px-3 font-medium">Clinical Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {parsedClinicalFindings.map((finding) => (
                        <tr
                          key={finding.id}
                          className="hover:bg-surface-alt/40 transition-colors cursor-pointer"
                          onClick={() => {
                            onSetHighlightedLineId?.(finding.id);
                            onSetViewMode?.('lines');
                          }}
                        >
                          <td className="py-2.5 px-3 font-sans font-medium text-text">
                            {finding.testName}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-right text-text">
                            {finding.value}{' '}
                            <span className="font-normal text-text-muted text-[11px]">
                              {finding.unit}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-text-muted text-[11px]">
                            {finding.referenceRange || '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-sans font-medium ${
                                finding.status === 'elevated'
                                  ? 'bg-terra-soft/50 text-terra border border-terra/30'
                                  : finding.status === 'low'
                                  ? 'bg-warning-soft text-warning border border-warning/30'
                                  : 'bg-accent-soft text-accent border border-accent/30'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  finding.status === 'elevated'
                                    ? 'bg-terra'
                                    : finding.status === 'low'
                                    ? 'bg-warning'
                                    : 'bg-accent'
                                }`}
                              />
                              <span>{finding.statusLabel}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW MODE 3: RAW EDITOR */}
            {viewMode === 'raw' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono text-text-muted">
                  <span>Plain text clinical transcript</span>
                  <span>{wordCount} words · {lines.length} lines</span>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => onUpdateFullRawText(e.target.value)}
                  rows={20}
                  className="w-full p-4 bg-surface-alt/30 border border-border text-text font-serif text-[15px] leading-relaxed rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent resize-none placeholder:text-text-faint"
                  placeholder="Type or edit clinical OCR transcription here…"
                />
              </div>
            )}

            {/* Bottom Actions Row: Insert into visit notes */}
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
                    <Check className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
                    <span className="text-accent font-medium">Inserted into visit notes</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
                    <span>Insert into visit notes</span>
                  </>
                )}
              </button>

              <div className="text-[11px] font-mono text-text-faint">
                {attachment.documentType} · Ref: {attachment.patientClinicId}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM ACTION FOOTER ── */}
      <div className="h-14 px-4 bg-surface border-t border-border flex items-center justify-between gap-3 shrink-0">
        {/* Left: Keyboard shortcuts hint in IBM Plex Mono */}
        <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-text-muted">
          <span><strong className="text-text font-medium">⌘↵</strong> Confirm</span>
          <span><strong className="text-text font-medium">⌘S</strong> Save</span>
          <span><strong className="text-text font-medium">⌘F</strong> Search</span>
          <span><strong className="text-text font-medium">Esc</strong> Back</span>
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
              <Check className="w-3.5 h-3.5" strokeWidth={2} />
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
