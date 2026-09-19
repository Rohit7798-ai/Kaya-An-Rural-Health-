import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ActivityEvent } from '../../features/reports/reportsTypes';

export interface RecentActivityProps {
  events: ActivityEvent[];
  defaultOpen?: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  events,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  return (
    <div className="bg-surface border border-border rounded-md shadow-none overflow-hidden text-left">
      {/* Toggle header row */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full px-6 sm:px-8 py-5 flex items-center justify-between text-left hover:bg-surface-alt/40 transition-colors cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.04em] text-text-muted font-sans font-medium">
            Recent activity
          </span>
          <span className="text-xs font-mono text-text-muted">
            ({events.length} {events.length === 1 ? 'event' : 'events'})
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs font-sans text-text-muted">
          <span>{isOpen ? 'Hide' : 'Show'}</span>
          <ChevronDown
            className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            strokeWidth={1.5}
          />
        </div>
      </button>

      {/* Expanded Table */}
      {isOpen && (
        <div className="border-t border-border">
          {events.length === 0 ? (
            <div className="p-8">
              <p className="font-serif text-sm text-text">
                No activity recorded in this period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/20 text-xs font-sans text-text-muted">
                    <th className="py-2.5 px-6 font-medium">Time</th>
                    <th className="py-2.5 px-6 font-medium">User</th>
                    <th className="py-2.5 px-6 font-medium">Action</th>
                    <th className="py-2.5 px-6 font-medium">Patient</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-sans text-xs">
                  {events.map((event) => (
                    <tr
                      key={event.id}
                      className="hover:bg-surface-alt transition-colors"
                    >
                      {/* Time (mono) */}
                      <td className="py-3 px-6 font-mono text-text-muted whitespace-nowrap">
                        {event.time}
                      </td>

                      {/* User (Inter) */}
                      <td className="py-3 px-6 text-text whitespace-nowrap">
                        {event.user}
                      </td>

                      {/* Action (Inter 500) */}
                      <td className="py-3 px-6 text-text font-medium">
                        {event.action}
                      </td>

                      {/* Patient (mono ID + name) */}
                      <td className="py-3 px-6 whitespace-nowrap">
                        <span className="font-mono text-text-muted mr-2">
                          {event.patientId}
                        </span>
                        <span className="text-text font-medium">
                          {event.patientName}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
