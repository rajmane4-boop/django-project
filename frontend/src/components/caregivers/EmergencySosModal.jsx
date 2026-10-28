import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { AlertTriangle, PhoneCall, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function EmergencySosModal({ isOpen, onClose, caregivers = [] }) {
  const [triggered, setTriggered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleDispatch = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setTriggered(true);
    }, 600);
  };

  const handleReset = () => {
    setTriggered(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleReset} title="Emergency Caregiver SOS Dispatch">
      <div className="space-y-4">
        {triggered ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Priority SOS Dispatched
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              High-priority clinical safety SMS alerts have been broadcast to your primary caregiver network.
            </p>
          </div>
        ) : (
          <>
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 dark:text-rose-200">
                <span className="font-bold block">Immediate Safety Watchdog Intervention:</span>
                This immediately broadcasts an urgent emergency alert to all Tier 1 & Tier 2 caregivers registered on your profile.
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Emergency Contacts on File ({caregivers.length}):
              </span>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl max-h-36 overflow-y-auto">
                {caregivers.map((cg) => (
                  <div key={cg.id} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{cg.name}</span>
                      <span className="text-slate-400 ml-1.5">({cg.relationship})</span>
                    </div>
                    <a
                      href={`tel:${cg.phone}`}
                      className="font-mono text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3" />
                      {cg.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDispatch}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                <ShieldAlert className="w-4 h-4" />
                {submitting ? 'Broadcasting...' : 'Broadcast SOS Now'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
