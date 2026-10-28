import React, { useState, useEffect } from 'react';
import { CalendarClock, Plus, Edit2, Trash2, Clock, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import RegimenModal from './RegimenModal';
import Toast from '../../components/ui/Toast';

export default function RegimenListPage() {
  const [regimens, setRegimens] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRegimen, setEditingRegimen] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [regData, medData] = await Promise.all([
        api.getRegimens(),
        api.getMedications(),
      ]);
      const regs = Array.isArray(regData) ? regData : (regData?.regimens || []);
      const meds = Array.isArray(medData) ? medData : (medData?.medications || []);
      setRegimens(regs);
      setMedications(meds);
    } catch (err) {
      setToast({ message: 'Failed to load regimens: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (formData) => {
    if (editingRegimen) {
      await api.updateRegimen(editingRegimen.id, formData);
      setToast({ message: 'Prescription regimen updated', type: 'success' });
    } else {
      await api.createRegimen(formData);
      setToast({ message: 'Prescription regimen created', type: 'success' });
    }
    fetchData();
  };

  const handleDelete = async (id, medName) => {
    if (!window.confirm(`Delete regimen for ${medName}? This removes future scheduled doses.`)) return;
    try {
      await api.deleteRegimen(id);
      setToast({ message: 'Regimen deleted', type: 'info' });
      fetchData();
    } catch (err) {
      setToast({ message: 'Failed to delete: ' + err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Prescription Regimens
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure how medications are tied to your daily routine (Module 1 Routine Engine).
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRegimen(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Regimen
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      ) : regimens.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <CalendarClock className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No prescription regimens found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Add a regimen to establish your biological anchor schedule and start generating daily dose events.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regimens.map((reg) => (
            <div
              key={reg.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {reg.medication_name || (reg.medication && reg.medication.name)}
                  </h3>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                    {reg.dosage_units} unit(s)
                  </span>
                </div>

                {/* Biological Anchor details */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Anchor:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {reg.anchor_display || reg.anchor}
                    </span>
                  </div>
                  {reg.anchor !== 'CUSTOM' ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Offset:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {reg.offset_minutes > 0
                          ? `+${reg.offset_minutes}m`
                          : reg.offset_minutes < 0
                          ? `${reg.offset_minutes}m`
                          : '0m (exact)'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Fixed Time:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {reg.custom_time}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Frequency:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {reg.frequency_display || reg.frequency}
                    </span>
                  </div>
                </div>

                {reg.instructions && (
                  <p className="text-xs text-slate-500 italic">
                    "{reg.instructions}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setEditingRegimen(reg);
                    setModalOpen(true);
                  }}
                  className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Regimen"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(reg.id, reg.medication_name)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                  title="Delete Regimen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regimen Modal */}
      <RegimenModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        regimen={editingRegimen}
        medications={medications}
      />
    </div>
  );
}
