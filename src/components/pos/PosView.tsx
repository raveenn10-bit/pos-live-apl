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
  DollarSign, 
  ChevronDown,
  Layers,
  Sparkles,
  Repeat,
  SlidersHorizontal
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
  
  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isTradeInModalOpen, setIsTradeInModalOpen] = useState(false);

  // Serial selector state for products with multiple IMEIs
  const [selectedImeiForProduct, setSelectedImeiForProduct] = useState<Record<string, string>>({});

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts listener for F2-F9
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if an input is focused and typing text, unless it's an F-key
      if (e.key === 'F2') {
        e.preventDefault();
        clearCart();
        showNotification('info', 'New sale started (Cart cleared)');
      } else if (e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
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

  // Categories list
  const categories: ProductCategory[] = [
    'All',
    'iPhones',
    'iPads',
    'MacBooks',
    'Apple Watch',
    'AirPods',
    'Cables & Power',
    'Cases & Protection',
    'Accessories',
  ];

  // Conditions list
  const conditions: ('All' | DeviceCondition)[] = [
    'All',
    'Brand New Sealed',
    'Mint Like New',
    'Grade A',
    'Grade B',
  ];

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesCondition = selectedCondition === 'All' || prod.condition === selectedCondition;
    
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory && matchesCondition;

    const matchesName = prod.name.toLowerCase().includes(query);
    const matchesSku = prod.sku.toLowerCase().includes(query);
    const matchesBarcode = prod.barcode && prod.barcode.includes(query);
    const matchesImei = prod.imeis.some(d => d.imei1.includes(query) || (d.imei2 && d.imei2.includes(query)) || (d.serialNumber && d.serialNumber.toLowerCase().includes(query)));

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

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col select-none">
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
        {/* COLUMN 1: Categories (2.5 cols) */}
        <div className="col-span-12 md:col-span-3 lg:col-span-2 bg-white/70 dark:bg-dark-card/70 backdrop-blur rounded-2xl border border-light-border dark:border-dark-border p-3 flex flex-col justify-between overflow-hidden">
          <div className="space-y-1 overflow-y-auto">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
              Categories
            </div>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = cat === 'All' 
                ? products.length 
                : products.filter(p => p.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-light-surface dark:hover:bg-dark-surface'
                  }`}
                >
                  <span className="truncate">{cat}</span>
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
        <div className="col-span-12 md:col-span-5 lg:col-span-6 bg-white/70 dark:bg-dark-card/70 backdrop-blur rounded-2xl border border-light-border dark:border-dark-border p-3 flex flex-col overflow-hidden">
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
            {filteredProducts.length === 0 ? (
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

                        {/* Serialized IMEI dropdown if multiple available */}
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
        <div className="col-span-12 md:col-span-4 lg:col-span-4 bg-white/80 dark:bg-dark-card/90 backdrop-blur rounded-2xl border border-light-border dark:border-dark-border p-3 flex flex-col justify-between overflow-hidden shadow-lg">
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
                        IMEI: {currentTradeIn.inspection.imei1} | {currentTradeIn.inspection.batteryHealth}% Battery | {currentTradeIn.inspection.physicalGrade}
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
