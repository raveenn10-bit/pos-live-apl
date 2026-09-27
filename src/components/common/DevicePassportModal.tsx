'use client';
import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  X, 
  Smartphone, 
  BatteryCharging, 
  ShieldCheck, 
  DollarSign, 
  Copy, 
  Check, 
  Truck, 
  User, 
  Wrench, 
  Calendar, 
  ShoppingCart,
  Search,
  ExternalLink,
  Barcode,
  Repeat
} from 'lucide-react';

interface DevicePassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPos?: () => void;
}

export const DevicePassportModal: React.FC<DevicePassportModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPos
}) => {
  const { 
    activePassportDevice, 
    closeDevicePassport, 
    getDeviceByImeiOrSerial, 
    openDevicePassport, 
    addToCart, 
    showNotification 
  } = useStore();

  const [searchInput, setSearchInput] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen && !activePassportDevice) return null;

  const currentDevice = activePassportDevice?.device;
  const currentProduct = activePassportDevice?.product;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    const result = getDeviceByImeiOrSerial(searchInput.trim());
    if (result) {
      openDevicePassport(result.device, result.product);
      setSearchInput('');
    } else {
      showNotification('warning', `No device found matching "${searchInput}"`);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
    showNotification('info', `Copied ${fieldName} to clipboard`);
  };

  const handleAddToCart = () => {
    if (currentProduct && currentDevice) {
      if (currentDevice.status !== 'In Stock') {
        showNotification('warning', `Cannot add device with status: ${currentDevice.status}`);
        return;
      }
      addToCart(currentProduct, currentDevice);
      closeDevicePassport();
      onClose();
      if (onNavigateToPos) onNavigateToPos();
    }
  };

  // Warranty calculation
  let warrantyDaysRemaining = 0;
  let warrantyPercent = 100;
  if (currentDevice?.warrantyExpiryDate) {
    const expiry = new Date(currentDevice.warrantyExpiryDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    warrantyDaysRemaining = Math.max(0, diff);
    const totalDays = (currentDevice.warrantyPeriodMonths || 12) * 30;
    warrantyPercent = Math.min(100, Math.max(0, (warrantyDaysRemaining / totalDays) * 100));
  }

  // Trade-In Origin & True Cost Assessment
  const isTradeIn = Boolean(
    currentDevice?.isTradeIn || 
    currentDevice?.tradeInId || 
    currentDevice?.tradeInNumber || 
    (currentDevice as any)?.trade_in ||
    currentDevice?.condition?.toLowerCase().includes('grade') ||
    currentDevice?.condition?.toLowerCase().includes('used')
  );

  const tradeInNumber = currentDevice?.tradeInNumber || (currentDevice as any)?.trade_in?.trade_in_number || currentDevice?.tradeInId;
  const tradeInCustomer = currentDevice?.tradeInCustomerName || (currentDevice as any)?.trade_in?.customer_name;
  const tradeInPhone = currentDevice?.tradeInCustomerPhone || (currentDevice as any)?.trade_in?.customer_phone;
  const tradeInDate = currentDevice?.tradeInDate || (currentDevice as any)?.trade_in?.created_at;
  const tradeInInvoice = currentDevice?.tradeInInvoiceNumber || (currentDevice as any)?.exchange_invoice?.invoice_number;
  const acqCost = Number(currentDevice?.tradeInAcquisitionCost ?? (currentDevice as any)?.trade_in?.final_approved_value ?? currentDevice?.costPrice ?? 0);
  const refurbCost = Number(currentDevice?.refurbishmentCost ?? (currentDevice as any)?.trade_in?.refurbishment_cost ?? 0);
  const trueCost = Number(currentDevice?.trueCost ?? (currentDevice as any)?.trade_in?.true_cost ?? (acqCost + refurbCost));
  const effectiveCost = isTradeIn ? trueCost : (currentDevice?.costPrice || 0);
  const resalePrice = Number(currentDevice?.resalePrice ?? (currentDevice as any)?.trade_in?.resale_price ?? currentDevice?.sellingPrice ?? 0);
  const marginLkr = resalePrice - effectiveCost;
  const marginPct = resalePrice > 0 
    ? Math.round((marginLkr / resalePrice) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-light-surface/60 dark:bg-dark-surface/60 border-b border-light-border dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                AppleVision Device Passport
                <span className="text-[10px] font-mono uppercase bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded-full border border-brand-500/20">
                  Global Trace
                </span>
              </h2>
              <p className="text-[11px] text-light-muted dark:text-dark-muted">
                Full lifecycle verification, warranty status, battery health, and hardware identity
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              closeDevicePassport();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search Toolbar */}
        <div className="px-6 py-3 bg-light-card dark:bg-dark-card border-b border-light-border dark:border-dark-border">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Scan Barcode or input IMEI 1 / IMEI 2 / Serial Number..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white font-mono"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Inspect Device
            </button>
          </form>
        </div>

        {/* Passport Content Body */}
        {currentDevice && currentProduct ? (
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Top Identity Block */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 flex items-center justify-center text-white shadow-md flex-shrink-0">
                  <Smartphone className="w-7 h-7 text-brand-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {currentDevice.modelName || currentProduct.name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-light-muted dark:text-dark-muted font-medium">
                    {currentDevice.storage && (
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                        {currentDevice.storage}
                      </span>
                    )}
                    {currentDevice.color && (
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px]">
                        {currentDevice.color}
                      </span>
                    )}
                    <span className="font-mono text-[11px]">SKU: {currentProduct.sku}</span>
                  </div>
                </div>
              </div>

              {/* Status and Condition Badges */}
              <div className="flex sm:flex-col items-end gap-2">
                {isTradeIn && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                    <Repeat className="w-3.5 h-3.5" />
                    <span>â˜… PRE-OWNED / TRADE-IN</span>
                  </span>
                )}
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  currentDevice.status === 'In Stock'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : currentDevice.status === 'Sold'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                }`}>
                  {currentDevice.status}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-light-elevated dark:bg-dark-elevated text-slate-700 dark:text-slate-300 border border-light-border dark:border-dark-border">
                  {currentDevice.condition}
                </span>
              </div>
            </div>

            {/* Hardware Identifiers & Copy Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* IMEI 1 */}
              <div className="p-3.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-light-muted dark:text-dark-muted tracking-wider">
                    Primary IMEI 1
                  </div>
                  <div className="font-mono font-bold text-xs text-slate-900 dark:text-white mt-0.5">
                    {currentDevice.imei1}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(currentDevice.imei1, 'IMEI 1')}
                  className="p-1.5 text-slate-400 hover:text-brand-500 rounded-lg transition-colors"
                  title="Copy IMEI 1"
                >
                  {copiedField === 'IMEI 1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* IMEI 2 / eSIM */}
              <div className="p-3.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-light-muted dark:text-dark-muted tracking-wider">
                    Secondary IMEI 2 / eSIM
                  </div>
                  <div className="font-mono font-bold text-xs text-slate-900 dark:text-white mt-0.5">
                    {currentDevice.imei2 || 'N/A (Wi-Fi / Single SIM)'}
                  </div>
                </div>
                {currentDevice.imei2 && (
                  <button
                    onClick={() => handleCopy(currentDevice.imei2!, 'IMEI 2')}
                    className="p-1.5 text-slate-400 hover:text-brand-500 rounded-lg transition-colors"
                    title="Copy IMEI 2"
                  >
                    {copiedField === 'IMEI 2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Serial Number */}
              <div className="p-3.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-light-muted dark:text-dark-muted tracking-wider">
                    Serial Number
                  </div>
                  <div className="font-mono font-bold text-xs text-slate-900 dark:text-white mt-0.5">
                    {currentDevice.serialNumber}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(currentDevice.serialNumber || '', 'Serial Number')}
                  className="p-1.5 text-slate-400 hover:text-brand-500 rounded-lg transition-colors"
                  title="Copy Serial Number"
                >
                  {copiedField === 'Serial Number' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Trade-In Acquisition & True Cost Dossier */}
            {isTradeIn && (
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                    <Repeat className="w-4 h-4" />
                    <span>Trade-In Acquisition & True Cost Dossier</span>
                  </div>
                  {tradeInNumber && (
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Ref: {tradeInNumber}
                    </span>
                  )}
                </div>

                {/* Origin Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-1">
                    <div className="text-[10px] font-bold uppercase text-light-muted dark:text-dark-muted">Intake Customer</div>
                    <div className="font-semibold text-slate-900 dark:text-white">{tradeInCustomer || 'Store Trade-In Counter'}</div>
                    <div className="font-mono text-[10px] text-light-muted dark:text-dark-muted">{tradeInPhone || 'Verified Exchange'}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-1">
                    <div className="text-[10px] font-bold uppercase text-light-muted dark:text-dark-muted">Intake Date / Invoice</div>
                    <div className="font-mono font-semibold text-slate-900 dark:text-white">
                      {tradeInDate?.slice(0, 10) || currentDevice.purchaseDate || '2026-09-25'}
                    </div>
                    {tradeInInvoice && (
                      <div className="text-[10px] text-brand-500 font-mono">Original Invoice #{tradeInInvoice}</div>
                    )}
                  </div>
                </div>

                {/* True Cost Financial Matrix */}
                <div className="p-3 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2">
                    True Cost Accounting Breakdown
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] text-light-muted dark:text-dark-muted">Acquisition Value</div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        LKR {acqCost.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-light-muted dark:text-dark-muted">+ Refurbishment</div>
                      <div className="font-mono font-bold text-amber-500">
                        LKR {refurbCost.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-brand-500 font-bold">= True Cost</div>
                      <div className="font-mono font-bold text-brand-500">
                        LKR {trueCost.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-light-muted dark:text-dark-muted">
                        {currentDevice.status === 'Sold' ? 'Realized Profit' : 'Projected Margin'}
                      </div>
                      <div className="font-mono font-bold text-emerald-500">
                        +LKR {marginLkr.toLocaleString()} ({marginPct}%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Diagnostics, Battery, Financials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Battery Health Indicator */}
              <div className="p-4 rounded-xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <BatteryCharging className="w-4 h-4 text-emerald-500" />
                    <span>Battery Maximum Capacity</span>
                  </div>
                  <span className={`font-mono text-sm font-bold ${
                    (currentDevice.batteryHealth || 100) >= 90
                      ? 'text-emerald-500'
                      : (currentDevice.batteryHealth || 100) >= 80
                      ? 'text-amber-500'
                      : 'text-red-500'
                  }`}>
                    {currentDevice.batteryHealth ? `${currentDevice.batteryHealth}%` : 'N/A'}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (currentDevice.batteryHealth || 100) >= 90
                        ? 'bg-emerald-500'
                        : (currentDevice.batteryHealth || 100) >= 80
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${currentDevice.batteryHealth || 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-light-muted dark:text-dark-muted">
                  {(currentDevice.batteryHealth || 100) >= 90
                    ? 'Peak Performance Capability supported.'
                    : (currentDevice.batteryHealth || 100) >= 80
                    ? 'Normal aging. Healthy capacity.'
                    : 'Battery health significantly degraded. Service suggested.'}
                </div>
              </div>

              {/* Warranty Countdown */}
              <div className="p-4 rounded-xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-brand-500" />
                    <span>Store / AppleCare Warranty</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-brand-500">
                    {warrantyDaysRemaining} Days Left
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${warrantyPercent}%` }}
                  />
                </div>
                <div className="text-[11px] text-light-muted dark:text-dark-muted font-mono flex items-center justify-between">
                  <span>Expires: {currentDevice.warrantyExpiryDate || 'None'}</span>
                  <span>{currentDevice.warrantyPeriodMonths || 3} Months</span>
                </div>
                {isTradeIn && (
                  <div className="pt-1 border-t border-light-border dark:border-dark-border text-[10px] text-brand-500 font-semibold leading-tight">
                    â˜… 3-Month Phone-to-Phone Replacement Warranty Included
                  </div>
                )}
              </div>

              {/* Financial Margin Card */}
              <div className="p-4 rounded-xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>Cost & Profit Margin</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-light-muted dark:text-dark-muted">
                    {isTradeIn ? 'True Cost:' : 'Cost Price:'}
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    LKR {effectiveCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-light-muted dark:text-dark-muted">Retail Price:</span>
                  <span className="font-mono font-bold text-brand-500">
                    LKR {resalePrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-light-border dark:border-dark-border">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">Profit Spread:</span>
                  <span className="font-mono font-bold text-emerald-500">
                    +LKR {marginLkr.toLocaleString()} ({marginPct}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Supplier & Customer Acquisition Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Intake & Supplier */}
              <div className="p-4 rounded-xl bg-light-surface/40 dark:bg-dark-surface/40 border border-light-border dark:border-dark-border space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <span>Procurement & Inward Shipment</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-light-muted dark:text-dark-muted">Supplier:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{currentDevice.supplierName || 'Dubai Electronics FZE'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-muted dark:text-dark-muted">Intake Date:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{currentDevice.purchaseDate || '2026-09-10'}</span>
                  </div>
                </div>
              </div>

              {/* Customer Sale History */}
              <div className="p-4 rounded-xl bg-light-surface/40 dark:bg-dark-surface/40 border border-light-border dark:border-dark-border space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <User className="w-4 h-4 text-purple-400" />
                  <span>Outward Sale & Ownership</span>
                </div>
                {currentDevice.status === 'Sold' ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-light-muted dark:text-dark-muted">Sold To:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{currentDevice.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-light-muted dark:text-dark-muted">Phone:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{currentDevice.customerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-light-muted dark:text-dark-muted">Invoice #:</span>
                      <span className="font-mono font-bold text-brand-500">{currentDevice.invoiceNumber}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-light-muted dark:text-dark-muted italic py-1">
                    Device currently available in store stock. Not yet assigned to a customer.
                  </div>
                )}
              </div>
            </div>

            {/* Repair & Service History */}
            <div className="p-4 rounded-xl bg-light-surface/40 dark:bg-dark-surface/40 border border-light-border dark:border-dark-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Wrench className="w-4 h-4 text-amber-500" />
                  <span>Service & Bench Diagnostic Records</span>
                </div>
                <span className="text-[10px] text-light-muted dark:text-dark-muted">
                  {(currentDevice.repairHistory || []).length} Record(s) logged
                </span>
              </div>

              {(!currentDevice.repairHistory || currentDevice.repairHistory.length === 0) ? (
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Clean Service History â€” No hardware repairs or liquid interventions recorded.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {(currentDevice.repairHistory || []).map((rep) => (
                    <div key={rep.id} className="p-2.5 rounded-lg bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-900 dark:text-white">{rep.description}</span>
                        <span className="font-mono text-[10px] text-light-muted">{rep.date}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-light-muted dark:text-dark-muted">
                        <span>Technician: {rep.technician}</span>
                        <span className="text-emerald-400 font-bold">{rep.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Barcode className="w-12 h-12 mx-auto text-slate-600" />
            <div className="text-sm font-semibold">No Device Selected</div>
            <div className="text-xs text-slate-500 max-w-sm mx-auto">
              Scan a device barcode, or search by IMEI 1, IMEI 2, or Serial Number above to generate a full Device Passport.
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-light-surface/60 dark:bg-dark-surface/60 border-t border-light-border dark:border-dark-border flex items-center justify-between">
          <button
            onClick={() => {
              closeDevicePassport();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Close Passport (Esc)
          </button>

          {currentDevice && currentProduct && currentDevice.status === 'In Stock' && (
            <button
              onClick={handleAddToCart}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-500/25 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add Device to POS Cart (F2)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
