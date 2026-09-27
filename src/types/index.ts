export type UserRole = 
  | 'admin' 
  | 'manager' 
  | 'cashier' 
  | 'technician'
  | 'OWNER' 
  | 'MANAGER' 
  | 'CASHIER' 
  | 'TECHNICIAN';

export type UserStatus = 'ACTIVE' | 'DISABLED' | 'active' | 'disabled';

export interface User {
  id: string;
  username: string;
  name: string;
  full_name?: string;
  role: UserRole;
  email?: string;
  phone?: string;
  status?: UserStatus;
  isActive?: boolean;
  isFirstLogin?: boolean;
  first_login_pending?: number;
  pinCode?: string;
  lastLogin?: string;
  created_at?: string;
}

export type DeviceCondition = 
  | 'Brand New Sealed'
  | 'Mint Like New'
  | 'Used Grade A'
  | 'Used Grade B'
  | 'Grade A'
  | 'Grade B'
  | 'BRAND_NEW' 
  | 'MINT' 
  | 'GRADE_A' 
  | 'GRADE_B';

export type DeviceStatus = 
  | 'In Stock'
  | 'Sold'
  | 'In Repair'
  | 'Returned'
  | 'IN_STOCK' 
  | 'SOLD' 
  | 'IN_REPAIR' 
  | 'RETURNED';

export type ProductCategory = string;
export type ExpenseCategory = string;

export interface ImeiRecord {
  id: string;
  modelName?: string;
  product_name?: string;
  imei1: string;
  imei2?: string;
  serialNumber?: string;
  batteryHealth?: number;
  condition: string;
  status: string;
  purchaseDate?: string;
  costPrice: number;
  sellingPrice: number;
  supplierName?: string;
  warrantyPeriodMonths?: number;
  warrantyExpiryDate?: string;
  storage?: string;
  color?: string;
  repairHistory?: any[];
  customerName?: string;
  customerPhone?: string;
  soldDate?: string;
  invoiceNumber?: string;
  // Trade-In origin & True Cost tracking
  isTradeIn?: boolean;
  tradeInId?: string;
  tradeInNumber?: string;
  tradeInCustomerName?: string;
  tradeInCustomerPhone?: string;
  tradeInDate?: string;
  tradeInInvoiceNumber?: string;
  tradeInAcquisitionCost?: number;
  refurbishmentCost?: number;
  trueCost?: number;
  resaleInvoiceNumber?: string;
  resaleCustomerName?: string;
  resaleDate?: string;
  resalePrice?: number;
  grossProfit?: number;
}

export type DeviceItem = ImeiRecord;

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  canonicalName?: string;
  category: ProductCategory;
  category_id?: string;
  category_name?: string;
  brand: string;
  model: string;
  storage?: string;
  color?: string;
  condition?: DeviceCondition | string;
  costPrice: number;
  sellingPrice: number;
  minStock: number;
  currentStock: number;
  isSerialized?: boolean;
  sku: string;
  barcode?: string;
  description?: string;
  imeis: ImeiRecord[];
  created_at?: string;
}

export type PaymentMethod = 
  | 'Cash' 
  | 'Card' 
  | 'Bank Transfer' 
  | 'Customer Credit' 
  | 'Credit' 
  | 'Installment' 
  | 'Split'
  | 'CASH' 
  | 'CARD' 
  | 'BANK_TRANSFER' 
  | 'CREDIT' 
  | 'INSTALLMENT' 
  | 'SPLIT';

export interface CartItem {
  cartItemId: string;
  product: Product;
  selectedImei?: ImeiRecord;
  quantity: number;
  unitPrice: number;
  unit_price?: number;
  discount?: number;
  discountType: 'percent' | 'amount' | 'fixed';
  discountAmount: number;
  warrantyOption: string;
  warrantyPrice: number;
  warranty_months?: number;
  warranty?: string;
  total?: number;
  lineTotal: number;
}

export interface HeldSale {
  id: string;
  timestamp?: string;
  heldAt?: string;
  note?: string;
  customer?: Customer | null;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  tradeIn?: TradeInRecord | null;
  tradeInRecord?: TradeInRecord | null;
  tradeInCredit?: number;
  subtotal?: number;
  total: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  imei?: string;
  serial?: string;
  condition?: string;
  storage?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  warranty?: string;
  lineTotal: number;
}

export interface PaymentDetails {
  cashTendered?: number;
  changeGiven?: number;
  changeDue?: number;
  cardRef?: string;
  cardLast4?: string;
  bankName?: string;
  bankRef?: string;
  splitCash?: number;
  splitCard?: number;
  splitCredit?: number;
  installmentProvider?: string;
  installmentMonths?: number;
  notes?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string;
  timestamp?: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  tradeInCredit?: number;
  tradeInId?: string;
  tradeInRecord?: TradeInRecord;
  netBalancePayable?: number;
  taxAmount?: number;
  taxTotal: number;
  totalAmount: number;
  profitTotal: number;
  paymentMethod: string;
  paymentDetails?: PaymentDetails;
  cashierId?: string;
  cashierName?: string;
  status?: string;
  notes?: string;
}

export type SalesInvoice = Sale;

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  nic?: string;
  creditLimit: number;
  creditBalance: number;
  totalSpent: number;
  ordersCount: number;
  notes?: string;
  createdAt?: string;
  created_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  totalSupplied: number;
  balanceDue: number;
  paymentTerms?: string;
  rating?: number;
  notes?: string;
  createdAt?: string;
  created_at?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber?: string;
  invoiceNumber?: string;
  supplierId: string;
  supplierName: string;
  date: string;
  totalAmount: number;
  status?: string;
  itemsCount?: number;
  paymentStatus?: string;
  items?: any[];
  imeis?: any[];
  notes?: string;
}

export type RepairStatus = 
  | 'Received' 
  | 'Diagnostics' 
  | 'Waiting for Parts' 
  | 'Repairing' 
  | 'Ready for Pickup' 
  | 'Delivered'
  | 'RECEIVED' 
  | 'DIAGNOSING' 
  | 'WAITING_PARTS' 
  | 'IN_PROGRESS' 
  | 'READY' 
  | 'DELIVERED';

export interface RepairTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deviceModel: string;
  imeiOrSerial?: string;
  imei?: string;
  passcode?: string;
  faultDescription: string;
  physicalCondition?: string;
  status: RepairStatus;
  estimatedCost: number;
  advancePaid: number;
  finalCost?: number;
  technicianNotes?: string;
  partsUsed?: string[];
  assignedTechnician?: string;
  createdAt: string;
  completedAt?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod?: string;
  payment_method?: string;
  description?: string;
  title?: string;
  receiptRef?: string;
  recordedBy?: string;
  recorded_by?: any;
  notes?: string;
  createdAt?: string;
  created_at?: string;
}

export interface CashDrawerSession {
  id: string;
  date?: string;
  openedAt: string;
  openedBy?: string;
  openingCash: number;
  closedAt?: string;
  closedBy?: string;
  cashSales: number;
  cashExpenses: number;
  expectedCash: number;
  actualCash?: number;
  discrepancy?: number;
  notes?: string;
  status: 'Open' | 'Closed';
}

export interface StoreSettings {
  storeName: string;
  fullName: string;
  tagline: string;
  owner: string;
  category: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  currency: string;
  currencySymbol?: string;
  receiptHeader: string;
  receiptFooter: string;
  printerWidth: '80mm' | '58mm';
  autoPrint: boolean;
  geminiApiKey: string;
  geminiModel: string;
  aiConfidenceThreshold: number;
  taxRatePercent: number;
  lowStockThreshold: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  category?: string;
  performedBy?: string;
  details?: string;
  userId?: string;
  user_id?: any;
  userName?: string;
  username?: string;
  ipOrTerminal?: string;
  record_type?: string;
  record_id?: string;
  old_value?: string;
  new_value?: string;
  severity?: 'info' | 'warning' | 'critical';
}

export interface DashboardMetrics {
  todaySales: number;
  todayProfit: number;
  todayTransactions: number;
  availableDevices: number;
  lowStockCount: number;
  totalStockValue: number;
  monthlyRevenue: number;
  outstandingCredit: number;
  salesGrowth?: number;
  profitGrowth?: number;
}

export type AiConfidenceFlag = 'LOW CONFIDENCE' | 'POSSIBLE DUPLICATE' | 'TOTAL MISMATCH' | 'UNKNOWN PRODUCT';

export interface ExtractedInvoiceItem {
  id: string;
  rawDescription: string;
  matchedProductName: string;
  category: string;
  storage?: string;
  color?: string;
  condition: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  imeis: string[];
  confidence?: number;
  flags?: AiConfidenceFlag[];
  confidenceFlag?: string;
  confidenceScore?: number;
  suggestedAction?: string;
}

export interface ExtractedInvoice {
  invoiceNumber: string;
  supplierName: string;
  invoiceDate: string;
  currency: string;
  subtotal: number;
  taxOrFees: number;
  totalAmount: number;
  items: ExtractedInvoiceItem[];
}

// ==========================================
// Phone Trade-In & Exchange Module Types
// ==========================================

export type PhysicalGrade = 'Grade A' | 'Grade B' | 'Grade C' | 'Grade D';

export type ScreenCondition =
  | 'Original Screen / Flawless'
  | 'Minor Scratches'
  | 'Heavy Scratches'
  | 'Cracked Glass'
  | 'Display Replacement'
  | 'Dead Pixels / Lines';

export type BackGlassCondition = 'Perfect' | 'Scratched' | 'Cracked';

export type BiometricStatus = 'Working' | 'Defective / Unavailable';

export type TrueToneStatus = 'Working' | 'Missing / Disabled';

export type CameraCondition =
  | 'Flawless'
  | 'Cracked Lens'
  | '0.5x / 1x / 3x Camera Issue';

export type PartsReplacedStatus =
  | 'All Original'
  | 'Battery Replaced'
  | 'Screen Replaced'
  | 'Housing Replaced'
  | 'Camera Replaced';

export type WaterDamageStatus =
  | 'Normal (White/Silver)'
  | 'Triggered (Red/Pink)';

export type AccessoriesIncluded =
  | 'Complete Full Set'
  | 'Original Box'
  | 'Original Cable'
  | 'Box and Cable'
  | 'Device Only';

export interface TradeInInspection {
  customerName: string;
  customerPhone: string;
  brand: string;
  model: string;
  storage: string;
  color: string;
  imei1: string;
  imei2?: string;
  serialNumber?: string;
  batteryHealth: number;
  physicalGrade: PhysicalGrade;
  screenCondition: ScreenCondition;
  backGlassCondition: BackGlassCondition;
  faceIdStatus: BiometricStatus;
  trueToneStatus: TrueToneStatus;
  cameraCondition: CameraCondition;
  partsReplaced: PartsReplacedStatus;
  waterDamage: WaterDamageStatus;
  accessories: AccessoriesIncluded;
  staffNotes?: string;
  photoUrls?: string[];
}

export interface TradeInDeductionItem {
  key: string;
  label: string;
  amount: number; // positive = deduction, negative = bonus
  reason: string;
}

export interface TradeInCalculationResult {
  basePrice: number;
  deductions: TradeInDeductionItem[];
  totalDeductions: number;
  suggestedValue: number;
}

export type TradeInStatus =
  | 'TRADE-IN RECEIVED'
  | 'INSPECTION'
  | 'REPAIR / PREPARATION'
  | 'READY FOR SALE'
  | 'AVAILABLE'
  | 'SOLD'
  | 'CANCELLED';

export interface TradeInRepairEntry {
  id?: string;
  date: string;
  description: string;
  cost: number;
  technician?: string;
  invoiceRef?: string;
}

export interface TradeInRecord {
  id: string;
  tradeInNumber: string;
  salesInvoiceId?: string;
  invoiceNumber?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;

  // Captured Inspection
  inspection: TradeInInspection;

  // Valuation Audit
  baseGuidePrice: number;
  suggestedValue: number;
  deductions: TradeInDeductionItem[];
  finalApprovedValue: number;
  overrideReason?: string;
  overrideAuthorizedBy?: string;
  overrideAuthorizedByName?: string;

  // Stock & Lifecycle
  status: TradeInStatus;
  deviceItemId?: string;
  preOwnedProductId?: string;

  // Refurbishment & True Cost
  acquisitionCost: number; // = finalApprovedValue
  refurbishmentCost: number;
  repairDetails?: TradeInRepairEntry[];
  trueCost: number; // acquisitionCost + refurbishmentCost

  // Resale Tracking
  resaleInvoiceId?: string;
  resaleInvoiceNumber?: string;
  resaleCustomerId?: string;
  resaleCustomerName?: string;
  resaleDate?: string;
  resalePrice?: number;
  realizedProfit?: number; // resalePrice - trueCost

  createdAt: string;
}

export interface TradeInPriceGuideItem {
  id: string;
  brand: string;
  model: string;
  storage: string;
  basePrice: number;
  gradeBDeduction: number;
  gradeCDeduction: number;
  gradeDDeduction: number;
  battery89_85Deduction: number;
  battery84_80Deduction: number;
  batteryUnder80Deduction: number;
  screenMinorDeduction: number;
  screenHeavyDeduction: number;
  screenCrackedDeduction: number;
  screenReplacedDeduction: number;
  backGlassCrackedDeduction: number;
  faceIdDefectiveDeduction: number;
  trueToneMissingDeduction: number;
  cameraIssueDeduction: number;
  waterDamageDeduction: number;
  boxCableBonus: number;
  deviceOnlyDeduction: number;
  updatedAt?: string;
}

