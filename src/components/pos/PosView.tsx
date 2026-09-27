'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory, DeviceItem, DeviceCondition } from '../../types';
import { CustomerSelectModal } from './CustomerSelectModal';
import { HeldSalesModal } from './HeldSalesModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { TradeInInspectionModal } from './TradeInInspectionModal';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Tag, 
  ShieldCheck, 
  PauseCircle, 
  RotateCcw, 
  CreditCard, 
  UserCheck, 
  Barcode, 
  Smartphone, 
  Percent, 
  ChevronDown,
  Repeat,
  SlidersHorizontal,
  X,
  Sparkles,
  Check,
  ChevronRight,
  Laptop,
  Tablet,
  Watch,
  Headphones,
  Cable,
  Package,
  Layers
} from 'lucide-react';

interface PosViewProps {
  onOpenImeiSearch: () => void;
}

export const PosView: React.FC<PosViewProps> = ({ onOpenImeiSearch }) => {
  const {
    products,
    cart,
    currentTradeIn,
    setTradeIn,
    removeTradeIn,
    cartTradeInCredit,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    updateCartDiscount,
    updateCartWarranty,
    clearCart,
    cartSubtotal,
    cartDiscountTotal,
    cartTaxTotal,
    cartTotal,
    selectedCustomer,
    setSelectedCustomer,
    heldSales,
    holdCurrentSale,
    lastCompletedSale,
    setLastCompletedSale,
    showNotification
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');
  const [selectedCondition, setSelectedCondition] = useState<'All' | DeviceCondition>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mobile cart sheet state
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isTradeInModalOpen, setIsTradeInModalOpen] = useState(false);

  // Serial selector state for products with multiple IMEIs
  const [selectedImeiForProduct, setSelectedImeiForProduct] = useState<Record<string, string>>({});

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts listener for F2-F9
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        clearCart();
        showNotification('info', 'New sale started (Cart cleared)');
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (window.innerWidth < 768) {
          mobileSearchInputRef.current?.focus();
        } else {
          searchInputRef.current?.focus();
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        onOpenImeiSearch();
      } else if (e.key === 'F6') {
        e.preventDefault();
        setIsCustomerModalOpen(true);
      } else if (e.key === 'F7') {
        e.preventDefault();
        setIsTradeInModalOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        holdCurrentSale();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsPaymentModalOpen(true);
        } else {
          showNotification('warning', 'Cart is empty. Add products first.');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, holdCurrentSale, clearCart, onOpenImeiSearch, showNotification]);

  // Categories list with Icons
  const categories: { label: ProductCategory; icon: React.ReactNode }[] = [
    { label: 'All', icon: <Layers className="w-3.5 h-3.5" /> },
    { label: 'iPhones', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { label: 'iPads', icon: <Tablet className="w-3.5 h-3.5" /> },
    { label: 'MacBooks', icon: <Laptop className="w-3.5 h-3.5" /> },
    { label: 'Apple Watch', icon: <Watch className="w-3.5 h-3.5" /> },
    { label: 'AirPods', icon: <Headphones className="w-3.5 h-3.5" /> },
    { label: 'Cables & Power', icon: <Cable className="w-3.5 h-3.5" /> },
    { label: 'Cases & Protection', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { label: 'Accessories', icon: <Package className="w-3.5 h-3.5" /> },
  ];

  // Conditions list
  const conditions: ('All' | DeviceCondition)[] = [
    'All',
    'Brand New Sealed',
    'Mint Like New',
    'Grade A',
    'Grade B',
  ];

  const hasActiveSearch = searchQuery.trim().length > 0;
  const hasCategoryFilter = selectedCategory !== 'All';
  const shouldDisplayProducts = hasActiveSearch || hasCategoryFilter;

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesCondition = selectedCondition === 'All' || prod.condition === selectedCondition;
    
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory && matchesCondition;

    const matchesName = prod.name.toLowerCase().includes(query);
    const matchesSku = prod.sku.toLowerCase().includes(query);
    const matchesBarcode = prod.barcode && prod.barcode.includes(query);
    const matchesImei = prod.imeis.some(d => 
      d.imei1.includes(query) || 
      (d.imei2 && d.imei2.includes(query)) || 
      (d.serialNumber && d.serialNumber.toLowerCase().includes(query))
    );

    return matchesCategory && matchesCondition && (matchesName || matchesSku || matchesBarcode || matchesImei);
  });

  const handleProductAdd = (product: Product) => {
    if (product.currentStock <= 0) {
      showNotification('error', `Out of stock: ${product.name}`);
      return;
    }

    if (product.isSerialized) {
      const chosenImeiId = selectedImeiForProduct[product.id];
      const targetImei = chosenImeiId 
        ? product.imeis.find(d => d.id === chosenImeiId && d.status === 'In Stock')
        : product.imeis.find(d => d.status === 'In Stock');

      if (!targetImei) {
        showNotification('error', `No available IMEI for ${product.name}`);
        return;
      }

      addToCart(product, targetImei);
    } else {
      addToCart(product);
    }
  };

  const totalCartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="select-none flex flex-col h-full">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. MOBILE VIEW (Dedicated iOS 18 Premium POS Experience)
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col space-y-3 pb-24">
        {/* Mobile Search & Action Bar */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Search iPhone, iPad, SKU or IMEI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder:text-slate-400 font-sans shadow-sm transition-all"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-5 h-5 absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-neutral-700 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenImeiSearch}
              className="p-2.5 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 border border-brand-500/30 flex items-center justify-center active:scale-95 transition-transform"
              title="Scan IMEI (F4)"
            >
              <Barcode className="w-5 h-5" />
            </button>
          </div>

          {/* iOS Category Filter Pills (Horizontal Scroll) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.label;
              const count = cat.label === 'All' 
                ? products.length 
                : products.filter(p => p.category === cat.label).length;

              return (
                <button
                  key={cat.label}
                  onClick={() => setSelectedCategory(cat.label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 scale-[1.02]'
                      : 'bg-white/80 dark:bg-neutral-900/80 text-slate-600 dark:text-neutral-300 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-neutral-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Condition Pills (When searching or viewing category) */}
          {shouldDisplayProducts && (
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none -mx-1 px-1 text-[11px]">
              {conditions.map((cond) => (
                <button
                  key={cond}
                  onClick={() => setSelectedCondition(cond)}
                  className={`px-2.5 py-1 rounded-xl font-medium whitespace-nowrap transition-colors ${
                    selectedCondition === cond
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-sm'
                      : 'text-slate-500 dark:text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800/50 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Results Area */}
        <div className="space-y-3">
          {!shouldDisplayProducts ? (
            /* Clean Empty State: Prompts user to search or tap a category */
            <div className="rounded-3xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 text-center space-y-4 shadow-sm my-2">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-brand-500/10 text-brand-500 flex items-center justify-center shadow-inner">
                <Search className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Search or Scan Products
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-[260px] mx-auto leading-relaxed">
                  Type a device name, model, SKU, or scan IMEI/barcode to view available products.
                </p>
              </div>

              {/* Quick Category Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                {categories.filter(c => c.label !== 'All').slice(0, 6).map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => setSelectedCategory(cat.label)}
                    className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-brand-500/10 text-slate-700 dark:text-neutral-200 text-xs font-semibold flex flex-col items-center gap-1 transition-all active:scale-95"
                  >
                    <div className="text-brand-500">{cat.icon}</div>
                    <span className="truncate w-full text-center text-[11px]">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* No Results Found */
            <div className="p-10 text-center rounded-3xl bg-white/70 dark:bg-neutral-900/70 border border-white/40 dark:border-white/10 space-y-2">
              <div className="text-slate-400 dark:text-neutral-500 text-xs">
                No stock found matching <span className="font-bold text-slate-800 dark:text-white">"{searchQuery || selectedCategory}"</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedCondition('All');
                }}
                className="text-xs font-bold text-brand-500 hover:underline inline-block mt-1"
              >
                Clear filters
              </button>
            </div>
          ) : (
            /* Product Cards List */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-neutral-400">
                <span>{filteredProducts.length} Product(s) Found</span>
                {hasCategoryFilter && (
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className="text-brand-500 font-semibold"
                  >
                    Show All
                  </button>
                )}
              </div>

              {filteredProducts.map((product) => {
                const availableImeis = product.imeis.filter(d => d.status === 'In Stock');
                const isOutOfStock = product.currentStock <= 0;
                const isLowStock = product.currentStock > 0 && product.currentStock <= product.minStock;

                return (
                  <div
                    key={product.id}
                    className={`p-3.5 rounded-3xl border transition-all ${
                      isOutOfStock
                        ? 'bg-neutral-100 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                        : 'bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-sm'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                            {product.category}
                          </span>
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
                            {product.condition}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {product.name}
                        </h4>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono mt-0.5">
                          SKU: {product.sku}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isOutOfStock
                            ? 'bg-rose-500/10 text-rose-500'
                            : isLowStock
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {product.currentStock} in stock
                        </span>
                      </div>
                    </div>

                    {/* Serialized IMEI Dropdown */}
                    {product.isSerialized && availableImeis.length > 0 && (
                      <div className="mt-2.5 p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-black/5 dark:border-white/5">
                        <label className="text-[9px] font-bold uppercase text-slate-400 dark:text-neutral-500 px-1 block mb-0.5">
                          Select Serial / IMEI:
                        </label>
                        <select
                          value={selectedImeiForProduct[product.id] || availableImeis[0]?.id}
                          onChange={(e) => setSelectedImeiForProduct(prev => ({ ...prev, [product.id]: e.target.value }))}
                          className="w-full text-xs font-mono py-1 px-2 rounded-lg bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 text-slate-800 dark:text-neutral-200"
                        >
                          {availableImeis.map(dev => (
                            <option key={dev.id} value={dev.id}>
                              IMEI: {dev.imei1.slice(-6)} • {dev.batteryHealth ? `${dev.batteryHealth}% Battery` : dev.serialNumber}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Price & Add Action Button */}
                    <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Selling Price</span>
                        <div className="font-mono font-black text-base text-slate-900 dark:text-white">
                          LKR {product.sellingPrice.toLocaleString()}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleProductAdd(product)}
                        className="px-4 py-2 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/25 flex items-center gap-1.5 active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer & Trade-in Quick Bar on Mobile */}
        <div className="rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 p-3.5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[170px]">
                  {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {selectedCustomer ? selectedCustomer.phone : 'Standard retail billing'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 text-xs font-semibold border border-black/5 dark:border-white/10 active:scale-95"
            >
              {selectedCustomer ? 'Change' : 'Assign'}
            </button>
          </div>

          {/* Trade In Bar */}
          {currentTradeIn ? (
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400">
                    Trade-In: {currentTradeIn.inspection.model}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    -LKR {currentTradeIn.finalApprovedValue.toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={removeTradeIn}
                className="p-1 text-slate-400 hover:text-rose-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsTradeInModalOpen(true)}
              className="w-full py-2 px-3 rounded-2xl border border-dashed border-indigo-400 dark:border-indigo-600/60 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>+ Add Trade-In / Exchange (F7)</span>
            </button>
          )}
        </div>

        {/* Floating Mobile Bottom Cart Capsule (When Cart > 0) */}
        {cart.length > 0 && (
          <div className="fixed bottom-16 left-3 right-3 z-30 animate-in fade-in slide-in-from-bottom duration-300">
            <div className="p-3 rounded-3xl bg-neutral-900/95 dark:bg-neutral-900/95 text-white shadow-2xl backdrop-blur-2xl border border-white/20 flex items-center justify-between">
              <button
                onClick={() => setIsMobileCartOpen(true)}
                className="flex items-center gap-3 text-left pl-1"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-neutral-900 font-bold text-[10px] flex items-center justify-center font-mono">
                    {totalCartItemCount}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                    Total Payable
                  </div>
                  <div className="font-mono font-black text-sm text-white">
                    LKR {cartTotal.toLocaleString()}
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(true)}
                  className="px-3 py-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200"
                >
                  Review
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-4 py-2 rounded-2xl bg-brand-500 hover:bg-brand-600 text-xs font-black uppercase text-white shadow-md shadow-brand-500/30 active:scale-95"
                >
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Cart Sheet / Modal */}
        {isMobileCartOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
            <div className="bg-white dark:bg-neutral-900 rounded-t-[32px] border-t border-white/20 p-5 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-brand-500" />
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Current Bill ({totalCartItemCount} Items)
                  </h3>
                </div>
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
                {cart.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-black/5 dark:border-white/5 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                          {item.product.name}
                        </h5>
                        {item.selectedImei && (
                          <div className="text-[10px] font-mono text-brand-600 dark:text-brand-400 flex items-center gap-1 mt-0.5">
                            <Barcode className="w-3 h-3" />
                            <span>IMEI: {item.selectedImei.imei1}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Warranty Selector */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 dark:text-neutral-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-brand-500" />
                        Warranty:
                      </span>
                      <select
                        value={item.warrantyOption}
                        onChange={(e) => updateCartWarranty(item.cartItemId, e.target.value as any, 0)}
                        className="text-[10px] py-1 px-2 rounded-lg bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 text-slate-800 dark:text-neutral-200"
                      >
                        <option value="None">None</option>
                        <option value="3 Months Phone to Phone">3 Months Phone to Phone (Replacement)</option>
                        <option value="3 Months AppleVision">3 Months Store Warranty</option>
                        <option value="6 Months AppleVision">6 Months Store Warranty</option>
                        <option value="1 Year AppleCare">1 Year AppleCare / Official</option>
                        <option value="1 Year AppleVision">1 Year AppleVision Warranty</option>
                      </select>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.cartItemId, item.quantity + 1)}
                          disabled={item.product.isSerialized}
                          className="w-6 h-6 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center font-bold disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="font-mono font-black text-xs text-slate-900 dark:text-white">
                        LKR {item.lineTotal.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sheet Summary */}
              <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-2">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-neutral-400">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">LKR {cartSubtotal.toLocaleString()}</span>
                  </div>
                  {cartTradeInCredit > 0 && (
                    <div className="flex justify-between text-indigo-500 font-bold">
                      <span>Trade-In Credit:</span>
                      <span className="font-mono">-LKR {cartTradeInCredit.toLocaleString()}</span>
                    </div>
                  )}
                  {cartDiscountTotal > 0 && (
                    <div className="flex justify-between text-emerald-500 font-semibold">
                      <span>Discount:</span>
                      <span className="font-mono">-LKR {cartDiscountTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-1 border-t border-black/5 dark:border-white/10">
                    <span className="font-black text-sm text-slate-900 dark:text-white">Net Payable:</span>
                    <span className="font-mono font-black text-lg text-brand-500">
                      LKR {cartTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsMobileCartOpen(false);
                    setIsPaymentModalOpen(true);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 active:scale-98"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Proceed to Payment (F9)</span>
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    onClick={() => {
                      holdCurrentSale();
                      setIsMobileCartOpen(false);
                    }}
                    className="text-slate-400 hover:text-amber-500 font-semibold flex items-center gap-1"
                  >
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>Hold Sale</span>
                  </button>
                  <button
                    onClick={() => {
                      clearCart();
                      setIsMobileCartOpen(false);
                    }}
                    className="text-slate-400 hover:text-rose-500 font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. DESKTOP VIEW (3-Column POS System with Keyboard Shortcuts)
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-5.5rem)]">
        {/* Top POS Command Ribbon */}
        <div className="h-10 px-4 mb-2 rounded-xl bg-white/70 dark:bg-dark-card/70 backdrop-blur border border-light-border dark:border-dark-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-light-muted dark:text-dark-muted">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-light-elevated dark:bg-dark-elevated px-1.5 py-0.5 rounded text-[10px]">F2</kbd> New Sale
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-light-elevated dark:bg-dark-elevated px-1.5 py-0.5 rounded text-[10px]">F3</kbd> Focus Search
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-light-elevated dark:bg-dark-elevated px-1.5 py-0.5 rounded text-[10px]">F4</kbd> Scan IMEI
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-light-elevated dark:bg-dark-elevated px-1.5 py-0.5 rounded text-[10px]">F6</kbd> Customer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-light-elevated dark:bg-dark-elevated px-1.5 py-0.5 rounded text-[10px]">F7</kbd> Trade-In
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-light-elevated dark:bg-dark-elevated px-1.5 py-0.5 rounded text-[10px]">F8</kbd> Hold Sale
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-brand-500/20 text-brand-500 font-bold px-1.5 py-0.5 rounded text-[10px]">F9</kbd> Pay Now
            </span>
          </div>

          {heldSales.length > 0 && (
            <button
              onClick={() => setIsHeldModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-semibold"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>{heldSales.length} Parked Sale(s)</span>
            </button>
          )}
        </div>

        {/* 3-Column POS Main Container */}
        <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
          {/* COLUMN 1: Categories (2 cols) */}
          <div className="col-span-3 lg:col-span-2 bg-white/70 dark:bg-dark-card/70 backdrop-blur rounded-2xl border border-light-border dark:border-dark-border p-3 flex flex-col justify-between overflow-hidden">
            <div className="space-y-1 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
                Categories
              </div>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.label;
                const count = cat.label === 'All' 
                  ? products.length 
                  : products.filter(p => p.category === cat.label).length;

                return (
                  <button
                    key={cat.label}
                    onClick={() => setSelectedCategory(cat.label)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-light-surface dark:hover:bg-dark-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {cat.icon}
                      <span className="truncate">{cat.label}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-light-elevated dark:bg-dark-elevated text-light-muted'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Help Note */}
            <div className="p-2.5 rounded-xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border text-[10px] text-light-muted dark:text-dark-muted">
              <span className="font-bold text-slate-800 dark:text-slate-200">AppleVision POS</span>
              <p className="mt-0.5">Barcode scanners directly register into search field.</p>
            </div>
          </div>

          {/* COLUMN 2: Products Catalog & Search (6 cols) */}
          <div className="col-span-5 lg:col-span-6 bg-white/70 dark:bg-dark-card/70 backdrop-blur rounded-2xl border border-light-border dark:border-dark-border p-3 flex flex-col overflow-hidden">
            {/* Search & Filter Bar */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search device name, SKU, barcode, or scan IMEI... (F3)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono"
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Condition Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {conditions.map((cond) => (
                  <button
                    key={cond}
                    onClick={() => setSelectedCondition(cond)}
                    className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                      selectedCondition === cond
                        ? 'bg-light-elevated dark:bg-dark-elevated text-brand-500 border border-brand-500/30'
                        : 'text-light-muted dark:text-dark-muted hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {!shouldDisplayProducts ? (
                /* Clean Search Prompt State */
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-light-muted dark:text-dark-muted">
                  <div className="w-16 h-16 rounded-3xl bg-brand-500/10 text-brand-500 flex items-center justify-center shadow-inner">
                    <Search className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Search Products or Select a Category
                    </h4>
                    <p className="text-xs text-slate-400">
                      Type in the search bar above (or press F3) or select a category from the left to view inventory products.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCategory('iPhones')}
                    className="px-4 py-2 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-xs font-semibold text-brand-500 hover:border-brand-500 transition-colors"
                  >
                    Browse iPhones Catalog →
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-xs text-light-muted dark:text-dark-muted">
                  No products found matching "{searchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {filteredProducts.map((product) => {
                    const availableImeis = product.imeis.filter(d => d.status === 'In Stock');
                    const isOutOfStock = product.currentStock <= 0;
                    const isLowStock = product.currentStock > 0 && product.currentStock <= product.minStock;

                    return (
                      <div
                        key={product.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                          isOutOfStock
                            ? 'bg-slate-100 dark:bg-slate-900/30 border-slate-300 dark:border-slate-800 opacity-60'
                            : 'bg-light-surface/60 dark:bg-dark-surface/60 hover:bg-light-elevated dark:hover:bg-dark-elevated border-light-border dark:border-dark-border hover:border-brand-500/40 shadow-sm'
                        }`}
                      >
                        <div>
                          {/* Tags */}
                          <div className="flex items-center justify-between text-[10px] mb-1.5">
                            <span className="font-semibold text-brand-600 dark:text-brand-400">
                              {product.category}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                              isOutOfStock
                                ? 'bg-red-500/10 text-red-500'
                                : isLowStock
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-emerald-500/10 text-emerald-500'
                            }`}>
                              {product.currentStock} in stock
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 leading-snug">
                            {product.name}
                          </h4>

                          {/* Specs */}
                          <div className="text-[10px] text-light-muted dark:text-dark-muted font-mono mt-1">
                            SKU: {product.sku}
                          </div>

                          {/* Condition Badge */}
                          <div className="mt-1">
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-light-elevated dark:bg-dark-elevated text-slate-700 dark:text-slate-300 border border-light-border dark:border-dark-border">
                              {product.condition}
                            </span>
                          </div>

                          {/* Serialized IMEI dropdown */}
                          {product.isSerialized && availableImeis.length > 0 && (
                            <div className="mt-2">
                              <select
                                value={selectedImeiForProduct[product.id] || availableImeis[0]?.id}
                                onChange={(e) => setSelectedImeiForProduct(prev => ({ ...prev, [product.id]: e.target.value }))}
                                className="w-full text-[10px] font-mono p-1 rounded bg-white dark:bg-dark-card border border-light-border dark:border-dark-border"
                              >
                                {availableImeis.map(dev => (
                                  <option key={dev.id} value={dev.id}>
                                    IMEI: {dev.imei1.slice(-6)} • {dev.batteryHealth ? `${dev.batteryHealth}%` : dev.serialNumber}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Price & Add Button */}
                        <div className="mt-3 pt-2 border-t border-light-border dark:border-dark-border flex items-center justify-between">
                          <div className="font-mono font-black text-xs text-slate-900 dark:text-white">
                            LKR {product.sellingPrice.toLocaleString()}
                          </div>
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => handleProductAdd(product)}
                            className="px-2.5 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: POS Cart, Customer, Discounts, Sticky Totals & Pay Now (4 cols) */}
          <div className="col-span-4 lg:col-span-4 bg-white/80 dark:bg-dark-card/90 backdrop-blur rounded-2xl border border-light-border dark:border-dark-border p-3 flex flex-col justify-between overflow-hidden shadow-lg">
            {/* Customer Bar */}
            <div className="mb-2 p-2.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-left leading-tight">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                  </div>
                  <div className="text-[10px] text-light-muted dark:text-dark-muted font-mono">
                    {selectedCustomer ? selectedCustomer.phone : 'Standard retail cash/card'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="px-2 py-1 rounded-lg bg-light-elevated dark:bg-dark-elevated text-light-muted dark:text-dark-muted hover:text-brand-500 text-[10px] font-semibold border border-light-border dark:border-dark-border"
              >
                {selectedCustomer ? 'Change (F6)' : 'Assign (F6)'}
              </button>
            </div>

            {/* Trade-In / Exchange Section in Cart */}
            <div className="mb-2">
              {currentTradeIn ? (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/30 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-500 text-white">
                        <Repeat className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono uppercase font-black px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                            Trade-In Credit
                          </span>
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {currentTradeIn.inspection.model} {currentTradeIn.inspection.storage}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          IMEI: {currentTradeIn.inspection.imei1} | {currentTradeIn.inspection.batteryHealth}% Battery
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIsTradeInModalOpen(true)}
                        className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                        title="Edit Trade-In Inspection"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={removeTradeIn}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Remove Trade-In"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-indigo-500/20 text-xs">
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      Approved Trade-In Value:
                    </span>
                    <span className="font-mono font-black text-sm text-emerald-500">
                      -LKR {currentTradeIn.finalApprovedValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsTradeInModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-indigo-400 dark:border-indigo-600 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all group"
                >
                  <Repeat className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
                  <span>+ Add Trade-In Device / Exchange (F7)</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-light-muted dark:text-dark-muted space-y-2">
                  <ShoppingCart className="w-10 h-10 text-slate-400" />
                  <div className="text-xs font-semibold">Cart is currently empty</div>
                  <div className="text-[10px] text-slate-500 max-w-[200px]">
                    Click products or scan IMEIs to begin customer checkout.
                  </div>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="p-2.5 rounded-xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-2"
                  >
                    {/* Top row: Name & Delete */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="leading-snug">
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {item.product.name}
                        </div>
                        {item.selectedImei && (
                          <div className="text-[10px] font-mono text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-1">
                            <Barcode className="w-3 h-3" />
                            <span>IMEI: {item.selectedImei.imei1}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Warranty Selector */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-light-muted flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-brand-500" />
                        Warranty:
                      </span>
                      <select
                        value={item.warrantyOption}
                        onChange={(e) => updateCartWarranty(item.cartItemId, e.target.value as any, 0)}
                        className="text-[10px] py-0.5 px-1.5 rounded bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-slate-800 dark:text-slate-200"
                      >
                        <option value="None">None</option>
                        <option value="3 Months Phone to Phone">★ 3 Months Phone to Phone (Replacement)</option>
                        <option value="3 Months AppleVision">3 Months Store Warranty</option>
                        <option value="6 Months AppleVision">6 Months Store Warranty</option>
                        <option value="1 Year AppleCare">1 Year AppleCare / Official</option>
                        <option value="1 Year AppleVision">1 Year AppleVision Warranty</option>
                      </select>
                    </div>

                    {/* Line Discount & Quantity Row */}
                    <div className="flex items-center justify-between pt-1 border-t border-light-border dark:border-dark-border text-xs">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateCartQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-5 h-5 rounded bg-light-elevated dark:bg-dark-elevated flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-500"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-xs px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.cartItemId, item.quantity + 1)}
                          disabled={item.product.isSerialized}
                          className="w-5 h-5 rounded bg-light-elevated dark:bg-dark-elevated flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-500 disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line discount button */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const val = prompt('Enter discount amount in LKR for this item:', item.discountAmount.toString());
                            if (val !== null) {
                              updateCartDiscount(item.cartItemId, Number(val) || 0, 'amount');
                            }
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-light-elevated dark:bg-dark-elevated text-light-muted hover:text-brand-500 flex items-center gap-0.5"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{item.discountAmount > 0 ? `-LKR ${item.discountAmount}` : 'Discount'}</span>
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        LKR {item.lineTotal.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sticky Cart Summary & Checkout */}
            <div className="mt-2 pt-2 border-t border-light-border dark:border-dark-border space-y-2">
              {/* Totals Breakdown */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-light-muted dark:text-dark-muted">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">LKR {cartSubtotal.toLocaleString()}</span>
                </div>
                {cartTradeInCredit > 0 && (
                  <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-bold">
                    <span>Trade-In Credit:</span>
                    <span className="font-mono">-LKR {cartTradeInCredit.toLocaleString()}</span>
                  </div>
                )}
                {cartDiscountTotal > 0 && (
                  <div className="flex justify-between text-emerald-500 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">-LKR {cartDiscountTotal.toLocaleString()}</span>
                  </div>
                )}
                {cartTaxTotal > 0 && (
                  <div className="flex justify-between text-light-muted">
                    <span>Tax:</span>
                    <span className="font-mono">LKR {cartTaxTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1 border-t border-light-border dark:border-dark-border">
                  <span className="font-black text-sm text-slate-900 dark:text-white">NET BALANCE PAYABLE:</span>
                  <span className="font-mono font-black text-xl text-brand-500">
                    LKR {cartTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Giant PAY NOW Button */}
              <button
                disabled={cart.length === 0}
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-brand-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                <span>PAY NOW (F9)</span>
              </button>

              {/* Bottom Actions: Hold Sale, Clear Cart */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => holdCurrentSale()}
                  disabled={cart.length === 0}
                  className="text-light-muted hover:text-amber-500 font-semibold flex items-center gap-1 disabled:opacity-40"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Hold Sale (F8)</span>
                </button>

                <button
                  type="button"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="text-light-muted hover:text-red-500 font-semibold flex items-center gap-1 disabled:opacity-40"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset (F2)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POS Sub-Modals */}
      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelect={(cust) => setSelectedCustomer(cust)}
      />

      <HeldSalesModal
        isOpen={isHeldModalOpen}
        onClose={() => setIsHeldModalOpen(false)}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          setIsReceiptModalOpen(true);
        }}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onNewSale={() => {
          clearCart();
          setIsReceiptModalOpen(false);
        }}
      />

      <TradeInInspectionModal
        isOpen={isTradeInModalOpen}
        onClose={() => setIsTradeInModalOpen(false)}
        selectedCustomer={selectedCustomer}
        onApplyTradeIn={(record) => {
          setTradeIn(record);
          setIsTradeInModalOpen(false);
        }}
        existingTradeIn={currentTradeIn}
      />
    </div>
  );
};
