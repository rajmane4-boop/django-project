import React, { useState } from 'react';
import { Check, X, Clock, Pill, AlertTriangle, ShieldAlert } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

export default function DoseCard({ dose, onTake, onSkip }) {
  const [processing, setProcessing] = useState(false);

  const isCompleted = dose.status === 'TAKEN' || dose.status === 'TAKEN_LATE';
  const isSkipped = dose.status === 'SKIPPED';
  const isMissed = dose.status === 'MISSED';
  const canAct = !isCompleted && !isSkipped;

  const handleTake = async () => {
    if (processing || !canAct) return;
    setProcessing(true);
    try {
      await onTake(dose.id);
    } finally {
      setProcessing(false);
    }
  };

  const handleSkip = async () => {
    if (processing || !canAct) return;
    setProcessing(true);
    try {
      await onSkip(dose.id);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${
        isCompleted
          ? 'bg-emerald-50/40 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-900/40'
          : isMissed
          ? 'bg-rose-50/40 border-rose-200/80 dark:bg-rose-950/20 dark:border-rose-900/40'
          : isSkipped
          ? 'bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800 opacity-75'
          : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:shadow-md'
      }`}
    >
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: Medication Info & Scheduled Timing */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                  : isMissed
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                  : 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400'
              }`}
            >
              <Pill className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {dose.medication_name}
                </h3>
                <StatusBadge status={dose.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {dose.dosage_units} unit(s)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {dose.scheduled_time_formatted || dose.scheduled_time}
                </span>
                {dose.anchor_description && (
                  <>
                    <span>•</span>
                    <span className="text-brand-600 dark:text-brand-400 font-medium">
                      {dose.anchor_description}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Special Instructions or Taken Timestamp */}
          {dose.instructions && (
            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg inline-block">
              <span className="font-semibold">Instructions:</span> {dose.instructions}
            </p>
          )}

          {dose.taken_at && (
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Recorded intake at {new Date(dose.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          {dose.tier2_escalated && (
            <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-4 h-4" />
              Tier 2 Caregiver Escalated (Critical Watchdog)
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {canAct ? (
            <>
              <button
                type="button"
                disabled={processing}
                onClick={handleSkip}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
              >
                Skip
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={handleTake}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {processing ? 'Processing...' : 'Take Dose'}
              </button>
            </>
          ) : (
            <div className="text-xs font-semibold text-slate-400 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
              {isCompleted ? 'Intake Logged' : 'Skipped'}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
