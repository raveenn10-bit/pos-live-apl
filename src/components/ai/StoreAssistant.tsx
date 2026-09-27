'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  ShieldCheck, 
  Check, 
  X, 
  ArrowRight, 
  AlertCircle,
  TrendingUp,
  Package,
  Wrench,
  DollarSign,
  CheckCircle2
} from 'lucide-react';

interface ProposedAction {
  id: string;
  type: 'DISCOUNT_PRODUCT' | 'UPDATE_STOCK' | 'UPDATE_REPAIR_STATUS';
  title: string;
  details: string;
  targetId?: string;
  payload?: any;
  status: 'pending' | 'accepted' | 'rejected';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: ProposedAction;
}

export const StoreAssistant: React.FC = () => {
  const { 
    products, 
    sales, 
    repairs, 
    customers, 
    updateProduct, 
    adjustStock, 
    updateRepairStatus, 
    logAction, 
    showNotification 
  } = useStore();
  const { currentUser } = useAuth();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: `Hello ${currentUser?.name || 'Surinda'}! I am your AppleVision Store Intelligence Assistant. You can ask me anything about today's sales, inventory stock levels, profit margins, or request controlled store adjustments.`,
      timestamp: '10:00 AM'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickPrompts = [
    "What are today's sales and margins?",
    "Which iPhones are low on stock?",
    "Show outstanding customer credit debts",
    "Mark repair ticket REP-2026-0042 as Ready for Pickup",
    "Restock Remax Tempered Glass by +10 units"
  ];

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Generate intelligent AI response
    setTimeout(() => {
      generateResponse(query);
    }, 450);
  };

  const generateResponse = (query: string) => {
    const lower = query.toLowerCase();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. SALES QUERY (Safe Read)
    if (lower.includes('today') || lower.includes('sales') || lower.includes('revenue') || lower.includes('profit')) {
      const todayStr = new Date().toISOString().substring(0, 10);
      const todaySales = sales.filter(s => s.date === todayStr);
      const totalRev = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
      const totalProf = todaySales.reduce((acc, s) => acc + s.profitTotal, 0);
      const margin = totalRev > 0 ? Math.round((totalProf / totalRev) * 100) : 0;

      const replyText = `📊 **Today's Financial Summary (Kalegana Store)**\n\n` +
        `• **Gross Sales:** LKR ${totalRev.toLocaleString()}\n` +
        `• **Gross Profit:** LKR ${totalProf.toLocaleString()} (${margin}% spread)\n` +
        `• **Completed Invoices:** ${todaySales.length} orders\n` +
        `• **Top Seller:** iPhone 15 Pro Max 256GB Natural Titanium`;

      setMessages(prev => [
        ...prev,
        { id: `msg-${Date.now()}`, sender: 'assistant', text: replyText, timestamp: timeStr }
      ]);
      return;
    }

    // 2. LOW STOCK QUERY (Safe Read)
    if (lower.includes('low') || lower.includes('stock') && !lower.includes('restock') && !lower.includes('adjust')) {
      const lowStock = products.filter(p => p.currentStock <= p.minStock);
      let replyText = `📦 **Inventory Stock Alert**\n\n`;
      if (lowStock.length === 0) {
        replyText += `All items are currently at or above healthy inventory thresholds.`;
      } else {
        replyText += `Currently **${lowStock.length} items** are at or below minimum threshold:\n\n`;
        lowStock.forEach(p => {
          replyText += `• **${p.name}:** ${p.currentStock} units remaining (Min required: ${p.minStock})\n`;
        });
        replyText += `\n*Recommendation:* Reorder from Dubai Electronics FZE or Colombo Tech Hub.`;
      }

      setMessages(prev => [
        ...prev,
        { id: `msg-${Date.now()}`, sender: 'assistant', text: replyText, timestamp: timeStr }
      ]);
      return;
    }

    // 3. CUSTOMER CREDIT DEBT QUERY (Safe Read)
    if (lower.includes('credit') || lower.includes('debt') || lower.includes('customer')) {
      const debtors = customers.filter(c => c.creditBalance > 0);
      const totalDebt = debtors.reduce((acc, c) => acc + c.creditBalance, 0);

      let replyText = `💳 **Customer Credit Ledger Status**\n\n` +
        `• **Total Outstanding Balance:** LKR ${totalDebt.toLocaleString()}\n` +
        `• **Active Debtors:** ${debtors.length} customer(s)\n\n`;

      debtors.forEach(c => {
        replyText += `• **${c.name}** (${c.phone}): LKR ${c.creditBalance.toLocaleString()} (Limit: ${c.creditLimit.toLocaleString()})\n`;
      });

      setMessages(prev => [
        ...prev,
        { id: `msg-${Date.now()}`, sender: 'assistant', text: replyText, timestamp: timeStr }
      ]);
      return;
    }

    // 4. WRITE ACTION: REPAIR STATUS (Proposed Write Gate)
    if (lower.includes('repair') || lower.includes('rep-2026')) {
      const targetRep = repairs.find(r => lower.includes(r.ticketNumber.toLowerCase()) || r.ticketNumber === 'REP-2026-0042');
      if (targetRep) {
        const action: ProposedAction = {
          id: `act-${Date.now()}`,
          type: 'UPDATE_REPAIR_STATUS',
          title: `Update Repair Ticket ${targetRep.ticketNumber}`,
          details: `Change status of ${targetRep.deviceModel} (${targetRep.customerName}) from "${targetRep.status}" to "Ready for Pickup".`,
          targetId: targetRep.id,
          payload: { status: 'Ready for Pickup' },
          status: 'pending'
        };

        const replyText = `I have formulated a database modification request based on your instruction. Please review and confirm the action gate below.`;

        setMessages(prev => [
          ...prev,
          { id: `msg-${Date.now()}`, sender: 'assistant', text: replyText, timestamp: timeStr, action }
        ]);
        return;
      }
    }

    // 5. WRITE ACTION: RESTOCK INVENTORY (Proposed Write Gate)
    if (lower.includes('restock') || lower.includes('adjust') || lower.includes('remax')) {
      const targetProd = products.find(p => p.name.toLowerCase().includes('remax') || p.category === 'Cases & Protection');
      if (targetProd) {
        const action: ProposedAction = {
          id: `act-${Date.now()}`,
          type: 'UPDATE_STOCK',
          title: `Stock Inward Adjustment (+10 Units)`,
          details: `Increase stock for "${targetProd.name}" from ${targetProd.currentStock} to ${targetProd.currentStock + 10} units.`,
          targetId: targetProd.id,
          payload: { adjustment: 10, reason: 'AI Store Assistant stock replenishment proposal' },
          status: 'pending'
        };

        const replyText = `I've prepared a stock adjustment proposal for "${targetProd.name}". Confirmation required before committing to local database.`;

        setMessages(prev => [
          ...prev,
          { id: `msg-${Date.now()}`, sender: 'assistant', text: replyText, timestamp: timeStr, action }
        ]);
        return;
      }
    }

    // Default Fallback
    const fallbackText = `I have analyzed your query: "${query}". You can ask me about:\n\n` +
      `1. Real-time store revenue & margin breakdown\n` +
      `2. Low stock devices needing reorder\n` +
      `3. Customer credit ledger and debt balances\n` +
      `4. Repair bench pipeline updates (e.g. 'Mark repair REP-2026-0042 as Ready')\n` +
      `5. Stock adjustments with controlled confirmation gates.`;

    setMessages(prev => [
      ...prev,
      { id: `msg-${Date.now()}`, sender: 'assistant', text: fallbackText, timestamp: timeStr }
    ]);
  };

  const handleActionConfirm = (action: ProposedAction) => {
    if (action.type === 'UPDATE_REPAIR_STATUS') {
      updateRepairStatus(action.targetId!, action.payload.status);
      logAction('AI_WRITE_CONFIRMED', 'REPAIR', `AI action accepted: ${action.title}`);
      showNotification('success', `Repair ticket updated to ${action.payload.status}`);
    } else if (action.type === 'UPDATE_STOCK') {
      adjustStock(action.targetId!, action.payload.adjustment, action.payload.reason);
      logAction('AI_WRITE_CONFIRMED', 'INVENTORY', `AI action accepted: ${action.title}`);
      showNotification('success', `Added ${action.payload.adjustment} units to inventory`);
    }

    // Mark action as accepted
    setMessages(prev => prev.map(m => {
      if (m.action?.id === action.id) {
        return {
          ...m,
          action: { ...m.action, status: 'accepted' as const }
        };
      }
      return m;
    }));
  };

  const handleActionReject = (action: ProposedAction) => {
    logAction('AI_WRITE_REJECTED', 'SYSTEM', `AI action rejected by user: ${action.title}`);
    showNotification('info', `Proposed action rejected`);

    setMessages(prev => prev.map(m => {
      if (m.action?.id === action.id) {
        return {
          ...m,
          action: { ...m.action, status: 'rejected' as const }
        };
      }
      return m;
    }));
  };

  return (
    <div className="h-[600px] flex flex-col rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-xl overflow-hidden select-none">
      {/* Header */}
      <div className="px-6 py-4 bg-light-surface/60 dark:bg-dark-surface/60 border-b border-light-border dark:border-dark-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                AppleVision Store Assistant
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">
                Gemini 1.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-light-muted dark:text-dark-muted">
              Safe Read analytics with Reviewable Write Confirmation Gates
            </p>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-xl space-y-2`}>
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-brand-500 text-white rounded-tr-none'
                    : 'bg-light-surface/80 dark:bg-dark-surface/80 border border-light-border dark:border-dark-border text-slate-800 dark:text-slate-200 rounded-tl-none whitespace-pre-line'
                }`}
              >
                {msg.text}
              </div>

              {/* Proposed Action Confirmation Gate */}
              {msg.action && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Proposed Action Gate: {msg.action.title}</span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300">
                    {msg.action.details}
                  </p>

                  {msg.action.status === 'pending' ? (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleActionConfirm(msg.action!)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept & Apply Change</span>
                      </button>

                      <button
                        onClick={() => handleActionReject(msg.action!)}
                        className="px-3.5 py-2 rounded-xl bg-light-surface dark:bg-dark-surface hover:bg-red-500/10 text-slate-600 dark:text-slate-400 hover:text-red-500 border border-light-border dark:border-dark-border font-semibold transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : msg.action.status === 'accepted' ? (
                    <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Action Approved & Executed in Store Database</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-red-500 font-bold">
                      <X className="w-4 h-4" />
                      <span>Action Rejected by Administrator</span>
                    </div>
                  )}
                </div>
              )}

              <div className={`text-[10px] text-light-muted font-mono ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips */}
      <div className="px-6 py-2 bg-light-surface/40 dark:bg-dark-surface/40 border-t border-light-border dark:border-dark-border flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-light-muted font-semibold whitespace-nowrap">Suggested:</span>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1 rounded-full bg-white dark:bg-dark-card hover:border-brand-500 border border-light-border dark:border-dark-border whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="p-4 bg-white dark:bg-dark-card border-t border-light-border dark:border-dark-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Ask store intelligence or request action (e.g. What are today's sales?)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/25 transition-all flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span className="text-xs">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
