import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';

const ANCHOR_CHOICES = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'BEDTIME', label: 'Bedtime' },
  { value: 'CUSTOM', label: 'Custom Time (Fixed Clock)' },
];

const FREQUENCY_CHOICES = [
  { value: 'ONCE_DAILY', label: 'Once Daily' },
  { value: 'TWICE_DAILY', label: 'Twice Daily' },
  { value: 'THRICE_DAILY', label: 'Thrice Daily' },
  { value: 'AS_NEEDED', label: 'As Needed (PRN)' },
];

export default function RegimenModal({
  isOpen,
  onClose,
  onSave,
  regimen = null,
  medications = [],
}) {
  const [formData, setFormData] = useState({
    medication_id: '',
    dosage_units: 1,
    anchor: 'BREAKFAST',
    offset_minutes: 0,
    custom_time: '',
    frequency: 'ONCE_DAILY',
    instructions: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (regimen) {
      setFormData({
        medication_id: regimen.medication_id || (regimen.medication && regimen.medication.id) || '',
        dosage_units: regimen.dosage_units ?? 1,
        anchor: regimen.anchor || 'BREAKFAST',
        offset_minutes: regimen.offset_minutes ?? 0,
        custom_time: regimen.custom_time || '',
        frequency: regimen.frequency || 'ONCE_DAILY',
        instructions: regimen.instructions || '',
      });
    } else {
      setFormData({
        medication_id: medications.length > 0 ? medications[0].id : '',
        dosage_units: 1,
        anchor: 'BREAKFAST',
        offset_minutes: 0,
        custom_time: '',
        frequency: 'ONCE_DAILY',
        instructions: '',
      });
    }
  }, [regimen, medications, isOpen]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.medication_id) {
      setError('Please select a medication');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save regimen');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={regimen ? 'Edit Prescription Regimen' : 'Add Prescription Regimen'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Prescribed Medication *
          </label>
          <select
            name="medication_id"
            required
            value={formData.medication_id}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
          >
            <option value="">-- Choose medication --</option>
            {medications.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.stock_level} {m.unit} in stock)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dosage Units (e.g. 1 pill) *
            </label>
            <input
              type="number"
              name="dosage_units"
              min="1"
              required
              value={formData.dosage_units}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Frequency
            </label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
            >
              {FREQUENCY_CHOICES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Biological Anchor Engine Section */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Biological Anchor Calibration (Module 1)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Routine Anchor
              </label>
              <select
                name="anchor"
                value={formData.anchor}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500"
              >
                {ANCHOR_CHOICES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.anchor === 'CUSTOM' ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Fixed Clock Time
                </label>
                <input
                  type="time"
                  name="custom_time"
                  required
                  value={formData.custom_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Offset Minutes (-60m to +60m)
                </label>
                <input
                  type="number"
                  name="offset_minutes"
                  min="-60"
                  max="60"
                  step="5"
                  value={formData.offset_minutes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-[10px] text-slate-400">
                  {formData.offset_minutes > 0
                    ? `+${formData.offset_minutes} min after meal`
                    : formData.offset_minutes < 0
                    ? `${formData.offset_minutes} min before meal`
                    : 'Right at meal time'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Clinical Instructions
          </label>
          <input
            type="text"
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            placeholder="e.g. Take with a full glass of water after food"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
          />
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
            {submitting ? 'Saving...' : regimen ? 'Update Regimen' : 'Add Regimen'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
