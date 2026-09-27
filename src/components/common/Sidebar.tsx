'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Barcode, 
  Sparkles, 
  Package, 
  Users, 
  Wrench, 
  Truck, 
  Wallet, 
  BarChart3, 
  Settings,
  Phone,
  MapPin
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export type ActiveTab = 
  | 'dashboard' 
  | 'pos' 
  | 'passport' 
  | 'ai' 
  | 'inventory' 
  | 'customers' 
  | 'repairs' 
  | 'purchases' 
  | 'expenses' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { products, repairs } = useStore();

  const lowStockCount = products.filter(p => p.currentStock <= p.minStock).length;
  const activeRepairsCount = repairs.filter(r => r.status !== 'Delivered').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'Alt+1' },
    { id: 'pos', label: 'POS Billing', icon: ShoppingCart, shortcut: 'F2', highlight: true },
    { id: 'passport', label: 'IMEI Passport', icon: Barcode, shortcut: 'F4' },
    { id: 'ai', label: 'Gemini AI Center', icon: Sparkles, badge: 'AI', aiGlow: true },
    { id: 'inventory', label: 'Inventory', icon: Package, badge: lowStockCount > 0 ? `${lowStockCount} LOW` : undefined, badgeColor: 'bg-amber-500/20 text-amber-500 border-amber-500/30' },
    { id: 'customers', label: 'Customers & Credit', icon: Users },
    { id: 'repairs', label: 'Repairs & Service', icon: Wrench, badge: activeRepairsCount > 0 ? `${activeRepairsCount}` : undefined, badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { id: 'purchases', label: 'Purchases & Intake', icon: Truck },
    { id: 'expenses', label: 'Expenses & Cash', icon: Wallet },
    { id: 'reports', label: 'Reports & P&L', icon: BarChart3 },
    { id: 'settings', label: 'Settings & Admin', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white/70 dark:bg-dark-card/80 backdrop-blur-md border-r border-light-border dark:border-dark-border hidden md:flex flex-col justify-between select-none z-20 flex-shrink-0 transition-colors duration-200">
      {/* Navigation Links */}
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
          Store Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group relative ${
                isActive
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-light-surface dark:hover:bg-dark-surface hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : item.aiGlow ? 'text-brand-500 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : item.badgeColor || 'bg-brand-500/10 text-brand-500 border-brand-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.shortcut && (
                  <span
                    className={`text-[10px] font-mono px-1 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-light-elevated dark:bg-dark-elevated text-light-muted dark:text-dark-muted'
                    }`}
                  >
                    {item.shortcut}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Store Footer Info */}
      <div className="p-3 border-t border-light-border dark:border-dark-border bg-light-surface/50 dark:bg-dark-surface/30">
        <div className="p-2.5 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-[11px] space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
            <span className="truncate">Kalegana Junction, Galle</span>
          </div>
          <div className="flex items-center gap-1.5 text-light-muted dark:text-dark-muted">
            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-mono text-[10px]">+94 77 923 0519</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
