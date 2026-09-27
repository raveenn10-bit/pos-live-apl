'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Smartphone, 
  Battery, 
  Eye, 
  Camera, 
  Layers, 
  Lock, 
  Unlock, 
  ArrowRight, 
  RotateCcw, 
  FileText, 
  Calculator, 
  ShieldCheck,
  Sparkles,
  Info,
  DollarSign,
  Tag,
  Barcode
} from 'lucide-react';
import { 
  Customer, 
  PhysicalGrade, 
  ScreenCondition, 
  BackGlassCondition, 
  BiometricStatus, 
  TrueToneStatus, 
  CameraCondition, 
  PartsReplacedStatus, 
  WaterDamageStatus, 
  AccessoriesIncluded,
  TradeInInspection,
  TradeInRecord,
  TradeInPriceGuideItem,
  TradeInCalculationResult
} from '../../types';
import { 
  calculateTradeInValue, 
  findPriceGuideItem, 
  DEFAULT_TRADE_IN_PRICE_GUIDE, 
  CASHIER_OVERRIDE_LIMIT, 
  isManagerApprovalRequired 
} from '../../utils/tradeInCalculator';

interface TradeInInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomer: Customer | null;
  onApplyTradeIn: (record: TradeInRecord) => void;
  existingTradeIn?: TradeInRecord | null;
}

const COMMON_IPHONE_MODELS = [
  'iPhone 16 Pro Max',
  'iPhone 16 Pro',
  'iPhone 16 Plus',
  'iPhone 16',
  'iPhone 15 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15 Plus',
  'iPhone 15',
  'iPhone 14 Pro Max',
  'iPhone 14 Pro',
  'iPhone 14 Plus',
  'iPhone 14',
  'iPhone 13 Pro Max',
  'iPhone 13 Pro',
  'iPhone 13',
  'iPhone 13 mini',
  'iPhone 12 Pro Max',
  'iPhone 12 Pro',
  'iPhone 12',
  'iPhone 12 mini',
  'iPhone 11 Pro Max',
  'iPhone 11 Pro',
  'iPhone 11',
  'iPhone XS Max',
  'iPhone XS',
  'iPhone XR',
  'iPhone X',
];

const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

const COLOR_OPTIONS = [
  'Natural Titanium',
  'Desert Titanium',
  'White Titanium',
  'Black Titanium',
  'Blue Titanium',
  'Deep Purple',
  'Space Black',
  'Midnight',
  'Starlight',
  'Blue',
  'Pink',
  'Green',
  'Yellow',
  'Sierra Blue',
  'Graphite',
  'Gold',
  'Silver',
  'Red (PRODUCT)',
];

export const TradeInInspectionModal: React.FC<TradeInInspectionModalProps> = ({
  isOpen,
  onClose,
  selectedCustomer,
  onApplyTradeIn,
  existingTradeIn,
}) => {
  // Step navigation: 1: Device Info, 2: Condition & Inspection, 3: Valuation & Approval
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Price guide state (fetched from electron DB if available, fallback to defaults)
  const [priceGuide, setPriceGuide] = useState<TradeInPriceGuideItem[]>([]);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Device Info
  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('iPhone 13');
  const [storage, setStorage] = useState('128GB');
  const [color, setColor] = useState('Midnight');
  const [imei1, setImei1] = useState('');
  const [imei2, setImei2] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  // Inspection Checklist
  const [batteryHealth, setBatteryHealth] = useState<number>(86);
  const [physicalGrade, setPhysicalGrade] = useState<PhysicalGrade>('Grade A');
  const [screenCondition, setScreenCondition] = useState<ScreenCondition>('Original Screen / Flawless');
  const [backGlassCondition, setBackGlassCondition] = useState<BackGlassCondition>('Perfect');
  const [faceIdStatus, setFaceIdStatus] = useState<BiometricStatus>('Working');
  const [trueToneStatus, setTrueToneStatus] = useState<TrueToneStatus>('Working');
  const [cameraCondition, setCameraCondition] = useState<CameraCondition>('Flawless');
  const [partsReplaced, setPartsReplaced] = useState<PartsReplacedStatus>('All Original');
  const [waterDamage, setWaterDamage] = useState<WaterDamageStatus>('Normal (White/Silver)');
  const [accessories, setAccessories] = useState<AccessoriesIncluded>('Box and Cable');
  const [staffNotes, setStaffNotes] = useState('');

  // Valuation & Override
  const [customBasePrice, setCustomBasePrice] = useState<number | null>(null);
  const [finalApprovedValue, setFinalApprovedValue] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState('');
  const [managerPin, setManagerPin] = useState('');
  const [isPinAuthorized, setIsPinAuthorized] = useState(false);
  const [pinError, setPinError] = useState('');

  // Load price guide from DB on mount
  useEffect(() => {
    let isMounted = true;
    async function loadGuide() {
      try {
        const electronApi = (window as any).electronAPI;
        if (electronApi?.tradeIn?.getPriceGuide) {
          const res = await electronApi.tradeIn.getPriceGuide();
          if (res?.success && res.data && res.data.length > 0 && isMounted) {
            setPriceGuide(res.data);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not load price guide from electron, using defaults:', err);
      }
      if (isMounted) {
        setPriceGuide(
          DEFAULT_TRADE_IN_PRICE_GUIDE.map((item, idx) => ({
            ...item,
            id: `seed-guide-${idx}`,
          })) as TradeInPriceGuideItem[]
        );
      }
    }

    if (isOpen) {
      loadGuide();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Reset or populate fields
  useEffect(() => {
    if (isOpen) {
      if (existingTradeIn) {
        setCustomerName(existingTradeIn.customerName);
        setCustomerPhone(existingTradeIn.customerPhone);
        setBrand(existingTradeIn.inspection.brand);
        setModel(existingTradeIn.inspection.model);
        setStorage(existingTradeIn.inspection.storage);
        setColor(existingTradeIn.inspection.color);
        setImei1(existingTradeIn.inspection.imei1);
        setImei2(existingTradeIn.inspection.imei2 || '');
        setSerialNumber(existingTradeIn.inspection.serialNumber || '');
        setBatteryHealth(existingTradeIn.inspection.batteryHealth);
        setPhysicalGrade(existingTradeIn.inspection.physicalGrade);
        setScreenCondition(existingTradeIn.inspection.screenCondition);
        setBackGlassCondition(existingTradeIn.inspection.backGlassCondition);
        setFaceIdStatus(existingTradeIn.inspection.faceIdStatus);
        setTrueToneStatus(existingTradeIn.inspection.trueToneStatus);
        setCameraCondition(existingTradeIn.inspection.cameraCondition);
        setPartsReplaced(existingTradeIn.inspection.partsReplaced);
        setWaterDamage(existingTradeIn.inspection.waterDamage);
        setAccessories(existingTradeIn.inspection.accessories);
        setStaffNotes(existingTradeIn.inspection.staffNotes || '');
        setFinalApprovedValue(existingTradeIn.finalApprovedValue);
        setOverrideReason(existingTradeIn.overrideReason || '');
      } else {
        // New inspection
        setCustomerName(selectedCustomer?.name || 'Walk-in Customer');
        setCustomerPhone(selectedCustomer?.phone || '');
        setImei1('');
        setImei2('');
        setSerialNumber('');
        setBatteryHealth(88);
        setPhysicalGrade('Grade A');
        setScreenCondition('Original Screen / Flawless');
        setBackGlassCondition('Perfect');
        setFaceIdStatus('Working');
        setTrueToneStatus('Working');
        setCameraCondition('Flawless');
        setPartsReplaced('All Original');
        setWaterDamage('Normal (White/Silver)');
        setAccessories('Box and Cable');
        setStaffNotes('');
        setCustomBasePrice(null);
        setOverrideReason('');
        setIsPinAuthorized(false);
        setPinError('');
        setActiveStep(1);
      }
    }
  }, [isOpen, existingTradeIn, selectedCustomer]);

  // Current matched price guide item
  const currentGuideItem = useMemo(() => {
    return findPriceGuideItem(priceGuide, model, storage);
  }, [priceGuide, model, storage]);

  // Build inspection object
  const currentInspection: TradeInInspection = useMemo(() => ({
    customerName,
    customerPhone,
    brand,
    model,
    storage,
    color,
    imei1: imei1.trim(),
    imei2: imei2.trim() || undefined,
    serialNumber: serialNumber.trim() || undefined,
    batteryHealth: Number(batteryHealth) || 0,
    physicalGrade,
    screenCondition,
    backGlassCondition,
    faceIdStatus,
    trueToneStatus,
    cameraCondition,
    partsReplaced,
    waterDamage,
    accessories,
    staffNotes: staffNotes.trim() || undefined,
  }), [
    customerName,
    customerPhone,
    brand,
    model,
    storage,
    color,
    imei1,
    imei2,
    serialNumber,
    batteryHealth,
    physicalGrade,
    screenCondition,
    backGlassCondition,
    faceIdStatus,
    trueToneStatus,
    cameraCondition,
    partsReplaced,
    waterDamage,
    accessories,
    staffNotes
  ]);

  // Calculate live rule-based valuation
  const calcResult: TradeInCalculationResult = useMemo(() => {
    return calculateTradeInValue(
      currentInspection, 
      currentGuideItem, 
      customBasePrice || undefined
    );
  }, [currentInspection, currentGuideItem, customBasePrice]);

  // Sync suggestedValue to finalApprovedValue initially or on model/condition change
  useEffect(() => {
    if (!existingTradeIn || activeStep === 1) {
      setFinalApprovedValue(calcResult.suggestedValue);
    }
  }, [calcResult.suggestedValue]);

  // Check if override exceeds cashier limit (± Rs 3,000)
  const isManagerRequired = useMemo(() => {
    return isManagerApprovalRequired(calcResult.suggestedValue, finalApprovedValue);
  }, [calcResult.suggestedValue, finalApprovedValue]);

  const priceDiff = finalApprovedValue - calcResult.suggestedValue;

  const handleVerifyManagerPin = () => {
    // Default system manager PIN is 1234 or store owner PIN
    if (managerPin.trim() === '1234' || managerPin.trim() === '0000') {
      setIsPinAuthorized(true);
      setPinError('');
    } else {
      setPinError('Invalid Manager PIN. Please verify with Store Manager / Owner.');
    }
  };

  const handleConfirmAndApply = () => {
    if (!imei1.trim()) {
      alert('Primary IMEI (IMEI 1) is mandatory to record a trade-in device.');
      setActiveStep(1);
      return;
    }

    if (imei1.trim().length < 14) {
      alert('Please enter a valid 15-digit IMEI number.');
      setActiveStep(1);
      return;
    }

    if (isManagerRequired && !isPinAuthorized) {
      alert(`Value adjustment of LKR ${Math.abs(priceDiff).toLocaleString()} exceeds the Cashier limit (±LKR ${CASHIER_OVERRIDE_LIMIT.toLocaleString()}). Manager PIN authorization is required.`);
      return;
    }

    if (priceDiff !== 0 && !overrideReason.trim()) {
      alert('Please provide a brief reason for the valuation adjustment.');
      return;
    }

    const tradeInNumber = existingTradeIn?.tradeInNumber || `TRD-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: TradeInRecord = {
      id: existingTradeIn?.id || `trd-${Date.now()}`,
      tradeInNumber,
      customerId: selectedCustomer?.id,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim(),
      inspection: currentInspection,
      baseGuidePrice: calcResult.basePrice,
      suggestedValue: calcResult.suggestedValue,
      deductions: calcResult.deductions,
      finalApprovedValue,
      overrideReason: overrideReason.trim() || undefined,
      overrideAuthorizedBy: isPinAuthorized ? 'mgr-1' : undefined,
      overrideAuthorizedByName: isPinAuthorized ? 'Store Manager (Authorized)' : undefined,
      status: existingTradeIn?.status || 'TRADE-IN RECEIVED',
      acquisitionCost: finalApprovedValue,
      refurbishmentCost: existingTradeIn?.refurbishmentCost || 0,
      repairDetails: existingTradeIn?.repairDetails || [],
      trueCost: finalApprovedValue + (existingTradeIn?.refurbishmentCost || 0),
      createdAt: existingTradeIn?.createdAt || new Date().toISOString(),
    };

    onApplyTradeIn(newRecord);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-4xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header Ribbon */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">
                  Phone Trade-In & Exchange Inspection
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Zero AI Hallucination
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Transparent rule-based valuation & automatic pre-owned stock intake
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Tabs */}
        <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-900/60 border-b border-light-border dark:border-dark-border flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1 sm:gap-4">
            <button
              onClick={() => setActiveStep(1)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeStep === 1
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-dark-surface'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">1</span>
              <span>1. Device & Customer</span>
            </button>

            <button
              onClick={() => setActiveStep(2)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeStep === 2
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-dark-surface'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>2. Detailed Inspection</span>
            </button>

            <button
              onClick={() => setActiveStep(3)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeStep === 3
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-dark-surface'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">3</span>
              <span>3. Valuation & Approval</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
            <span className="text-light-muted dark:text-dark-muted">Estimated Value:</span>
            <span className="font-black text-brand-500">
              LKR {calcResult.suggestedValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: Device Specs & Customer Identification */}
          {activeStep === 1 && (
            <div className="space-y-5">
              {/* Customer Box */}
              <div className="p-4 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-500" />
                    <span>Customer Information</span>
                  </div>
                  {selectedCustomer && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 font-bold">
                      Linked to POS Customer
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Kasun Fernando"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 077 123 4567"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Device Specs Selection */}
              <div className="p-4 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  <span>Device Identity & Specifications</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Brand */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Model Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Model *
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-bold text-slate-900 dark:text-white"
                    >
                      {COMMON_IPHONE_MODELS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Storage */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Storage Capacity *
                    </label>
                    <select
                      value={storage}
                      onChange={(e) => setStorage(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-bold text-slate-900 dark:text-white"
                    >
                      {STORAGE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Color and Dual IMEIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Color */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Device Color
                    </label>
                    <input
                      type="text"
                      list="color-presets"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g. Sierra Blue"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                    />
                    <datalist id="color-presets">
                      {COLOR_OPTIONS.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>

                  {/* IMEI 1 */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                      <span>IMEI 1 (Required) *</span>
                      <span className="font-mono text-[9px] text-light-muted">
                        {imei1.length}/15
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={16}
                        value={imei1}
                        onChange={(e) => setImei1(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="354890091234567"
                        className="w-full pl-8 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                      />
                      <Barcode className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {/* IMEI 2 */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      IMEI 2 / eSIM (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={imei2}
                      onChange={(e) => setImei2(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Secondary IMEI / eSIM"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Serial Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Apple Serial Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. F2LLN8..."
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white uppercase"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs">
                    <Info className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                      Base Trade-In Price Guide for <span className="font-bold text-slate-900 dark:text-white">{model} ({storage})</span>: <span className="font-mono font-bold text-indigo-500">LKR {calcResult.basePrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Detailed Technical Inspection Checklist */}
          {activeStep === 2 && (
            <div className="space-y-5">
              {/* Battery Health Section */}
              <div className="p-4 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Battery className="w-4 h-4 text-emerald-500" />
                    <span>Battery Health (%)</span>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                    batteryHealth >= 85 ? 'bg-emerald-500/10 text-emerald-500' :
                    batteryHealth >= 80 ? 'bg-amber-500/10 text-amber-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {batteryHealth}% Capacity {batteryHealth < 80 ? '(Service Needed)' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={batteryHealth}
                    onChange={(e) => setBatteryHealth(Number(e.target.value))}
                    className="flex-1 accent-brand-500 cursor-pointer"
                  />
                  <div className="w-16">
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={batteryHealth}
                      onChange={(e) => setBatteryHealth(Number(e.target.value))}
                      className="w-full px-2 py-1 text-center font-mono font-bold text-xs rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-light-muted dark:text-dark-muted font-mono">
                  <span>Below 80%: Service Deduct</span>
                  <span>80% - 84%: Moderate Deduct</span>
                  <span>85% - 89%: Minor Deduct</span>
                  <span>90% - 100%: 100% Value</span>
                </div>
              </div>

              {/* Physical Grade & Screen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Physical Grade */}
                <div className="p-4 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Physical Housing Grade
                  </label>
                  <select
                    value={physicalGrade}
                    onChange={(e) => setPhysicalGrade(e.target.value as PhysicalGrade)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Grade A">Grade A — Flawless / Pristine condition</option>
                    <option value="Grade B">Grade B — Light micro-scratches on casing</option>
                    <option value="Grade C">Grade C — Noticeable dents, paint chips or scuffs</option>
                    <option value="Grade D">Grade D — Heavy wear / frame bend / salvage</option>
                  </select>
                </div>

                {/* Screen Condition */}
                <div className="p-4 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Display Screen Glass
                  </label>
                  <select
                    value={screenCondition}
                    onChange={(e) => setScreenCondition(e.target.value as ScreenCondition)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Original Screen / Flawless">Flawless Original Glass</option>
                    <option value="Minor Scratches">Minor Surface Scratches</option>
                    <option value="Heavy Scratches">Deep / Fingernail Scratches</option>
                    <option value="Cracked Glass">Cracked Outer Glass (Touch OK)</option>
                    <option value="Display Replacement">Aftermarket / Non-Original Panel</option>
                    <option value="Dead Pixels / Lines">Dead Pixels / OLED Green Lines / Bleed</option>
                  </select>
                </div>
              </div>

              {/* Back Glass & Biometrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Back Glass */}
                <div className="p-4 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Back Housing Glass
                  </label>
                  <select
                    value={backGlassCondition}
                    onChange={(e) => setBackGlassCondition(e.target.value as BackGlassCondition)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Perfect">Perfect / No Scratches</option>
                    <option value="Scratched">Scratched Back Glass</option>
                    <option value="Cracked">Cracked / Shattered Back Glass</option>
                  </select>
                </div>

                {/* Face ID / Touch ID */}
                <div className="p-4 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Face ID / Touch ID</span>
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                  </label>
                  <select
                    value={faceIdStatus}
                    onChange={(e) => setFaceIdStatus(e.target.value as BiometricStatus)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Working">✓ Working Normally</option>
                    <option value="Defective / Unavailable">✗ Defective / Not Working</option>
                  </select>
                </div>
              </div>

              {/* True Tone & Camera */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* True Tone */}
                <div className="p-4 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    True Tone Status
                  </label>
                  <select
                    value={trueToneStatus}
                    onChange={(e) => setTrueToneStatus(e.target.value as TrueToneStatus)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Working">✓ True Tone Active & Working</option>
                    <option value="Missing / Disabled">✗ Missing / Disabled (Screen Swap)</option>
                  </select>
                </div>

                {/* Camera */}
                <div className="p-4 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Camera Lenses & Sensors</span>
                    <Camera className="w-3.5 h-3.5 text-purple-500" />
                  </label>
                  <select
                    value={cameraCondition}
                    onChange={(e) => setCameraCondition(e.target.value as CameraCondition)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Flawless">✓ All Cameras Working (1x, 0.5x, 3x)</option>
                    <option value="Cracked Lens">Cracked Sapphire Lens Glass</option>
                    <option value="0.5x / 1x / 3x Camera Issue">Sensor Issue / OIS Shake / Black Camera</option>
                  </select>
                </div>
              </div>

              {/* Replaced Parts & Water Indicator */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Parts Replaced */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Parts Replaced Warning
                  </label>
                  <select
                    value={partsReplaced}
                    onChange={(e) => setPartsReplaced(e.target.value as PartsReplacedStatus)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="All Original">All Original Parts</option>
                    <option value="Battery Replaced">Battery Replaced</option>
                    <option value="Screen Replaced">Screen Replaced</option>
                    <option value="Housing Replaced">Housing Replaced</option>
                    <option value="Camera Replaced">Camera Replaced</option>
                  </select>
                </div>

                {/* Water Damage LDI */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Liquid Contact Indicator (LDI)
                  </label>
                  <select
                    value={waterDamage}
                    onChange={(e) => setWaterDamage(e.target.value as WaterDamageStatus)}
                    className={`w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border font-bold ${
                      waterDamage.includes('Triggered') 
                        ? 'border-red-500 text-red-500 bg-red-500/5' 
                        : 'border-light-border dark:border-dark-border text-slate-900 dark:text-white'
                    }`}
                  >
                    <option value="Normal (White/Silver)">Clear / White (Normal)</option>
                    <option value="Triggered (Red/Pink)">⚠️ Triggered (Red/Pink) - Liquid Contact</option>
                  </select>
                </div>

                {/* Accessories Included */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Accessories Included
                  </label>
                  <select
                    value={accessories}
                    onChange={(e) => setAccessories(e.target.value as AccessoriesIncluded)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Complete Full Set">Complete Full Set (Box + Cable)</option>
                    <option value="Box and Cable">Original Box & Cable</option>
                    <option value="Original Box">Original Box Only</option>
                    <option value="Original Cable">Original Cable Only</option>
                    <option value="Device Only">Device Only (No Box/Cable)</option>
                  </select>
                </div>
              </div>

              {/* Staff Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Technician / Diagnostic Notes
                </label>
                <textarea
                  rows={2}
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  placeholder="e.g. Minor scratches on top edge, battery replaced by official AppleCare, all sensors passed bench test."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Transparent Valuation & Manager Audit Override */}
          {activeStep === 3 && (
            <div className="space-y-5">
              {/* Device Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-300">
                    Trade-In Unit
                  </div>
                  <div className="text-lg font-black">
                    {model} <span className="text-indigo-300 font-mono font-normal">({storage} - {color})</span>
                  </div>
                  <div className="text-xs text-slate-300 font-mono mt-0.5">
                    IMEI: {imei1 || 'Not entered'} | Battery: {batteryHealth}% | {physicalGrade}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-indigo-300 font-mono">
                    Base Guide Price
                  </div>
                  <div className="text-xl font-mono font-black text-white">
                    LKR {calcResult.basePrice.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Transparent Deductions Matrix Breakdown */}
              <div className="p-4 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-3">
                <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-brand-500" />
                    <span>Transparent Deduction Matrix</span>
                  </div>
                  <span className="text-[10px] text-light-muted dark:text-dark-muted font-mono">
                    {calcResult.deductions.length} rule evaluation(s)
                  </span>
                </div>

                {calcResult.deductions.length === 0 ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Flawless Grade A unit! Full 100% Base Guide Value approved with zero deductions.</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {calcResult.deductions.map((d, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {d.label}
                          </div>
                          <div className="text-[10px] text-light-muted dark:text-dark-muted">
                            {d.reason}
                          </div>
                        </div>
                        <div className={`font-mono font-bold text-xs ${
                          d.amount < 0 ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {d.amount < 0 
                            ? `+LKR ${Math.abs(d.amount).toLocaleString()} (Bonus)` 
                            : `-LKR ${d.amount.toLocaleString()}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subtotals & Suggested Value */}
                <div className="pt-2 border-t border-light-border dark:border-dark-border space-y-1 text-xs">
                  <div className="flex justify-between text-light-muted dark:text-dark-muted">
                    <span>Base Guide Price:</span>
                    <span className="font-mono">LKR {calcResult.basePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>Total Deductions & Refurbishment Offsets:</span>
                    <span className="font-mono">-LKR {calcResult.totalDeductions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1 border-t border-light-border dark:border-dark-border">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Suggested Rule-Based Trade-In Value:
                    </span>
                    <span className="font-mono font-black text-lg text-emerald-500">
                      LKR {calcResult.suggestedValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Override & Dual Audit Logging */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    <span>Final Approved Trade-In Credit</span>
                  </div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-mono">
                    Cashier Tolerance: ±LKR {CASHIER_OVERRIDE_LIMIT.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Approved Trade-In Value (LKR)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={finalApprovedValue}
                        onChange={(e) => setFinalApprovedValue(Number(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2.5 text-base font-mono font-black rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                      />
                      <DollarSign className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border">
                    <div className="text-[10px] font-semibold text-light-muted dark:text-dark-muted">
                      Adjustment Difference:
                    </div>
                    <div className={`text-base font-mono font-bold ${
                      priceDiff === 0 ? 'text-slate-600 dark:text-slate-400' :
                      priceDiff > 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {priceDiff > 0 ? `+LKR ${priceDiff.toLocaleString()} (Boost)` :
                       priceDiff < 0 ? `-LKR ${Math.abs(priceDiff).toLocaleString()} (Discount)` :
                       'Exact Suggested Value (0 difference)'}
                    </div>
                  </div>
                </div>

                {/* If price difference exists, reason is required */}
                {priceDiff !== 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Override / Adjustment Reason *
                    </label>
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. VIP Customer purchase bonus, negotiated battery discount"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {/* Manager Authorization Prompt if diff > limit */}
                {isManagerRequired && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Manager / Owner Authorization Required</span>
                    </div>
                    <p className="text-[11px] text-red-700 dark:text-red-300 leading-tight">
                      The adjustment of <span className="font-mono font-bold">LKR {Math.abs(priceDiff).toLocaleString()}</span> exceeds the cashier threshold of ±LKR {CASHIER_OVERRIDE_LIMIT.toLocaleString()}. Enter Store Manager PIN (Default: 1234) to authorize.
                    </p>

                    <div className="flex items-center gap-2 max-w-sm">
                      <div className="relative flex-1">
                        <input
                          type="password"
                          value={managerPin}
                          onChange={(e) => setManagerPin(e.target.value)}
                          placeholder="Manager PIN"
                          className="w-full pl-8 pr-3 py-1.5 text-xs font-mono font-bold rounded-xl bg-white dark:bg-dark-card border border-red-300 dark:border-red-800 text-slate-900 dark:text-white"
                        />
                        <Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyManagerPin}
                        className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                      >
                        Authorize
                      </button>
                    </div>

                    {isPinAuthorized && (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Manager Authorization Verified & Logged</span>
                      </div>
                    )}

                    {pinError && (
                      <div className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                        {pinError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation & Confirmation */}
        <div className="px-6 py-4 bg-light-surface/60 dark:bg-dark-surface/60 border-t border-light-border dark:border-dark-border flex items-center justify-between">
          <div>
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>

            {activeStep < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (activeStep === 1 && !imei1.trim()) {
                    alert('Please enter IMEI 1 to continue');
                    return;
                  }
                  setActiveStep((prev) => (prev + 1) as 1 | 2 | 3);
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-500/25 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmAndApply}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply LKR {finalApprovedValue.toLocaleString()} Trade-In to Cart</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
