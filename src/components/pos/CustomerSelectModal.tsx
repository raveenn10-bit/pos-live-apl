'use client';

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Customer } from '../../types';
import { Search, UserPlus, UserCheck, X, Phone, MapPin, User, Check, RefreshCw } from 'lucide-react';

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer | null) => void;
  selectedCustomer?: Customer | null;
}

export const CustomerSelectModal: React.FC<CustomerSelectModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect,
  selectedCustomer 
}) => {
  const { customers, addCustomer, showNotification } = useStore();
  const [activeTab, setActiveTab] = useState<'search' | 'walkin' | 'create'>('search');
  const [search, setSearch] = useState('');

  // Walk-in form state
  const [walkInName, setWalkInName] = useState(selectedCustomer?.name !== 'Walk-in Customer' ? (selectedCustomer?.name || '') : '');
  const [walkInPhone, setWalkInPhone] = useState(selectedCustomer?.phone || '');
  const [saveWalkInToDirectory, setSaveWalkInToDirectory] = useState(false);

  // New registered customer form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('+94 ');
  const [newEmail, setNewEmail] = useState('');
  const [newNic, setNewNic] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('Galle');
  const [newCreditLimit, setNewCreditLimit] = useState(50000);

  if (!isOpen) return null;

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.toLowerCase().includes(search.toLowerCase()) ||
    (c.nic && c.nic.toLowerCase().includes(search.toLowerCase()))
  );

  const handleApplyWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = walkInName.trim() || 'Walk-in Customer';
    const finalPhone = walkInPhone.trim();

    if (saveWalkInToDirectory && finalPhone) {
      const created = addCustomer({
        name: finalName,
        phone: finalPhone,
        city: 'Galle',
        creditLimit: 50000,
      });
      onSelect(created);
      showNotification('success', `Saved customer "${finalName}" and applied to sale`);
    } else {
      const walkInObj: Customer = {
        id: `walkin-${Date.now()}`,
        name: finalName,
        phone: finalPhone,
        creditLimit: 0,
        creditBalance: 0,
        totalSpent: 0,
        ordersCount: 0,
        city: 'Galle',
      };
      onSelect(walkInObj);
      showNotification('success', `Walk-in details applied: ${finalName}${finalPhone ? ` (${finalPhone})` : ''}`);
    }
    onClose();
  };

  const handleSelectDefaultWalkIn = () => {
    onSelect(null);
    showNotification('info', 'Reset to Standard Walk-in Customer');
    onClose();
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const created = addCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      nic: newNic.trim() || undefined,
      address: newAddress.trim() || undefined,
      city: newCity.trim() || 'Galle',
      creditLimit: Number(newCreditLimit) || 50000,
    });

    onSelect(created);
    showNotification('success', `Registered & selected customer: ${created.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-light-surface/60 dark:bg-dark-surface/60 border-b border-light-border dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Customer Assignment
              </h2>
              <p className="text-[11px] text-light-muted dark:text-dark-muted">
                Link sale for warranty tracking, A4 tax invoices, and WhatsApp receipt delivery
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-light-border dark:border-dark-border bg-light-surface/30 dark:bg-dark-surface/30 px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Directory</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('walkin')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'walkin'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Walk-in Customer Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Full Register</span>
          </button>
        </div>

        {/* Tab 1: Search Existing Directory */}
        {activeTab === 'search' && (
          <div className="p-6 space-y-4 overflow-y-auto">
            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-dark-surface border border-light-border dark:border-dark-border">
              <div className="text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Standard Retail:</span>{' '}
                <strong className="text-slate-900 dark:text-white">Walk-in Customer</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectDefaultWalkIn}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-brand-500 hover:text-brand-500 transition-colors"
                >
                  Standard Walk-in
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('walkin')}
                  className="px-2.5 py-1 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
                >
                  + Add Walk-in Name/Phone
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search customer by name, phone (+94...), or NIC..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* List */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {filtered.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => {
                    onSelect(customer);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl bg-light-surface/70 dark:bg-dark-surface/70 hover:bg-light-elevated dark:hover:bg-dark-elevated border border-light-border dark:border-dark-border cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors flex items-center gap-2">
                      <span>{customer.name}</span>
                      {customer.creditBalance > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          Due: LKR {customer.creditBalance.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-light-muted dark:text-dark-muted font-mono">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </span>
                      {customer.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {customer.city}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      LKR {customer.totalSpent.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-light-muted">
                      {customer.ordersCount} previous order(s)
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="p-8 text-center text-xs text-light-muted dark:text-dark-muted space-y-2">
                  <p>No registered customers found matching "{search}".</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('walkin')}
                    className="text-brand-500 font-bold hover:underline"
                  >
                    Quick Add as Walk-in Customer →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Walk-in Customer Quick Details */}
        {activeTab === 'walkin' && (
          <form onSubmit={handleApplyWalkIn} className="p-6 space-y-4 overflow-y-auto">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300">
              💡 <strong>Walk-in Quick Billing:</strong> Add customer name and phone without requiring an account. Phone number will be pre-filled for WhatsApp receipts and warranty lookups!
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kasun Perera (or leave blank for Walk-in Customer)"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Phone / WhatsApp Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 077 923 0519 or +94 77 ..."
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white font-mono"
                />
                <p className="text-[10px] text-light-muted dark:text-dark-muted mt-1">
                  Used directly for instant 1-click WhatsApp invoice delivery and SMS warranty receipts.
                </p>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={saveWalkInToDirectory}
                    onChange={(e) => setSaveWalkInToDirectory(e.target.checked)}
                    className="rounded text-brand-500 focus:ring-brand-500"
                  />
                  <span>Also save to store customer directory for future repeat sales</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-light-border dark:border-dark-border">
              <button
                type="button"
                onClick={handleSelectDefaultWalkIn}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Clear to Default Walk-in
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Apply Walk-in Details to Bill</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Full Register New Customer */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateCustomer} className="p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kasun Fernando"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  placeholder="+94 77 ..."
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="customer@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  National ID (NIC)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 199012345678"
                  value={newNic}
                  onChange={(e) => setNewNic(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Matara Road"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  placeholder="Galle"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-light-border dark:border-dark-border">
              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Back to Search
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all"
              >
                Register & Select Customer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
