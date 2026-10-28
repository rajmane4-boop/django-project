import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';

export default function MedicationModal({ isOpen, onClose, onSave, medication = null }) {
  const [formData, setFormData] = useState({
    name: '',
    chemical_name: '',
    stock_level: 30,
    reorder_threshold: 10,
    unit: 'tablets',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (medication) {
      setFormData({
        name: medication.name || '',
        chemical_name: medication.chemical_name || '',
        stock_level: medication.stock_level ?? 30,
        reorder_threshold: medication.reorder_threshold ?? 10,
        unit: medication.unit || 'tablets',
      });
    } else {
      setFormData({
        name: '',
        chemical_name: '',
        stock_level: 30,
        reorder_threshold: 10,
        unit: 'tablets',
      });
    }
  }, [medication, isOpen]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save medication');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={medication ? 'Edit Medication' : 'Add New Medication'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Commercial Brand Name *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Metformin 500mg"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Chemical / Generic Name
          </label>
          <input
            type="text"
            name="chemical_name"
            value={formData.chemical_name}
            onChange={handleChange}
            placeholder="e.g. Metformin Hydrochloride"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Stock *
            </label>
            <input
              type="number"
              name="stock_level"
              min="0"
              required
              value={formData.stock_level}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reorder Point *
            </label>
            <input
              type="number"
              name="reorder_threshold"
              min="1"
              required
              value={formData.reorder_threshold}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Unit Type
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
            >
              <option value="tablets">Tablets</option>
              <option value="capsules">Capsules</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="puffs">Puffs</option>
              <option value="units">Units (IU)</option>
              <option value="drops">Drops</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-600/30 transition-all disabled:opacity-50"
          >
            {submitting ? 'Saving...' : medication ? 'Update Medication' : 'Add Medication'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
