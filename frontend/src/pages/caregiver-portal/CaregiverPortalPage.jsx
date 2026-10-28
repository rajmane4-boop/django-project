import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Phone,
  Pill,
  Check,
  X,
  Stethoscope,
  TrendingUp,
  BarChart2,
  Activity,
} from 'lucide-react';
import { api } from '../../api/client';
import StatusBadge from '../../components/ui/StatusBadge';
import Toast from '../../components/ui/Toast';

export default function CaregiverPortalPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchPortal = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.getCaregiverPortal();
      setData(res);
    } catch (err) {
      setToast({ message: 'Error loading caregiver portal: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortal();
    // Auto refresh every 30 seconds for live monitoring
    const interval = setInterval(() => fetchPortal(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (doseId, action) => {
    setActionLoading(doseId);
    try {
      const res = await api.caregiverPortalAction(doseId, action);
      setToast({ message: res.message || 'Action recorded successfully', type: 'success' });
      await fetchPortal(true);
    } catch (err) {
      setToast({ message: 'Action failed: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
        <p className="text-sm text-slate-500 font-medium">Connecting to Caregiver Live Watchdog...</p>
      </div>
    );
  }

  const caregiver = data?.caregiver;
  const urgentAlerts = data?.urgent_alerts || [];
  const patients = data?.patients || [];
  const allDoses = data?.doses || [];

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Caregiver Live Portal
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                Live Watchdog
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Multi-patient safety monitor & frictionless escalation oversight (Phase 3 Engine).
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchPortal(true)}
          disabled={refreshing}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all shadow-xs"
        >
          <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Live Refresh'}
        </button>
      </div>

      {/* Urgent Watchdog Alerts */}
      {urgentAlerts.length > 0 ? (
        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 space-y-3">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 animate-bounce" />
            <h3 className="font-bold text-base">
              {urgentAlerts.length} Urgent Dose Escalation{urgentAlerts.length > 1 ? 's' : ''} Require Attention!
            </h3>
          </div>
          <p className="text-xs text-rose-700 dark:text-rose-300">
            Patients have breached adherence timeout thresholds (30-min Tier 1 / 60-min Tier 2). Please intervene or verify patient status.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {urgentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-rose-200 dark:border-rose-900/60 shadow-xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500">Patient:</span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {alert.patient_name}
                      </h4>
                    </div>
                    <StatusBadge
                      status={alert.tier2_escalated ? 'TIER_2' : 'TIER_1'}
                      text={alert.tier2_escalated ? 'Tier 2 (60m Critical)' : 'Tier 1 (30m Alert)'}
                    />
                  </div>

                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p>
                      <strong>Medication:</strong> {alert.medication_name} ({alert.dosage_units} unit)
                    </p>
                    <p className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      Scheduled: {alert.scheduled_time_formatted || alert.scheduled_time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    disabled={actionLoading === alert.id}
                    onClick={() => handleAction(alert.id, 'TAKE')}
                    className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Assisted & Taken
                  </button>
                  <button
                    disabled={actionLoading === alert.id}
                    onClick={() => handleAction(alert.id, 'FALSE_ALARM')}
                    className="py-1.5 px-2.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
                  >
                    False Alarm
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
            All clear: No active overdue dose escalations detected across monitored patients.
          </p>
        </div>
      )}

      {/* Visual Analytics & Adherence Comparison */}
      {patients.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Patient Cohort Adherence Analytics
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time compliance benchmark across all monitored patients
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> High (&ge;80%)
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Moderate (50-79%)
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> At Risk (&lt;50%)
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Monitored</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{patients.length}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Optimal (&ge;80%)</span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                {patients.filter((p) => (p.adherence_rate || 0) >= 80).length}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Needs Followup (&lt;80%)</span>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-0.5">
                {patients.filter((p) => (p.adherence_rate || 0) < 80).length}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300">Active Escalations</span>
              <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-0.5">{urgentAlerts.length}</p>
            </div>
          </div>

          {/* Comparative Horizontal Bar Chart */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Patient Compliance Visual Comparison
            </h3>
            <div className="space-y-2.5">
              {patients.map((pat) => {
                const rate = pat.adherence_rate || 0;
                const barColor = rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-rose-500';
                return (
                  <div key={'chart-' + pat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{pat.name}</span>
                      <span className="font-mono font-bold text-slate-600 dark:text-slate-400">{rate}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(rate, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Monitored Patients Roster */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Assigned Patients Roster
        </h2>

        {patients.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            No patients currently assigned to this caregiver account.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((pat) => (
              <div
                key={pat.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 flex items-center justify-center font-bold">
                      {pat.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {pat.name}
                      </h3>
                      <p className="text-xs text-slate-500">{pat.timezone}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {pat.adherence_rate}% Adherence
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Today</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{pat.today_total}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Taken</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{pat.today_taken}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Missed</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{pat.today_missed}</span>
                  </div>
                </div>

                {/* Visual Today Intake Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Today Intake Progress</span>
                    <span>
                      {pat.today_total > 0 ? Math.round((pat.today_taken / pat.today_total) * 100) : 100}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${pat.today_total > 0 ? Math.min(Math.round((pat.today_taken / pat.today_total) * 100), 100) : 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  {pat.primary_physician && (
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                      <span>{pat.primary_physician}</span>
                    </div>
                  )}
                  {pat.emergency_phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{pat.emergency_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monitored Doses Table / Feed */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Recent Patient Dose Events
        </h2>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Medication</th>
                  <th className="px-4 py-3">Scheduled Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Caregiver Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allDoses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                      No dose events recorded for monitored patients.
                    </td>
                  </tr>
                ) : (
                  allDoses.map((dose) => (
                    <tr key={dose.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        {dose.patient_name}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {dose.medication_name}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                        {dose.scheduled_time_formatted || dose.scheduled_time}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={dose.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {dose.status !== 'TAKEN' && dose.status !== 'TAKEN_LATE' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              disabled={actionLoading === dose.id}
                              onClick={() => handleAction(dose.id, 'TAKE')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] transition-colors"
                            >
                              Assist
                            </button>
                            <button
                              disabled={actionLoading === dose.id}
                              onClick={() => handleAction(dose.id, 'SKIP')}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[11px] transition-colors"
                            >
                              Skip
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Resolved
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
