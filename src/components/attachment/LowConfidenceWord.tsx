import React, { useState, useRef, useEffect } from 'react';
import { OcrWord } from '../../features/attachments/mockOcr';
import { Check, Edit2, X, Sparkles, ArrowRight } from 'lucide-react';

export interface LowConfidenceWordProps {
  word: OcrWord;
  lineId: string;
  isActiveIssue?: boolean;
  onAcceptSuggestion: (lineId: string, wordId: string) => void;
  onUpdateWordText: (lineId: string, wordId: string, newText: string) => void;
}

export const LowConfidenceWord: React.FC<LowConfidenceWordProps> = ({
  word,
  lineId,
  isActiveIssue = false,
  onAcceptSuggestion,
  onUpdateWordText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(word.text);
  const popoverRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditText(word.text);
  }, [word.text]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setIsEditing(false);
    }
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editText.trim()) {
      onUpdateWordText(lineId, word.id, editText.trim());
    }
    setIsEditing(false);
    setIsOpen(false);
  };

  const handleAccept = () => {
    onAcceptSuggestion(lineId, word.id);
    setIsOpen(false);
  };

  const confidencePercent = Math.round(word.confidence * 100);

  if (!word.lowConfidence) {
    return <span className="text-text">{word.text}</span>;
  }

  return (
    <span className="relative inline-block mx-0.5" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`px-1 py-0.5 rounded-sm cursor-pointer transition-all border-b-2 font-medium ${
          isActiveIssue
            ? 'bg-terra text-surface border-terra shadow-sm ring-2 ring-terra/30'
            : 'bg-terra-soft/30 text-terra-dark border-dotted border-terra hover:bg-terra-soft/60'
        }`}
        title={`Low confidence (${confidencePercent}%) — Click to review`}
        aria-expanded={isOpen}
      >
        {word.text}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="OCR Word Review"
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-72 bg-surface border border-border rounded-sm p-3.5 font-sans text-xs text-text shadow-lg animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-border">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-terra shrink-0" />
              <span className="font-mono text-[11px] text-text-muted">
                Confidence <strong className="text-terra font-semibold">{confidencePercent}%</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text rounded-sm cursor-pointer transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Body */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-2">
              <label className="text-[11px] font-mono text-text-muted">
                Correct word transcription:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  className="flex-1 h-8 px-2.5 bg-surface-alt border border-border rounded-sm text-text font-serif text-[14px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                />
                <button
                  type="submit"
                  className="h-8 px-2.5 bg-accent text-surface hover:bg-accent-hover font-medium rounded-sm flex items-center gap-1 cursor-pointer transition-colors"
                  title="Save change"
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Save</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-2.5">
              {/* OCR Scanned vs Suggested Comparison */}
              <div className="p-2 bg-surface-alt/70 border border-border/80 rounded-sm flex items-center justify-between gap-2 font-mono text-[11px]">
                <div className="flex flex-col min-w-0">
                  <span className="text-text-faint text-[10px]">Scanned:</span>
                  <span className="text-terra font-medium truncate line-through opacity-85">
                    {word.originalText}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-text-faint shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-text-faint text-[10px]">Suggested:</span>
                  <span className="text-accent font-semibold truncate">
                    {word.suggestion || word.text}
                  </span>
                </div>
              </div>

              {/* Actions: Accept Suggestion vs Edit Manually */}
              <div className="flex items-center gap-1.5 pt-1">
                {word.suggestion && (
                  <button
                    type="button"
                    onClick={handleAccept}
                    className="flex-1 h-8 px-2.5 bg-accent text-surface hover:bg-accent-hover font-medium rounded-sm inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-xs"
                  >
                    <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                    <span>Accept suggestion</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="h-8 px-2.5 bg-surface hover:bg-surface-alt text-text border border-border rounded-sm inline-flex items-center justify-center gap-1 cursor-pointer transition-colors text-xs"
                  title="Edit word manually"
                >
                  <Edit2 className="w-3 h-3 text-text-muted" strokeWidth={1.5} />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  );
};
