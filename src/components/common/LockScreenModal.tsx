'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Unlock, LogOut, Delete, ShieldAlert } from 'lucide-react';
import { APPLEVISION_LOGO_BASE64 } from '../../assets/logoBase64';

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

  const keypadButtons = [
    { num: '1', letters: '' },
    { num: '2', letters: 'ABC' },
    { num: '3', letters: 'DEF' },
    { num: '4', letters: 'GHI' },
    { num: '5', letters: 'JKL' },
    { num: '6', letters: 'MNO' },
    { num: '7', letters: 'PQRS' },
    { num: '8', letters: 'TUV' },
    { num: '9', letters: 'WXYZ' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#090a10]/95 backdrop-blur-2xl flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* AppleVision Store Logo */}
        <div className="w-16 h-16 rounded-2xl bg-black border border-white/20 p-2 shadow-2xl shadow-red-500/20 mb-3 flex items-center justify-center">
          <img 
            src={APPLEVISION_LOGO_BASE64} 
            alt="AppleVision Store Galle" 
            className="w-full h-full object-contain rounded-xl"
          />
        </div>

        <h2 className="text-xl font-black text-white tracking-tight">AppleVision Store Galle</h2>
        <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold mt-1">
          <Lock className="w-3.5 h-3.5 text-red-500" />
          <span>Screen Locked for Security</span>
        </div>

        {/* User Card */}
        <div className="mt-5 flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
            {currentUser.name.charAt(0)}
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-white">{currentUser.name}</div>
            <div className="text-[11px] text-white/70 capitalize font-medium">{currentUser.role} • @{currentUser.username}</div>
          </div>
        </div>

        {/* PIN Display Dots & Input */}
        <div className="mt-6 w-full max-w-[280px]">
          <div className="flex justify-center items-center gap-3 mb-3">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  pinInput.length > idx
                    ? 'bg-red-500 scale-125 border-2 border-white shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                    : 'bg-white/10 border-2 border-white/30'
                }`}
              />
            ))}
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Enter PIN..."
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setErrorMsg('');
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full py-2.5 px-4 text-center rounded-xl bg-white/10 border border-white/20 text-white text-base tracking-widest placeholder:tracking-normal placeholder:text-white/40 focus:outline-none focus:border-red-500 font-mono font-bold"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 mt-2 font-bold bg-red-500/10 py-1.5 px-3 rounded-lg border border-red-500/20">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* iOS Styled Passcode Keypad */}
        <div className="grid grid-cols-3 gap-3 mt-5 w-full max-w-[270px]">
          {keypadButtons.map((btn) => (
            <button
              key={btn.num}
              type="button"
              onClick={() => handleKeypadPress(btn.num)}
              className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 border border-white/15 text-white transition-all flex flex-col items-center justify-center shadow-sm"
            >
              <span className="font-sans text-2xl font-bold text-white leading-none">
                {btn.num}
              </span>
              {btn.letters && (
                <span className="text-[8.5px] font-bold text-white/60 tracking-widest leading-none mt-0.5">
                  {btn.letters}
                </span>
              )}
            </button>
          ))}

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            title="Delete"
            className="h-14 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-white/70 hover:text-white transition-all flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>

          {/* Zero Button */}
          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 border border-white/15 text-white transition-all flex flex-col items-center justify-center shadow-sm"
          >
            <span className="font-sans text-2xl font-bold text-white leading-none">
              0
            </span>
          </button>

          {/* Unlock Submit Button */}
          <button
            type="button"
            onClick={() => handleUnlock()}
            title="Unlock Screen"
            className="h-14 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white transition-all flex items-center justify-center shadow-lg shadow-red-600/40"
          >
            <Unlock className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Switch User / Hint row */}
        <div className="mt-6 flex items-center justify-between w-full max-w-[270px] text-xs">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-white/70 hover:text-red-400 font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch User</span>
          </button>

          <span className="text-[11px] text-white/70 font-mono bg-white/10 px-2.5 py-1 rounded-full border border-white/15 font-semibold">
            PIN: 1234
          </span>
        </div>
      </div>
    </div>
  );
};
