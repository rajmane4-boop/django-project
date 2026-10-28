import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { PackagePlus } from 'lucide-react';

export default function QuickRefillModal({ isOpen, onClose, medication, onRefill }) {
  const [unitsToAdd, setUnitsToAdd] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  if (!medication) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (unitsToAdd <= 0) return;
    setSubmitting(true);
    try {
      await onRefill(medication.id, Number(unitsToAdd));
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const presetAmounts = [15, 30, 60, 90];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Quick Refill: ${medication.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Current Inventory:</span>
            <strong className="text-slate-900 dark:text-white font-bold">{medication.stock_level} {medication.unit}</strong>
          </div>
          <div className="flex justify-between text-slate-500 mt-1">
            <span>After Refill:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{medication.stock_level + Number(unitsToAdd || 0)} {medication.unit}</strong>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Preset Refill Quantity ({medication.unit}):
          </label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setUnitsToAdd(amt)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  unitsToAdd === amt
                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                }`}
              >
                +{amt}
              </button>
            ))}
          </div>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Or Enter Custom Quantity:
          </label>
          <input
            type="number"
            min="1"
            value={unitsToAdd}
            onChange={(e) => setUnitsToAdd(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !unitsToAdd}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all disabled:opacity-50"
          >
            <PackagePlus className="w-4 h-4" />
            {submitting ? 'Updating...' : `Add +${unitsToAdd} ${medication.unit}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
