'use client';

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  Search, 
  PackagePlus, 
  CheckCircle2, 
  HelpCircle, 
  Layers 
} from 'lucide-react';
import { ProductCategory, DeviceCondition } from '../../types';

interface NormalizedResult {
  input: string;
  brand: string;
  model: string;
  canonicalName: string;
  category: ProductCategory;
  storage?: string;
  color?: string;
  condition: DeviceCondition;
  batteryHealth?: number;
  matchType: 'Exact Match' | 'Possible Match' | 'New Product';
  matchedProductId?: string;
}

export const ProductNormalizer: React.FC = () => {
  const { products, addProduct, showNotification } = useStore();
  const [inputText, setInputText] = useState('15PM 256 NT');
  const [result, setResult] = useState<NormalizedResult | null>(null);

  const sampleInputs = [
    '15PM 256 NT',
    'IP13 128 BLK MINT 88%',
    'AW S9 45MM CELL STLIGHT',
    'MBA M2 8 256 MD',
    'APP2 USBC',
    'IP14P 128 PURPLE 92%'
  ];

  const handleNormalize = (textToProcess?: string) => {
    const text = (textToProcess || inputText).trim();
    if (!text) return;

    const lower = text.toLowerCase();

    let brand = 'Apple';
    let model = 'Apple Device';
    let canonicalName = text;
    let category: ProductCategory = 'iPhones';
    let storage: string | undefined = undefined;
    let color: string | undefined = undefined;
    let condition: DeviceCondition = 'Brand New Sealed';
    let batteryHealth: number | undefined = undefined;

    // Detect battery health if pattern like 88% or 92%
    const battMatch = text.match(/(\d{2})%/);
    if (battMatch) {
      batteryHealth = parseInt(battMatch[1], 10);
      condition = 'Mint Like New';
    }

    // Detect condition words
    if (lower.includes('mint')) condition = 'Mint Like New';
    if (lower.includes('grade a')) condition = 'Grade A';
    if (lower.includes('grade b')) condition = 'Grade B';

    // Parse specific patterns
    if (lower.includes('15pm') || lower.includes('15 pro max')) {
      model = 'iPhone 15 Pro Max';
      category = 'iPhones';
      storage = lower.includes('512') ? '512GB' : lower.includes('1tb') ? '1TB' : '256GB';
      color = lower.includes('nt') || lower.includes('natural') ? 'Natural Titanium' : lower.includes('blue') ? 'Blue Titanium' : 'Black Titanium';
      canonicalName = `Apple iPhone 15 Pro Max ${storage} ${color}`;
    } else if (lower.includes('14p') || lower.includes('14 pro')) {
      model = 'iPhone 14 Pro';
      category = 'iPhones';
      storage = lower.includes('256') ? '256GB' : '128GB';
      color = lower.includes('purple') ? 'Deep Purple' : 'Space Black';
      canonicalName = `Apple iPhone 14 Pro ${storage} ${color}`;
    } else if (lower.includes('ip13') || lower.includes('iphone 13')) {
      model = 'iPhone 13';
      category = 'iPhones';
      storage = '128GB';
      color = lower.includes('blk') || lower.includes('midnight') ? 'Midnight' : 'Starlight';
      canonicalName = `Apple iPhone 13 ${storage} ${color}`;
    } else if (lower.includes('aw') || lower.includes('s9') || lower.includes('watch')) {
      model = 'Apple Watch Series 9';
      category = 'Apple Watch';
      storage = '64GB';
      color = lower.includes('stlight') || lower.includes('starlight') ? 'Starlight' : 'Midnight';
      canonicalName = `Apple Watch Series 9 45mm GPS + Cellular ${color}`;
    } else if (lower.includes('mba') || lower.includes('macbook air')) {
      model = 'MacBook Air 13" M2';
      category = 'MacBooks';
      storage = '256GB SSD';
      color = lower.includes('md') || lower.includes('midnight') ? 'Midnight' : 'Space Grey';
      canonicalName = `Apple MacBook Air 13.6" M2 8GB RAM 256GB SSD ${color}`;
    } else if (lower.includes('app2') || lower.includes('airpods pro')) {
      model = 'AirPods Pro 2';
      category = 'AirPods';
      color = 'White';
      canonicalName = `Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)`;
    }

    // Match with current catalog
    let matchType: 'Exact Match' | 'Possible Match' | 'New Product' = 'New Product';
    let matchedProductId: string | undefined = undefined;

    const exact = products.find(p => (p.canonicalName?.toLowerCase() === canonicalName.toLowerCase()) || p.name.toLowerCase() === canonicalName.toLowerCase());
    if (exact) {
      matchType = 'Exact Match';
      matchedProductId = exact.id;
    } else {
      const possible = products.find(p => p.category === category && p.name.toLowerCase().includes(model.toLowerCase()));
      if (possible) {
        matchType = 'Possible Match';
        matchedProductId = possible.id;
      }
    }

    setResult({
      input: text,
      brand,
      model,
      canonicalName,
      category,
      storage,
      color,
      condition,
      batteryHealth,
      matchType,
      matchedProductId
    });
  };

  const handleCreateProductFromNormalized = () => {
    if (!result) return;

    addProduct({
      name: result.canonicalName,
      canonicalName: result.canonicalName,
      category: result.category,
      brand: result.brand,
      model: result.model,
      storage: result.storage,
      color: result.color,
      condition: result.condition,
      costPrice: 200000,
      sellingPrice: 235000,
      minStock: 2,
      currentStock: 0,
      isSerialized: result.category !== 'Accessories' && result.category !== 'Cables & Power',
      sku: `AP-${result.model.substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      imeis: []
    });

    showNotification('success', `Created product: ${result.canonicalName}`);
    setResult(prev => prev ? { ...prev, matchType: 'Exact Match' } : null);
  };

  return (
    <div className="space-y-6">
      {/* Search / Input Box */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            AI Trade Shorthand Normalizer & Catalog Matcher
          </h3>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
            Convert supplier shorthand descriptions into standardized Apple naming, extract hardware specs, and match with store stock.
          </p>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type shorthand (e.g. 15PM 256 NT or IP13 128 BLK MINT 88%)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white font-mono"
          />
          <button
            onClick={() => handleNormalize()}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Normalize</span>
          </button>
        </div>

        {/* Sample chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] font-semibold text-light-muted dark:text-dark-muted">Quick Presets:</span>
          {sampleInputs.map((sample, i) => (
            <button
              key={i}
              onClick={() => {
                setInputText(sample);
                handleNormalize(sample);
              }}
              className="px-2.5 py-1 rounded-lg bg-light-surface dark:bg-dark-surface hover:bg-light-elevated dark:hover:bg-dark-elevated border border-light-border dark:border-dark-border text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Normalized Output Display */}
      {result && (
        <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-light-border dark:border-dark-border">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-light-muted">
                Canonical Standardized Title
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {result.canonicalName}
              </h4>
            </div>

            {/* Match Type Badge */}
            <div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                result.matchType === 'Exact Match'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                  : result.matchType === 'Possible Match'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
              }`}>
                {result.matchType}
              </span>
            </div>
          </div>

          {/* Extracted Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border">
              <div className="text-[10px] text-light-muted">Category</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">{result.category}</div>
            </div>

            <div className="p-3 rounded-xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border">
              <div className="text-[10px] text-light-muted">Storage Capacity</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{result.storage || 'Standard'}</div>
            </div>

            <div className="p-3 rounded-xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border">
              <div className="text-[10px] text-light-muted">Finish / Color</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">{result.color || 'Standard'}</div>
            </div>

            <div className="p-3 rounded-xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border">
              <div className="text-[10px] text-light-muted">Condition & Battery</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                {result.condition} {result.batteryHealth ? `(${result.batteryHealth}%)` : ''}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-light-muted dark:text-dark-muted">
              {result.matchType === 'Exact Match'
                ? 'Product is already linked with your current inventory.'
                : 'Product can be saved to catalog for barcode labeling and stock reception.'}
            </div>

            {result.matchType !== 'Exact Match' && (
              <button
                onClick={handleCreateProductFromNormalized}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-500/25 transition-all"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Add to Product Catalog</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
