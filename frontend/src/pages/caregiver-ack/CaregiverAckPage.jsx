import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Clock,
  Pill,
  User,
  HeartPulse,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../api/client';
import StatusBadge from '../../components/ui/StatusBadge';

export default function CaregiverAckPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAckDetails() {
      try {
        setLoading(true);
        const res = await api.getCaregiverAck(token);
        setData(res);
      } catch (err) {
        setError(err.message || 'Invalid or expired caregiver verification link.');
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      loadAckDetails();
    }
  }, [token]);

  const handleAction = async (action) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.submitCaregiverAck(token, action);
      setSubmittedResult(res);
    } catch (err) {
      setError(err.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Verifying Caregiver Security Token...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-md">
        
        {/* Brand Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Smart MedTrack
              </div>
              <div className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold">
                Frictionless Caregiver Verification
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            Secure Link
          </span>
        </div>

        {/* Error State */}
        {error && (
          <div className="my-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Link Error or Expired</div>
              <div className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">{error}</div>
            </div>
          </div>
        )}

        {/* Success Confirmation State */}
        {submittedResult ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Acknowledgment Received!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {submittedResult.message || 'Thank you. The patient dose status has been updated and the escalation alert cleared.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 inline-block text-left w-full space-y-1">
              <div><strong>Status:</strong> {submittedResult.status}</div>
              <div><strong>Timestamp:</strong> {new Date().toLocaleTimeString()}</div>
            </div>

            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Go to Portal Home
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : data ? (
          /* Intake Details Card & Action Buttons */
          <div className="py-4 space-y-5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Escalation Target
                </span>
                <StatusBadge
                  status={data.tier === 2 ? 'TIER_2' : 'TIER_1'}
                  text={data.tier === 2 ? 'Tier 2 (60m Critical)' : 'Tier 1 (30m Alert)'}
                />
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Patient Name</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {data.patient_name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Medication</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {data.medication_name} ({data.dosage_units} unit)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Scheduled Time</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {data.scheduled_time}
                  </span>
                </div>
              </div>

              {data.caregiver_name && (
                <div className="text-[11px] text-slate-500">
                  Caregiver Contact: <strong>{data.caregiver_name}</strong>
                </div>
              )}
            </div>

            {data.already_handled ? (
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 text-teal-800 text-xs font-medium text-center">
                This dose was already marked as <strong>{data.current_status}</strong>. No further action needed.
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Select Caregiver Action:
                </div>

                <button
                  onClick={() => handleAction('TAKE')}
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {submitting ? 'Submitting...' : 'Dose Assisted & Taken'}
                </button>

                <button
                  onClick={() => handleAction('FALSE_ALARM')}
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800 font-semibold text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  False Alarm (Patient Already Took It)
                </button>

                <button
                  onClick={() => handleAction('SKIP')}
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs transition-colors disabled:opacity-50 text-center"
                >
                  Mark Dose as Skipped
                </button>
              </div>
            )}
          </div>
        ) : null}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
          Smart MedTrack Automated Patient Safety Watchdog · Phase 3
        </div>
      </div>
    </div>
  );
}
