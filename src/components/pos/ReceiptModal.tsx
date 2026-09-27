'use client';
import React, { useEffect, useRef, useState } from 'react';
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
  Barcode as BarcodeIcon, 
  ExternalLink,
  ShieldCheck,
  Repeat
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { APPLEVISION_LOGO_BASE64 } from '../../assets/logoBase64';
import { BarcodeSvg } from '../../utils/barcodeGenerator';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, onNewSale }) => {
  const { lastCompletedSale, settings, showNotification } = useStore();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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
  const tradeIn = sale.tradeInRecord || (sale as any).tradeIn || (sale as any).trade_in;
  const tradeInCredit = sale.tradeInCredit || tradeIn?.finalApprovedValue || tradeIn?.final_approved_value || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    setIsExportingPdf(true);

    try {
      const receiptElement = receiptRef.current;
      const receiptContent = receiptElement.outerHTML;

      // Wrap in clean printable HTML template
      const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AppleVision Receipt - ${sale.invoiceNumber}</title>
  <style>
    @page { margin: 0; size: 80mm auto; }
    body {
      font-family: 'Courier New', Courier, monospace, -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11px;
      line-height: 1.25;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 6px;
      width: 290px;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
    }
    img { max-width: 90px; height: auto; display: block; margin: 0 auto; filter: grayscale(100%); }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold, .bold { font-weight: bold; }
    .font-mono { font-family: 'Courier New', Courier, monospace; }
  </style>
</head>
<body>
  ${receiptContent}
</body>
</html>
      `.trim();

      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.print?.toPdf) {
        const defaultFileName = `AppleVision_Receipt_${sale.invoiceNumber}.pdf`;
        const res = await electronAPI.print.toPdf({
          html: fullHtml,
          defaultFileName,
        });

        if (res?.success && !res?.data?.canceled) {
          showNotification('success', `Receipt PDF saved: ${res.data?.filePath || defaultFileName}`);
        } else if (res?.data?.canceled) {
          // User dismissed save dialog
        } else {
          showNotification('error', res?.message || 'Failed to save PDF');
        }
      } else {
        // Fallback to browser print/pdf dialog
        window.print();
        showNotification('info', 'Opened system dialog to save or print receipt PDF');
      }
    } catch (err: any) {
      console.error('PDF export error:', err);
      showNotification('error', `PDF generation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExportingPdf(false);
    }
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
    if (tradeInCredit > 0) {
      text += `--------------------------------\n`;
      text += `*Trade-In Credit:* -LKR ${tradeInCredit.toLocaleString()}\n`;
    }
    text += `--------------------------------\n`;
    text += `*Subtotal:* LKR ${sale.subtotal.toLocaleString()}\n`;
    if (sale.discountTotal > 0) text += `*Discount:* -LKR ${sale.discountTotal.toLocaleString()}\n`;
    text += `*TOTAL PAID:* LKR ${sale.totalAmount.toLocaleString()}\n`;
    text += `*Method:* ${sale.paymentMethod}\n`;
    text += `--------------------------------\n`;
    text += `*3-Month Phone-to-Phone Replacement Warranty Included*\n`;
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
            style={{ shapeRendering: 'crispEdges' }}
          >
            {/* Store Logo */}
            <div className="flex justify-center pb-1">
              <img
                src={APPLEVISION_LOGO_BASE64}
                alt="AppleVision Store Galle"
                className="h-12 w-auto object-contain filter grayscale contrast-125"
              />
            </div>

            {/* Store Details Header */}
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

            {/* Purchased Items Table */}
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

            {/* Trade-In Device Received Box */}
            {(tradeIn || tradeInCredit > 0) && (
              <div className="border border-dashed border-slate-800 bg-slate-50 p-2.5 rounded-lg space-y-1 my-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-900">
                  <span className="flex items-center gap-1 text-emerald-800 font-extrabold">â˜… TRADE-IN DEVICE RECEIVED</span>
                  <span className="font-mono text-emerald-700 font-extrabold">-LKR {tradeInCredit.toLocaleString()}</span>
                </div>
                {tradeIn && (
                  <div className="text-[10px] text-slate-700 leading-snug space-y-0.5 pt-0.5">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{tradeIn.inspection?.model || tradeIn.model} {tradeIn.inspection?.storage || tradeIn.storage}</span>
                      <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded text-[9px] font-bold">
                        {tradeIn.inspection?.physicalGrade || tradeIn.physical_grade || 'Grade A'}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono text-[9px] text-slate-600">
                      <span>IMEI: {tradeIn.inspection?.imei1 || tradeIn.imei1 || 'N/A'}</span>
                      <span>Batt: {tradeIn.inspection?.batteryHealth ?? tradeIn.battery_health ?? 100}%</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 pt-0.5">
                      <span>Ref #: {tradeIn.tradeInNumber || tradeIn.trade_in_number || 'TRD-REC'}</span>
                      <span className="font-semibold text-slate-800">Approved Value: LKR {tradeInCredit.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Totals Breakdown */}
            <div className="space-y-1 border-b border-dashed border-slate-400 pb-2 text-[11px]">
              <div className="flex justify-between">
                <span>{tradeIn ? 'New Device Price:' : 'Subtotal:'}</span>
                <span>LKR {sale.subtotal.toLocaleString()}</span>
              </div>
              {tradeInCredit > 0 && (
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Trade-In Credit:</span>
                  <span>-LKR {tradeInCredit.toLocaleString()}</span>
                </div>
              )}
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
                <span>{tradeInCredit > 0 ? 'NET BALANCE PAID:' : 'TOTAL PAID:'}</span>
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

            {/* Code 128 Barcode & Prominent Warranty Notice */}
            <div className="text-center space-y-2 pt-1 text-[9px] text-slate-600 font-sans leading-tight">
              {/* Professional SVG Barcode */}
              <div className="py-2 flex flex-col items-center justify-center">
                <BarcodeSvg
                  value={sale.invoiceNumber}
                  height={42}
                  showText={true}
                  fontSize={10}
                  className="max-w-full flex justify-center"
                />
              </div>

              {/* 3-Month Phone-to-Phone Replacement Warranty Badge */}
              <div className="border border-slate-900 p-2 rounded-lg text-center my-1 bg-slate-50">
                <div className="font-extrabold text-[10px] uppercase text-slate-900 tracking-tight">
                  â˜… 3-MONTH PHONE-TO-PHONE WARRANTY â˜…
                </div>
                <div className="text-[8.5px] font-bold text-slate-800 mt-0.5">
                  à¶¯à·”à¶»à¶šà¶®à¶±à¶ºà¶§ à¶¯à·”à¶»à¶šà¶®à¶±à¶ºà¶šà·Š à¶¸à·à¶»à·” à¶šà·’à¶»à·“à¶¸à·š à¶´à·–à¶»à·Šà¶« à·€à¶œà¶šà·“à¶¸à¶šà·Š à·ƒà·„à·’à¶­à¶ºà·’
                </div>
              </div>

              <div className="text-[8.5px] text-slate-600 leading-snug pt-1">
                <div>{settings.receiptHeader}</div>
                <div className="font-semibold">{settings.receiptFooter}</div>
              </div>

              <div className="text-[9px] text-slate-400 font-mono pt-1">
                *** REVOLUTIONIZING APPLE RETAIL IN GALLE ***
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-light-surface/70 dark:bg-dark-surface/70 border-t border-light-border dark:border-dark-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
            >
              <Printer className="w-4 h-4" />
              <span>Print 80mm (Ctrl+P)</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'Saving PDF...' : 'Download / Save PDF'}</span>
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
