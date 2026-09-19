import React, { useState, useRef, useEffect } from 'react';
import { OcrLine as OcrLineType } from '../../features/attachments/mockOcr';
import { LowConfidenceWord } from './LowConfidenceWord';
import { Edit2, Check, X } from 'lucide-react';

export interface OcrLineProps {
  line: OcrLineType;
  onUpdateLine: (lineId: string, newText: string) => void;
  onAcceptSuggestion: (lineId: string, wordId: string) => void;
  onUpdateWordText: (lineId: string, wordId: string, newText: string) => void;
}

export const OcrLine: React.FC<OcrLineProps> = ({
  line,
  onUpdateLine,
  onAcceptSuggestion,
  onUpdateWordText,
}) => {
  const [isEditingLine, setIsEditingLine] = useState(false);
  const [lineText, setLineText] = useState(line.rawText);
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

  const hasLowConfidence = line.words.some((w) => w.lowConfidence);

  return (
    <div
      className={`group flex items-start gap-3 py-1 px-2 rounded-sm transition-colors ${
        hasLowConfidence ? 'bg-terra-soft/10' : 'hover:bg-surface-alt/50'
      }`}
    >
      {/* Line Number in IBM Plex Mono */}
      <span className="font-mono text-xs text-text-faint select-none w-6 pt-1 shrink-0 text-right">
        {line.lineNumber}
      </span>

      {/* Line Content */}
      <div className="flex-1 min-w-0">
        {isEditingLine ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={lineText}
              onChange={(e) => setLineText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveLine();
                if (e.key === 'Escape') handleCancel();
              }}
              className="flex-1 h-8 px-2.5 bg-surface border border-border text-text font-serif text-[15px] rounded-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
            />
            <button
              type="button"
              onClick={handleSaveLine}
              className="w-7 h-7 flex items-center justify-center bg-accent text-surface hover:bg-accent-hover rounded-sm cursor-pointer"
              title="Save line"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text rounded-sm cursor-pointer"
              title="Cancel"
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
                  onAcceptSuggestion={onAcceptSuggestion}
                  onUpdateWordText={onUpdateWordText}
                />
                {idx < line.words.length - 1 && <span className="inline"> </span>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Edit Line Button on hover */}
      {!isEditingLine && (
        <button
          type="button"
          onClick={() => setIsEditingLine(true)}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-text-faint hover:text-text rounded-sm transition-opacity cursor-pointer shrink-0"
          title="Edit entire line"
        >
          <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
};
