import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800',
    error: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800',
    info: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/80 dark:text-teal-200 dark:border-teal-800',
  }[type] || 'bg-slate-50 text-slate-800 border-slate-300';

  const Icon = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
    info: CheckCircle2,
  }[type] || CheckCircle2;

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 border rounded-xl shadow-lg transition-all transform duration-300 ${styles}`}>
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
