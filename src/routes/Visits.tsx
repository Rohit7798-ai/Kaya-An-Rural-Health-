import React from 'react';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { FileText } from 'lucide-react';

export const Visits: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">Visits & Encounters</h1>
        <p className="text-sm text-text-muted mt-0.5">
          All clinical triage encounters and outpatient consultations
        </p>
      </div>

      <Card className="min-h-[400px] flex items-center justify-center">
        <EmptyState
          icon={<FileText className="w-8 h-8 text-text-muted" strokeWidth={1.5} />}
          title="No recent clinical visits logged"
          description="Visits created today or during field rounds will appear in this timeline."
        />
      </Card>
    </div>
  );
};
