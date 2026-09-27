'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { PaymentMethod, PaymentDetails } from '../../types';
import { 
  CreditCard, 
  Banknote, 
  Building2, 
  UserCheck, 
  Split, 
  CalendarClock, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Receipt,
  DollarSign
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { 
    cartTotal, 
    cartSubtotal, 
    cartDiscountTotal, 
    cartTradeInCredit, 
    currentTradeIn, 
    selectedCustomer, 
    completeSale, 
    showNotification 
  } = useStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');

  // Cash fields
  const [cashTendered, setCashTendered] = useState<number>(cartTotal);
  
  // Card fields
  const [cardRef, setCardRef] = useState('');
  
  // Bank fields
  const [bankName, setBankName] = useState('Commercial Bank');
  const [bankRef, setBankRef] = useState('');

  // Installment fields
  const [installmentProvider, setInstallmentProvider] = useState<'Koko' | 'Mintpay' | 'Commercial Bank' | 'Sampath Bank' | 'HNB'>('Koko');
  const [installmentMonths, setInstallmentMonths] = useState(3);

  // Split fields
  const [splitCash, setSplitCash] = useState<number>(Math.round(cartTotal / 2));
  const [splitCard, setSplitCard] = useState<number>(cartTotal - Math.round(cartTotal / 2));
  const [splitCredit, setSplitCredit] = useState<number>(0);

  // Notes
  const [saleNotes, setSaleNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCashTendered(cartTotal);
      setSplitCash(Math.round(cartTotal / 2));
      setSplitCard(cartTotal - Math.round(cartTotal / 2));
      setSplitCredit(0);
      setCardRef('');
      setBankRef('');
      setSaleNotes('');
    }
  }, [isOpen, cartTotal]);

  if (!isOpen) return null;

  const changeDue = Math.max(0, cashTendered - cartTotal);
  const isCashSufficient = cashTendered >= cartTotal;

  // Split sum validation
  const splitSum = splitCash + splitCard + splitCredit;
  const splitRemaining = cartTotal - splitSum;
  const isSplitValid = splitRemaining === 0;

  // Credit validation
  const isCreditAllowed = !!selectedCustomer;
  const customerCreditLimitAvailable = selectedCustomer 
    ? selectedCustomer.creditLimit - selectedCustomer.creditBalance 
    : 0;
  const isCreditWithinLimit = selectedCustomer 
    ? (paymentMethod === 'Customer Credit' ? cartTotal <= customerCreditLimitAvailable : true)
    : false;

  const handleQuickCash = (amount: number) => {
    setCashTendered(amount);
  };

  const handleAddCash = (increment: number) => {
    setCashTendered(prev => prev + increment);
  };

  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'Cash' && !isCashSufficient) {
      showNotification('error', `Tendered cash is insufficient by LKR ${(cartTotal - cashTendered).toLocaleString()}`);
      return;
    }

    if (paymentMethod === 'Customer Credit' && !selectedCustomer) {
      showNotification('error', 'Please select a customer profile for Credit purchases');
      return;
    }

    if (paymentMethod === 'Split' && !isSplitValid) {
      showNotification('error', `Split payment total does not match bill total (Remaining: LKR ${splitRemaining.toLocaleString()})`);
      return;
    }

    const details: PaymentDetails = {
      cashTendered: paymentMethod === 'Cash' ? cashTendered : undefined,
      changeDue: paymentMethod === 'Cash' ? changeDue : undefined,
      cardRef: paymentMethod === 'Card' ? cardRef || 'TERMINAL-OK' : undefined,
      bankName: paymentMethod === 'Bank Transfer' ? bankName : undefined,
      bankRef: paymentMethod === 'Bank Transfer' ? bankRef || 'TRANSFER-OK' : undefined,
      installmentProvider: paymentMethod === 'Installment' ? installmentProvider : undefined,
      installmentMonths: paymentMethod === 'Installment' ? installmentMonths : undefined,
      splitCash: paymentMethod === 'Split' ? splitCash : undefined,
      splitCard: paymentMethod === 'Split' ? splitCard : undefined,
      splitCredit: paymentMethod === 'Split' ? splitCredit : undefined,
      notes: saleNotes.trim() || undefined,
    };

    const completed = completeSale(paymentMethod, details);
    if (completed) {
      onSuccess();
    }
  };

  const paymentMethodsList = [
    { id: 'Cash', label: 'Cash', icon: Banknote, desc: 'Drawer tender & change' },
    { id: 'Card', label: 'Card Terminal', icon: CreditCard, desc: 'Visa / Mastercard / Amex' },
    { id: 'Bank Transfer', label: 'Bank Transfer', icon: Building2, desc: 'Direct online deposit' },
    { id: 'Customer Credit', label: 'Customer Credit', icon: UserCheck, desc: 'Add to customer ledger' },
    { id: 'Installment', label: 'Installment / BNPL', icon: CalendarClock, desc: 'Koko / Mintpay / Bank 0%' },
    { id: 'Split', label: 'Split Payment', icon: Split, desc: 'Cash + Card combination' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Total Due */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-brand-400 uppercase tracking-wider">
                AppleVision Checkout Terminal
              </div>
              <div className="text-xl font-black">
                Total Due: <span className="font-mono text-brand-400">LKR {cartTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <form onSubmit={handleConfirmCheckout} className="p-6 overflow-y-auto space-y-6">
          {/* Payment Method Selector Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {paymentMethodsList.map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                        : 'bg-light-surface/60 dark:bg-dark-surface/60 border-light-border dark:border-dark-border text-slate-700 dark:text-slate-300 hover:bg-light-elevated dark:hover:bg-dark-elevated'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-white' : 'text-brand-500'}`} />
                    <div className="font-bold text-xs">{m.label}</div>
                    <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-white/80' : 'text-light-muted dark:text-dark-muted'}`}>
                      {m.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Method Config Fields */}
          <div className="p-4 rounded-2xl bg-light-surface/50 dark:bg-dark-surface/50 border border-light-border dark:border-dark-border space-y-4">
            {/* CASH PAYMENT MODE */}
            {paymentMethod === 'Cash' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cash Tendered (LKR)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={cashTendered || ''}
                        onChange={(e) => setCashTendered(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-2.5 text-base font-mono font-bold rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                        autoFocus
                      />
                      <DollarSign className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {/* Change Due Display */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-right min-w-[180px]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Change to Return
                    </div>
                    <div className="text-xl font-mono font-black text-emerald-500">
                      LKR {changeDue.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Quick cash denomination buttons */}
                <div>
                  <div className="text-[11px] font-semibold text-light-muted dark:text-dark-muted mb-1.5">
                    Quick Cash Buttons:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickCash(cartTotal)}
                      className="px-3 py-1.5 rounded-lg bg-light-elevated dark:bg-dark-elevated text-xs font-bold font-mono hover:text-brand-500 transition-colors"
                    >
                      Exact (LKR {cartTotal.toLocaleString()})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCash(500)}
                      className="px-3 py-1.5 rounded-lg bg-light-elevated dark:bg-dark-elevated text-xs font-bold font-mono hover:text-brand-500 transition-colors"
                    >
                      +500
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCash(1000)}
                      className="px-3 py-1.5 rounded-lg bg-light-elevated dark:bg-dark-elevated text-xs font-bold font-mono hover:text-brand-500 transition-colors"
                    >
                      +1,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCash(5000)}
                      className="px-3 py-1.5 rounded-lg bg-light-elevated dark:bg-dark-elevated text-xs font-bold font-mono hover:text-brand-500 transition-colors"
                    >
                      +5,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(Math.ceil(cartTotal / 10000) * 10000)}
                      className="px-3 py-1.5 rounded-lg bg-light-elevated dark:bg-dark-elevated text-xs font-bold font-mono hover:text-brand-500 transition-colors"
                    >
                      Round 10k
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CARD PAYMENT MODE */}
            {paymentMethod === 'Card' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Card Terminal Authorization / Reference #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AUTH-928104 (Optional)"
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
                <div className="text-[11px] text-light-muted dark:text-dark-muted flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Supports Visa, Mastercard, AMEX contactless & chip terminals.</span>
                </div>
              </div>
            )}

            {/* BANK TRANSFER MODE */}
            {paymentMethod === 'Bank Transfer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destination Bank
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  >
                    <option value="Commercial Bank">Commercial Bank of Ceylon</option>
                    <option value="Sampath Bank">Sampath Bank PLC</option>
                    <option value="Hatton National Bank">Hatton National Bank (HNB)</option>
                    <option value="Bank of Ceylon">Bank of Ceylon (BOC)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transaction / Slip Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REF-CEFT-849102"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* CUSTOMER CREDIT MODE */}
            {paymentMethod === 'Customer Credit' && (
              <div className="space-y-3">
                {selectedCustomer ? (
                  <div className="p-3 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCustomer.name}</span>
                      <span className="font-mono text-light-muted">{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-light-border dark:border-dark-border">
                      <span className="text-light-muted">Current Ledger Due:</span>
                      <span className="font-mono font-bold text-rose-500">
                        LKR {selectedCustomer.creditBalance.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-light-muted">Credit Limit Available:</span>
                      <span className="font-mono font-bold text-emerald-500">
                        LKR {customerCreditLimitAvailable.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>No customer selected. Close and press F6 to assign a customer before extending credit.</span>
                  </div>
                )}
              </div>
            )}

            {/* INSTALLMENT MODE */}
            {paymentMethod === 'Installment' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    BNPL / Installment Provider
                  </label>
                  <select
                    value={installmentProvider}
                    onChange={(e) => setInstallmentProvider(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  >
                    <option value="Koko">Koko (3x Installments)</option>
                    <option value="Mintpay">Mintpay (3x Installments)</option>
                    <option value="Commercial Bank">Commercial Bank 0% Easy Payment</option>
                    <option value="Sampath Bank">Sampath Bank Extended Settlement</option>
                    <option value="HNB">HNB Card 0% Plan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tenure (Months)
                  </label>
                  <select
                    value={installmentMonths}
                    onChange={(e) => setInstallmentMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  >
                    <option value={3}>3 Months (LKR {Math.round(cartTotal / 3).toLocaleString()} / mo)</option>
                    <option value={6}>6 Months (LKR {Math.round(cartTotal / 6).toLocaleString()} / mo)</option>
                    <option value={12}>12 Months (LKR {Math.round(cartTotal / 12).toLocaleString()} / mo)</option>
                  </select>
                </div>
              </div>
            )}

            {/* SPLIT PAYMENT MODE */}
            {paymentMethod === 'Split' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cash Amount (LKR)
                    </label>
                    <input
                      type="number"
                      value={splitCash || ''}
                      onChange={(e) => setSplitCash(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Card Amount (LKR)
                    </label>
                    <input
                      type="number"
                      value={splitCard || ''}
                      onChange={(e) => setSplitCard(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Credit Ledger (LKR)
                    </label>
                    <input
                      type="number"
                      value={splitCredit || ''}
                      onChange={(e) => setSplitCredit(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-light-border dark:border-dark-border">
                  <span>Split Total: LKR {splitSum.toLocaleString()}</span>
                  <span className={splitRemaining === 0 ? 'text-emerald-500' : 'text-rose-500'}>
                    {splitRemaining === 0 ? '✓ Balanced' : `Remaining: LKR ${splitRemaining.toLocaleString()}`}
                  </span>
                </div>
              </div>
            )}

            {/* Sale Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receipt Note / Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. VIP discount authorized, include complimentary glass guard..."
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel (Esc)
            </button>

            <button
              type="submit"
              className="px-8 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-brand-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Complete Sale & Print</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
