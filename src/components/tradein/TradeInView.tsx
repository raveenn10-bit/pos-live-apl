'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Repeat, 
  Search, 
  Plus, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  TrendingUp, 
  DollarSign, 
  Filter, 
  Tag, 
  Edit3, 
  Trash2, 
  Barcode, 
  X, 
  Check, 
  Copy, 
  AlertTriangle, 
  RotateCcw, 
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Sliders,
  Layers
} from 'lucide-react';
import { 
  TradeInRecord, 
  TradeInPriceGuideItem, 
  TradeInStatus, 
  DeviceItem, 
  Product 
} from '../../types';
import { DEFAULT_TRADE_IN_PRICE_GUIDE } from '../../utils/tradeInCalculator';

declare global {
  interface Window {
    electronAPI?: any;
  }
}

// Fallback initial sample trade-ins if local SQLite has 0 records
const FALLBACK_TRADE_INS: TradeInRecord[] = [
  {
    id: 'ti-1',
    tradeInNumber: 'TI-202609-001',
    customerName: 'Kamal Perera',
    customerPhone: '077 123 4567',
    inspection: {
      customerName: 'Kamal Perera',
      customerPhone: '077 123 4567',
      brand: 'Apple',
      model: 'iPhone 13',
      storage: '128GB',
      color: 'Midnight',
      imei1: '354892110294821',
      imei2: '354892110294822',
      serialNumber: 'F2LDK84NP6',
      batteryHealth: 84,
      physicalGrade: 'Grade B',
      screenCondition: 'Minor Scratches',
      backGlassCondition: 'Perfect',
      faceIdStatus: 'Working',
      trueToneStatus: 'Working',
      cameraCondition: 'Flawless',
      partsReplaced: 'All Original',
      waterDamage: 'Normal (White/Silver)',
      accessories: 'Box and Cable',
      staffNotes: 'Customer upgraded to iPhone 15 Pro. Device in solid daily condition.'
    },
    baseGuidePrice: 125000,
    suggestedValue: 108000,
    deductions: [
      { key: 'grade', label: 'Physical Grade B', amount: 5000, reason: 'Grade B wear' },
      { key: 'battery', label: 'Battery Health 84%', amount: 6000, reason: '80-84% range' },
      { key: 'screen', label: 'Minor Scratches', amount: 3500, reason: 'Superficial marks' },
      { key: 'acc', label: 'Box and Cable', amount: -2000, reason: 'Original box bonus' }
    ],
    finalApprovedValue: 110000,
    status: 'REPAIR / PREPARATION',
    acquisitionCost: 110000,
    refurbishmentCost: 8500,
    repairDetails: [
      {
        id: 'rep-1',
        date: '2026-09-26',
        description: 'New OEM Battery 100% capacity replacement',
        cost: 8500,
        technician: 'Surinda Nethmina'
      }
    ],
    trueCost: 118500,
    createdAt: '2026-09-25 14:30:00'
  },
  {
    id: 'ti-2',
    tradeInNumber: 'TI-202609-002',
    customerName: 'Nimali Fernando',
    customerPhone: '071 987 6543',
    inspection: {
      customerName: 'Nimali Fernando',
      customerPhone: '071 987 6543',
      brand: 'Apple',
      model: 'iPhone 12 Pro',
      storage: '256GB',
      color: 'Pacific Blue',
      imei1: '359102847291038',
      serialNumber: 'DNPDN294L9',
      batteryHealth: 88,
      physicalGrade: 'Grade A',
      screenCondition: 'Original Screen / Flawless',
      backGlassCondition: 'Perfect',
      faceIdStatus: 'Working',
      trueToneStatus: 'Working',
      cameraCondition: 'Flawless',
      partsReplaced: 'All Original',
      waterDamage: 'Normal (White/Silver)',
      accessories: 'Complete Full Set',
      staffNotes: 'Meticulously kept device, single owner.'
    },
    baseGuidePrice: 138000,
    suggestedValue: 137000,
    deductions: [
      { key: 'battery', label: 'Battery Health 88%', amount: 3000, reason: '85-89% range' },
      { key: 'acc', label: 'Complete Full Set', amount: -2500, reason: 'Full set bonus' }
    ],
    finalApprovedValue: 137000,
    status: 'READY FOR SALE',
    acquisitionCost: 137000,
    refurbishmentCost: 2000,
    repairDetails: [
      {
        id: 'rep-2',
        date: '2026-09-27',
        description: 'Diagnostic full health check & 9H Glass installation',
        cost: 2000,
        technician: 'Surinda Nethmina'
      }
    ],
    trueCost: 139000,
    createdAt: '2026-09-26 11:15:00'
  },
  {
    id: 'ti-3',
    tradeInNumber: 'TI-202609-003',
    customerName: 'Sunil Wickramasinghe',
    customerPhone: '076 555 4321',
    inspection: {
      customerName: 'Sunil Wickramasinghe',
      customerPhone: '076 555 4321',
      brand: 'Apple',
      model: 'iPhone 11',
      storage: '64GB',
      color: 'Black',
      imei1: '356719284019283',
      batteryHealth: 77,
      physicalGrade: 'Grade C',
      screenCondition: 'Minor Scratches',
      backGlassCondition: 'Scratched',
      faceIdStatus: 'Working',
      trueToneStatus: 'Working',
      cameraCondition: 'Flawless',
      partsReplaced: 'All Original',
      waterDamage: 'Normal (White/Silver)',
      accessories: 'Device Only',
      staffNotes: 'Battery needs replacement before resale.'
    },
    baseGuidePrice: 75000,
    suggestedValue: 49000,
    deductions: [
      { key: 'grade', label: 'Grade C Wear', amount: 12000, reason: 'Heavy casing marks' },
      { key: 'battery', label: 'Battery 77% (Service)', amount: 9000, reason: 'Under 80%' },
      { key: 'screen', label: 'Minor Scratches', amount: 3000, reason: 'Light marks' },
      { key: 'acc', label: 'Device Only', amount: 2000, reason: 'No box or charger' }
    ],
    finalApprovedValue: 50000,
    status: 'INSPECTION',
    acquisitionCost: 50000,
    refurbishmentCost: 0,
    repairDetails: [],
    trueCost: 50000,
    createdAt: '2026-09-27 16:45:00'
  }
];

export const TradeInView: React.FC = () => {
  const { settings, showNotification, openDevicePassport, products } = useStore();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'lifecycle' | 'guide'>('lifecycle');

  // Trade-In List State
  const [tradeIns, setTradeIns] = useState<TradeInRecord[]>(() => {
    const saved = localStorage.getItem('applevision_tradeins');
    return saved ? JSON.parse(saved) : FALLBACK_TRADE_INS;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Price Guide State
  const [priceGuide, setPriceGuide] = useState<TradeInPriceGuideItem[]>(() => {
    const saved = localStorage.getItem('applevision_price_guide');
    if (saved) return JSON.parse(saved);
    return DEFAULT_TRADE_IN_PRICE_GUIDE.map((item, idx) => ({
      ...item,
      id: `pg-${idx + 1}`
    }));
  });
  const [guideSearch, setGuideSearch] = useState('');

  // Modals
  const [statusModalTradeIn, setStatusModalTradeIn] = useState<TradeInRecord | null>(null);
  const [newStatus, setNewStatus] = useState<TradeInStatus>('TRADE-IN RECEIVED');
  const [statusNotes, setStatusNotes] = useState('');

  const [refurbModalTradeIn, setRefurbModalTradeIn] = useState<TradeInRecord | null>(null);
  const [partName, setPartName] = useState('');
  const [partCost, setPartCost] = useState('');
  const [partTech, setPartTech] = useState(currentUser?.name || 'Surinda Nethmina');
  const [partNotes, setPartNotes] = useState('');

  const [editGuideItem, setEditGuideItem] = useState<Partial<TradeInPriceGuideItem> | null>(null);
  const [isAddGuideModalOpen, setIsAddGuideModalOpen] = useState(false);
  const [copiedImei, setCopiedImei] = useState<string | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('applevision_tradeins', JSON.stringify(tradeIns));
  }, [tradeIns]);

  useEffect(() => {
    localStorage.setItem('applevision_price_guide', JSON.stringify(priceGuide));
  }, [priceGuide]);

  // Load from Electron IPC if available
  const loadDataFromElectron = async () => {
    if (window.electronAPI?.tradeIn) {
      try {
        setIsLoading(true);
        const [dbTradeIns, dbGuide] = await Promise.all([
          window.electronAPI.tradeIn.getTradeIns(),
          window.electronAPI.tradeIn.getPriceGuide()
        ]);
        if (Array.isArray(dbTradeIns) && dbTradeIns.length > 0) {
          setTradeIns(dbTradeIns);
        }
        if (Array.isArray(dbGuide) && dbGuide.length > 0) {
          setPriceGuide(dbGuide);
        }
      } catch (err) {
        console.warn('TradeInView: electron fetch fallback to local storage:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDataFromElectron();
  }, []);

  // Format currency helper
  const formatLkr = (amount: number) => {
    return `${settings.currency || 'Rs.'} ${Number(amount || 0).toLocaleString('en-US')}`;
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalCount = tradeIns.length;
    const inInspection = tradeIns.filter(t => (t.status === 'TRADE-IN RECEIVED' || t.status === 'INSPECTION')).length;
    const inRepair = tradeIns.filter(t => t.status === 'REPAIR / PREPARATION').length;
    const readyForSale = tradeIns.filter(t => (t.status === 'READY FOR SALE' || t.status === 'AVAILABLE')).length;
    const soldCount = tradeIns.filter(t => t.status === 'SOLD').length;

    const totalCapital = tradeIns.reduce((acc, curr) => {
      const acquisition = Number(curr.acquisitionCost ?? curr.finalApprovedValue ?? (curr as any).final_approved_value ?? 0);
      const refurb = Number(curr.refurbishmentCost ?? (curr as any).refurbishment_cost ?? 0);
      return acc + (acquisition + refurb);
    }, 0);

    return { totalCount, inInspection, inRepair, readyForSale, soldCount, totalCapital };
  }, [tradeIns]);

  // Filtered Trade-Ins
  const filteredTradeIns = useMemo(() => {
    return tradeIns.filter(item => {
      const status = item.status || 'TRADE-IN RECEIVED';
      if (statusFilter !== 'ALL' && status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const model = (item.inspection?.model || (item as any).model || '').toLowerCase();
      const imei1 = (item.inspection?.imei1 || (item as any).imei1 || '').toLowerCase();
      const imei2 = (item.inspection?.imei2 || (item as any).imei2 || '').toLowerCase();
      const cust = (item.customerName || (item as any).customer_name || '').toLowerCase();
      const phone = (item.customerPhone || (item as any).customer_phone || '').toLowerCase();
      const refNum = (item.tradeInNumber || (item as any).trade_in_number || '').toLowerCase();
      const invNum = (item.invoiceNumber || (item as any).invoice_number || '').toLowerCase();

      return model.includes(q) || imei1.includes(q) || imei2.includes(q) || cust.includes(q) || phone.includes(q) || refNum.includes(q) || invNum.includes(q);
    });
  }, [tradeIns, statusFilter, searchQuery]);

  // Filtered Price Guide
  const filteredGuide = useMemo(() => {
    if (!guideSearch.trim()) return priceGuide;
    const q = guideSearch.toLowerCase();
    return priceGuide.filter(p => 
      p.model.toLowerCase().includes(q) || 
      p.storage.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
    );
  }, [priceGuide, guideSearch]);

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedImei(text);
    setTimeout(() => setCopiedImei(null), 1500);
    showNotification('info', `Copied ${text} to clipboard`);
  };

  // Status Change Handler
  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalTradeIn) return;

    const id = statusModalTradeIn.id;
    try {
      if (window.electronAPI?.tradeIn) {
        const numId = parseInt(String(id).replace(/\D/g, ''), 10) || 1;
        await window.electronAPI.tradeIn.updateStatus({
          tradeInId: numId,
          status: newStatus,
          notes: statusNotes
        });
      }

      setTradeIns(prev => prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            status: newStatus,
            staffNotes: statusNotes ? `${t.inspection?.staffNotes || ''}\n[Status Updated: ${newStatus}] ${statusNotes}` : t.inspection?.staffNotes
          };
        }
        return t;
      }));

      showNotification('success', `Trade-In status updated to "${newStatus}"`);
      setStatusModalTradeIn(null);
      setStatusNotes('');
    } catch (err: any) {
      showNotification('error', `Failed to update status: ${err.message || err}`);
    }
  };

  // Refurbishment Cost Handler
  const handleAddRefurbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refurbModalTradeIn) return;

    const costNum = parseFloat(partCost);
    if (isNaN(costNum) || costNum <= 0) {
      showNotification('warning', 'Please enter a valid repair cost in LKR');
      return;
    }
    if (!partName.trim()) {
      showNotification('warning', 'Please enter the part name or repair description');
      return;
    }

    const id = refurbModalTradeIn.id;
    const newEntry = {
      id: `rep-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      description: partName.trim(),
      cost: costNum,
      technician: partTech.trim() || 'AppleVision Tech'
    };

    try {
      if (window.electronAPI?.tradeIn) {
        const numId = parseInt(String(id).replace(/\D/g, ''), 10) || 1;
        await window.electronAPI.tradeIn.addRefurbishmentCost({
          trade_in_id: numId,
          part_name: partName.trim(),
          cost: costNum,
          notes: partNotes.trim(),
          technician: partTech.trim()
        });
      }

      setTradeIns(prev => prev.map(t => {
        if (t.id === id) {
          const oldRefurb = Number(t.refurbishmentCost ?? (t as any).refurbishment_cost ?? 0);
          const acq = Number(t.acquisitionCost ?? t.finalApprovedValue ?? (t as any).final_approved_value ?? 0);
          const updatedRefurb = oldRefurb + costNum;
          const updatedTrueCost = acq + updatedRefurb;
          const existingDetails = t.repairDetails || [];

          return {
            ...t,
            refurbishmentCost: updatedRefurb,
            trueCost: updatedTrueCost,
            repairDetails: [...existingDetails, newEntry],
            status: t.status === 'TRADE-IN RECEIVED' ? 'REPAIR / PREPARATION' : t.status
          };
        }
        return t;
      }));

      showNotification('success', `Added repair cost of ${formatLkr(costNum)} to True Cost`);
      setRefurbModalTradeIn(null);
      setPartName('');
      setPartCost('');
      setPartNotes('');
    } catch (err: any) {
      showNotification('error', `Failed to record refurbishment cost: ${err.message || err}`);
    }
  };

  // Open Device Passport for Trade-In
  const handleInspectPassport = (tradeIn: TradeInRecord) => {
    const imei = tradeIn.inspection?.imei1 || (tradeIn as any).imei1;
    const model = tradeIn.inspection?.model || (tradeIn as any).model || 'Pre-Owned iPhone';
    const storage = tradeIn.inspection?.storage || (tradeIn as any).storage || '128GB';
    const color = tradeIn.inspection?.color || (tradeIn as any).color || 'Space Gray';
    const acq = Number(tradeIn.acquisitionCost ?? tradeIn.finalApprovedValue ?? (tradeIn as any).final_approved_value ?? 0);
    const refurb = Number(tradeIn.refurbishmentCost ?? (tradeIn as any).refurbishment_cost ?? 0);
    const trueCost = acq + refurb;

    // Find in products deviceItems or craft custom DeviceItem
    let foundDev: DeviceItem | null = null;
    let foundProd: Product | null = null;

    for (const p of products) {
      const match = (p.imeis || []).find((d: DeviceItem) => d.imei1 === imei || d.serialNumber === tradeIn.inspection?.serialNumber);
      if (match) {
        foundDev = match;
        foundProd = p;
        break;
      }
    }

    if (!foundDev || !foundProd) {
      // Create synthetic device passport record with full Trade-In origin audit
      const syntheticDev: DeviceItem = {
        id: `dev-ti-${tradeIn.id}`,
        modelName: `Apple ${model} (${storage})`,
        imei1: imei,
        imei2: tradeIn.inspection?.imei2 || (tradeIn as any).imei2,
        serialNumber: tradeIn.inspection?.serialNumber || (tradeIn as any).serialNumber || `SN-${tradeIn.tradeInNumber}`,
        batteryHealth: tradeIn.inspection?.batteryHealth ?? (tradeIn as any).battery_health ?? 85,
        condition: tradeIn.inspection?.physicalGrade || (tradeIn as any).physical_grade || 'Grade B (Used)',
        status: tradeIn.status === 'READY FOR SALE' ? 'In Stock' : tradeIn.status === 'SOLD' ? 'Sold' : 'In Repair',
        purchaseDate: tradeIn.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        costPrice: trueCost,
        sellingPrice: Math.round(trueCost * 1.15),
        supplierName: `Trade-In: ${tradeIn.customerName} (${tradeIn.customerPhone})`,
        warrantyPeriodMonths: 3,
        warrantyExpiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        storage: storage,
        color: color,
        isTradeIn: true,
        tradeInId: tradeIn.id,
        tradeInNumber: tradeIn.tradeInNumber || (tradeIn as any).trade_in_number,
        tradeInCustomerName: tradeIn.customerName,
        tradeInCustomerPhone: tradeIn.customerPhone,
        tradeInDate: tradeIn.createdAt,
        tradeInAcquisitionCost: acq,
        refurbishmentCost: refurb,
        trueCost: trueCost,
        repairHistory: tradeIn.repairDetails || []
      };

      const syntheticProd: Product = {
        id: `prod-ti-${tradeIn.id}`,
        name: `Pre-Owned Apple ${model} ${storage}`,
        category: 'iPhone',
        brand: 'Apple',
        model: model,
        storage: storage,
        color: color,
        sku: `PO-${model.replace(/\s+/g, '').toUpperCase()}-${storage}`,
        barcode: imei,
        costPrice: trueCost,
        sellingPrice: Math.round(trueCost * 1.15),
        currentStock: 1,
        minStock: 1,
        imeis: [syntheticDev]
      };

      openDevicePassport(syntheticDev, syntheticProd);
    } else {
      // Attach trade-in metadata to existing device item
      const enrichedDev: DeviceItem = {
        ...foundDev,
        isTradeIn: true,
        tradeInId: tradeIn.id,
        tradeInNumber: tradeIn.tradeInNumber || (tradeIn as any).trade_in_number,
        tradeInCustomerName: tradeIn.customerName,
        tradeInCustomerPhone: tradeIn.customerPhone,
        tradeInDate: tradeIn.createdAt,
        tradeInAcquisitionCost: acq,
        refurbishmentCost: refurb,
        trueCost: trueCost,
        repairHistory: tradeIn.repairDetails || foundDev.repairHistory || []
      };
      openDevicePassport(enrichedDev, foundProd);
    }
  };

  // Price Guide Save Handler
  const handleSavePriceGuideItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGuideItem || !editGuideItem.model || !editGuideItem.storage) {
      showNotification('warning', 'Model and Storage are required');
      return;
    }

    const payload: TradeInPriceGuideItem = {
      id: editGuideItem.id || `pg-${Date.now()}`,
      brand: editGuideItem.brand || 'Apple',
      model: editGuideItem.model.trim(),
      storage: editGuideItem.storage.trim(),
      basePrice: Number(editGuideItem.basePrice || 100000),
      gradeBDeduction: Number(editGuideItem.gradeBDeduction || 5000),
      gradeCDeduction: Number(editGuideItem.gradeCDeduction || 15000),
      gradeDDeduction: Number(editGuideItem.gradeDDeduction || 30000),
      battery89_85Deduction: Number(editGuideItem.battery89_85Deduction || 3000),
      battery84_80Deduction: Number(editGuideItem.battery84_80Deduction || 6000),
      batteryUnder80Deduction: Number(editGuideItem.batteryUnder80Deduction || 10000),
      screenMinorDeduction: Number(editGuideItem.screenMinorDeduction || 3000),
      screenHeavyDeduction: Number(editGuideItem.screenHeavyDeduction || 8000),
      screenCrackedDeduction: Number(editGuideItem.screenCrackedDeduction || 20000),
      screenReplacedDeduction: Number(editGuideItem.screenReplacedDeduction || 12000),
      backGlassCrackedDeduction: Number(editGuideItem.backGlassCrackedDeduction || 8000),
      faceIdDefectiveDeduction: Number(editGuideItem.faceIdDefectiveDeduction || 18000),
      trueToneMissingDeduction: Number(editGuideItem.trueToneMissingDeduction || 5000),
      cameraIssueDeduction: Number(editGuideItem.cameraIssueDeduction || 15000),
      waterDamageDeduction: Number(editGuideItem.waterDamageDeduction || 35000),
      boxCableBonus: Number(editGuideItem.boxCableBonus || 2000),
      deviceOnlyDeduction: Number(editGuideItem.deviceOnlyDeduction || 2000),
      updatedAt: new Date().toISOString()
    };

    try {
      if (window.electronAPI?.tradeIn) {
        await window.electronAPI.tradeIn.savePriceGuideItem(payload);
      }

      setPriceGuide(prev => {
        const exists = prev.some(p => p.id === payload.id || (p.model.toLowerCase() === payload.model.toLowerCase() && p.storage.toLowerCase() === payload.storage.toLowerCase()));
        if (exists) {
          return prev.map(p => (p.id === payload.id || (p.model.toLowerCase() === payload.model.toLowerCase() && p.storage.toLowerCase() === payload.storage.toLowerCase())) ? payload : p);
        }
        return [payload, ...prev];
      });

      showNotification('success', `Price Guide valuation for ${payload.model} (${payload.storage}) saved`);
      setEditGuideItem(null);
      setIsAddGuideModalOpen(false);
    } catch (err: any) {
      showNotification('error', `Failed to save price guide item: ${err.message || err}`);
    }
  };

  // Delete Price Guide Item
  const handleDeleteGuideItem = async (id: string, model: string, storage: string) => {
    if (!confirm(`Delete price guide rule for ${model} (${storage})?`)) return;

    try {
      if (window.electronAPI?.tradeIn) {
        const numId = parseInt(String(id).replace(/\D/g, ''), 10);
        if (!isNaN(numId)) {
          await window.electronAPI.tradeIn.deletePriceGuideItem(numId);
        }
      }
      setPriceGuide(prev => prev.filter(p => p.id !== id));
      showNotification('info', `Removed ${model} (${storage}) from price guide`);
    } catch (err: any) {
      showNotification('error', `Failed to delete item: ${err.message || err}`);
    }
  };

  // Reset Price Guide to Factory Matrix
  const handleResetDefaults = () => {
    if (!confirm('Reset entire Price Guide to AppleVision Galle factory valuation matrix? This will overwrite custom price rows.')) return;
    const factory = DEFAULT_TRADE_IN_PRICE_GUIDE.map((item, idx) => ({
      ...item,
      id: `pg-${idx + 1}`
    }));
    setPriceGuide(factory);
    showNotification('success', 'Restored 25+ Apple iPhone official price guide valuation tiers');
  };

  // Status badge color mapper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TRADE-IN RECEIVED':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'INSPECTION':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'REPAIR / PREPARATION':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'READY FOR SALE':
      case 'AVAILABLE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'SOLD':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default:
        return 'bg-brand-500/10 text-brand-400 border-brand-500/30';
    }
  };

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 border border-slate-700/60 shadow-xl text-white">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 shadow-inner">
            <Repeat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Apple Trade-In & Exchange Hub</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/30 text-brand-300 border border-brand-500/40">
                Galle Flagship
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              End-to-end Pre-Owned Lifecycle: Intake Inspection, Refurbishment Cost Log, True Cost Accounting, and Valuation Matrix.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-800/80 border border-slate-700 backdrop-blur self-start md:self-auto">
          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'lifecycle'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Used Stock Lifecycle</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
              {tradeIns.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'guide'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Price Guide Manager</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
              {priceGuide.length}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
              Total Trade-Ins
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {stats.totalCount}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500">
            <Repeat className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
              In Inspection
            </div>
            <div className="text-xl font-bold font-mono text-blue-500 mt-0.5">
              {stats.inInspection}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
              Under Repair
            </div>
            <div className="text-xl font-bold font-mono text-purple-400 mt-0.5">
              {stats.inRepair}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
              Ready for Sale
            </div>
            <div className="text-xl font-bold font-mono text-emerald-500 mt-0.5">
              {stats.readyForSale}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
              Invested Capital
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5 truncate">
              {formatLkr(stats.totalCapital)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: USED STOCK LIFECYCLE                               */}
      {/* ========================================================= */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', 'TRADE-IN RECEIVED', 'INSPECTION', 'REPAIR / PREPARATION', 'READY FOR SALE', 'SOLD'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'bg-light-surface dark:bg-dark-surface text-light-muted dark:text-dark-muted hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'All Devices' : st}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search IMEI, model, customer, ref #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Trade-Ins Table / Cards */}
          <div className="rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-light-surface/80 dark:bg-dark-surface/80 border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-4">Ref # / Date</th>
                    <th className="py-3 px-4">Device & Grade</th>
                    <th className="py-3 px-4">IMEI / Identifiers</th>
                    <th className="py-3 px-4">Customer & Origin</th>
                    <th className="py-3 px-4 text-right">Acquisition</th>
                    <th className="py-3 px-4 text-right">Refurb Cost</th>
                    <th className="py-3 px-4 text-right">True Cost</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                  {filteredTradeIns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-light-muted dark:text-dark-muted">
                        <Smartphone className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-60" />
                        <div className="font-semibold text-sm">No Trade-In Records Found</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {searchQuery ? `No devices match "${searchQuery}"` : 'Trade-in phones accepted at POS counter will appear here.'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTradeIns.map((t) => {
                      const refNum = t.tradeInNumber || (t as any).trade_in_number || `TI-${t.id}`;
                      const model = t.inspection?.model || (t as any).model || 'Apple iPhone';
                      const storage = t.inspection?.storage || (t as any).storage || '';
                      const color = t.inspection?.color || (t as any).color || '';
                      const imei1 = t.inspection?.imei1 || (t as any).imei1 || '';
                      const battery = t.inspection?.batteryHealth ?? (t as any).battery_health ?? 100;
                      const grade = t.inspection?.physicalGrade || (t as any).physical_grade || 'Grade A';
                      const customerName = t.customerName || (t as any).customer_name || 'Walk-in Customer';
                      const customerPhone = t.customerPhone || (t as any).customer_phone || '';
                      const acq = Number(t.acquisitionCost ?? t.finalApprovedValue ?? (t as any).final_approved_value ?? 0);
                      const refurb = Number(t.refurbishmentCost ?? (t as any).refurbishment_cost ?? 0);
                      const trueCost = Number(t.trueCost ?? (t as any).true_cost ?? (acq + refurb));
                      const status = t.status || 'TRADE-IN RECEIVED';
                      const date = t.createdAt || (t as any).created_at || '';

                      return (
                        <tr 
                          key={t.id}
                          className="hover:bg-light-surface/40 dark:hover:bg-dark-surface/40 transition-colors"
                        >
                          {/* Ref # & Date */}
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-brand-500 text-[11px]">
                              {refNum}
                            </div>
                            <div className="text-[10px] text-light-muted dark:text-dark-muted mt-0.5 font-mono">
                              {date.slice(0, 16)}
                            </div>
                          </td>

                          {/* Device & Grade */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{model}</span>
                              {storage && (
                                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {storage}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                {grade}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-500 font-semibold flex items-center gap-1">
                                <BatteryChargingIcon battery={battery} />
                                {battery}%
                              </span>
                              {color && (
                                <span className="text-[10px] text-light-muted dark:text-dark-muted">
                                  {color}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Identifiers */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800 dark:text-slate-200 font-semibold">
                              <span>{imei1 || 'N/A'}</span>
                              {imei1 && (
                                <button
                                  onClick={() => handleCopy(imei1)}
                                  className="text-slate-400 hover:text-brand-500 p-0.5"
                                  title="Copy IMEI 1"
                                >
                                  {copiedImei === imei1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                            {t.inspection?.serialNumber && (
                              <div className="font-mono text-[10px] text-light-muted dark:text-dark-muted mt-0.5">
                                S/N: {t.inspection.serialNumber}
                              </div>
                            )}
                          </td>

                          {/* Customer & Origin */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {customerName}
                            </div>
                            <div className="font-mono text-[10px] text-light-muted dark:text-dark-muted mt-0.5">
                              {customerPhone || 'Counter Trade'}
                            </div>
                            {t.invoiceNumber && (
                              <div className="text-[10px] text-brand-500 mt-0.5 font-mono">
                                Sale Inv: #{t.invoiceNumber}
                              </div>
                            )}
                          </td>

                          {/* Acquisition */}
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {formatLkr(acq)}
                          </td>

                          {/* Refurb Cost */}
                          <td className="py-3 px-4 text-right">
                            <span className={`font-mono font-semibold ${refurb > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                              {formatLkr(refurb)}
                            </span>
                            {refurb > 0 && (
                              <div className="text-[9px] text-light-muted dark:text-dark-muted mt-0.5">
                                {(t.repairDetails || []).length} parts/services
                              </div>
                            )}
                          </td>

                          {/* True Cost */}
                          <td className="py-3 px-4 text-right">
                            <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                              {formatLkr(trueCost)}
                            </div>
                            <div className="text-[9px] text-light-muted dark:text-dark-muted uppercase font-bold tracking-tight">
                              True Cost
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(status)}`}>
                              {status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setStatusModalTradeIn(t);
                                  setNewStatus(t.status as TradeInStatus);
                                }}
                                className="px-2 py-1 rounded-lg bg-light-surface dark:bg-dark-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] border border-light-border dark:border-dark-border transition-colors"
                                title="Update Status"
                              >
                                Status
                              </button>

                              <button
                                onClick={() => {
                                  setRefurbModalTradeIn(t);
                                  setPartName('');
                                  setPartCost('');
                                  setPartNotes('');
                                }}
                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 transition-colors"
                                title="Add Refurbishment Cost"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleInspectPassport(t)}
                                className="p-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 border border-brand-500/20 transition-colors"
                                title="View Device Passport"
                              >
                                <Barcode className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TRADE-IN PRICE GUIDE MANAGER                       */}
      {/* ========================================================= */}
      {activeTab === 'guide' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search models (e.g. iPhone 13, 256GB, 15 Pro Max)..."
                value={guideSearch}
                onChange={(e) => setGuideSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetDefaults}
                className="px-3.5 py-2 rounded-xl bg-light-surface dark:bg-dark-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-light-muted dark:text-dark-muted hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-light-border dark:border-dark-border flex items-center gap-1.5 transition-colors"
                title="Reset matrix to AppleVision official defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                onClick={() => {
                  setEditGuideItem({
                    brand: 'Apple',
                    model: 'iPhone 15',
                    storage: '128GB',
                    basePrice: 195000,
                    gradeBDeduction: 7000,
                    gradeCDeduction: 20000,
                    gradeDDeduction: 40000,
                    battery89_85Deduction: 3500,
                    battery84_80Deduction: 7000,
                    batteryUnder80Deduction: 12000,
                    screenMinorDeduction: 5000,
                    screenHeavyDeduction: 12000,
                    screenCrackedDeduction: 30000,
                    screenReplacedDeduction: 18000,
                    backGlassCrackedDeduction: 11000,
                    faceIdDefectiveDeduction: 22000,
                    trueToneMissingDeduction: 6000,
                    cameraIssueDeduction: 20000,
                    waterDamageDeduction: 45000,
                    boxCableBonus: 3000,
                    deviceOnlyDeduction: 3000
                  });
                  setIsAddGuideModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-500/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Model Valuation</span>
              </button>
            </div>
          </div>

          {/* Guide Matrix Table */}
          <div className="rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-light-surface/80 dark:bg-dark-surface/80 border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-4">Apple Model</th>
                    <th className="py-3 px-4">Storage</th>
                    <th className="py-3 px-4 text-right">Base Valuation (Grade A)</th>
                    <th className="py-3 px-4 text-right">Grade B / C / D</th>
                    <th className="py-3 px-4 text-right">Battery &lt;80%</th>
                    <th className="py-3 px-4 text-right">Cracked Screen</th>
                    <th className="py-3 px-4 text-right">FaceID Defect</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                  {filteredGuide.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-light-muted dark:text-dark-muted">
                        No models found matching "{guideSearch}".
                      </td>
                    </tr>
                  ) : (
                    filteredGuide.map((item) => (
                      <tr 
                        key={item.id}
                        className="hover:bg-light-surface/40 dark:hover:bg-dark-surface/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {item.brand} {item.model}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {item.storage}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-500">
                          {formatLkr(item.basePrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[11px] text-light-muted dark:text-dark-muted">
                          -{item.gradeBDeduction / 1000}k / -{item.gradeCDeduction / 1000}k / -{item.gradeDDeduction / 1000}k
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[11px] text-amber-500">
                          -{formatLkr(item.batteryUnder80Deduction)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[11px] text-rose-400">
                          -{formatLkr(item.screenCrackedDeduction)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[11px] text-purple-400">
                          -{formatLkr(item.faceIdDefectiveDeduction)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditGuideItem(item);
                                setIsAddGuideModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-light-surface dark:bg-dark-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-light-border dark:border-dark-border transition-colors"
                              title="Edit Valuation Matrix"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteGuideItem(item.id, item.model, item.storage)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors"
                              title="Delete Model Rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: UPDATE LIFECYCLE STATUS                          */}
      {/* ========================================================= */}
      {statusModalTradeIn && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-light-surface/60 dark:bg-dark-surface/60 border-b border-light-border dark:border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-brand-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Update Trade-In Status
                </h3>
              </div>
              <button
                onClick={() => setStatusModalTradeIn(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>{statusModalTradeIn.inspection?.model || (statusModalTradeIn as any).model}</span>
                  <span className="font-mono text-brand-500">{statusModalTradeIn.tradeInNumber}</span>
                </div>
                <div className="text-[11px] text-light-muted dark:text-dark-muted font-mono">
                  IMEI 1: {statusModalTradeIn.inspection?.imei1 || (statusModalTradeIn as any).imei1}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-1.5">
                  Select New Lifecycle Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TradeInStatus)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-semibold"
                >
                  <option value="TRADE-IN RECEIVED">TRADE-IN RECEIVED (Intake Completed)</option>
                  <option value="INSPECTION">INSPECTION (Hardware Testing & Diagnostic)</option>
                  <option value="REPAIR / PREPARATION">REPAIR / PREPARATION (Parts replacement, polishing)</option>
                  <option value="READY FOR SALE">READY FOR SALE (In Stock - Available for POS)</option>
                  <option value="SOLD">SOLD (Customer Purchased)</option>
                  <option value="CANCELLED">CANCELLED (Returned / Reverted)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-1.5">
                  Technician / Status Update Notes
                </label>
                <textarea
                  rows={3}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="e.g. Completed FaceID and audio test. Passed all 15 hardware checks. Placed in showcase counter."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalTradeIn(null)}
                  className="px-4 py-2 text-xs font-semibold text-light-muted dark:text-dark-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition-all"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD REFURBISHMENT COST                           */}
      {/* ========================================================= */}
      {refurbModalTradeIn && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-light-surface/60 dark:bg-dark-surface/60 border-b border-light-border dark:border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Add Refurbishment Cost
                  </h3>
                  <p className="text-[10px] text-light-muted dark:text-dark-muted">
                    Investments are automatically added to the phone's True Cost.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRefurbModalTradeIn(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRefurbSubmit} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>{refurbModalTradeIn.inspection?.model || (refurbModalTradeIn as any).model}</span>
                  <span className="font-mono text-brand-500">{refurbModalTradeIn.tradeInNumber}</span>
                </div>
                <div className="flex justify-between text-[11px] text-light-muted dark:text-dark-muted">
                  <span>Current True Cost:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatLkr(Number(refurbModalTradeIn.trueCost || refurbModalTradeIn.acquisitionCost))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-1.5">
                  Part / Work Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPhone Genuine Battery replacement (100% Health)"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-1.5">
                    Cost in LKR *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="8500"
                    value={partCost}
                    onChange={(e) => setPartCost(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-1.5">
                    Technician
                  </label>
                  <input
                    type="text"
                    value={partTech}
                    onChange={(e) => setPartTech(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-1.5">
                  Optional Notes / Supplier
                </label>
                <input
                  type="text"
                  placeholder="Part serial / supplier name / warranty notes"
                  value={partNotes}
                  onChange={(e) => setPartNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefurbModalTradeIn(null)}
                  className="px-4 py-2 text-xs font-semibold text-light-muted dark:text-dark-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/25 transition-all"
                >
                  Record Refurbishment Cost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ADD / EDIT PRICE GUIDE VALUATION                 */}
      {/* ========================================================= */}
      {isAddGuideModalOpen && editGuideItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-light-surface/60 dark:bg-dark-surface/60 border-b border-light-border dark:border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editGuideItem.id ? `Edit Valuation: ${editGuideItem.model}` : 'Add New Model Price Guide'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddGuideModalOpen(false);
                  setEditGuideItem(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePriceGuideItem} className="p-6 overflow-y-auto space-y-5">
              {/* Basic Device Identifiers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    required
                    value={editGuideItem.brand || 'Apple'}
                    onChange={(e) => setEditGuideItem({ ...editGuideItem, brand: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-1">
                    Model Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="iPhone 15 Pro"
                    value={editGuideItem.model || ''}
                    onChange={(e) => setEditGuideItem({ ...editGuideItem, model: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-1">
                    Storage Variant *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="128GB / 256GB"
                    value={editGuideItem.storage || ''}
                    onChange={(e) => setEditGuideItem({ ...editGuideItem, storage: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Base Valuation */}
              <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                <label className="block text-xs font-bold text-brand-400 uppercase tracking-wider mb-1">
                  Base Price (Grade A Flawless) in LKR *
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="500"
                  value={editGuideItem.basePrice || ''}
                  onChange={(e) => setEditGuideItem({ ...editGuideItem, basePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 text-base font-mono font-bold rounded-xl bg-white dark:bg-dark-card border border-brand-500/40 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Grade Deductions */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Physical Condition Deductions (LKR)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-light-muted dark:text-dark-muted mb-1">Grade B</label>
                    <input
                      type="number"
                      value={editGuideItem.gradeBDeduction || 0}
                      onChange={(e) => setEditGuideItem({ ...editGuideItem, gradeBDeduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-light-muted dark:text-dark-muted mb-1">Grade C</label>
                    <input
                      type="number"
                      value={editGuideItem.gradeCDeduction || 0}
                      onChange={(e) => setEditGuideItem({ ...editGuideItem, gradeCDeduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-light-muted dark:text-dark-muted mb-1">Grade D (Damaged)</label>
                    <input
                      type="number"
                      value={editGuideItem.gradeDDeduction || 0}
                      onChange={(e) => setEditGuideItem({ ...editGuideItem, gradeDDeduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Battery Deductions */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Battery Health Deductions (LKR)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-light-muted dark:text-dark-muted mb-1">85% - 89%</label>
                    <input
                      type="number"
                      value={editGuideItem.battery89_85Deduction || 0}
                      onChange={(e) => setEditGuideItem({ ...editGuideItem, battery89_85Deduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-light-muted dark:text-dark-muted mb-1">80% - 84%</label>
                    <input
                      type="number"
                      value={editGuideItem.battery84_80Deduction || 0}
                      onChange={(e) => setEditGuideItem({ ...editGuideItem, battery84_80Deduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-light-muted dark:text-dark-muted mb-1">&lt; 80% (Service)</label>
                    <input
                      type="number"
                      value={editGuideItem.batteryUnder80Deduction || 0}
                      onChange={(e) => setEditGuideItem({ ...editGuideItem, batteryUnder80Deduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Screen & Glass Deductions */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Display & Back Glass Deductions (LKR)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-light-muted dark:text-dark-muted mb-1">Minor Scratches</label>
                    <input
                      type="number"
                      value={editGuideItem.screenMinorDeduction || 0}
                      onChange={(e) => setEditGuideItem({ ...editGuideItem, screenMinorDeduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-light-muted dark:text-dark-muted mb-1">Heavy Scratches</label>
                    <input
                      type="number"
                      value={editGuideItem.screenHeavyDeduction || 0}
                      onChange={(e) => setEditGuideItem({ ...editGuideItem, screenHeavyDeduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-light-muted dark:text-dark-muted mb-1">Cracked Screen</label>
                    <input
                      type="number"
                      value={editGuideItem.screenCrackedDeduction || 0}
                      onChange={(e) => setEditGuideItem({ ...editGuideItem, screenCrackedDeduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-light-muted dark:text-dark-muted mb-1">Cracked Back</label>
                    <input
                      type="number"
                      value={editGuideItem.backGlassCrackedDeduction || 0}
                      onChange={(e) => setEditGuideItem({ ...editGuideItem, backGlassCrackedDeduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Hardware Faults & Accessories */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Hardware Faults & Accessory Adjustment (LKR)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-light-muted dark:text-dark-muted mb-1">FaceID Defective</label>
                    <input
                      type="number"
                      value={editGuideItem.faceIdDefectiveDeduction || 0}
                      onChange={(e) => setEditGuideItem({ ...editGuideItem, faceIdDefectiveDeduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-light-muted dark:text-dark-muted mb-1">Camera Issue</label>
                    <input
                      type="number"
                      value={editGuideItem.cameraIssueDeduction || 0}
                      onChange={(e) => setEditGuideItem({ ...editGuideItem, cameraIssueDeduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-light-muted dark:text-dark-muted mb-1">Full Box Bonus (-LKR)</label>
                    <input
                      type="number"
                      value={editGuideItem.boxCableBonus || 0}
                      onChange={(e) => setEditGuideItem({ ...editGuideItem, boxCableBonus: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-light-muted dark:text-dark-muted mb-1">Device Only Ded.</label>
                    <input
                      type="number"
                      value={editGuideItem.deviceOnlyDeduction || 0}
                      onChange={(e) => setEditGuideItem({ ...editGuideItem, deviceOnlyDeduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddGuideModalOpen(false);
                    setEditGuideItem(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-light-muted dark:text-dark-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition-all"
                >
                  Save Price Guide Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Battery Health Icon Helper
const BatteryChargingIcon: React.FC<{ battery: number }> = ({ battery }) => {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
      <line x1="20" y1="11" x2="20" y2="13" />
      <line x1="5" y1="12" x2={battery > 80 ? "13" : "9"} y2="12" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
};
