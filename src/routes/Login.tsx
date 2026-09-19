// Supabase Auth Login with Offline PIN Fallback & Pull Hydration
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ToastContainer, ToastItem } from '../components/ui/Toast';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { pullAll } from '../lib/pull';
import { sessionStore, hashPin } from '../state/session';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  // Mode: password vs pin
  const [authMode, setAuthMode] = useState<'password' | 'pin'>('password');

  // Fields
  const [identifier, setIdentifier] = useState('amina.k@clinic.kaya');
  const [password, setPassword] = useState('clinic2026');
  const [pin, setPin] = useState(['', '', '', '']);
  const [rememberDevice, setRememberDevice] = useState(true);

  // States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPinShake, setIsPinShake] = useState(false);

  // PIN creation prompt modal after first online login
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [newPin, setNewPin] = useState(['', '', '', '']);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Refs for 4-box PIN input
  const pinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const setupPinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Auto-focus first PIN box when switching to PIN mode
  useEffect(() => {
    if (authMode === 'pin') {
      pinInputRefs[0].current?.focus();
    }
  }, [authMode]);

  // Handle PIN change and auto-advance
  const handlePinChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const updated = [...pin];

    if (cleaned.length > 0) {
      updated[index] = cleaned[cleaned.length - 1];
      setPin(updated);
      setErrorMessage(null);
      if (index < 3) {
        pinInputRefs[index + 1].current?.focus();
      }
    } else {
      updated[index] = '';
      setPin(updated);
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinInputRefs[index - 1].current?.focus();
    } else if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleSetupPinChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const updated = [...newPin];

    if (cleaned.length > 0) {
      updated[index] = cleaned[cleaned.length - 1];
      setNewPin(updated);
      if (index < 3) {
        setupPinRefs[index + 1].current?.focus();
      }
    } else {
      updated[index] = '';
      setNewPin(updated);
    }
  };

  const handleSaveOfflinePin = async () => {
    const pinStr = newPin.join('');
    if (pinStr.length === 4) {
      const pinH = await hashPin(pinStr);
      sessionStore.setOfflinePinHash(pinH);
    }
    setShowPinSetupModal(false);
    // Background hydrator
    void pullAll();
    navigate('/patients');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (authMode === 'password') {
      if (!identifier.trim()) {
        setErrorMessage('Please enter your email or staff ID.');
        return;
      }
      if (!password) {
        setErrorMessage('Password is required.');
        return;
      }

      setIsLoading(true);

      try {
        if (isSupabaseConfigured() && navigator.onLine) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: identifier.includes('@') ? identifier.trim() : `${identifier.trim()}@clinic.kaya`,
            password,
          });

          if (error) {
            setErrorMessage(error.message || "Email or password doesn't match.");
            setIsLoading(false);
            return;
          }

          const user = data.user;
          const sessionUser = {
            id: user.id,
            email: user.email || identifier,
            full_name: (user.user_metadata?.full_name as string) || 'Dr. Amina Khan',
            clinic_id: (user.user_metadata?.clinic_id as string) || 'cln-wardha-01',
            role: (user.user_metadata?.role as any) || 'Admin',
          };

          sessionStore.setSession(sessionUser, null, false);

          // Check if user has offline PIN
          const hasPin = sessionStore.getOfflinePinHash();
          if (!hasPin) {
            setIsLoading(false);
            setShowPinSetupModal(true);
            return;
          }

          // Trigger background pullAll()
          void pullAll();
          setIsLoading(false);
          navigate('/patients');
        } else {
          // Offline password fallback (demo/dev)
          const sessionUser = {
            id: 'usr-default-01',
            email: identifier,
            full_name: 'Dr. Amina Khan',
            clinic_id: 'cln-wardha-01',
            role: 'Admin' as const,
          };
          sessionStore.setSession(sessionUser, null, true);

          const hasPin = sessionStore.getOfflinePinHash();
          if (!hasPin) {
            setIsLoading(false);
            setShowPinSetupModal(true);
            return;
          }

          void pullAll();
          setIsLoading(false);
          navigate('/patients');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Authentication failed';
        setErrorMessage(msg);
        setIsLoading(false);
      }
    } else {
      // PIN Mode
      const pinCode = pin.join('');
      if (pinCode.length < 4) {
        setErrorMessage('Please enter your 4-digit PIN.');
        return;
      }

      setIsLoading(true);
      const isMatch = await sessionStore.verifyOfflinePin(pinCode);

      if (isMatch) {
        const lastSession = sessionStore.getState();
        const user = lastSession.user || {
          id: 'usr-default-01',
          email: 'amina.k@clinic.kaya',
          full_name: 'Dr. Amina Khan',
          clinic_id: 'cln-wardha-01',
          role: 'Admin' as const,
        };
        sessionStore.setSession(user, lastSession.clinic, true);
        setIsLoading(false);
        navigate('/patients');
      } else {
        setIsLoading(false);
        setIsPinShake(true);
        setPin(['', '', '', '']);
        setErrorMessage('Incorrect PIN.');
        setTimeout(() => setIsPinShake(false), 500);
        pinInputRefs[0].current?.focus();
      }
    }
  };

  // Open offline
  const handleOpenOffline = () => {
    setAuthMode('pin');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center p-4 font-sans select-none">
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* Brand */}
      <div className="flex items-center gap-2 mb-6">
        <span className="w-2 h-2 rounded-full bg-accent shrink-0" aria-hidden="true" />
        <span className="font-sans font-medium text-lg text-text tracking-tight">
          Kaya
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-[400px] bg-surface border border-border rounded-sm p-6 shadow-none text-left">
        <h1 className="text-2xl font-semibold text-text leading-tight mb-1">
          {authMode === 'password' ? 'Sign in' : 'Offline PIN Unlock'}
        </h1>
        <p className="text-sm text-text-muted mb-6">
          {authMode === 'password' ? 'Use your clinic account.' : 'Enter your 4-digit offline PIN.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {authMode === 'password' && (
            <Input
              id="login-identifier"
              label="Email or staff ID"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. amina.k@clinic.kaya"
              autoComplete="username"
              disabled={isLoading}
              required
            />
          )}

          {authMode === 'password' ? (
            <div>
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isLoading}
                placeholder="Enter password"
                autoComplete="current-password"
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="p-1 rounded-sm text-text-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="w-4 h-4" strokeWidth={1.5} />
                    )}
                  </button>
                }
              />
            </div>
          ) : (
            <div className="flex flex-col text-left">
              <label className="text-xs font-medium text-text-muted mb-1.5">
                4-digit PIN
              </label>
              <div className={`flex items-center gap-3 justify-between ${isPinShake ? 'animate-bounce' : ''}`}>
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    ref={pinInputRefs[index]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={pin[index]}
                    disabled={isLoading}
                    aria-label={`PIN digit ${index + 1}`}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                    className="w-14 h-12 text-center font-mono text-xl bg-surface text-text rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 transition-colors disabled:opacity-50"
                  />
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <p className="text-xs text-danger font-sans leading-normal -mt-1">
              {errorMessage}
            </p>
          )}

          <div className="flex items-center justify-between pt-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-text">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded-sm border border-border text-accent focus:ring-accent accent-accent cursor-pointer"
              />
              <span>Remember this device</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'password' ? 'pin' : 'password');
                setErrorMessage(null);
              }}
              className="text-text-muted hover:text-text font-medium underline-offset-2 hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-sm"
            >
              {authMode === 'password' ? 'Use PIN instead' : 'Use password instead'}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            className="w-full mt-2 rounded-sm"
          >
            {isLoading ? 'Authenticating…' : authMode === 'password' ? 'Sign in' : 'Unlock offline'}
          </Button>
        </form>
      </div>

      <div className="mt-4 text-center text-xs text-text-muted max-w-[400px]">
        Offline? You can still open the app if you've signed in before.{' '}
        <button
          type="button"
          onClick={handleOpenOffline}
          className="text-text font-medium underline underline-offset-2 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-sm cursor-pointer ml-1"
        >
          Open offline
        </button>
      </div>

      {/* PIN Setup Modal for Offline Access */}
      {showPinSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface border border-border rounded-sm p-6 max-w-sm w-full shadow-lg text-left">
            <h2 className="text-lg font-semibold text-text mb-1">Set 4-Digit Offline PIN</h2>
            <p className="text-xs text-text-muted mb-4">
              Create a quick PIN so you can access clinic records even when there is no internet connection.
            </p>
            <div className="flex items-center gap-3 justify-between mb-5">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  ref={setupPinRefs[index]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={newPin[index]}
                  onChange={(e) => handleSetupPinChange(index, e.target.value)}
                  className="w-14 h-12 text-center font-mono text-xl bg-surface text-text rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                />
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPinSetupModal(false);
                  void pullAll();
                  navigate('/patients');
                }}
              >
                Skip for now
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={newPin.join('').length < 4}
                onClick={handleSaveOfflinePin}
              >
                Save PIN
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
