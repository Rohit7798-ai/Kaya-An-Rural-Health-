import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useReports } from '../features/reports/useReports';
import { DateRangeControl } from '../components/reports/DateRangeControl';
import { HeadlineNumbers } from '../components/reports/HeadlineNumbers';
import { BarList } from '../components/reports/BarList';
import { SyncHealth } from '../components/reports/SyncHealth';
import { RecentActivity } from '../components/reports/RecentActivity';

export const Reports: React.FC = () => {
  const {
    preset,
    selectPreset,
    select30Days,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    isCustomOpen,
    setIsCustomOpen,
    isOffline,
    setIsOffline,
    hasError,
    setHasError,
    forceEmpty,
    toggleEmptyState,
    reportData,
  } = useReports();

  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Keyboard shortcuts:
  // ⌘1 → Today, ⌘2 → 7 days, ⌘3 → 30 days
  // ⌘E → open export menu
  // Esc → close any open inline date picker or menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // ⌘1 / Ctrl+1: Today
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        selectPreset('today');
        return;
      }

      // ⌘2 / Ctrl+2: 7 days
      if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        selectPreset('7days');
        return;
      }

      // ⌘3 / Ctrl+3: 30 days
      if ((e.metaKey || e.ctrlKey) && e.key === '3') {
        e.preventDefault();
        selectPreset('30days');
        return;
      }

      // ⌘E / Ctrl+E: Open export menu
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setExportMenuOpen((prev) => !prev);
        return;
      }

      // Esc: close any open inline date picker or export menu
      if (e.key === 'Escape') {
        if (isCustomOpen) {
          e.preventDefault();
          setIsCustomOpen(false);
        }
        if (exportMenuOpen) {
          e.preventDefault();
          setExportMenuOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectPreset, isCustomOpen, exportMenuOpen, setIsCustomOpen]);

  // Handle Export actions
  const handleExport = useCallback((type: 'csv-patients' | 'csv-visits' | 'pdf') => {
    if (isOffline) return;

    setExportMenuOpen(false);

    let filename = 'clinic-report.csv';
    let mimeType = 'text/csv;charset=utf-8;';
    let content = '';

    if (type === 'csv-patients') {
      filename = `patients-summary-${preset}.csv`;
      content = 'Clinic ID,Full Name,Age,Gender,Village,Total Visits,Last Visit\n' +
        'KAY-26-0104,Anandi Devi,48,Female,Wardha,6,2026-09-19\n' +
        'KAY-26-0105,Bikram Mondal,34,Male,Hinganghat,2,2026-09-19\n' +
        'KAY-26-0106,Suman Bai,52,Female,Seloo,4,2026-09-18\n' +
        'KAY-26-0108,Pooja Waghmare,24,Female,Deoli,3,2026-09-17\n';
    } else if (type === 'csv-visits') {
      filename = `visits-summary-${preset}.csv`;
      content = 'Visit ID,Date,Patient ID,Clinician,Diagnosis,Status\n' +
        'VIS-2026-0412,2026-09-19,KAY-26-0104,Dr. Asha Rao,Hypertension,Completed\n' +
        'VIS-2026-0411,2026-09-19,KAY-26-0105,Dr. Asha Rao,Upper respiratory infection,Completed\n' +
        'VIS-2026-0410,2026-09-18,KAY-26-0106,Dr. Asha Rao,Type 2 diabetes,Completed\n';
    } else {
      filename = `clinical-summary-${preset}.txt`;
      mimeType = 'text/plain;charset=utf-8;';
      content = `KAYA EMR — DISTRICT CLINICAL REPORT\nPeriod: ${reportData.resolvedRange}\nPatients Seen: ${reportData.headlines.patientsSeen}\nNew Registrations: ${reportData.headlines.newRegistrations}\nFollow-ups: ${reportData.headlines.followUps}\nPending Sync: ${reportData.headlines.pendingSync}\nSync Success Rate: ${reportData.syncHealth.successRatePercent}%\nGenerated on: 19 Sep 2026`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccessMessage(`Exported ${filename}`);
    setTimeout(() => setExportSuccessMessage(null), 3000);
  }, [isOffline, preset, reportData]);

  // Error Loading State:
  // Serif line: "Couldn't load reports."
  // Secondary button: "Retry"
  if (hasError) {
    return (
      <div className="max-w-[1120px] mx-auto w-full py-16 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-danger-soft flex items-center justify-center mb-4 text-danger">
          <AlertCircle className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-2xl text-text mb-2">
          Couldn't load reports.
        </h2>
        <p className="font-sans text-sm text-text-muted mb-6 max-w-sm">
          A network or synchronization timeout occurred while querying aggregate indicators.
        </p>
        <button
          type="button"
          onClick={() => setHasError(false)}
          className="h-9 px-4 bg-surface-alt hover:bg-border text-text font-sans text-xs font-medium rounded-sm border border-border cursor-pointer transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1120px] mx-auto w-full flex flex-col gap-8 pb-16">
      {/* State Verification Switcher (For test verification of ranges & empty state) */}
      <div className="px-3.5 py-2 bg-surface border border-border rounded-sm flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none">
        <div className="flex items-center gap-2 text-text-muted">
          <span className="font-medium text-text">Verify mode:</span>
          <button
            type="button"
            onClick={() => selectPreset('30days')}
            className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
              preset === '30days' && !forceEmpty
                ? 'bg-accent text-surface font-medium'
                : 'bg-surface-alt text-text hover:bg-border border border-border'
            }`}
          >
            30 days
          </button>
          <button
            type="button"
            onClick={() => selectPreset('7days')}
            className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
              preset === '7days' && !forceEmpty
                ? 'bg-accent text-surface font-medium'
                : 'bg-surface-alt text-text hover:bg-border border border-border'
            }`}
          >
            7 days
          </button>
          <button
            type="button"
            onClick={() => selectPreset('today')}
            className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
              preset === 'today' && !forceEmpty
                ? 'bg-accent text-surface font-medium'
                : 'bg-surface-alt text-text hover:bg-border border border-border'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={toggleEmptyState}
            className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
              forceEmpty
                ? 'bg-terra text-surface font-medium'
                : 'bg-surface-alt text-text hover:bg-border border border-border'
            }`}
          >
            {forceEmpty ? 'Viewing No Data State' : 'Simulate No Data'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOffline(!isOffline)}
            className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer flex items-center gap-1 ${
              isOffline
                ? 'bg-warning text-surface font-medium'
                : 'bg-surface-alt text-text hover:bg-border border border-border'
            }`}
            title="Toggle offline state simulation"
          >
            {isOffline && <WifiOff className="w-3 h-3" strokeWidth={1.5} />}
            <span>{isOffline ? 'Offline Node' : 'Online'}</span>
          </button>

          <button
            type="button"
            onClick={() => setHasError(true)}
            className="px-2 py-0.5 rounded-sm bg-surface-alt text-text-muted hover:text-danger hover:bg-danger-soft border border-border cursor-pointer transition-colors"
            title="Simulate error loading state"
          >
            Simulate Error
          </button>
        </div>
      </div>

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left Title & Subtitle */}
        <div>
          <h1 className="font-serif text-3xl font-normal text-text tracking-tight">
            Reports
          </h1>
          <p className="text-sm text-text-muted mt-1 font-sans">
            Clinic activity and patient summary.
          </p>
        </div>

        {/* Right Date Range Control + Export Menu */}
        <DateRangeControl
          preset={preset}
          onSelectPreset={selectPreset}
          resolvedRange={reportData.resolvedRange}
          isCustomOpen={isCustomOpen}
          onToggleCustom={() => setIsCustomOpen(!isCustomOpen)}
          customStartDate={customStartDate}
          onChangeStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          onChangeEndDate={setCustomEndDate}
          isOffline={isOffline}
          exportMenuOpen={exportMenuOpen}
          onExportMenuOpenChange={setExportMenuOpen}
          onExport={handleExport}
        />
      </div>

      {/* Export feedback message if any */}
      {exportSuccessMessage && (
        <div className="px-3.5 py-2 bg-accent-soft border border-accent/20 rounded-sm text-xs font-mono text-text flex items-center justify-between">
          <span>{exportSuccessMessage}</span>
          <span className="text-text-muted">Downloaded</span>
        </div>
      )}

      {/* ── OFFLINE NOTICE ── */}
      {/* Quiet inline note above Section 1: surface-alt bg, 1px border, radius 6px, 12px padding */}
      {isOffline && (
        <div className="bg-surface-alt border border-border rounded-sm p-3 flex items-center gap-2.5 text-xs font-sans text-text">
          <WifiOff className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
          <span>
            Offline. Showing data cached up to 2 minutes ago.
          </span>
        </div>
      )}

      {/* ── SECTION 1 — Headline numbers ── */}
      <HeadlineNumbers
        stats={reportData.headlines}
        hasData={reportData.hasData}
        onShowLast30Days={select30Days}
      />

      {/* ── SECTION 2 & 3: Top Diagnoses & Village Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SECTION 2: Top diagnoses */}
        <BarList
          title="Top diagnoses"
          subtitle="By visit count"
          items={reportData.diagnoses}
          minRowsForData={3}
          emptyMessage="Not enough data for this period."
          onShowLast30Days={select30Days}
        />

        {/* SECTION 3: Village distribution */}
        <BarList
          title="By village"
          subtitle="Patient visits"
          items={reportData.villages}
          minRowsForData={3}
          emptyMessage="Not enough data for this period."
          onShowLast30Days={select30Days}
        />
      </div>

      {/* ── SECTION 4 — Sync health ── */}
      <SyncHealth
        stats={reportData.syncHealth}
        periodLabel={reportData.rangeLabel}
        onViewSyncLog={() => {}}
      />

      {/* ── SECTION 5 — Recent activity (collapsed by default) ── */}
      <RecentActivity
        events={reportData.recentActivity}
        defaultOpen={false}
      />
    </div>
  );
};
