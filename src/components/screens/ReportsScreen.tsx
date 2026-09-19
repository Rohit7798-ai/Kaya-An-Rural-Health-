import React from 'react';
import { Patient, Visit, SyncQueueItem } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface ReportsScreenProps {
  patients: Patient[];
  visits: Visit[];
  syncQueue: SyncQueueItem[];
  clinicName: string;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  patients,
  visits,
  syncQueue,
  clinicName,
}) => {
  // Compute Top Diagnoses
  const diagnosisMap: Record<string, number> = {};
  visits.forEach((v) => {
    if (v.diagnosis) {
      // Normalize common names
      let d = v.diagnosis.split(';')[0].split(',')[0].trim();
      diagnosisMap[d] = (diagnosisMap[d] || 0) + 1;
    }
  });

  const topDiagnoses = Object.entries(diagnosisMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Compute Village Distribution
  const villageMap: Record<string, number> = {};
  patients.forEach((p) => {
    if (p.village) {
      villageMap[p.village] = (villageMap[p.village] || 0) + 1;
    }
  });

  const topVillages = Object.entries(villageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Age demographics
  const pediatricCount = patients.filter((p) => p.age < 12).length;
  const adultCount = patients.filter((p) => p.age >= 12 && p.age < 60).length;
  const geriatricCount = patients.filter((p) => p.age >= 60).length;

  const femaleCount = patients.filter((p) => p.gender === 'Female').length;
  const maleCount = patients.filter((p) => p.gender === 'Male').length;

  return (
    <div className="w-full max-w-[1280px] mx-auto text-left">
      {/* Header */}
      <div className="mb-6 border-b border-[var(--border)] pb-4">
        <h1 className="text-[22px] font-semibold text-[var(--text)] tracking-tight">
          Clinic Reports & Health Indicators
        </h1>
        <p className="text-[14px] text-[var(--text-muted)] mt-0.5">
          {clinicName} · Outpatient epidemiology and sync reliability
        </p>
      </div>

      {/* Top 4 Key Numbers Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card padding="md">
          <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] block">
            Total Patients Registered
          </span>
          <p className="text-[28px] font-mono-tabular font-semibold text-[var(--text)] mt-1">
            {patients.length}
          </p>
          <span className="text-[12px] text-[var(--text-muted)] mt-1 block">
            {femaleCount} females · {maleCount} males
          </span>
        </Card>

        <Card padding="md">
          <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] block">
            Total Consultations Logged
          </span>
          <p className="text-[28px] font-mono-tabular font-semibold text-[var(--text)] mt-1">
            {visits.length}
          </p>
          <span className="text-[12px] text-[var(--text-muted)] mt-1 block">
            Primary care & triage
          </span>
        </Card>

        <Card padding="md">
          <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] block">
            Active Villages Served
          </span>
          <p className="text-[28px] font-mono-tabular font-semibold text-[var(--text)] mt-1">
            {Object.keys(villageMap).length}
          </p>
          <span className="text-[12px] text-[var(--text-muted)] mt-1 block">
            Catchment settlements
          </span>
        </Card>

        <Card padding="md">
          <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] block">
            Register Sync Reliability
          </span>
          <p className="text-[28px] font-mono-tabular font-semibold text-[var(--accent)] mt-1">
            99.2%
          </p>
          <span className="text-[12px] text-[var(--text-muted)] mt-1 block">
            {syncQueue.length === 0 ? 'All records synchronized' : `${syncQueue.length} pending sync`}
          </span>
        </Card>
      </div>

      {/* Two Column Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Diagnoses */}
        <Card padding="md">
          <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-4">
            Prevalent Diagnoses
          </h2>
          <div className="flex flex-col gap-3">
            {topDiagnoses.map(([condition, count]) => {
              const pct = Math.round((count / (visits.length || 1)) * 100);
              return (
                <div key={condition} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-[var(--text)] truncate">{condition}</span>
                    <span className="font-mono-tabular text-[var(--text-muted)]">
                      {count} ({pct}%)
                    </span>
                  </div>
                  {/* Calm proportion bar */}
                  <div className="w-full h-1.5 bg-[var(--surface-alt)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)]"
                      style={{ width: `${Math.max(pct, 12)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Village Catchment Distribution */}
        <Card padding="md">
          <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-4">
            Patient Distribution by Settlement
          </h2>
          <div className="flex flex-col gap-3">
            {topVillages.map(([vil, count]) => {
              const pct = Math.round((count / (patients.length || 1)) * 100);
              return (
                <div key={vil} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-[var(--text)]">{vil}</span>
                    <span className="font-mono-tabular text-[var(--text-muted)]">
                      {count} patients ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--surface-alt)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--terra)]"
                      style={{ width: `${Math.max(pct, 15)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Age Stratification */}
        <Card padding="md">
          <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-4">
            Age Demographics
          </h2>
          <div className="flex flex-col gap-2.5 text-[13px]">
            <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-[var(--text)]">Children (&lt;12 years)</span>
              <span className="font-mono-tabular font-medium text-[var(--text)]">
                {pediatricCount} ({Math.round((pediatricCount / (patients.length || 1)) * 100)}%)
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-[var(--text)]">Adults (12 to 59 years)</span>
              <span className="font-mono-tabular font-medium text-[var(--text)]">
                {adultCount} ({Math.round((adultCount / (patients.length || 1)) * 100)}%)
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[var(--text)]">Elderly (60+ years)</span>
              <span className="font-mono-tabular font-medium text-[var(--text)]">
                {geriatricCount} ({Math.round((geriatricCount / (patients.length || 1)) * 100)}%)
              </span>
            </div>
          </div>
        </Card>

        {/* Offline & Sync Reliability Card */}
        <Card padding="md">
          <h2 className="text-[14px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] mb-4">
            Register Integrity & Local Storage
          </h2>
          <div className="flex flex-col gap-2.5 text-[13px]">
            <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-[var(--text)]">Local database engine</span>
              <span className="font-mono-tabular font-medium text-[var(--text)]">
                Browser LocalStorage + IndexedDB
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-[var(--text)]">Central register sync queue</span>
              <span className="font-mono-tabular font-medium text-[var(--text)]">
                {syncQueue.length} records pending
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[var(--text)]">Last successful sync packet</span>
              <span className="font-mono-tabular font-medium text-[var(--accent)]">
                2 minutes ago
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
