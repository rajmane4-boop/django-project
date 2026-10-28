import React, { useState, useEffect } from 'react';
import { Pill, Plus, Edit2, Trash2, AlertTriangle, TrendingDown, Clock, Search } from 'lucide-react';
import { api } from '../../api/client';
import MedicationModal from './MedicationModal';
import StatusBadge from '../../components/ui/StatusBadge';
import Toast from '../../components/ui/Toast';

export default function MedicationListPage() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const data = await api.getMedications();
      setMedications(data);
    } catch (err) {
      setToast({ message: 'Failed to load medications: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const handleSave = async (formData) => {
    if (editingMed) {
      await api.updateMedication(editingMed.id, formData);
      setToast({ message: 'Medication updated successfully', type: 'success' });
    } else {
      await api.createMedication(formData);
      setToast({ message: 'Medication created successfully', type: 'success' });
    }
    fetchMedications();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.deleteMedication(id);
      setToast({ message: `${name} deleted`, type: 'info' });
      fetchMedications();
    } catch (err) {
      setToast({ message: 'Failed to delete: ' + err.message, type: 'error' });
    }
  };

  const filteredMeds = medications.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.chemical_name && m.chemical_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            Medication Inventory & Depletion
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tracks current units, rolling 7-day burn rates, and forecasts runout dates (Module 4 Engine).
          </p>
        </div>

        <button
          onClick={() => {
            setEditingMed(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Medication
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter medications by brand or chemical name..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Medication Cards / Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      ) : filteredMeds.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Pill className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No medications found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchTerm ? 'Try a different search term.' : 'Click "Add Medication" above to register your inventory.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeds.map((med) => {
            const isCritical = med.stock_level <= 0;
            const isLow = med.stock_level <= med.reorder_threshold;
            const statusKey = isCritical ? 'CRITICAL' : isLow ? 'WARNING' : 'HEALTHY';

            return (
              <div
                key={med.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {med.name}
                      </h3>
                      {med.chemical_name && (
                        <p className="text-xs text-slate-500 italic mt-0.5">
                          {med.chemical_name}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={statusKey} />
                  </div>

                  {/* Stock Metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Current Stock</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                        {med.stock_level} {med.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Reorder Point</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
                        {med.reorder_threshold} {med.unit}
                      </span>
                    </div>
                    {med.burn_rate !== undefined && (
                      <div className="col-span-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
                          7-day burn rate:
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {med.burn_rate} {med.unit}/day
                        </span>
                      </div>
                    )}
                    {med.days_remaining !== undefined && (
                      <div className="col-span-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Est. Days Left:
                        </span>
                        <span
                          className={`font-bold ${
                            med.days_remaining <= 5
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {med.days_remaining !== null ? `${med.days_remaining} days` : 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setEditingMed(med);
                      setModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Medication"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(med.id, med.name)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    title="Delete Medication"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Medication Add/Edit Modal */}
      <MedicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        medication={editingMed}
      />
    </div>
  );
}
