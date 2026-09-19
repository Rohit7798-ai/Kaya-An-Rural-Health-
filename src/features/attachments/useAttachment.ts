import { useState, useCallback, useEffect } from 'react';
import { AttachmentRecord, getAttachmentById } from './mockOcr';

export interface UseAttachmentOptions {
  id: string;
  initialStatus?: 'ready' | 'processing' | 'failed' | 'confirmed';
}

export function useAttachment({ id, initialStatus }: UseAttachmentOptions) {
  const [attachment, setAttachment] = useState<AttachmentRecord>(() => {
    // Check localStorage first
    const saved = localStorage.getItem(`kaya_att_${id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (initialStatus) parsed.status = initialStatus;
        return parsed;
      } catch (e) {
        console.error('Failed to parse cached attachment', e);
      }
    }
    const initial = getAttachmentById(id);
    if (initialStatus) initial.status = initialStatus;
    return initial;
  });

  // Pan & Zoom state
  const [zoom, setZoom] = useState<number>(100);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Inline confirmations
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Autosave attachment state to localStorage
  useEffect(() => {
    if (!isDeleted) {
      localStorage.setItem(`kaya_att_${attachment.id}`, JSON.stringify(attachment));
    }
  }, [attachment, isDeleted]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(300, prev + 25));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(50, prev - 25));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  }, []);

  const fitToWidth = useCallback(() => {
    setZoom(110);
    setPan({ x: 0, y: 0 });
  }, []);

  const rotateClockwise = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Panning handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only main click
    setIsPanning(true);
    setDragOrigin({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragOrigin.x,
      y: e.clientY - dragOrigin.y,
    });
  }, [isPanning, dragOrigin]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -15 : 15;
      setZoom((prev) => Math.min(300, Math.max(50, prev + delta)));
    }
  }, []);

  // Status transitions
  const setStatus = useCallback((status: AttachmentRecord['status']) => {
    setAttachment((prev) => ({ ...prev, status }));
  }, []);

  const rerunOcr = useCallback(() => {
    setStatus('processing');
    const timer = setTimeout(() => {
      setAttachment((prev) => ({
        ...prev,
        status: 'ready',
        overallConfidence: 94,
      }));
    }, 1600);
    return () => clearTimeout(timer);
  }, [setStatus]);

  const confirmAndAttach = useCallback(() => {
    const now = new Date();
    const formatted = `${now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setAttachment((prev) => ({
      ...prev,
      status: 'confirmed',
      confirmedBy: 'Dr. Asha Rao',
      confirmedAt: formatted,
    }));
  }, []);

  const unconfirm = useCallback(() => {
    setAttachment((prev) => ({
      ...prev,
      status: 'ready',
      confirmedBy: undefined,
      confirmedAt: undefined,
    }));
  }, []);

  const replaceFile = useCallback((file: { name: string; size: number }) => {
    const sizeKB = Math.round(file.size / 1024);
    const sizeFormatted = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

    setAttachment((prev) => ({
      ...prev,
      filename: file.name,
      fileSizeBytes: file.size,
      fileSizeFormatted: sizeFormatted,
      status: 'processing',
    }));

    setTimeout(() => {
      setAttachment((prev) => ({
        ...prev,
        status: 'ready',
        overallConfidence: 92,
      }));
    }, 1400);
  }, []);

  const promptDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const executeDelete = useCallback(() => {
    localStorage.removeItem(`kaya_att_${attachment.id}`);
    setIsDeleted(true);
    setShowDeleteConfirm(false);
  }, [attachment.id]);

  return {
    attachment,
    setAttachment,
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
  };
}
