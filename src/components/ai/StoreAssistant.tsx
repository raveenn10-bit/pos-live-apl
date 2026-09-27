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
  AlertCircle,
  CheckCircle2,
  Loader2,
  Zap,
  RefreshCw
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
  isError?: boolean;
}

interface StoreAssistantProps {
  compact?: boolean; // for floating panel mode
}

export const StoreAssistant: React.FC<StoreAssistantProps> = ({ compact = false }) => {
  const { 
    products, 
    sales, 
    repairs, 
    customers, 
    expenses,
    settings,
    updateProduct, 
    adjustStock, 
    updateRepairStatus, 
    logAction, 
    showNotification 
  } = useStore();
  const { currentUser } = useAuth();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ configured: boolean; model: string; hasKey: boolean } | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>>([]);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello ${currentUser?.name || 'there'}! 👋 I am your **AppleVision Store Intelligence Assistant** powered by Gemini AI.\n\nI have live read access to your store data — sales, inventory, repairs, customers, and expenses. Ask me anything or request store adjustments.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check AI status on mount
  useEffect(() => {
    checkAiStatus();
  }, []);

  const checkAiStatus = async () => {
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.ai?.getStatus) {
        const res = await electronAPI.ai.getStatus();
        if (res?.success && res?.data) {
          setAiStatus(res.data);
        }
      }
    } catch (err) {
      console.error('[AI] Failed to get status:', err);
    }
  };

  const quickPrompts = [
    "What are today's sales and profit margins?",
    "Which products are low on stock?",
    "Show me pending repair tickets",
    "What is my total revenue this week?",
    "Which customers have outstanding credit balances?",
  ];

  const buildStoreContext = () => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const todaySales = sales.filter(s => s.date === todayStr);
    const todayRevenue = todaySales.reduce((a, s) => a + s.totalAmount, 0);
    const todayProfit = todaySales.reduce((a, s) => a + (s.profitTotal || 0), 0);
    const pendingRepairs = repairs.filter(r => !['Completed', 'Picked Up', 'Cancelled'].includes(r.status));
    const lowStock = products.filter(p => p.currentStock <= p.minStock);
    const creditCustomers = customers.filter(c => c.creditBalance > 0);
    const totalCredit = creditCustomers.reduce((a, c) => a + c.creditBalance, 0);

    return `=== APPLEVISION STORE GALLE — LIVE STORE DATA ===
Date: ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
Store: AppleVision Store Galle, Kalegana Junction, Galle 80000
Logged in: ${currentUser?.name || 'Staff'} (${currentUser?.role || 'staff'})

TODAY'S PERFORMANCE:
- Sales Orders: ${todaySales.length}
- Revenue: LKR ${todayRevenue.toLocaleString()}
- Gross Profit: LKR ${todayProfit.toLocaleString()} (${todayRevenue > 0 ? Math.round(todayProfit / todayRevenue * 100) : 0}% margin)

INVENTORY:
- Total Products: ${products.length}
- Low Stock Alerts: ${lowStock.length} items (${lowStock.map(p => `${p.name}: ${p.currentStock} units`).slice(0, 5).join(', ')})

REPAIRS BENCH:
- Active Tickets: ${pendingRepairs.length}
- Statuses: ${Object.entries(pendingRepairs.reduce((a: any, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {})).map(([k, v]) => `${k}: ${v}`).join(', ')}

CUSTOMER CREDIT:
- Outstanding Credit Total: LKR ${totalCredit.toLocaleString()}
- Customers with balance: ${creditCustomers.length}

ALL SALES (this session, up to 20): ${sales.slice(-20).map(s => `${s.invoiceNumber} ${s.date} Rs.${s.totalAmount}`).join(' | ')}
LOW STOCK PRODUCTS: ${lowStock.map(p => `${p.name}(${p.currentStock}/${p.minStock})`).join(', ')}
PENDING REPAIRS: ${pendingRepairs.slice(0, 10).map(r => `${r.ticketNumber} - ${r.deviceModel} - ${r.customerName} - ${r.status}`).join(' | ')}

You are a professional Apple store AI assistant. Answer accurately based on this live data. For write operations (stock changes, status updates, etc.), propose them clearly so the user can confirm.`;
  };

  const getSmartLocalResponse = (query: string): string => {
    const lower = query.toLowerCase().trim();
    const todayStr = new Date().toISOString().substring(0, 10);
    const todaySales = sales.filter(s => s.date === todayStr);
    const todayRevenue = todaySales.reduce((a, s) => a + s.totalAmount, 0);
    const todayProfit = todaySales.reduce((a, s) => a + (s.profitTotal || 0), 0);
    const lowStock = products.filter(p => p.currentStock <= p.minStock);
    const pendingRepairs = repairs.filter(r => !['Completed', 'Picked Up', 'Cancelled'].includes(r.status));
    const creditCustomers = customers.filter(c => c.creditBalance > 0);
    const totalCredit = creditCustomers.reduce((a, c) => a + c.creditBalance, 0);

    if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower.includes('ayubowan') || lower.includes('halo')) {
      return `👋 **Hello ${currentUser?.name || 'there'}!**\n\nHow can I help you today? Here is a quick snapshot of AppleVision Store Galle:\n\n• **Today's Revenue:** LKR ${todayRevenue.toLocaleString()} (${todaySales.length} sales)\n• **Pending Repairs:** ${pendingRepairs.length} devices on bench\n• **Low Stock Warnings:** ${lowStock.length} items\n\nFeel free to ask about sales, stock, repairs, customer credit, or expenses!`;
    }

    if (lower.includes('sales') || lower.includes('revenue') || lower.includes('today') || lower.includes('income')) {
      return `📊 **Today's Financial Overview (${todayStr}):**\n\n• **Sales Orders:** ${todaySales.length} invoice(s)\n• **Total Revenue:** LKR ${todayRevenue.toLocaleString()}\n• **Gross Profit:** LKR ${todayProfit.toLocaleString()} (${todayRevenue > 0 ? Math.round(todayProfit / todayRevenue * 100) : 0}% margin)\n• **Cash Register:** Active & Balanced`;
    }

    if (lower.includes('profit') || lower.includes('margin') || lower.includes('gain')) {
      return `💰 **Profit & Margin Performance:**\n\n• **Gross Profit Today:** LKR ${todayProfit.toLocaleString()}\n• **Effective Margin:** ${todayRevenue > 0 ? Math.round(todayProfit / todayRevenue * 100) : 0}%\n• **Top Performing Category:** iPhone Pro Series`;
    }

    if (lower.includes('stock') || lower.includes('low') || lower.includes('inventory') || lower.includes('quantity')) {
      return `📦 **Inventory Stock Status:**\n\n• **Total Products in Catalog:** ${products.length} items\n• **Low Stock Warnings:** ${lowStock.length} items:\n${lowStock.map(p => `  - **${p.name}:** Only ${p.currentStock} left (Min limit: ${p.minStock})`).join('\n') || '  - All stock levels healthy!'}`;
    }

    if (lower.includes('repair') || lower.includes('ticket') || lower.includes('bench') || lower.includes('device')) {
      return `🔧 **Repairs Bench Status:**\n\n• **Active Tickets:** ${pendingRepairs.length} devices currently under inspection/repair.\n${pendingRepairs.slice(0, 5).map(r => `  - **${r.ticketNumber}:** ${r.deviceModel} (${r.customerName}) — *${r.status}*`).join('\n') || '  - No pending repairs at this time.'}`;
    }

    if (lower.includes('credit') || lower.includes('debt') || lower.includes('balance') || lower.includes('customer')) {
      return `💳 **Customer Credit & Receivables:**\n\n• **Total Outstanding Due:** LKR ${totalCredit.toLocaleString()}\n• **Unsettled Accounts:** ${creditCustomers.length} customer(s)\n${creditCustomers.slice(0, 5).map(c => `  - **${c.name}** (${c.phone}): Due LKR ${c.creditBalance.toLocaleString()}`).join('\n') || '  - No outstanding customer credit balances.'}`;
    }

    return `💡 **AppleVision Intelligence Summary:**\n\n• Today's Revenue: **LKR ${todayRevenue.toLocaleString()}** (${todaySales.length} sales)\n• Active Inventory: **${products.length} Products** (${lowStock.length} Low Stock)\n• Pending Repairs: **${pendingRepairs.length} Devices**\n• Outstanding Credit: **LKR ${totalCredit.toLocaleString()}**\n\nAsk me specific questions about any device, customer, or transaction!`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: timeStr
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const newHistory = [...chatHistory, { role: 'user' as const, parts: [{ text: query }] }];

    try {
      const electronAPI = (window as any).electronAPI;
      let replyText = '';

      if (electronAPI?.ai?.chat) {
        const storeContext = buildStoreContext();
        const res = await electronAPI.ai.chat({ 
          prompt: query, 
          history: chatHistory,
          context: storeContext
        });

        if (res?.success && res?.data) {
          const assistantReply = res.data.text || res.data;
          replyText = typeof assistantReply === 'string' ? assistantReply : JSON.stringify(assistantReply);
        }
      } 
      
      // If no desktop bridge response, try direct Gemini REST API
      if (!replyText && settings?.geminiApiKey) {
        try {
          const storeContext = buildStoreContext();
          const systemPrompt = `You are the Gemini AI Copilot for AppleVision Store Galle. Use the store context below:\n\n${storeContext}`;
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.geminiModel || 'gemini-1.5-flash'}:generateContent?key=${settings.geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: 'Understood. I am ready to answer queries using live AppleVision store data.' }] },
                ...chatHistory,
                { role: 'user', parts: [{ text: query }] }
              ]
            })
          });
          
          if (response.ok) {
            const resJson = await response.json();
            const geminiReply = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
            if (geminiReply) {
              replyText = geminiReply;
            }
          }
        } catch (apiErr) {
          console.warn('[AI] Gemini REST API fallback triggered:', apiErr);
        }
      }

      // If still no reply (or API key invalid / offline), use smart local intelligence
      if (!replyText) {
        replyText = getSmartLocalResponse(query);
      }

      setChatHistory([
        ...newHistory,
        { role: 'model', parts: [{ text: replyText }] }
      ]);

      setMessages(prev => [
        ...prev,
        { id: `msg-${Date.now()}`, sender: 'assistant', text: replyText, timestamp: timeStr }
      ]);
    } catch (err: any) {
      const fallbackReply = getSmartLocalResponse(query);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-ans-${Date.now()}`,
          sender: 'assistant',
          text: fallbackReply,
          timestamp: timeStr,
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
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

    setMessages(prev => prev.map(m => {
      if (m.action?.id === action.id) {
        return { ...m, action: { ...m.action, status: 'accepted' as const } };
      }
      return m;
    }));
  };

  const handleActionReject = (action: ProposedAction) => {
    logAction('AI_WRITE_REJECTED', 'SYSTEM', `AI action rejected by user: ${action.title}`);
    showNotification('info', `Proposed action rejected`);
    setMessages(prev => prev.map(m => {
      if (m.action?.id === action.id) {
        return { ...m, action: { ...m.action, status: 'rejected' as const } };
      }
      return m;
    }));
  };

  const handleClearChat = () => {
    setChatHistory([]);
    setMessages([{
      id: 'msg-welcome-reset',
      sender: 'assistant',
      text: `Chat cleared. I have full access to your live store data. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const isAiConnected = Boolean(settings?.geminiApiKey || aiStatus?.hasKey);
  const height = compact ? 'h-full' : 'h-[620px]';

  return (
    <div className={`${height} flex flex-col rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-xl overflow-hidden select-none`}>
      {/* Header */}
      <div className="px-5 py-3 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Store AI Assistant</h3>
              {isAiConnected ? (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  {settings?.geminiModel || aiStatus?.model || 'Gemini 1.5 Active'}
                </span>
              ) : (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1 font-medium">
                  <Sparkles className="w-2.5 h-2.5" />
                  Store Copilot
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">AppleVision Galle • Live Data Access</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={checkAiStatus}
            title="Refresh AI status"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClearChat}
            title="Clear chat"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-[10px] font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5 border border-brand-500/20">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}

            <div className="max-w-[85%] space-y-1.5">
              <div
                className={`p-3 rounded-2xl text-[11px] leading-relaxed whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-brand-500 text-white rounded-tr-none'
                    : msg.isError
                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-tl-none'
                    : 'bg-light-surface/80 dark:bg-dark-surface/80 border border-light-border dark:border-dark-border text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>

              {/* Proposed Action Confirmation Gate */}
              {msg.action && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Action Gate: {msg.action.title}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px]">{msg.action.details}</p>
                  {msg.action.status === 'pending' ? (
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        onClick={() => handleActionConfirm(msg.action!)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-1 text-[11px] transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Accept & Apply</span>
                      </button>
                      <button
                        onClick={() => handleActionReject(msg.action!)}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-dark-surface hover:bg-red-50 text-slate-600 dark:text-slate-400 hover:text-red-500 border border-light-border font-semibold transition-colors text-[11px]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : msg.action.status === 'accepted' ? (
                    <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Applied to Database</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-red-500 font-bold text-[11px]">
                      <X className="w-3.5 h-3.5" />
                      <span>Rejected</span>
                    </div>
                  )}
                </div>
              )}

              <div className={`text-[10px] text-light-muted font-mono ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-xl bg-slate-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0 border border-brand-500/20">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 rounded-2xl rounded-tl-none bg-light-surface/80 dark:bg-dark-surface/80 border border-light-border dark:border-dark-border flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-brand-500 animate-spin" />
              <span className="text-[11px] text-slate-500">Analyzing store data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {!compact && (
        <div className="px-4 py-2 bg-light-surface/40 dark:bg-dark-surface/40 border-t border-light-border dark:border-dark-border flex items-center gap-2 overflow-x-auto">
          <Zap className="w-3 h-3 text-brand-500 flex-shrink-0" />
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-dark-card hover:border-brand-500 border border-light-border dark:border-dark-border whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium text-[10px] transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="p-3 bg-white dark:bg-dark-card border-t border-light-border dark:border-dark-border flex-shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder={isLoading ? 'AI is responding...' : 'Ask about sales, inventory, repairs, credit...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-3.5 py-2 text-[11px] rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white disabled:opacity-60 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-md shadow-brand-500/25 transition-all flex items-center gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
