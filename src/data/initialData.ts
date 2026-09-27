import { Product, Customer, Sale, RepairTicket, Expense, Supplier, PurchaseOrder, User, StoreSettings, CashDrawerSession, AuditLog, DeviceItem } from '../types';

export const initialCategories: string[] = [
  'iPhones',
  'iPads',
  'Apple Watch',
  'MacBooks',
  'AirPods',
  'Accessories',
  'Protection & Care'
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
    isFirstLogin: false,
    pinCode: "1234",
    lastLogin: new Date().toISOString().substring(0, 16),
  },
  {
    id: "usr-2",
    username: "sandun",
    name: "Sandun Gamage",
    role: "cashier",
    email: "sandun@applevision.lk",
    phone: "+94 71 884 1290",
    isActive: true,
    isFirstLogin: false,
    pinCode: "5678",
    lastLogin: "",
  },
  {
    id: "usr-3",
    username: "tech_nuwan",
    name: "Nuwan Pradeep (Technician)",
    role: "technician",
    email: "nuwan.repairs@applevision.lk",
    phone: "+94 76 341 0092",
    isActive: true,
    isFirstLogin: false,
    pinCode: "9999",
    lastLogin: "",
  }
];

export const initialProducts: Product[] = [
  {
    id: "prod-1",
    name: "Apple iPhone 16 Pro Max 256GB - Desert Titanium",
    sku: "APL-16PM-256-DES",
    brand: "Apple",
    model: "iPhone 16 Pro Max",
    category: "iPhones",
    storage: "256GB",
    color: "Desert Titanium",
    condition: "Brand New Sealed",
    costPrice: 350000,
    sellingPrice: 385000,
    currentStock: 4,
    minStock: 2,
    isSerialized: true,
    description: "Brand new sealed Apple iPhone 16 Pro Max. 1-Year Apple Care Warranty.",
    imeis: [
      {
        id: "imei-1-1",
        imei1: "354928114092812",
        imei2: "354928114092813",
        serialNumber: "F2LX9029K4",
        batteryHealth: 100,
        condition: "Brand New Sealed",
        status: "In Stock",
        costPrice: 350000,
        sellingPrice: 385000,
        purchaseDate: "2026-09-20",
        warrantyPeriodMonths: 12
      },
      {
        id: "imei-1-2",
        imei1: "354928114092820",
        imei2: "354928114092821",
        serialNumber: "F2LX9029K5",
        batteryHealth: 100,
        condition: "Brand New Sealed",
        status: "In Stock",
        costPrice: 350000,
        sellingPrice: 385000,
        purchaseDate: "2026-09-20",
        warrantyPeriodMonths: 12
      }
    ]
  },
  {
    id: "prod-2",
    name: "Apple iPhone 15 Pro 128GB - Natural Titanium",
    sku: "APL-15P-128-NAT",
    brand: "Apple",
    model: "iPhone 15 Pro",
    category: "iPhones",
    storage: "128GB",
    color: "Natural Titanium",
    condition: "Mint Like New",
    costPrice: 245000,
    sellingPrice: 280000,
    currentStock: 3,
    minStock: 2,
    isSerialized: true,
    description: "Grade A Mint condition device, flawless screen & back glass.",
    imeis: [
      {
        id: "imei-2-1",
        imei1: "358190049102834",
        imei2: "358190049102835",
        serialNumber: "G6TJ8910LM",
        batteryHealth: 98,
        condition: "Mint Like New",
        status: "In Stock",
        costPrice: 245000,
        sellingPrice: 280000,
        purchaseDate: "2026-09-15",
        warrantyPeriodMonths: 3
      }
    ]
  },
  {
    id: "prod-3",
    name: "Apple iPhone 14 Pro 128GB - Deep Purple",
    sku: "APL-14P-128-PUR",
    brand: "Apple",
    model: "iPhone 14 Pro",
    category: "iPhones",
    storage: "128GB",
    color: "Deep Purple",
    condition: "Used Grade A",
    costPrice: 195000,
    sellingPrice: 228000,
    currentStock: 2,
    minStock: 2,
    isSerialized: true,
    description: "Original screen, TrueTone & FaceID working. 3-Months Phone to Phone replacement warranty.",
    imeis: [
      {
        id: "imei-3-1",
        imei1: "351092837461928",
        imei2: "351092837461929",
        serialNumber: "DX4K9810QP",
        batteryHealth: 89,
        condition: "Used Grade A",
        status: "In Stock",
        costPrice: 195000,
        sellingPrice: 228000,
        purchaseDate: "2026-09-12",
        warrantyPeriodMonths: 3
      }
    ]
  },
  {
    id: "prod-4",
    name: "Apple Watch Ultra 2 49mm Titanium - Orange Alpine Loop",
    sku: "APL-AWU2-49-ORG",
    brand: "Apple",
    model: "Apple Watch Ultra 2",
    category: "Apple Watch",
    color: "Natural Titanium",
    condition: "Brand New Sealed",
    costPrice: 240000,
    sellingPrice: 265000,
    currentStock: 3,
    minStock: 1,
    isSerialized: true,
    description: "Rugged GPS + Cellular flagship Apple Watch with Action button.",
    imeis: [
      {
        id: "imei-4-1",
        imei1: "359018274619201",
        serialNumber: "H8JK9021ZZ",
        batteryHealth: 100,
        condition: "Brand New Sealed",
        status: "In Stock",
        costPrice: 240000,
        sellingPrice: 265000,
        purchaseDate: "2026-09-18",
        warrantyPeriodMonths: 12
      }
    ]
  },
  {
    id: "prod-5",
    name: "Apple AirPods Pro (2nd Generation) USB-C",
    sku: "APL-APP2-USBC",
    brand: "Apple",
    model: "AirPods Pro 2",
    category: "AirPods",
    color: "White",
    condition: "Brand New Sealed",
    costPrice: 62000,
    sellingPrice: 72000,
    currentStock: 8,
    minStock: 3,
    isSerialized: false,
    description: "Active Noise Cancellation with Transparency mode and USB-C MagSafe case.",
    imeis: []
  },
  {
    id: "prod-6",
    name: "Apple 20W USB-C Power Adapter (Original UK Pin)",
    sku: "APL-PWR-20W-UK",
    brand: "Apple",
    model: "20W Power Adapter",
    category: "Accessories",
    color: "White",
    condition: "Brand New Sealed",
    costPrice: 7500,
    sellingPrice: 9500,
    currentStock: 25,
    minStock: 5,
    isSerialized: false,
    description: "Genuine Apple 20W Fast Charger with 6-Months Replacement Warranty.",
    imeis: []
  }
];

export const initialCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Kasun Perera",
    phone: "0771234567",
    email: "kasun.perera@gmail.com",
    address: "Hapugala, Galle",
    city: "Galle",
    creditLimit: 50000,
    creditBalance: 0,
    totalSpent: 420000,
    ordersCount: 3,
    createdAt: "2026-08-10"
  },
  {
    id: "cust-2",
    name: "Dinuka Wickramasinghe",
    phone: "0719876543",
    email: "dinuka.wick@yahoo.com",
    address: "Wakwella Road, Galle",
    city: "Galle",
    creditLimit: 100000,
    creditBalance: 25000,
    totalSpent: 685000,
    ordersCount: 4,
    createdAt: "2026-08-25"
  },
  {
    id: "cust-3",
    name: "Dr. Nuwan Silva",
    phone: "0765544332",
    email: "dr.nuwansilva@karapitiya.hospital.lk",
    address: "Karapitiya, Galle",
    city: "Galle",
    creditLimit: 150000,
    creditBalance: 0,
    totalSpent: 910000,
    ordersCount: 5,
    createdAt: "2026-07-15"
  }
];

const todayDate = new Date().toISOString().substring(0, 10);

export const initialSales: Sale[] = [
  {
    id: "sale-demo-1",
    invoiceNumber: `INV-${todayDate.replace(/-/g, '')}-001`,
    date: todayDate,
    time: "10:15 AM",
    timestamp: Date.now() - 3600000 * 3,
    customerId: "cust-1",
    customerName: "Kasun Perera",
    customerPhone: "0771234567",
    items: [
      {
        productId: "prod-1",
        productName: "Apple iPhone 16 Pro Max 256GB - Desert Titanium",
        imei: "354928114092801",
        serial: "F2LX9029K1",
        condition: "Brand New Sealed",
        storage: "256GB",
        color: "Desert Titanium",
        quantity: 1,
        unitPrice: 385000,
        discount: 0,
        warranty: "1-Year Apple Care",
        lineTotal: 385000
      },
      {
        productId: "prod-6",
        productName: "Apple 20W USB-C Power Adapter (Original UK Pin)",
        quantity: 1,
        unitPrice: 9500,
        discount: 1000,
        warranty: "6-Months Replacement",
        lineTotal: 8500
      }
    ],
    subtotal: 394500,
    discountTotal: 1000,
    taxTotal: 0,
    totalAmount: 393500,
    netBalancePayable: 393500,
    profitTotal: 36000,
    paymentMethod: "Card",
    paymentDetails: { cardLast4: "4092" },
    cashierName: "Surinda Nethmina",
    status: "Completed"
  },
  {
    id: "sale-demo-2",
    invoiceNumber: `INV-${todayDate.replace(/-/g, '')}-002`,
    date: todayDate,
    time: "11:45 AM",
    timestamp: Date.now() - 3600000 * 2,
    customerId: "cust-2",
    customerName: "Dinuka Wickramasinghe",
    customerPhone: "0719876543",
    items: [
      {
        productId: "prod-5",
        productName: "Apple AirPods Pro (2nd Generation) USB-C",
        quantity: 1,
        unitPrice: 72000,
        discount: 2000,
        warranty: "1-Year Apple Warranty",
        lineTotal: 70000
      }
    ],
    subtotal: 72000,
    discountTotal: 2000,
    taxTotal: 0,
    totalAmount: 70000,
    netBalancePayable: 70000,
    profitTotal: 8000,
    paymentMethod: "Cash",
    paymentDetails: { cashTendered: 70000, changeGiven: 0 },
    cashierName: "Surinda Nethmina",
    status: "Completed"
  }
];

export const initialRepairTickets: RepairTicket[] = [
  {
    id: "rep-1",
    ticketNumber: "REP-2026-0045",
    customerName: "Sampath Jayawardena",
    customerPhone: "0778899112",
    deviceModel: "iPhone 13 Pro",
    imeiOrSerial: "359018274619280",
    passcode: "1994",
    faultDescription: "Display replacement - vertical green line on OLED screen",
    status: "Repairing",
    estimatedCost: 38000,
    advancePaid: 15000,
    assignedTechnician: "Nuwan Pradeep",
    createdAt: "2026-09-26 14:30"
  },
  {
    id: "rep-2",
    ticketNumber: "REP-2026-0046",
    customerName: "Hasitha Bandara",
    customerPhone: "0712233445",
    deviceModel: "iPhone 14 Pro Max",
    imeiOrSerial: "354928114092100",
    passcode: "0000",
    faultDescription: "Back glass cracked, camera lens scratch",
    status: "Ready for Pickup",
    estimatedCost: 28000,
    advancePaid: 10000,
    finalCost: 28000,
    assignedTechnician: "Nuwan Pradeep",
    createdAt: "2026-09-25 11:00"
  }
];

export const initialSuppliers: Supplier[] = [
  {
    id: "sup-1",
    name: "Dubai Electronics FZE",
    company: "Dubai Electronics FZE LLC",
    phone: "+971 4 223 9012",
    email: "sales@dubaielectronics-fze.ae",
    city: "Dubai",
    country: "UAE",
    totalSupplied: 4500000,
    balanceDue: 0,
    createdAt: "2026-01-10"
  }
];

export const initialExpenses: Expense[] = [
  {
    id: "exp-1",
    date: todayDate,
    category: "Store Utilities",
    amount: 14500,
    paymentMethod: "Cash",
    description: "Store electricity & air conditioning bill",
    recordedBy: "Surinda Nethmina"
  }
];

export const initialPurchaseOrders: PurchaseOrder[] = [];
export const initialDeviceItems: DeviceItem[] = [];

export const initialCashDrawer: CashDrawerSession = {
  id: "drawer-active",
  date: todayDate,
  openingCash: 50000,
  cashSales: 70000,
  cashExpenses: 14500,
  expectedCash: 105500,
  status: "Open",
  openedAt: "08:30 AM",
  notes: "Day register opened with Rs. 50,000 float."
};

export const initialAuditLogs: AuditLog[] = [
  {
    id: "log-1",
    timestamp: `${todayDate} 11:45:00`,
    userId: "usr-1",
    userName: "Surinda Nethmina",
    action: "SALE_COMPLETED",
    category: "SALE",
    details: "Completed Sale INV-2026-002 for LKR 70,000 via Cash",
    ipOrTerminal: "Terminal 01 - Main Counter"
  },
  {
    id: "log-2",
    timestamp: `${todayDate} 10:15:00`,
    userId: "usr-1",
    userName: "Surinda Nethmina",
    action: "SALE_COMPLETED",
    category: "SALE",
    details: "Completed Sale INV-2026-001 for LKR 393,500 via Card",
    ipOrTerminal: "Terminal 01 - Main Counter"
  },
  {
    id: "log-3",
    timestamp: `${todayDate} 08:30:00`,
    userId: "usr-1",
    userName: "Surinda Nethmina",
    action: "OPEN_DRAWER",
    category: "EXPENSE",
    details: "Day register opened with float LKR 50,000",
    ipOrTerminal: "Terminal 01 - Main Counter"
  }
];
