import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Paperclip, Camera, FileText, Image as ImageIcon, X, RefreshCw, Check, ExternalLink } from 'lucide-react';
import { AttachmentItem } from '../../features/visits/useAttachments';

export interface AttachmentListProps {
  attachments: AttachmentItem[];
  onAddAttachment: (file: { name: string; sizeBytes: number; type: string }) => void;
  onRemoveAttachment: (id: string) => void;
  onToggleOcrExpand: (id: string) => void;
  onUpdateOcrText: (id: string, text: string) => void;
  onSetEditingOcr: (id: string, isEditing: boolean) => void;
  onRetryAttachment: (id: string) => void;
  onPromoteOcrText: (text: string) => void;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  onToggleOcrExpand,
  onUpdateOcrText,
  onSetEditingOcr,
  onRetryAttachment,
  onPromoteOcrText,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      onAddAttachment({
        name: file.name,
        sizeBytes: file.size,
        type: file.type,
      });
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.heic"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Two affordances side by side */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="h-9 px-3.5 inline-flex items-center gap-2 bg-surface hover:bg-surface-alt border border-border text-xs font-sans font-medium text-text rounded-sm transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Paperclip className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
          <span>Upload file</span>
        </button>

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="h-9 px-3.5 inline-flex items-center gap-2 bg-surface hover:bg-surface-alt border border-border text-xs font-sans font-medium text-text rounded-sm transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Camera className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
          <span>Take photo</span>
        </button>
      </div>

      {/* List of attached items */}
      {attachments.length === 0 ? (
        <p className="font-sans text-xs text-text-muted">No attachments added yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border/60 border border-border rounded-sm bg-surface">
          {attachments.map((item) => {
            return (
              <div key={item.id} className="p-3 flex flex-col gap-2.5">
                {/* Main item row */}
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Thumbnail + Name + Meta */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Thumbnail (48x48, 1px border, radius 4px) */}
                    <div className="w-12 h-12 rounded-[4px] border border-border bg-surface-alt flex items-center justify-center shrink-0">
                      {item.type === 'pdf' ? (
                        <FileText className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
                      )}
                    </div>

                    {/* Name + details */}
                    <div className="flex flex-col min-w-0">
                      <Link
                        to={`/attachments/${item.id}`}
                        className="font-sans font-medium text-sm text-text hover:text-accent truncate hover:underline"
                        title="Open split OCR viewer"
                      >
                        {item.filename}
                      </Link>
                      <span className="font-mono text-xs text-text-muted tabular-nums mt-0.5">
                        {item.size} · {item.uploadTime}
                      </span>
                    </div>
                  </div>

                  {/* Right: Status Pill + Split Viewer Link + Remove X */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/attachments/${item.id}`}
                      className="h-7 px-2 inline-flex items-center gap-1 font-sans text-xs text-text-muted hover:text-text rounded-sm border border-border bg-surface hover:bg-surface-alt transition-colors"
                      title="Open in split-view OCR editor"
                    >
                      <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                      <span>Review OCR</span>
                    </Link>

                    {/* Status pill */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium ${
                        item.status === 'OCR ready'
                          ? 'bg-accent-soft text-accent border border-accent/30 cursor-pointer'
                          : item.status === 'Uploading'
                          ? 'bg-surface-alt text-text-muted border border-border'
                          : item.status === 'Failed'
                          ? 'bg-danger-soft text-danger border border-danger/30'
                          : 'bg-surface-alt text-text font-sans'
                      }`}
                      onClick={() => item.ocrText && onToggleOcrExpand(item.id)}
                    >
                      {item.status}
                    </span>

                    {/* If failed: retry button */}
                    {item.status === 'Failed' && (
                      <button
                        type="button"
                        onClick={() => onRetryAttachment(item.id)}
                        className="h-7 px-2 inline-flex items-center gap-1 font-sans text-xs text-text-muted hover:text-text rounded-sm border border-border bg-surface"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}

                    {/* Ghost X to remove */}
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(item.id)}
                      title="Remove attachment"
                      aria-label="Remove attachment"
                      className="h-7 w-7 flex items-center justify-center text-text-muted hover:text-danger rounded-sm transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Expanded OCR text area (if item has OCR text ready and expanded) */}
                {item.ocrText && item.ocrExpanded && (
                  <div className="ml-15 pl-3 border-l-2 border-accent/40 flex flex-col gap-2 bg-surface-alt/40 p-2.5 rounded-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[11px] uppercase tracking-[0.04em] text-text-muted font-medium">
                        OCR text
                      </span>

                      {/* Action buttons: Confirm text / Edit */}
                      <div className="flex items-center gap-2">
                        {item.isEditingOcr ? (
                          <button
                            type="button"
                            onClick={() => onSetEditingOcr(item.id, false)}
                            className="font-sans text-xs text-accent hover:underline cursor-pointer"
                          >
                            Done editing
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSetEditingOcr(item.id, true)}
                            className="font-sans text-xs text-text-muted hover:text-text cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (item.ocrText) {
                              onPromoteOcrText(item.ocrText);
                            }
                          }}
                          className="inline-flex items-center gap-1 font-sans text-xs font-medium text-accent hover:text-accent-hover bg-surface px-2 py-0.5 rounded-sm border border-accent/30 cursor-pointer"
                        >
                          <Check className="w-3 h-3 text-accent" />
                          <span>Confirm text</span>
                        </button>
                      </div>
                    </div>

                    {/* OCR Text display / edit */}
                    {item.isEditingOcr ? (
                      <textarea
                        rows={3}
                        value={item.ocrText}
                        onChange={(e) => onUpdateOcrText(item.id, e.target.value)}
                        className="w-full p-2 bg-surface text-text font-serif text-xs rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                      />
                    ) : (
                      <p className="font-serif text-xs text-text leading-relaxed whitespace-pre-line line-clamp-4">
                        {item.ocrText}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
