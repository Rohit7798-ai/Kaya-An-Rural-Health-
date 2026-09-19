export type DateRangePreset = 'today' | '7days' | '30days' | 'custom';

export interface HeadlineStats {
  patientsSeen: number;
  patientsSeenDelta: string;
  newRegistrations: number;
  newRegistrationsDelta: string;
  followUps: number;
  followUpsDelta: string;
  pendingSync: number;
  pendingSyncDelta: string;
}

export interface BarListItem {
  id: string;
  label: string;
  count: number;
  isOthers?: boolean;
  subItems?: { id: string; label: string; count: number }[];
}

export interface SyncHealthStats {
  recordsSynced: number;
  pendingCount: number;
  lastSuccessfulSyncText: string;
  successRatePercent: number;
  errorsCount?: number;
}

export interface ActivityEvent {
  id: string;
  time: string;
  user: string;
  action: string;
  patientId: string;
  patientName: string;
}

export interface ReportData {
  rangeLabel: string;
  resolvedRange: string;
  hasData: boolean;
  headlines: HeadlineStats;
  diagnoses: BarListItem[];
  villages: BarListItem[];
  syncHealth: SyncHealthStats;
  recentActivity: ActivityEvent[];
}
