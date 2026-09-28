'use client';

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory, DeviceCondition, DeviceItem } from '../../types';
import { 
  Package, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Barcode, 
  AlertTriangle, 
  CheckCircle2, 
  Smartphone, 
  DollarSign, 
  Layers, 
  X,
  PlusCircle,
  Copy,
  Check,
  Download,
  Printer,
  Sliders,
  RefreshCw,
  Tag,
  ArrowUpDown
} from 'lucide-react';
import { 
  downloadCsv, 
  downloadHtmlFile, 
  printHtmlViaIframe, 
  generateBarcodeSheetHtml, 
  BarcodeLabelItem 
} from '../../utils/exportUtils';
import { generateCode128Svg } from '../../utils/barcodeGenerator';

export const InventoryView: React.FC = () => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    adjustStock, 
    addImeisToProduct, 
    openDevicePassport, 
    settings,
    showNotification 
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [inspectingImeisProduct, setInspectingImeisProduct] = useState<Product | null>(null);

  // Stock Adjustment Modal state
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
  const [adjustAction, setAdjustAction] = useState<'add' | 'remove'>('add');
  const [adjustReason, setAdjustReason] = useState<string>('Restock / Supplier Shipment Received');

  // Barcode / Labels Modal state
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeTargetProduct, setBarcodeTargetProduct] = useState<Product | null>(null);
  const [barcodeType, setBarcodeType] = useState<'sku' | 'imei'>('sku');
  const [barcodeCopies, setBarcodeCopies] = useState<number>(1);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('iPhones');
  const [formBrand, setFormBrand] = useState('Apple');
  const [formModel, setFormModel] = useState('');
  const [formStorage, setFormStorage] = useState('128GB');
  const [formColor, setFormColor] = useState('Black');
  const [formCondition, setFormCondition] = useState<DeviceCondition>('Brand New Sealed');
  const [formCost, setFormCost] = useState<number>(200000);
  const [formSelling, setFormSelling] = useState<number>(235000);
  const [formMinStock, setFormMinStock] = useState<number>(2);
  const [formIsSerialized, setFormIsSerialized] = useState<boolean>(true);
  const [formInitialStock, setFormInitialStock] = useState<number>(1);
  const [bulkImeiInput, setBulkImeiInput] = useState('');

  // Add more IMEIs to existing product modal state
  const [newImeisInput, setNewImeisInput] = useState('');

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

  const lowStockCount = products.filter(p => p.currentStock <= p.minStock).length;

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesLow = onlyLowStock ? p.currentStock <= p.minStock : true;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCat && matchesLow;

    const matchesName = p.name.toLowerCase().includes(query);
    const matchesSku = p.sku.toLowerCase().includes(query);
    const matchesImei = p.imeis.some(d => 
      d.imei1.includes(query) || 
      (d.imei2 && d.imei2.includes(query)) || 
      (d.serialNumber && d.serialNumber.toLowerCase().includes(query))
    );

    return matchesCat && matchesLow && (matchesName || matchesSku || matchesImei);
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('iPhones');
    setFormBrand('Apple');
    setFormModel('');
    setFormStorage('128GB');
    setFormColor('Natural Titanium');
    setFormCondition('Brand New Sealed');
    setFormCost(200000);
    setFormSelling(235000);
    setFormMinStock(2);
    setFormIsSerialized(true);
    setFormInitialStock(1);
    setBulkImeiInput('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormBrand(p.brand);
    setFormModel(p.model);
    setFormStorage(p.storage || '');
    setFormColor(p.color || '');
    setFormCondition((p.condition as DeviceCondition) || 'Brand New Sealed');
    setFormCost(p.costPrice);
    setFormSelling(p.sellingPrice);
    setFormMinStock(p.minStock);
    setFormIsSerialized(!!p.isSerialized);
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formName,
        category: formCategory,
        brand: formBrand,
        model: formModel,
        storage: formStorage || undefined,
        color: formColor || undefined,
        condition: formCondition,
        costPrice: Number(formCost),
        sellingPrice: Number(formSelling),
        minStock: Number(formMinStock),
      });
      setIsAddModalOpen(false);
      showNotification('success', `Updated "${formName}"`);
    } else {
      // Parse initial IMEIs if serialized
      const imeisArray: DeviceItem[] = [];
      if (formIsSerialized && bulkImeiInput.trim()) {
        const lines = bulkImeiInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        lines.forEach((imei, idx) => {
          imeisArray.push({
            id: `dev-${Date.now()}-${idx}`,
            modelName: formName,
            imei1: imei,
            serialNumber: `SN-${imei.slice(-6)}`,
            batteryHealth: formCondition === 'Brand New Sealed' ? 100 : 90,
            condition: formCondition,
            status: 'In Stock',
            purchaseDate: new Date().toISOString().substring(0, 10),
            costPrice: Number(formCost),
            sellingPrice: Number(formSelling),
            warrantyPeriodMonths: 12,
            storage: formStorage,
            color: formColor,
            repairHistory: []
          });
        });
      }

      const currentStockCount = formIsSerialized 
        ? imeisArray.length 
        : Number(formInitialStock);

      addProduct({
        name: formName,
        canonicalName: formName,
        category: formCategory,
        brand: formBrand,
        model: formModel || formName,
        storage: formStorage || undefined,
        color: formColor || undefined,
        condition: formCondition,
        costPrice: Number(formCost),
        sellingPrice: Number(formSelling),
        minStock: Number(formMinStock),
        currentStock: currentStockCount,
        isSerialized: formIsSerialized,
        sku: `AP-${formCategory.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        imeis: imeisArray
      });

      setIsAddModalOpen(false);
      showNotification('success', `Created "${formName}" with ${currentStockCount} unit(s)`);
    }
  };

  const handleAddImeisToExisting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingImeisProduct || !newImeisInput.trim()) return;

    const lines = newImeisInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const newDevices: DeviceItem[] = lines.map((imei, idx) => ({
      id: `dev-${Date.now()}-${idx}`,
      modelName: inspectingImeisProduct.name,
      imei1: imei,
      serialNumber: `SN-${imei.slice(-6)}`,
      batteryHealth: 100,
      condition: inspectingImeisProduct.condition || 'Brand New Sealed',
      status: 'In Stock',
      purchaseDate: new Date().toISOString().substring(0, 10),
      costPrice: inspectingImeisProduct.costPrice,
      sellingPrice: inspectingImeisProduct.sellingPrice,
      warrantyPeriodMonths: 12,
      storage: inspectingImeisProduct.storage,
      color: inspectingImeisProduct.color,
      repairHistory: []
    }));

    addImeisToProduct(inspectingImeisProduct.id, newDevices);
    setNewImeisInput('');
    setInspectingImeisProduct(null);
    showNotification('success', `Added ${newDevices.length} serial/IMEI units to ${inspectingImeisProduct.name}`);
  };

  // Stock Adjustment Submit
  const handleConfirmStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || adjustQuantity <= 0) return;

    const delta = adjustAction === 'add' ? adjustQuantity : -adjustQuantity;
    adjustStock(adjustingProduct.id, delta, adjustReason);
    setAdjustingProduct(null);
  };

  // Export Stock CSV
  const handleExportStockCsv = () => {
    try {
      const headers = [
        'Product Name', 'SKU', 'Category', 'Condition', 'Storage', 'Color',
        'Cost Price (LKR)', 'Selling Price (LKR)', 'Current Stock Units', 'Min Stock Threshold',
        'Stock Status', 'Total Cost Valuation (LKR)', 'Total Retail Valuation (LKR)',
        'Is Serialized', 'Registered IMEIs & Serials'
      ];

      const rows = filteredProducts.map(p => {
        const isLow = p.currentStock <= p.minStock;
        const isOut = p.currentStock <= 0;
        const status = isOut ? 'Out of Stock' : isLow ? 'Low Stock Warning' : 'In Stock Normal';
        const imeisStr = p.imeis ? p.imeis.map(d => `${d.imei1}${d.serialNumber ? ` (${d.serialNumber})` : ''}`).join('; ') : '';

        return [
          p.name,
          p.sku,
          p.category,
          p.condition,
          p.storage || '',
          p.color || '',
          p.costPrice,
          p.sellingPrice,
          p.currentStock,
          p.minStock,
          status,
          p.costPrice * p.currentStock,
          p.sellingPrice * p.currentStock,
          p.isSerialized ? 'YES' : 'NO',
          imeisStr
        ];
      });

      const dateStr = new Date().toISOString().substring(0, 10);
      downloadCsv(`AppleVision_Stock_Inventory_${dateStr}.csv`, headers, rows);
      showNotification('success', `Exported ${filteredProducts.length} product records to CSV`);
    } catch (err: any) {
      console.error('Export Stock CSV error:', err);
      showNotification('error', `Failed to export CSV: ${err.message || 'Unknown error'}`);
    }
  };

  // Build barcode label items for single or bulk printing
  const buildBarcodeLabels = (): BarcodeLabelItem[] => {
    const labels: BarcodeLabelItem[] = [];

    if (barcodeTargetProduct) {
      const p = barcodeTargetProduct;
      if (barcodeType === 'imei' && p.isSerialized && p.imeis.length > 0) {
        // Print individual IMEI barcode for each device item
        p.imeis.filter(dev => dev.status === 'In Stock').forEach(dev => {
          for (let i = 0; i < barcodeCopies; i++) {
            const barcodeSvg = generateCode128Svg(dev.imei1, { height: 38, showText: false });
            labels.push({
              title: p.name,
              sku: p.sku,
              imei: dev.imei1,
              serial: dev.serialNumber,
              price: p.sellingPrice,
              condition: dev.condition || p.condition,
              barcodeSvg
            });
          }
        });
      } else {
        // Print SKU barcode
        for (let i = 0; i < barcodeCopies; i++) {
          const barcodeSvg = generateCode128Svg(p.sku, { height: 38, showText: false });
          labels.push({
            title: p.name,
            sku: p.sku,
            price: p.sellingPrice,
            condition: p.condition,
            barcodeSvg
          });
        }
      }
    } else {
      // Bulk print for all filtered products (1 label each by default)
      filteredProducts.forEach(p => {
        const barcodeSvg = generateCode128Svg(p.sku, { height: 38, showText: false });
        labels.push({
          title: p.name,
          sku: p.sku,
          price: p.sellingPrice,
          condition: p.condition,
          barcodeSvg
        });
      });
    }

    return labels;
  };

  // Trigger Print Barcodes via iframe
  const handlePrintBarcodes = () => {
    const labels = buildBarcodeLabels();
    if (labels.length === 0) {
      showNotification('warning', 'No products or barcodes available to print');
      return;
    }

    showNotification('info', `Preparing ${labels.length} barcode label(s) for printing...`);
    const storeName = settings.fullName || 'AppleVision Store Galle';
    const html = generateBarcodeSheetHtml(labels, storeName);
    printHtmlViaIframe(html);
    setIsBarcodeModalOpen(false);
  };

  // Download Printable Barcode Labels as standalone HTML
  const handleDownloadBarcodeHtml = () => {
    const labels = buildBarcodeLabels();
    if (labels.length === 0) {
      showNotification('warning', 'No barcodes available to download');
      return;
    }

    const storeName = settings.fullName || 'AppleVision Store Galle';
    const html = generateBarcodeSheetHtml(labels, storeName);
    const dateStr = new Date().toISOString().substring(0, 10);
    downloadHtmlFile(`AppleVision_Barcode_Labels_${dateStr}.html`, html);
    showNotification('success', `Saved ${labels.length} barcode label(s) to Downloads`);
    setIsBarcodeModalOpen(false);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Top Banner & Actions */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-brand-500/10 text-brand-500">
              <Package className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Inventory & Hardware Management
            </h2>
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
            Real-time tracking of serialized Apple hardware, dual IMEI identifiers, battery health, and accessory stock.
          </p>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Stock CSV */}
          <button
            onClick={handleExportStockCsv}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
            title="Export filtered stock records to Excel-compatible CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export Stock CSV</span>
          </button>

          {/* Print Barcodes / Labels */}
          <button
            onClick={() => {
              setBarcodeTargetProduct(null);
              setIsBarcodeModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
            title="Print scannable Code 128 barcode labels for products or serialized stock"
          >
            <Barcode className="w-4 h-4 text-brand-500" />
            <span>Print Barcodes / Labels</span>
          </button>

          {/* Add Product */}
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by product name, SKU, or serialized IMEI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono text-slate-900 dark:text-white"
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Category Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ProductCategory)}
            className="px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-medium"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Low Stock Filter Button */}
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              onlyLowStock
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : lowStockCount > 0
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-slate-700 dark:text-slate-300 hover:text-amber-500'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner if any items low */}
      {!onlyLowStock && lowStockCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>
              <strong>Inventory Warning:</strong> {lowStockCount} product(s) are at or below minimum reorder thresholds.
            </span>
          </div>
          <button
            onClick={() => setOnlyLowStock(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 transition-colors shadow-sm"
          >
            View Low Stock Items
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-bold text-[10px] uppercase tracking-wider">
                <th className="pb-3">Product Name & SKU</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Condition</th>
                <th className="pb-3 text-right">Cost (LKR)</th>
                <th className="pb-3 text-right">Retail (LKR)</th>
                <th className="pb-3 text-center">Stock Level</th>
                <th className="pb-3 text-center">IMEI Registry</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-light-muted">
                    No products found matching your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.minStock;
                  const isOut = p.currentStock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-light-surface/40 dark:hover:bg-dark-surface/40 transition-colors">
                      {/* Name & SKU */}
                      <td className="py-3.5 pr-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-light-muted font-mono mt-0.5">
                          SKU: {p.sku} {p.storage ? `• ${p.storage}` : ''} {p.color ? `• ${p.color}` : ''}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 pr-3 font-semibold text-slate-700 dark:text-slate-300">
                        {p.category}
                      </td>

                      {/* Condition */}
                      <td className="py-3.5 pr-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                          {p.condition}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-3.5 pr-3 text-right font-mono font-semibold text-slate-600 dark:text-slate-400">
                        LKR {p.costPrice.toLocaleString()}
                      </td>

                      {/* Selling */}
                      <td className="py-3.5 pr-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        LKR {p.sellingPrice.toLocaleString()}
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 pr-3 text-center">
                        <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full ${
                          isOut
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : isLow
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {p.currentStock} units
                        </span>
                        {isLow && !isOut && (
                          <div className="text-[9.5px] text-amber-500 font-medium mt-0.5">Min: {p.minStock}</div>
                        )}
                      </td>

                      {/* Serial / IMEI Status */}
                      <td className="py-3.5 pr-3 text-center">
                        {p.isSerialized ? (
                          <button
                            onClick={() => setInspectingImeisProduct(p)}
                            className="px-2.5 py-1 rounded-lg bg-light-surface dark:bg-dark-surface hover:border-brand-500 border border-light-border dark:border-dark-border text-[11px] font-mono font-bold text-brand-500 transition-colors"
                            title="Inspect registered IMEIs, check passport, or append new units"
                          >
                            {p.imeis.length} Serials
                          </button>
                        ) : (
                          <span className="text-[10px] text-light-muted">Non-serialized</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Print Barcode for this product */}
                          <button
                            onClick={() => {
                              setBarcodeTargetProduct(p);
                              setBarcodeType('sku');
                              setBarcodeCopies(1);
                              setIsBarcodeModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors"
                            title="Print Barcode Labels"
                          >
                            <Barcode className="w-4 h-4 text-brand-500" />
                          </button>

                          {/* Quick Stock Adjustment */}
                          <button
                            onClick={() => {
                              setAdjustingProduct(p);
                              setAdjustQuantity(1);
                              setAdjustAction('add');
                              setAdjustReason('Restock / Supplier Delivery');
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                            title="Adjust Stock Quantity"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>

                          {/* Edit Product */}
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Product */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove "${p.name}"?`)) {
                                deleteProduct(p.id);
                                showNotification('info', `Removed ${p.name}`);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-light-surface/60 dark:bg-dark-surface/60 border-b border-light-border dark:border-dark-border flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingProduct ? 'Edit Product Details' : 'Add New Apple Product / Device'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. iPhone 15 Pro Max 256GB Natural Titanium"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Condition
                  </label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as DeviceCondition)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  >
                    <option value="Brand New Sealed">Brand New Sealed</option>
                    <option value="Mint Like New">Mint Like New</option>
                    <option value="Grade A">Grade A</option>
                    <option value="Grade B">Grade B</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Storage Capacity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 256GB / 512GB SSD"
                    value={formStorage}
                    onChange={(e) => setFormStorage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Color / Finish
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Natural Titanium / Space Black"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cost Price (LKR) *
                  </label>
                  <input
                    type="number"
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Retail Selling Price (LKR) *
                  </label>
                  <input
                    type="number"
                    value={formSelling}
                    onChange={(e) => setFormSelling(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono font-bold text-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Min Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formIsSerialized}
                      onChange={(e) => setFormIsSerialized(e.target.checked)}
                      className="rounded border-slate-400 text-brand-500 focus:ring-brand-500"
                    />
                    <span>Requires Serial / IMEI Tracking</span>
                  </label>
                </div>
              </div>

              {/* Initial IMEIs if serialized & creating new */}
              {!editingProduct && formIsSerialized && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Scan / Paste Initial Device IMEIs (One per line or comma-separated)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="358920119284751&#10;358920119284752"
                    value={bulkImeiInput}
                    onChange={(e) => setBulkImeiInput(e.target.value)}
                    className="w-full p-2.5 text-xs font-mono rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}

              {!editingProduct && !formIsSerialized && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Stock Count
                  </label>
                  <input
                    type="number"
                    value={formInitialStock}
                    onChange={(e) => setFormInitialStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all"
                >
                  {editingProduct ? 'Save Product Updates' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect / Add IMEIs Modal */}
      {inspectingImeisProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-light-surface/60 dark:bg-dark-surface/60 border-b border-light-border dark:border-dark-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Serial & IMEI Registry
                </h3>
                <p className="text-xs text-brand-500 font-semibold">{inspectingImeisProduct.name}</p>
              </div>
              <button
                onClick={() => setInspectingImeisProduct(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Existing IMEIs Table */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">
                  Registered Units ({inspectingImeisProduct.imeis.length})
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {inspectingImeisProduct.imeis.length === 0 ? (
                    <div className="p-4 text-center text-xs text-light-muted">
                      No serials/IMEIs registered yet for this item.
                    </div>
                  ) : (
                    inspectingImeisProduct.imeis.map((dev) => (
                      <div
                        key={dev.id}
                        className="p-3 rounded-xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            IMEI: {dev.imei1}
                          </div>
                          <div className="text-[10px] text-light-muted font-mono">
                            SN: {dev.serialNumber} • Batt: {dev.batteryHealth ? `${dev.batteryHealth}%` : '100%'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            dev.status === 'In Stock'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : dev.status === 'Sold'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {dev.status}
                          </span>
                          <button
                            onClick={() => {
                              openDevicePassport(dev, inspectingImeisProduct);
                            }}
                            className="px-2 py-1 rounded bg-light-elevated dark:bg-dark-elevated hover:text-brand-500 text-[10px] font-semibold"
                          >
                            Passport
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add More IMEIs Form */}
              <form onSubmit={handleAddImeisToExisting} className="pt-3 border-t border-light-border dark:border-dark-border space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Scan / Add More Units (Batch Addition)
                </label>
                <textarea
                  rows={2}
                  placeholder="Paste additional IMEIs (one per line or comma-separated)..."
                  value={newImeisInput}
                  onChange={(e) => setNewImeisInput(e.target.value)}
                  className="w-full p-2.5 text-xs font-mono rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={!newImeisInput.trim()}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Append Units to Inventory</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Adjust Stock Level</h3>
                <p className="text-xs text-brand-500 font-semibold">{adjustingProduct.name}</p>
              </div>
              <button onClick={() => setAdjustingProduct(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmStockAdjustment} className="space-y-4">
              <div className="p-3 rounded-2xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Current Stock On Hand:</span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  {adjustingProduct.currentStock} Units
                </span>
              </div>

              {/* Add vs Deduct Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustAction('add');
                      setAdjustReason('Restock / Supplier Delivery');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      adjustAction === 'add'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    + Add Stock (Restock)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustAction('remove');
                      setAdjustReason('Inventory Audit Correction / Shrinkage');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      adjustAction === 'remove'
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                        : 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    - Deduct Stock (Audit/Damage)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity ({adjustAction === 'add' ? 'Units to Add' : 'Units to Deduct'}) *
                </label>
                <input
                  type="number"
                  min={1}
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Adjustment *
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                >
                  <option value="Restock / Supplier Delivery">Restock / Supplier Delivery</option>
                  <option value="Inventory Audit Correction / Count discrepancy">Inventory Audit Correction</option>
                  <option value="Damaged Stock Written-off">Damaged Stock Written-off</option>
                  <option value="Return to Supplier (RMA)">Return to Supplier (RMA)</option>
                  <option value="Store Display Demo Unit">Store Display Demo Unit</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all ${
                    adjustAction === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm Adjustment ({adjustAction === 'add' ? `+${adjustQuantity}` : `-${adjustQuantity}`})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Barcodes / Labels Modal */}
      {isBarcodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-brand-500" />
                  Print Barcodes / Shelf Labels
                </h3>
                <p className="text-xs text-light-muted">
                  {barcodeTargetProduct ? barcodeTargetProduct.name : `Bulk Print for ${filteredProducts.length} filtered items`}
                </p>
              </div>
              <button onClick={() => setIsBarcodeModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Options */}
            {barcodeTargetProduct ? (
              <div className="space-y-3">
                {barcodeTargetProduct.isSerialized && barcodeTargetProduct.imeis.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Barcode Identifier Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBarcodeType('sku')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                          barcodeType === 'sku'
                            ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                            : 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>Product SKU Barcode</div>
                        <div className="text-[10px] font-mono opacity-80">{barcodeTargetProduct.sku}</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBarcodeType('imei')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                          barcodeType === 'imei'
                            ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                            : 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>Individual IMEIs</div>
                        <div className="text-[10px] font-mono opacity-80">{barcodeTargetProduct.imeis.length} registered units</div>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Number of Copies per Label
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={barcodeCopies}
                    onChange={(e) => setBarcodeCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Barcode Live Preview */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-inner">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Live Barcode Preview</div>
                  <div 
                    className="flex justify-center"
                    dangerouslySetInnerHTML={{
                      __html: generateCode128Svg(
                        barcodeType === 'imei' && barcodeTargetProduct.imeis[0] 
                          ? barcodeTargetProduct.imeis[0].imei1 
                          : barcodeTargetProduct.sku,
                        { height: 42, showText: false }
                      )
                    }}
                  />
                  <div className="font-mono text-xs font-bold text-slate-900 mt-1">
                    {barcodeType === 'imei' && barcodeTargetProduct.imeis[0] 
                      ? `IMEI: ${barcodeTargetProduct.imeis[0].imei1}` 
                      : `SKU: ${barcodeTargetProduct.sku}`}
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">
                    LKR {barcodeTargetProduct.sellingPrice.toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-xs space-y-2">
                <p className="text-slate-700 dark:text-slate-300">
                  You are about to generate shelf barcode labels for <strong>{filteredProducts.length}</strong> products matching your current filters.
                </p>
                <p className="text-light-muted text-[11px]">
                  Each product will generate 1 scannable Code 128 sticker label formatted for standard retail thermal label rolls or sticker sheets.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-light-border dark:border-dark-border gap-2">
              <button
                type="button"
                onClick={() => setIsBarcodeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadBarcodeHtml}
                  className="px-3.5 py-2 rounded-xl bg-light-surface dark:bg-dark-surface hover:bg-light-elevated dark:hover:bg-dark-elevated border border-light-border dark:border-dark-border text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
                  title="Download HTML file containing all formatted barcode labels"
                >
                  Download HTML
                </button>

                <button
                  type="button"
                  onClick={handlePrintBarcodes}
                  className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Labels Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
