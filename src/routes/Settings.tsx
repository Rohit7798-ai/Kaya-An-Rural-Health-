import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { WifiOff, AlertCircle, Check } from 'lucide-react';
import { useSettings, UserRole } from '../features/settings/useSettings';
import { useStaff } from '../features/settings/useStaff';
import { useTheme } from '../features/theme/useTheme';
import { ClinicSection } from '../components/settings/ClinicSection';
import { StaffSection } from '../components/settings/StaffSection';
import { AppearanceSection } from '../components/settings/AppearanceSection';
import { DataSection } from '../components/settings/DataSection';
import { PrivacySection } from '../components/settings/PrivacySection';
import { DeleteDataModal } from '../components/settings/DeleteDataModal';

const SECTIONS = [
  { id: 'section-clinic', label: 'Clinic', key: '1' },
  { id: 'section-staff', label: 'Staff', key: '2' },
  { id: 'section-appearance', label: 'Appearance', key: '3' },
  { id: 'section-data', label: 'Data', key: '4' },
  { id: 'section-privacy', label: 'Privacy', key: '5' },
];

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);

  const {
    clinicInfo,
    saveClinicInfo,
    currentUserRole,
    setCurrentUserRole,
    isOffline,
    setIsOffline,
    hasError,
    setHasError,
    toastMessage,
    showToast,
    resetAllData,
    exportPatientsCsv,
    exportVisitsCsv,
  } = useSettings();

  const {
    staffList,
    isInviteOpen,
    setIsInviteOpen,
    inviteStaff,
    resendInvite,
    changeRole,
    toggleDisable,
    removeStaff,
  } = useStaff(showToast);

  const {
    theme,
    setTheme,
    density,
    setDensity,
    reduceMotion,
    setReduceMotion,
  } = useTheme();

  const [activeSection, setActiveSection] = useState<string>('section-clinic');
  const [isScrolledPastHeader, setIsScrolledPastHeader] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // Scroll to section helper
  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  }, []);

  // Keyboard shortcuts:
  // ⌘1 → Clinic, ⌘2 → Staff, ⌘3 → Appearance, ⌘4 → Data, ⌘5 → Privacy
  // Esc → cancel any open inline form or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      // ⌘1-5 shortcuts
      if ((e.metaKey || e.ctrlKey) && !isInput) {
        if (e.key === '1') {
          e.preventDefault();
          scrollToSection('section-clinic');
        } else if (e.key === '2') {
          e.preventDefault();
          scrollToSection('section-staff');
        } else if (e.key === '3') {
          e.preventDefault();
          scrollToSection('section-appearance');
        } else if (e.key === '4') {
          e.preventDefault();
          scrollToSection('section-data');
        } else if (e.key === '5') {
          e.preventDefault();
          scrollToSection('section-privacy');
        }
      }

      // Esc closes invite or delete modal
      if (e.key === 'Escape') {
        if (isDeleteModalOpen) {
          setIsDeleteModalOpen(false);
        }
        if (isInviteOpen) {
          setIsInviteOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollToSection, isDeleteModalOpen, isInviteOpen, setIsInviteOpen]);

  // Track scroll position for sticky navigation aid and active section
  useEffect(() => {
    // Look for scroll parent or window
    const scrollParent = headerRef.current?.closest('main') || window;

    const handleScroll = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        // If header is scrolled out of top view
        setIsScrolledPastHeader(rect.bottom < 50);
      }
    };

    scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // IntersectionObserver for tracking active section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: scrollParent instanceof Element ? scrollParent : null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0.1,
      }
    );

    SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => {
      scrollParent.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const handleConfirmDeleteAll = () => {
    resetAllData();
    setIsDeleteModalOpen(false);
    showToast('Clinic data wiped.');
    setTimeout(() => {
      navigate('/login');
    }, 600);
  };

  // Error loading state
  if (hasError) {
    return (
      <div className="max-w-[720px] mx-auto w-full py-16 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-danger-soft flex items-center justify-center mb-4 text-danger">
          <AlertCircle className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-2xl text-text mb-2">
          Couldn't load settings.
        </h2>
        <p className="font-sans text-sm text-text-muted mb-6 max-w-sm">
          A synchronization error occurred while querying clinic node parameters.
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
    <div className="max-w-[720px] mx-auto w-full flex flex-col gap-6 pb-24 text-left">
      {/* Role & State Switcher (For test verification of Admin vs Viewer and Edge States) */}
      <div className="px-3.5 py-2 bg-surface border border-border rounded-sm flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text">Viewing as:</span>
          {(['Admin', 'Viewer', 'Clinician'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setCurrentUserRole(r)}
              className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
                currentUserRole === r
                  ? 'bg-accent text-surface font-medium'
                  : 'bg-surface-alt text-text hover:bg-border border border-border'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
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
            title="Simulate error state"
          >
            Simulate Error
          </button>
        </div>
      </div>

      {/* ── PAGE HEADER ── */}
      <div ref={headerRef} className="pt-2">
        <h1 className="font-serif text-3xl font-normal text-text tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-text-muted mt-1 font-sans">
          Clinic, staff, appearance, data, and privacy.
        </p>
      </div>

      {/* ── NAVIGATION AID (sticky, only when scrolled past the header) ── */}
      <div
        aria-hidden={!isScrolledPastHeader}
        className={`sticky top-0 z-30 py-2.5 px-3 bg-bg/95 backdrop-blur-sm border-b border-border transition-all duration-200 ${
          isScrolledPastHeader
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <nav
          aria-label="Settings sections navigation"
          className="flex items-center gap-1 text-xs font-sans overflow-x-auto"
        >
          {SECTIONS.map((sec, idx) => {
            const isActive = activeSection === sec.id;
            return (
              <React.Fragment key={sec.id}>
                {idx > 0 && <span className="text-text-faint select-none px-0.5">·</span>}
                <button
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-accent-soft text-accent font-medium'
                      : 'text-text-muted hover:text-text hover:bg-surface-alt'
                  }`}
                  title={`Jump to ${sec.label} (⌘${sec.key})`}
                >
                  {sec.label}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* ── OFFLINE NOTICE ── */}
      {isOffline && (
        <div className="bg-surface-alt border border-border rounded-sm p-3 flex items-center gap-2.5 text-xs font-sans text-text">
          <WifiOff className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
          <span>Offline. Some settings can&apos;t be changed until you reconnect.</span>
        </div>
      )}

      {/* ── SECTION 1 — Clinic ── */}
      <ClinicSection
        info={clinicInfo}
        onSave={saveClinicInfo}
        userRole={currentUserRole}
        isOffline={isOffline}
      />

      {/* ── SECTION 2 — Staff ── */}
      <StaffSection
        staffList={staffList}
        userRole={currentUserRole}
        isInviteOpen={isInviteOpen}
        onToggleInvite={setIsInviteOpen}
        onInvite={inviteStaff}
        onResendInvite={resendInvite}
        onChangeRole={changeRole}
        onToggleDisable={toggleDisable}
        onRemoveStaff={removeStaff}
        isOffline={isOffline}
      />

      {/* ── SECTION 3 — Appearance ── */}
      <AppearanceSection
        theme={theme}
        onThemeChange={setTheme}
        density={density}
        onDensityChange={setDensity}
        reduceMotion={reduceMotion}
        onReduceMotionChange={setReduceMotion}
      />

      {/* ── SECTION 4 — Data ── */}
      <DataSection
        userRole={currentUserRole}
        isOffline={isOffline}
        onToast={showToast}
        onRequestDeleteModal={() => setIsDeleteModalOpen(true)}
        onExportPatients={exportPatientsCsv}
        onExportVisits={exportVisitsCsv}
      />

      {/* ── SECTION 5 — Privacy ── */}
      <PrivacySection />

      {/* ── Centered Modal: Delete all clinic data ── */}
      <DeleteDataModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        clinicName={clinicInfo.clinicName}
        onConfirmDelete={handleConfirmDeleteAll}
      />

      {/* ── Toast Notification (Olive accent) ── */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-accent text-surface px-4 py-2.5 rounded-sm text-xs font-sans font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <Check className="w-4 h-4" strokeWidth={2} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
