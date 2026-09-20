import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  MoreHorizontal,
  ArrowLeft,
  Check,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  WifiOff,
  Columns,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAttachment } from '../features/attachments/useAttachment';
import { useOcrText } from '../features/attachments/useOcrText';
import { DocumentPane } from '../components/attachment/DocumentPane';
import { OcrPane } from '../components/attachment/OcrPane';
import { PaneDivider } from '../components/attachment/PaneDivider';

export const AttachmentViewer: React.FC = () => {
  const { id = 'att-seed-1' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // File input ref for "Replace file"
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Split view percentage state (default 50%)
  const [splitPercent, setSplitPercent] = useState<number>(50);

  // Hook 1: Document state, zoom, pan, status, delete flow
  const {
    attachment,
    zoom,
    pan,
    rotation,
    isPanning,
    showDeleteConfirm,
    isDeleted,
    isOffline,
    setIsOffline,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToWidth,
    rotateClockwise,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    setStatus,
    rerunOcr,
    confirmAndAttach,
    unconfirm,
    replaceFile,
    promptDelete,
    cancelDelete,
    executeDelete,
  } = useAttachment({ id });

  // Hook 2: OCR text editing, low confidence words, autosave, rapid review
  const {
    lines,
    rawText,
    saveStatus,
    isDirty,
    lowConfidenceCount,
    lowConfidenceIssues,
    currentIssue,
    activeIssueIndex,
    isRawMode,
    viewMode,
    copied,
    promotedToNotes,
    highlightedLineId,
    searchQuery,
    parsedClinicalFindings,
    setViewMode,
    setIsRawMode,
    setHighlightedLineId,
    setSearchQuery,
    goToNextIssue,
    goToPrevIssue,
    acceptSuggestion,
    acceptAllSuggestions,
    updateWordText,
    updateLine,
    updateFullRawText,
    resetToOriginal,
    copyText,
    promoteToClinicalNotes,
  } = useOcrText({
    initialAttachment: attachment,
  });

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // ⌘Enter / Ctrl+Enter: Confirm & attach
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        confirmAndAttach();
        return;
      }

      // ⌘S / Ctrl+S: Save
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        return;
      }

      // ⌘F / Ctrl+F: Focus search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search transcript..."]') as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          // Trigger search bar open via button
          const searchBtn = document.querySelector('button[title*="Search in transcription"]') as HTMLButtonElement | null;
          searchBtn?.click();
        }
        return;
      }

      // Esc: Back to context
      if (e.key === 'Escape' && !isInput && !showDeleteConfirm) {
        e.preventDefault();
        navigate(attachment.contextLink);
        return;
      }

      // Document shortcuts when not typing in input
      if (!isInput) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          zoomOut();
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          rotateClockwise();
        } else if (e.key === '0') {
          e.preventDefault();
          resetZoom();
        } else if (e.key.toLowerCase() === 'a' && currentIssue?.word?.suggestion) {
          e.preventDefault();
          acceptSuggestion(currentIssue.lineId, currentIssue.word.id);
        } else if (e.key === 'ArrowRight' && (e.metaKey || e.altKey)) {
          e.preventDefault();
          goToNextIssue();
        } else if (e.key === 'ArrowLeft' && (e.metaKey || e.altKey)) {
          e.preventDefault();
          goToPrevIssue();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    confirmAndAttach,
    navigate,
    attachment.contextLink,
    showDeleteConfirm,
    zoomIn,
    zoomOut,
    rotateClockwise,
    resetZoom,
    currentIssue,
    acceptSuggestion,
    goToNextIssue,
    goToPrevIssue,
  ]);

  // File replacement handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      replaceFile(file);
      e.target.value = '';
    }
  };

  // Mock download
  const handleDownloadOriginal = () => {
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isDeleted) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center font-sans">
        <div className="w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-xl text-text mb-2">Attachment deleted</h2>
        <p className="text-xs text-text-muted mb-6">
          The file and its extracted transcription have been removed from the consultation record.
        </p>
        <button
          type="button"
          onClick={() => navigate(attachment.contextLink)}
          className="h-9 px-4 bg-accent text-surface hover:bg-accent-hover rounded-sm text-xs font-medium cursor-pointer transition-colors"
        >
          Return to clinical record
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-7xl mx-auto px-4 py-3 select-none">
      {/* Hidden File Input for Replace */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── OFFLINE STATUS BANNER ── */}
      {isOffline && (
        <div className="bg-warning-soft border-b border-warning/20 px-4 py-2 flex items-center justify-between text-xs text-warning">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span>
              <strong>Working offline.</strong> OCR transcription edits are cached locally in IndexedDB and will sync when reconnected.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOffline(false)}
            className="text-[11px] underline hover:text-warning-dark cursor-pointer"
          >
            Simulate online
          </button>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-sm p-6 shadow-none font-sans">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-danger-soft flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-danger" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-text mb-1">
                  Delete attachment permanently?
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Are you sure you want to remove <strong>{attachment.filename}</strong>? All OCR text, low-confidence reviews, and annotations will be deleted.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={cancelDelete}
                className="h-8 px-3 text-xs text-text-muted hover:text-text rounded-sm cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="h-8 px-3 bg-danger text-surface hover:bg-danger-hover text-xs font-medium rounded-sm cursor-pointer transition-colors"
              >
                Delete attachment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="bg-surface border border-border rounded-t-sm px-5 py-3 flex items-center justify-between gap-4 shrink-0">
        {/* Left: Back Link + File Title & Meta */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate(attachment.contextLink)}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text cursor-pointer transition-colors w-fit"
          >
            <span>←</span>
            <span>{attachment.contextTitle}</span>
          </button>

          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-sans font-medium text-base text-text tracking-tight truncate max-w-md">
              {attachment.filename}
            </h1>
            <div className="font-mono text-xs text-text-muted">
              {attachment.fileSizeFormatted} · {attachment.fileType.toUpperCase()} · uploaded {attachment.uploadedAtFormatted}
            </div>
          </div>
        </div>

        {/* Center: Split-View Presets */}
        <div className="hidden lg:flex items-center gap-1 bg-surface-alt p-0.5 rounded-sm border border-border font-mono text-[11px]">
          <button
            type="button"
            onClick={() => setSplitPercent(35)}
            className={`px-2 py-0.5 rounded-sm cursor-pointer transition-colors ${
              splitPercent === 35 ? 'bg-surface text-text font-medium' : 'text-text-muted hover:text-text'
            }`}
            title="35% Document / 65% Transcript"
          >
            Editor Focus
          </button>
          <button
            type="button"
            onClick={() => setSplitPercent(50)}
            className={`px-2 py-0.5 rounded-sm cursor-pointer transition-colors ${
              splitPercent === 50 ? 'bg-surface text-text font-medium' : 'text-text-muted hover:text-text'
            }`}
            title="Balanced 50/50 split"
          >
            50:50
          </button>
          <button
            type="button"
            onClick={() => setSplitPercent(65)}
            className={`px-2 py-0.5 rounded-sm cursor-pointer transition-colors ${
              splitPercent === 65 ? 'bg-surface text-text font-medium' : 'text-text-muted hover:text-text'
            }`}
            title="65% Document / 35% Transcript"
          >
            Doc Focus
          </button>
        </div>

        {/* Right Header: Primary Action + Overflow Menu */}
        <div className="flex items-center gap-2">
          {attachment.status === 'confirmed' ? (
            <div className="h-9 px-3.5 inline-flex items-center gap-1.5 bg-accent-soft text-accent border border-accent/20 rounded-sm text-xs font-medium font-sans">
              <Check className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Confirmed & attached</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={confirmAndAttach}
              disabled={attachment.status === 'processing'}
              className="h-9 px-4 inline-flex items-center gap-2 bg-accent text-surface hover:bg-accent-hover font-sans text-xs font-medium rounded-sm cursor-pointer transition-colors disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Confirm & attach</span>
              <kbd className="font-mono text-[10px] bg-accent-hover px-1.5 py-0.5 rounded-sm opacity-90">
                ⌘↵
              </kbd>
            </button>
          )}

          {/* Radix Overflow Menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label="Attachment options"
                className="w-9 h-9 flex items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-alt transition-colors border border-border cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="min-w-[190px] bg-surface border border-border rounded-sm p-1 z-50 text-left font-sans text-xs shadow-none"
              >
                <DropdownMenu.Item
                  onClick={rerunOcr}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-text hover:bg-surface-alt cursor-pointer outline-none focus:bg-surface-alt"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
                  <span>Re-run OCR</span>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onClick={handleDownloadOriginal}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-text hover:bg-surface-alt cursor-pointer outline-none focus:bg-surface-alt"
                >
                  <Download className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
                  <span>Download original</span>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onClick={() => replaceInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-text hover:bg-surface-alt cursor-pointer outline-none focus:bg-surface-alt"
                >
                  <Upload className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
                  <span>Replace file</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-px bg-border my-1" />

                <DropdownMenu.Item
                  onClick={promptDelete}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-danger hover:bg-danger-soft cursor-pointer outline-none focus:bg-danger-soft"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Delete attachment</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* ── SPLIT VIEW ── */}
      <div
        ref={containerRef}
        className="flex-1 flex overflow-hidden border-x border-b border-border rounded-b-sm bg-surface"
      >
        {/* Left Pane: Document Image */}
        <div
          style={{ width: `${splitPercent}%` }}
          className="h-full flex flex-col overflow-hidden shrink-0"
        >
          <DocumentPane
            attachment={attachment}
            zoom={zoom}
            pan={pan}
            rotation={rotation}
            isPanning={isPanning}
            highlightedLineId={highlightedLineId}
            onSelectLine={(lineId) => {
              setHighlightedLineId(lineId);
              setViewMode('lines');
            }}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetZoom={resetZoom}
            onFitToWidth={fitToWidth}
            onRotateClockwise={rotateClockwise}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          />
        </div>

        {/* Resizable Divider */}
        <PaneDivider
          splitPercent={splitPercent}
          onSplitChange={setSplitPercent}
          minPercent={30}
          maxPercent={70}
          containerRef={containerRef}
        />

        {/* Right Pane: Editable OCR Text */}
        <div
          style={{ width: `${100 - splitPercent}%` }}
          className="h-full flex flex-col overflow-hidden shrink-0"
        >
          <OcrPane
            attachment={attachment}
            lines={lines}
            rawText={rawText}
            saveStatus={saveStatus}
            isDirty={isDirty}
            lowConfidenceCount={lowConfidenceCount}
            lowConfidenceIssues={lowConfidenceIssues}
            currentIssue={currentIssue}
            activeIssueIndex={activeIssueIndex}
            viewMode={viewMode}
            highlightedLineId={highlightedLineId}
            searchQuery={searchQuery}
            parsedClinicalFindings={parsedClinicalFindings}
            isRawMode={isRawMode}
            copied={copied}
            promotedToNotes={promotedToNotes}
            onSetViewMode={setViewMode}
            onSetSearchQuery={setSearchQuery}
            onSetHighlightedLineId={setHighlightedLineId}
            onGoToNextIssue={goToNextIssue}
            onGoToPrevIssue={goToPrevIssue}
            onAcceptAllSuggestions={acceptAllSuggestions}
            onToggleRawMode={() => setIsRawMode(!isRawMode)}
            onUpdateLine={updateLine}
            onAcceptSuggestion={acceptSuggestion}
            onUpdateWordText={updateWordText}
            onUpdateFullRawText={updateFullRawText}
            onResetToOriginal={resetToOriginal}
            onCopyText={copyText}
            onPromoteToClinicalNotes={promoteToClinicalNotes}
            onConfirmAndAttach={confirmAndAttach}
            onUnconfirm={unconfirm}
            onRerunOcr={rerunOcr}
            onBackToContext={() => navigate(attachment.contextLink)}
          />
        </div>
      </div>
    </div>
  );
};
