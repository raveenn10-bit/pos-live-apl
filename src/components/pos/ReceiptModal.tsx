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
  Repeat,
  FileText,
  ClipboardList
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
  const [isExportingA4, setIsExportingA4] = useState(false);

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
    img { max-width: 90px; height: auto; display: block; margin: 0 auto; }
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

const buildA4InvoiceHtml = (s: typeof sale, storeSettings: typeof settings, docType: 'INVOICE' | 'QUOTE'): string => {
  const accentColor = docType === 'QUOTE' ? '#0ea5e9' : '#e61e25';
  const isQuote = docType === 'QUOTE';
  const logoSrc = APPLEVISION_LOGO_BASE64; // colored logo
  
  const itemRows = s.items.map((item, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f9f9f9';
    const discount = Number((item as any).discountAmount || (item as any).discount_amount || 0);
    return `
    <tr style="background:${bg};">
      <td style="padding:10px 12px;font-size:12px;text-align:center;border-bottom:1px solid #e2e8f0;">${idx+1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">
        <div style="font-weight:600;font-size:13px;color:#000;">${item.productName || (item as any).product_name || 'Apple Device'}</div>
        ${item.imei ? `<div style="font-size:11px;color:#555;margin-top:2px;">IMEI: ${item.imei}</div>` : ''}
        ${item.warranty && item.warranty !== 'None' ? `<div style="font-size:11px;color:#555;margin-top:1px;">Warranty: ${item.warranty}</div>` : ''}
      </td>
      <td style="padding:10px 12px;text-align:right;font-size:12px;color:#000;border-bottom:1px solid #e2e8f0;">Rs. ${Number(item.unitPrice||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      <td style="padding:10px 12px;text-align:center;font-size:12px;color:#000;border-bottom:1px solid #e2e8f0;">${item.quantity}</td>
      <td style="padding:10px 12px;text-align:right;font-weight:700;font-size:13px;color:#000;border-bottom:1px solid #e2e8f0;">Rs. ${Number(item.lineTotal||(item as any).line_total||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${docType} - ${s.invoiceNumber}</title><style>
    @page { margin: 0; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      color: #000;
      background: #f5f5f5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding: 40px;
    }
    .container { background: #ffffff; width: 100%; min-height: 1000px; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .logo-box { background: ${accentColor}; padding: 10px; display: inline-block; margin-right: 15px; }
    .logo-box img { max-height: 50px; max-width: 50px; object-fit: contain; filter: brightness(0) invert(1); }
    .company-info { display: inline-block; vertical-align: top; }
    .company-name { font-size: 20px; font-weight: bold; color: #000; }
    .company-subtitle { font-size: 12px; color: #555; margin-top: 5px; }
    .doc-title { font-size: 36px; font-weight: bold; color: #000; text-align: right; }
    .doc-number { font-size: 14px; color: #555; text-align: right; margin-top: 5px; }
    .second-row { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .bill-to h3 { font-size: 14px; color: #000; margin-bottom: 5px; }
    .bill-to-name { font-size: 14px; color: #555; }
    .info-boxes { display: flex; gap: 20px; }
    .info-box { background: #f9f9f9; padding: 10px 20px; border: 1px solid #eee; }
    .info-box-title { font-size: 11px; color: #555; margin-bottom: 5px; text-transform: uppercase; }
    .info-box-value { font-size: 13px; font-weight: bold; color: #000; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table thead tr { background: ${accentColor}; color: #fff; }
    .items-table th { padding: 12px; text-align: left; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .items-table th.center { text-align: center; }
    .items-table th.right { text-align: right; }
    .bottom-section { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 40px; }
    .payment-info, .terms-info { flex: 1; }
    .section-title { font-size: 12px; font-weight: bold; color: #000; margin-bottom: 10px; text-transform: uppercase; }
    .section-text { font-size: 11px; color: #555; line-height: 1.5; }
    .totals-box { flex: 1; max-width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #000; border-bottom: 1px solid #eee; }
    .totals-row.grand-total { background: ${accentColor}; color: #fff; font-size: 15px; font-weight: bold; padding: 12px 15px; border: none; margin-top: 10px; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #eee; padding-top: 20px; }
    .manager-name { font-size: 14px; font-weight: bold; color: #000; }
    .manager-title { font-size: 11px; color: #555; }
    .contact-info { font-size: 11px; color: #555; margin-top: 5px; }
    .thank-you { font-size: 16px; font-weight: bold; font-style: italic; color: ${accentColor}; }
  </style></head><body>
  <div class="container">
    <div class="top-row">
      <div>
        <div class="logo-box"><img src="${logoSrc}" alt="Logo" /></div>
        <div class="company-info">
          <div class="company-name">${storeSettings.fullName || 'AppleVision Store Galle'}</div>
          <div class="company-subtitle">Authorized Apple Reseller</div>
        </div>
      </div>
      <div>
        <div class="doc-title">${isQuote ? 'QUOTE' : 'INVOICE'}</div>
        <div class="doc-number">${s.invoiceNumber}</div>
      </div>
    </div>
    <div class="second-row">
      <div class="bill-to">
        <h3>${isQuote ? 'QUOTE TO:' : 'INVOICE TO:'}</h3>
        <div class="bill-to-name">${s.customerName || 'Walk-in Customer'}</div>
        ${s.customerPhone ? `<div class="bill-to-name">${s.customerPhone}</div>` : ''}
      </div>
      <div class="info-boxes">
        <div class="info-box">
          <div class="info-box-title">Invoice Number</div>
          <div class="info-box-value">${s.invoiceNumber}</div>
        </div>
        <div class="info-box">
          <div class="info-box-title">Date Information</div>
          <div class="info-box-value">${s.date}</div>
        </div>
      </div>
    </div>
    <table class="items-table">
      <thead><tr>
        <th class="center" style="width: 50px;">NO</th>
        <th>ITEM DESCRIPTION</th>
        <th class="right" style="width: 120px;">PRICE</th>
        <th class="center" style="width: 80px;">QTY</th>
        <th class="right" style="width: 120px;">TOTAL</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div class="bottom-section">
      <div class="payment-info">
        <div class="section-title">Payment Method</div>
        <div class="section-text">
          ${isQuote ? 'Cash � Bank Transfer � Card � Installment<br>Bank: Commercial Bank of Ceylon, Galle Branch<br>Account: AppleVision Store Galle' : 
          `Method: ${s.paymentMethod}<br>Amount Paid: Rs. ${Number((s as any).amountPaid || s.totalAmount || 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}${(s as any).bankName ? `<br>Bank: ${(s as any).bankName}` : ''}`}
        </div>
      </div>
      <div class="terms-info">
        <div class="section-title">Terms & Conditions</div>
        <div class="section-text">
          ${isQuote ? 'All quoted devices are genuine Apple products with valid serial numbers. Prices valid for 30 days.' : 
          '3 Months Phone-to-Phone Replacement Warranty for device hardware defects. Warranty valid with original invoice & matching IMEI.'}
        </div>
      </div>
      <div class="totals-box">
        <div class="totals-row"><span>Sub Total</span><span>Rs. ${Number(s.subtotal||0).toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
        ${Number(s.discountTotal||0) > 0 ? `<div class="totals-row"><span>Discount</span><span>-Rs. ${Number(s.discountTotal||0).toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>` : ''}
        ${tradeInCredit > 0 ? `<div class="totals-row"><span>Trade-In Credit</span><span>-Rs. ${Number(tradeInCredit).toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>` : ''}
        <div class="totals-row grand-total"><span>Grand Total</span><span>Rs. ${Number(s.totalAmount||0).toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
      </div>
    </div>
    <div class="footer">
      <div>
        <div class="manager-name">${(storeSettings as any).managerName || s.cashierName || 'Store Manager'}</div>
        <div class="manager-title">Store Manager</div>
        <div class="contact-info">${storeSettings.phone || '+94 77 923 0519'} | ${storeSettings.email || 'nethminasurinda@gmail.com'}</div>
      </div>
      <div class="thank-you">Thank you for your business!</div>
    </div>
  </div>
</body></html>`;
};

const handleDownloadA4Invoice = async () => {
  setIsExportingA4(true);
  try {
    const electronAPI = (window as any).electronAPI;
    const a4Html = buildA4InvoiceHtml(sale, settings, 'INVOICE');
    const defaultFileName = `AppleVision_Invoice_${sale.invoiceNumber}.pdf`;
    
    let res;
    if (electronAPI?.print?.toA4Pdf) {
      res = await electronAPI.print.toA4Pdf({ html: a4Html, defaultFileName });
    } else if (electronAPI?.print?.generateA4Invoice) {
      const r = await electronAPI.print.generateA4Invoice({ invoiceId: sale.id, docType: 'INVOICE' });
      if (r?.success) {
        res = await electronAPI.print.toA4Pdf({ html: r.html, defaultFileName });
      }
    } else {
      const w = window.open('', '_blank');
      if (w) { w.document.write(a4Html); w.document.close(); w.print(); }
      showNotification('info', 'Opened print dialog for A4 Invoice');
      return;
    }
    
    if (res?.success && !res?.data?.canceled) {
      showNotification('success', `A4 Invoice saved: ${res.data?.filePath || defaultFileName}`);
    } else if (!res?.data?.canceled) {
      showNotification('error', res?.message || 'Failed to save A4 Invoice');
    }
  } catch (err: any) {
    showNotification('error', `A4 Invoice failed: ${err.message}`);
  } finally {
    setIsExportingA4(false);
  }
};

const handleDownloadQuote = async () => {
  setIsExportingA4(true);
  try {
    const electronAPI = (window as any).electronAPI;
    const a4Html = buildA4InvoiceHtml(sale, settings, 'QUOTE');
    const defaultFileName = `AppleVision_Quote_${sale.invoiceNumber}.pdf`;
    
    if (electronAPI?.print?.toA4Pdf) {
      const res = await electronAPI.print.toA4Pdf({ html: a4Html, defaultFileName });
      if (res?.success && !res?.data?.canceled) {
        showNotification('success', `Quote PDF saved: ${res.data?.filePath || defaultFileName}`);
      } else if (!res?.data?.canceled) {
        showNotification('error', res?.message || 'Failed to save Quote');
      }
    } else {
      const w = window.open('', '_blank');
      if (w) { w.document.write(a4Html); w.document.close(); w.print(); }
    }
  } catch (err: any) {
    showNotification('error', `Quote failed: ${err.message}`);
  } finally {
    setIsExportingA4(false);
  }
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
                className="h-12 w-auto object-contain"
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
                  <span className="flex items-center gap-1 text-emerald-800 font-extrabold">★ TRADE-IN DEVICE RECEIVED</span>
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
                  ★ 3-MONTH PHONE-TO-PHONE WARRANTY ★
                </div>
                <div className="text-[8.5px] font-bold text-slate-800 mt-0.5">
                  දුරකථනයට දුරකථනයක් මාරු කිරීමේ පූර්ණ වගකීමක් සහිතයි
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
              onClick={handleDownloadA4Invoice}
              disabled={isExportingA4}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>{isExportingA4 ? 'Generating...' : 'A4 Invoice'}</span>
            </button>

            <button
              onClick={handleDownloadQuote}
              disabled={isExportingA4}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              <span>{isExportingA4 ? 'Generating...' : 'A4 Quote'}</span>
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
