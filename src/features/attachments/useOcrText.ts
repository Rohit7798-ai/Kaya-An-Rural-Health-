import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { AttachmentRecord, OcrLine, OcrWord } from './mockOcr';

export interface UseOcrTextOptions {
  initialAttachment: AttachmentRecord;
  onAttachmentUpdate?: (updated: AttachmentRecord) => void;
}

export interface LowConfidenceIssue {
  index: number;
  lineId: string;
  lineNumber: number;
  word: OcrWord;
}

export interface ClinicalFinding {
  id: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'elevated' | 'low' | 'neutral';
  statusLabel: string;
}

export function useOcrText({ initialAttachment, onAttachmentUpdate }: UseOcrTextOptions) {
  const [lines, setLines] = useState<OcrLine[]>(initialAttachment.lines);
  const [rawText, setRawText] = useState<string>(initialAttachment.rawText);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isRawMode, setIsRawMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'lines' | 'table' | 'raw'>('lines');
  const [copied, setCopied] = useState<boolean>(false);
  const [promotedToNotes, setPromotedToNotes] = useState<boolean>(false);

  // Cross-highlighting & active navigation
  const [highlightedLineId, setHighlightedLineId] = useState<string | null>(null);
  const [activeIssueIndex, setActiveIssueIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when initialAttachment changes
  useEffect(() => {
    setLines(initialAttachment.lines);
    setRawText(initialAttachment.rawText);
    setActiveIssueIndex(0);
  }, [initialAttachment.id]);

  // Keep isRawMode in sync with viewMode
  useEffect(() => {
    if (viewMode === 'raw') {
      setIsRawMode(true);
    } else {
      setIsRawMode(false);
    }
  }, [viewMode]);

  // Compile list of low-confidence issues for stepper
  const lowConfidenceIssues: LowConfidenceIssue[] = useMemo(() => {
    const issues: LowConfidenceIssue[] = [];
    let idx = 0;
    lines.forEach((line) => {
      line.words.forEach((word) => {
        if (word.lowConfidence) {
          issues.push({
            index: idx,
            lineId: line.id,
            lineNumber: line.lineNumber,
            word,
          });
          idx++;
        }
      });
    });
    return issues;
  }, [lines]);

  const lowConfidenceCount = lowConfidenceIssues.length;

  // Ensure activeIssueIndex remains in bounds
  useEffect(() => {
    if (lowConfidenceIssues.length === 0) {
      setActiveIssueIndex(0);
    } else if (activeIssueIndex >= lowConfidenceIssues.length) {
      setActiveIssueIndex(Math.max(0, lowConfidenceIssues.length - 1));
    }
  }, [lowConfidenceIssues.length, activeIssueIndex]);

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

  // Accept a suggestion for a single low-confidence word
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
      triggerAutosave(updatedLines, newRaw);
    },
    [lines, triggerAutosave]
  );

  // Accept all suggestions at once
  const acceptAllSuggestions = useCallback(() => {
    const updatedLines = lines.map((l) => {
      const newWords = l.words.map((w) => {
        if (!w.lowConfidence) return w;
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
    setActiveIssueIndex(0);
    triggerAutosave(updatedLines, newRaw);
  }, [lines, triggerAutosave]);

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
    setSaveStatus('saved');
    setActiveIssueIndex(0);
    if (onAttachmentUpdate) {
      onAttachmentUpdate(initialAttachment);
    }
  }, [initialAttachment, onAttachmentUpdate]);

  // Copy text to clipboard
  const copyText = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [rawText]);

  // Promote to clinical notes
  const promoteToClinicalNotes = useCallback(() => {
    const existing = sessionStorage.getItem('kaya_pending_clinical_notes') || '';
    const formattedNotes = `\n--- ATTACHED OCR TRANSCRIPT (${initialAttachment.documentType}) ---\n${rawText}\n`;
    sessionStorage.setItem('kaya_pending_clinical_notes', existing + formattedNotes);
    setPromotedToNotes(true);
    setTimeout(() => setPromotedToNotes(false), 3000);
  }, [rawText, initialAttachment.documentType]);

  // Stepper controls
  const goToNextIssue = useCallback(() => {
    if (lowConfidenceIssues.length === 0) return;
    setActiveIssueIndex((prev) => {
      const nextIdx = (prev + 1) % lowConfidenceIssues.length;
      setHighlightedLineId(lowConfidenceIssues[nextIdx].lineId);
      return nextIdx;
    });
  }, [lowConfidenceIssues]);

  const goToPrevIssue = useCallback(() => {
    if (lowConfidenceIssues.length === 0) return;
    setActiveIssueIndex((prev) => {
      const prevIdx = (prev - 1 + lowConfidenceIssues.length) % lowConfidenceIssues.length;
      setHighlightedLineId(lowConfidenceIssues[prevIdx].lineId);
      return prevIdx;
    });
  }, [lowConfidenceIssues]);

  const currentIssue = lowConfidenceIssues[activeIssueIndex] || null;

  // Structured extraction for medical documents (Lipid Profile, CBC, Vitals, etc.)
  const parsedClinicalFindings: ClinicalFinding[] = useMemo(() => {
    const findings: ClinicalFinding[] = [];

    // Check lines for known clinical lab test patterns
    lines.forEach((line) => {
      const text = line.rawText;

      // Pattern: Total Cholesterol: 184 mg/dL [Desirable < 200 mg/dL]
      const lipidMatch = text.match(/(Total Cholesterol|Serum Triglycerides|HDL Cholesterol|LDL Cholesterol|VLDL Cholesterol|Total \/ HDL Ratio)\s*:\s*([\d\.]+)\s*([a-zA-Z\/]*)\s*(\[.*?\])?/i);
      if (lipidMatch) {
        const testName = lipidMatch[1];
        const valNum = parseFloat(lipidMatch[2]);
        const valStr = lipidMatch[2];
        const unit = lipidMatch[3] || 'mg/dL';
        const refRange = lipidMatch[4] ? lipidMatch[4].replace(/[\[\]]/g, '') : '';

        let status: 'normal' | 'elevated' | 'low' | 'neutral' = 'normal';
        let statusLabel = 'Normal';

        if (testName.toLowerCase().includes('total cholesterol')) {
          if (valNum >= 200) { status = 'elevated'; statusLabel = 'Borderline High'; }
        } else if (testName.toLowerCase().includes('triglycerides')) {
          if (valNum >= 150) { status = 'elevated'; statusLabel = 'High'; }
        } else if (testName.toLowerCase().includes('hdl')) {
          if (valNum < 50) { status = 'low'; statusLabel = 'Below Target'; }
        } else if (testName.toLowerCase().includes('ldl')) {
          if (valNum >= 100) { status = 'elevated'; statusLabel = 'Borderline High'; }
        }

        findings.push({
          id: line.id,
          testName,
          value: valStr,
          unit,
          referenceRange: refRange,
          status,
          statusLabel,
        });
      }
    });

    return findings;
  }, [lines]);

  return {
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
    setActiveIssueIndex,
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
  };
}
