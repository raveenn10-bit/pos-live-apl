'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  DeviceItem, 
  CartItem, 
  Customer, 
  Sale, 
  SaleItem, 
  HeldSale, 
  RepairTicket, 
  RepairStatus, 
  Expense, 
  Supplier, 
  PurchaseOrder, 
  StoreSettings, 
  CashDrawerSession, 
  AuditLog, 
  PaymentMethod, 
  PaymentDetails,
  TradeInRecord 
} from '../types';
import { 
  initialProducts, 
  initialCustomers, 
  initialSales, 
  initialRepairTickets, 
  initialExpenses, 
  initialCashDrawer, 
  initialSuppliers, 
  initialPurchaseOrders, 
  initialAuditLogs, 
  initialStoreSettings 
} from '../data/initialData';
import { useAuth } from './AuthContext';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface StoreContextType {
  // Store Settings
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;

  // System & Connection State
  isOnline: boolean;
  toggleOnline: () => void;

  // Inventory / Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, adjustment: number, reason: string) => void;
  addImeisToProduct: (productId: string, imeis: DeviceItem[]) => void;
  getDeviceByImeiOrSerial: (search: string) => { device: DeviceItem; product: Product } | null;

  // POS & Cart
  cart: CartItem[];
  currentTradeIn: TradeInRecord | null;
  setTradeIn: (tradeIn: TradeInRecord | null) => void;
  removeTradeIn: () => void;
  cartTradeInCredit: number;
  addToCart: (product: Product, selectedImei?: DeviceItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, qty: number) => void;
  updateCartDiscount: (cartItemId: string, amount: number, type: 'amount' | 'percent') => void;
  updateCartWarranty: (cartItemId: string, option: CartItem['warrantyOption'], price: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDiscountTotal: number;
  cartTaxTotal: number;
  cartTotal: number;

  // Customer in POS
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;

  // Held Sales
  heldSales: HeldSale[];
  holdCurrentSale: (note?: string) => boolean;
  restoreHeldSale: (heldSaleId: string) => void;
  discardHeldSale: (heldSaleId: string) => void;

  // Checkout & Sales
  completeSale: (paymentMethod: PaymentMethod, paymentDetails: PaymentDetails) => Sale | null;
  sales: Sale[];
  lastCompletedSale: Sale | null;
  setLastCompletedSale: (sale: Sale | null) => void;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'creditBalance' | 'totalSpent' | 'ordersCount' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  settleCustomerCredit: (customerId: string, amount: number, paymentMethod: string, notes?: string) => void;

  // Repairs
  repairs: RepairTicket[];
  addRepairTicket: (ticket: Omit<RepairTicket, 'id' | 'ticketNumber' | 'createdAt'>) => RepairTicket;
  updateRepairTicket: (id: string, updates: Partial<RepairTicket>) => void;
  updateRepairStatus: (id: string, newStatus: RepairStatus) => void;

  // Expenses & Cash Drawer
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  cashDrawer: CashDrawerSession;
  closeCashDrawer: (actualCount: number, notes?: string) => void;
  reopenCashDrawer: (openingFloat: number) => void;

  // Suppliers & Purchases
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'balanceDue' | 'totalSupplied'>) => void;
  purchases: PurchaseOrder[];
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id'>) => void;

  // Audit Logs
  auditLogs: AuditLog[];
  logAction: (action: string, category: AuditLog['category'], details: string) => void;

  // Global Device Passport modal
  activePassportDevice: { device: DeviceItem; product: Product } | null;
  openDevicePassport: (device: DeviceItem, product: Product) => void;
  closeDevicePassport: () => void;

  // Notifications
  notifications: ToastNotification[];
  showNotification: (type: ToastNotification['type'], message: string) => void;
  dismissNotification: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function getInitialStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Settings
  const [settings, setSettings] = useState<StoreSettings>(() => 
    getInitialStorage('applevision_settings', initialStoreSettings)
  );

  // Online / Offline Status
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Products
  const [products, setProducts] = useState<Product[]>(() => 
    getInitialStorage('applevision_products', initialProducts)
  );

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentTradeIn, setCurrentTradeIn] = useState<TradeInRecord | null>(() => 
    getInitialStorage('applevision_current_tradein', null)
  );

  // Held Sales
  const [heldSales, setHeldSales] = useState<HeldSale[]>(() => 
    getInitialStorage('applevision_held_sales', [])
  );

  // Sales
  const [sales, setSales] = useState<Sale[]>(() => 
    getInitialStorage('applevision_sales', initialSales)
  );
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);

  // Customers
  const [customers, setCustomers] = useState<Customer[]>(() => 
    getInitialStorage('applevision_customers', initialCustomers)
  );

  // Repairs
  const [repairs, setRepairs] = useState<RepairTicket[]>(() => 
    getInitialStorage('applevision_repairs', initialRepairTickets)
  );

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>(() => 
    getInitialStorage('applevision_expenses', initialExpenses)
  );

  // Cash Drawer
  const [cashDrawer, setCashDrawer] = useState<CashDrawerSession>(() => 
    getInitialStorage('applevision_cash_drawer', initialCashDrawer)
  );

  // Suppliers & Purchases
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => 
    getInitialStorage('applevision_suppliers', initialSuppliers)
  );

  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() => 
    getInitialStorage('applevision_purchases', initialPurchaseOrders)
  );

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => 
    getInitialStorage('applevision_audit_logs', initialAuditLogs)
  );

  // Active Device Passport
  const [activePassportDevice, setActivePassportDevice] = useState<{ device: DeviceItem; product: Product } | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  // Sync to localStorage
  useEffect(() => { localStorage.setItem('applevision_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('applevision_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('applevision_held_sales', JSON.stringify(heldSales)); }, [heldSales]);
  useEffect(() => { localStorage.setItem('applevision_sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('applevision_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('applevision_repairs', JSON.stringify(repairs)); }, [repairs]);
  useEffect(() => { localStorage.setItem('applevision_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('applevision_cash_drawer', JSON.stringify(cashDrawer)); }, [cashDrawer]);
  useEffect(() => { localStorage.setItem('applevision_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('applevision_purchases', JSON.stringify(purchases)); }, [purchases]);
  useEffect(() => { localStorage.setItem('applevision_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('applevision_current_tradein', JSON.stringify(currentTradeIn)); }, [currentTradeIn]);

  const showNotification = (type: ToastNotification['type'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      dismissNotification(id);
    }, 4500);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const logAction = (action: string, category: AuditLog['category'], details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'System',
      action,
      category,
      details,
      ipOrTerminal: 'Terminal 01 - POS Counter'
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 199)]);
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    logAction('UPDATE_SETTINGS', 'SYSTEM', 'Store settings updated');
    showNotification('success', 'Store settings updated successfully');
  };

  const toggleOnline = () => {
    setIsOnline(prev => {
      const next = !prev;
      showNotification(next ? 'info' : 'warning', next ? 'Online: AI features active' : 'Offline: Core POS running locally');
      return next;
    });
  };

  // Product management
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...prodData,
      id: `prod-${Date.now()}`
    };
    setProducts(prev => [newProduct, ...prev]);
    logAction('ADD_PRODUCT', 'INVENTORY', `Added product: ${newProduct.name} (${newProduct.sku})`);
    showNotification('success', `Product "${newProduct.name}" added to catalog`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    logAction('UPDATE_PRODUCT', 'INVENTORY', `Updated product: ${id}`);
    showNotification('success', 'Product details updated');
  };

  const deleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    logAction('DELETE_PRODUCT', 'INVENTORY', `Deleted product: ${prod?.name || id}`);
    showNotification('info', 'Product removed from catalog');
  };

  const adjustStock = (productId: string, adjustment: number, reason: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const nextStock = Math.max(0, p.currentStock + adjustment);
        return { ...p, currentStock: nextStock };
      }
      return p;
    }));
    logAction('STOCK_ADJUSTMENT', 'INVENTORY', `Adjusted stock by ${adjustment > 0 ? '+' : ''}${adjustment}. Reason: ${reason}`);
    showNotification('info', `Stock adjusted (${adjustment > 0 ? '+' : ''}${adjustment})`);
  };

  const addImeisToProduct = (productId: string, newImeis: DeviceItem[]) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const updatedImeis = [...p.imeis, ...newImeis];
        return {
          ...p,
          imeis: updatedImeis,
          currentStock: p.currentStock + newImeis.length
        };
      }
      return p;
    }));
    logAction('ADD_STOCK_IMEI', 'INVENTORY', `Added ${newImeis.length} serialized devices to product ${productId}`);
    showNotification('success', `Added ${newImeis.length} serialized units to stock`);
  };

  const getDeviceByImeiOrSerial = (search: string): { device: DeviceItem; product: Product } | null => {
    const query = search.trim().toLowerCase();
    if (!query) return null;

    for (const prod of products) {
      for (const dev of prod.imeis) {
        if (
          dev.imei1.toLowerCase() === query ||
          (dev.imei2 && dev.imei2.toLowerCase() === query) ||
          (dev.serialNumber && dev.serialNumber.toLowerCase() === query)
        ) {
          return { device: dev, product: prod };
        }
      }
    }
    return null;
  };

  // Cart operations
  const addToCart = (product: Product, selectedImei?: DeviceItem) => {
    // If serialized and no IMEI provided, pick the first 'In Stock' one
    let targetImei = selectedImei;
    if (product.isSerialized && !targetImei) {
      targetImei = product.imeis.find(d => d.status === 'In Stock');
      if (!targetImei) {
        showNotification('error', `No units in stock for ${product.name}`);
        return;
      }
    }

    // Check if serialized item is already in cart
    if (targetImei) {
      const exists = cart.some(item => item.selectedImei?.id === targetImei?.id);
      if (exists) {
        showNotification('warning', `Device with IMEI ${targetImei.imei1} is already in the cart`);
        return;
      }
    }

    // Check if non-serialized item exists in cart
    if (!product.isSerialized) {
      const existingIndex = cart.findIndex(item => item.product.id === product.id);
      if (existingIndex >= 0) {
        setCart(prev => prev.map((item, idx) => {
          if (idx === existingIndex) {
            const newQty = item.quantity + 1;
            const lineTotal = calculateLineTotal(newQty, item.unitPrice, item.discountAmount, item.discountType, item.warrantyPrice);
            return { ...item, quantity: newQty, lineTotal };
          }
          return item;
        }));
        showNotification('info', `Added another ${product.name} to cart`);
        return;
      }
    }

    // Add new cart item
    const cartItemId = `ci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const lineTotal = calculateLineTotal(1, product.sellingPrice, 0, 'amount', 0);
    const newCartItem: CartItem = {
      cartItemId,
      product,
      selectedImei: targetImei,
      quantity: 1,
      unitPrice: product.sellingPrice,
      discount: 0,
      discountAmount: 0,
      discountType: 'amount',
      warrantyOption: product.isSerialized ? '3 Months Phone to Phone' : 'None',
      warrantyPrice: 0,
      total: lineTotal,
      lineTotal,
    };

    setCart(prev => [newCartItem, ...prev]);
    showNotification('success', `Added to cart: ${product.name}`);
  };

  const calculateLineTotal = (
    qty: number, 
    unitPrice: number, 
    discount: number, 
    discountType: 'amount' | 'percent' | 'fixed', 
    warrantyPrice: number
  ) => {
    const rawSubtotal = (unitPrice + warrantyPrice) * qty;
    let disc = 0;
    if (discountType === 'percent') {
      disc = (rawSubtotal * Math.min(100, Math.max(0, discount))) / 100;
    } else {
      disc = discount;
    }
    return Math.max(0, rawSubtotal - disc);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        // Serialized cannot exceed 1 per line
        const finalQty = item.product.isSerialized ? 1 : qty;
        const lineTotal = calculateLineTotal(finalQty, item.unitPrice, item.discountAmount, item.discountType, item.warrantyPrice);
        return { ...item, quantity: finalQty, lineTotal };
      }
      return item;
    }));
  };

  const updateCartDiscount = (cartItemId: string, amount: number, type: 'amount' | 'percent') => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const lineTotal = calculateLineTotal(item.quantity, item.unitPrice, amount, type, item.warrantyPrice);
        return { ...item, discountAmount: amount, discountType: type, lineTotal };
      }
      return item;
    }));
  };

  const updateCartWarranty = (cartItemId: string, option: CartItem['warrantyOption'], price: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const lineTotal = calculateLineTotal(item.quantity, item.unitPrice, item.discountAmount, item.discountType, price);
        return { ...item, warrantyOption: option, warrantyPrice: price, lineTotal };
      }
      return item;
    }));
  };

  const removeTradeIn = () => {
    setCurrentTradeIn(null);
    showNotification('info', 'Trade-in device removed from cart');
  };

  const setTradeIn = (record: TradeInRecord | null) => {
    setCurrentTradeIn(record);
    if (record) {
      showNotification('success', `Trade-In Added: ${record.inspection.model} (Credit: LKR ${record.finalApprovedValue.toLocaleString()})`);
    }
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setCurrentTradeIn(null);
  };

  // Cart calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.unitPrice + item.warrantyPrice) * item.quantity, 0);
  const cartDiscountTotal = cart.reduce((acc, item) => {
    const raw = (item.unitPrice + item.warrantyPrice) * item.quantity;
    const itemDisc = item.discountType === 'percent' 
      ? (raw * item.discountAmount) / 100 
      : item.discountAmount;
    return acc + itemDisc;
  }, 0);
  const cartTradeInCredit = currentTradeIn ? currentTradeIn.finalApprovedValue : 0;
  const taxableBase = Math.max(0, cartSubtotal - cartDiscountTotal - cartTradeInCredit);
  const cartTaxTotal = settings.taxRatePercent > 0 
    ? Math.round((taxableBase * settings.taxRatePercent) / 100) 
    : 0;
  const cartTotal = Math.max(0, cartSubtotal - cartDiscountTotal - cartTradeInCredit + cartTaxTotal);

  // Hold Sale
  const holdCurrentSale = (note?: string): boolean => {
    if (cart.length === 0 && !currentTradeIn) {
      showNotification('warning', 'Cart is empty. Nothing to hold.');
      return false;
    }

    const newHeldSale: HeldSale = {
      id: `held-${Date.now()}`,
      timestamp: new Date().toISOString(),
      heldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
      customerPhone: selectedCustomer?.phone,
      items: [...cart],
      tradeInRecord: currentTradeIn || undefined,
      tradeInCredit: cartTradeInCredit,
      note: note || 'Parked sale',
      subtotal: cartSubtotal,
      total: cartTotal,
    };

    setHeldSales(prev => [newHeldSale, ...prev]);
    clearCart();
    logAction('HOLD_SALE', 'SALE', `Held sale for ${newHeldSale.customerName} (${newHeldSale.items.length} items${newHeldSale.tradeInRecord ? ' + Trade-In' : ''})`);
    showNotification('info', 'Sale parked on hold');
    return true;
  };

  const restoreHeldSale = (heldSaleId: string) => {
    const found = heldSales.find(h => h.id === heldSaleId);
    if (!found) return;

    setCart(found.items);
    if (found.tradeInRecord) {
      setCurrentTradeIn(found.tradeInRecord);
    } else {
      setCurrentTradeIn(null);
    }
    if (found.customerPhone) {
      const cust = customers.find(c => c.phone === found.customerPhone);
      if (cust) setSelectedCustomer(cust);
    }
    setHeldSales(prev => prev.filter(h => h.id !== heldSaleId));
    showNotification('success', 'Parked sale restored to cart');
  };

  const discardHeldSale = (heldSaleId: string) => {
    setHeldSales(prev => prev.filter(h => h.id !== heldSaleId));
    showNotification('info', 'Held sale discarded');
  };

  // Complete Sale
  const completeSale = (paymentMethod: PaymentMethod, paymentDetails: PaymentDetails): Sale | null => {
    if (cart.length === 0) {
      showNotification('error', 'Cannot checkout an empty cart');
      return null;
    }

    const now = new Date();
    const dateStr = now.toISOString().substring(0, 10);
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const invoiceNumber = `INV-${dateStr.replace(/-/g, '')}-${(sales.length + 1).toString().padStart(3, '0')}`;

    // Calculate total cost to determine profit
    let totalCost = 0;
    const saleItems: SaleItem[] = cart.map(item => {
      const itemCost = item.product.costPrice * item.quantity;
      totalCost += itemCost;
      return {
        productId: item.product.id,
        productName: item.product.name,
        imei: item.selectedImei?.imei1,
        serial: item.selectedImei?.serialNumber,
        condition: item.selectedImei?.condition || item.product.condition,
        storage: item.product.storage,
        color: item.product.color,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discountAmount,
        warranty: item.warrantyOption,
        lineTotal: item.lineTotal,
      };
    });

    const profitTotal = Math.max(0, cartTotal - totalCost);

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNumber,
      date: dateStr,
      time: timeStr,
      timestamp: now.getTime(),
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
      customerPhone: selectedCustomer?.phone,
      items: saleItems,
      subtotal: cartSubtotal,
      discountTotal: cartDiscountTotal,
      tradeInCredit: cartTradeInCredit,
      tradeInId: currentTradeIn?.id,
      tradeInRecord: currentTradeIn || undefined,
      taxTotal: cartTaxTotal,
      totalAmount: cartTotal,
      netBalancePayable: cartTotal,
      profitTotal,
      paymentMethod,
      paymentDetails,
      cashierId: currentUser?.id || 'usr-1',
      cashierName: currentUser?.name || 'Surinda Nethmina',
      status: 'Completed',
    };

    // Update Products & IMEIs status
    setProducts(prev => prev.map(p => {
      const itemsInCartForThisProd = cart.filter(ci => ci.product.id === p.id);
      if (itemsInCartForThisProd.length === 0) return p;

      const qtySold = itemsInCartForThisProd.reduce((acc, i) => acc + i.quantity, 0);
      const soldImeiIds = itemsInCartForThisProd
        .filter(i => !!i.selectedImei)
        .map(i => i.selectedImei!.id);

      const updatedImeis = p.imeis.map(dev => {
        if (soldImeiIds.includes(dev.id)) {
          return {
            ...dev,
            status: 'Sold' as const,
            soldDate: dateStr,
            customerName: newSale.customerName,
            customerPhone: newSale.customerPhone,
            invoiceNumber,
          };
        }
        return dev;
      });

      return {
        ...p,
        currentStock: Math.max(0, p.currentStock - qtySold),
        imeis: updatedImeis,
      };
    }));

    // Update Customer stats or credit
    if (selectedCustomer) {
      setCustomers(prev => prev.map(c => {
        if (c.id === selectedCustomer.id) {
          let additionalCredit = 0;
          if (paymentMethod === 'Customer Credit') {
            additionalCredit = cartTotal;
          } else if (paymentMethod === 'Split' && paymentDetails.splitCredit) {
            additionalCredit = paymentDetails.splitCredit;
          }

          return {
            ...c,
            totalSpent: c.totalSpent + cartTotal,
            ordersCount: c.ordersCount + 1,
            creditBalance: c.creditBalance + additionalCredit,
          };
        }
        return c;
      }));
    }

    // Update Cash Drawer if cash was collected
    let cashAmountCollected = 0;
    if (paymentMethod === 'Cash') {
      cashAmountCollected = cartTotal;
    } else if (paymentMethod === 'Split' && paymentDetails.splitCash) {
      cashAmountCollected = paymentDetails.splitCash;
    }

    if (cashAmountCollected > 0) {
      setCashDrawer(prev => ({
        ...prev,
        cashSales: prev.cashSales + cashAmountCollected,
        expectedCash: prev.expectedCash + cashAmountCollected,
      }));
    }

    // If trade-in was applied, automatically add received device into Used Stock / Pre-Owned inventory
    if (currentTradeIn) {
      const preOwnedProdName = `Pre-Owned Apple ${currentTradeIn.inspection.model} ${currentTradeIn.inspection.storage}`;
      const newDevItem: DeviceItem = {
        id: `dev-tradein-${Date.now()}`,
        imei1: currentTradeIn.inspection.imei1,
        imei2: currentTradeIn.inspection.imei2,
        serialNumber: currentTradeIn.inspection.serialNumber,
        costPrice: currentTradeIn.finalApprovedValue,
        sellingPrice: Math.round(currentTradeIn.finalApprovedValue * 1.25),
        batteryHealth: currentTradeIn.inspection.batteryHealth,
        condition: currentTradeIn.inspection.physicalGrade === 'Grade A' ? 'Grade A' : 'Grade B',
        color: currentTradeIn.inspection.color,
        status: 'In Stock',
        supplierName: `Trade-In: ${currentTradeIn.customerName}`,
        purchaseDate: dateStr,
        warrantyPeriodMonths: 3,
        warrantyExpiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        isTradeIn: true,
        tradeInId: currentTradeIn.id,
        tradeInNumber: currentTradeIn.tradeInNumber,
        tradeInAcquisitionCost: currentTradeIn.finalApprovedValue,
        refurbishmentCost: 0,
        trueCost: currentTradeIn.finalApprovedValue,
      };

      setProducts(prev => {
        const existingIdx = prev.findIndex(p => p.name.toLowerCase() === preOwnedProdName.toLowerCase());
        if (existingIdx >= 0) {
          return prev.map((p, idx) => {
            if (idx === existingIdx) {
              return {
                ...p,
                currentStock: p.currentStock + 1,
                imeis: [newDevItem, ...p.imeis],
              };
            }
            return p;
          });
        } else {
          const newProduct: Product = {
            id: `prod-tradein-${Date.now()}`,
            name: preOwnedProdName,
            sku: `PO-${currentTradeIn.inspection.model.replace(/\s+/g, '').toUpperCase()}-${currentTradeIn.inspection.storage}`,
            category: 'iPhones',
            brand: 'Apple',
            model: currentTradeIn.inspection.model,
            storage: currentTradeIn.inspection.storage,
            color: currentTradeIn.inspection.color,
            costPrice: currentTradeIn.finalApprovedValue,
            sellingPrice: Math.round(currentTradeIn.finalApprovedValue * 1.25),
            currentStock: 1,
            minStock: 1,
            condition: 'Grade A',
            isSerialized: true,
            imeis: [newDevItem],
          };
          return [newProduct, ...prev];
        }
      });

      logAction(
        'TRADE_IN_STOCK_INTAKE',
        'INVENTORY',
        `Device ${currentTradeIn.inspection.model} (${currentTradeIn.inspection.imei1}) added to Pre-Owned stock at cost LKR ${currentTradeIn.finalApprovedValue.toLocaleString()}`
      );
    }

    // Call electron IPC backend transaction if running inside Electron desktop container
    const electronApi = (window as any).electronAPI;
    if (electronApi?.sales?.createSale) {
      try {
        const payload = {
          invoice_number: invoiceNumber,
          customer_id: selectedCustomer?.id,
          customer_name: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
          customer_phone: selectedCustomer?.phone,
          subtotal: cartSubtotal,
          discount_amount: cartDiscountTotal,
          tax_amount: cartTaxTotal,
          trade_in_credit: cartTradeInCredit,
          net_balance_payable: cartTotal,
          total_amount: cartTotal,
          payment_method: paymentMethod,
          payment_details: paymentDetails,
          cashier_id: currentUser?.id || 'usr-1',
          cashier_name: currentUser?.name || 'Surinda Nethmina',
          items: cart.map(item => ({
            product_id: item.product.id,
            device_item_id: item.selectedImei?.id,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            cost_price: item.product.costPrice,
            discount_amount: item.discountAmount,
            line_total: item.lineTotal,
            imei: item.selectedImei?.imei1,
            serial_number: item.selectedImei?.serialNumber,
            product_name: item.product.name,
            warranty_months: 3
          })),
          trade_in: currentTradeIn ? {
            customer_name: currentTradeIn.customerName,
            customer_phone: currentTradeIn.customerPhone,
            brand: currentTradeIn.inspection.brand,
            model: currentTradeIn.inspection.model,
            storage: currentTradeIn.inspection.storage,
            color: currentTradeIn.inspection.color,
            imei1: currentTradeIn.inspection.imei1,
            imei2: currentTradeIn.inspection.imei2,
            serial_number: currentTradeIn.inspection.serialNumber,
            battery_health: currentTradeIn.inspection.batteryHealth,
            physical_grade: currentTradeIn.inspection.physicalGrade,
            screen_condition: currentTradeIn.inspection.screenCondition,
            back_glass_condition: currentTradeIn.inspection.backGlassCondition,
            face_id_status: currentTradeIn.inspection.faceIdStatus,
            true_tone_status: currentTradeIn.inspection.trueToneStatus,
            camera_condition: currentTradeIn.inspection.cameraCondition,
            parts_replaced: currentTradeIn.inspection.partsReplaced,
            water_damage: currentTradeIn.inspection.waterDamage,
            accessories: currentTradeIn.inspection.accessories,
            staff_notes: currentTradeIn.inspection.staffNotes,
            base_guide_price: currentTradeIn.baseGuidePrice,
            suggested_value: currentTradeIn.suggestedValue,
            deductions: currentTradeIn.deductions,
            final_approved_value: currentTradeIn.finalApprovedValue,
            override_reason: currentTradeIn.overrideReason,
            override_authorized_by: currentTradeIn.overrideAuthorizedBy,
            override_authorized_by_name: currentTradeIn.overrideAuthorizedByName,
            acquisition_cost: currentTradeIn.finalApprovedValue,
          } : undefined
        };
        electronApi.sales.createSale(payload);
      } catch (err) {
        console.warn('Electron createSale invocation warning:', err);
      }
    }

    // Add to Sales list
    setSales(prev => [newSale, ...prev]);
    setLastCompletedSale(newSale);

    // Audit log
    logAction(
      'SALE_COMPLETED', 
      'SALE', 
      `Sale ${invoiceNumber} completed for LKR ${cartTotal.toLocaleString()} via ${paymentMethod} (${saleItems.length} items${currentTradeIn ? ' with Trade-In' : ''})`
    );

    // Reset cart
    clearCart();

    return newSale;
  };

  // Customers
  const addCustomer = (custData: Omit<Customer, 'id' | 'creditBalance' | 'totalSpent' | 'ordersCount' | 'createdAt'>): Customer => {
    const newCustomer: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      creditBalance: 0,
      creditLimit: custData.creditLimit || 50000,
      totalSpent: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setCustomers(prev => [newCustomer, ...prev]);
    logAction('ADD_CUSTOMER', 'CUSTOMER', `Added customer: ${newCustomer.name} (${newCustomer.phone})`);
    showNotification('success', `Customer ${newCustomer.name} registered`);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    logAction('UPDATE_CUSTOMER', 'CUSTOMER', `Updated customer profile ${id}`);
    showNotification('success', 'Customer profile updated');
  };

  const settleCustomerCredit = (customerId: string, amount: number, paymentMethod: string, notes?: string) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;

    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          creditBalance: Math.max(0, c.creditBalance - amount)
        };
      }
      return c;
    }));

    if (paymentMethod === 'Cash') {
      setCashDrawer(prev => ({
        ...prev,
        cashSales: prev.cashSales + amount,
        expectedCash: prev.expectedCash + amount
      }));
    }

    logAction('CREDIT_SETTLEMENT', 'CUSTOMER', `Settled LKR ${amount.toLocaleString()} credit for ${cust.name} via ${paymentMethod}. Note: ${notes || 'none'}`);
    showNotification('success', `Payment of LKR ${amount.toLocaleString()} recorded for ${cust.name}`);
  };

  // Repairs
  const addRepairTicket = (ticketData: Omit<RepairTicket, 'id' | 'ticketNumber' | 'createdAt'>): RepairTicket => {
    const ticketNumber = `REP-2026-${(repairs.length + 45).toString().padStart(4, '0')}`;
    const newTicket: RepairTicket = {
      ...ticketData,
      id: `rep-${Date.now()}`,
      ticketNumber,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setRepairs(prev => [newTicket, ...prev]);
    if (newTicket.advancePaid > 0) {
      setCashDrawer(prev => ({
        ...prev,
        cashSales: prev.cashSales + newTicket.advancePaid,
        expectedCash: prev.expectedCash + newTicket.advancePaid,
      }));
    }

    logAction('CREATE_REPAIR_TICKET', 'REPAIR', `Created repair ticket ${ticketNumber} for ${newTicket.deviceModel} (${newTicket.customerName})`);
    showNotification('success', `Repair ticket ${ticketNumber} opened`);
    return newTicket;
  };

  const updateRepairTicket = (id: string, updates: Partial<RepairTicket>) => {
    setRepairs(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    logAction('UPDATE_REPAIR', 'REPAIR', `Updated repair ticket ${id}`);
    showNotification('success', 'Repair ticket updated');
  };

  const updateRepairStatus = (id: string, newStatus: RepairStatus) => {
    setRepairs(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: newStatus,
          completedAt: newStatus === 'Delivered' ? new Date().toISOString().replace('T', ' ').substring(0, 16) : r.completedAt
        };
      }
      return r;
    }));
    logAction('REPAIR_STATUS_CHANGE', 'REPAIR', `Repair ${id} changed to status: ${newStatus}`);
    showNotification('info', `Ticket status updated to "${newStatus}"`);
  };

  // Expenses & Drawer
  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`
    };
    setExpenses(prev => [newExpense, ...prev]);

    if (expenseData.paymentMethod === 'Cash') {
      setCashDrawer(prev => ({
        ...prev,
        cashExpenses: prev.cashExpenses + expenseData.amount,
        expectedCash: prev.expectedCash - expenseData.amount,
      }));
    }

    logAction('ADD_EXPENSE', 'EXPENSE', `Expense LKR ${expenseData.amount.toLocaleString()} - ${expenseData.category}: ${expenseData.description}`);
    showNotification('success', `Recorded expense of LKR ${expenseData.amount.toLocaleString()}`);
  };

  const closeCashDrawer = (actualCount: number, notes?: string) => {
    const discrepancy = actualCount - cashDrawer.expectedCash;
    const closed: CashDrawerSession = {
      ...cashDrawer,
      actualCash: actualCount,
      discrepancy,
      status: 'Closed',
      closedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      closedBy: currentUser?.name || 'Surinda Nethmina',
      notes,
    };
    setCashDrawer(closed);
    logAction('CLOSE_DRAWER', 'EXPENSE', `Day register closed. Expected: ${closed.expectedCash}, Actual: ${actualCount}, Discrepancy: ${discrepancy}`);
    showNotification(discrepancy === 0 ? 'success' : 'warning', `Cash drawer closed. Discrepancy: LKR ${discrepancy.toLocaleString()}`);
  };

  const reopenCashDrawer = (openingFloat: number) => {
    const newSession: CashDrawerSession = {
      id: `drawer-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      openingCash: openingFloat,
      cashSales: 0,
      cashExpenses: 0,
      expectedCash: openingFloat,
      status: 'Open',
      openedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: `Reopened with float LKR ${openingFloat.toLocaleString()}`
    };
    setCashDrawer(newSession);
    logAction('OPEN_DRAWER', 'EXPENSE', `New cash register opened with float LKR ${openingFloat.toLocaleString()}`);
    showNotification('success', 'New cash drawer session started');
  };

  // Suppliers & Purchases
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'balanceDue' | 'totalSupplied'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}`,
      balanceDue: 0,
      totalSupplied: 0,
    };
    setSuppliers(prev => [...prev, newSupplier]);
    logAction('ADD_SUPPLIER', 'SYSTEM', `Added supplier ${newSupplier.name}`);
    showNotification('success', `Supplier ${newSupplier.name} added`);
  };

  const addPurchaseOrder = (poData: Omit<PurchaseOrder, 'id'>) => {
    const newPO: PurchaseOrder = {
      ...poData,
      id: `po-${Date.now()}`
    };
    setPurchases(prev => [newPO, ...prev]);

    // Update supplier total
    setSuppliers(prev => prev.map(s => {
      if (s.id === poData.supplierId) {
        return {
          ...s,
          totalSupplied: s.totalSupplied + poData.totalAmount,
          balanceDue: poData.paymentStatus !== 'Paid' ? s.balanceDue + poData.totalAmount : s.balanceDue
        };
      }
      return s;
    }));

    logAction('ADD_PURCHASE', 'INVENTORY', `Intake purchase order ${poData.invoiceNumber} (${poData.itemsCount} items) LKR ${poData.totalAmount.toLocaleString()}`);
    showNotification('success', `Purchase order ${poData.invoiceNumber} recorded`);
  };

  // Device Passport Modal
  const openDevicePassport = (device: DeviceItem, product: Product) => {
    setActivePassportDevice({ device, product });
  };

  const closeDevicePassport = () => {
    setActivePassportDevice(null);
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        updateSettings,
        isOnline,
        toggleOnline,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addImeisToProduct,
        getDeviceByImeiOrSerial,
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
        restoreHeldSale,
        discardHeldSale,
        completeSale,
        sales,
        lastCompletedSale,
        setLastCompletedSale,
        customers,
        addCustomer,
        updateCustomer,
        settleCustomerCredit,
        repairs,
        addRepairTicket,
        updateRepairTicket,
        updateRepairStatus,
        expenses,
        addExpense,
        cashDrawer,
        closeCashDrawer,
        reopenCashDrawer,
        suppliers,
        addSupplier,
        purchases,
        addPurchaseOrder,
        auditLogs,
        logAction,
        activePassportDevice,
        openDevicePassport,
        closeDevicePassport,
        notifications,
        showNotification,
        dismissNotification,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
