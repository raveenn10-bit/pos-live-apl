'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Unlock, LogOut, Delete, KeyRound, ShieldAlert } from 'lucide-react';

export const LockScreenModal: React.FC = () => {
  const { currentUser, isLocked, unlockScreen, logout } = useAuth();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isLocked || !currentUser) return null;

  const handleUnlock = (codeToTest?: string) => {
    const val = codeToTest !== undefined ? codeToTest : pinInput;
    const success = unlockScreen(val);
    if (success) {
      setPinInput('');
      setErrorMsg('');
    } else {
      setErrorMsg('Incorrect PIN or password');
      setPinInput('');
    }
  };

  const handleKeypadPress = (digit: string) => {
    setErrorMsg('');
    if (pinInput.length < 12) {
      const next = pinInput + digit;
      setPinInput(next);
      if (next.length === 4 && (next === currentUser.pinCode || next === '1234')) {
        handleUnlock(next);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark-bg/95 backdrop-blur-xl flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* AppleVision Store Logo */}
        <div className="w-16 h-16 rounded-2xl bg-black border border-brand-500/40 p-2 shadow-2xl shadow-brand-500/20 mb-4 flex items-center justify-center">
          <img 
            src="./assets/logo.jpg" 
            alt="Apple Vision" 
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight">AppleVision Store Galle</h2>
        <div className="flex items-center gap-1.5 text-xs text-brand-400 font-medium mt-0.5">
          <Lock className="w-3.5 h-3.5" />
          <span>Screen Locked for Security</span>
        </div>

        {/* User Card */}
        <div className="mt-6 flex items-center gap-3 px-4 py-2 rounded-2xl bg-dark-surface/80 border border-dark-border">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-rose-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {currentUser.name.charAt(0)}
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-white">{currentUser.name}</div>
            <div className="text-[11px] text-slate-400 capitalize">{currentUser.role} • @{currentUser.username}</div>
          </div>
        </div>

        {/* PIN Display / Input */}
        <div className="mt-6 w-full">
          <div className="flex justify-center items-center gap-2 mb-3">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  pinInput.length > idx
                    ? 'bg-brand-500 scale-110 shadow-glow-red'
                    : 'bg-slate-700/80 border border-slate-600'
                }`}
              />
            ))}
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Enter PIN or Password..."
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setErrorMsg('');
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full py-2.5 px-4 text-center rounded-xl bg-dark-surface border border-dark-border text-white text-sm tracking-widest placeholder:tracking-normal placeholder:text-slate-500 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 mt-2 font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* PIN Pad 1-9 */}
        <div className="grid grid-cols-3 gap-2.5 mt-5 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeypadPress(digit)}
              className="h-12 rounded-xl bg-dark-surface/90 hover:bg-dark-elevated border border-dark-border text-white font-mono text-base font-semibold transition-all active:scale-95 flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-dark-surface/60 hover:bg-dark-elevated border border-dark-border text-slate-400 hover:text-white font-mono text-sm transition-all active:scale-95 flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            className="h-12 rounded-xl bg-dark-surface/90 hover:bg-dark-elevated border border-dark-border text-white font-mono text-base font-semibold transition-all active:scale-95 flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleUnlock()}
            className="h-12 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-mono text-sm font-semibold transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-brand-500/25"
          >
            <Unlock className="w-4 h-4" />
          </button>
        </div>

        {/* Switch User / Logout */}
        <div className="mt-6 flex items-center justify-between w-full max-w-[260px] text-xs">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch User</span>
          </button>
          <span className="text-[11px] text-slate-500 font-mono">PIN: 1234</span>
        </div>
      </div>
    </div>
  );
};
