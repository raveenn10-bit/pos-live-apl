'use client';

import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { notifications, dismissNotification } = useStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${
            notif.type === 'success'
              ? 'bg-emerald-950/90 dark:bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : notif.type === 'error'
              ? 'bg-red-950/90 dark:bg-red-950/90 border-red-500/40 text-red-200'
              : notif.type === 'warning'
              ? 'bg-amber-950/90 dark:bg-amber-950/90 border-amber-500/40 text-amber-200'
              : 'bg-slate-900/90 dark:bg-slate-900/90 border-slate-700 text-slate-200'
          }`}
        >
          <div className="mt-0.5 flex-shrink-0">
            {notif.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {notif.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
            {notif.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {notif.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          </div>
          <div className="flex-1 text-xs font-medium leading-relaxed">
            {notif.message}
          </div>
          <button
            onClick={() => dismissNotification(notif.id)}
            className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
