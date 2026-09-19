import { useState, useCallback, useEffect, useRef } from 'react';
import { AttachmentRecord, OcrLine, OcrWord } from './mockOcr';

export interface UseOcrTextOptions {
  initialAttachment: AttachmentRecord;
  onAttachmentUpdate?: (updated: AttachmentRecord) => void;
}

export function useOcrText({ initialAttachment, onAttachmentUpdate }: UseOcrTextOptions) {
  const [lines, setLines] = useState<OcrLine[]>(initialAttachment.lines);
  const [rawText, setRawText] = useState<string>(initialAttachment.rawText);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [selectedWord, setSelectedWord] = useState<{ lineId: string; word: OcrWord } | null>(null);
  const [isRawMode, setIsRawMode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [promotedToNotes, setPromotedToNotes] = useState<boolean>(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync if initialAttachment changes drastically
  useEffect(() => {
    setLines(initialAttachment.lines);
    setRawText(initialAttachment.rawText);
  }, [initialAttachment.id]);

  // Compute stats
  const lowConfidenceCount = lines.reduce(
    (acc, line) => acc + line.words.filter((w) => w.lowConfidence).length,
    0
  );

  // Debounced autosave
  const triggerAutosave = useCallback(
    (updatedLines: OcrLine[], updatedRaw: string) => {
      setSaveStatus('saving');
      setIsDirty(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(() => {
        setSaveStatus('saved');
        if (onAttachmentUpdate) {
          onAttachmentUpdate({
            ...initialAttachment,
            lines: updatedLines,
            rawText: updatedRaw,
          });
        }
      }, 350);
    },
    [initialAttachment, onAttachmentUpdate]
  );

  // Accept a suggestion for a low-confidence word
  const acceptSuggestion = useCallback(
    (lineId: string, wordId: string) => {
      const updatedLines = lines.map((l) => {
        if (l.id !== lineId) return l;
        const newWords = l.words.map((w) => {
          if (w.id !== wordId) return w;
          const replacement = w.suggestion || w.text;
          return {
            ...w,
            text: replacement,
            lowConfidence: false,
            confidence: 0.99,
          };
        });
        const newRawText = newWords.map((w) => w.text).join(' ');
        return {
          ...l,
          words: newWords,
          rawText: newRawText,
        };
      });

      const newRaw = updatedLines.map((l) => l.rawText).join('\n');
      setLines(updatedLines);
      setRawText(newRaw);
      setSelectedWord(null);
      triggerAutosave(updatedLines, newRaw);
    },
    [lines, triggerAutosave]
  );

  // Update a single word
  const updateWordText = useCallback(
    (lineId: string, wordId: string, newText: string) => {
      const updatedLines = lines.map((l) => {
        if (l.id !== lineId) return l;
        const newWords = l.words.map((w) => {
          if (w.id !== wordId) return w;
          return {
            ...w,
            text: newText,
            lowConfidence: false,
            confidence: 1.0,
          };
        });
        const newRawText = newWords.map((w) => w.text).join(' ');
        return {
          ...l,
          words: newWords,
          rawText: newRawText,
        };
      });

      const newRaw = updatedLines.map((l) => l.rawText).join('\n');
      setLines(updatedLines);
      setRawText(newRaw);
      setSelectedWord(null);
      triggerAutosave(updatedLines, newRaw);
    },
    [lines, triggerAutosave]
  );

  // Update whole line text
  const updateLine = useCallback(
    (lineId: string, newText: string) => {
      const updatedLines = lines.map((l) => {
        if (l.id !== lineId) return l;
        const tokenizedWords: OcrWord[] = newText.split(/\s+/).filter(Boolean).map((wordStr, idx) => ({
          id: `${l.id}-w${idx}`,
          text: wordStr,
          confidence: 1.0,
          lowConfidence: false,
          originalText: wordStr,
        }));
        return {
          ...l,
          rawText: newText,
          words: tokenizedWords,
        };
      });

      const newRaw = updatedLines.map((l) => l.rawText).join('\n');
      setLines(updatedLines);
      setRawText(newRaw);
      triggerAutosave(updatedLines, newRaw);
    },
    [lines, triggerAutosave]
  );

  // Update full raw text
  const updateFullRawText = useCallback(
    (newText: string) => {
      setRawText(newText);
      const rawLines = newText.split('\n');
      const updatedLines: OcrLine[] = rawLines.map((lineStr, idx) => {
        const lineId = lines[idx]?.id || `l-${idx + 1}`;
        const words = lineStr.split(/\s+/).filter(Boolean).map((wordStr, wIdx) => ({
          id: `${lineId}-w${wIdx}`,
          text: wordStr,
          confidence: 1.0,
          lowConfidence: false,
          originalText: wordStr,
        }));
        return {
          id: lineId,
          lineNumber: idx + 1,
          rawText: lineStr,
          words,
          confidence: 1.0,
        };
      });

      setLines(updatedLines);
      triggerAutosave(updatedLines, newText);
    },
    [lines, triggerAutosave]
  );

  // Reset to original mock text
  const resetToOriginal = useCallback(() => {
    setLines(initialAttachment.lines);
    setRawText(initialAttachment.rawText);
    setIsDirty(false);
    setSelectedWord(null);
    setSaveStatus('saved');
    if (onAttachmentUpdate) {
      onAttachmentUpdate(initialAttachment);
    }
  }, [initialAttachment, onAttachmentUpdate]);

  // Copy text to clipboard
  const copyText = useCallback(async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(rawText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard write failed, using fallback', e);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [rawText]);

  // Promote to clinical notes (inserts into active visit draft in localStorage)
  const promoteToClinicalNotes = useCallback(() => {
    try {
      const existingDraft = localStorage.getItem('kaya_visit_draft_vis-101');
      let combined = rawText;
      if (existingDraft) {
        const parsed = JSON.parse(existingDraft);
        combined = parsed.clinicalNotes ? `${parsed.clinicalNotes}\n\n[Attached OCR]:\n${rawText}` : rawText;
        parsed.clinicalNotes = combined;
        localStorage.setItem('kaya_visit_draft_vis-101', JSON.stringify(parsed));
      }
      setPromotedToNotes(true);
      setTimeout(() => setPromotedToNotes(false), 3000);
    } catch (e) {
      console.error('Failed to promote to notes', e);
    }
  }, [rawText]);

  return {
    lines,
    rawText,
    saveStatus,
    isDirty,
    lowConfidenceCount,
    selectedWord,
    setSelectedWord,
    isRawMode,
    setIsRawMode,
    copied,
    promotedToNotes,
    acceptSuggestion,
    updateWordText,
    updateLine,
    updateFullRawText,
    resetToOriginal,
    copyText,
    promoteToClinicalNotes,
  };
}
