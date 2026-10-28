import React from 'react';

const BADGE_CONFIG = {
  // Dose States
  SCHEDULED: {
    label: 'Scheduled',
    bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  REMINDED: {
    label: 'Reminded',
    bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    dot: 'bg-amber-500 animate-pulse',
  },
  TAKEN: {
    label: 'Taken',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  TAKEN_LATE: {
    label: 'Taken Late',
    bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    dot: 'bg-purple-500',
  },
  SKIPPED: {
    label: 'Skipped',
    bg: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  MISSED: {
    label: 'Missed',
    bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
    dot: 'bg-rose-500',
  },

  // Stock Alerts
  CRITICAL: {
    label: 'Critical Stock',
    bg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-800',
    dot: 'bg-rose-600',
  },
  WARNING: {
    label: 'Low Stock',
    bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800',
    dot: 'bg-amber-600',
  },
  HEALTHY: {
    label: 'In Stock',
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-600',
  },

  // Tier Escalations
  TIER_1: {
    label: 'Tier 1 Escalation',
    bg: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500 animate-pulse',
  },
  TIER_2: {
    label: 'Tier 2 Critical',
    bg: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800',
    dot: 'bg-red-600 animate-ping',
  },
  RESOLVED: {
    label: 'Escalation Resolved',
    bg: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-800',
    dot: 'bg-teal-500',
  },
};

export default function StatusBadge({ status, text, size = 'sm' }) {
  const config = BADGE_CONFIG[status] || {
    label: text || status || 'Unknown',
    bg: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    dot: 'bg-gray-400',
  };

  const displayText = text || config.label;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${
        isSm ? 'px-2.5 py-0.5 text-xs' : 'px-3.5 py-1 text-sm'
      } ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{displayText}</span>
    </span>
  );
}
