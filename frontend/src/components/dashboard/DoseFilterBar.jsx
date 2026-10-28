import React from 'react';
import { Search, Filter } from 'lucide-react';

export default function DoseFilterBar({ filterStatus, onStatusChange, searchTerm, onSearchChange }) {
  const statuses = [
    { key: 'ALL', label: 'All Doses' },
    { key: 'SCHEDULED', label: 'Pending' },
    { key: 'TAKEN', label: 'Taken' },
    { key: 'MISSED', label: 'Missed' },
    { key: 'SKIPPED', label: 'Skipped' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter doses by medication name..."
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Status Filter Buttons */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
        {statuses.map((s) => (
          <button
            key={s.key}
            onClick={() => onStatusChange(s.key)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
              filterStatus === s.key
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
