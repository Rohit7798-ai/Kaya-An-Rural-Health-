import React, { useState, useRef, useEffect } from 'react';
import { OcrWord } from '../../features/attachments/mockOcr';
import { Check, Edit2, X } from 'lucide-react';

export interface LowConfidenceWordProps {
  word: OcrWord;
  lineId: string;
  onAcceptSuggestion: (lineId: string, wordId: string) => void;
  onUpdateWordText: (lineId: string, wordId: string, newText: string) => void;
}

export const LowConfidenceWord: React.FC<LowConfidenceWordProps> = ({
  word,
  lineId,
  onAcceptSuggestion,
  onUpdateWordText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(word.text);
  const popoverRef = useRef<HTMLDivElement>(null);
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

  const confidencePercent = Math.round(word.confidence * 100);

  if (!word.lowConfidence) {
    return <span>{word.text}</span>;
  }

  return (
    <span className="relative inline-block mx-0.5" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="border-b border-dotted border-terra hover:bg-terra-soft/30 text-text cursor-pointer transition-colors px-0.5 rounded-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-terra"
        title={`Low confidence (${confidencePercent}%) — Click to review`}
        aria-expanded={isOpen}
      >
        {word.text}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="OCR Word Review"
          className="absolute left-0 bottom-full mb-1.5 z-40 w-64 bg-surface border border-border rounded-sm p-3 font-sans text-xs text-text shadow-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-terra shrink-0" />
              <span className="font-mono text-[11px] text-text-muted">
                Confidence <strong className="text-terra font-medium">{confidencePercent}%</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text rounded-sm cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Body */}
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <label className="text-[11px] text-text-muted">Correction:</label>
              <input
                ref={inputRef}
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onUpdateWordText(lineId, word.id, editText.trim());
                    setIsOpen(false);
                    setIsEditing(false);
                  } else if (e.key === 'Escape') {
                    setIsEditing(false);
                  }
                }}
                className="w-full h-8 px-2 bg-surface-alt border border-border text-text font-serif text-sm rounded-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 text-text-muted hover:text-text rounded-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateWordText(lineId, word.id, editText.trim());
                    setIsOpen(false);
                    setIsEditing(false);
                  }}
                  className="px-2.5 py-1 bg-accent text-surface hover:bg-accent-hover rounded-sm font-medium cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-[11px] text-text-muted">
                Original OCR reading:{' '}
                <span className="font-mono text-text bg-surface-alt px-1 py-0.5 rounded-sm">
                  {word.originalText}
                </span>
              </div>

              {word.suggestion && (
                <div className="flex items-center justify-between gap-2 p-1.5 bg-accent-soft border border-border rounded-sm">
                  <div className="min-w-0">
                    <span className="block text-[10px] text-text-muted uppercase tracking-wider">Suggested fix</span>
                    <span className="font-serif font-medium text-text text-sm truncate">
                      {word.suggestion}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAcceptSuggestion(lineId, word.id)}
                    className="h-7 px-2 inline-flex items-center gap-1 bg-accent text-surface hover:bg-accent-hover rounded-sm text-xs font-medium cursor-pointer shrink-0"
                  >
                    <Check className="w-3 h-3" strokeWidth={1.5} />
                    <span>Apply</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 text-text hover:text-accent font-medium cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" strokeWidth={1.5} />
                  <span>Edit manually</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateWordText(lineId, word.id, word.text);
                    setIsOpen(false);
                  }}
                  className="text-[11px] text-text-muted hover:text-text cursor-pointer"
                >
                  Accept as is
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  );
};
