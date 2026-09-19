import React, { useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { DictationStrip } from './DictationStrip';
import { useDictation } from '../../features/visits/useDictation';

export interface NotesTextareaProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (value: string) => void;
  isForceListening?: boolean; // For demo / test states
}

export const NotesTextarea: React.FC<NotesTextareaProps> = ({
  id,
  label,
  value,
  placeholder,
  rows = 3,
  onChange,
  isForceListening = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert text handler
  const handleInsertDictation = (textToInsert: string) => {
    if (!textToInsert) return;
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value ? `${value}\n${textToInsert}` : textToInsert);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const before = value.substring(0, start);
    const after = value.substring(end);

    const separator = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : '';
    const updated = `${before}${separator}${textToInsert}${after}`;
    onChange(updated);

    // Reposition cursor
    setTimeout(() => {
      const newPos = start + separator.length + textToInsert.length;
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    }, 20);
  };

  const {
    isListening: internalListening,
    transcript,
    durationSeconds,
    startListening,
    stopListening,
    cancelListening,
  } = useDictation(handleInsertDictation);

  const isListening = isForceListening || internalListening;

  const handleToggleDictate = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const formattedSeconds = String(durationSeconds % 60).padStart(2, '0');
  const formattedMinutes = String(Math.floor(durationSeconds / 60)).padStart(2, '0');

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label row with attached right [ 🎙 Dictate ] */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="font-sans text-xs font-medium text-text select-none"
        >
          {label}
        </label>

        {/* Dictate toggle button */}
        <button
          type="button"
          onClick={handleToggleDictate}
          className={`h-7 px-2.5 inline-flex items-center gap-1.5 font-sans text-xs rounded-sm transition-colors cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
            isListening
              ? 'bg-accent/15 text-accent border border-accent font-medium'
              : 'text-text-muted hover:text-text hover:bg-surface-alt border border-transparent'
          }`}
        >
          {isListening ? (
            <>
              <Square className="w-3 h-3 text-accent fill-accent shrink-0 animate-pulse" />
              <span className="font-mono tabular-nums text-xs">
                Listening… {formattedMinutes}:{formattedSeconds}
              </span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
              <span>Dictate</span>
            </>
          )}
        </button>
      </div>

      {/* Textarea with Lora serif input text */}
      <textarea
        id={id}
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full p-2.5 bg-surface text-text font-serif text-sm rounded-sm border transition-colors duration-120 resize-none focus-visible:outline focus-visible:outline-2 ${
          isListening
            ? 'border-accent focus-visible:outline-accent'
            : 'border-border focus-visible:outline-accent'
        }`}
      />

      {/* Dictation Strip inline under textarea when active */}
      {isListening && (
        <DictationStrip
          transcript={transcript}
          onCancel={cancelListening}
          onInsert={stopListening}
        />
      )}
    </div>
  );
};
