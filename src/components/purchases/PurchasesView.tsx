'use client';

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Supplier, PurchaseOrder } from '../../types';
import { 
  Truck, 
  Plus, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Search, 
  Barcode, 
  FileText, 
  X,
  CheckCircle2
} from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const { suppliers, purchases, addSupplier, addPurchaseOrder, showNotification } = useStore();

  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');
  const [search, setSearch] = useState('');

  // New purchase order modal
  const [isNewPoOpen, setIsNewPoOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState(suppliers[0]?.id || '');
  const [poInvoiceNumber, setPoInvoiceNumber] = useState('');
  const [poTotalAmount, setPoTotalAmount] = useState<number>(500000);
  const [poPaymentStatus, setPoPaymentStatus] = useState<'Paid' | 'Partial' | 'Pending'>('Pending');
  const [poImeisInput, setPoImeisInput] = useState('');
  const [poNotes, setPoNotes] = useState('');

  // New supplier modal
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supCountry, setSupCountry] = useState('UAE');

  const filteredPurchases = purchases.filter(p =>
    (p.invoiceNumber || p.poNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contactPerson || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreatePo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poInvoiceNumber.trim()) return;

    const supplier = suppliers.find(s => s.id === poSupplierId);
    const imeis = poImeisInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);

    addPurchaseOrder({
      poNumber: poInvoiceNumber.trim(),
      invoiceNumber: poInvoiceNumber.trim(),
      supplierId: poSupplierId,
      supplierName: supplier?.name || 'Authorized Supplier',
      date: new Date().toISOString().substring(0, 10),
      status: 'Completed',
      itemsCount: imeis.length || 1,
      totalAmount: Number(poTotalAmount),
      paymentStatus: poPaymentStatus,
      imeis,
      notes: poNotes.trim() || undefined
    });

    setIsNewPoOpen(false);
    setPoInvoiceNumber('');
    setPoImeisInput('');
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    addSupplier({
      name: supName.trim(),
      contactPerson: supContact.trim(),
      phone: supPhone.trim(),
      email: supEmail.trim(),
      address: supAddress.trim(),
      country: supCountry.trim(),
    });

    setIsNewSupplierOpen(false);
    setSupName('');
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-brand-500/10 text-brand-500">
              <Truck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Supplier Purchases & Inward Intake
            </h2>
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
            Consignment logs from Dubai, Singapore, and local distributors with bulk IMEI capture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'purchases' ? (
            <button
              onClick={() => setIsNewPoOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Inward Purchase</span>
            </button>
          ) : (
            <button
              onClick={() => setIsNewSupplierOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation tabs & search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex p-1 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-xs">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-colors ${
              activeTab === 'purchases'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Purchase Orders ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-colors ${
              activeTab === 'suppliers'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Authorized Suppliers ({suppliers.length})
          </button>
        </div>

        <div className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* PURCHASES LIST */}
      {activeTab === 'purchases' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-bold text-[10px] uppercase tracking-wider">
                  <th className="pb-3">Invoice / Consignment #</th>
                  <th className="pb-3">Supplier</th>
                  <th className="pb-3">Intake Date</th>
                  <th className="pb-3 text-center">Items Received</th>
                  <th className="pb-3 text-right">Consignment Total</th>
                  <th className="pb-3 text-center">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {filteredPurchases.map((po) => (
                  <tr key={po.id} className="hover:bg-light-surface/40 dark:hover:bg-dark-surface/40">
                    <td className="py-3 font-mono font-bold text-brand-500">
                      {po.invoiceNumber}
                      {po.notes && <div className="text-[10px] text-light-muted font-sans font-normal">{po.notes}</div>}
                    </td>
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{po.supplierName}</td>
                    <td className="py-3 font-mono text-light-muted">{po.date}</td>
                    <td className="py-3 text-center font-mono font-bold">{po.itemsCount} units</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      LKR {po.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        po.paymentStatus === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : po.paymentStatus === 'Partial'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {po.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUPPLIERS LIST */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredSuppliers.map((sup) => (
            <div
              key={sup.id}
              className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-light-elevated dark:bg-dark-elevated text-light-muted">
                  {sup.country}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{sup.name}</h3>
                <div className="text-xs text-light-muted">{sup.contactPerson}</div>
              </div>

              <div className="space-y-1 text-xs text-light-muted pt-2 border-t border-light-border dark:border-dark-border">
                <div className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{sup.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{sup.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{sup.address}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-light-border dark:border-dark-border flex justify-between items-center text-xs">
                <span className="text-light-muted">Total Supplied:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  LKR {(sup.totalSupplied / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Purchase Modal */}
      {isNewPoOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Inward Purchase</h3>
              <button onClick={() => setIsNewPoOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.country})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Invoice / Airway Bill # *</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-DXB-9912"
                    value={poInvoiceNumber}
                    onChange={(e) => setPoInvoiceNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Consignment Cost (LKR)</label>
                  <input
                    type="number"
                    value={poTotalAmount}
                    onChange={(e) => setPoTotalAmount(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Status</label>
                <select
                  value={poPaymentStatus}
                  onChange={(e) => setPoPaymentStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                >
                  <option value="Paid">Fully Paid</option>
                  <option value="Partial">Partial Deposit</option>
                  <option value="Pending">Pending / Consignment Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bulk Device IMEIs (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="358920119284751&#10;358920119284752"
                  value={poImeisInput}
                  onChange={(e) => setPoImeisInput(e.target.value)}
                  className="w-full p-2.5 text-xs font-mono rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-light-border dark:border-dark-border">
                <button type="button" onClick={() => setIsNewPoOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25">
                  Record Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Supplier Modal */}
      {isNewSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Authorized Supplier</h3>
              <button onClick={() => setIsNewSupplierOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dubai Electronics FZE"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    value={supCountry}
                    onChange={(e) => setSupCountry(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-light-border dark:border-dark-border">
                <button type="button" onClick={() => setIsNewSupplierOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25">
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
