import React, { useState, useRef, useEffect } from 'react';
import { OcrLine as OcrLineType } from '../../features/attachments/mockOcr';
import { LowConfidenceWord } from './LowConfidenceWord';
import { Edit2, Check, X, Copy } from 'lucide-react';

export interface OcrLineProps {
  line: OcrLineType;
  isHighlighted?: boolean;
  searchQuery?: string;
  activeWordId?: string;
  onHoverLine?: (lineId: string | null) => void;
  onUpdateLine: (lineId: string, newText: string) => void;
  onAcceptSuggestion: (lineId: string, wordId: string) => void;
  onUpdateWordText: (lineId: string, wordId: string, newText: string) => void;
}

export const OcrLine: React.FC<OcrLineProps> = ({
  line,
  isHighlighted = false,
  searchQuery = '',
  activeWordId,
  onHoverLine,
  onUpdateLine,
  onAcceptSuggestion,
  onUpdateWordText,
}) => {
  const [isEditingLine, setIsEditingLine] = useState(false);
  const [lineText, setLineText] = useState(line.rawText);
  const [copiedLine, setCopiedLine] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLineText(line.rawText);
  }, [line.rawText]);

  useEffect(() => {
    if (isEditingLine && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingLine]);

  const handleSaveLine = () => {
    onUpdateLine(line.id, lineText);
    setIsEditingLine(false);
  };

  const handleCancel = () => {
    setLineText(line.rawText);
    setIsEditingLine(false);
  };

  const handleCopyLine = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(line.rawText);
      setCopiedLine(true);
      setTimeout(() => setCopiedLine(false), 1500);
    }
  };

  const hasLowConfidence = line.words.some((w) => w.lowConfidence);
  const matchesSearch =
    Boolean(searchQuery.trim()) &&
    line.rawText.toLowerCase().includes(searchQuery.trim().toLowerCase());

  return (
    <div
      onMouseEnter={() => onHoverLine?.(line.id)}
      onMouseLeave={() => onHoverLine?.(null)}
      className={`group relative flex items-start gap-3 py-1.5 px-3 rounded-sm transition-all border-l-2 ${
        isHighlighted
          ? 'bg-accent-soft/40 border-accent'
          : matchesSearch
          ? 'bg-amber-500/10 border-amber-500'
          : hasLowConfidence
          ? 'bg-terra-soft/15 border-terra/60'
          : 'hover:bg-surface-alt/60 border-transparent'
      }`}
    >
      {/* Line Number in IBM Plex Mono */}
      <span className="font-mono text-xs text-text-faint select-none w-6 pt-0.5 shrink-0 text-right group-hover:text-text-muted transition-colors">
        {line.lineNumber}
      </span>

      {/* Line Content */}
      <div className="flex-1 min-w-0">
        {isEditingLine ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={lineText}
              onChange={(e) => setLineText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveLine();
                if (e.key === 'Escape') handleCancel();
              }}
              className="flex-1 h-8 px-2.5 bg-surface border border-border text-text font-serif text-[15px] rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
            <button
              type="button"
              onClick={handleSaveLine}
              className="h-8 px-2.5 flex items-center gap-1 bg-accent text-surface hover:bg-accent-hover rounded-sm text-xs font-medium cursor-pointer transition-colors"
              title="Save line (Enter)"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="h-8 px-2 flex items-center justify-center text-text-muted hover:text-text border border-border rounded-sm cursor-pointer transition-colors"
              title="Cancel (Esc)"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <div className="font-serif text-[15px] leading-relaxed text-text flex flex-wrap items-center">
            {line.words.map((word, idx) => (
              <React.Fragment key={word.id}>
                <LowConfidenceWord
                  word={word}
                  lineId={line.id}
                  isActiveIssue={activeWordId === word.id}
                  onAcceptSuggestion={onAcceptSuggestion}
                  onUpdateWordText={onUpdateWordText}
                />
                {idx < line.words.length - 1 && <span className="inline select-none">&nbsp;</span>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Hover action toolbar for the line */}
      {!isEditingLine && (
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 pt-0.5 transition-opacity">
          <button
            type="button"
            onClick={handleCopyLine}
            className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-text hover:bg-surface rounded-sm cursor-pointer transition-colors"
            title={copiedLine ? 'Copied!' : 'Copy line'}
          >
            {copiedLine ? (
              <Check className="w-3 h-3 text-accent" strokeWidth={2} />
            ) : (
              <Copy className="w-3 h-3" strokeWidth={1.5} />
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsEditingLine(true)}
            className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-text hover:bg-surface rounded-sm cursor-pointer transition-colors"
            title="Edit line"
          >
            <Edit2 className="w-3 h-3" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
};
