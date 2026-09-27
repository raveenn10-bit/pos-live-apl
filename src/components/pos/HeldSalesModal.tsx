'use client';

import React from 'react';
import { useStore } from '../../context/StoreContext';
import { PauseCircle, PlayCircle, Trash2, X, ShoppingBag, Clock } from 'lucide-react';

interface HeldSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HeldSalesModal: React.FC<HeldSalesModalProps> = ({ isOpen, onClose }) => {
  const { heldSales, restoreHeldSale, discardHeldSale } = useStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-light-surface/60 dark:bg-dark-surface/60 border-b border-light-border dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <PauseCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Parked / Held Sales ({heldSales.length})
              </h2>
              <p className="text-[11px] text-light-muted dark:text-dark-muted">
                Restore held cart to resume checkout without re-scanning items
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {heldSales.length === 0 ? (
            <div className="p-10 text-center text-xs text-light-muted dark:text-dark-muted space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-400" />
              <div>No parked sales on hold.</div>
              <div className="text-[11px] text-slate-500">Press F8 in POS anytime to hold the current cart.</div>
            </div>
          ) : (
            heldSales.map((held) => (
              <div
                key={held.id}
                className="p-4 rounded-xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{held.customerName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {held.heldAt}
                    </span>
                  </div>
                  <div className="text-[11px] text-light-muted dark:text-dark-muted">
                    {held.items.length} item(s) • <span className="font-semibold text-slate-700 dark:text-slate-300">{held.note}</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-brand-500">
                    LKR {held.total.toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      restoreHeldSale(held.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Resume</span>
                  </button>
                  <button
                    onClick={() => discardHeldSale(held.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Discard"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
