'use client';

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Expense, ExpenseCategory } from '../../types';
import { 
  Wallet, 
  Plus, 
  DollarSign, 
  Calendar, 
  Receipt, 
  TrendingDown, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Unlock,
  Coins
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, cashDrawer, closeCashDrawer, reopenCashDrawer, showNotification } = useStore();
  const { currentUser } = useAuth();

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCloseDrawerOpen, setIsCloseDrawerOpen] = useState(false);
  const [isReopenDrawerOpen, setIsReopenDrawerOpen] = useState(false);

  // New Expense form
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Tea & Refreshments');
  const [expenseAmount, setExpenseAmount] = useState<number>(1500);
  const [expenseMethod, setExpenseMethod] = useState<'Cash' | 'Bank Transfer' | 'Card'>('Cash');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseReceiptRef, setExpenseReceiptRef] = useState('');

  // Close Drawer form
  const [actualDrawerCount, setActualDrawerCount] = useState<number>(cashDrawer.expectedCash);
  const [closeNotes, setCloseNotes] = useState('');

  // Reopen Drawer form
  const [newOpeningFloat, setNewOpeningFloat] = useState<number>(50000);

  const categories: ExpenseCategory[] = [
    'Tea & Refreshments',
    'Courier & Transport',
    'Utilities & Internet',
    'Marketing & Ads',
    'Shop Maintenance',
    'Staff Salaries',
    'Rent',
    'Tools & Supplies',
    'Other',
  ];

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0 || !expenseDesc.trim()) return;

    addExpense({
      date: new Date().toISOString().substring(0, 10),
      category: expenseCategory,
      amount: Number(expenseAmount),
      paymentMethod: expenseMethod,
      description: expenseDesc.trim(),
      recordedBy: currentUser?.name || 'Surinda Nethmina',
      receiptRef: expenseReceiptRef.trim() || undefined,
    });

    setIsAddExpenseOpen(false);
    setExpenseDesc('');
    setExpenseReceiptRef('');
  };

  const handleConfirmCloseDrawer = (e: React.FormEvent) => {
    e.preventDefault();
    closeCashDrawer(actualDrawerCount, closeNotes.trim());
    setIsCloseDrawerOpen(false);
  };

  const handleConfirmReopen = (e: React.FormEvent) => {
    e.preventDefault();
    reopenCashDrawer(newOpeningFloat);
    setIsReopenDrawerOpen(false);
  };

  const discrepancy = actualDrawerCount - cashDrawer.expectedCash;

  return (
    <div className="space-y-6 select-none">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-brand-500/10 text-brand-500">
              <Wallet className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Expenses & Cash Drawer Reconciliation
            </h2>
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
            Store utility bills, courier costs, petty cash vouchers, and daily register closing audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cashDrawer.status === 'Open' ? (
            <button
              onClick={() => {
                setActualDrawerCount(cashDrawer.expectedCash);
                setIsCloseDrawerOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Close Day Register</span>
            </button>
          ) : (
            <button
              onClick={() => setIsReopenDrawerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
            >
              <Unlock className="w-4 h-4" />
              <span>Open New Register</span>
            </button>
          )}

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Expense</span>
          </button>
        </div>
      </div>

      {/* Cash Drawer Status Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Coins className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-brand-400">
                Register Drawer Session ({cashDrawer.date})
              </div>
              <div className="text-lg font-black">
                Current Expected Cash: <span className="font-mono text-brand-400">LKR {cashDrawer.expectedCash.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
            cashDrawer.status === 'Open'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
          }`}>
            ● Drawer {cashDrawer.status}
          </span>
        </div>

        {/* Drawer Math Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Opening Float</div>
            <div className="font-mono font-bold text-sm mt-0.5">LKR {cashDrawer.openingCash.toLocaleString()}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Cash Sales Collected</div>
            <div className="font-mono font-bold text-sm text-emerald-400 mt-0.5">+LKR {cashDrawer.cashSales.toLocaleString()}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Cash Expenses Paid</div>
            <div className="font-mono font-bold text-sm text-amber-400 mt-0.5">-LKR {cashDrawer.cashExpenses.toLocaleString()}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Calculated Drawer Cash</div>
            <div className="font-mono font-bold text-sm text-white mt-0.5">LKR {cashDrawer.expectedCash.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Expenses History Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-brand-500" />
            Store Expenses Ledger
          </h3>
          <div className="text-xs font-mono font-bold text-brand-500">
            Total Logged: LKR {totalExpenses.toLocaleString()}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-bold text-[10px] uppercase tracking-wider">
                <th className="pb-3">Date</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Description & Voucher</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Recorded By</th>
                <th className="pb-3 text-right">Amount (LKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-light-surface/40 dark:hover:bg-dark-surface/40">
                  <td className="py-3 font-mono text-light-muted">{exp.date}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                    {exp.description}
                    {exp.receiptRef && <div className="text-[10px] text-light-muted font-mono">Ref: {exp.receiptRef}</div>}
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">{exp.paymentMethod}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">{exp.recordedBy}</td>
                  <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    LKR {exp.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Store Expense</h3>
              <button onClick={() => setIsAddExpenseOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Amount (LKR) *</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                <select
                  value={expenseMethod}
                  onChange={(e) => setExpenseMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                >
                  <option value="Cash">Cash (Deducted from Day Register)</option>
                  <option value="Bank Transfer">Bank Transfer / Online</option>
                  <option value="Card">Store Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Courier charges for Colombo consignment parcel..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Receipt / Voucher Ref (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. VOUCHER-9214"
                  value={expenseReceiptRef}
                  onChange={(e) => setExpenseReceiptRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-light-border dark:border-dark-border">
                <button type="button" onClick={() => setIsAddExpenseOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25">
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Day Register Modal */}
      {isCloseDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">End-of-Day Register Close</h3>
                <p className="text-xs text-light-muted">Count physical cash in drawer to verify discrepancy</p>
              </div>
              <button onClick={() => setIsCloseDrawerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCloseDrawer} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-light-muted">Expected System Cash:</span>
                  <span className="font-mono font-bold">LKR {cashDrawer.expectedCash.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Actual Physical Cash Count (LKR) *
                </label>
                <input
                  type="number"
                  value={actualDrawerCount}
                  onChange={(e) => setActualDrawerCount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-base font-mono font-bold rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Discrepancy indicator */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                discrepancy === 0
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
              }`}>
                <span>Discrepancy:</span>
                <span className="font-mono">
                  {discrepancy === 0 ? '✓ Balanced (0 LKR)' : `${discrepancy > 0 ? '+' : ''}${discrepancy.toLocaleString()} LKR`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Closing Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. End of shift balance verified"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-light-border dark:border-dark-border">
                <button type="button" onClick={() => setIsCloseDrawerOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-md">
                  Confirm Register Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Register Modal */}
      {isReopenDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Open New Cash Register</h3>
              <button onClick={() => setIsReopenDrawerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReopen} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Opening Cash Float (LKR) *
                </label>
                <input
                  type="number"
                  value={newOpeningFloat}
                  onChange={(e) => setNewOpeningFloat(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-light-border dark:border-dark-border">
                <button type="button" onClick={() => setIsReopenDrawerOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md">
                  Open Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
