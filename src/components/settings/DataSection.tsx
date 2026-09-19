import React from 'react';
import { SectionCard } from './SectionCard';
import { UserRole } from '../../features/settings/useSettings';

export interface DataSectionProps {
  userRole: UserRole;
  isOffline?: boolean;
  onToast: (msg: string) => void;
  onRequestDeleteModal: () => void;
  onExportPatients?: () => void;
  onExportVisits?: () => void;
}

export const DataSection: React.FC<DataSectionProps> = ({
  userRole,
  isOffline,
  onToast,
  onRequestDeleteModal,
  onExportPatients,
  onExportVisits,
}) => {
  const isAdmin = userRole === 'Admin';

  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const handleExportPatients = () => {
    if (onExportPatients) {
      onExportPatients();
      return;
    }
    if (isOffline) return;
    const filename = `kaya-patients-${getFormattedDate()}.csv`;
    const content =
      'Clinic ID,National ID,Full Name,Age,Gender,Village,Blood Group,Total Visits,Last Visit Date\n' +
      'KAY-26-0104,9842-1049-5512,Anandi Devi,48,Female,Wardha,B+,6,2026-09-19\n' +
      'KAY-26-0105,3310-8429-1190,Bikram Mondal,34,Male,Hinganghat,O+,2,2026-09-19\n' +
      'KAY-26-0106,4412-9901-2384,Suman Bai,52,Female,Seloo,A+,4,2026-09-18\n' +
      'KAY-26-0108,1290-3341-8890,Pooja Waghmare,24,Female,Deoli,AB+,3,2026-09-17\n';

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onToast('Patients exported.');
  };

  const handleExportVisits = () => {
    if (onExportVisits) {
      onExportVisits();
      return;
    }
    if (isOffline) return;
    const filename = `kaya-visits-${getFormattedDate()}.csv`;
    const content =
      'Visit ID,Date,Patient ID,Clinician,Vitals BP,Vitals Temp,Chief Complaint,Diagnosis,Disposition\n' +
      'VIS-2026-0412,2026-09-19,KAY-26-0104,Dr. Asha Rao,142/88,98.6,Headache and dizziness,Hypertension,Prescription renewed\n' +
      'VIS-2026-0411,2026-09-19,KAY-26-0105,Dr. Asha Rao,118/76,100.2,Sore throat and nasal drip,Upper respiratory infection,Supportive care\n' +
      'VIS-2026-0410,2026-09-18,KAY-26-0106,Dr. Asha Rao,126/80,98.4,Routine diabetes follow-up,Type 2 diabetes,Dietary guidance\n';

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onToast('Visits exported.');
  };

  const handleDownloadBackup = () => {
    if (isOffline) return;
    const filename = `kaya-backup-${getFormattedDate()}.zip`;
    // Generate a backup archive container
    const content = 'KAYA EMR FULL CLINIC BACKUP ARCHIVE\nGenerated: 2026-09-19\nIncludes: Patients, Visits, Attachments, Clinical Notes, Audit Logs';
    const blob = new Blob([content], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onToast('Full backup downloaded.');
  };

  return (
    <SectionCard id="section-data" title="Data">
      <div className="divide-y divide-border">
        {/* Row 1 — Export patients */}
        <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 setting-row">
          <div>
            <span className="text-sm font-sans text-text block">Export patients</span>
            <span className="text-xs text-text-muted font-sans block mt-0.5">
              Download patient register with demographic indicators
            </span>
          </div>

          <button
            type="button"
            disabled={isOffline}
            onClick={handleExportPatients}
            title={isOffline ? 'Needs a connection.' : 'Export patients CSV'}
            className="h-8 px-3 text-xs font-sans text-text-muted hover:text-text hover:bg-surface-alt rounded-sm border border-border bg-surface transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>

        {/* Row 2 — Export visits */}
        <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 setting-row">
          <div>
            <span className="text-sm font-sans text-text block">Export visits</span>
            <span className="text-xs text-text-muted font-sans block mt-0.5">
              Download complete clinical encounters and diagnostic records
            </span>
          </div>

          <button
            type="button"
            disabled={isOffline}
            onClick={handleExportVisits}
            title={isOffline ? 'Needs a connection.' : 'Export visits CSV'}
            className="h-8 px-3 text-xs font-sans text-text-muted hover:text-text hover:bg-surface-alt rounded-sm border border-border bg-surface transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>

        {/* Row 3 — Full backup */}
        <div className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 setting-row">
          <div>
            <span className="text-sm font-sans text-text block">Full backup</span>
            <span className="text-xs text-text-muted font-sans block mt-0.5">
              Complete archive containing all tables, documents, and attachments
            </span>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1 self-start sm:self-auto">
            <button
              type="button"
              disabled={isOffline}
              onClick={handleDownloadBackup}
              title={isOffline ? 'Needs a connection.' : 'Download full backup archive'}
              className="h-8 px-3 text-xs font-sans text-text-muted hover:text-text hover:bg-surface-alt rounded-sm border border-border bg-surface transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Download backup (.zip)
            </button>
            <span className="text-xs text-text-muted font-sans text-left sm:text-right">
              Recommended weekly. Store on an encrypted drive.
            </span>
          </div>
        </div>

        {/* Row 4 — Delete clinic data (Only visible to Admins) */}
        {isAdmin && (
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 setting-row">
            <div>
              <span className="text-sm font-sans text-danger font-medium block">
                Delete clinic data
              </span>
              <span className="text-xs text-text-muted font-sans block mt-0.5">
                Permanently remove all records from this local node and server
              </span>
            </div>

            <button
              type="button"
              disabled={isOffline}
              onClick={onRequestDeleteModal}
              title={isOffline ? 'Needs a connection.' : 'Delete all clinic data'}
              className="h-8 px-3 text-xs font-sans font-medium text-danger hover:bg-danger-soft border border-danger/40 hover:border-danger rounded-sm cursor-pointer transition-colors self-start sm:self-auto disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete all data
            </button>
          </div>
        )}
      </div>
    </SectionCard>
  );
};
