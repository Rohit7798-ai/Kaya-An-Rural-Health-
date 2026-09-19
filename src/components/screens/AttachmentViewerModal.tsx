import React, { useState } from 'react';
import { Button } from '../common/Button';
import { X, Check, FileText, Image as ImageIcon } from 'lucide-react';

interface AttachmentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageTitle: string;
  initialOcrText: string;
  onConfirmText: (extractedText: string) => void;
}

export const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageTitle,
  initialOcrText,
  onConfirmText,
}) => {
  const [extractedText, setExtractedText] = useState(initialOcrText);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirmText(extractedText);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Attachment & OCR Viewer"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-4xl h-[85vh] bg-[var(--surface)] border border-[var(--border)] rounded-[8px] flex flex-col modal-hairline-shadow text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
            <h2 className="text-[17px] font-semibold text-[var(--text)]">
              Paper Register OCR Extraction
            </h2>
            <span className="text-[13px] text-[var(--text-muted)] ml-2 truncate">
              {imageTitle}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-alt)] cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Split View: Image on Left (50%) | OCR Extracted text on Right (50%) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)] overflow-hidden">
          {/* Left: Scanned paper note or photo */}
          <div className="p-4 overflow-y-auto flex flex-col bg-[var(--bg)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Original Document / Clinical Slip
              </span>
              <span className="text-[11px] font-mono-tabular text-[var(--text-faint)]">
                Paper Register Scan
              </span>
            </div>

            <div className="flex-1 min-h-[300px] border border-[var(--border)] rounded-[6px] bg-[var(--surface)] flex flex-col items-center justify-center p-4 overflow-hidden relative">
              {imageUrl.startsWith('data:') || imageUrl.startsWith('http') ? (
                <img
                  src={imageUrl}
                  alt={imageTitle}
                  className="max-h-full max-w-full object-contain rounded-[4px]"
                />
              ) : (
                /* Calm clinical paper slip simulation */
                <div className="w-full max-w-sm p-5 bg-[#FBF7EE] border border-[#DCD3C1] text-[#2C2720] font-clinical-notes text-[14px] leading-relaxed shadow-none">
                  <div className="border-b border-[#DCD3C1] pb-2 mb-3 text-center">
                    <p className="font-semibold text-[13px] uppercase tracking-wider font-mono-tabular">
                      Primary Health Sub-Centre Register Slip
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono-tabular">
                      Date: 19/09/2026 · Outpatient Ward
                    </p>
                  </div>
                  <div className="space-y-2 text-[13px]">
                    <p>
                      <strong>Pt:</strong> Anandi Devi, 48 F, Rampur
                    </p>
                    <p>
                      <strong>BP:</strong> 154/96 mmHg · <strong>Pulse:</strong> 78/min
                    </p>
                    <p>
                      <strong>C/o:</strong> Morning occipital headache x 4 days. Missed HTN pills.
                    </p>
                    <p>
                      <strong>Rx:</strong> Tab Amlodipine 5mg 1 tab OD morning x 30d
                    </p>
                    <p>
                      <strong>Adv:</strong> Reduce salt intake. Follow up in 2 weeks.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#DCD3C1] text-right text-[11px] font-mono-tabular text-[var(--text-muted)]">
                    Dr. Signed: A. Rao
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: OCR-extracted text (editable) */}
          <div className="p-4 flex flex-col bg-[var(--surface)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--accent)] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                OCR Extracted Text (Editable)
              </span>
              <span className="text-[12px] text-[var(--text-muted)]">
                Review and edit before saving
              </span>
            </div>

            <textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              className="flex-1 w-full p-3 font-clinical-notes text-[15px] leading-relaxed bg-[var(--bg)] border border-[var(--border)] rounded-[6px] focus:border-[var(--accent)] text-[var(--text)] resize-none"
              placeholder="OCR extracted text will appear here…"
            />

            <p className="text-[12px] text-[var(--text-muted)] mt-2">
              Clicking "Confirm text" will append or replace into the active clinical visit note.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--border)] flex items-center justify-end gap-3 bg-[var(--surface)]">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleConfirm}
            icon={<Check className="w-4 h-4" />}
          >
            Confirm text
          </Button>
        </div>
      </div>
    </div>
  );
};
