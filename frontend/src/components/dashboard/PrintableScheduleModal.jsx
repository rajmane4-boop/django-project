import React from 'react';
import Modal from '../ui/Modal';
import { Printer, Calendar } from 'lucide-react';

export default function PrintableScheduleModal({ isOpen, onClose, doses = [], patientName }) {
  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Daily Patient Schedule Slip" maxWidth="max-w-xl">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 print:hidden">
          Pocket schedule slip formatted for printing or bedside refrigerator placement:
        </p>

        {/* Printable Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs font-sans">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
                Smart MedTrack · Daily Schedule Slip
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{todayStr}</div>
            </div>
            {patientName && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Patient</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{patientName}</span>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            {doses.map((d, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border-2 border-slate-400 shrink-0 flex items-center justify-center font-bold text-xs">
                    {d.status === 'TAKEN' ? '✓' : ''}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {d.medication_name}
                    </span>
                    <span className="text-slate-500 ml-2">({d.dosage_units} unit)</span>
                    {d.instructions && (
                      <div className="text-[11px] text-slate-400 italic mt-0.5">
                        {d.instructions}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {d.scheduled_time_formatted || d.scheduled_time}
                  </div>
                  {d.anchor_description && (
                    <div className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                      {d.anchor_description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center">
            Physiological Routine Anchored · Emergency Escalation Active
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Print Slip
          </button>
        </div>
      </div>
    </Modal>
  );
}
