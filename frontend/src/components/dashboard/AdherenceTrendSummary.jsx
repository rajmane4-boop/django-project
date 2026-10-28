import React from 'react';
import { TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { classifyAdherenceBand } from '../../utils/clinicalCalculators';

export default function AdherenceTrendSummary({ stats = {} }) {
  const rate = stats.adherence_rate || 0;
  const classification = classifyAdherenceBand(rate);

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Adherence Quality Assessment
          </h4>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
          classification.band === 'OPTIMAL'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            : classification.band === 'MODERATE'
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
        }`}>
          {classification.label}
        </span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {classification.description}
      </p>

      <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
          <span className="text-slate-400 block text-[10px]">Today Prescribed</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{stats.total_today || 0}</span>
        </div>
        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
          <span className="text-emerald-700 dark:text-emerald-400 block text-[10px]">Taken</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">{stats.taken_today || 0}</span>
        </div>
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40">
          <span className="text-rose-700 dark:text-rose-400 block text-[10px]">Overdue / Missed</span>
          <span className="font-bold text-rose-700 dark:text-rose-400">{stats.missed_today || 0}</span>
        </div>
      </div>
    </div>
  );
}
