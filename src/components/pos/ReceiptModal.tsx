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
import { BarcodeSvg, generateCode128Svg } from '../../utils/barcodeGenerator';

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

  // Keyboard Shortcuts: Ctrl+P for 80mm print, F2 for next sale, Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'F2') {
        e.preventDefault();
        onClose();
        onNewSale();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const cleanSriLankanPhone = (rawPhone?: string): string => {
    if (!rawPhone) return '';
    const digits = rawPhone.replace(/[^0-9]/g, '');
    if (digits.startsWith('94') && digits.length >= 11) return digits;
    if (digits.startsWith('0') && digits.length === 10) return '94' + digits.substring(1);
    if (digits.length === 9) return '94' + digits;
    return digits;
  };

  const printHtmlViaIframe = (htmlContent: string) => {
    try {
      const existing = document.getElementById('print-isolated-iframe');
      if (existing) existing.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'print-isolated-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (!frameDoc) {
        window.print();
        return;
      }

      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.warn('Iframe print failed, falling back to window.print', err);
          window.print();
        }
      }, 400);
    } catch (err) {
      console.error('printHtmlViaIframe error:', err);
      window.print();
    }
  };

  const downloadHtmlFile = (fileName: string, htmlContent: string) => {
    try {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error('downloadHtmlFile error:', e);
    }
  };

  const build80mmReceiptHtml = (s: typeof sale, storeSettings: typeof settings): string => {
    const barcodeSvg = generateCode128Svg(s.invoiceNumber, {
      height: 38,
      showText: true,
      fontSize: 10,
      lineColor: '#000000',
      backgroundColor: 'transparent'
    });

    const tradeInRec = s.tradeInRecord || (s as any).tradeIn || (s as any).trade_in;
    const tradeCredit = s.tradeInCredit || tradeInRec?.finalApprovedValue || tradeInRec?.final_approved_value || 0;

    const itemRows = s.items.map((item, idx) => {
      const imei = item.imei ? `<div style="font-size:9.5px;color:#333;margin-top:2px;">IMEI: <strong>${item.imei}</strong></div>` : '';
      const warranty = item.warranty && item.warranty !== 'None' ? `<div style="font-size:9.5px;color:#047857;font-weight:bold;">★ ${item.warranty}</div>` : '';
      return `
        <div style="margin-bottom:7px;border-bottom:1px dotted #ccc;padding-bottom:5px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div style="font-weight:bold;font-size:11.5px;max-width:190px;">${item.productName || 'Apple Device'}</div>
            <div style="font-weight:bold;font-size:11.5px;text-align:right;">Rs. ${Number(item.lineTotal || 0).toLocaleString()}</div>
          </div>
          ${imei}
          ${warranty}
          <div style="font-size:10px;color:#555;margin-top:2px;">
            ${item.quantity} x Rs. ${Number(item.unitPrice || 0).toLocaleString()}
          </div>
        </div>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${s.invoiceNumber}</title>
  <style>
    @page { margin: 0; size: 80mm auto; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace, -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      color: #000000;
      background: #ffffff;
      width: 80mm;
      max-width: 80mm;
      padding: 4mm 3mm 8mm 3mm;
      margin: 0 auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .dashed-line { border-top: 1px dashed #000; margin: 8px 0; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; margin: 2px 0; }
    .warranty-box { border: 1.5px solid #000; padding: 6px; border-radius: 6px; text-align: center; margin: 8px 0; background: #fbfbfb; }
  </style>
</head>
<body>
  <div class="text-center" style="margin-bottom:6px;">
    <img src="${APPLEVISION_LOGO_BASE64}" alt="AppleVision Logo" style="max-height:48px;max-width:140px;margin:0 auto;display:block;" />
  </div>
  <div class="text-center" style="margin-bottom:6px;">
    <div style="font-size:14px;font-weight:900;letter-spacing:-0.3px;text-transform:uppercase;">${storeSettings.fullName || 'AppleVision Store Galle'}</div>
    <div style="font-size:10px;font-weight:bold;margin-top:1px;">${storeSettings.tagline || 'Reliable Best Service'}</div>
    <div style="font-size:9.5px;color:#333;margin-top:2px;">
      ${storeSettings.address || 'Kalegana Junction'}, ${storeSettings.city || 'Galle'}<br>
      Hotline: ${storeSettings.phone || '+94 77 923 0519'}
    </div>
  </div>
  <div class="dashed-line"></div>
  <div style="font-size:10px;">
    <div class="flex-between">
      <span>INVOICE #:</span>
      <span class="font-bold">${s.invoiceNumber}</span>
    </div>
    <div class="flex-between">
      <span>DATE &amp; TIME:</span>
      <span>${s.date} ${s.time || ''}</span>
    </div>
    <div class="flex-between">
      <span>CASHIER:</span>
      <span>${s.cashierName || 'Staff'}</span>
    </div>
    <div class="flex-between">
      <span>CUSTOMER:</span>
      <span class="font-bold">${s.customerName || 'Walk-in Customer'}</span>
    </div>
    ${s.customerPhone ? `<div class="flex-between"><span>PHONE:</span><span>${s.customerPhone}</span></div>` : ''}
  </div>
  <div class="dashed-line"></div>
  <div>${itemRows}</div>
  <div class="dashed-line"></div>
  <div style="font-size:11px;">
    <div class="flex-between">
      <span>SUBTOTAL:</span>
      <span>Rs. ${Number(s.subtotal || 0).toLocaleString()}</span>
    </div>
    ${Number(s.discountTotal || 0) > 0 ? `<div class="flex-between font-bold"><span>DISCOUNT:</span><span>-Rs. ${Number(s.discountTotal || 0).toLocaleString()}</span></div>` : ''}
    ${tradeCredit > 0 ? `<div class="flex-between font-bold"><span>TRADE-IN CREDIT:</span><span>-Rs. ${Number(tradeCredit).toLocaleString()}</span></div>` : ''}
    <div class="flex-between" style="font-size:14px;font-weight:900;border-top:1px solid #000;border-bottom:1px solid #000;padding:4px 0;margin:6px 0;">
      <span>NET TOTAL:</span>
      <span>Rs. ${Number(s.totalAmount || 0).toLocaleString()}</span>
    </div>
  </div>
  <div style="font-size:10px;margin-top:4px;">
    <div class="flex-between font-bold">
      <span>PAID VIA:</span>
      <span>${s.paymentMethod || 'Cash'}</span>
    </div>
    ${s.paymentDetails?.cashTendered !== undefined ? `
    <div class="flex-between"><span>CASH TENDERED:</span><span>Rs. ${Number(s.paymentDetails.cashTendered).toLocaleString()}</span></div>
    <div class="flex-between font-bold"><span>CHANGE DUE:</span><span>Rs. ${Number(s.paymentDetails.changeDue || 0).toLocaleString()}</span></div>` : ''}
    ${s.paymentDetails?.cardRef ? `<div class="flex-between"><span>CARD AUTH:</span><span>${s.paymentDetails.cardRef}</span></div>` : ''}
  </div>
  <div class="dashed-line"></div>
  <div class="text-center" style="margin:8px 0;">
    ${barcodeSvg}
  </div>
  <div class="warranty-box">
    <div style="font-size:10px;font-weight:900;text-transform:uppercase;">★ 3-MONTH PHONE-TO-PHONE WARRANTY ★</div>
    <div style="font-size:9.5px;font-weight:bold;margin-top:2px;">දුරකථනයට දුරකථනයක් මාරු කිරීමේ පූර්ණ වගකීමක් සහිතයි</div>
  </div>
  <div class="text-center" style="font-size:9px;color:#333;margin-top:6px;line-height:1.4;">
    <div>${storeSettings.receiptHeader || 'Thank you for shopping at AppleVision Store Galle!'}</div>
    <div style="font-weight:bold;margin-top:2px;">${storeSettings.receiptFooter || 'Warranty valid only with original invoice.'}</div>
    <div style="font-size:8.5px;color:#777;margin-top:6px;">*** REVOLUTIONIZING APPLE RETAIL IN GALLE ***</div>
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    showNotification('info', 'Opening 80mm thermal receipt print...');
    const receiptHtml = build80mmReceiptHtml(sale, settings);
    printHtmlViaIframe(receiptHtml);
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const receiptHtml = build80mmReceiptHtml(sale, settings);
      const defaultFileName = `AppleVision_Receipt_${sale.invoiceNumber}.html`;

      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.print?.toPdf) {
        const res = await electronAPI.print.toPdf({
          html: receiptHtml,
          defaultFileName: `AppleVision_Receipt_${sale.invoiceNumber}.pdf`,
        });
        if (res?.success && !res?.data?.canceled) {
          showNotification('success', `Receipt PDF saved: ${res.data?.filePath || defaultFileName}`);
          return;
        }
      }

      // Web Mode: Open isolated print/PDF preview and download standalone file
      printHtmlViaIframe(receiptHtml);
      downloadHtmlFile(defaultFileName, receiptHtml);
      showNotification('success', 'Receipt opened in print dialog and saved to Downloads!');
    } catch (err: any) {
      console.error('PDF export error:', err);
      showNotification('error', `PDF generation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleWhatsApp = () => {
    let text = `*${settings.fullName || 'AppleVision Store Galle'}*\n`;
    text += `Kalegana Junction, Galle\n`;
    text += `Hotline: ${settings.phone || '+94 77 923 0519'}\n`;
    text += `--------------------------------\n`;
    text += `*INVOICE: #${sale.invoiceNumber}*\n`;
    text += `Date: ${sale.date} ${sale.time || ''}\n`;
    text += `Customer: ${sale.customerName || 'Valued Customer'}\n`;
    text += `--------------------------------\n`;
    sale.items.forEach((item, idx) => {
      text += `${idx + 1}. *${item.productName}*\n`;
      if (item.imei) text += `   • IMEI: ${item.imei}\n`;
      if (item.warranty && item.warranty !== 'None') text += `   • Warranty: ${item.warranty}\n`;
      text += `   • Qty: ${item.quantity} x LKR ${item.unitPrice.toLocaleString()} = LKR ${item.lineTotal.toLocaleString()}\n`;
    });
    if (tradeInCredit > 0) {
      text += `--------------------------------\n`;
      text += `*Trade-In Credit:* -LKR ${tradeInCredit.toLocaleString()}\n`;
    }
    text += `--------------------------------\n`;
    text += `*Subtotal:* LKR ${sale.subtotal.toLocaleString()}\n`;
    if (sale.discountTotal > 0) text += `*Discount:* -LKR ${sale.discountTotal.toLocaleString()}\n`;
    text += `*TOTAL PAID:* LKR ${sale.totalAmount.toLocaleString()}\n`;
    text += `*Payment Method:* ${sale.paymentMethod || 'Cash'}\n`;
    text += `--------------------------------\n`;
    text += `*★ 3-Month Phone-to-Phone Replacement Warranty Included*\n`;
    text += `(දුරකථනයට දුරකථනයක් මාරු කිරීමේ පූර්ණ වගකීමක් සහිතයි)\n`;
    text += `Thank you for choosing AppleVision Store Galle!`;

    const encoded = encodeURIComponent(text);
    const targetPhone = cleanSriLankanPhone(sale.customerPhone);

    const waUrl = targetPhone 
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(waUrl, '_blank');
    showNotification('success', targetPhone ? `Dispatching WhatsApp invoice to ${targetPhone}...` : 'Opening WhatsApp to choose recipient...');
  };

const buildA4InvoiceHtml = (s: typeof sale, storeSettings: typeof settings, docType: 'INVOICE' | 'QUOTE'): string => {
  const accentColor = docType === 'QUOTE' ? '#0ea5e9' : '#e61e25';
  const isQuote = docType === 'QUOTE';
  const logoSrc = APPLEVISION_LOGO_BASE64;
  
  const barcodeSvg = generateCode128Svg(s.invoiceNumber, {
    height: 44,
    showText: true,
    fontSize: 11,
    lineColor: '#0f172a',
    backgroundColor: 'transparent'
  });

  const tradeInRecord = s.tradeInRecord || (s as any).tradeIn || (s as any).trade_in;
  const tradeInCredit = s.tradeInCredit || tradeInRecord?.finalApprovedValue || tradeInRecord?.final_approved_value || 0;

  const itemRows = s.items.map((item, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    const discount = Number((item as any).discountAmount || (item as any).discount_amount || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const lineTotal = Number(item.lineTotal || (item as any).line_total || (item.quantity * unitPrice));
    const imei = item.imei || '';
    const warranty = item.warranty && item.warranty !== 'None' ? item.warranty : '3 Months AppleVision Warranty';
    return `
    <tr style="background:${bg};">
      <td style="padding:10px 12px;font-size:11px;text-align:center;color:#64748b;border-bottom:1px solid #e2e8f0;font-weight:600;">${String(idx+1).padStart(2, '0')}.</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">
        <div style="font-weight:700;font-size:13px;color:#0f172a;letter-spacing:-0.2px;">${item.productName || (item as any).product_name || 'Apple Device'}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:4px;">
          ${imei ? `<span style="font-family:'Courier New',Courier,monospace;font-size:10px;background:#f1f5f9;color:#334155;padding:2px 7px;border-radius:4px;border:1px solid #cbd5e1;font-weight:700;">IMEI: ${imei}</span>` : ''}
          <span style="font-size:10px;font-weight:700;color:#059669;background:#ecfdf5;padding:2px 7px;border-radius:4px;border:1px solid #a7f3d0;">✓ ${warranty}</span>
        </div>
      </td>
      <td style="padding:10px 12px;text-align:right;font-size:12px;color:#0f172a;font-weight:600;border-bottom:1px solid #e2e8f0;">Rs. ${unitPrice.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      <td style="padding:10px 12px;text-align:center;font-size:12px;color:#0f172a;font-weight:700;border-bottom:1px solid #e2e8f0;">${item.quantity}</td>
      <td style="padding:10px 12px;text-align:right;font-weight:800;font-size:13px;color:#0f172a;border-bottom:1px solid #e2e8f0;">Rs. ${lineTotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${docType} - ${s.invoiceNumber}</title>
  <style>
    @page {
      margin: 10mm 12mm 10mm 12mm;
      size: A4 portrait;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.45;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding: 0;
    }
    .page-wrapper {
      width: 100%;
      background: #ffffff;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 2px solid #f1f5f9;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-logo-img {
      width: 68px;
      height: 68px;
      border-radius: 14px;
      object-fit: cover;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: 1px solid #0f172a;
      background: #000000;
      display: block;
    }
    .company-title {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      line-height: 1.15;
    }
    .company-tagline {
      font-size: 10px;
      font-weight: 800;
      color: ${accentColor};
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-top: 3px;
    }
    .store-address {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.4;
    }
    .doc-meta-right {
      text-align: right;
    }
    .doc-main-title {
      font-size: 34px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #0f172a;
      line-height: 1;
    }
    .doc-ref-number {
      font-size: 13px;
      font-family: 'Courier New', Courier, monospace;
      font-weight: 700;
      color: #64748b;
      margin-top: 5px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-top: 8px;
    }
    .badge-paid {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .badge-quote {
      background: #f0f9ff;
      color: #0284c7;
      border: 1px solid #bae6fd;
    }
    .second-row {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 22px;
      margin-bottom: 22px;
    }
    .bill-to-card {
      flex: 1.1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 18px;
    }
    .card-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${accentColor};
      margin-bottom: 6px;
    }
    .customer-name {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .customer-line {
      font-size: 11px;
      color: #475569;
      line-height: 1.6;
    }
    .invoice-info-card {
      flex: 1.3;
      display: flex;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }
    .accent-indicator {
      width: 5px;
      background: ${accentColor};
      flex-shrink: 0;
    }
    .info-grid {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding: 12px 18px;
      gap: 10px 16px;
    }
    .info-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
    }
    .info-value {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      margin-bottom: 20px;
    }
    .items-table thead tr {
      background: ${accentColor};
      color: #ffffff;
    }
    .items-table th {
      padding: 11px 12px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .trade-in-card {
      background: #f0fdf4;
      border: 1.5px dashed #22c55e;
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .trade-in-badge {
      font-size: 10px;
      font-weight: 800;
      background: #16a34a;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-right: 8px;
    }
    .trade-in-text {
      font-size: 12px;
      font-weight: 700;
      color: #14532d;
    }
    .trade-in-val {
      font-size: 13px;
      font-weight: 800;
      color: #16a34a;
    }
    .bottom-layout {
      display: flex;
      gap: 22px;
      margin-bottom: 24px;
      align-items: flex-start;
    }
    .bottom-left {
      flex: 1.4;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .bottom-right {
      flex: 1;
    }
    .payment-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .box-heading {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${accentColor};
      margin-bottom: 6px;
    }
    .payment-content {
      font-size: 11px;
      color: #334155;
      line-height: 1.6;
    }
    .warranty-box {
      background: ${isQuote ? '#f0f9ff' : '#fff1f2'};
      border: 1.5px solid ${isQuote ? '#bae6fd' : '#fecdd3'};
      border-radius: 8px;
      padding: 12px 16px;
    }
    .warranty-title {
      font-size: 11px;
      font-weight: 800;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .warranty-sinhala {
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 5px;
    }
    .warranty-terms {
      font-size: 10px;
      color: #475569;
      line-height: 1.55;
    }
    .barcode-panel {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }
    .barcode-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .totals-container {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      background: #ffffff;
    }
    .totals-line {
      display: flex;
      justify-content: space-between;
      padding: 9px 16px;
      font-size: 12px;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }
    .totals-grand {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      font-size: 15px;
      font-weight: 800;
      background: ${accentColor};
      color: #ffffff;
    }
    .footer-strip {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1.5px solid #e2e8f0;
      padding-top: 18px;
      margin-top: 10px;
    }
    .sign-area {
      text-align: left;
    }
    .sign-line {
      width: 170px;
      border-bottom: 1.5px dashed #94a3b8;
      margin-bottom: 6px;
      height: 28px;
    }
    .sign-officer {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
    }
    .sign-role {
      font-size: 10px;
      color: #64748b;
    }
    .thank-you-msg {
      text-align: right;
      font-size: 18px;
      font-weight: 800;
      font-style: italic;
      color: ${accentColor};
      letter-spacing: -0.3px;
    }
    .thank-sub {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
    }
    .disclaimer {
      font-size: 9px;
      color: #94a3b8;
      text-align: center;
      margin-top: 14px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="page-wrapper">
    <!-- Top Header -->
    <div class="header-row">
      <div class="brand-group">
        <img src="${logoSrc}" alt="AppleVision Logo" class="brand-logo-img" />
        <div>
          <div class="company-title">${storeSettings.fullName || 'AppleVision Store Galle'}</div>
          <div class="company-tagline">Reliable Best Service · Genuine Apple Retail</div>
          <div class="store-address">
            ${storeSettings.address || 'Kalegana Junction'}, ${storeSettings.city || 'Galle'} 80000, Sri Lanka<br>
            Hotline: <strong>${storeSettings.phone || '+94 77 923 0519'}</strong> &nbsp;|&nbsp; Email: <strong>${storeSettings.email || 'nethminasurinda@gmail.com'}</strong>
          </div>
        </div>
      </div>
      <div class="doc-meta-right">
        <div class="doc-main-title">${isQuote ? 'QUOTATION' : 'INVOICE'}</div>
        <div class="doc-ref-number">#${s.invoiceNumber}</div>
        <div class="status-badge ${isQuote ? 'badge-quote' : 'badge-paid'}">
          ${isQuote ? 'OFFICIAL QUOTATION · 30 DAYS' : 'PAID IN FULL ✓'}
        </div>
      </div>
    </div>

    <!-- Second Row: Customer Details & Transaction Card (Reference Style) -->
    <div class="second-row">
      <div class="bill-to-card">
        <div class="card-label">INVOICE TO:</div>
        <div class="customer-name">${s.customerName || 'Valued Walk-in Customer'}</div>
        ${s.customerPhone ? `<div class="customer-line">Mobile: <strong>${s.customerPhone}</strong></div>` : ''}
        <div class="customer-line">Location: ${(s as any).customerAddress || 'Galle, Southern Province, Sri Lanka'}</div>
        <div class="customer-line" style="margin-top: 3px; font-size: 10px; color: #64748b;">
          Payment Method: <strong>${s.paymentMethod || 'Cash'}</strong>
        </div>
      </div>

      <div class="invoice-info-card">
        <div class="accent-indicator"></div>
        <div class="info-grid">
          <div>
            <div class="info-label">Invoice Number</div>
            <div class="info-value">${s.invoiceNumber}</div>
          </div>
          <div>
            <div class="info-label">Date Information</div>
            <div class="info-value">${s.date} ${s.time || ''}</div>
          </div>
          <div>
            <div class="info-label">Cashier / Attendant</div>
            <div class="info-value">${s.cashierName || 'Staff'}</div>
          </div>
          <div>
            <div class="info-label">Transaction Status</div>
            <div class="info-value" style="color: ${isQuote ? '#0284c7' : '#059669'};">${isQuote ? 'QUOTED' : 'COMPLETED'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">NO</th>
          <th style="text-align: left;">ITEM DESCRIPTION</th>
          <th style="width: 120px; text-align: right;">PRICE</th>
          <th style="width: 60px; text-align: center;">QTY</th>
          <th style="width: 130px; text-align: right;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- Trade-In Device Received (if any) -->
    ${tradeInCredit > 0 ? `
    <div class="trade-in-card">
      <div style="display:flex;align-items:center;">
        <span class="trade-in-badge">★ TRADE-IN TAKEN</span>
        <span class="trade-in-text">
          ${tradeInRecord?.brand || 'Apple'} ${tradeInRecord?.model || 'Device'}
          ${tradeInRecord?.storage ? `(${tradeInRecord.storage})` : ''}
          ${tradeInRecord?.imei ? `&nbsp;·&nbsp; IMEI: ${tradeInRecord.imei}` : ''}
          ${tradeInRecord?.batteryHealth ? `&nbsp;·&nbsp; Battery: ${tradeInRecord.batteryHealth}%` : ''}
          ${tradeInRecord?.grade ? `&nbsp;·&nbsp; Grade: ${tradeInRecord.grade}` : ''}
        </span>
      </div>
      <div class="trade-in-val">
        Credit Deducted: -Rs. ${Number(tradeInCredit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
    ` : ''}

    <!-- Bottom Section: Payment / Terms on Left, Totals on Right -->
    <div class="bottom-layout">
      <div class="bottom-left">
        <!-- Payment & Bank Details -->
        <div class="payment-box">
          <div class="box-heading">Payment Information &amp; Bank Details</div>
          <div class="payment-content">
            Method: <strong>${s.paymentMethod || 'Cash'}</strong> &nbsp;|&nbsp;
            Status: <strong>${isQuote ? 'Quoted' : 'Paid in Full'}</strong><br>
            Bank: <strong>Commercial Bank of Ceylon PLC</strong> &nbsp;·&nbsp; Branch: <strong>Galle City</strong><br>
            Account: <strong>AppleVision Store Galle</strong> &nbsp;·&nbsp; Account No: <strong>8009230519</strong>
          </div>
        </div>

        <!-- Warranty & Guarantee Policy -->
        <div class="warranty-box">
          <div class="warranty-title">★ 3-Month Phone-to-Phone Replacement Warranty ★</div>
          <div class="warranty-sinhala">දුරකථනයට දුරකථනයක් මාරු කිරීමේ පූර්ණ වගකීමක් සහිතයි</div>
          <div class="warranty-terms">
            1. 3-Month Phone-to-Phone Replacement Warranty for device hardware/logic board defects.<br>
            2. Warranty is valid ONLY upon presentation of this original invoice with matching device IMEI.<br>
            3. Drops, screen damage, liquid ingress, or unauthorized disassembly strictly voids warranty.<br>
            4. Apple ID / iCloud security is customer's responsibility. Exchange within 7 days in original state.
          </div>
        </div>

        <!-- Barcode Verification -->
        <div class="barcode-panel">
          <div class="barcode-label">Scan to Verify Official Invoice</div>
          ${barcodeSvg}
        </div>
      </div>

      <div class="bottom-right">
        <!-- Totals Container -->
        <div class="totals-container">
          <div class="totals-line">
            <span>Sub Total</span>
            <span style="font-weight:700;">Rs. ${Number(s.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          ${Number(s.discountTotal || 0) > 0 ? `
          <div class="totals-line" style="color: #dc2626;">
            <span>Discount</span>
            <span style="font-weight:700;">-Rs. ${Number(s.discountTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>` : ''}
          ${tradeInCredit > 0 ? `
          <div class="totals-line" style="color: #16a34a;">
            <span>Trade-In Credit</span>
            <span style="font-weight:700;">-Rs. ${Number(tradeInCredit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>` : ''}
          <div class="totals-line">
            <span>Tax / VAT (0%)</span>
            <span style="color:#64748b;">Included</span>
          </div>
          <div class="totals-grand">
            <span>${isQuote ? 'QUOTED TOTAL' : 'TOTAL PAID'}</span>
            <span>Rs. ${Number(s.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer: Manager Signature, Thank You & Store Tagline -->
    <div class="footer-strip">
      <div class="sign-area">
        <div class="sign-line"></div>
        <div class="sign-officer">${(storeSettings as any).managerName || 'Surinda Nethmina'}</div>
        <div class="sign-role">Store Manager / Authorized Officer</div>
      </div>
      <div>
        <div class="thank-you-msg">Thank you for your business!</div>
        <div class="thank-sub">AppleVision Store Galle · Kalegana Junction, Galle</div>
      </div>
    </div>

    <div class="disclaimer">
      *** REVOLUTIONIZING APPLE RETAIL IN GALLE · OFFICIAL APPLEVISION TAX INVOICE · SYSTEM GENERATED ***
    </div>
  </div>
</body>
</html>`;
};

const handleDownloadA4Invoice = async () => {
  setIsExportingA4(true);
  try {
    const a4Html = buildA4InvoiceHtml(sale, settings, 'INVOICE');
    const defaultFileName = `AppleVision_Invoice_${sale.invoiceNumber}.html`;
    const electronAPI = (window as any).electronAPI;
    
    if (electronAPI?.print?.toA4Pdf) {
      const res = await electronAPI.print.toA4Pdf({ html: a4Html, defaultFileName: `AppleVision_Invoice_${sale.invoiceNumber}.pdf` });
      if (res?.success && !res?.data?.canceled) {
        showNotification('success', `A4 Invoice saved: ${res.data?.filePath || defaultFileName}`);
        return;
      }
    } else if (electronAPI?.print?.generateA4Invoice) {
      const r = await electronAPI.print.generateA4Invoice({ invoiceId: sale.id, docType: 'INVOICE' });
      if (r?.success && electronAPI?.print?.toA4Pdf) {
        const res = await electronAPI.print.toA4Pdf({ html: r.html, defaultFileName: `AppleVision_Invoice_${sale.invoiceNumber}.pdf` });
        if (res?.success && !res?.data?.canceled) {
          showNotification('success', `A4 Invoice saved: ${res.data?.filePath || defaultFileName}`);
          return;
        }
      }
    }
    
    // Web Mode: Open isolated print/PDF preview and download standalone file
    printHtmlViaIframe(a4Html);
    downloadHtmlFile(defaultFileName, a4Html);
    showNotification('success', 'A4 Invoice opened for printing & saved to Downloads!');
  } catch (err: any) {
    showNotification('error', `A4 Invoice failed: ${err.message}`);
  } finally {
    setIsExportingA4(false);
  }
};

const handleDownloadQuote = async () => {
  setIsExportingA4(true);
  try {
    const a4Html = buildA4InvoiceHtml(sale, settings, 'QUOTE');
    const defaultFileName = `AppleVision_Quote_${sale.invoiceNumber}.html`;
    const electronAPI = (window as any).electronAPI;
    
    if (electronAPI?.print?.toA4Pdf) {
      const res = await electronAPI.print.toA4Pdf({ html: a4Html, defaultFileName: `AppleVision_Quote_${sale.invoiceNumber}.pdf` });
      if (res?.success && !res?.data?.canceled) {
        showNotification('success', `Quote PDF saved: ${res.data?.filePath || defaultFileName}`);
        return;
      }
    }
    
    // Web Mode: Open isolated print/PDF preview and download standalone file
    printHtmlViaIframe(a4Html);
    downloadHtmlFile(defaultFileName, a4Html);
    showNotification('success', 'A4 Quote opened for printing & saved to Downloads!');
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
