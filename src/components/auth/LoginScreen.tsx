'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  AlertTriangle, 
  Sun, 
  Moon, 
  Monitor, 
  CheckCircle2, 
  ShieldCheck,
  MapPin,
  Phone
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const { themeMode, toggleTheme } = useTheme();

  const [username, setUsername] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('applevision_remembered_user') || 'surinda';
    }
    return 'surinda';
  });
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUser, setRememberUser] = useState(true);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setIsCapsLockOn(true);
    } else {
      setIsCapsLockOn(false);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setIsCapsLockOn(true);
    } else {
      setIsCapsLockOn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await login(username, password);
      if (res.success) {
        if (rememberUser) {
          localStorage.setItem('applevision_remembered_user', username);
        } else {
          localStorage.removeItem('applevision_remembered_user');
        }
      } else {
        setErrorMessage(res.error || 'Invalid username or password');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text relative overflow-hidden select-none transition-colors duration-200">
      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white/80 dark:bg-dark-card/80 backdrop-blur border border-light-border dark:border-dark-border text-slate-700 dark:text-slate-300 hover:text-brand-500 shadow-sm transition-colors"
          title="Toggle Theme"
        >
          {themeMode === 'dark' ? (
            <Moon className="w-4 h-4 text-brand-400" />
          ) : themeMode === 'light' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Monitor className="w-4 h-4 text-blue-400" />
          )}
        </button>
      </div>

      {/* Decorative ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Box */}
      <div className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-3xl shadow-2xl border border-light-border dark:border-dark-border p-8 backdrop-blur-md">
          {/* Logo & Store Title */}
          <div className="text-center mb-7">
            <div className="inline-block relative mb-3">
              <img
                src="./assets/logo.jpg"
                alt="Apple Vision Store Galle"
                className="w-20 h-20 rounded-2xl object-contain mx-auto bg-black p-1 border-2 border-brand-500/30 shadow-xl shadow-brand-500/20"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-dark-card rounded-full" />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Apple<span className="text-brand-500">Vision</span> Store
            </h1>
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mt-0.5">
              Galle • Reliable Best Service
            </p>
            <p className="text-[11px] text-light-muted dark:text-dark-muted mt-1">
              Commercial Windows Desktop POS & Inventory System
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-xs font-medium flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Caps Lock Alert */}
          {isCapsLockOn && (
            <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Caps Lock is ON</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. surinda"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white font-mono transition-colors"
                  required
                />
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter store password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white font-mono transition-colors"
                  required
                />
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Help */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberUser}
                  onChange={(e) => setRememberUser(e.target.checked)}
                  className="rounded border-slate-400 text-brand-500 focus:ring-brand-500"
                />
                <span>Remember Username</span>
              </label>
              <span className="text-[11px] text-light-muted dark:text-dark-muted font-mono">
                Initial: surinda
              </span>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-brand-500/25 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Terminal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Bar */}
          <div className="mt-6 pt-5 border-t border-light-border dark:border-dark-border">
            <div className="text-[10px] uppercase font-bold text-light-muted dark:text-dark-muted text-center tracking-wider mb-2.5">
              Quick Role Switch (Demo)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('surinda', 'admin123')}
                className="px-2 py-1.5 rounded-lg bg-light-surface dark:bg-dark-surface hover:bg-light-elevated dark:hover:bg-dark-elevated border border-light-border dark:border-dark-border text-[10px] font-semibold text-center text-slate-700 dark:text-slate-300 transition-colors"
              >
                <div className="text-brand-500 font-bold">Admin</div>
                <div>surinda</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('sandun', 'admin123')}
                className="px-2 py-1.5 rounded-lg bg-light-surface dark:bg-dark-surface hover:bg-light-elevated dark:hover:bg-dark-elevated border border-light-border dark:border-dark-border text-[10px] font-semibold text-center text-slate-700 dark:text-slate-300 transition-colors"
              >
                <div className="text-blue-400 font-bold">Cashier</div>
                <div>sandun</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('tech_nuwan', 'admin123')}
                className="px-2 py-1.5 rounded-lg bg-light-surface dark:bg-dark-surface hover:bg-light-elevated dark:hover:bg-dark-elevated border border-light-border dark:border-dark-border text-[10px] font-semibold text-center text-slate-700 dark:text-slate-300 transition-colors"
              >
                <div className="text-amber-400 font-bold">Technician</div>
                <div>tech_nuwan</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <footer className="py-4 text-center text-xs text-light-muted dark:text-dark-muted border-t border-light-border dark:border-dark-border bg-white/40 dark:bg-dark-card/40 backdrop-blur">
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-brand-500" />
            Kalegana Junction, Galle, Sri Lanka
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            +94 77 923 0519
          </span>
          <span>•</span>
          <span>Licensed to Nethmina Abayarathne</span>
        </div>
      </footer>
    </div>
  );
};
