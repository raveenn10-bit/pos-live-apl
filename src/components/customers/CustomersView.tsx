'use client';

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Customer } from '../../types';
import { 
  Users, 
  Search, 
  UserPlus, 
  CreditCard, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Edit3, 
  X,
  Receipt
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, addCustomer, updateCustomer, settleCustomerCredit, sales } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState('Cash');
  const [settleNotes, setSettleNotes] = useState('');

  // Add/Edit Form
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('+94 ');
  const [formEmail, setFormEmail] = useState('');
  const [formNic, setFormNic] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('Galle');
  const [formCreditLimit, setFormCreditLimit] = useState(50000);
  const [formNotes, setFormNotes] = useState('');

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.toLowerCase().includes(search.toLowerCase()) ||
    (c.nic && c.nic.toLowerCase().includes(search.toLowerCase())) ||
    (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCustomer = selectedCustomer || filteredCustomers[0] || null;

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('+94 ');
    setFormEmail('');
    setFormNic('');
    setFormAddress('');
    setFormCity('Galle');
    setFormCreditLimit(50000);
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormEmail(c.email || '');
    setFormNic(c.nic || '');
    setFormAddress(c.address || '');
    setFormCity(c.city || 'Galle');
    setFormCreditLimit(c.creditLimit);
    setFormNotes(c.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        nic: formNic.trim() || undefined,
        address: formAddress.trim() || undefined,
        city: formCity.trim() || 'Galle',
        creditLimit: Number(formCreditLimit),
        notes: formNotes.trim() || undefined,
      });
      setIsAddModalOpen(false);
    } else {
      const created = addCustomer({
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        nic: formNic.trim() || undefined,
        address: formAddress.trim() || undefined,
        city: formCity.trim() || 'Galle',
        creditLimit: Number(formCreditLimit),
        notes: formNotes.trim() || undefined,
      });
      setSelectedCustomer(created);
      setIsAddModalOpen(false);
    }
  };

  const handleOpenSettleModal = (c: Customer) => {
    setSelectedCustomer(c);
    setSettleAmount(c.creditBalance);
    setSettleMethod('Cash');
    setSettleNotes('');
    setIsSettleModalOpen(true);
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || settleAmount <= 0) return;

    settleCustomerCredit(activeCustomer.id, settleAmount, settleMethod, settleNotes);
    setIsSettleModalOpen(false);
  };

  // Customer sales history
  const customerSales = activeCustomer
    ? sales.filter(s => s.customerId === activeCustomer.id || s.customerPhone === activeCustomer.phone)
    : [];

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-brand-500/10 text-brand-500">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Customers & Credit Ledger
            </h2>
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
            VIP client directory, purchasing history, credit limits, and outstanding debt settlement.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 flex items-center gap-2 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Register Customer</span>
        </button>
      </div>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Directory (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-4 flex flex-col">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, phone (+94...), NIC, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Customer List */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[600px] pr-1">
            {filteredCustomers.map((c) => {
              const isSelected = activeCustomer?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-light-elevated dark:bg-dark-elevated border-brand-500/50 shadow-sm'
                      : 'bg-light-surface/50 dark:bg-dark-surface/50 hover:bg-light-surface dark:hover:bg-dark-surface border-light-border dark:border-dark-border'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{c.name}</span>
                      {c.creditBalance > 0 && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          Due: LKR {c.creditBalance.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-light-muted dark:text-dark-muted font-mono">
                      <span>{c.phone}</span>
                      {c.city && <span>• {c.city}</span>}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                      LKR {c.totalSpent.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-light-muted">
                      {c.ordersCount} invoice(s)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Customer Dossier & Ledger (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {activeCustomer ? (
            <>
              {/* Profile Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-rose-400 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                      {activeCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {activeCustomer.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-light-muted dark:text-dark-muted font-mono mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {activeCustomer.phone}
                        </span>
                        {activeCustomer.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {activeCustomer.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(activeCustomer)}
                      className="px-3 py-1.5 rounded-xl bg-light-surface dark:bg-dark-surface hover:bg-light-elevated dark:hover:bg-dark-elevated border border-light-border dark:border-dark-border text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>

                    {activeCustomer.creditBalance > 0 && (
                      <button
                        onClick={() => handleOpenSettleModal(activeCustomer)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/25 flex items-center gap-1.5 transition-all"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Settle Debt</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Ledger Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-light-muted">
                      Lifetime Spend
                    </div>
                    <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      LKR {activeCustomer.totalSpent.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-light-muted">
                      {activeCustomer.ordersCount} completed orders
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-2xl border space-y-1 ${
                    activeCustomer.creditBalance > 0
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                      : 'bg-light-surface/60 dark:bg-dark-surface/60 border-light-border dark:border-dark-border'
                  }`}>
                    <div className="text-[10px] font-bold uppercase tracking-wider">
                      Outstanding Credit
                    </div>
                    <div className="font-mono font-bold text-sm">
                      LKR {activeCustomer.creditBalance.toLocaleString()}
                    </div>
                    <div className="text-[10px] opacity-80">
                      {activeCustomer.creditBalance > 0 ? 'Pending settlement' : 'Account in good standing'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-light-muted">
                      Credit Limit
                    </div>
                    <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      LKR {activeCustomer.creditLimit.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-500 font-semibold">
                      Avail: LKR {(activeCustomer.creditLimit - activeCustomer.creditBalance).toLocaleString()}
                    </div>
                  </div>
                </div>

                {activeCustomer.notes && (
                  <div className="p-3 rounded-xl bg-light-surface/40 dark:bg-dark-surface/40 border border-light-border dark:border-dark-border text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">Notes: </span>
                    {activeCustomer.notes}
                  </div>
                )}
              </div>

              {/* Purchase History */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-brand-500" />
                    Purchase History ({customerSales.length})
                  </h4>
                </div>

                {customerSales.length === 0 ? (
                  <div className="p-8 text-center text-xs text-light-muted dark:text-dark-muted">
                    No recorded invoices yet for this profile.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="p-3 rounded-xl bg-light-surface/50 dark:bg-dark-surface/50 border border-light-border dark:border-dark-border flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-mono font-bold text-brand-500">
                            {sale.invoiceNumber}
                          </div>
                          <div className="text-[10px] text-light-muted">
                            {sale.date} • {sale.items.length} item(s) • Method: {sale.paymentMethod}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          LKR {sale.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400">
              Select or register a customer to view their profile and credit ledger.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingCustomer ? 'Edit Customer' : 'Register New VIP Customer'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">National ID (NIC)</label>
                  <input
                    type="text"
                    value={formNic}
                    onChange={(e) => setFormNic(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Credit Limit (LKR)</label>
                  <input
                    type="number"
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes / Preferences</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Debt Settlement Modal */}
      {isSettleModalOpen && activeCustomer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Credit Settlement</h3>
                <p className="text-xs text-brand-500 font-semibold">{activeCustomer.name}</p>
              </div>
              <button onClick={() => setIsSettleModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-4">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex justify-between items-center text-xs">
                <span className="font-semibold text-rose-500">Current Balance Due:</span>
                <span className="font-mono font-bold text-rose-500 text-sm">
                  LKR {activeCustomer.creditBalance.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Settlement Payment Amount (LKR) *
                </label>
                <input
                  type="number"
                  max={activeCustomer.creditBalance}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                >
                  <option value="Cash">Cash (Added to register drawer)</option>
                  <option value="Bank Transfer">Bank Transfer / Online Deposit</option>
                  <option value="Card">Card Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference / Receipt Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full via cash counter"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsSettleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/25"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
