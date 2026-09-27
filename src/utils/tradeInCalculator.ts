/**
 * AppleVision Store Galle - Phone Trade-In & Exchange Calculator
 * 
 * STRICT RULE-BASED ENGINE:
 * 1. ZERO AI price hallucinations or invented values.
 * 2. Transparent mathematical deduction matrix based on Owner-configured Price Guide.
 * 3. Itemized deduction breakdown with clear explanations.
 * 4. Dual auditing: Suggested Value vs Final Approved Value with authorization tracking.
 */

import {
  TradeInInspection,
  TradeInCalculationResult,
  TradeInDeductionItem,
  TradeInPriceGuideItem,
} from '../types';

/**
 * Default fallback price guide for major Apple iPhone models (in LKR)
 * Configurable and editable by Owner / Manager in the Trade-In management view.
 */
export const DEFAULT_TRADE_IN_PRICE_GUIDE: Omit<TradeInPriceGuideItem, 'id'>[] = [
  // iPhone 11 Series
  { brand: 'Apple', model: 'iPhone 11', storage: '64GB', basePrice: 75000, gradeBDeduction: 5000, gradeCDeduction: 12000, gradeDDeduction: 25000, battery89_85Deduction: 2500, battery84_80Deduction: 5000, batteryUnder80Deduction: 9000, screenMinorDeduction: 3000, screenHeavyDeduction: 7000, screenCrackedDeduction: 16000, screenReplacedDeduction: 10000, backGlassCrackedDeduction: 7000, faceIdDefectiveDeduction: 15000, trueToneMissingDeduction: 4000, cameraIssueDeduction: 12000, waterDamageDeduction: 30000, boxCableBonus: 2000, deviceOnlyDeduction: 2000 },
  { brand: 'Apple', model: 'iPhone 11', storage: '128GB', basePrice: 85000, gradeBDeduction: 5000, gradeCDeduction: 12000, gradeDDeduction: 25000, battery89_85Deduction: 2500, battery84_80Deduction: 5000, batteryUnder80Deduction: 9000, screenMinorDeduction: 3000, screenHeavyDeduction: 7000, screenCrackedDeduction: 16000, screenReplacedDeduction: 10000, backGlassCrackedDeduction: 7000, faceIdDefectiveDeduction: 15000, trueToneMissingDeduction: 4000, cameraIssueDeduction: 12000, waterDamageDeduction: 30000, boxCableBonus: 2000, deviceOnlyDeduction: 2000 },
  { brand: 'Apple', model: 'iPhone 11 Pro', storage: '64GB', basePrice: 95000, gradeBDeduction: 6000, gradeCDeduction: 15000, gradeDDeduction: 30000, battery89_85Deduction: 3000, battery84_80Deduction: 6000, batteryUnder80Deduction: 10000, screenMinorDeduction: 3500, screenHeavyDeduction: 8000, screenCrackedDeduction: 18000, screenReplacedDeduction: 12000, backGlassCrackedDeduction: 8000, faceIdDefectiveDeduction: 18000, trueToneMissingDeduction: 5000, cameraIssueDeduction: 15000, waterDamageDeduction: 35000, boxCableBonus: 2000, deviceOnlyDeduction: 2000 },
  { brand: 'Apple', model: 'iPhone 11 Pro', storage: '256GB', basePrice: 110000, gradeBDeduction: 6000, gradeCDeduction: 15000, gradeDDeduction: 30000, battery89_85Deduction: 3000, battery84_80Deduction: 6000, batteryUnder80Deduction: 10000, screenMinorDeduction: 3500, screenHeavyDeduction: 8000, screenCrackedDeduction: 18000, screenReplacedDeduction: 12000, backGlassCrackedDeduction: 8000, faceIdDefectiveDeduction: 18000, trueToneMissingDeduction: 5000, cameraIssueDeduction: 15000, waterDamageDeduction: 35000, boxCableBonus: 2000, deviceOnlyDeduction: 2000 },
  { brand: 'Apple', model: 'iPhone 11 Pro Max', storage: '64GB', basePrice: 110000, gradeBDeduction: 6000, gradeCDeduction: 15000, gradeDDeduction: 30000, battery89_85Deduction: 3000, battery84_80Deduction: 6000, batteryUnder80Deduction: 10000, screenMinorDeduction: 4000, screenHeavyDeduction: 9000, screenCrackedDeduction: 22000, screenReplacedDeduction: 14000, backGlassCrackedDeduction: 9000, faceIdDefectiveDeduction: 18000, trueToneMissingDeduction: 5000, cameraIssueDeduction: 15000, waterDamageDeduction: 35000, boxCableBonus: 2000, deviceOnlyDeduction: 2000 },
  { brand: 'Apple', model: 'iPhone 11 Pro Max', storage: '256GB', basePrice: 125000, gradeBDeduction: 6000, gradeCDeduction: 15000, gradeDDeduction: 30000, battery89_85Deduction: 3000, battery84_80Deduction: 6000, batteryUnder80Deduction: 10000, screenMinorDeduction: 4000, screenHeavyDeduction: 9000, screenCrackedDeduction: 22000, screenReplacedDeduction: 14000, backGlassCrackedDeduction: 9000, faceIdDefectiveDeduction: 18000, trueToneMissingDeduction: 5000, cameraIssueDeduction: 15000, waterDamageDeduction: 35000, boxCableBonus: 2000, deviceOnlyDeduction: 2000 },

  // iPhone 12 Series
  { brand: 'Apple', model: 'iPhone 12 mini', storage: '64GB', basePrice: 80000, gradeBDeduction: 5000, gradeCDeduction: 12000, gradeDDeduction: 25000, battery89_85Deduction: 2500, battery84_80Deduction: 5000, batteryUnder80Deduction: 9000, screenMinorDeduction: 3000, screenHeavyDeduction: 7000, screenCrackedDeduction: 18000, screenReplacedDeduction: 12000, backGlassCrackedDeduction: 7000, faceIdDefectiveDeduction: 16000, trueToneMissingDeduction: 4000, cameraIssueDeduction: 12000, waterDamageDeduction: 30000, boxCableBonus: 2000, deviceOnlyDeduction: 2000 },
  { brand: 'Apple', model: 'iPhone 12 mini', storage: '128GB', basePrice: 90000, gradeBDeduction: 5000, gradeCDeduction: 12000, gradeDDeduction: 25000, battery89_85Deduction: 2500, battery84_80Deduction: 5000, batteryUnder80Deduction: 9000, screenMinorDeduction: 3000, screenHeavyDeduction: 7000, screenCrackedDeduction: 18000, screenReplacedDeduction: 12000, backGlassCrackedDeduction: 7000, faceIdDefectiveDeduction: 16000, trueToneMissingDeduction: 4000, cameraIssueDeduction: 12000, waterDamageDeduction: 30000, boxCableBonus: 2000, deviceOnlyDeduction: 2000 },
  { brand: 'Apple', model: 'iPhone 12', storage: '64GB', basePrice: 95000, gradeBDeduction: 5000, gradeCDeduction: 14000, gradeDDeduction: 28000, battery89_85Deduction: 2500, battery84_80Deduction: 5000, batteryUnder80Deduction: 9000, screenMinorDeduction: 3500, screenHeavyDeduction: 8000, screenCrackedDeduction: 20000, screenReplacedDeduction: 12000, backGlassCrackedDeduction: 8000, faceIdDefectiveDeduction: 16000, trueToneMissingDeduction: 4500, cameraIssueDeduction: 14000, waterDamageDeduction: 32000, boxCableBonus: 2000, deviceOnlyDeduction: 2000 },
  { brand: 'Apple', model: 'iPhone 12', storage: '128GB', basePrice: 110000, gradeBDeduction: 5000, gradeCDeduction: 14000, gradeDDeduction: 28000, battery89_85Deduction: 2500, battery84_80Deduction: 5000, batteryUnder80Deduction: 9000, screenMinorDeduction: 3500, screenHeavyDeduction: 8000, screenCrackedDeduction: 20000, screenReplacedDeduction: 12000, backGlassCrackedDeduction: 8000, faceIdDefectiveDeduction: 16000, trueToneMissingDeduction: 4500, cameraIssueDeduction: 14000, waterDamageDeduction: 32000, boxCableBonus: 2000, deviceOnlyDeduction: 2000 },
  { brand: 'Apple', model: 'iPhone 12 Pro', storage: '128GB', basePrice: 125000, gradeBDeduction: 6000, gradeCDeduction: 16000, gradeDDeduction: 32000, battery89_85Deduction: 3000, battery84_80Deduction: 6000, batteryUnder80Deduction: 10000, screenMinorDeduction: 4000, screenHeavyDeduction: 9000, screenCrackedDeduction: 24000, screenReplacedDeduction: 14000, backGlassCrackedDeduction: 9000, faceIdDefectiveDeduction: 18000, trueToneMissingDeduction: 5000, cameraIssueDeduction: 16000, waterDamageDeduction: 35000, boxCableBonus: 2500, deviceOnlyDeduction: 2500 },
  { brand: 'Apple', model: 'iPhone 12 Pro', storage: '256GB', basePrice: 138000, gradeBDeduction: 6000, gradeCDeduction: 16000, gradeDDeduction: 32000, battery89_85Deduction: 3000, battery84_80Deduction: 6000, batteryUnder80Deduction: 10000, screenMinorDeduction: 4000, screenHeavyDeduction: 9000, screenCrackedDeduction: 24000, screenReplacedDeduction: 14000, backGlassCrackedDeduction: 9000, faceIdDefectiveDeduction: 18000, trueToneMissingDeduction: 5000, cameraIssueDeduction: 16000, waterDamageDeduction: 35000, boxCableBonus: 2500, deviceOnlyDeduction: 2500 },
  { brand: 'Apple', model: 'iPhone 12 Pro Max', storage: '128GB', basePrice: 145000, gradeBDeduction: 7000, gradeCDeduction: 18000, gradeDDeduction: 35000, battery89_85Deduction: 3000, battery84_80Deduction: 6000, batteryUnder80Deduction: 10000, screenMinorDeduction: 4500, screenHeavyDeduction: 10000, screenCrackedDeduction: 26000, screenReplacedDeduction: 16000, backGlassCrackedDeduction: 10000, faceIdDefectiveDeduction: 18000, trueToneMissingDeduction: 5000, cameraIssueDeduction: 18000, waterDamageDeduction: 40000, boxCableBonus: 2500, deviceOnlyDeduction: 2500 },
  { brand: 'Apple', model: 'iPhone 12 Pro Max', storage: '256GB', basePrice: 160000, gradeBDeduction: 7000, gradeCDeduction: 18000, gradeDDeduction: 35000, battery89_85Deduction: 3000, battery84_80Deduction: 6000, batteryUnder80Deduction: 10000, screenMinorDeduction: 4500, screenHeavyDeduction: 10000, screenCrackedDeduction: 26000, screenReplacedDeduction: 16000, backGlassCrackedDeduction: 10000, faceIdDefectiveDeduction: 18000, trueToneMissingDeduction: 5000, cameraIssueDeduction: 18000, waterDamageDeduction: 40000, boxCableBonus: 2500, deviceOnlyDeduction: 2500 },

  // iPhone 13 Series
  { brand: 'Apple', model: 'iPhone 13 mini', storage: '128GB', basePrice: 115000, gradeBDeduction: 5000, gradeCDeduction: 14000, gradeDDeduction: 28000, battery89_85Deduction: 2500, battery84_80Deduction: 5000, batteryUnder80Deduction: 9000, screenMinorDeduction: 3500, screenHeavyDeduction: 8000, screenCrackedDeduction: 20000, screenReplacedDeduction: 13000, backGlassCrackedDeduction: 8000, faceIdDefectiveDeduction: 16000, trueToneMissingDeduction: 4500, cameraIssueDeduction: 14000, waterDamageDeduction: 32000, boxCableBonus: 2000, deviceOnlyDeduction: 2000 },
  { brand: 'Apple', model: 'iPhone 13', storage: '128GB', basePrice: 125000, gradeBDeduction: 5000, gradeCDeduction: 15000, gradeDDeduction: 30000, battery89_85Deduction: 3000, battery84_80Deduction: 6000, batteryUnder80Deduction: 10000, screenMinorDeduction: 3500, screenHeavyDeduction: 8000, screenCrackedDeduction: 20000, screenReplacedDeduction: 14000, backGlassCrackedDeduction: 8000, faceIdDefectiveDeduction: 18000, trueToneMissingDeduction: 5000, cameraIssueDeduction: 15000, waterDamageDeduction: 35000, boxCableBonus: 2000, deviceOnlyDeduction: 2000 },
  { brand: 'Apple', model: 'iPhone 13', storage: '256GB', basePrice: 140000, gradeBDeduction: 5000, gradeCDeduction: 15000, gradeDDeduction: 30000, battery89_85Deduction: 3000, battery84_80Deduction: 6000, batteryUnder80Deduction: 10000, screenMinorDeduction: 3500, screenHeavyDeduction: 8000, screenCrackedDeduction: 20000, screenReplacedDeduction: 14000, backGlassCrackedDeduction: 8000, faceIdDefectiveDeduction: 18000, trueToneMissingDeduction: 5000, cameraIssueDeduction: 15000, waterDamageDeduction: 35000, boxCableBonus: 2000, deviceOnlyDeduction: 2000 },
  { brand: 'Apple', model: 'iPhone 13 Pro', storage: '128GB', basePrice: 155000, gradeBDeduction: 7000, gradeCDeduction: 18000, gradeDDeduction: 36000, battery89_85Deduction: 3000, battery84_80Deduction: 6000, batteryUnder80Deduction: 11000, screenMinorDeduction: 4500, screenHeavyDeduction: 10000, screenCrackedDeduction: 28000, screenReplacedDeduction: 18000, backGlassCrackedDeduction: 10000, faceIdDefectiveDeduction: 20000, trueToneMissingDeduction: 5500, cameraIssueDeduction: 18000, waterDamageDeduction: 40000, boxCableBonus: 2500, deviceOnlyDeduction: 2500 },
  { brand: 'Apple', model: 'iPhone 13 Pro Max', storage: '128GB', basePrice: 175000, gradeBDeduction: 8000, gradeCDeduction: 20000, gradeDDeduction: 40000, battery89_85Deduction: 3500, battery84_80Deduction: 7000, batteryUnder80Deduction: 12000, screenMinorDeduction: 5000, screenHeavyDeduction: 12000, screenCrackedDeduction: 32000, screenReplacedDeduction: 20000, backGlassCrackedDeduction: 11000, faceIdDefectiveDeduction: 22000, trueToneMissingDeduction: 6000, cameraIssueDeduction: 20000, waterDamageDeduction: 45000, boxCableBonus: 3000, deviceOnlyDeduction: 3000 },
  { brand: 'Apple', model: 'iPhone 13 Pro Max', storage: '256GB', basePrice: 190000, gradeBDeduction: 8000, gradeCDeduction: 20000, gradeDDeduction: 40000, battery89_85Deduction: 3500, battery84_80Deduction: 7000, batteryUnder80Deduction: 12000, screenMinorDeduction: 5000, screenHeavyDeduction: 12000, screenCrackedDeduction: 32000, screenReplacedDeduction: 20000, backGlassCrackedDeduction: 11000, faceIdDefectiveDeduction: 22000, trueToneMissingDeduction: 6000, cameraIssueDeduction: 20000, waterDamageDeduction: 45000, boxCableBonus: 3000, deviceOnlyDeduction: 3000 },

  // iPhone 14 Series
  { brand: 'Apple', model: 'iPhone 14', storage: '128GB', basePrice: 155000, gradeBDeduction: 6000, gradeCDeduction: 18000, gradeDDeduction: 35000, battery89_85Deduction: 3000, battery84_80Deduction: 6000, batteryUnder80Deduction: 11000, screenMinorDeduction: 4000, screenHeavyDeduction: 9000, screenCrackedDeduction: 24000, screenReplacedDeduction: 15000, backGlassCrackedDeduction: 9000, faceIdDefectiveDeduction: 18000, trueToneMissingDeduction: 5000, cameraIssueDeduction: 16000, waterDamageDeduction: 40000, boxCableBonus: 2500, deviceOnlyDeduction: 2500 },
  { brand: 'Apple', model: 'iPhone 14 Pro', storage: '128GB', basePrice: 195000, gradeBDeduction: 8000, gradeCDeduction: 22000, gradeDDeduction: 45000, battery89_85Deduction: 3500, battery84_80Deduction: 7500, batteryUnder80Deduction: 13000, screenMinorDeduction: 5500, screenHeavyDeduction: 13000, screenCrackedDeduction: 35000, screenReplacedDeduction: 22000, backGlassCrackedDeduction: 12000, faceIdDefectiveDeduction: 25000, trueToneMissingDeduction: 6500, cameraIssueDeduction: 22000, waterDamageDeduction: 50000, boxCableBonus: 3000, deviceOnlyDeduction: 3000 },
  { brand: 'Apple', model: 'iPhone 14 Pro Max', storage: '128GB', basePrice: 215000, gradeBDeduction: 9000, gradeCDeduction: 25000, gradeDDeduction: 50000, battery89_85Deduction: 4000, battery84_80Deduction: 8000, batteryUnder80Deduction: 14000, screenMinorDeduction: 6000, screenHeavyDeduction: 15000, screenCrackedDeduction: 38000, screenReplacedDeduction: 25000, backGlassCrackedDeduction: 13000, faceIdDefectiveDeduction: 26000, trueToneMissingDeduction: 7000, cameraIssueDeduction: 25000, waterDamageDeduction: 55000, boxCableBonus: 3500, deviceOnlyDeduction: 3500 },
  { brand: 'Apple', model: 'iPhone 14 Pro Max', storage: '256GB', basePrice: 230000, gradeBDeduction: 9000, gradeCDeduction: 25000, gradeDDeduction: 50000, battery89_85Deduction: 4000, battery84_80Deduction: 8000, batteryUnder80Deduction: 14000, screenMinorDeduction: 6000, screenHeavyDeduction: 15000, screenCrackedDeduction: 38000, screenReplacedDeduction: 25000, backGlassCrackedDeduction: 13000, faceIdDefectiveDeduction: 26000, trueToneMissingDeduction: 7000, cameraIssueDeduction: 25000, waterDamageDeduction: 55000, boxCableBonus: 3500, deviceOnlyDeduction: 3500 },

  // iPhone 15 Series
  { brand: 'Apple', model: 'iPhone 15', storage: '128GB', basePrice: 195000, gradeBDeduction: 7000, gradeCDeduction: 20000, gradeDDeduction: 40000, battery89_85Deduction: 3500, battery84_80Deduction: 7000, batteryUnder80Deduction: 12000, screenMinorDeduction: 5000, screenHeavyDeduction: 12000, screenCrackedDeduction: 30000, screenReplacedDeduction: 18000, backGlassCrackedDeduction: 11000, faceIdDefectiveDeduction: 22000, trueToneMissingDeduction: 6000, cameraIssueDeduction: 20000, waterDamageDeduction: 45000, boxCableBonus: 3000, deviceOnlyDeduction: 3000 },
  { brand: 'Apple', model: 'iPhone 15 Pro', storage: '128GB', basePrice: 245000, gradeBDeduction: 10000, gradeCDeduction: 28000, gradeDDeduction: 55000, battery89_85Deduction: 4000, battery84_80Deduction: 8500, batteryUnder80Deduction: 15000, screenMinorDeduction: 6500, screenHeavyDeduction: 16000, screenCrackedDeduction: 42000, screenReplacedDeduction: 26000, backGlassCrackedDeduction: 14000, faceIdDefectiveDeduction: 28000, trueToneMissingDeduction: 7500, cameraIssueDeduction: 26000, waterDamageDeduction: 60000, boxCableBonus: 4000, deviceOnlyDeduction: 4000 },
  { brand: 'Apple', model: 'iPhone 15 Pro Max', storage: '256GB', basePrice: 280000, gradeBDeduction: 12000, gradeCDeduction: 32000, gradeDDeduction: 65000, battery89_85Deduction: 5000, battery84_80Deduction: 10000, batteryUnder80Deduction: 18000, screenMinorDeduction: 8000, screenHeavyDeduction: 18000, screenCrackedDeduction: 48000, screenReplacedDeduction: 30000, backGlassCrackedDeduction: 16000, faceIdDefectiveDeduction: 32000, trueToneMissingDeduction: 8500, cameraIssueDeduction: 30000, waterDamageDeduction: 70000, boxCableBonus: 5000, deviceOnlyDeduction: 5000 },

  // iPhone 16 Series
  { brand: 'Apple', model: 'iPhone 16', storage: '128GB', basePrice: 235000, gradeBDeduction: 8000, gradeCDeduction: 24000, gradeDDeduction: 48000, battery89_85Deduction: 4000, battery84_80Deduction: 8000, batteryUnder80Deduction: 14000, screenMinorDeduction: 6000, screenHeavyDeduction: 14000, screenCrackedDeduction: 36000, screenReplacedDeduction: 22000, backGlassCrackedDeduction: 12000, faceIdDefectiveDeduction: 25000, trueToneMissingDeduction: 7000, cameraIssueDeduction: 22000, waterDamageDeduction: 55000, boxCableBonus: 3500, deviceOnlyDeduction: 3500 },
  { brand: 'Apple', model: 'iPhone 16 Pro', storage: '128GB', basePrice: 300000, gradeBDeduction: 12000, gradeCDeduction: 35000, gradeDDeduction: 70000, battery89_85Deduction: 5000, battery84_80Deduction: 10000, batteryUnder80Deduction: 18000, screenMinorDeduction: 8000, screenHeavyDeduction: 20000, screenCrackedDeduction: 50000, screenReplacedDeduction: 32000, backGlassCrackedDeduction: 18000, faceIdDefectiveDeduction: 35000, trueToneMissingDeduction: 9000, cameraIssueDeduction: 32000, waterDamageDeduction: 75000, boxCableBonus: 5000, deviceOnlyDeduction: 5000 },
  { brand: 'Apple', model: 'iPhone 16 Pro Max', storage: '256GB', basePrice: 345000, gradeBDeduction: 15000, gradeCDeduction: 40000, gradeDDeduction: 80000, battery89_85Deduction: 6000, battery84_80Deduction: 12000, batteryUnder80Deduction: 20000, screenMinorDeduction: 10000, screenHeavyDeduction: 22000, screenCrackedDeduction: 55000, screenReplacedDeduction: 35000, backGlassCrackedDeduction: 20000, faceIdDefectiveDeduction: 38000, trueToneMissingDeduction: 10000, cameraIssueDeduction: 35000, waterDamageDeduction: 85000, boxCableBonus: 5000, deviceOnlyDeduction: 5000 },
];

/**
 * Find matching price guide item for model + storage
 */
export function findPriceGuideItem(
  guide: TradeInPriceGuideItem[],
  model: string,
  storage: string
): TradeInPriceGuideItem | undefined {
  const normModel = model.trim().toLowerCase();
  const normStorage = storage.trim().toLowerCase();

  return guide.find(
    item =>
      item.model.trim().toLowerCase() === normModel &&
      item.storage.trim().toLowerCase() === normStorage
  ) || guide.find(
    item =>
      normModel.includes(item.model.trim().toLowerCase()) &&
      item.storage.trim().toLowerCase() === normStorage
  );
}

/**
 * Calculate transparent suggested trade-in value based on inspection and price guide
 */
export function calculateTradeInValue(
  inspection: TradeInInspection,
  guideItem?: TradeInPriceGuideItem,
  customBasePrice?: number
): TradeInCalculationResult {
  const basePrice = customBasePrice ?? guideItem?.basePrice ?? 100000;
  const deductions: TradeInDeductionItem[] = [];

  // Fallback deduction amounts if not provided by price guide item
  const gBDed = guideItem?.gradeBDeduction ?? 5000;
  const gCDed = guideItem?.gradeCDeduction ?? 15000;
  const gDDed = guideItem?.gradeDDeduction ?? 30000;

  const b89_85 = guideItem?.battery89_85Deduction ?? 3000;
  const b84_80 = guideItem?.battery84_80Deduction ?? 6000;
  const bUnder80 = guideItem?.batteryUnder80Deduction ?? 10000;

  const scrMinor = guideItem?.screenMinorDeduction ?? 3000;
  const scrHeavy = guideItem?.screenHeavyDeduction ?? 8000;
  const scrCrack = guideItem?.screenCrackedDeduction ?? 20000;
  const scrRepl = guideItem?.screenReplacedDeduction ?? 12000;

  const bgCrack = guideItem?.backGlassCrackedDeduction ?? 8000;
  const faceIdDed = guideItem?.faceIdDefectiveDeduction ?? 18000;
  const ttDed = guideItem?.trueToneMissingDeduction ?? 5000;
  const camDed = guideItem?.cameraIssueDeduction ?? 15000;
  const waterDed = guideItem?.waterDamageDeduction ?? 35000;
  const boxBonus = guideItem?.boxCableBonus ?? 2000;
  const devOnlyDed = guideItem?.deviceOnlyDeduction ?? 2000;

  // 1. Battery Health
  const bh = Number(inspection.batteryHealth) || 0;
  if (bh > 0) {
    if (bh >= 90) {
      // 100% - 90%: 0% deduction
    } else if (bh >= 85) {
      deductions.push({
        key: 'battery',
        label: `Battery Health (${bh}%)`,
        amount: b89_85,
        reason: 'Slight battery capacity degradation (85-89%)',
      });
    } else if (bh >= 80) {
      deductions.push({
        key: 'battery',
        label: `Battery Health (${bh}%)`,
        amount: b84_80,
        reason: 'Moderate battery degradation (80-84%)',
      });
    } else {
      deductions.push({
        key: 'battery',
        label: `Battery Health Service (${bh}%)`,
        amount: bUnder80,
        reason: 'Battery requires replacement (< 80%)',
      });
    }
  }

  // 2. Physical Grade
  if (inspection.physicalGrade === 'Grade B') {
    deductions.push({
      key: 'grade',
      label: 'Physical Condition: Grade B',
      amount: gBDed,
      reason: 'Light daily wear / micro-scratches on casing',
    });
  } else if (inspection.physicalGrade === 'Grade C') {
    deductions.push({
      key: 'grade',
      label: 'Physical Condition: Grade C',
      amount: gCDed,
      reason: 'Noticeable dents, scuffs, or paint chips on frame',
    });
  } else if (inspection.physicalGrade === 'Grade D') {
    deductions.push({
      key: 'grade',
      label: 'Physical Condition: Grade D (Salvage)',
      amount: gDDed,
      reason: 'Severe housing damage / bend / heavy impact marks',
    });
  }

  // 3. Screen Condition
  if (inspection.screenCondition === 'Minor Scratches') {
    deductions.push({
      key: 'screen',
      label: 'Screen: Minor Scratches',
      amount: scrMinor,
      reason: 'Visible surface hairline scratches on glass',
    });
  } else if (inspection.screenCondition === 'Heavy Scratches') {
    deductions.push({
      key: 'screen',
      label: 'Screen: Deep Scratches',
      amount: scrHeavy,
      reason: 'Deep scratches fingernail catches; glass buff/polish required',
    });
  } else if (inspection.screenCondition === 'Cracked Glass') {
    deductions.push({
      key: 'screen',
      label: 'Screen: Cracked Glass Replacement',
      amount: scrCrack,
      reason: 'Cracked outer display glass requires screen refurbishment',
    });
  } else if (inspection.screenCondition === 'Display Replacement') {
    deductions.push({
      key: 'screen',
      label: 'Screen: Aftermarket / Replaced Panel',
      amount: scrRepl,
      reason: 'Non-original display panel installed',
    });
  } else if (inspection.screenCondition === 'Dead Pixels / Lines') {
    deductions.push({
      key: 'screen',
      label: 'Screen: OLED / Line Defect',
      amount: scrCrack + 4000,
      reason: 'Panel defect (lines/bleed) requires complete display replacement',
    });
  }

  // 4. Back Glass Condition
  if (inspection.backGlassCondition === 'Scratched') {
    deductions.push({
      key: 'back_glass',
      label: 'Back Glass: Scratched',
      amount: Math.round(bgCrack * 0.4),
      reason: 'Scratches on rear housing glass',
    });
  } else if (inspection.backGlassCondition === 'Cracked') {
    deductions.push({
      key: 'back_glass',
      label: 'Back Glass: Shattered / Cracked',
      amount: bgCrack,
      reason: 'Back glass laser removal and replacement required',
    });
  }

  // 5. Face ID / Biometrics
  if (inspection.faceIdStatus === 'Defective / Unavailable') {
    deductions.push({
      key: 'face_id',
      label: 'Face ID / Touch ID: Defective',
      amount: faceIdDed,
      reason: 'TrueDepth sensor / Dot Projector failure (major value drop)',
    });
  }

  // 6. True Tone
  if (inspection.trueToneStatus === 'Missing / Disabled') {
    deductions.push({
      key: 'true_tone',
      label: 'True Tone: Missing / Disabled',
      amount: ttDed,
      reason: 'True Tone disabled; screen EEPROM data transfer required',
    });
  }

  // 7. Camera Condition
  if (inspection.cameraCondition === 'Cracked Lens') {
    deductions.push({
      key: 'camera',
      label: 'Camera: Cracked Lens Glass',
      amount: Math.round(camDed * 0.45),
      reason: 'Camera sapphire glass lens cracked',
    });
  } else if (inspection.cameraCondition === '0.5x / 1x / 3x Camera Issue') {
    deductions.push({
      key: 'camera',
      label: 'Camera: Sensor / Lens Failure',
      amount: camDed,
      reason: 'OIS shake, black camera, or telephoto/ultrawide failure',
    });
  }

  // 8. Parts Replaced
  if (inspection.partsReplaced === 'Battery Replaced') {
    deductions.push({
      key: 'parts',
      label: 'Parts: Non-Original Battery',
      amount: 4000,
      reason: 'Unknown part warning / replaced battery',
    });
  } else if (inspection.partsReplaced === 'Screen Replaced') {
    deductions.push({
      key: 'parts',
      label: 'Parts: Prior Screen Replacement',
      amount: 6000,
      reason: 'Device has prior history of display disassembly',
    });
  } else if (inspection.partsReplaced === 'Housing Replaced') {
    deductions.push({
      key: 'parts',
      label: 'Parts: Aftermarket Housing',
      amount: 7000,
      reason: 'Non-original chassis or rebuilt housing',
    });
  } else if (inspection.partsReplaced === 'Camera Replaced') {
    deductions.push({
      key: 'parts',
      label: 'Parts: Replaced Camera Module',
      amount: 6000,
      reason: 'Non-genuine camera notification',
    });
  }

  // 9. Water Damage
  if (inspection.waterDamage === 'Triggered (Red/Pink)') {
    deductions.push({
      key: 'water_damage',
      label: 'Liquid Contact Indicator: Triggered (Red)',
      amount: waterDed,
      reason: 'Critical water exposure risk (motherboard corrosion vulnerability)',
    });
  }

  // 10. Accessories (Bonus or Deduction)
  if (
    inspection.accessories === 'Complete Full Set' ||
    inspection.accessories === 'Box and Cable'
  ) {
    deductions.push({
      key: 'accessories_bonus',
      label: 'Accessories: Original Box & Cable Bonus',
      amount: -boxBonus, // Negative deduction = bonus
      reason: 'Full retail packing increases resale value',
    });
  } else if (inspection.accessories === 'Device Only') {
    deductions.push({
      key: 'accessories',
      label: 'Accessories: Device Only (No Box/Cable)',
      amount: devOnlyDed,
      reason: 'Missing original box and charging cable',
    });
  }

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const suggestedValue = Math.max(0, basePrice - totalDeductions);

  return {
    basePrice,
    deductions,
    totalDeductions,
    suggestedValue,
  };
}

/**
 * Validation rules for price overrides:
 * - Cashier can adjust up to allowed limit (e.g. ± Rs 3,000)
 * - Above that requires Manager / Owner authorization PIN or password.
 */
export const CASHIER_OVERRIDE_LIMIT = 3000;

export function isManagerApprovalRequired(
  suggestedValue: number,
  finalApprovedValue: number
): boolean {
  const diff = Math.abs(finalApprovedValue - suggestedValue);
  return diff > CASHIER_OVERRIDE_LIMIT;
}
