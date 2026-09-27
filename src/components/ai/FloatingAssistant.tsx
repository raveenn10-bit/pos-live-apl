'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Bot, X, Maximize2, Minimize2 } from 'lucide-react';
import { StoreAssistant } from './StoreAssistant';

export const FloatingAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Floating Chat Modal / Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 ease-out flex flex-col ${
            isExpanded
              ? 'bottom-4 right-4 w-[540px] h-[85vh] max-h-[800px]'
              : 'bottom-20 right-6 w-[420px] h-[640px] max-h-[calc(100vh-120px)]'
          }`}
          style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.35))' }}
        >
          {/* Header Bar with Window Controls */}
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-t-3xl flex items-center justify-between border-t border-x border-slate-700 select-none">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold tracking-wide">Gemini Store AI Copilot</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                className="p-1 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
                title={isExpanded ? 'Restore Size' : 'Expand Size'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
                title="Close AI Assistant (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Assistant View Body */}
          <div className="flex-1 bg-white dark:bg-dark-card rounded-b-3xl border-b border-x border-light-border dark:border-dark-border overflow-hidden">
            <StoreAssistant compact={true} />
          </div>
        </div>
      )}

      {/* Floating Bottom-Right Launcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Toggle AppleVision AI Assistant"
        className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 group flex items-center gap-2.5 p-3.5 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 select-none ${
          isOpen
            ? 'bg-slate-900 text-white border-2 border-brand-500 shadow-brand-500/25 rotate-90 scale-95'
            : 'bg-gradient-to-r from-brand-600 via-rose-600 to-amber-600 text-white hover:shadow-brand-500/40 hover:scale-105 hover:-translate-y-1'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 -rotate-90 transition-transform" />
        ) : (
          <>
            <div className="relative flex items-center justify-center">
              <Bot className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </div>
            <span className="hidden md:inline-block pr-1 font-extrabold text-xs tracking-wider uppercase">
              Ask AI
            </span>
          </>
        )}

        {/* Pulse Ring when Closed */}
        {!isOpen && (
          <span className="absolute -inset-1 rounded-full bg-brand-500/30 animate-ping pointer-events-none -z-10" />
        )}
      </button>
    </>
  );
};
