import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, FileText } from 'lucide-react';

export const VisitDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" strokeWidth={1.5} />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-text">Visit Encounter #{id}</h1>
          <p className="text-xs text-text-muted">Clinical notes & prescription</p>
        </div>
      </div>

      <Card className="min-h-[300px] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <FileText className="w-8 h-8 text-text-muted mx-auto mb-2" strokeWidth={1.5} />
          <p className="font-serif text-lg text-text mb-1">Encounter Notes</p>
          <p className="text-xs text-text-muted">
            Clinical SOAP notes, speech dictation, and attachments for visit #{id}.
          </p>
        </div>
      </Card>
    </div>
  );
};
