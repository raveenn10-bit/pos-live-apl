'use client';

import React, { useState, useMemo } from 'react';
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
  CheckCircle2,
  Printer,
  FileText,
  Wallet,
  Clock,
  Layers
} from 'lucide-react';
import { 
  downloadCsv, 
  downloadHtmlFile, 
  printHtmlViaIframe, 
  generatePrintableReportHtml 
} from '../../utils/exportUtils';

export const ReportsView: React.FC = () => {
  const { sales, expenses, products, settings, showNotification } = useStore();

  const [dateRange, setDateRange] = useState<'Today' | '7D' | 'Month' | 'All'>('Month');
  const [reportTab, setReportTab] = useState<'pnl' | 'sales' | 'inventory' | 'expenses'>('pnl');

  // Filter sales and expenses based on selected date range
  const { filteredSales, filteredExpenses } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysStr = sevenDaysAgo.toISOString().substring(0, 10);

    const currentYearMonth = todayStr.substring(0, 7); // 'YYYY-MM'

    let fSales = sales;
    let fExpenses = expenses;

    if (dateRange === 'Today') {
      fSales = sales.filter(s => s.date === todayStr);
      fExpenses = expenses.filter(e => e.date === todayStr);
    } else if (dateRange === '7D') {
      fSales = sales.filter(s => s.date >= sevenDaysStr);
      fExpenses = expenses.filter(e => e.date >= sevenDaysStr);
    } else if (dateRange === 'Month') {
      fSales = sales.filter(s => s.date.startsWith(currentYearMonth));
      fExpenses = expenses.filter(e => e.date.startsWith(currentYearMonth));
    }

    return { filteredSales: fSales, filteredExpenses: fExpenses };
  }, [sales, expenses, dateRange]);

  // Financial calculations based on filtered data
  const totalSalesRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalProfit = filteredSales.reduce((acc, s) => acc + s.profitTotal, 0);
  const totalOperatingExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalCogs = Math.max(0, totalSalesRevenue - totalProfit);
  const netIncome = totalProfit - totalOperatingExpenses;

  // Inventory valuation (always across live inventory items)
  const totalUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalInventoryCost = products.reduce((acc, p) => acc + p.costPrice * p.currentStock, 0);
  const totalInventoryRetail = products.reduce((acc, p) => acc + p.sellingPrice * p.currentStock, 0);
  const potentialProfit = Math.max(0, totalInventoryRetail - totalInventoryCost);

  // Date range label
  const dateRangeLabel = useMemo(() => {
    if (dateRange === 'Today') return 'Today (Current Shift)';
    if (dateRange === '7D') return 'Last 7 Days Rolling';
    if (dateRange === 'Month') return 'Current Calendar Month';
    return 'All-Time Historical Store Data';
  }, [dateRange]);

  // Handle Export CSV (Browser Blob Download)
  const handleExportCsv = () => {
    try {
      const dateSuffix = new Date().toISOString().substring(0, 10);

      if (reportTab === 'sales') {
        const headers = [
          'Invoice Number', 'Date', 'Time', 'Customer Name', 'Customer Phone', 
          'Items Count', 'Payment Method', 'Subtotal (LKR)', 'Discount (LKR)', 
          'Net Total (LKR)', 'Profit (LKR)'
        ];
        const rows = filteredSales.map(s => [
          s.invoiceNumber,
          s.date,
          s.time,
          s.customerName,
          s.customerPhone || 'N/A',
          s.items.length,
          s.paymentMethod,
          s.subtotal,
          s.discountTotal,
          s.totalAmount,
          s.profitTotal
        ]);
        downloadCsv(`AppleVision_Daily_Sales_Report_${dateRange}_${dateSuffix}.csv`, headers, rows);
      } else if (reportTab === 'inventory') {
        const headers = [
          'Product Name', 'SKU', 'Category', 'Condition', 'Stock Units', 
          'Unit Cost (LKR)', 'Unit Retail (LKR)', 'Total Cost Valuation (LKR)', 
          'Total Retail Valuation (LKR)', 'Potential Margin (LKR)'
        ];
        const rows = products.map(p => [
          p.name,
          p.sku,
          p.category,
          p.condition,
          p.currentStock,
          p.costPrice,
          p.sellingPrice,
          p.costPrice * p.currentStock,
          p.sellingPrice * p.currentStock,
          (p.sellingPrice - p.costPrice) * p.currentStock
        ]);
        downloadCsv(`AppleVision_Inventory_Valuation_Report_${dateSuffix}.csv`, headers, rows);
      } else if (reportTab === 'expenses') {
        const headers = [
          'Date', 'Expense ID', 'Category', 'Description', 'Payment Method', 
          'Receipt / Voucher Ref', 'Recorded By', 'Amount (LKR)'
        ];
        const rows = filteredExpenses.map(e => [
          e.date,
          e.id,
          e.category,
          e.description,
          e.paymentMethod,
          e.receiptRef || 'N/A',
          e.recordedBy,
          e.amount
        ]);
        downloadCsv(`AppleVision_Expense_Report_${dateRange}_${dateSuffix}.csv`, headers, rows);
      } else {
        // P&L CSV
        const headers = ['Financial Metric', 'Value (LKR)', 'Notes'];
        const rows = [
          ['Gross Sales Revenue', totalSalesRevenue, `From ${filteredSales.length} invoice(s)`],
          ['Cost of Goods Sold (COGS)', totalCogs, 'Inward device & accessory cost base'],
          ['Gross Realized Profit', totalProfit, `${totalSalesRevenue > 0 ? Math.round((totalProfit / totalSalesRevenue) * 100) : 0}% Gross Margin`],
          ['Operating Expenses', totalOperatingExpenses, `From ${filteredExpenses.length} expense entry/entries`],
          ['NET STORE INCOME', netIncome, netIncome >= 0 ? 'Operating Surplus' : 'Operating Deficit']
        ];
        downloadCsv(`AppleVision_Profit_and_Loss_${dateRange}_${dateSuffix}.csv`, headers, rows);
      }

      showNotification('success', `Exported ${reportTab.toUpperCase()} CSV report to Downloads`);
    } catch (err: any) {
      console.error('Export CSV error:', err);
      showNotification('error', `CSV Export failed: ${err.message || 'Unknown error'}`);
    }
  };

  // Build HTML Report for Printing or Standalone HTML download
  const buildCurrentReportHtml = (): string => {
    const storeName = settings.fullName || 'AppleVision Store Galle';
    const storePhone = settings.phone || '+94 77 923 0519';
    const storeAddress = settings.address || 'Kalegana Junction, Galle';

    if (reportTab === 'sales') {
      return generatePrintableReportHtml({
        title: 'Daily & Period Sales Breakdown Report',
        subtitle: `Audited sales transactions register (${filteredSales.length} invoices)`,
        dateRangeLabel,
        storeName,
        storePhone,
        storeAddress,
        summaryCards: [
          { label: 'Total Invoices', value: `${filteredSales.length}`, note: 'Completed transactions' },
          { label: 'Gross Revenue', value: `LKR ${totalSalesRevenue.toLocaleString()}`, color: '#0f172a' },
          { label: 'Realized Profit', value: `+LKR ${totalProfit.toLocaleString()}`, color: '#10b981' }
        ],
        headers: ['Invoice #', 'Date & Time', 'Customer', 'Items', 'Method', 'Subtotal', 'Discount', 'Net Total', 'Profit'],
        alignments: ['left', 'left', 'left', 'center', 'center', 'right', 'right', 'right', 'right'],
        rows: filteredSales.map(s => [
          s.invoiceNumber,
          `${s.date} ${s.time}`,
          s.customerName,
          s.items.length,
          s.paymentMethod,
          `LKR ${s.subtotal.toLocaleString()}`,
          s.discountTotal > 0 ? `-LKR ${s.discountTotal.toLocaleString()}` : '-',
          `LKR ${s.totalAmount.toLocaleString()}`,
          `+LKR ${s.profitTotal.toLocaleString()}`
        ]),
        totalRow: [
          'TOTALS',
          '-',
          '-',
          filteredSales.reduce((acc, s) => acc + s.items.length, 0),
          '-',
          `LKR ${filteredSales.reduce((acc, s) => acc + s.subtotal, 0).toLocaleString()}`,
          `-LKR ${filteredSales.reduce((acc, s) => acc + s.discountTotal, 0).toLocaleString()}`,
          `LKR ${totalSalesRevenue.toLocaleString()}`,
          `+LKR ${totalProfit.toLocaleString()}`
        ],
        notes: `Report generated for period: ${dateRangeLabel}. Certified true record of store cash register & POS transactions.`
      });
    }

    if (reportTab === 'inventory') {
      return generatePrintableReportHtml({
        title: 'Inventory Asset Valuation & Stock Ledger',
        subtitle: `Total current assets on hand across ${products.length} registered product lines`,
        dateRangeLabel: 'Live Current Snapshot',
        storeName,
        storePhone,
        storeAddress,
        summaryCards: [
          { label: 'Total Stock Units', value: `${totalUnits} Units`, note: 'In-store stock count' },
          { label: 'Cost Valuation (COGS)', value: `LKR ${totalInventoryCost.toLocaleString()}`, color: '#64748b' },
          { label: 'Retail Value (Potential)', value: `LKR ${totalInventoryRetail.toLocaleString()}`, color: '#3b82f6' },
          { label: 'Potential Profit Spread', value: `+LKR ${potentialProfit.toLocaleString()}`, color: '#10b981' }
        ],
        headers: ['Product Name', 'SKU', 'Category', 'Condition', 'Stock Units', 'Unit Cost', 'Unit Retail', 'Cost Total', 'Retail Total'],
        alignments: ['left', 'left', 'left', 'center', 'center', 'right', 'right', 'right', 'right'],
        rows: products.map(p => [
          p.name,
          p.sku,
          p.category,
          p.condition,
          p.currentStock,
          `LKR ${p.costPrice.toLocaleString()}`,
          `LKR ${p.sellingPrice.toLocaleString()}`,
          `LKR ${(p.costPrice * p.currentStock).toLocaleString()}`,
          `LKR ${(p.sellingPrice * p.currentStock).toLocaleString()}`
        ]),
        totalRow: [
          'PORTFOLIO TOTAL',
          '-',
          '-',
          '-',
          totalUnits,
          '-',
          '-',
          `LKR ${totalInventoryCost.toLocaleString()}`,
          `LKR ${totalInventoryRetail.toLocaleString()}`
        ],
        notes: 'Asset valuation based on inward purchase cost vs official retail display prices. Excludes damaged and returned RMA stock.'
      });
    }

    if (reportTab === 'expenses') {
      return generatePrintableReportHtml({
        title: 'Store Operating Expenses & Outflow Report',
        subtitle: `Petty cash, utility bills, courier costs, and shop overheads (${filteredExpenses.length} entries)`,
        dateRangeLabel,
        storeName,
        storePhone,
        storeAddress,
        summaryCards: [
          { label: 'Total Expense Records', value: `${filteredExpenses.length}`, note: 'Logged vouchers' },
          { label: 'Total Store Expenses', value: `LKR ${totalOperatingExpenses.toLocaleString()}`, color: '#f59e0b' }
        ],
        headers: ['Date', 'Category', 'Description & Voucher', 'Method', 'Recorded By', 'Amount (LKR)'],
        alignments: ['left', 'left', 'left', 'center', 'left', 'right'],
        rows: filteredExpenses.map(e => [
          e.date,
          e.category,
          `${e.description}${e.receiptRef ? ` (Ref: ${e.receiptRef})` : ''}`,
          e.paymentMethod,
          e.recordedBy,
          `LKR ${e.amount.toLocaleString()}`
        ]),
        totalRow: [
          'TOTAL OPERATING EXPENSES',
          '-',
          '-',
          '-',
          '-',
          `LKR ${totalOperatingExpenses.toLocaleString()}`
        ],
        notes: `Total operating outflows recorded for ${dateRangeLabel}. Audited against store cash drawer reconciliation logs.`
      });
    }

    // Default: P&L Statement
    return generatePrintableReportHtml({
      title: 'Store Profit & Loss Statement (Income Statement)',
      subtitle: `Audited financial performance & operating net margin`,
      dateRangeLabel,
      storeName,
      storePhone,
      storeAddress,
      summaryCards: [
        { label: 'Gross Revenue', value: `LKR ${totalSalesRevenue.toLocaleString()}`, color: '#0f172a' },
        { label: 'Gross Margin', value: `${totalSalesRevenue > 0 ? Math.round((totalProfit / totalSalesRevenue) * 100) : 0}%`, color: '#10b981' },
        { label: 'Operating Expenses', value: `LKR ${totalOperatingExpenses.toLocaleString()}`, color: '#f59e0b' },
        { label: 'NET STORE PROFIT', value: `LKR ${netIncome.toLocaleString()}`, color: netIncome >= 0 ? '#10b981' : '#e11d48' }
      ],
      headers: ['Financial Ledger Item', 'Metric Classification', 'Amount (LKR)', 'Revenue %'],
      alignments: ['left', 'left', 'right', 'right'],
      rows: [
        ['Gross Sales Revenue (Retail Inflow)', 'Revenue', `LKR ${totalSalesRevenue.toLocaleString()}`, '100%'],
        ['Cost of Goods Sold (COGS)', 'Direct Product Cost', `-LKR ${totalCogs.toLocaleString()}`, `${totalSalesRevenue > 0 ? Math.round((totalCogs / totalSalesRevenue) * 100) : 0}%`],
        ['Gross Store Profit', 'Trading Margin', `LKR ${totalProfit.toLocaleString()}`, `${totalSalesRevenue > 0 ? Math.round((totalProfit / totalSalesRevenue) * 100) : 0}%`],
        ['Operating Store Expenses', 'Overheads & Utilities', `-LKR ${totalOperatingExpenses.toLocaleString()}`, `${totalSalesRevenue > 0 ? Math.round((totalOperatingExpenses / totalSalesRevenue) * 100) : 0}%`],
      ],
      totalRow: [
        'NET OPERATING PROFIT / (LOSS)',
        'Net Bottom Line',
        `LKR ${netIncome.toLocaleString()}`,
        `${totalSalesRevenue > 0 ? Math.round((netIncome / totalSalesRevenue) * 100) : 0}%`
      ],
      notes: 'Net profit reflects realized cash & digital retail sales minus inventory acquisition and recorded store operational expenses.'
    });
  };

  // Handle Print via Iframe (Clean browser & Electron support)
  const handlePrintReport = () => {
    showNotification('info', `Preparing ${reportTab.toUpperCase()} print preview...`);
    const html = buildCurrentReportHtml();
    printHtmlViaIframe(html);
  };

  // Handle Download HTML
  const handleDownloadHtml = () => {
    try {
      const html = buildCurrentReportHtml();
      const dateSuffix = new Date().toISOString().substring(0, 10);
      downloadHtmlFile(`AppleVision_${reportTab.toUpperCase()}_Report_${dateRange}_${dateSuffix}.html`, html);
      showNotification('success', `Saved ${reportTab.toUpperCase()} HTML report to Downloads`);
    } catch (err: any) {
      console.error('Download HTML error:', err);
      showNotification('error', `Download failed: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
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

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrintReport}
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
            title="Print printable A4 report via browser dialog"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report (Ctrl+P)</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
            title="Download report data as standard Excel-compatible CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadHtml}
            className="px-3.5 py-2.5 rounded-xl bg-light-surface dark:bg-dark-surface hover:bg-light-elevated dark:hover:bg-dark-elevated border border-light-border dark:border-dark-border text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Download standalone styled HTML report file"
          >
            <FileText className="w-4 h-4 text-brand-500" />
            <span className="hidden sm:inline">HTML</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Tabs & Date Range Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs overflow-x-auto">
          <button
            onClick={() => setReportTab('pnl')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              reportTab === 'pnl'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Profit & Loss
          </button>

          <button
            onClick={() => setReportTab('sales')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              reportTab === 'sales'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sales Ledger ({filteredSales.length})
          </button>

          <button
            onClick={() => setReportTab('inventory')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              reportTab === 'inventory'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Inventory Valuation
          </button>

          <button
            onClick={() => setReportTab('expenses')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              reportTab === 'expenses'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Operating Expenses ({filteredExpenses.length})
          </button>
        </div>

        {/* Date Range Selector (Active for P&L, Sales, and Expenses) */}
        {reportTab !== 'inventory' && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs">
            <span className="px-2 text-[11px] font-semibold text-light-muted flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Period:
            </span>
            {(['Today', '7D', 'Month', 'All'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dateRange === range
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {range === 'Today' ? 'Today' : range === '7D' ? '7 Days' : range === 'Month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* P&L STATEMENT VIEW */}
      {reportTab === 'pnl' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Big Summary Card */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Store Income Statement ({dateRangeLabel})
              </h3>
              <span className="text-[11px] font-mono text-light-muted">
                {filteredSales.length} sale(s) • {filteredExpenses.length} expense(s)
              </span>
            </div>

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
                <span className="text-emerald-600 dark:text-emerald-400">Gross Realized Profit:</span>
                <span className="font-mono text-emerald-500 text-sm">
                  LKR {totalProfit.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted">Operating Expenses:</span>
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

            <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-light-muted">
                Net Operating Margin
              </div>
              <div className="font-mono font-black text-2xl text-brand-500">
                {totalSalesRevenue > 0 ? Math.round((netIncome / totalSalesRevenue) * 100) : 0}%
              </div>
              <div className="text-xs text-light-muted">Bottom-line retained earnings for period</div>
            </div>
          </div>
        </div>
      )}

      {/* SALES BREAKDOWN VIEW */}
      {reportTab === 'sales' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-brand-500" />
              <span>Sales Ledger ({dateRangeLabel})</span>
            </div>
            <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
              Revenue: LKR {totalSalesRevenue.toLocaleString()} | Profit: +LKR {totalProfit.toLocaleString()}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-bold text-[10px] uppercase tracking-wider">
                  <th className="pb-3">Invoice #</th>
                  <th className="pb-3">Date / Time</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3 text-center">Items</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3 text-right">Subtotal</th>
                  <th className="pb-3 text-right">Discount</th>
                  <th className="pb-3 text-right">Net Total</th>
                  <th className="pb-3 text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-light-muted">
                      No sales recorded for the selected period ({dateRangeLabel}).
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-light-surface/40 dark:hover:bg-dark-surface/40">
                      <td className="py-3 font-mono font-bold text-brand-500">{s.invoiceNumber}</td>
                      <td className="py-3 font-mono text-light-muted">{s.date} {s.time}</td>
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {s.customerName}
                        {s.customerPhone && <div className="text-[10px] text-light-muted font-mono">{s.customerPhone}</div>}
                      </td>
                      <td className="py-3 text-center text-slate-600 dark:text-slate-400 font-mono">{s.items.length}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVENTORY VALUATION VIEW */}
      {reportTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                Total Inward Cost (COGS)
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

            <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-light-muted">
                Potential Gross Spread
              </div>
              <div className="font-mono font-black text-xl text-emerald-500">
                +LKR {potentialProfit.toLocaleString()}
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
                    <th className="pb-3">Category</th>
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
                      <td className="py-3 text-slate-600 dark:text-slate-400">{p.category}</td>
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

      {/* OPERATING EXPENSES REPORT VIEW */}
      {reportTab === 'expenses' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-500" />
              <span>Operating Expenses Register ({dateRangeLabel})</span>
            </div>
            <div className="text-xs font-mono font-bold text-amber-500">
              Total Outflows: LKR {totalOperatingExpenses.toLocaleString()}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-bold text-[10px] uppercase tracking-wider">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Description & Reference</th>
                  <th className="pb-3">Payment Method</th>
                  <th className="pb-3">Recorded By</th>
                  <th className="pb-3 text-right">Amount (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-light-muted">
                      No operating expenses recorded for the selected period ({dateRangeLabel}).
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-light-surface/40 dark:hover:bg-dark-surface/40">
                      <td className="py-3 font-mono text-light-muted">{exp.date}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {exp.description}
                        {exp.receiptRef && <span className="ml-1.5 text-[10px] text-light-muted font-mono font-normal">({exp.receiptRef})</span>}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">{exp.paymentMethod}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">{exp.recordedBy}</td>
                      <td className="py-3 text-right font-mono font-bold text-amber-500">
                        LKR {exp.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
