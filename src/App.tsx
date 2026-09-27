'use client';

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/common/Header';
import { Sidebar, ActiveTab } from './components/common/Sidebar';
import { CommandPalette } from './components/common/CommandPalette';
import { LockScreenModal } from './components/common/LockScreenModal';
import { ChangePasswordModal } from './components/common/ChangePasswordModal';
import { DevicePassportModal } from './components/common/DevicePassportModal';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginScreen } from './components/auth/LoginScreen';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Barcode, 
  Wrench, 
  Menu, 
  X, 
  Sparkles, 
  Package, 
  Users, 
  Truck, 
  Wallet, 
  BarChart3, 
  Settings,
  ChevronRight,
  Repeat
} from 'lucide-react';

// View modules
import { DashboardView } from './components/dashboard/DashboardView';
import { PosView } from './components/pos/PosView';
import { AiCenterView } from './components/ai/AiCenterView';
import { InventoryView } from './components/inventory/InventoryView';
import { CustomersView } from './components/customers/CustomersView';
import { RepairsView } from './components/repairs/RepairsView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { TradeInView } from './components/tradein/TradeInView';
import { FloatingAssistant } from './components/ai/FloatingAssistant';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { activePassportDevice, closeDevicePassport } = useStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  // Global keydown listeners for shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K for command palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // Alt+1 for dashboard
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        setActiveTab('dashboard');
        return;
      }

      // F4 for IMEI Passport
      if (e.key === 'F4') {
        e.preventDefault();
        setIsPassportModalOpen(true);
        return;
      }

      // Escape to close modals
      // Escape to close modals
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsPassportModalOpen(false);
        closeDevicePassport();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [closeDevicePassport]);

  // Lock mobile pinch-to-zoom and double-tap zoom for native app feel
  useEffect(() => {
    const preventPinch = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    let lastTouchEnd = 0;
    const preventDoubleTap = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchstart', preventPinch, { passive: false });
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });
    document.addEventListener('touchend', preventDoubleTap, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventPinch);
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
      document.removeEventListener('touchend', preventDoubleTap);
    };
  }, []);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text overflow-hidden select-none overscroll-none transition-colors duration-200">
      {/* Top Header */}
      <Header
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenImeiSearch={() => setIsPassportModalOpen(true)}
      />

      {/* Main Workspace: Sidebar + Dynamic View Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* View Content Canvas */}
        <main className="flex-1 overflow-y-auto overscroll-y-contain -webkit-overflow-scrolling-touch p-3 sm:p-4 md:p-6 pb-28 md:pb-6 bg-light-bg dark:bg-dark-bg transition-colors duration-200">
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={setActiveTab}
              onOpenImeiSearch={() => setIsPassportModalOpen(true)}
            />
          )}

          {activeTab === 'pos' && (
            <PosView onOpenImeiSearch={() => setIsPassportModalOpen(true)} />
          )}

          {activeTab === 'passport' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-center space-y-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Global Hardware Trace & IMEI Passport
                </h2>
                <p className="text-xs text-light-muted">
                  Click below or press <kbd className="font-mono bg-light-elevated dark:bg-dark-elevated px-1.5 py-0.5 rounded text-[11px]">F4</kbd> anytime to open the full Device Passport inspection portal.
                </p>
                <button
                  onClick={() => setIsPassportModalOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/25 mt-2"
                >
                  Launch IMEI Scanner & Passport Portal (F4)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'tradein' && <TradeInView />}
          {activeTab === 'ai' && <AiCenterView />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'customers' && <CustomersView />}
          {activeTab === 'repairs' && <RepairsView />}
          {activeTab === 'purchases' && <PurchasesView />}
          {activeTab === 'expenses' && <ExpensesView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* iOS Bottom Navigation Tab Bar for mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/80 dark:bg-black/90 backdrop-blur-2xl border-t border-white/10 px-4 py-2 flex items-center justify-around pb-safe select-none">
        {/* 1. Dashboard */}
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setIsMoreDrawerOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'dashboard' && !isMoreDrawerOpen
              ? 'text-brand-500 scale-105'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">Dashboard</span>
        </button>

        {/* 2. POS */}
        <button
          onClick={() => {
            setActiveTab('pos');
            setIsMoreDrawerOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'pos' && !isMoreDrawerOpen
              ? 'text-brand-500 scale-105'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">POS</span>
        </button>

        {/* 3. IMEI Search (Floating Center Squircle / Passport) */}
        <button
          onClick={() => {
            setIsPassportModalOpen(true);
            setIsMoreDrawerOpen(false);
          }}
          className="flex flex-col items-center justify-center -mt-4 group transition-transform active:scale-95"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-rose-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/40 border border-white/25">
            <Barcode className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold tracking-tight text-white/90 mt-0.5">IMEI</span>
        </button>

        {/* 4. Repairs */}
        <button
          onClick={() => {
            setActiveTab('repairs');
            setIsMoreDrawerOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'repairs' && !isMoreDrawerOpen
              ? 'text-brand-500 scale-105'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Wrench className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">Repairs</span>
        </button>

        {/* 5. More */}
        <button
          onClick={() => setIsMoreDrawerOpen(prev => !prev)}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            isMoreDrawerOpen || (!['dashboard', 'pos', 'passport', 'repairs'].includes(activeTab))
              ? 'text-brand-500 scale-105'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">More</span>
        </button>
      </nav>

      {/* iOS Mobile "More" Drawer / Action Sheet */}
      {isMoreDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsMoreDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Bottom Sheet */}
          <div className="relative z-10 bg-neutral-900/95 dark:bg-neutral-950/95 text-white backdrop-blur-2xl rounded-t-3xl border-t border-white/15 p-5 pb-8 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* Drag capsule */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="font-bold text-base text-white">AppleVision Store Galle</h3>
                <p className="text-xs text-neutral-400">All Operations & Services</p>
              </div>
              <button
                onClick={() => setIsMoreDrawerOpen(false)}
                className="p-2 rounded-full bg-white/10 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'tradein', label: 'Trade-In / Exchange', icon: Repeat, color: 'text-amber-400 bg-amber-500/10' },
                { id: 'ai', label: 'Gemini AI Center', icon: Sparkles, color: 'text-brand-400 bg-brand-500/10' },
                { id: 'inventory', label: 'Inventory', icon: Package, color: 'text-emerald-400 bg-emerald-500/10' },
                { id: 'customers', label: 'Customers & Credit', icon: Users, color: 'text-blue-400 bg-blue-500/10' },
                { id: 'purchases', label: 'Purchases & Intake', icon: Truck, color: 'text-amber-400 bg-amber-500/10' },
                { id: 'expenses', label: 'Expenses & Cash', icon: Wallet, color: 'text-rose-400 bg-rose-500/10' },
                { id: 'reports', label: 'Reports & P&L', icon: BarChart3, color: 'text-purple-400 bg-purple-500/10' },
                { id: 'settings', label: 'Settings & Admin', icon: Settings, color: 'text-slate-300 bg-slate-500/10' },
                { id: 'passport', label: 'IMEI Passport', icon: Barcode, color: 'text-cyan-400 bg-cyan-500/10' },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as ActiveTab);
                      setIsMoreDrawerOpen(false);
                    }}
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition-all text-left ${
                      isActive
                        ? 'bg-brand-500 text-white border-brand-400 shadow-md shadow-brand-500/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-neutral-200'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/20 text-white' : item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Global Modals & Overlays */}
      <LockScreenModal />
      <ChangePasswordModal />

      <DevicePassportModal
        isOpen={isPassportModalOpen || !!activePassportDevice}
        onClose={() => {
          setIsPassportModalOpen(false);
          closeDevicePassport();
        }}
        onNavigateToPos={() => setActiveTab('pos')}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        setActiveTab={setActiveTab}
        onOpenImeiSearch={() => setIsPassportModalOpen(true)}
      />

      <FloatingAssistant />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          <MainLayout />
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
