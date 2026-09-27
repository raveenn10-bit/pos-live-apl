'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useStore } from '../../context/StoreContext';
import { 
  Search, 
  Sun, 
  Moon, 
  Monitor, 
  Lock, 
  LogOut, 
  Wifi, 
  WifiOff, 
  Command, 
  Sparkles,
  Barcode
} from 'lucide-react';

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onOpenImeiSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCommandPalette, onOpenImeiSearch }) => {
  const { currentUser, logout, lockScreen } = useAuth();
  const { themeMode, activeTheme, toggleTheme, setThemeMode } = useTheme();
  const { isOnline, toggleOnline, getDeviceByImeiOrSerial, openDevicePassport, showNotification } = useStore();

  const [headerSearch, setHeaderSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerSearch.trim()) return;

    const result = getDeviceByImeiOrSerial(headerSearch.trim());
    if (result) {
      openDevicePassport(result.device, result.product);
      setHeaderSearch('');
    } else {
      showNotification('warning', `No device matched IMEI/Serial: "${headerSearch}"`);
    }
  };

  return (
    <header className="h-14 md:h-16 px-3 md:px-4 bg-white/80 dark:bg-dark-card/90 backdrop-blur-md border-b border-light-border dark:border-dark-border flex items-center justify-between z-30 select-none transition-colors duration-200">
      {/* Brand & Live Online Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <img 
            src="./assets/logo.jpg" 
            alt="Apple Vision Logo" 
            className="w-8 h-8 md:w-9 md:h-9 rounded-lg object-contain bg-black border border-brand-500/30 p-0.5 shadow-sm"
            onError={(e) => {
              // Fallback if image fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-white">
                Apple<span className="text-brand-500">Vision</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase px-1 sm:px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Galle
              </span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-light-muted dark:text-dark-muted font-medium hidden sm:block">
              Reliable Best Service
            </div>
          </div>
        </div>

        {/* Live Status Pill */}
        <button
          onClick={toggleOnline}
          title="Click to toggle Online / Offline simulation"
          className={`ml-1 sm:ml-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 sm:gap-1.5 transition-all duration-200 border ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
          }`}
        >
          <span className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          {isOnline ? (
            <span className="flex items-center gap-1">
              <span>ONLINE</span> <span className="text-[9px] opacity-75 hidden sm:inline">— AI READY</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span>OFFLINE</span> <span className="text-[9px] opacity-75 hidden sm:inline">— CORE POS</span>
            </span>
          )}
        </button>

        {/* Live Auto-Save & 2x Daily Backup Indicator */}
        <div 
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-slate-700 dark:text-slate-300"
          title="Automatic disk persistence & 2x daily backup engine active"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Auto-Saved • 2x Daily Backup</span>
        </div>
      </div>

      {/* Global IMEI / Serial Search Bar & Command Palette (Desktop) */}
      <div className="hidden md:flex items-center gap-2 max-w-md w-full mx-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <input
            type="text"
            placeholder="Scan / Enter IMEI or Serial... (F4)"
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            className="w-full pl-9 pr-14 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors font-mono"
          />
          <Barcode className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <button
            type="button"
            onClick={onOpenImeiSearch}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-light-elevated dark:bg-dark-elevated text-light-muted dark:text-dark-muted rounded border border-light-border dark:border-dark-border hover:text-brand-500"
          >
            F4
          </button>
        </form>

        <button
          onClick={onOpenCommandPalette}
          className="px-2.5 py-1.5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 transition-colors flex items-center gap-1.5 text-xs"
          title="Quick Commands (Ctrl+K)"
        >
          <Command className="w-3.5 h-3.5" />
          <span className="font-mono text-[10px] hidden md:inline">Ctrl+K</span>
        </button>
      </div>

      {/* Right Controls: Quick Mobile Tools, Clock, Theme, Lock, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Mobile quick action buttons */}
        <div className="flex md:hidden items-center gap-1">
          <button
            type="button"
            onClick={onOpenImeiSearch}
            className="p-1.5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors"
            title="Scan IMEI (F4)"
          >
            <Barcode className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="p-1.5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors"
            title="Search Commands"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Live Clock (Desktop) */}
        <div className="hidden lg:flex flex-col text-right">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-[10px] text-light-muted dark:text-dark-muted font-medium">
            {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>

        <div className="h-6 w-px bg-light-border dark:bg-dark-border hidden lg:block" />

        {/* Theme Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Current: ${themeMode} (Click to switch)`}
          className="p-1.5 sm:p-2 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors"
        >
          {themeMode === 'dark' ? (
            <Moon className="w-4 h-4 text-brand-400" />
          ) : themeMode === 'light' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Monitor className="w-4 h-4 text-blue-400" />
          )}
        </button>

        {/* Lock Screen Button */}
        <button
          onClick={lockScreen}
          title="Lock Screen"
          className="hidden sm:flex p-2 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors"
        >
          <Lock className="w-4 h-4" />
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-0.5 sm:pl-1">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-brand-600 to-rose-400 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-brand-500/20">
            {currentUser?.name.charAt(0) || 'A'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
              {currentUser?.name || 'Surinda'}
            </div>
            <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium capitalize">
              {currentUser?.role || 'Admin'}
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
