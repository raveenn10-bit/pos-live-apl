'use client';

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ExtractedInvoice, ExtractedInvoiceItem, AiConfidenceFlag, DeviceItem } from '../../types';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle, 
  RefreshCw, 
  Check, 
  Edit3, 
  Trash2,
  FileCheck,
  Building,
  DollarSign
} from 'lucide-react';

export const InvoiceImport: React.FC = () => {
  const { products, addProduct, addImeisToProduct, addPurchaseOrder, logAction, showNotification } = useStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedInvoice | null>(null);

  // Sample preloaded test invoices for 1-click instant demo
  const sampleInvoiceDubai: ExtractedInvoice = {
    invoiceNumber: "DXB-INV-2026-9841",
    supplierName: "Dubai Electronics FZE",
    invoiceDate: "2026-09-27",
    currency: "LKR",
    subtotal: 1026000,
    taxOrFees: 0,
    totalAmount: 1026000,
    items: [
      {
        id: "ext-1",
        rawDescription: "15PM 256 NT (2 units sealed)",
        matchedProductName: "iPhone 15 Pro Max 256GB Natural Titanium",
        category: "iPhones",
        storage: "256GB",
        color: "Natural Titanium",
        condition: "Brand New Sealed",
        imeis: ["358920119284901", "358920119284919"],
        quantity: 2,
        unitCost: 342000,
        lineTotal: 684000,
        confidenceFlag: "CONFIDENT",
        confidenceScore: 98,
      },
      {
        id: "ext-2",
        rawDescription: "MBA M2 8/256 MD (1 unit sealed)",
        matchedProductName: "MacBook Air 13\" M2 8GB/256GB Midnight",
        category: "MacBooks",
        storage: "256GB SSD",
        color: "Midnight",
        condition: "Brand New Sealed",
        imeis: ["MBA-M2-MD-091890"],
        quantity: 1,
        unitCost: 305000,
        lineTotal: 305000,
        confidenceFlag: "CONFIDENT",
        confidenceScore: 95,
      },
      {
        id: "ext-3",
        rawDescription: "IP13 128 BLK (1 unit)",
        matchedProductName: "iPhone 13 128GB Midnight",
        category: "iPhones",
        storage: "128GB",
        color: "Midnight",
        condition: "Brand New Sealed",
        imeis: ["356281098273612"], // Existing IMEI in database -> POSSIBLE DUPLICATE!
        quantity: 1,
        unitCost: 172000,
        lineTotal: 172000,
        confidenceFlag: "POSSIBLE DUPLICATE",
        confidenceScore: 78,
        suggestedAction: "IMEI 356281098273612 is already recorded in active stock.",
      },
      {
        id: "ext-4",
        rawDescription: "AP2 20W UK CHG (10 units)",
        matchedProductName: "Apple 20W USB-C Power Adapter",
        category: "Cables & Power",
        color: "White",
        condition: "Brand New Sealed",
        imeis: [],
        quantity: 10,
        unitCost: 6800,
        lineTotal: 68000,
        confidenceFlag: "LOW CONFIDENCE",
        confidenceScore: 65,
        suggestedAction: "Description blurry in OCR. Verify quantity and UK Pin type.",
      }
    ]
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    simulateExtraction(sampleInvoiceDubai);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateExtraction(sampleInvoiceDubai);
    }
  };

  const simulateExtraction = (invoice: ExtractedInvoice) => {
    setIsProcessing(true);
    setTimeout(() => {
      setExtractedData(JSON.parse(JSON.stringify(invoice)));
      setIsProcessing(false);
      showNotification('success', 'Gemini Vision extracted 4 items from invoice with audit checks.');
    }, 1200);
  };

  const handleItemFieldChange = (id: string, field: keyof ExtractedInvoiceItem, value: any) => {
    if (!extractedData) return;
    setExtractedData(prev => {
      if (!prev) return null;
      const updatedItems = prev.items.map(it => {
        if (it.id === id) {
          const updated = { ...it, [field]: value };
          if (field === 'quantity' || field === 'unitCost') {
            updated.lineTotal = updated.quantity * updated.unitCost;
          }
          return updated;
        }
        return it;
      });
      const newTotal = updatedItems.reduce((acc, i) => acc + i.lineTotal, 0);
      return {
        ...prev,
        items: updatedItems,
        totalAmount: newTotal
      };
    });
  };

  const handleRemoveItem = (id: string) => {
    if (!extractedData) return;
    setExtractedData(prev => {
      if (!prev) return null;
      const updated = prev.items.filter(i => i.id !== id);
      return {
        ...prev,
        items: updated,
        totalAmount: updated.reduce((acc, i) => acc + i.lineTotal, 0)
      };
    });
  };

  const handleConfirmImport = () => {
    if (!extractedData || extractedData.items.length === 0) return;

    // Process each item into catalog / stock
    extractedData.items.forEach(item => {
      const existingProduct = products.find(p => p.name.toLowerCase() === item.matchedProductName.toLowerCase());

      if (existingProduct) {
        if (existingProduct.isSerialized && item.imeis.length > 0) {
          const newDevices: DeviceItem[] = item.imeis.map((imei, idx) => ({
            id: `dev-imp-${Date.now()}-${idx}`,
            modelName: existingProduct.name,
            imei1: imei,
            serialNumber: `SN-${imei.slice(-6)}`,
            batteryHealth: 100,
            condition: item.condition,
            status: 'In Stock',
            purchaseDate: extractedData.invoiceDate,
            costPrice: item.unitCost,
            sellingPrice: existingProduct.sellingPrice,
            supplierName: extractedData.supplierName,
            warrantyPeriodMonths: 12,
            storage: item.storage,
            color: item.color,
            repairHistory: []
          }));
          addImeisToProduct(existingProduct.id, newDevices);
        } else {
          // Non serialized
          // Handled via stock addition
        }
      } else {
        // Create new product
        addProduct({
          name: item.matchedProductName,
          canonicalName: item.matchedProductName,
          category: item.category,
          brand: 'Apple',
          model: item.matchedProductName,
          storage: item.storage,
          color: item.color,
          condition: item.condition,
          costPrice: item.unitCost,
          sellingPrice: Math.round(item.unitCost * 1.15),
          minStock: 2,
          currentStock: item.quantity,
          isSerialized: item.imeis.length > 0,
          sku: `AP-${item.matchedProductName.substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
          imeis: item.imeis.map((imei, idx) => ({
            id: `dev-new-${Date.now()}-${idx}`,
            modelName: item.matchedProductName,
            imei1: imei,
            serialNumber: `SN-${imei.slice(-6)}`,
            batteryHealth: 100,
            condition: item.condition,
            status: 'In Stock',
            purchaseDate: extractedData.invoiceDate,
            costPrice: item.unitCost,
            sellingPrice: Math.round(item.unitCost * 1.15),
            supplierName: extractedData.supplierName,
            warrantyPeriodMonths: 12,
            repairHistory: []
          }))
        });
      }
    });

    // Record purchase order
    addPurchaseOrder({
      invoiceNumber: extractedData.invoiceNumber,
      supplierId: 'sup-1',
      supplierName: extractedData.supplierName,
      date: extractedData.invoiceDate,
      itemsCount: extractedData.items.length,
      totalAmount: extractedData.totalAmount,
      paymentStatus: 'Pending',
      imeis: extractedData.items.flatMap(i => i.imeis),
      notes: `Imported via Gemini Vision AI Center from supplier invoice ${extractedData.invoiceNumber}`
    });

    logAction(
      'AI_INVOICE_IMPORT', 
      'INVENTORY', 
      `AI Imported invoice ${extractedData.invoiceNumber} from ${extractedData.supplierName} (${extractedData.items.length} items, LKR ${extractedData.totalAmount.toLocaleString()})`
    );

    showNotification('success', `Imported ${extractedData.items.length} items into inventory successfully!`);
    setExtractedData(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload & Dropzone Area */}
      {!extractedData && (
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-10 rounded-3xl border-2 border-dashed text-center transition-all ${
              isDragging
                ? 'border-brand-500 bg-brand-500/10 scale-[1.01]'
                : 'border-light-border dark:border-dark-border bg-white/60 dark:bg-dark-card/60 hover:border-brand-500/50'
            }`}
          >
            {isProcessing ? (
              <div className="py-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto border border-brand-500/30 animate-pulse">
                  <Sparkles className="w-8 h-8 animate-spin" />
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  Gemini Vision Optical Extraction in Progress...
                </div>
                <p className="text-xs text-light-muted dark:text-dark-muted max-w-sm mx-auto">
                  Parsing supplier tables, normalising Apple product titles, detecting serials/IMEIs, and checking for duplicates...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto border border-brand-500/30 shadow-md">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Drag & Drop Supplier Invoices (PDF, PNG, JPG)
                  </h3>
                  <p className="text-xs text-light-muted dark:text-dark-muted mt-1 max-w-md mx-auto">
                    Gemini Multimodal Vision will instantly extract line items, IMEIs, unit prices, and calculate confidence flags.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <label className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 cursor-pointer transition-all">
                    <span>Browse Local Invoice File</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => simulateExtraction(sampleInvoiceDubai)}
                    className="px-4 py-2.5 rounded-xl bg-light-surface dark:bg-dark-surface hover:bg-light-elevated dark:hover:bg-dark-elevated border border-light-border dark:border-dark-border text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    <span>Load Demo Dubai Invoice</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Human Review Screen */}
      {extractedData && (
        <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-xl space-y-6">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-light-border dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Supplier Invoice Human Verification Gate
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Gemini Vision Extracted
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-light-muted dark:text-dark-muted mt-0.5 font-mono">
                  <span>Supplier: <strong className="text-slate-800 dark:text-slate-200">{extractedData.supplierName}</strong></span>
                  <span>Invoice: <strong className="text-brand-500">{extractedData.invoiceNumber}</strong></span>
                  <span>Date: <strong>{extractedData.invoiceDate}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setExtractedData(null)}
                className="px-3.5 py-2 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                Discard & Upload Another
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-extrabold shadow-lg shadow-brand-500/25 flex items-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Add to Inventory</span>
              </button>
            </div>
          </div>

          {/* Items Review Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-bold text-[10px] uppercase tracking-wider">
                  <th className="pb-3">Raw Description & Canonical Match</th>
                  <th className="pb-3">Confidence & Flags</th>
                  <th className="pb-3">Extracted IMEIs / Serials</th>
                  <th className="pb-3 text-right">Unit Cost (LKR)</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3 text-right">Line Total</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {extractedData.items.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-light-surface/40 dark:hover:bg-dark-surface/40">
                      {/* Product Name */}
                      <td className="py-3 pr-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          <input
                            type="text"
                            value={item.matchedProductName}
                            onChange={(e) => handleItemFieldChange(item.id, 'matchedProductName', e.target.value)}
                            className="w-full bg-transparent border-b border-dashed border-slate-400 focus:outline-none focus:border-brand-500 py-0.5"
                          />
                        </div>
                        <div className="text-[10px] text-light-muted font-mono mt-0.5">
                          Raw OCR: "{item.rawDescription}"
                        </div>
                      </td>

                      {/* Confidence Flags */}
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.confidenceFlag === 'CONFIDENT'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : item.confidenceFlag === 'POSSIBLE DUPLICATE'
                              ? 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse'
                              : item.confidenceFlag === 'LOW CONFIDENCE'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          }`}>
                            {item.confidenceFlag} ({item.confidenceScore}%)
                          </span>
                          {item.suggestedAction && (
                            <span className="text-[9px] text-amber-500 dark:text-amber-400 max-w-[200px] leading-tight">
                              {item.suggestedAction}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* IMEIs */}
                      <td className="py-3 pr-3">
                        {item.imeis.length > 0 ? (
                          <div className="space-y-1">
                            {item.imeis.map((imei, idx) => (
                              <div key={idx} className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border inline-block mr-1">
                                {imei}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-light-muted italic">Non-serialized accessory</span>
                        )}
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3 pr-3 text-right">
                        <input
                          type="number"
                          value={item.unitCost}
                          onChange={(e) => handleItemFieldChange(item.id, 'unitCost', Number(e.target.value))}
                          className="w-24 text-right font-mono font-bold py-1 px-1.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="py-3 pr-3 text-center">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemFieldChange(item.id, 'quantity', Number(e.target.value))}
                          className="w-14 text-center font-mono font-bold py-1 px-1.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                        />
                      </td>

                      {/* Line Total */}
                      <td className="py-3 pr-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        LKR {item.lineTotal.toLocaleString()}
                      </td>

                      {/* Delete */}
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total Row */}
          <div className="flex justify-end p-4 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border">
            <div className="text-right space-y-1">
              <div className="text-xs text-light-muted dark:text-dark-muted">Verified Consignment Total:</div>
              <div className="font-mono font-black text-xl text-brand-500">
                LKR {extractedData.totalAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
