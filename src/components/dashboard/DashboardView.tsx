'use client';

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { ActiveTab } from '../common/Sidebar';
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
  CreditCard
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

  // KPI calculations
  const todayStr = new Date().toISOString().substring(0, 10);
  const todaySalesList = sales.filter(s => s.date === todayStr);
  const todaySalesTotal = todaySalesList.reduce((acc, s) => acc + s.totalAmount, 0);
  const todayProfitTotal = todaySalesList.reduce((acc, s) => acc + s.profitTotal, 0);
  const todayMarginPct = todaySalesTotal > 0 ? Math.round((todayProfitTotal / todaySalesTotal) * 100) : 0;
  const todayTxCount = todaySalesList.length;
  const todayAvgTicket = todayTxCount > 0 ? Math.round(todaySalesTotal / todayTxCount) : 0;

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
                        onClick={() => setLastCompletedSale(sale)}
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
  );
};
