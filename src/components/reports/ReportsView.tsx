'use client';

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  BarChart3, 
  Download, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Receipt, 
  Package, 
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { sales, expenses, products, showNotification } = useStore();

  const [dateRange, setDateRange] = useState<'Today' | '7D' | 'Month' | 'All'>('Month');
  const [reportTab, setReportTab] = useState<'pnl' | 'sales' | 'inventory'>('pnl');

  // Calculations
  const totalSalesRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalProfit = sales.reduce((acc, s) => acc + s.profitTotal, 0);
  const totalOperatingExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalCogs = Math.max(0, totalSalesRevenue - totalProfit);
  const netIncome = totalProfit - totalOperatingExpenses;

  // Inventory valuation
  const totalUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalInventoryCost = products.reduce((acc, p) => acc + p.costPrice * p.currentStock, 0);
  const totalInventoryRetail = products.reduce((acc, p) => acc + p.sellingPrice * p.currentStock, 0);
  const potentialProfit = Math.max(0, totalInventoryRetail - totalInventoryCost);

  // CSV Export
  const handleExportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportTab === 'sales') {
      csvContent += 'Invoice Number,Date,Time,Customer,Items Count,Subtotal,Discount,Total Amount,Profit,Payment Method\n';
      sales.forEach(s => {
        csvContent += `"${s.invoiceNumber}","${s.date}","${s.time}","${s.customerName}",${s.items.length},${s.subtotal},${s.discountTotal},${s.totalAmount},${s.profitTotal},"${s.paymentMethod}"\n`;
      });
    } else if (reportTab === 'inventory') {
      csvContent += 'Product Name,SKU,Category,Condition,Stock Units,Cost Price,Selling Price,Total Cost Value,Total Retail Value\n';
      products.forEach(p => {
        csvContent += `"${p.name}","${p.sku}","${p.category}","${p.condition}",${p.currentStock},${p.costPrice},${p.sellingPrice},${p.costPrice * p.currentStock},${p.sellingPrice * p.currentStock}\n`;
      });
    } else {
      // P&L CSV
      csvContent += 'Metric,Amount (LKR)\n';
      csvContent += `Gross Revenue,${totalSalesRevenue}\n`;
      csvContent += `Cost of Goods Sold (COGS),${totalCogs}\n`;
      csvContent += `Gross Profit,${totalProfit}\n`;
      csvContent += `Operating Expenses,${totalOperatingExpenses}\n`;
      csvContent += `Net Store Income,${netIncome}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AppleVision_${reportTab}_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('success', `Exported ${reportTab.toUpperCase()} report to CSV file`);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-brand-500/10 text-brand-500">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Financial Reports & Store Analytics
            </h2>
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
            Realized profit & loss statements, inventory asset valuation, and audited sales ledgers.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-sm flex items-center gap-2 transition-all hover:opacity-90"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/70 dark:bg-dark-card/70 backdrop-blur border border-light-border dark:border-dark-border text-xs">
        <button
          onClick={() => setReportTab('pnl')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            reportTab === 'pnl'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Profit & Loss Statement
        </button>

        <button
          onClick={() => setReportTab('sales')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            reportTab === 'sales'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Sales Breakdown ({sales.length})
        </button>

        <button
          onClick={() => setReportTab('inventory')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            reportTab === 'inventory'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Inventory Asset Valuation
        </button>
      </div>

      {/* P&L STATEMENT VIEW */}
      {reportTab === 'pnl' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Big Summary Card */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Store Income Statement (LKR)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-light-border dark:border-dark-border">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Gross Sales Revenue:</span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  LKR {totalSalesRevenue.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted">Cost of Goods Sold (COGS):</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  -LKR {totalCogs.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-2.5 bg-emerald-500/5 px-3 rounded-xl border border-emerald-500/20 font-bold">
                <span className="text-emerald-600 dark:text-emerald-400">Gross Profit:</span>
                <span className="font-mono text-emerald-500 text-sm">
                  LKR {totalProfit.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted">Total Operating Expenses:</span>
                <span className="font-mono text-amber-500">
                  -LKR {totalOperatingExpenses.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-rose-600 text-white font-black text-base shadow-lg shadow-brand-500/25">
                <span>NET STORE PROFIT:</span>
                <span className="font-mono text-xl">
                  LKR {netIncome.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Col */}
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-light-muted">
                Gross Profit Margin
              </div>
              <div className="font-mono font-black text-2xl text-emerald-500">
                {totalSalesRevenue > 0 ? Math.round((totalProfit / totalSalesRevenue) * 100) : 0}%
              </div>
              <div className="text-xs text-light-muted">Realized retail spread on Apple devices</div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-light-muted">
                Operating Expense Ratio
              </div>
              <div className="font-mono font-black text-2xl text-amber-500">
                {totalSalesRevenue > 0 ? Math.round((totalOperatingExpenses / totalSalesRevenue) * 100) : 0}%
              </div>
              <div className="text-xs text-light-muted">Rent, salaries, fibre internet, & marketing</div>
            </div>
          </div>
        </div>
      )}

      {/* SALES BREAKDOWN VIEW */}
      {reportTab === 'sales' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-bold text-[10px] uppercase tracking-wider">
                  <th className="pb-3">Invoice #</th>
                  <th className="pb-3">Date / Time</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3 text-right">Subtotal</th>
                  <th className="pb-3 text-right">Discount</th>
                  <th className="pb-3 text-right">Net Total</th>
                  <th className="pb-3 text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-light-surface/40 dark:hover:bg-dark-surface/40">
                    <td className="py-3 font-mono font-bold text-brand-500">{s.invoiceNumber}</td>
                    <td className="py-3 font-mono text-light-muted">{s.date} {s.time}</td>
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{s.customerName}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{s.items.length}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono">LKR {s.subtotal.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono text-emerald-500">
                      {s.discountTotal > 0 ? `-LKR ${s.discountTotal.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      LKR {s.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-500">
                      +LKR {s.profitTotal.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVENTORY VALUATION VIEW */}
      {reportTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-light-muted">
                Total Stock Units
              </div>
              <div className="font-mono font-black text-xl text-slate-900 dark:text-white">
                {totalUnits} Units on Hand
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-light-muted">
                Total Inward Cost Valuation
              </div>
              <div className="font-mono font-black text-xl text-slate-900 dark:text-white">
                LKR {totalInventoryCost.toLocaleString()}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-light-muted">
                Retail Potential Valuation
              </div>
              <div className="font-mono font-black text-xl text-brand-500">
                LKR {totalInventoryRetail.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-bold text-[10px] uppercase tracking-wider">
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3 text-center">In Stock</th>
                    <th className="pb-3 text-right">Unit Cost</th>
                    <th className="pb-3 text-right">Unit Retail</th>
                    <th className="pb-3 text-right">Holding Cost</th>
                    <th className="pb-3 text-right">Retail Potential</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-light-surface/40 dark:hover:bg-dark-surface/40">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                      <td className="py-3 font-mono text-light-muted">{p.sku}</td>
                      <td className="py-3 text-center font-mono font-bold">{p.currentStock}</td>
                      <td className="py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        LKR {p.costPrice.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-mono font-semibold">
                        LKR {p.sellingPrice.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        LKR {(p.costPrice * p.currentStock).toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-brand-500">
                        LKR {(p.sellingPrice * p.currentStock).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
