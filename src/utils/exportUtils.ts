/**
 * AppleVision Store Galle - POS Export & Print Utilities
 * 
 * Provides robust browser-first file downloads (Blob-based CSV, HTML) and
 * isolated iframe printing that work flawlessly in both standard web browsers
 * and Electron desktop packaging without hard bridge dependencies.
 */

/**
 * Escapes a cell value for standard CSV compatibility.
 * Handles quotes, commas, newlines, and undefined/null values.
 */
export function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Downloads a CSV file using browser Blob API with UTF-8 BOM for Excel compatibility.
 */
export function downloadCsv(
  filename: string, 
  headers: string[], 
  rows: (string | number | undefined | null)[][]
): void {
  try {
    const headerLine = headers.map(escapeCsvCell).join(',');
    const rowLines = rows.map(r => r.map(escapeCsvCell).join(','));
    const csvContent = [headerLine, ...rowLines].join('\r\n');

    // Prepend UTF-8 Byte Order Mark (\uFEFF) so Excel parses Unicode & UTF-8 properly
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  } catch (err) {
    console.error('downloadCsv error:', err);
    throw err;
  }
}

/**
 * Downloads a printable HTML document or standalone report file.
 */
export function downloadHtmlFile(filename: string, htmlContent: string): void {
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.html') ? filename : `${filename}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  } catch (err) {
    console.error('downloadHtmlFile error:', err);
    throw err;
  }
}

/**
 * Prints HTML content via an isolated hidden iframe.
 * Avoids disturbing the main React single-page app DOM and prints clean pages.
 */
export function printHtmlViaIframe(htmlContent: string): void {
  try {
    const existing = document.getElementById('applevision-isolated-print-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'applevision-isolated-print-frame';
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
        console.warn('Iframe print error, falling back to window.print', err);
        window.print();
      } finally {
        // Clean up iframe after print dialog closes
        setTimeout(() => {
          const toRemove = document.getElementById('applevision-isolated-print-frame');
          if (toRemove) toRemove.remove();
        }, 60000);
      }
    }, 450);
  } catch (err) {
    console.error('printHtmlViaIframe error:', err);
    window.print();
  }
}

export interface ReportCard {
  label: string;
  value: string;
  note?: string;
  color?: string;
}

export interface PrintableReportOptions {
  title: string;
  subtitle: string;
  dateRangeLabel?: string;
  storeName?: string;
  storePhone?: string;
  storeAddress?: string;
  summaryCards?: ReportCard[];
  headers: string[];
  alignments?: ('left' | 'center' | 'right')[];
  rows: (string | number)[][];
  totalRow?: (string | number)[];
  notes?: string;
}

/**
 * Builds a polished, print-ready HTML page for AppleVision financial and inventory reports.
 */
export function generatePrintableReportHtml(opts: PrintableReportOptions): string {
  const store = opts.storeName || 'AppleVision Store Galle';
  const phone = opts.storePhone || '+94 77 923 0519';
  const address = opts.storeAddress || 'Kalegana Junction, Galle, Sri Lanka';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const cardsHtml = (opts.summaryCards || []).map(c => `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;min-width:140px;flex:1;">
      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">${c.label}</div>
      <div style="font-size:17px;font-weight:800;color:${c.color || '#0f172a'};margin-top:3px;font-family:'Courier New',Courier,monospace;">${c.value}</div>
      ${c.note ? `<div style="font-size:9.5px;color:#94a3b8;margin-top:2px;">${c.note}</div>` : ''}
    </div>
  `).join('');

  const aligns = opts.alignments || opts.headers.map(() => 'left');

  const headersHtml = opts.headers.map((h, i) => `
    <th style="padding:8px 10px;border-bottom:2px solid #cbd5e1;background:#f1f5f9;font-size:10.5px;font-weight:700;color:#334155;text-transform:uppercase;text-align:${aligns[i] || 'left'};">
      ${h}
    </th>
  `).join('');

  const rowsHtml = opts.rows.map((row, idx) => `
    <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};border-bottom:1px solid #e2e8f0;">
      ${row.map((cell, i) => `
        <td style="padding:7px 10px;font-size:11px;color:#1e293b;text-align:${aligns[i] || 'left'};${aligns[i] === 'right' ? "font-family:'Courier New',Courier,monospace;" : ''}">
          ${cell}
        </td>
      `).join('')}
    </tr>
  `).join('');

  const totalRowHtml = opts.totalRow ? `
    <tr style="background:#0f172a;color:#ffffff;font-weight:800;">
      ${opts.totalRow.map((cell, i) => `
        <td style="padding:9px 10px;font-size:11.5px;color:#ffffff;text-align:${aligns[i] || 'left'};${aligns[i] === 'right' ? "font-family:'Courier New',Courier,monospace;" : ''}">
          ${cell}
        </td>
      `).join('')}
    </tr>
  ` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${opts.title} - ${store}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 16mm 14mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 10px;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
    }
    .header-box {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      background: #e0e7ff;
      color: #3730a3;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div>
      <div style="font-size:18px;font-weight:900;letter-spacing:-0.5px;color:#0f172a;">${store}</div>
      <div style="font-size:10.5px;color:#475569;margin-top:2px;">${address}</div>
      <div style="font-size:10.5px;color:#475569;">Hotline: ${phone} | Authorized Apple Sales & Repairs</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:15px;font-weight:800;color:#e11d48;">${opts.title}</div>
      <div style="font-size:10.5px;color:#64748b;margin-top:2px;">${opts.subtitle}</div>
      ${opts.dateRangeLabel ? `<div style="margin-top:4px;"><span class="badge">Period: ${opts.dateRangeLabel}</span></div>` : ''}
      <div style="font-size:9.5px;color:#94a3b8;margin-top:3px;">Printed: ${dateStr} ${timeStr}</div>
    </div>
  </div>

  ${opts.summaryCards && opts.summaryCards.length > 0 ? `
    <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
      ${cardsHtml}
    </div>
  ` : ''}

  <table>
    <thead>
      <tr>
        ${headersHtml}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      ${totalRowHtml}
    </tbody>
  </table>

  ${opts.notes ? `
    <div style="margin-top:14px;padding:10px;background:#f8fafc;border-left:3px solid #0f172a;font-size:10px;color:#475569;">
      <strong>Notes:</strong> ${opts.notes}
    </div>
  ` : ''}

  <div style="margin-top:30px;padding-top:12px;border-top:1px dashed #cbd5e1;display:flex;justify-content:space-between;font-size:10px;color:#64748b;">
    <div>Certified Store Audited Report • System Generated</div>
    <div style="text-align:right;">
      <div style="border-bottom:1px solid #94a3b8;width:150px;height:24px;margin-bottom:4px;"></div>
      <div>Authorized Signature / Manager Stamp</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Builds printable barcode labels for products or serialized IMEIs.
 */
export interface BarcodeLabelItem {
  title: string;
  sku: string;
  imei?: string;
  serial?: string;
  price: number;
  condition?: string;
  barcodeSvg: string;
}

export function generateBarcodeSheetHtml(
  labels: BarcodeLabelItem[], 
  storeName = 'AppleVision Store Galle'
): string {
  const itemsHtml = labels.map(l => `
    <div class="label-card">
      <div class="store-tag">${storeName}</div>
      <div class="item-title">${l.title}</div>
      ${l.condition ? `<div class="condition-tag">${l.condition}</div>` : ''}
      
      <div class="barcode-container">
        ${l.barcodeSvg}
      </div>

      <div class="code-line">
        ${l.imei ? `IMEI: <strong>${l.imei}</strong>` : `SKU: <strong>${l.sku}</strong>`}
      </div>
      ${l.serial ? `<div class="code-sub">SN: ${l.serial}</div>` : ''}

      <div class="price-tag">LKR ${l.price.toLocaleString()}</div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Barcode Labels - ${storeName}</title>
  <style>
    @page {
      size: auto;
      margin: 6mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 8px;
      background: #ffffff;
      color: #000000;
    }
    .label-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8mm;
      justify-content: flex-start;
    }
    .label-card {
      width: 60mm;
      min-height: 38mm;
      padding: 3mm 4mm;
      border: 1px dashed #cbd5e1;
      border-radius: 4px;
      box-sizing: border-box;
      text-align: center;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .store-tag {
      font-size: 7.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000000;
    }
    .item-title {
      font-size: 8.5pt;
      font-weight: 700;
      color: #111;
      line-height: 1.15;
      margin-top: 1mm;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .condition-tag {
      font-size: 6.5pt;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      margin-top: 0.5mm;
    }
    .barcode-container {
      margin: 1.5mm auto 1mm auto;
      display: flex;
      justify-content: center;
    }
    .barcode-container svg {
      max-width: 52mm;
      height: 14mm;
    }
    .code-line {
      font-family: 'Courier New', Courier, monospace;
      font-size: 7.5pt;
      color: #000;
      letter-spacing: 0.4px;
    }
    .code-sub {
      font-family: 'Courier New', Courier, monospace;
      font-size: 6.5pt;
      color: #555;
    }
    .price-tag {
      font-family: 'Courier New', Courier, monospace;
      font-size: 9.5pt;
      font-weight: 900;
      color: #000;
      margin-top: 1mm;
      padding-top: 0.5mm;
      border-top: 0.5px solid #000;
    }
    @media print {
      body { padding: 0; }
      .label-card { border: 1px dotted #ccc; }
    }
  </style>
</head>
<body>
  <div class="label-grid">
    ${itemsHtml}
  </div>
</body>
</html>`;
}

/**
 * Builds an official Credit Settlement Receipt HTML for customer debt payments.
 */
export interface SettlementReceiptOptions {
  receiptNumber: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  customerNic?: string;
  settleAmount: number;
  previousBalance: number;
  remainingBalance: number;
  paymentMethod: string;
  notes?: string;
  cashierName?: string;
  storeName?: string;
  storePhone?: string;
  storeAddress?: string;
}

export function generateSettlementReceiptHtml(opts: SettlementReceiptOptions): string {
  const store = opts.storeName || 'AppleVision Store Galle';
  const phone = opts.storePhone || '+94 77 923 0519';
  const address = opts.storeAddress || 'Kalegana Junction, Galle';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Credit Settlement - ${opts.receiptNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 2mm 3mm;
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.35;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 6px;
      width: 72mm;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .double-divider {
      border-top: 2px solid #000;
      margin: 6px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    @media print {
      body { width: 100%; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="text-center">
    <div style="font-size:14px;font-weight:900;">${store.toUpperCase()}</div>
    <div>${address}</div>
    <div>Hotline: ${phone}</div>
    <div class="bold" style="margin-top:4px;font-size:12px;background:#000;color:#fff;padding:2px 0;">
      CREDIT SETTLEMENT RECEIPT
    </div>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span>Receipt #:</span>
    <span class="bold">${opts.receiptNumber}</span>
  </div>
  <div class="row">
    <span>Date & Time:</span>
    <span>${opts.date} ${opts.time}</span>
  </div>
  <div class="row">
    <span>Cashier:</span>
    <span>${opts.cashierName || 'Counter Staff'}</span>
  </div>

  <div class="divider"></div>

  <div class="bold">CUSTOMER DETAILS:</div>
  <div class="row">
    <span>Name:</span>
    <span class="bold">${opts.customerName}</span>
  </div>
  <div class="row">
    <span>Phone:</span>
    <span>${opts.customerPhone}</span>
  </div>
  ${opts.customerNic ? `
  <div class="row">
    <span>NIC:</span>
    <span>${opts.customerNic}</span>
  </div>
  ` : ''}

  <div class="double-divider"></div>

  <div class="row" style="font-size:11.5px;">
    <span>PREVIOUS DEBT BALANCE:</span>
    <span class="bold">LKR ${opts.previousBalance.toLocaleString()}</span>
  </div>
  <div class="row" style="font-size:13px;font-weight:900;margin:4px 0;">
    <span>AMOUNT SETTLED:</span>
    <span>LKR ${opts.settleAmount.toLocaleString()}</span>
  </div>
  <div class="row">
    <span>Payment Method:</span>
    <span class="bold">${opts.paymentMethod}</span>
  </div>

  <div class="divider"></div>

  <div class="row" style="font-size:12px;font-weight:900;color:#000;">
    <span>NEW REMAINING BALANCE:</span>
    <span>LKR ${opts.remainingBalance.toLocaleString()}</span>
  </div>

  ${opts.notes ? `
  <div class="divider"></div>
  <div><strong>Note:</strong> ${opts.notes}</div>
  ` : ''}

  <div class="divider"></div>

  <div style="margin-top:16px;display:flex;justify-content:space-between;font-size:9.5px;">
    <div style="text-align:center;">
      <div style="border-top:1px dotted #000;width:28mm;margin-top:20px;padding-top:2px;">Customer Signature</div>
    </div>
    <div style="text-align:center;">
      <div style="border-top:1px dotted #000;width:28mm;margin-top:20px;padding-top:2px;">Authorized Stamp</div>
    </div>
  </div>

  <div class="text-center" style="font-size:9px;margin-top:12px;color:#333;">
    <div>Thank you for settling your account with AppleVision Store Galle!</div>
    <div style="font-size:8px;margin-top:3px;">*** Official Ledger Settlement Voucher ***</div>
  </div>
</body>
</html>`;
}

/**
 * Builds an official Petty Cash Disbursement Voucher HTML for store operational expenses.
 */
export interface PettyCashVoucherOptions {
  voucherNumber: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  recordedBy: string;
  receiptRef?: string;
  storeName?: string;
  storePhone?: string;
  storeAddress?: string;
}

export function generatePettyCashVoucherHtml(opts: PettyCashVoucherOptions): string {
  const store = opts.storeName || 'AppleVision Store Galle';
  const phone = opts.storePhone || '+94 77 923 0519';
  const address = opts.storeAddress || 'Kalegana Junction, Galle';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Expense Voucher - ${opts.voucherNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 2mm 3mm;
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.35;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 6px;
      width: 72mm;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .double-divider {
      border-top: 2px solid #000;
      margin: 6px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    @media print {
      body { width: 100%; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="text-center">
    <div style="font-size:14px;font-weight:900;">${store.toUpperCase()}</div>
    <div>${address}</div>
    <div>Hotline: ${phone}</div>
    <div class="bold" style="margin-top:4px;font-size:12px;background:#000;color:#fff;padding:2px 0;">
      PETTY CASH DISBURSEMENT VOUCHER
    </div>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span>Voucher #:</span>
    <span class="bold">${opts.voucherNumber}</span>
  </div>
  <div class="row">
    <span>Date:</span>
    <span>${opts.date}</span>
  </div>
  <div class="row">
    <span>Disbursed By:</span>
    <span>${opts.recordedBy}</span>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span>Category:</span>
    <span class="bold">${opts.category}</span>
  </div>
  <div class="row">
    <span>Method:</span>
    <span>${opts.paymentMethod}</span>
  </div>
  ${opts.receiptRef ? `
  <div class="row">
    <span>Receipt / Inv Ref:</span>
    <span>${opts.receiptRef}</span>
  </div>
  ` : ''}

  <div style="margin:5px 0;">
    <div><strong>Purpose / Description:</strong></div>
    <div style="padding:4px;background:#f5f5f5;border:1px solid #ddd;margin-top:2px;font-size:10.5px;">${opts.description}</div>
  </div>

  <div class="double-divider"></div>

  <div class="row" style="font-size:13px;font-weight:900;margin:6px 0;">
    <span>AMOUNT DISBURSED:</span>
    <span>LKR ${opts.amount.toLocaleString()}</span>
  </div>

  <div class="divider"></div>

  <div style="margin-top:20px;display:flex;justify-content:space-between;font-size:9.5px;">
    <div style="text-align:center;">
      <div style="border-top:1px dotted #000;width:28mm;margin-top:18px;padding-top:2px;">Paid To (Receiver)</div>
    </div>
    <div style="text-align:center;">
      <div style="border-top:1px dotted #000;width:28mm;margin-top:18px;padding-top:2px;">Manager Approval</div>
    </div>
  </div>

  <div class="text-center" style="font-size:8.5px;margin-top:12px;color:#555;">
    <div>AppleVision Store Galle • Audited Expense Record</div>
  </div>
</body>
</html>`;
}

