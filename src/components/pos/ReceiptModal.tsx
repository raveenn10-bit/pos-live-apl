'use client';

import React, { useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Printer, 
  Download, 
  Share2, 
  PlusCircle, 
  X, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Barcode, 
  ExternalLink 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, onNewSale }) => {
  const { lastCompletedSale, settings } = useStore();
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && lastCompletedSale) {
      // Trigger canvas-confetti celebration fireworks!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e61e25', '#10b981', '#3b82f6', '#f59e0b', '#ffffff'],
        });
      } catch (e) {
        console.log('Confetti failed to trigger', e);
      }
    }
  }, [isOpen, lastCompletedSale]);

  if (!isOpen || !lastCompletedSale) return null;

  const sale = lastCompletedSale;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    let text = `*${settings.fullName}*\n`;
    text += `Kalegana Junction, Galle\n`;
    text += `Hotline: ${settings.phone}\n`;
    text += `--------------------------------\n`;
    text += `*INVOICE: ${sale.invoiceNumber}*\n`;
    text += `Date: ${sale.date} ${sale.time}\n`;
    text += `Customer: ${sale.customerName}\n`;
    text += `--------------------------------\n`;
    sale.items.forEach((item, idx) => {
      text += `${idx + 1}. *${item.productName}*\n`;
      if (item.imei) text += `   IMEI: ${item.imei}\n`;
      if (item.warranty && item.warranty !== 'None') text += `   Warranty: ${item.warranty}\n`;
      text += `   Qty: ${item.quantity} x LKR ${item.unitPrice.toLocaleString()} = LKR ${item.lineTotal.toLocaleString()}\n`;
    });
    text += `--------------------------------\n`;
    text += `*Subtotal:* LKR ${sale.subtotal.toLocaleString()}\n`;
    if (sale.discountTotal > 0) text += `*Discount:* -LKR ${sale.discountTotal.toLocaleString()}\n`;
    text += `*TOTAL PAID:* LKR ${sale.totalAmount.toLocaleString()}\n`;
    text += `*Method:* ${sale.paymentMethod}\n`;
    text += `--------------------------------\n`;
    text += `Thank you for choosing AppleVision Store Galle!`;

    const encoded = encodeURIComponent(text);
    const targetPhone = sale.customerPhone 
      ? sale.customerPhone.replace(/[^0-9]/g, '') 
      : settings.whatsapp.replace(/[^0-9]/g, '');

    window.open(`https://wa.me/${targetPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Ribbon */}
        <div className="px-6 py-4 bg-emerald-600 dark:bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-base font-black tracking-tight">Sale Completed Successfully!</h2>
              <p className="text-[11px] text-emerald-100 font-mono">Invoice #{sale.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 80mm Thermal Receipt Preview Container */}
        <div className="p-6 overflow-y-auto bg-slate-100 dark:bg-slate-900/60 flex justify-center">
          <div
            id="thermal-receipt-printable"
            ref={receiptRef}
            className="w-[80mm] max-w-[340px] bg-white text-black p-5 rounded-xl shadow-lg border border-slate-200 font-mono text-xs select-text space-y-3"
          >
            {/* Header */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3">
              <div className="font-extrabold text-sm tracking-tighter uppercase">
                {settings.fullName}
              </div>
              <div className="text-[10px] text-slate-700 font-sans leading-tight">
                {settings.tagline}
              </div>
              <div className="text-[10px] text-slate-600 font-sans">
                {settings.address}, {settings.city}
              </div>
              <div className="text-[10px] text-slate-700 font-mono">
                Hotline: {settings.phone}
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
              <div className="flex justify-between">
                <span>INVOICE:</span>
                <span className="font-bold">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE/TIME:</span>
                <span>{sale.date} {sale.time}</span>
              </div>
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>CUSTOMER:</span>
                <span className="font-semibold">{sale.customerName}</span>
              </div>
              {sale.customerPhone && (
                <div className="flex justify-between">
                  <span>PHONE:</span>
                  <span>{sale.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="space-y-2 border-b border-dashed border-slate-400 pb-2">
              <div className="flex justify-between font-bold text-[10px] border-b border-slate-300 pb-1">
                <span>ITEM / SPEC</span>
                <span>TOTAL</span>
              </div>

              {sale.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5 text-[11px]">
                  <div className="font-bold text-slate-900 leading-tight">
                    {item.productName}
                  </div>
                  {item.imei && (
                    <div className="text-[9px] text-slate-700">
                      IMEI: <span className="font-bold">{item.imei}</span>
                    </div>
                  )}
                  {item.warranty && item.warranty !== 'None' && (
                    <div className="text-[9px] text-slate-700">
                      Warranty: {item.warranty}
                    </div>
                  )}
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>{item.quantity} x LKR {item.unitPrice.toLocaleString()} {item.discount > 0 ? `(-${item.discount})` : ''}</span>
                    <span className="font-bold text-slate-900">LKR {item.lineTotal.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-1 border-b border-dashed border-slate-400 pb-2 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>LKR {sale.subtotal.toLocaleString()}</span>
              </div>
              {sale.discountTotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount:</span>
                  <span>-LKR {sale.discountTotal.toLocaleString()}</span>
                </div>
              )}
              {sale.taxTotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({settings.taxRatePercent}%):</span>
                  <span>LKR {sale.taxTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                <span>NET TOTAL:</span>
                <span>LKR {sale.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
              <div className="flex justify-between font-semibold">
                <span>PAYMENT METHOD:</span>
                <span>{sale.paymentMethod}</span>
              </div>
              {sale.paymentDetails?.cashTendered !== undefined && (
                <>
                  <div className="flex justify-between">
                    <span>CASH TENDERED:</span>
                    <span>LKR {sale.paymentDetails.cashTendered.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>CHANGE DUE:</span>
                    <span>LKR {(sale.paymentDetails.changeDue || 0).toLocaleString()}</span>
                  </div>
                </>
              )}
              {sale.paymentDetails?.cardRef && (
                <div className="flex justify-between">
                  <span>CARD AUTH:</span>
                  <span>{sale.paymentDetails.cardRef}</span>
                </div>
              )}
              {sale.paymentDetails?.bankName && (
                <div className="flex justify-between">
                  <span>BANK DEPOSIT:</span>
                  <span>{sale.paymentDetails.bankName}</span>
                </div>
              )}
            </div>

            {/* Terms and Barcode */}
            <div className="text-center space-y-2 pt-1 text-[9px] text-slate-600 font-sans leading-tight">
              <div>{settings.receiptHeader}</div>
              <div className="font-semibold">{settings.receiptFooter}</div>

              {/* Barcode Graphic Placeholder */}
              <div className="py-2 flex flex-col items-center justify-center">
                <div className="h-9 w-48 bg-slate-900 flex items-center justify-center text-white font-mono text-[9px] tracking-[6px] font-bold">
                  |||||| |||| |||||||| |||
                </div>
                <span className="font-mono text-[9px] text-slate-500 mt-0.5">{sale.invoiceNumber}</span>
              </div>

              <div className="text-[9px] text-slate-400 font-mono">
                *** REVOLUTIONIZING APPLE RETAIL IN GALLE ***
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-light-surface/70 dark:bg-dark-surface/70 border-t border-light-border dark:border-dark-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
            >
              <Printer className="w-4 h-4" />
              <span>Print 80mm (Ctrl+P)</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Send WhatsApp</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onNewSale();
            }}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-brand-500/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Start Next Sale (F2)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
