import { Product, Customer, Sale, RepairTicket, Expense, Supplier, PurchaseOrder, User, StoreSettings, CashDrawerSession, AuditLog, DeviceItem } from '../types';

export const initialCategories: string[] = [
  'iPhone',
  'iPad',
  'Apple Watch',
  'Mac',
  'AirPods',
  'Accessories',
  'Protection'
];

export const initialStoreSettings: StoreSettings = {
  storeName: "Apple Vision",
  fullName: "AppleVision Store Galle",
  tagline: "Reliable Best Service",
  owner: "Nethmina Abayarathne",
  category: "Mobile Phone Shop & Apple Devices",
  phone: "+94 77 923 0519",
  whatsapp: "+94 77 923 0519",
  email: "nethminasurinda@gmail.com",
  address: "Kalegana Junction",
  city: "Galle",
  country: "Sri Lanka",
  postalCode: "80000",
  currency: "Rs.",
  currencySymbol: "LKR",
  receiptHeader: "Thank you for shopping at AppleVision Store Galle!\nGalle's Most Trusted Destination for Genuine Apple Devices & Expert Care.",
  receiptFooter: "WARRANTY POLICY:\n★ 3 Months Phone to Phone Replacement Warranty (දුරකථනයට දුරකථනයක් මාරු කිරීමේ වගකීමක් සහිතයි)\n• 1-Year Hardware / Software Care as stated per invoice.\n• Physical & water damage void warranty. Check device before leaving counter.",
  printerWidth: "80mm",
  autoPrint: false,
  geminiApiKey: "",
  geminiModel: "gemini-1.5-flash",
  aiConfidenceThreshold: 85,
  taxRatePercent: 0,
  lowStockThreshold: 3,
};

export const initialUsers: User[] = [
  {
    id: "usr-1",
    username: "surinda",
    name: "Surinda Nethmina",
    role: "admin",
    email: "nethminasurinda@gmail.com",
    phone: "+94 77 923 0519",
    isActive: true,
    isFirstLogin: true, // triggers mandatory change password prompt
    pinCode: "1234",
    lastLogin: "",
  }
];

export const initialProducts: Product[] = [];
export const initialSales: Sale[] = [];
export const initialCustomers: Customer[] = [];
export const initialSuppliers: Supplier[] = [];
export const initialExpenses: Expense[] = [];
export const initialRepairTickets: RepairTicket[] = [];
export const initialPurchaseOrders: PurchaseOrder[] = [];
export const initialDeviceItems: DeviceItem[] = [];

export const initialCashDrawer: CashDrawerSession = {
  id: "drawer-clean",
  date: new Date().toISOString().substring(0, 10),
  openingCash: 0,
  cashSales: 0,
  cashExpenses: 0,
  expectedCash: 0,
  status: "Closed",
  openedAt: "",
  closedBy: undefined,
  notes: "Production database initialized. Open drawer to start register."
};

export const initialAuditLogs: AuditLog[] = [
  {
    id: "log-init-1",
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    userId: "usr-1",
    userName: "Surinda Nethmina",
    action: "SYSTEM_INITIALIZED",
    category: "SYSTEM",
    details: "Production database initialized for AppleVision Store Galle",
    ipOrTerminal: "Terminal 01 - Main POS"
  }
];
