'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { ActiveTab } from '../common/Sidebar';
import { Sale } from '../../types';
import { ReceiptModal } from '../pos/ReceiptModal';
import { 
  PlusCircle, 
  Barcode, 
  PackagePlus, 
  Truck, 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Smartphone, 
  AlertTriangle, 
  PieChart as PieIcon, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  CreditCard,
  Repeat,
  Wrench
} from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenImeiSearch: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab, onOpenImeiSearch }) => {
  const { 
    products, 
    sales, 
    expenses, 
    customers, 
    repairs, 
    auditLogs, 
    isOnline, 
    setLastCompletedSale 
  } = useStore();
  const { currentUser } = useAuth();

  const [chartTimeframe, setChartTimeframe] = useState<'Today' | '7D' | '30D' | 'Month'>('7D');
  const [activeChartTab, setActiveChartTab] = useState<'revenue' | 'profit' | 'expenses' | 'category' | 'payments'>('revenue');
  const [mobileTimeframe, setMobileTimeframe] = useState<'Today' | '7D' | '30D' | 'All'>('Today');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // KPI calculations
  const todayStr = new Date().toISOString().substring(0, 10);
  const todaySalesList = sales.filter(s => s.date === todayStr);
  const todaySalesTotal = todaySalesList.reduce((acc, s) => acc + s.totalAmount, 0);
  const todayProfitTotal = todaySalesList.reduce((acc, s) => acc + s.profitTotal, 0);
  const todayMarginPct = todaySalesTotal > 0 ? Math.round((todayProfitTotal / todaySalesTotal) * 100) : 0;
  const todayTxCount = todaySalesList.length;
  const todayAvgTicket = todayTxCount > 0 ? Math.round(todaySalesTotal / todayTxCount) : 0;

  const filteredSales = useMemo(() => {
    if (mobileTimeframe === 'Today') {
      return sales.filter(s => s.date === todayStr);
    }
    if (mobileTimeframe === '7D') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const cutoff = d.toISOString().substring(0, 10);
      return sales.filter(s => s.date >= cutoff);
    }
    if (mobileTimeframe === '30D') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const cutoff = d.toISOString().substring(0, 10);
      return sales.filter(s => s.date >= cutoff);
    }
    return sales;
  }, [sales, mobileTimeframe, todayStr]);

  const handleOpenReceipt = (sale: Sale) => {
    setLastCompletedSale(sale);
    setIsReceiptOpen(true);
  };

  const totalStockUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const lowStockProducts = products.filter(p => p.currentStock <= p.minStock);
  const totalStockCost = products.reduce((acc, p) => acc + p.costPrice * p.currentStock, 0);
  const totalStockRetail = products.reduce((acc, p) => acc + p.sellingPrice * p.currentStock, 0);

  const monthlySalesTotal = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalOutstandingCredit = customers.reduce((acc, c) => acc + c.creditBalance, 0);

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const cat = prod?.category || 'iPhones';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + item.lineTotal;
    });
  });

  const categoryTotals = Object.entries(categoryCounts).map(([cat, total]) => ({
    name: cat,
    total,
    percent: monthlySalesTotal > 0 ? Math.round((total / monthlySalesTotal) * 100) : 0,
  }));

  // Payment methods breakdown
  const paymentTotals: Record<string, number> = {
    Cash: 0,
    Card: 0,
    'Bank Transfer': 0,
    'Customer Credit': 0,
    Split: 0,
  };
  sales.forEach(s => {
    paymentTotals[s.paymentMethod] = (paymentTotals[s.paymentMethod] || 0) + s.totalAmount;
  });

  // Chart data points (Simulated based on timeframe)
  const chartDays = chartTimeframe === 'Today' ? ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00']
    : chartTimeframe === '7D' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  const revenueSeries = chartTimeframe === 'Today'
    ? [25000, 391500, 86500, 120000, 45000, 75000, 30000]
    : chartTimeframe === '7D'
    ? [310000, 485000, 290000, 640000, 520000, 890000, 652000]
    : [1850000, 2400000, 2150000, 2950000];

  const expenseSeries = chartTimeframe === 'Today'
    ? [5000, 1500, 2800, 0, 1200, 800, 0]
    : chartTimeframe === '7D'
    ? [25000, 32000, 18000, 120000, 15000, 42000, 28000]
    : [180000, 210000, 290000, 240000];

  const profitSeries = revenueSeries.map((r, i) => Math.max(0, Math.round(r * 0.14)));

  const maxRevenue = Math.max(...revenueSeries, 1);

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* ULTRA-PREMIUM APPLE IPHONE MATCHING AESTHETIC MOBILE VIEW */}
      {/* ======================================================== */}
      <div className="md:hidden space-y-4">
        {/* 1. iOS Dynamic Island / Status Capsule */}
        <div className="flex justify-center pt-1 pb-1">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/95 dark:bg-black text-white shadow-2xl border border-white/15 backdrop-blur-2xl">
            {/* Apple Logo */}
            <div className="text-white/95">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.94-12.04-14.57-6.53-10.02-11.66-21.78-15.39-35.27-3.72-13.5-5.59-26.33-5.59-38.48 0-14.79 3.65-27.15 10.96-37.07 7.31-9.92 16.59-14.94 27.82-15.07 4.93 0 10.51 1.34 16.74 4.02 6.23 2.68 10.08 4.09 11.57 4.23 2.01-.27 6.13-1.8 12.35-4.59 6.23-2.79 11.75-4.04 16.57-3.77 13.98.78 24.89 5.86 32.72 15.24-12.32 7.48-18.35 17.65-18.09 30.52.26 10.27 4.15 18.8 11.66 25.6 7.51 6.8 16.35 10.74 26.52 11.83-2.24 6.78-4.87 13.78-7.87 21.01zM119.22 32.64c0-7.27 2.64-14.15 7.92-20.64 5.29-6.49 11.85-10.76 19.7-12.8 1.02 7.27-.93 14.19-5.83 20.76-4.91 6.58-11.45 10.97-19.64 13.19-.71-.16-1.42-.33-2.15-.51z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold tracking-tight text-white/95">
              AppleVision <span className="text-white/60 font-normal">Galle</span>
            </span>

            <span className="w-1 h-1 rounded-full bg-white/30" />

            {/* Live Trading Status Dot */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                Live
              </span>
            </div>

            <span className="w-1 h-1 rounded-full bg-white/30" />

            {/* Digital Time */}
            <span className="text-[11px] font-mono text-white/80 tabular-nums">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* 2. Apple Wallet / Apple Card Styled Hero Glass Card */}
        <div className="relative overflow-hidden rounded-3xl p-5 text-white shadow-2xl border border-white/20 dark:border-white/10 bg-gradient-to-br from-neutral-900 via-zinc-900 to-black select-none">
          {/* Ambient Apple Card glow */}
          <div className="absolute -top-16 -right-16 w-52 h-52 bg-gradient-to-br from-rose-500/25 via-amber-500/20 to-purple-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Card subtle mesh pattern / metallic shine */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Card Top Row: Chip / NFC & Store Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Apple Card Chip Style */}
                <div className="w-9 h-7 rounded-md border border-amber-300/40 bg-gradient-to-br from-amber-200/20 to-amber-500/20 flex items-center justify-center p-1">
                  <div className="w-full h-full border border-amber-200/30 rounded grid grid-cols-2 grid-rows-2 gap-0.5" />
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                    AppleVision Titanium Card
                  </div>
                  <div className="text-[11px] font-semibold text-neutral-200">
                    Galle Flagship Store
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{todayMarginPct}% Margin</span>
              </div>
            </div>

            {/* Hero Revenue Display */}
            <div className="pt-1">
              <div className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">
                Today's Gross Revenue
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-sm font-semibold text-neutral-400 font-mono">LKR</span>
                <span className="text-3xl font-extrabold tracking-tight font-mono text-white">
                  {todaySalesTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Card Bottom Row: Details and stats */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-neutral-300">
                <span className="font-semibold">{todayTxCount} Transactions</span>
                <span className="text-white/30">•</span>
                <span className="text-neutral-400 font-mono text-[11px]">Avg LKR {todayAvgTicket.toLocaleString()}</span>
              </div>

              <button
                onClick={() => setActiveTab('pos')}
                className="px-3 py-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-[11px] shadow-lg shadow-brand-500/30 flex items-center gap-1 transition-transform active:scale-95"
              >
                <span>Charge</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. iOS Control Center Quick Action Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Quick Actions
            </span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-neutral-500">
              Control Center
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* 1. + Sale [Red] */}
            <button
              onClick={() => setActiveTab('pos')}
              className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-md shadow-red-500/30 group-hover:scale-105 transition-transform">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  + Sale
                </div>
                <div className="text-[10px] text-slate-400 dark:text-neutral-400 font-medium">
                  New POS
                </div>
              </div>
            </button>

            {/* 2. Scan IMEI [Blue] */}
            <button
              onClick={onOpenImeiSearch}
              className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
                <Barcode className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Scan IMEI
                </div>
                <div className="text-[10px] text-slate-400 dark:text-neutral-400 font-medium">
                  Passport
                </div>
              </div>
            </button>

            {/* 3. Trade-In [Orange] */}
            <button
              onClick={() => setActiveTab('pos')}
              className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30 group-hover:scale-105 transition-transform">
                <Repeat className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Trade-In
                </div>
                <div className="text-[10px] text-slate-400 dark:text-neutral-400 font-medium">
                  Exchange
                </div>
              </div>
            </button>

            {/* 4. Stock Intake [Green] */}
            <button
              onClick={() => setActiveTab('inventory')}
              className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Stock Intake
                </div>
                <div className="text-[10px] text-slate-400 dark:text-neutral-400 font-medium">
                  Inventory
                </div>
              </div>
            </button>

            {/* 5. Repairs [Indigo] */}
            <button
              onClick={() => setActiveTab('repairs')}
              className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Repairs
                </div>
                <div className="text-[10px] text-slate-400 dark:text-neutral-400 font-medium">
                  Job Sheets
                </div>
              </div>
            </button>

            {/* 6. Analytics [Purple] */}
            <button
              onClick={() => setActiveTab('reports')}
              className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white flex items-center justify-center shadow-md shadow-purple-500/30 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Analytics
                </div>
                <div className="text-[10px] text-slate-400 dark:text-neutral-400 font-medium">
                  Reports
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 4. iOS 2x2 Apple Health/Fitness Styled Widget Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Store Vitals & Activity
            </span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-neutral-500">
              Live Sensors
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Widget 1: Stock Level with Low Stock Warning */}
            <button
              onClick={() => setActiveTab('inventory')}
              className="p-4 rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between text-left active:scale-[0.98] transition-transform relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                {lowStockProducts.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {lowStockProducts.length} LOW
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    OPTIMAL
                  </span>
                )}
              </div>

              <div className="mt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
                  Hardware Stock
                </div>
                <div className="font-mono font-black text-xl text-slate-900 dark:text-white mt-0.5">
                  {totalStockUnits} <span className="text-xs font-semibold text-slate-400 font-sans">Units</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1 truncate">
                  Valued LKR {(totalStockRetail / 1000000).toFixed(1)}M
                </div>
              </div>
            </button>

            {/* Widget 2: Active Repairs Badge */}
            <button
              onClick={() => setActiveTab('repairs')}
              className="p-4 rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between text-left active:scale-[0.98] transition-transform relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                  GENIUS BAR
                </span>
              </div>

              <div className="mt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
                  Active Repairs
                </div>
                <div className="font-mono font-black text-xl text-slate-900 dark:text-white mt-0.5">
                  {repairs.filter(r => r.status !== 'Delivered').length} <span className="text-xs font-semibold text-slate-400 font-sans">Devices</span>
                </div>
                <div className="text-[10px] text-emerald-500 font-semibold mt-1 truncate flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {repairs.filter(r => r.status === 'Ready for Pickup').length} Ready to Pickup
                </div>
              </div>
            </button>

            {/* Widget 3: Profit Margin Ring (Apple Activity Ring style) */}
            <div className="p-4 rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex items-center justify-between relative overflow-hidden">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
                  Margin Ring
                </div>
                <div className="font-mono font-black text-xl text-emerald-500 mt-0.5">
                  {todayMarginPct}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1">
                  LKR {(todayProfitTotal / 1000).toFixed(0)}k Profit
                </div>
              </div>

              {/* Apple Watch Fitness Style Activity Ring */}
              <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle
                    cx="28"
                    cy="28"
                    r="23"
                    stroke="currentColor"
                    strokeWidth="5"
                    fill="transparent"
                    className="text-emerald-500/20"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="23"
                    stroke="#10b981"
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray={144.5}
                    strokeDashoffset={144.5 * (1 - Math.min(Math.max(todayMarginPct, 0), 100) / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Widget 4: Outstanding Credit */}
            <button
              onClick={() => setActiveTab('customers')}
              className="p-4 rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between text-left active:scale-[0.98] transition-transform relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                  LEDGER
                </span>
              </div>

              <div className="mt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
                  Due Credit
                </div>
                <div className="font-mono font-black text-xl text-rose-500 mt-0.5 truncate">
                  {(totalOutstandingCredit / 1000).toFixed(1)}k <span className="text-xs font-semibold text-slate-400 font-sans">LKR</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1 truncate">
                  {customers.filter(c => c.creditBalance > 0).length} Unsettled accounts
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 5. iOS Segmented Control */}
        <div className="p-1 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/70 backdrop-blur-md flex items-center justify-between text-xs font-semibold select-none">
          {(['Today', '7D', '30D', 'All'] as const).map((tab) => {
            const isActive = mobileTimeframe === tab;
            return (
              <button
                key={tab}
                onClick={() => setMobileTimeframe(tab)}
                className={`flex-1 py-1.5 rounded-xl text-center transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* 6. iOS Grouped List for Recent Invoices */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Recent Invoices
            </span>
            <span className="text-[10px] font-semibold text-brand-500">
              {filteredSales.length} Invoices
            </span>
          </div>

          <div className="rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 divide-y divide-neutral-200/50 dark:divide-neutral-800/80 overflow-hidden shadow-sm">
            {filteredSales.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-neutral-500">
                No invoices found for this timeframe.
              </div>
            ) : (
              filteredSales.slice(0, 6).map((sale) => (
                <button
                  key={sale.id}
                  onClick={() => handleOpenReceipt(sale)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-neutral-500/5 active:bg-neutral-500/10 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Apple Receipt Icon Squircle */}
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {sale.customerName}
                        </span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-sans">
                          {sale.paymentMethod}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-neutral-400 font-mono truncate mt-0.5">
                        {sale.invoiceNumber} • {sale.time} • {sale.items.length} item{sale.items.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        LKR {sale.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-emerald-500 font-semibold">
                        Receipt
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))
            )}
          </div>

          {filteredSales.length > 6 && (
            <button
              onClick={() => setActiveTab('reports')}
              className="w-full py-2.5 rounded-xl bg-white/60 dark:bg-neutral-900/60 border border-white/20 dark:border-white/10 text-center text-xs font-semibold text-brand-500 hover:text-brand-600 active:scale-98 transition-all"
            >
              View All Invoices in Reports ({filteredSales.length})
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* PRESERVED DESKTOP DASHBOARD VIEW (hidden on mobile)      */}
      {/* ======================================================== */}
      <div className="hidden md:block space-y-6">
        {/* Top Hero Section */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 p-6 shadow-xl overflow-hidden select-none">
        <div className="absolute right-0 top-0 w-96 h-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">
                Flagship POS Dashboard
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              <span className="text-xs text-slate-400 font-medium">Kalegana Junction, Galle</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Welcome back, {currentUser?.name || 'Surinda'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              High-speed retail intelligence for genuine Apple devices, serialized device tracking, and instant customer checkout.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('pos')}
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ NEW SALE (F2)</span>
            </button>

            <button
              onClick={onOpenImeiSearch}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Barcode className="w-4 h-4 text-brand-400" />
              <span>SCAN IMEI (F4)</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <PackagePlus className="w-4 h-4 text-emerald-400" />
              <span>ADD STOCK</span>
            </button>

            <button
              onClick={() => setActiveTab('purchases')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Truck className="w-4 h-4 text-blue-400" />
              <span>PURCHASE</span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>EXPENSE</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Today's Sales */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-light-muted dark:text-dark-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Today's Sales</span>
            <DollarSign className="w-4 h-4 text-brand-500" />
          </div>
          <div className="mt-2">
            <div className="font-mono font-black text-sm text-slate-900 dark:text-white truncate">
              LKR {todaySalesTotal.toLocaleString()}
            </div>
            <div className="text-[10px] font-semibold text-emerald-500 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>+18.4% vs y'day</span>
            </div>
          </div>
        </div>

        {/* 2. Today's Profit */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-light-muted dark:text-dark-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Today's Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="font-mono font-black text-sm text-slate-900 dark:text-white truncate">
              LKR {todayProfitTotal.toLocaleString()}
            </div>
            <div className="text-[10px] font-semibold text-emerald-500 mt-0.5">
              Margin: {todayMarginPct}%
            </div>
          </div>
        </div>

        {/* 3. Transactions */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-light-muted dark:text-dark-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Invoices</span>
            <Receipt className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <div className="font-mono font-black text-sm text-slate-900 dark:text-white">
              {todayTxCount} Orders
            </div>
            <div className="text-[10px] text-light-muted dark:text-dark-muted truncate mt-0.5">
              Avg: LKR {todayAvgTicket.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 4. Available Devices */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-light-muted dark:text-dark-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Devices</span>
            <Smartphone className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <div className="font-mono font-black text-sm text-slate-900 dark:text-white">
              {totalStockUnits} Units
            </div>
            <div className="text-[10px] text-light-muted dark:text-dark-muted mt-0.5">
              Across 13 items
            </div>
          </div>
        </div>

        {/* 5. Low Stock */}
        <div className={`p-3.5 rounded-2xl bg-white dark:bg-dark-card border shadow-sm flex flex-col justify-between ${
          lowStockProducts.length > 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-light-border dark:border-dark-border'
        }`}>
          <div className="flex items-center justify-between text-light-muted dark:text-dark-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockProducts.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2">
            <div className="font-mono font-black text-sm text-amber-500">
              {lowStockProducts.length} Items
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              Needs reorder
            </div>
          </div>
        </div>

        {/* 6. Stock Value */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-light-muted dark:text-dark-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Stock Value</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="font-mono font-black text-sm text-slate-900 dark:text-white truncate">
              {(totalStockCost / 1000000).toFixed(2)}M LKR
            </div>
            <div className="text-[10px] text-light-muted dark:text-dark-muted truncate mt-0.5">
              Retail: {(totalStockRetail / 1000000).toFixed(2)}M
            </div>
          </div>
        </div>

        {/* 7. Monthly Revenue */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-light-muted dark:text-dark-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Month Rev</span>
            <TrendingUp className="w-4 h-4 text-brand-500" />
          </div>
          <div className="mt-2">
            <div className="font-mono font-black text-sm text-slate-900 dark:text-white truncate">
              {(monthlySalesTotal / 1000000).toFixed(2)}M
            </div>
            <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">
              Target: 5.0M LKR
            </div>
          </div>
        </div>

        {/* 8. Outstanding Credit */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-light-muted dark:text-dark-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Cust. Credit</span>
            <CreditCard className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <div className="font-mono font-black text-sm text-rose-500 truncate">
              LKR {totalOutstandingCredit.toLocaleString()}
            </div>
            <div className="text-[10px] text-light-muted dark:text-dark-muted mt-0.5">
              Unsettled ledger
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Responsive Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Chart mode tabs */}
            <div className="flex items-center gap-1 p-1 bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border text-xs">
              <button
                onClick={() => setActiveChartTab('revenue')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeChartTab === 'revenue'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Revenue Overview
              </button>
              <button
                onClick={() => setActiveChartTab('profit')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeChartTab === 'profit'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Gross Profit
              </button>
              <button
                onClick={() => setActiveChartTab('expenses')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeChartTab === 'expenses'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Rev vs Expenses
              </button>
            </div>

            {/* Timeframe pill selector */}
            <div className="flex items-center gap-1 text-xs">
              {(['Today', '7D', '30D', 'Month'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    chartTimeframe === tf
                      ? 'bg-light-elevated dark:bg-dark-elevated text-brand-500 border border-brand-500/30'
                      : 'text-light-muted dark:text-dark-muted hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Chart Rendering */}
          <div className="h-64 w-full relative pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e61e25" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#e61e25" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 50, 100, 150].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="600"
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              ))}

              {/* Render Area/Line based on tab */}
              {activeChartTab === 'revenue' && (
                <>
                  <polygon
                    points={`0,200 ${revenueSeries.map((val, idx) => `${(idx / (revenueSeries.length - 1)) * 600},${200 - (val / maxRevenue) * 170}`).join(' ')} 600,200`}
                    fill="url(#revenueGrad)"
                  />
                  <polyline
                    points={revenueSeries.map((val, idx) => `${(idx / (revenueSeries.length - 1)) * 600},${200 - (val / maxRevenue) * 170}`).join(' ')}
                    fill="none"
                    stroke="#e61e25"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {revenueSeries.map((val, idx) => (
                    <circle
                      key={idx}
                      cx={(idx / (revenueSeries.length - 1)) * 600}
                      cy={200 - (val / maxRevenue) * 170}
                      r="4.5"
                      className="fill-white dark:fill-dark-card stroke-brand-500"
                      strokeWidth="2.5"
                    />
                  ))}
                </>
              )}

              {activeChartTab === 'profit' && (
                <>
                  <polygon
                    points={`0,200 ${profitSeries.map((val, idx) => `${(idx / (profitSeries.length - 1)) * 600},${200 - (val / (maxRevenue * 0.2)) * 170}`).join(' ')} 600,200`}
                    fill="url(#profitGrad)"
                  />
                  <polyline
                    points={profitSeries.map((val, idx) => `${(idx / (profitSeries.length - 1)) * 600},${200 - (val / (maxRevenue * 0.2)) * 170}`).join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {profitSeries.map((val, idx) => (
                    <circle
                      key={idx}
                      cx={(idx / (profitSeries.length - 1)) * 600}
                      cy={200 - (val / (maxRevenue * 0.2)) * 170}
                      r="4.5"
                      className="fill-white dark:fill-dark-card stroke-emerald-500"
                      strokeWidth="2.5"
                    />
                  ))}
                </>
              )}

              {activeChartTab === 'expenses' && (
                <>
                  {revenueSeries.map((val, idx) => {
                    const x = (idx / (revenueSeries.length - 1)) * 560 + 20;
                    const hRev = (val / maxRevenue) * 160;
                    const expVal = expenseSeries[idx] || 0;
                    const hExp = (expVal / maxRevenue) * 160;
                    return (
                      <g key={idx}>
                        <rect x={x - 14} y={200 - hRev} width="12" height={hRev} rx="3" fill="#e61e25" />
                        <rect x={x} y={200 - hExp} width="12" height={hExp} rx="3" fill="#f59e0b" />
                      </g>
                    );
                  })}
                </>
              )}
            </svg>

            {/* X-Axis labels */}
            <div className="flex justify-between items-center text-[10px] font-mono text-light-muted dark:text-dark-muted pt-2">
              {chartDays.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Category Breakdown Donut / Stats */}
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-brand-500" />
                Sales by Category
              </h3>
              <span className="text-[10px] font-mono text-light-muted">Total Share</span>
            </div>

            <div className="space-y-3">
              {categoryTotals.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.name}</span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold">
                      {cat.percent}% <span className="text-[10px] text-light-muted font-normal">(LKR {(cat.total / 1000).toFixed(0)}k)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-light-surface dark:bg-dark-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0 ? 'bg-brand-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-purple-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(5, cat.percent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods Pill Summary */}
          <div className="mt-5 pt-4 border-t border-light-border dark:border-dark-border">
            <div className="text-[10px] uppercase font-bold text-light-muted dark:text-dark-muted mb-2">
              Payment Methods Intake
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                <div className="text-[10px] text-light-muted">Cash in Hand</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white">
                  LKR {paymentTotals.Cash.toLocaleString()}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                <div className="text-[10px] text-light-muted">Card Terminal</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white">
                  LKR {paymentTotals.Card.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Sales, Live Activity Feed, Low Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-brand-500" />
              Recent Terminal Invoices
            </h3>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1"
            >
              View Full History <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-bold text-[10px] uppercase tracking-wider">
                  <th className="pb-2.5">Invoice #</th>
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5">Items</th>
                  <th className="pb-2.5">Method</th>
                  <th className="pb-2.5 text-right">Total</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="hover:bg-light-surface/60 dark:hover:bg-dark-surface/60 transition-colors">
                    <td className="py-2.5 font-mono font-bold text-brand-500">
                      {sale.invoiceNumber}
                      <div className="text-[10px] text-light-muted font-normal font-sans">{sale.date} • {sale.time}</div>
                    </td>
                    <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                      {sale.customerName}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400">
                      {sale.items.length} item(s)
                      <div className="text-[10px] text-light-muted truncate max-w-[150px]">
                        {sale.items[0]?.productName}
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      LKR {sale.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleOpenReceipt(sale)}
                        className="px-2 py-1 rounded bg-light-elevated dark:bg-dark-elevated hover:text-brand-500 text-[10px] font-semibold transition-colors"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Activity Feed & Low Stock (1 col) */}
        <div className="space-y-6">
          {/* Low Stock Alert Box */}
          {lowStockProducts.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Low Stock Warning ({lowStockProducts.length})</span>
                </div>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="text-[11px] underline font-bold"
                >
                  Manage
                </button>
              </div>
              <div className="space-y-2">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-xs">
                    <span className="font-semibold truncate max-w-[180px]">{p.name}</span>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      {p.currentStock} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Audit Activity Stream */}
          <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-500" />
              Live Store Activity
            </h3>
            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 text-xs">
                  <div className="mt-1 w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {log.details}
                    </div>
                    <div className="text-[10px] text-light-muted dark:text-dark-muted font-mono flex items-center justify-between mt-0.5">
                      <span>{log.userName}</span>
                      <span>{log.timestamp.substring(11, 16)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Global Thermal Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setLastCompletedSale(null);
        }}
        onNewSale={() => {
          setIsReceiptOpen(false);
          setActiveTab('pos');
        }}
      />
    </div>
  );
};
