'use client';

import React, { useState } from 'react';
import { InvoiceImport } from './InvoiceImport';
import { ProductNormalizer } from './ProductNormalizer';
import { StoreAssistant } from './StoreAssistant';
import { 
  Sparkles, 
  FileText, 
  Languages, 
  MessageSquare, 
  ShieldCheck, 
  Zap, 
  Cpu,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AiCenterView: React.FC = () => {
  const { isOnline, settings } = useStore();
  const [activeAiTab, setActiveAiTab] = useState<'invoice' | 'normalize' | 'assistant'>('invoice');

  return (
    <div className="space-y-6">
      {/* AI Hub Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-700/60 shadow-xl relative overflow-hidden select-none">
        <div className="absolute right-0 top-0 w-96 h-full bg-brand-500/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">
                Gemini Multimodal Intelligence
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              AppleVision AI Center
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Commercial vision OCR for supplier invoices, trade shorthand normalization, and conversational business telemetry with strict safety gates.
            </p>
          </div>

          {/* Model Status Card */}
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-1.5 min-w-[200px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Active Engine</span>
              <span className="font-mono text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                <Cpu className="w-3.5 h-3.5" />
                {settings.geminiModel}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-700">
              <span className="text-slate-400">Connectivity:</span>
              <span className={`font-semibold flex items-center gap-1 ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {isOnline ? 'Cloud AI Ready' : 'Local Fallback'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/70 dark:bg-dark-card/70 backdrop-blur border border-light-border dark:border-dark-border text-xs select-none">
        <button
          onClick={() => setActiveAiTab('invoice')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
            activeAiTab === 'invoice'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Smart Invoice Intake</span>
        </button>

        <button
          onClick={() => setActiveAiTab('normalize')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
            activeAiTab === 'normalize'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Languages className="w-4 h-4" />
          <span>Product Indexing & Shorthand</span>
        </button>

        <button
          onClick={() => setActiveAiTab('assistant')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
            activeAiTab === 'assistant'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>AI Store Assistant</span>
        </button>
      </div>

      {/* Sub-View Rendering */}
      <div>
        {activeAiTab === 'invoice' && <InvoiceImport />}
        {activeAiTab === 'normalize' && <ProductNormalizer />}
        {activeAiTab === 'assistant' && <StoreAssistant />}
      </div>
    </div>
  );
};
