'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Barcode, 
  Package, 
  Users, 
  Wrench, 
  Truck, 
  Wallet, 
  BarChart3, 
  Settings, 
  Moon, 
  Sun, 
  Sparkles, 
  X,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useTheme } from '../../context/ThemeContext';
import { ActiveTab } from './Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenImeiSearch: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  onOpenImeiSearch,
}) => {
  const { products, toggleOnline, openDevicePassport } = useStore();
  const { toggleTheme, activeTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultCommands = [
    { id: 'pos', title: 'Open POS Billing (F2)', icon: ShoppingCart, category: 'Navigation', action: () => { setActiveTab('pos'); onClose(); } },
    { id: 'imei', title: 'Global IMEI Search & Passport (F4)', icon: Barcode, category: 'Quick Action', action: () => { onClose(); onOpenImeiSearch(); } },
    { id: 'ai', title: 'Gemini AI Center — Invoice Import', icon: Sparkles, category: 'AI Tools', action: () => { setActiveTab('ai'); onClose(); } },
    { id: 'inventory', title: 'Manage Inventory & Stock', icon: Package, category: 'Navigation', action: () => { setActiveTab('inventory'); onClose(); } },
    { id: 'repairs', title: 'Repairs & Service Pipeline', icon: Wrench, category: 'Navigation', action: () => { setActiveTab('repairs'); onClose(); } },
    { id: 'customers', title: 'Customers & Credit Ledger', icon: Users, category: 'Navigation', action: () => { setActiveTab('customers'); onClose(); } },
    { id: 'expenses', title: 'Record Expense / Cash Drawer', icon: Wallet, category: 'Navigation', action: () => { setActiveTab('expenses'); onClose(); } },
    { id: 'purchases', title: 'Supplier Purchases & Intake', icon: Truck, category: 'Navigation', action: () => { setActiveTab('purchases'); onClose(); } },
    { id: 'reports', title: 'Reports & P&L Statement', icon: BarChart3, category: 'Navigation', action: () => { setActiveTab('reports'); onClose(); } },
    { id: 'settings', title: 'Store Settings & Gemini Key', icon: Settings, category: 'Navigation', action: () => { setActiveTab('settings'); onClose(); } },
    { id: 'theme', title: `Toggle Theme (${activeTheme === 'dark' ? 'Switch to Light' : 'Switch to Dark'})`, icon: activeTheme === 'dark' ? Sun : Moon, category: 'Preference', action: () => { toggleTheme(); onClose(); } },
    { id: 'online', title: 'Toggle Online / Offline Status', icon: Sparkles, category: 'System', action: () => { toggleOnline(); onClose(); } },
  ];

  // Filter commands and products
  const matchedCommands = defaultCommands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const matchedProducts = query.trim().length > 1
    ? products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.sku.toLowerCase().includes(query.toLowerCase()) ||
        (p.storage && p.storage.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 5)
    : [];

  const allItems = [
    ...matchedCommands.map(c => ({ type: 'command' as const, data: c })),
    ...matchedProducts.map(p => ({ type: 'product' as const, data: p })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (allItems.length || 1)) % (allItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) {
        if (current.type === 'command') {
          current.data.action();
        } else {
          setActiveTab('inventory');
          onClose();
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4 select-none">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative border-b border-light-border dark:border-dark-border px-4 py-3 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, navigate, or search product catalog..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-light-muted dark:text-dark-muted">
              No matching commands or products found for "{query}"
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;

              if (item.type === 'command') {
                const Icon = item.data.icon;
                return (
                  <button
                    key={item.data.id}
                    onClick={item.data.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-brand-500 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-light-surface dark:hover:bg-dark-surface'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.data.title}</span>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-light-elevated dark:bg-dark-elevated text-light-muted dark:text-dark-muted'
                      }`}
                    >
                      {item.data.category}
                    </span>
                  </button>
                );
              }

              // Product result
              const prod = item.data;
              return (
                <button
                  key={prod.id}
                  onClick={() => {
                    setActiveTab('inventory');
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-light-surface dark:hover:bg-dark-surface'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-brand-500'}`} />
                    <div className="text-left">
                      <div className="font-semibold">{prod.name}</div>
                      <div className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        SKU: {prod.sku} • Stock: {prod.currentStock} units
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">LKR {prod.sellingPrice.toLocaleString()}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-light-muted'}`}>
                      {prod.condition}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-light-surface/60 dark:bg-dark-surface/60 border-t border-light-border dark:border-dark-border flex items-center justify-between text-[11px] text-light-muted dark:text-dark-muted">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-light-elevated dark:bg-dark-elevated px-1.5 py-0.5 rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-light-elevated dark:bg-dark-elevated px-1.5 py-0.5 rounded">Enter</kbd> Select</span>
            <span><kbd className="font-mono bg-light-elevated dark:bg-dark-elevated px-1.5 py-0.5 rounded">Esc</kbd> Close</span>
          </div>
          <div className="font-mono text-[10px]">AppleVision Quick Command</div>
        </div>
      </div>
    </div>
  );
};
