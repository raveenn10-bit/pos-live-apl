'use client';

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { RepairTicket, RepairStatus } from '../../types';
import { 
  Wrench, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  User, 
  DollarSign, 
  X, 
  ArrowRight,
  ClipboardList,
  Layers,
  Printer,
  MessageSquare
} from 'lucide-react';
import { generateCode128Svg } from '../../utils/barcodeGenerator';
import { APPLEVISION_LOGO_BASE64 } from '../../assets/logoBase64';

export const RepairsView: React.FC = () => {
  const { repairs, addRepairTicket, updateRepairStatus, updateRepairTicket, showNotification, settings } = useStore();

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);

  // New ticket modal
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+94 ');
  const [deviceModel, setDeviceModel] = useState('');
  const [imeiOrSerial, setImeiOrSerial] = useState('');
  const [passcode, setPasscode] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [physicalCondition, setPhysicalCondition] = useState('Minor cosmetic scuffs, glass intact');
  const [estimatedCost, setEstimatedCost] = useState<number>(15000);
  const [advancePaid, setAdvancePaid] = useState<number>(5000);
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [assignedTechnician, setAssignedTechnician] = useState('Nuwan Pradeep');

  // Sri Lankan phone normalizer (e.g. 077... or +94 77... -> 9477...)
  const normalizeSriLankanPhone = (rawPhone?: string): string => {
    if (!rawPhone) return '';
    const digits = rawPhone.replace(/[^0-9]/g, '');
    if (digits.startsWith('94') && digits.length >= 11) return digits;
    if (digits.startsWith('0') && digits.length === 10) return '94' + digits.substring(1);
    if (digits.length === 9) return '94' + digits;
    return digits;
  };

  // Clean browser iframe printer
  const printHtmlViaIframe = (htmlContent: string) => {
    try {
      const existing = document.getElementById('repair-isolated-print-iframe');
      if (existing) existing.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'repair-isolated-print-iframe';
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

  // Send WhatsApp repair status update
  const sendWhatsAppStatusUpdate = (ticket: RepairTicket) => {
    const cleanPhone = normalizeSriLankanPhone(ticket.customerPhone);
    if (!cleanPhone) {
      showNotification('error', 'Valid customer phone number is required for WhatsApp notification');
      return;
    }

    const balance = Math.max(0, ticket.estimatedCost - ticket.advancePaid);
    let statusMessage = '';

    switch (ticket.status) {
      case 'Received':
        statusMessage = `Hello *${ticket.customerName}*,\n\nYour repair ticket *#${ticket.ticketNumber}* for *${ticket.deviceModel}* has been received at *AppleVision Store Galle*.\n\n📋 *Reported Issue:* ${ticket.faultDescription}\n💵 *Estimated Cost:* LKR ${ticket.estimatedCost.toLocaleString()}\n💳 *Advance Paid:* LKR ${ticket.advancePaid.toLocaleString()}\n💰 *Balance Due on Pickup:* LKR ${balance.toLocaleString()}\n\nOur hardware technicians will begin diagnostics shortly. Thank you for choosing AppleVision Galle!`;
        break;
      case 'Diagnostics':
        statusMessage = `Hello *${ticket.customerName}*,\n\nUpdate on your repair ticket *#${ticket.ticketNumber}* (*${ticket.deviceModel}*):\n🔬 Your device is currently undergoing bench diagnostics by technician *${ticket.assignedTechnician || 'Nuwan Pradeep'}*.\n\nWe will update you as soon as the test results are ready.`;
        break;
      case 'Waiting for Parts':
        statusMessage = `Hello *${ticket.customerName}*,\n\nUpdate on your repair ticket *#${ticket.ticketNumber}* (*${ticket.deviceModel}*):\n📦 Original Apple replacement components have been reserved / ordered for your device. Repair will proceed immediately upon bench delivery.`;
        break;
      case 'Repairing':
        statusMessage = `Hello *${ticket.customerName}*,\n\nUpdate on your repair ticket *#${ticket.ticketNumber}* (*${ticket.deviceModel}*):\n⚙️ Our certified technician is currently carrying out precision component repair & calibration on your *${ticket.deviceModel}*.`;
        break;
      case 'Ready for Pickup':
        statusMessage = `🎉 *REPAIR COMPLETE & READY FOR PICKUP!*\n\nHello *${ticket.customerName}*,\nYour *${ticket.deviceModel}* (Ticket *#${ticket.ticketNumber}*) has successfully passed all quality checks and is ready for collection at *AppleVision Store Galle*.\n\n💰 *Balance Payable:* LKR ${balance.toLocaleString()}\n📍 *Store:* 42 Wakwella Road, Galle\n🕒 *Opening Hours:* 9:00 AM - 8:00 PM\n\nPlease present this ticket or your national ID when collecting. Thank you!`;
        break;
      case 'Delivered':
        statusMessage = `Hello *${ticket.customerName}*,\n\nYour *${ticket.deviceModel}* (Ticket *#${ticket.ticketNumber}*) has been delivered.\n\nThank you for choosing *AppleVision Store Galle* for your Apple hardware repairs. All bench services carry our official warranty. Let us know if you need any assistance!`;
        break;
      default:
        statusMessage = `Hello *${ticket.customerName}*,\n\nUpdate on your repair ticket *#${ticket.ticketNumber}* (*${ticket.deviceModel}*) at AppleVision Store Galle. Status: *${ticket.status}*.`;
    }

    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(statusMessage)}`;
    window.open(url, '_blank');
    showNotification('success', `WhatsApp alert opened for ${ticket.customerName} (${cleanPhone})`);
  };

  // Build clean 80mm job sheet HTML
  const buildRepairJobSheetHtml = (ticket: RepairTicket, storeSettings: any): string => {
    const barcodeSvg = generateCode128Svg(ticket.ticketNumber, {
      height: 38,
      showText: true,
      fontSize: 10,
      lineColor: '#000000',
      backgroundColor: 'transparent'
    });

    const balance = Math.max(0, ticket.estimatedCost - ticket.advancePaid);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Repair Job Sheet - ${ticket.ticketNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 3mm;
    }
    @media print {
      body { width: 74mm; margin: 0 auto; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      color: #111827;
      line-height: 1.35;
      background: #ffffff;
      padding: 4px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .border-b { border-bottom: 1px dashed #9ca3af; }
    .border-t { border-top: 1px dashed #9ca3af; }
    .my-2 { margin-top: 6px; margin-bottom: 6px; }
    .logo { max-width: 130px; height: auto; margin: 0 auto 4px auto; display: block; }
    .barcode-container { text-align: center; margin: 6px 0; }
    .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #374151; margin-top: 6px; margin-bottom: 2px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .badge { display: inline-block; padding: 2px 6px; border: 1px solid #111; font-size: 9.5px; font-weight: bold; border-radius: 4px; }
    .terms { font-size: 8px; color: #4b5563; line-height: 1.25; margin-top: 8px; text-align: justify; }
  </style>
</head>
<body>
  <div class="text-center">
    <img src="${APPLEVISION_LOGO_BASE64}" alt="AppleVision Logo" class="logo" />
    <div style="font-size: 13px; font-weight: 900; letter-spacing: -0.2px;">APPLEVISION STORE GALLE</div>
    <div style="font-size: 9.5px; color: #4b5563;">Official Apple Hardware Bench & Service Center</div>
    <div style="font-size: 9px; color: #4b5563;">42 Wakwella Road, Galle, Sri Lanka</div>
    <div style="font-size: 9px; color: #4b5563;">Tel: +94 91 224 8899 | Hotline: +94 77 923 0519</div>
  </div>

  <div class="border-b my-2"></div>

  <div class="text-center">
    <span class="badge">REPAIR JOB SHEET & CLAIM TICKET</span>
    <div class="barcode-container">
      ${barcodeSvg}
    </div>
  </div>

  <div class="border-b my-2"></div>

  <div class="row">
    <span style="color:#6b7280;">Ticket Number:</span>
    <span class="font-mono font-bold">${ticket.ticketNumber}</span>
  </div>
  <div class="row">
    <span style="color:#6b7280;">Date Received:</span>
    <span class="font-mono">${ticket.createdAt}</span>
  </div>
  <div class="row">
    <span style="color:#6b7280;">Pipeline Stage:</span>
    <span class="font-bold">${ticket.status}</span>
  </div>
  <div class="row">
    <span style="color:#6b7280;">Bench Technician:</span>
    <span>${ticket.assignedTechnician || 'Nuwan Pradeep'}</span>
  </div>

  <div class="border-b my-2"></div>

  <div class="section-title">Customer Details</div>
  <div class="row">
    <span style="color:#6b7280;">Customer:</span>
    <span class="font-bold">${ticket.customerName}</span>
  </div>
  <div class="row">
    <span style="color:#6b7280;">Phone:</span>
    <span class="font-mono font-bold">${ticket.customerPhone}</span>
  </div>

  <div class="border-b my-2"></div>

  <div class="section-title">Device & Reported Diagnostics</div>
  <div class="row">
    <span style="color:#6b7280;">Device Model:</span>
    <span class="font-bold">${ticket.deviceModel}</span>
  </div>
  <div class="row">
    <span style="color:#6b7280;">IMEI / Serial:</span>
    <span class="font-mono">${ticket.imeiOrSerial || 'N/A'}</span>
  </div>
  <div class="row">
    <span style="color:#6b7280;">Passcode / PIN:</span>
    <span class="font-mono font-bold">${ticket.passcode || 'Pattern / None'}</span>
  </div>
  <div style="margin-top: 3px;">
    <span style="color:#6b7280;">Reported Fault:</span>
    <div style="font-weight: 600; margin-top: 1px;">${ticket.faultDescription}</div>
  </div>
  <div style="margin-top: 3px;">
    <span style="color:#6b7280;">Physical Condition:</span>
    <div style="font-size: 10px; color: #374151;">${ticket.physicalCondition || 'Standard bench inspection'}</div>
  </div>
  ${ticket.technicianNotes ? `
  <div style="margin-top: 3px;">
    <span style="color:#6b7280;">Bench Notes:</span>
    <div style="font-size: 10px; font-style: italic;">${ticket.technicianNotes}</div>
  </div>` : ''}

  <div class="border-b my-2"></div>

  <div class="section-title">Financials</div>
  <div class="row">
    <span>Estimated Total:</span>
    <span class="font-mono font-bold">LKR ${ticket.estimatedCost.toLocaleString()}</span>
  </div>
  <div class="row" style="color: #047857;">
    <span>Advance Deposit Paid:</span>
    <span class="font-mono font-bold">-LKR ${ticket.advancePaid.toLocaleString()}</span>
  </div>
  <div class="border-t my-2"></div>
  <div class="row" style="font-size: 12px;">
    <span class="font-bold">BALANCE PAYABLE:</span>
    <span class="font-mono font-bold">LKR ${balance.toLocaleString()}</span>
  </div>

  <div class="border-b my-2"></div>

  <div class="terms">
    <strong>Terms of Service:</strong><br />
    1. 30-Day component warranty applies to replaced parts and labor.<br />
    2. Customer is responsible for iCloud backup; AppleVision is not liable for data loss during repair.<br />
    3. Uncollected devices after 60 days are subject to disposal under store policy.<br />
    4. Presentation of this ticket or WhatsApp authorization is mandatory for collection.
  </div>

  <div class="row" style="margin-top: 20px; gap: 8px;">
    <div style="flex: 1; border-top: 1px solid #000; text-align: center; font-size: 8.5px; padding-top: 2px;">
      Customer Signature
    </div>
    <div style="flex: 1; border-top: 1px solid #000; text-align: center; font-size: 8.5px; padding-top: 2px;">
      Technician Signature
    </div>
  </div>

  <div class="text-center" style="margin-top: 10px; font-size: 8px; color: #6b7280;">
    AppleVision Store Galle • www.applevisiongalle.lk
  </div>
</body>
</html>`;
  };

  const handlePrintJobSheet = (ticket: RepairTicket) => {
    const html = buildRepairJobSheetHtml(ticket, settings);
    printHtmlViaIframe(html);
    showNotification('info', `Printing ticket ${ticket.ticketNumber}...`);
  };

  const statuses: RepairStatus[] = [
    'Received',
    'Diagnostics',
    'Waiting for Parts',
    'Repairing',
    'Ready for Pickup',
    'Delivered'
  ];

  const filteredRepairs = repairs.filter(r =>
    r.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
    r.customerName.toLowerCase().includes(search.toLowerCase()) ||
    r.deviceModel.toLowerCase().includes(search.toLowerCase()) ||
    (r.imeiOrSerial || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !deviceModel.trim() || !faultDescription.trim()) return;

    const created = addRepairTicket({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deviceModel: deviceModel.trim(),
      imeiOrSerial: imeiOrSerial.trim(),
      passcode: passcode.trim() || undefined,
      faultDescription: faultDescription.trim(),
      physicalCondition: physicalCondition.trim(),
      status: 'Received',
      estimatedCost: Number(estimatedCost),
      advancePaid: Number(advancePaid),
      technicianNotes: technicianNotes.trim(),
      partsUsed: [],
      assignedTechnician,
    });

    setIsNewTicketOpen(false);
    setSelectedTicket(created);
  };

  const handleAdvanceStatus = (ticket: RepairTicket) => {
    const currentIndex = statuses.indexOf(ticket.status);
    if (currentIndex < statuses.length - 1) {
      const nextStatus = statuses[currentIndex + 1];
      updateRepairStatus(ticket.id, nextStatus);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-brand-500/10 text-brand-500">
              <Wrench className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Apple Hardware Repair & Bench Service
            </h2>
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
            Component-level diagnostics, original battery/screen replacements, and real-time repair pipeline tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex p-1 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pipeline Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                viewMode === 'table'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Table View
            </button>
          </div>

          <button
            onClick={() => setIsNewTicketOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Open Repair Ticket</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search tickets by REP #, customer, device model, or IMEI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono text-slate-900 dark:text-white"
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <div className="text-xs text-light-muted dark:text-dark-muted font-mono">
          Total active bench tickets: {repairs.filter(r => r.status !== 'Delivered').length}
        </div>
      </div>

      {/* KANBAN PIPELINE VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
          {statuses.map((status) => {
            const ticketsInCol = filteredRepairs.filter(r => r.status === status);
            return (
              <div
                key={status}
                className="p-3 rounded-2xl bg-white/70 dark:bg-dark-card/70 backdrop-blur border border-light-border dark:border-dark-border space-y-2.5 min-h-[480px] flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-light-border dark:border-dark-border">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                    {status}
                  </span>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-light-elevated dark:bg-dark-elevated text-light-muted">
                    {ticketsInCol.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {ticketsInCol.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="p-3 rounded-xl bg-light-surface/70 dark:bg-dark-surface/70 hover:bg-light-elevated dark:hover:bg-dark-elevated border border-light-border dark:border-dark-border cursor-pointer transition-all hover:border-brand-500/40 shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono font-bold text-brand-500">{ticket.ticketNumber}</span>
                        <span className="text-light-muted">{ticket.createdAt.substring(11, 16)}</span>
                      </div>

                      <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                        {ticket.deviceModel}
                      </div>

                      <div className="text-[11px] text-light-muted dark:text-dark-muted font-medium line-clamp-2">
                        {ticket.faultDescription}
                      </div>

                      <div className="pt-1 border-t border-light-border dark:border-dark-border flex items-center justify-between text-[10px]">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{ticket.customerName}</span>
                        <span className="font-mono font-bold text-emerald-500">LKR {ticket.estimatedCost.toLocaleString()}</span>
                      </div>

                      {/* Action buttons: WhatsApp, Print, Advance */}
                      <div className="flex items-center gap-1 mt-1 pt-1 border-t border-light-border dark:border-dark-border">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sendWhatsAppStatusUpdate(ticket);
                          }}
                          className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-colors"
                          title="Send WhatsApp Update"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintJobSheet(ticket);
                          }}
                          className="p-1 rounded bg-light-elevated dark:bg-dark-elevated hover:bg-brand-500 hover:text-white text-[10px] text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                          title="Print Job Sheet"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {status !== 'Delivered' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdvanceStatus(ticket);
                            }}
                            className="flex-1 py-1 rounded bg-light-elevated dark:bg-dark-elevated hover:bg-brand-500 hover:text-white text-[10px] font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1 transition-colors"
                          >
                            <span>Advance</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {ticketsInCol.length === 0 && (
                    <div className="p-6 text-center text-[11px] text-light-muted dark:text-dark-muted italic">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-bold text-[10px] uppercase tracking-wider">
                  <th className="pb-3">Ticket #</th>
                  <th className="pb-3">Device & Fault</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Technician</th>
                  <th className="pb-3 text-right">Est. Cost</th>
                  <th className="pb-3 text-right">Advance</th>
                  <th className="pb-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {filteredRepairs.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedTicket(r)}
                    className="hover:bg-light-surface/40 dark:hover:bg-dark-surface/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 font-mono font-bold text-brand-500">{r.ticketNumber}</td>
                    <td className="py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{r.deviceModel}</div>
                      <div className="text-[10px] text-light-muted">{r.faultDescription}</div>
                    </td>
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {r.customerName}
                      <div className="text-[10px] text-light-muted font-mono">{r.customerPhone}</div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-500 border border-brand-500/20">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-700 dark:text-slate-300 font-medium">{r.assignedTechnician}</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      LKR {r.estimatedCost.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-mono text-emerald-500 font-semibold">
                      LKR {r.advancePaid.toLocaleString()}
                    </td>
                    <td className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => sendWhatsAppStatusUpdate(r)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 transition-colors"
                          title="WhatsApp Update"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintJobSheet(r)}
                          className="p-1.5 rounded-lg bg-light-elevated dark:bg-dark-elevated hover:bg-brand-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors"
                          title="Print Job Sheet"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {r.status !== 'Delivered' && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceStatus(r)}
                            className="px-2 py-1 rounded-lg bg-light-elevated dark:bg-dark-elevated hover:bg-brand-500 hover:text-white text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors"
                            title="Advance Pipeline"
                          >
                            <span>Next</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Details Inspection Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-light-surface/60 dark:bg-dark-surface/60 border-b border-light-border dark:border-dark-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Repair Ticket {selectedTicket.ticketNumber}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">
                    {selectedTicket.status}
                  </span>
                </div>
                <p className="text-xs text-light-muted">{selectedTicket.createdAt}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Device and Fault */}
              <div className="p-4 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border space-y-2">
                <div className="font-bold text-sm text-slate-900 dark:text-white">{selectedTicket.deviceModel}</div>
                <div className="grid grid-cols-2 gap-2 text-light-muted font-mono text-[11px]">
                  <span>IMEI/Serial: {selectedTicket.imeiOrSerial || 'N/A'}</span>
                  <span>Passcode: {selectedTicket.passcode || 'Pattern / None'}</span>
                </div>
                <div className="pt-2 border-t border-light-border dark:border-dark-border">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Fault: </span>
                  <span>{selectedTicket.faultDescription}</span>
                </div>
              </div>

              {/* Status Update Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Change Pipeline Stage
                </label>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => {
                    updateRepairStatus(selectedTicket.id, e.target.value as RepairStatus);
                    setSelectedTicket(prev => prev ? { ...prev, status: e.target.value as RepairStatus } : null);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-semibold"
                >
                  {statuses.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Technician Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Technician Bench Log
                </label>
                <textarea
                  rows={3}
                  value={selectedTicket.technicianNotes}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTicket(prev => prev ? { ...prev, technicianNotes: val } : null);
                    updateRepairTicket(selectedTicket.id, { technicianNotes: val });
                  }}
                  className="w-full p-2.5 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Financials */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border">
                <div>
                  <div className="text-[10px] text-light-muted">Estimated Total Cost</div>
                  <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    LKR {selectedTicket.estimatedCost.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-light-muted">Advance Deposit Paid</div>
                  <div className="font-mono font-bold text-sm text-emerald-500">
                    LKR {selectedTicket.advancePaid.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-light-surface/60 dark:bg-dark-surface/60 border-t border-light-border dark:border-dark-border flex items-center justify-between">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => sendWhatsAppStatusUpdate(selectedTicket)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Update</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintJobSheet(selectedTicket)}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Job Sheet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Open Repair & Diagnostic Ticket</h3>
              <button onClick={() => setIsNewTicketOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Device Model *</label>
                  <input
                    type="text"
                    placeholder="e.g. iPhone 14 Pro 128GB"
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">IMEI or Serial Number</label>
                  <input
                    type="text"
                    placeholder="Scan or enter..."
                    value={imeiOrSerial}
                    onChange={(e) => setImeiOrSerial(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Passcode / PIN / Pattern</label>
                <input
                  type="text"
                  placeholder="For bench testing & verification"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reported Fault Description *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Broken OLED screen, touch unresponsive after drop..."
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Estimated Cost (LKR)</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Advance Deposit Paid (LKR)</label>
                  <input
                    type="number"
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono font-bold text-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25"
                >
                  Create Ticket & Take Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
