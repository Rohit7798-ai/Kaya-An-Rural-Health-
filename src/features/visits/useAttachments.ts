// Dexie-backed Attachments Hook with Upload + OCR
// Single source of truth in db.attachments with live reactive queries.

import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DbAttachment } from '../../lib/db';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { drainQueue } from '../../lib/sync';
import { sessionStore } from '../../state/session';

import { aiVisionService } from '../../services/aiVisionService';

export interface AttachmentItem {
  id: string;
  filename: string;
  type: 'pdf' | 'image';
  size: string;
  uploadTime: string;
  status: 'Uploading' | 'OCR ready' | 'Needs review' | 'Synced' | 'Failed';
  ocrText?: string;
  ocrExpanded?: boolean;
  isEditingOcr?: boolean;
  localPath?: string;
}

// Module-scoped in-memory storage for binary Files (not stored in Dexie)
const fileBlobMap = new Map<string, File>();

export async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function useAttachments(visitId?: string, patientId?: string) {
  // Local UI expansion & editing toggles
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());

  // Reactive Dexie query
  const rawAttachments = useLiveQuery(async () => {
    const list = await db.attachments
      .filter((a) => !a.deleted_at && (!visitId || a.visit_id === visitId))
      .toArray();

    return list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }, [visitId]);

  // Upload and OCR execution function powered by Gemini Multimodal Vision
  const uploadAndOcr = useCallback(
    async (attachmentId: string, file: File, filename: string) => {
      try {
        // Run AI Vision document analysis
        const visionResult = await aiVisionService.analyzeDocument(file, file.type);

        await db.attachments.update(attachmentId, {
          ocr_text: visionResult.rawText,
          ocr_confidence: visionResult.confidence,
          ocr_status: 'ready',
          sync_state: 'synced',
        });
      } catch (err) {
        console.error('Vision OCR pipeline error:', err);
        await db.attachments.update(attachmentId, {
          ocr_status: 'failed',
          sync_state: 'failed',
        });
      }
    },
    []
  );

  // Add attachment handler
  const addAttachment = useCallback(
    async (fileInput: { name: string; sizeBytes: number; type: string } | File) => {
      let file: File;
      if (fileInput instanceof File) {
        file = fileInput;
      } else {
        // Stub File for mock file inputs
        file = new File([''], fileInput.name, { type: fileInput.type });
      }

      const session = sessionStore.getState();
      const clinicId = session.user?.clinic_id || 'cln-wardha-01';
      const pid = patientId || 'P-0412';
      const now = new Date().toISOString();

      // Compute SHA-256
      let sha = '';
      try {
        sha = await computeSha256(file);
      } catch {
        sha = `sha-${Date.now()}`;
      }

      // Check dedupe in db.attachments
      if (sha) {
        const existing = await db.attachments.where('sha256').equals(sha).first();
        if (existing && !existing.deleted_at) {
          // Re-expand existing
          setExpandedIds((prev) => new Set([...prev, existing.id]));
          return;
        }
      }

      const attachmentId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `att-${Date.now()}`;

      // In-memory preview URL
      let localPath = '';
      try {
        localPath = URL.createObjectURL(file);
      } catch {
        localPath = '';
      }

      // Metadata only (no binary blob in Dexie or sync_queue)
      const meta = {
        id: attachmentId,
        clinic_id: clinicId,
        patient_id: pid,
        visit_id: visitId,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        sha256: sha,
        ocr_status: 'pending' as const,
        created_at: now,
      };

      const record: DbAttachment = {
        ...meta,
        sync_state: 'pending',
        local_path: localPath,
        updated_at: now,
      };

      // 1. Insert into db.attachments
      await db.attachments.put(record);

      // 2. Enqueue sync op without blob
      await db.sync_queue.add({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sync-att-${Date.now()}`,
        table: 'attachments',
        record_id: attachmentId,
        operation: 'insert',
        payload: meta,
        data: meta,
        status: 'pending',
        attempts: 0,
        created_at: now,
      });

      // 3. Store file in module map
      fileBlobMap.set(attachmentId, file);

      // 4. Auto-expand new item in UI
      setExpandedIds((prev) => new Set([...prev, attachmentId]));

      // 5. Fire drainQueue
      void drainQueue();

      // 6. Trigger upload and OCR
      void uploadAndOcr(attachmentId, file, file.name);
    },
    [patientId, visitId, uploadAndOcr]
  );

  const removeAttachment = useCallback(async (id: string) => {
    await db.attachments.update(id, { deleted_at: new Date().toISOString() });
    fileBlobMap.delete(id);
  }, []);

  const toggleOcrExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const updateOcrText = useCallback(async (id: string, text: string) => {
    await db.attachments.update(id, {
      ocr_text: text,
      updated_at: new Date().toISOString(),
    });
  }, []);

  const setEditingOcr = useCallback((id: string, isEditing: boolean) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      if (isEditing) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const retryAttachment = useCallback(
    async (id: string) => {
      const att = await db.attachments.get(id);
      const file = fileBlobMap.get(id) || new File([''], att?.filename || 'document.pdf');
      if (att) {
        await db.attachments.update(id, { ocr_status: 'pending' });
        void uploadAndOcr(id, file, att.filename);
      }
    },
    [uploadAndOcr]
  );

  // Map Dexie rows to AttachmentItem for UI components
  const attachments: AttachmentItem[] = (rawAttachments || []).map((row) => {
    let status: AttachmentItem['status'] = 'Uploading';
    if (row.ocr_status === 'ready' || row.ocr_status === 'confirmed') {
      status = 'OCR ready';
    } else if (row.ocr_status === 'failed') {
      status = 'Failed';
    } else if (row.ocr_status === 'waiting_upload') {
      status = 'Needs review';
    }

    const sizeKB = Math.round((row.file_size || 245760) / 1024);
    const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

    return {
      id: row.id,
      filename: row.filename,
      type: row.mime_type?.startsWith('image/') ? 'image' : 'pdf',
      size: sizeStr,
      uploadTime: row.created_at ? row.created_at.substring(11, 16) : 'Just now',
      status,
      ocrText: row.ocr_text,
      ocrExpanded: expandedIds.has(row.id),
      isEditingOcr: editingIds.has(row.id),
      localPath: row.local_path,
    };
  });

  return {
    attachments,
    addAttachment,
    removeAttachment,
    toggleOcrExpand,
    updateOcrText,
    setEditingOcr,
    retryAttachment,
  };
}
