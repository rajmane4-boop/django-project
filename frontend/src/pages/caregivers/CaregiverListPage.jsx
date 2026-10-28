import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Phone, Mail, ShieldAlert } from 'lucide-react';
import { api } from '../../api/client';
import CaregiverModal from './CaregiverModal';
import EmergencySosModal from '../../components/caregivers/EmergencySosModal';
import StatusBadge from '../../components/ui/StatusBadge';
import Toast from '../../components/ui/Toast';

export default function CaregiverListPage() {
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCaregiver, setEditingCaregiver] = useState(null);
  const [toast, setToast] = useState(null);
  const [sosOpen, setSosOpen] = useState(false);

  const fetchCaregivers = async () => {
    try {
      setLoading(true);
      const data = await api.getCaregivers();
      const list = Array.isArray(data) ? data : (data?.caregivers || []);
      setCaregivers(list);
    } catch (err) {
      setToast({ message: 'Failed to load caregivers: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaregivers();
  }, []);

  const handleSave = async (formData) => {
    if (editingCaregiver) {
      await api.updateCaregiver(editingCaregiver.id, formData);
      setToast({ message: 'Caregiver contact updated', type: 'success' });
    } else {
      await api.createCaregiver(formData);
      setToast({ message: 'Caregiver contact added', type: 'success' });
    }
    fetchCaregivers();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete caregiver contact ${name}?`)) return;
    try {
      await api.deleteCaregiver(id);
      setToast({ message: 'Caregiver deleted', type: 'info' });
      fetchCaregivers();
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
            Caregiver Escalation Contacts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dual-tier escalation hierarchy: Tier 1 alerts after 30 mins; Tier 2 alerts after 60 mins (Module 3 Engine).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {caregivers.length > 0 && (
            <button
              onClick={() => setSosOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all shadow-xs"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
              Emergency SOS
            </button>
          )}

          <button
            onClick={() => {
              setEditingCaregiver(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Caregiver
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      ) : caregivers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Users className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No caregiver contacts registered
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Add at least one Tier 1 caregiver so the automated watchdog can dispatch SMS/Email alerts when a dose is missed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {caregivers.map((cg) => {
            const isTier1 = cg.tier === 1;
            return (
              <div
                key={cg.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {cg.name}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {cg.relationship || 'Caregiver'}
                      </span>
                    </div>
                    <StatusBadge
                      status={isTier1 ? 'TIER_1' : 'TIER_2'}
                      text={isTier1 ? 'Tier 1 (+30m)' : 'Tier 2 (+60m)'}
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{cg.phone}</span>
                    </div>
                    {cg.email && (
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cg.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setEditingCaregiver(cg);
                      setModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Caregiver"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cg.id, cg.name)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    title="Delete Caregiver"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Caregiver Modal */}
      <CaregiverModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        caregiver={editingCaregiver}
      />

      {/* Emergency SOS Modal */}
      <EmergencySosModal
        isOpen={sosOpen}
        onClose={() => setSosOpen(false)}
        caregivers={caregivers}
      />
    </div>
  );
}
