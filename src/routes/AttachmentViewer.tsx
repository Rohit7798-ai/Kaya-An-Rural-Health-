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

  // Split view percentage state (default 55%)
  const [splitPercent, setSplitPercent] = useState<number>(55);

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

  // Hook 2: OCR text editing, low confidence words, autosave
  const {
    lines,
    rawText,
    saveStatus,
    isDirty,
    lowConfidenceCount,
    isRawMode,
    copied,
    promotedToNotes,
    setIsRawMode,
    acceptSuggestion,
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
      // Don't intercept if user is typing in an input or textarea
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
        // save is automatic, give feedback
        return;
      }

      // Esc: Back to context
      if (e.key === 'Escape' && !isInput && !showDeleteConfirm) {
        e.preventDefault();
        navigate(attachment.contextLink);
        return;
      }

      // Document zoom shortcuts when not typing
      if (!isInput) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          resetZoom();
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          rotateClockwise();
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
    resetZoom,
    rotateClockwise,
  ]);

  // Handle Download Original
  const handleDownloadOriginal = () => {
    const blob = new Blob([rawText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle File Replacement selection
  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      replaceFile({
        name: file.name,
        size: file.size,
      });
      e.target.value = '';
    }
  };

  // Deleted Screen State
  if (isDeleted) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 bg-surface border border-border rounded-sm max-w-lg mx-auto mt-12">
        <div className="w-12 h-12 rounded-full bg-surface-alt flex items-center justify-center mb-4 text-text-muted">
          <Trash2 className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-2xl text-text mb-2">Attachment removed</h2>
        <p className="font-sans text-sm text-text-muted mb-6">
          The document and its associated OCR extraction data have been deleted from this record.
        </p>
        <button
          type="button"
          onClick={() => navigate(attachment.contextLink)}
          className="h-9 px-4 inline-flex items-center gap-2 bg-accent text-surface hover:bg-accent-hover font-sans text-xs font-medium rounded-sm cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          <span>Return to {attachment.contextTitle}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] min-h-[640px]">
      {/* Hidden File Input for Replace */}
      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleReplaceFileChange}
        className="hidden"
      />

      {/* State Verification Switcher (For test verification of all 4 states) */}
      <div className="mb-3 px-3 py-1.5 bg-surface-alt/70 border border-border rounded-sm flex flex-wrap items-center justify-between gap-2 text-xs font-mono select-none">
        <div className="flex items-center gap-2 text-text-muted">
          <span className="font-medium text-text">Verify state:</span>
          <button
            type="button"
            onClick={() => setStatus('ready')}
            className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
              attachment.status === 'ready'
                ? 'bg-accent text-surface font-medium'
                : 'bg-surface text-text hover:bg-border/60 border border-border'
            }`}
          >
            1. OCR Ready
          </button>
          <button
            type="button"
            onClick={() => setStatus('processing')}
            className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
              attachment.status === 'processing'
                ? 'bg-accent text-surface font-medium'
                : 'bg-surface text-text hover:bg-border/60 border border-border'
            }`}
          >
            2. Processing
          </button>
          <button
            type="button"
            onClick={() => setStatus('failed')}
            className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
              attachment.status === 'failed'
                ? 'bg-accent text-surface font-medium'
                : 'bg-surface text-text hover:bg-border/60 border border-border'
            }`}
          >
            3. Failed OCR
          </button>
          <button
            type="button"
            onClick={confirmAndAttach}
            className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
              attachment.status === 'confirmed'
                ? 'bg-accent text-surface font-medium'
                : 'bg-surface text-text hover:bg-border/60 border border-border'
            }`}
          >
            4. Confirmed
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOffline(!isOffline)}
            className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer flex items-center gap-1 ${
              isOffline
                ? 'bg-warning text-surface font-medium'
                : 'bg-surface text-text hover:bg-border/60 border border-border'
            }`}
            title="Toggle offline state simulation"
          >
            {isOffline && <WifiOff className="w-3 h-3" strokeWidth={1.5} />}
            <span>{isOffline ? 'Offline Node' : 'Online'}</span>
          </button>
        </div>
      </div>

      {/* Offline Banner if Offline */}
      {isOffline && (
        <div className="mb-3 px-3.5 py-2 bg-warning-soft/60 border border-warning/40 rounded-sm flex items-center gap-2 text-xs font-sans text-text">
          <WifiOff className="w-3.5 h-3.5 text-warning shrink-0" strokeWidth={1.5} />
          <span>
            <strong>Offline mode active.</strong> All OCR edits, confirmations, and zoom states are stored safely in local offline cache and queued for sync.
          </span>
        </div>
      )}

      {/* Inline Delete Confirmation Strip */}
      {showDeleteConfirm && (
        <div className="mb-3 p-3 bg-danger-soft border border-danger/30 rounded-sm flex items-center justify-between gap-3 text-xs font-sans">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-danger shrink-0" strokeWidth={1.5} />
            <span className="text-danger font-medium">
              Permanently delete this attachment? Extracted OCR text will also be removed.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelDelete}
              className="px-3 py-1 bg-surface text-text hover:bg-surface-alt border border-border rounded-sm cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={executeDelete}
              className="px-3 py-1 bg-danger text-surface hover:opacity-90 font-medium rounded-sm cursor-pointer transition-colors"
            >
              Delete attachment
            </button>
          </div>
        </div>
      )}

      {/* ── PAGE HEADER (spans both panes, above the split) ── */}
      <div className="bg-surface border border-border rounded-t-sm px-5 py-3.5 flex items-center justify-between gap-4 shrink-0">
        {/* Left: Back Link + File Title & Meta */}
        <div className="flex flex-col gap-1 min-w-0">
          <button
            type="button"
            onClick={() => navigate(attachment.contextLink)}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text cursor-pointer transition-colors w-fit"
          >
            <span>←</span>
            <span>{attachment.contextTitle}</span>
          </button>

          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-sans font-medium text-lg text-text tracking-tight truncate max-w-md">
              {attachment.filename}
            </h1>
            {/* Mono identity strip */}
            <div className="font-mono text-xs text-text-muted">
              {attachment.fileSizeFormatted} · {attachment.fileType.toUpperCase()} · uploaded {attachment.uploadedAtFormatted}
            </div>
          </div>
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
                ⌘Enter
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

      {/* ── SPLIT VIEW (Edge-to-edge with 1px divider, gap 0) ── */}
      <div
        ref={containerRef}
        className="flex-1 flex overflow-hidden border-x border-b border-border rounded-b-sm bg-surface"
      >
        {/* Left Pane (default 55%): Document Image */}
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

        {/* Resizable Divider (min 40%, max 70%) */}
        <PaneDivider
          splitPercent={splitPercent}
          onSplitChange={setSplitPercent}
          minPercent={40}
          maxPercent={70}
          containerRef={containerRef}
        />

        {/* Right Pane (default 45%): Editable OCR Text */}
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
            isRawMode={isRawMode}
            copied={copied}
            promotedToNotes={promotedToNotes}
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
