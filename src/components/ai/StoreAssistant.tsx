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
      text: `Hello ${currentUser?.name || 'there'}! ðŸ‘‹ I am your **AppleVision Store Intelligence Assistant** powered by Gemini AI.\n\nI have full read access to your store data â€” sales, inventory, repairs, customers, and expenses. Ask me anything or request controlled store adjustments.`,
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

    return `=== APPLEVISION STORE GALLE â€” LIVE STORE DATA ===
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

    // Update chat history for Gemini multi-turn
    const newHistory = [...chatHistory, { role: 'user' as const, parts: [{ text: query }] }];

    try {
      const electronAPI = (window as any).electronAPI;
      
      if (!electronAPI?.ai?.chat) {
        throw new Error('AI bridge not available. Please restart the application.');
      }

      const storeContext = buildStoreContext();
      const res = await electronAPI.ai.chat({ 
        prompt: query, 
        history: chatHistory,
        context: storeContext
      });

      if (res?.success && res?.data) {
        const assistantReply = res.data.text || res.data;
        const replyText = typeof assistantReply === 'string' ? assistantReply : JSON.stringify(assistantReply);

        // Update history for next turn
        setChatHistory([
          ...newHistory,
          { role: 'model', parts: [{ text: replyText }] }
        ]);

        setMessages(prev => [
          ...prev,
          { id: `msg-${Date.now()}`, sender: 'assistant', text: replyText, timestamp: timeStr }
        ]);
      } else {
        const errMsg = res?.message || 'AI did not return a response.';
        throw new Error(errMsg);
      }
    } catch (err: any) {
      const errorText = err.message || 'Unknown error communicating with AI.';
      setMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'assistant',
          text: `âš ï¸ **AI Error:** ${errorText}\n\nPlease ensure your Gemini API key is configured in Settings â†’ Gemini AI tab.`,
          timestamp: timeStr,
          isError: true
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
      text: `Chat cleared. I still have full access to your live store data. How can I help you?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

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
              {aiStatus?.hasKey ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  {aiStatus.model || 'gemini-1.5-flash'}
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" />
                  No API Key
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">AppleVision Galle Â· Live Data Access</p>
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

      {/* API Key Warning */}
      {aiStatus && !aiStatus.hasKey && (
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            Gemini API key not set. Go to <strong>Settings â†’ Gemini AI</strong> to add your key.
          </p>
        </div>
      )}

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
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-tl-none'
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
            placeholder={isLoading ? 'AI is responding...' : 'Ask about sales, inventory, repairs...'}
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

