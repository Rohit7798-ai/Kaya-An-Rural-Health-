import React, { useState } from 'react';
import { StaffUser } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  staffList: StaffUser[];
  onLogin: (user: StaffUser) => void;
  clinicName: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  staffList,
  onLogin,
  clinicName,
}) => {
  const [selectedStaff, setSelectedStaff] = useState<StaffUser>(staffList[0]);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setError('Enter your 4-digit staff PIN to continue.');
      return;
    }
    if (pin === selectedStaff.pin) {
      onLogin(selectedStaff);
    } else {
      setError(`Incorrect PIN for ${selectedStaff.name}. Try again or select another account.`);
    }
  };

  const handleQuickLogin = (staff: StaffUser) => {
    setSelectedStaff(staff);
    setPin(staff.pin);
    onLogin(staff);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 text-left">
      <div className="w-full max-w-sm">
        {/* Clinic Mark & Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent-soft)] mb-3">
            <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent)]" />
          </div>
          <h1 className="text-[22px] font-semibold text-[var(--text)] tracking-tight">Kaya</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">{clinicName}</p>
        </div>

        {/* Login Card */}
        <Card padding="lg" className="w-full">
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[13px] font-medium text-[var(--text)] select-none block mb-1.5">
                Staff member
              </label>
              <div className="flex flex-col gap-1.5">
                {staffList.map((staff) => (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => {
                      setSelectedStaff(staff);
                      setPin('');
                      setError('');
                    }}
                    className={`h-11 px-3 text-left rounded-[6px] border text-[13px] flex items-center justify-between transition-colors cursor-pointer ${
                      selectedStaff.id === staff.id
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-medium'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-alt)]'
                    }`}
                  >
                    <span>{staff.name}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">{staff.role}</span>
                  </button>
                ))}
              </div>
            </div>

            <Input
              type="password"
              label="Staff PIN"
              placeholder="••••"
              maxLength={6}
              mono
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError('');
              }}
              helperText={`Demo PIN for ${selectedStaff.name}: ${selectedStaff.pin}`}
              error={error}
              autoFocus
            />

            <div className="pt-2 flex flex-col gap-2">
              <Button type="submit" variant="primary" size="lg" className="w-full">
                Sign in to Kaya
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                className="w-full text-[13px] text-[var(--text-muted)]"
                onClick={() => handleQuickLogin(selectedStaff)}
              >
                Quick demo bypass as {selectedStaff.name.split(' ')[0]}
              </Button>
            </div>
          </form>
        </Card>

        {/* Offline notice */}
        <div className="mt-4 text-center">
          <p className="text-[12px] text-[var(--text-muted)] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
            Offline-first register · Data stored securely on this computer
          </p>
        </div>
      </div>
    </div>
  );
};
