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
  ShieldCheck,
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
  const invoiceDocRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingQuote, setIsExportingQuote] = useState(false);

  useEffect(() => {
    if (isOpen && lastCompletedSale) {
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e61e25', '#10b981', '#3b82f6', '#f59e0b', '#ffffff'],
        });
      } catch (e) {
        console.log('Confetti failed to trigger', e);
      }
    }
  }, [isOpen, lastCompletedSale]);

  // Keyboard Shortcuts: Ctrl+P for PDF print, F2 for next sale, Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrintPdf();
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

  if (!isOpen || !lastCompletedSale) return null;

  const sale = lastCompletedSale;
  const tradeIn = sale.tradeInRecord || (sale as any).tradeIn || (sale as any).trade_in;
  const tradeInCredit = sale.tradeInCredit || tradeIn?.finalApprovedValue || tradeIn?.final_approved_value || 0;

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

  const buildA4InvoiceHtml = (s: typeof sale, storeSettings: typeof settings, docType: 'INVOICE' | 'QUOTE'): string => {
    const accentColor = docType === 'QUOTE' ? '#0ea5e9' : '#e61e25';
    const isQuote = docType === 'QUOTE';
    const logoSrc = APPLEVISION_LOGO_BASE64;
    
    const barcodeSvg = generateCode128Svg(s.invoiceNumber, {
      height: 42,
      showText: true,
      fontSize: 10,
      lineColor: '#0f172a',
      backgroundColor: 'transparent'
    });

    const tradeInRecord = s.tradeInRecord || (s as any).tradeIn || (s as any).trade_in;
    const tradeInCred = s.tradeInCredit || tradeInRecord?.finalApprovedValue || tradeInRecord?.final_approved_value || 0;

    const itemRows = s.items.map((item, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
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
  <title>${docType === 'QUOTE' ? 'Quotation' : 'Invoice'} - ${s.invoiceNumber}</title>
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
      font-size: 32px;
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
      margin-top: 20px;
      margin-bottom: 20px;
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

    ${tradeInCred > 0 ? `
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
        Credit Deducted: -Rs. ${Number(tradeInCred).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
    ` : ''}

    <div class="bottom-layout">
      <div class="bottom-left">
        <div class="payment-box">
          <div class="box-heading">Payment Information &amp; Bank Details</div>
          <div class="payment-content">
            Method: <strong>${s.paymentMethod || 'Cash'}</strong> &nbsp;|&nbsp;
            Status: <strong>${isQuote ? 'Quoted' : 'Paid in Full'}</strong><br>
            Bank: <strong>Commercial Bank of Ceylon PLC</strong> &nbsp;·&nbsp; Branch: <strong>Galle City</strong><br>
            Account: <strong>AppleVision Store Galle</strong> &nbsp;·&nbsp; Account No: <strong>8009230519</strong>
          </div>
        </div>

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

        <div class="barcode-panel">
          <div class="barcode-label">Scan to Verify Official Invoice</div>
          ${barcodeSvg}
        </div>
      </div>

      <div class="bottom-right">
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
          ${tradeInCred > 0 ? `
          <div class="totals-line" style="color: #16a34a;">
            <span>Trade-In Credit</span>
            <span style="font-weight:700;">-Rs. ${Number(tradeInCred).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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

  const handlePrintPdf = () => {
    showNotification('info', 'Opening official Invoice PDF for printing...');
    const a4Html = buildA4InvoiceHtml(sale, settings, 'INVOICE');
    printHtmlViaIframe(a4Html);
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const a4Html = buildA4InvoiceHtml(sale, settings, 'INVOICE');
      const defaultFileName = `AppleVision_Invoice_${sale.invoiceNumber}.html`;
      const electronAPI = (window as any).electronAPI;

      if (electronAPI?.print?.toA4Pdf) {
        const res = await electronAPI.print.toA4Pdf({ 
          html: a4Html, 
          defaultFileName: `AppleVision_Invoice_${sale.invoiceNumber}.pdf` 
        });
        if (res?.success && !res?.data?.canceled) {
          showNotification('success', `A4 Invoice PDF saved: ${res.data?.filePath || defaultFileName}`);
          return;
        }
      }

      // Web Mode: Open isolated print/PDF preview and download standalone printable file
      printHtmlViaIframe(a4Html);
      downloadHtmlFile(defaultFileName, a4Html);
      showNotification('success', 'Invoice PDF ready! Save as PDF dialog opened and downloaded.');
    } catch (err: any) {
      console.error('PDF export error:', err);
      showNotification('error', `PDF generation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadQuote = async () => {
    setIsExportingQuote(true);
    try {
      const a4Html = buildA4InvoiceHtml(sale, settings, 'QUOTE');
      const defaultFileName = `AppleVision_Quote_${sale.invoiceNumber}.html`;
      const electronAPI = (window as any).electronAPI;

      if (electronAPI?.print?.toA4Pdf) {
        const res = await electronAPI.print.toA4Pdf({ 
          html: a4Html, 
          defaultFileName: `AppleVision_Quote_${sale.invoiceNumber}.pdf` 
        });
        if (res?.success && !res?.data?.canceled) {
          showNotification('success', `Quote PDF saved: ${res.data?.filePath || defaultFileName}`);
          return;
        }
      }

      // Web Mode: Open isolated print/PDF preview and download standalone file
      printHtmlViaIframe(a4Html);
      downloadHtmlFile(defaultFileName, a4Html);
      showNotification('success', 'A4 Quotation opened for printing & saved to Downloads!');
    } catch (err: any) {
      showNotification('error', `Quote failed: ${err.message}`);
    } finally {
      setIsExportingQuote(false);
    }
  };

  const handleWhatsApp = () => {
    let text = `*${settings.fullName || 'AppleVision Store Galle'}*\n`;
    text += `Kalegana Junction, Galle\n`;
    text += `Hotline: ${settings.phone || '+94 77 923 0519'}\n`;
    text += `--------------------------------\n`;
    text += `*OFFICIAL INVOICE: #${sale.invoiceNumber}*\n`;
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
    text += `(දුරකථනයට දුරකථනයක් මාරු කිරීමේ පූර්ණ වගකීමක් සහිතයි)\n\n`;
    text += `Official PDF Tax Invoice generated and stored.\n`;
    text += `Thank you for choosing AppleVision Store Galle!`;

    const encoded = encodeURIComponent(text);
    const targetPhone = cleanSriLankanPhone(sale.customerPhone);

    const waUrl = targetPhone 
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(waUrl, '_blank');
    showNotification('success', targetPhone ? `Dispatching WhatsApp invoice to ${targetPhone}...` : 'Opening WhatsApp to choose recipient...');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="w-full max-w-4xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Ribbon */}
        <div className="px-6 py-4 bg-emerald-600 dark:bg-emerald-700 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Sale Completed Successfully!</h2>
              <p className="text-[11px] text-emerald-100 font-mono">Invoice #{sale.invoiceNumber} • Official PDF Ready</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High-Resolution A4 Document Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            id="a4-invoice-printable"
            ref={invoiceDocRef}
            className="w-full max-w-[800px] bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-200 font-sans text-xs select-text space-y-6"
          >
            {/* Top Brand & Doc Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b-2 border-slate-100">
              <div className="flex items-center gap-4">
                <img
                  src={APPLEVISION_LOGO_BASE64}
                  alt="AppleVision Logo"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-900 bg-black shadow-md flex-shrink-0"
                />
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                    {settings.fullName || 'AppleVision Store Galle'}
                  </h1>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-0.5">
                    {settings.tagline || 'Reliable Best Service · Genuine Apple Retail'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {settings.address || 'Kalegana Junction'}, {settings.city || 'Galle'} 80000, Sri Lanka<br />
                    Hotline: <strong className="text-slate-700">{settings.phone || '+94 77 923 0519'}</strong> &nbsp;|&nbsp; 
                    Email: <strong className="text-slate-700">{settings.email || 'nethminasurinda@gmail.com'}</strong>
                  </p>
                </div>
              </div>

              <div className="sm:text-right">
                <div className="text-2xl font-black tracking-widest text-slate-900 leading-none">
                  INVOICE
                </div>
                <div className="text-xs font-mono font-bold text-slate-500 mt-1">
                  #{sale.invoiceNumber}
                </div>
                <div className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold tracking-wide uppercase">
                  PAID IN FULL ✓
                </div>
              </div>
            </div>

            {/* Bill-To & Invoice Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider block mb-1">
                  INVOICE TO:
                </span>
                <div className="text-sm font-extrabold text-slate-900">
                  {sale.customerName || 'Valued Walk-in Customer'}
                </div>
                {sale.customerPhone && (
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Mobile: <strong className="text-slate-800">{sale.customerPhone}</strong>
                  </div>
                )}
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Location: {(sale as any).customerAddress || 'Galle, Southern Province, Sri Lanka'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-200">
                  Payment Method: <strong className="text-slate-800">{sale.paymentMethod || 'Cash'}</strong>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex">
                <div className="w-1.5 bg-red-600 rounded-full mr-3.5 flex-shrink-0" />
                <div className="grid grid-cols-2 gap-3 flex-1 text-[11px]">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Invoice Number</span>
                    <span className="font-bold text-slate-900 font-mono">{sale.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Date & Time</span>
                    <span className="font-bold text-slate-900">{sale.date} {sale.time || ''}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Cashier</span>
                    <span className="font-bold text-slate-900">{sale.cashierName || 'Staff'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Status</span>
                    <span className="font-bold text-emerald-600">COMPLETED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-center w-10">No</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-right w-28">Price</th>
                    <th className="py-2.5 px-3 text-center w-14">Qty</th>
                    <th className="py-2.5 px-3 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-2.5 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[9.5px]">
                          {item.imei && (
                            <span className="font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-300">
                              IMEI: {item.imei}
                            </span>
                          )}
                          <span className="font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                            ✓ {item.warranty && item.warranty !== 'None' ? item.warranty : '3 Months AppleVision Warranty'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                        Rs. {Number(item.unitPrice || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                        Rs. {Number(item.lineTotal || (item.quantity * item.unitPrice)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Trade-In Received Box (if applicable) */}
            {tradeInCredit > 0 && (
              <div className="bg-emerald-50 border border-dashed border-emerald-500 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
                    ★ TRADE-IN TAKEN
                  </span>
                  <span className="text-xs font-bold text-emerald-900">
                    {tradeIn?.brand || 'Apple'} {tradeIn?.model || 'Device'} {tradeIn?.storage ? `(${tradeIn.storage})` : ''}
                    {tradeIn?.imei1 ? ` • IMEI: ${tradeIn.imei1}` : ''}
                    {tradeIn?.batteryHealth ? ` • Battery: ${tradeIn.batteryHealth}%` : ''}
                  </span>
                </div>
                <div className="text-xs font-black text-emerald-700 font-mono">
                  Credit Deducted: -Rs. {Number(tradeInCredit).toLocaleString()}
                </div>
              </div>
            )}

            {/* Bottom Row: Payment & Warranty Policy on Left, Totals on Right */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div className="space-y-3">
                {/* Bank Info */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] leading-relaxed">
                  <span className="text-[9.5px] font-extrabold text-red-600 uppercase tracking-wider block mb-1">
                    Bank Details & Payment Info
                  </span>
                  <div>Method: <strong className="text-slate-800">{sale.paymentMethod || 'Cash'}</strong> • Status: <strong>Paid in Full</strong></div>
                  <div>Bank: <strong>Commercial Bank of Ceylon PLC</strong> • Branch: <strong>Galle City</strong></div>
                  <div>Account: <strong>AppleVision Store Galle</strong> • No: <strong className="font-mono">8009230519</strong></div>
                </div>

                {/* 3-Month Phone-to-Phone Warranty Box */}
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[10.5px]">
                  <div className="font-extrabold text-red-600 uppercase tracking-tight">
                    ★ 3-Month Phone-to-Phone Replacement Warranty ★
                  </div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    දුරකථනයට දුරකථනයක් මාරු කිරීමේ පූර්ණ වගකීමක් සහිතයි
                  </div>
                  <div className="text-[9.5px] text-slate-600 mt-1 leading-snug">
                    1. 3-Month Phone-to-Phone Replacement Warranty for device hardware/logic board defects.<br />
                    2. Warranty valid only with original invoice and matching device IMEI.<br />
                    3. Physical damage, water ingress, and unauthorized repair strictly void warranty.
                  </div>
                </div>

                {/* Barcode Verification */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Scan to Verify Official Invoice
                  </div>
                  <div className="flex justify-center">
                    <BarcodeSvg
                      value={sale.invoiceNumber}
                      height={38}
                      showText={true}
                      fontSize={10}
                      className="max-w-full flex justify-center"
                    />
                  </div>
                </div>
              </div>

              {/* Totals Box */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="p-3 space-y-2 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Sub Total:</span>
                    <span className="font-bold text-slate-900">Rs. {Number(sale.subtotal || 0).toLocaleString()}</span>
                  </div>

                  {Number(sale.discountTotal || 0) > 0 && (
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>Discount:</span>
                      <span>-Rs. {Number(sale.discountTotal || 0).toLocaleString()}</span>
                    </div>
                  )}

                  {tradeInCredit > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Trade-In Credit:</span>
                      <span>-Rs. {Number(tradeInCredit).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>Tax / VAT (0%):</span>
                    <span>Included</span>
                  </div>
                </div>

                <div className="bg-red-600 text-white px-4 py-3 flex justify-between items-center text-sm font-black">
                  <span>TOTAL PAID:</span>
                  <span className="text-base">Rs. {Number(sale.totalAmount || 0).toLocaleString()}</span>
                </div>

                {sale.paymentDetails?.cashTendered !== undefined && (
                  <div className="p-3 bg-slate-50 border-t border-slate-200 text-[10.5px] space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Cash Tendered:</span>
                      <span>Rs. {Number(sale.paymentDetails.cashTendered).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Change Given:</span>
                      <span>Rs. {Number(sale.paymentDetails.changeDue || 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Manager Signature & Footer Strip */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-4 border-t border-slate-200 text-slate-600">
              <div>
                <div className="w-40 border-b border-dashed border-slate-400 h-8 mb-1" />
                <div className="font-bold text-slate-900 text-xs">{(settings as any).managerName || 'Surinda Nethmina'}</div>
                <div className="text-[10px] text-slate-500">Store Manager / Authorized Officer</div>
              </div>
              <div className="sm:text-right">
                <div className="text-sm font-extrabold italic text-red-600">
                  Thank you for your business!
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  AppleVision Store Galle • Kalegana Junction, Galle
                </div>
              </div>
            </div>

            <div className="text-[9px] text-slate-400 text-center uppercase tracking-wider pt-2 border-t border-slate-100">
              *** REVOLUTIONIZING APPLE RETAIL IN GALLE · OFFICIAL APPLEVISION TAX INVOICE · SYSTEM GENERATED ***
            </div>
          </div>
        </div>

        {/* Action Buttons Panel */}
        <div className="px-6 py-4 bg-light-surface/80 dark:bg-dark-surface/80 border-t border-light-border dark:border-dark-border flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Print PDF */}
            <button
              onClick={handlePrintPdf}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity"
            >
              <Printer className="w-4 h-4" />
              <span>Print PDF (Ctrl+P)</span>
            </button>

            {/* 2. Download / Save PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'Saving PDF...' : 'Save / Download PDF'}</span>
            </button>

            {/* 3. Send WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Send WhatsApp</span>
            </button>

            {/* 4. Quotation PDF */}
            <button
              onClick={handleDownloadQuote}
              disabled={isExportingQuote}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              <span>{isExportingQuote ? 'Generating...' : 'Quotation PDF'}</span>
            </button>
          </div>

          {/* 5. Start Next Sale */}
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
