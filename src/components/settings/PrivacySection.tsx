import React, { useState } from 'react';
import { SectionCard } from './SectionCard';

export const PrivacySection: React.FC = () => {
  const [activeNotice, setActiveNotice] = useState<'policy' | 'processing' | null>(null);

  return (
    <SectionCard id="section-privacy" title="Privacy">
      {/* Three short paragraphs */}
      <div className="flex flex-col gap-4">
        <p className="font-sans font-normal text-sm text-text leading-[1.7] max-w-[60ch] m-0">
          Patient records are stored on this device and synced to a server operated for your clinic. Only staff you&apos;ve invited can read them.
        </p>

        <p className="font-sans font-normal text-sm text-text leading-[1.7] max-w-[60ch] m-0">
          Data is encrypted in transit and at rest. Attachments are stored in encrypted object storage. Nothing is shared with third parties without your clinic&apos;s consent.
        </p>

        <p className="font-sans font-normal text-sm text-text leading-[1.7] max-w-[60ch] m-0">
          You can export or delete all clinic data at any time from the Data section above.
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-border my-6" />

      {/* Three quiet rows */}
      <div className="divide-y divide-border">
        <div className="py-3 flex items-center justify-between gap-4 setting-row">
          <span className="text-sm font-sans text-text">Privacy policy</span>
          <button
            type="button"
            onClick={() => setActiveNotice(activeNotice === 'policy' ? null : 'policy')}
            className="text-xs font-sans text-text-muted hover:text-text cursor-pointer transition-colors"
          >
            {activeNotice === 'policy' ? 'Close' : 'Read →'}
          </button>
        </div>

        {activeNotice === 'policy' && (
          <div className="p-4 bg-surface-alt/60 rounded-sm text-xs font-sans text-text-muted leading-relaxed mb-3">
            <p className="font-medium text-text mb-1">Clinic Privacy Policy</p>
            This node operates within the sub-centre domain. Demographic and clinical details are retained solely for the purpose of medical care delivery, referral tracking, and government reporting requirements under public health statutes. No telemetry or analytics trackers are bundled with this application.
          </div>
        )}

        <div className="py-3 flex items-center justify-between gap-4 setting-row">
          <span className="text-sm font-sans text-text">Data processing notice</span>
          <button
            type="button"
            onClick={() => setActiveNotice(activeNotice === 'processing' ? null : 'processing')}
            className="text-xs font-sans text-text-muted hover:text-text cursor-pointer transition-colors"
          >
            {activeNotice === 'processing' ? 'Close' : 'Read →'}
          </button>
        </div>

        {activeNotice === 'processing' && (
          <div className="p-4 bg-surface-alt/60 rounded-sm text-xs font-sans text-text-muted leading-relaxed mb-3">
            <p className="font-medium text-text mb-1">Data Processing and Retention Notice</p>
            Clinical visits, laboratory attachments, and prescriptions are hashed with cryptographic signatures during peer-to-peer sync. Master records are backed up according to district healthcare authority schedules.
          </div>
        )}

        <div className="py-3 flex items-center justify-between gap-4 setting-row">
          <span className="text-sm font-sans text-text">Security contact</span>
          <a
            href="mailto:security@kaya.health"
            className="font-mono text-sm text-text hover:underline"
          >
            security@kaya.health
          </a>
        </div>
      </div>
    </SectionCard>
  );
};
