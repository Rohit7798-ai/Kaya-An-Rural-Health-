import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  Check,
  CheckCircle2,
  FileText,
  AlertCircle,
  RefreshCw,
  Copy,
  Pill,
  Activity,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import {
  aiVisionService,
  VisionAnalysisResult,
  ScannedMedication,
  ScannedLabResult,
  SAMPLE_PRESCRIPTION_FALLBACK,
  SAMPLE_LAB_REPORT_FALLBACK,
} from '../../services/aiVisionService';
import { Button } from '../ui/Button';

export interface SmartScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToVisit?: (result: {
    medications: ScannedMedication[];
    diagnoses: string[];
    clinicalNotes: string[];
    rawText: string;
  }) => void;
  onSaveAttachment?: (file: File, result: VisionAnalysisResult) => void;
}

export const SmartScannerModal: React.FC<SmartScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyToVisit,
  onSaveAttachment,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'results'>('upload');
  const [selectedResultTab, setSelectedResultTab] = useState<'rx' | 'lab' | 'notes' | 'raw'>('rx');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysisResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  // Selected medications to import
  const [selectedMedIds, setSelectedMedIds] = useState<Set<string>>(new Set());

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Stop camera when closing
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable. Please use file upload or demo samples.');
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], `prescription-capture-${Date.now()}.jpg`, {
              type: 'image/jpeg',
            });
            stopCamera();
            processImage(capturedFile);
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImage(files[0]);
    }
  };

  const processImage = async (file: File) => {
    setCurrentFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsProcessing(true);
    setProgressStatus('Starting AI document analysis...');

    try {
      const result = await aiVisionService.analyzeDocument(file, file.type, (status) => {
        setProgressStatus(status);
      });

      setAnalysisResult(result);
      // Select all medications by default
      setSelectedMedIds(new Set(result.medications.map((m) => m.id)));
      
      // Auto-switch to default relevant result tab
      if (result.medications.length > 0) {
        setSelectedResultTab('rx');
      } else if (result.labResults.length > 0) {
        setSelectedResultTab('lab');
      } else {
        setSelectedResultTab('raw');
      }

      setActiveTab('results');
    } catch (err: any) {
      console.error('OCR processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadSample = (type: 'rx' | 'lab') => {
    const sample = type === 'rx' ? SAMPLE_PRESCRIPTION_FALLBACK : SAMPLE_LAB_REPORT_FALLBACK;
    setAnalysisResult(sample);
    setSelectedMedIds(new Set(sample.medications.map((m) => m.id)));
    setSelectedResultTab(type === 'rx' ? 'rx' : 'lab');
    setPreviewUrl(null);
    setActiveTab('results');
  };

  const toggleMedSelection = (id: string) => {
    setSelectedMedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApply = () => {
    if (!analysisResult) return;

    const chosenMeds = analysisResult.medications.filter((m) => selectedMedIds.has(m.id));
    onApplyToVisit?.({
      medications: chosenMeds,
      diagnoses: analysisResult.diagnoses,
      clinicalNotes: analysisResult.clinicalNotes,
      rawText: analysisResult.rawText,
    });

    if (currentFile && onSaveAttachment) {
      onSaveAttachment(currentFile, analysisResult);
    }

    onClose();
  };

  const copyRawText = () => {
    if (analysisResult?.rawText) {
      navigator.clipboard.writeText(analysisResult.rawText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-surface-alt/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-sans font-semibold text-sm text-text">
                AI Prescription & Lab Report Scanner
              </h2>
              <p className="font-sans text-xs text-text-muted">
                Extracts medications, lab parameters & diagnoses via Vision AI
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* View Mode: Upload / Camera Selection */}
          {activeTab !== 'results' && !isProcessing && (
            <div className="flex flex-col gap-5">
              {/* Tab Selector */}
              <div className="flex items-center gap-2 p-1 bg-surface-alt rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setActiveTab('upload');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-sans font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'upload'
                      ? 'bg-surface text-text shadow-xs'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image / Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('camera');
                    startCamera();
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-sans font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'camera'
                      ? 'bg-surface text-text shadow-xs'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Use Device Camera</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              {activeTab === 'upload' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-accent/60 bg-surface-alt/30 hover:bg-surface-alt/50 rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-accent-soft text-accent flex items-center justify-center">
                    <Upload className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-sans font-medium text-sm text-text">
                      Click to choose prescription photo or lab report
                    </p>
                    <p className="font-sans text-xs text-text-muted mt-1">
                      Supports JPG, PNG, WEBP, or scanned document photos
                    </p>
                  </div>
                </div>
              )}

              {/* Camera Viewfinder */}
              {activeTab === 'camera' && (
                <div className="flex flex-col items-center gap-3">
                  {cameraError ? (
                    <div className="p-4 bg-danger-soft text-danger border border-danger/20 rounded-lg text-xs font-sans w-full text-center">
                      {cameraError}
                    </div>
                  ) : (
                    <div className="relative w-full max-w-md h-64 bg-text/90 rounded-xl overflow-hidden border border-border flex items-center justify-center">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      {/* Guide overlay */}
                      <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg pointer-events-none flex items-end justify-center pb-2">
                        <span className="text-[11px] font-sans text-white/90 bg-black/60 px-2 py-0.5 rounded-sm">
                          Align document inside box
                        </span>
                      </div>
                    </div>
                  )}

                  {cameraActive && (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={capturePhoto}
                      icon={<Camera className="w-4 h-4" />}
                      className="rounded-lg font-medium"
                    >
                      Capture & Analyze Document
                    </Button>
                  )}
                </div>
              )}

              {/* Demo Sample Presets */}
              <div className="pt-3 border-t border-border flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-text-muted">
                  Or Test with Sample Data:
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => loadSample('rx')}
                    className="p-2.5 border border-border hover:border-accent rounded-lg bg-surface hover:bg-surface-alt transition-colors text-left flex items-start gap-2.5 cursor-pointer"
                  >
                    <Pill className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="font-sans font-medium text-xs text-text block">
                        Dr. Deshmukh Rx (HTN/T2DM)
                      </span>
                      <span className="font-sans text-[11px] text-text-muted">
                        Telmisartan, Metformin, Pantocid
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadSample('lab')}
                    className="p-2.5 border border-border hover:border-accent rounded-lg bg-surface hover:bg-surface-alt transition-colors text-left flex items-start gap-2.5 cursor-pointer"
                  >
                    <Activity className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div>
                      <span className="font-sans font-medium text-xs text-text block">
                        Sevagram Lab Panel (CBC/Sugar)
                      </span>
                      <span className="font-sans text-[11px] text-text-muted">
                        Hemoglobin (9.4), FBS (138), Lipids
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-accent animate-spin" />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-sm text-text">
                  AI Vision Processing Document
                </h3>
                <p className="font-sans text-xs text-accent mt-1 animate-pulse font-medium">
                  {progressStatus}
                </p>
                <p className="font-sans text-[11px] text-text-muted mt-2">
                  Recognizing handwriting, drug abbreviations, dosages, and reference values...
                </p>
              </div>
            </div>
          )}

          {/* Results View */}
          {activeTab === 'results' && analysisResult && !isProcessing && (
            <div className="flex flex-col gap-4">
              {/* Header Summary Banner */}
              <div className="p-3 bg-accent-soft/70 border border-accent/30 rounded-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  <div>
                    <span className="font-sans font-medium text-xs text-text block">
                      {analysisResult.documentType === 'prescription'
                        ? 'Prescription Extracted'
                        : 'Lab Report Extracted'}
                      {analysisResult.doctorHospital && ` · ${analysisResult.doctorHospital}`}
                    </span>
                    <span className="font-sans text-[11px] text-text-muted">
                      Confidence: {Math.round(analysisResult.confidence * 100)}%
                      {analysisResult.isMockFallback ? ' (Offline Fallback)' : ' (Gemini 1.5 Flash)'}
                      {analysisResult.date && ` · Date: ${analysisResult.date}`}
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setAnalysisResult(null);
                    setActiveTab('upload');
                  }}
                  icon={<RefreshCw className="w-3 h-3" />}
                >
                  Scan New
                </Button>
              </div>

              {/* Result Sub-tabs */}
              <div className="flex items-center gap-1 border-b border-border pb-1">
                {analysisResult.medications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedResultTab('rx')}
                    className={`px-3 py-1.5 rounded-md text-xs font-sans font-medium transition-colors cursor-pointer ${
                      selectedResultTab === 'rx'
                        ? 'bg-surface text-accent border border-accent/40 shadow-xs'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    Medications ({analysisResult.medications.length})
                  </button>
                )}

                {analysisResult.labResults.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedResultTab('lab')}
                    className={`px-3 py-1.5 rounded-md text-xs font-sans font-medium transition-colors cursor-pointer ${
                      selectedResultTab === 'lab'
                        ? 'bg-surface text-accent border border-accent/40 shadow-xs'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    Lab Results ({analysisResult.labResults.length})
                  </button>
                )}

                {analysisResult.clinicalNotes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedResultTab('notes')}
                    className={`px-3 py-1.5 rounded-md text-xs font-sans font-medium transition-colors cursor-pointer ${
                      selectedResultTab === 'notes'
                        ? 'bg-surface text-accent border border-accent/40 shadow-xs'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    Notes & Diagnoses ({analysisResult.diagnoses.length + analysisResult.clinicalNotes.length})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedResultTab('raw')}
                  className={`px-3 py-1.5 rounded-md text-xs font-sans font-medium transition-colors cursor-pointer ${
                    selectedResultTab === 'raw'
                      ? 'bg-surface text-accent border border-accent/40 shadow-xs'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  Raw Transcript
                </button>
              </div>

              {/* Tab 1: Medications List */}
              {selectedResultTab === 'rx' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-text-muted px-1">
                    <span>Select medications to apply to visit prescription:</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedMedIds.size === analysisResult.medications.length) {
                          setSelectedMedIds(new Set());
                        } else {
                          setSelectedMedIds(new Set(analysisResult.medications.map((m) => m.id)));
                        }
                      }}
                      className="text-accent hover:underline cursor-pointer"
                    >
                      {selectedMedIds.size === analysisResult.medications.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>

                  <div className="flex flex-col divide-y divide-border border border-border rounded-lg bg-surface">
                    {analysisResult.medications.map((med) => {
                      const isSelected = selectedMedIds.has(med.id);
                      return (
                        <div
                          key={med.id}
                          onClick={() => toggleMedSelection(med.id)}
                          className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                            isSelected ? 'bg-accent-soft/30' : 'hover:bg-surface-alt'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div
                            className="mt-1 w-4 h-4 rounded-sm text-accent focus:ring-accent accent-accent cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-sans font-semibold text-xs text-text">
                                {med.name} {med.dosage && `(${med.dosage})`}
                              </span>
                              <span className="font-mono text-xs text-accent font-medium">
                                {med.frequency}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-text-muted mt-0.5">
                              <span>Duration: {med.duration}</span>
                              {med.instructions && <span>· {med.instructions}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: Lab Results */}
              {selectedResultTab === 'lab' && (
                <div className="flex flex-col gap-2">
                  <div className="border border-border rounded-lg overflow-hidden bg-surface">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-surface-alt/70 border-b border-border text-text-muted uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-2.5">Test Name</th>
                          <th className="p-2.5">Value</th>
                          <th className="p-2.5">Normal Range</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {analysisResult.labResults.map((lab) => (
                          <tr key={lab.id} className="hover:bg-surface-alt/40">
                            <td className="p-2.5 font-medium text-text">{lab.testName}</td>
                            <td className="p-2.5 font-mono font-bold text-text">
                              {lab.value} {lab.unit}
                            </td>
                            <td className="p-2.5 text-text-muted font-mono text-[11px]">
                              {lab.referenceRange || '—'}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                  lab.flag === 'high'
                                    ? 'bg-danger-soft text-danger border border-danger/30'
                                    : lab.flag === 'low'
                                    ? 'bg-warning-soft text-warning border border-warning/30'
                                    : 'bg-accent-soft text-accent border border-accent/30'
                                }`}
                              >
                                {lab.flag}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Notes & Diagnoses */}
              {selectedResultTab === 'notes' && (
                <div className="flex flex-col gap-3">
                  {analysisResult.diagnoses.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-text-muted block mb-1">
                        Identified Diagnoses:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.diagnoses.map((d, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-surface-alt text-text text-xs rounded-md border border-border font-medium"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisResult.clinicalNotes.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-text-muted block mb-1">
                        Clinical Advice & Notes:
                      </span>
                      <ul className="list-disc list-inside text-xs text-text space-y-1 bg-surface p-3 rounded-lg border border-border">
                        {analysisResult.clinicalNotes.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Raw Transcript */}
              {selectedResultTab === 'raw' && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={copyRawText}
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline cursor-pointer"
                    >
                      {copiedText ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedText ? 'Copied to clipboard' : 'Copy text'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-surface text-text font-mono text-xs rounded-lg border border-border whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                    {analysisResult.rawText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-border bg-surface-alt/20 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>

          {activeTab === 'results' && analysisResult && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleApply}
                icon={<Sparkles className="w-4 h-4" />}
                className="rounded-lg font-medium"
              >
                Apply to Current Visit ({selectedMedIds.size} Rx)
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
