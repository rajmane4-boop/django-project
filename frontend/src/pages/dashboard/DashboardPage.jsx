import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Pill,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import DoseCard from '../../components/dashboard/DoseCard';
import AdherenceGauge from '../../components/dashboard/AdherenceGauge';
import Toast from '../../components/ui/Toast';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const loadDashboard = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      setToast({ message: 'Error loading dashboard: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleTakeDose = async (doseId) => {
    try {
      const result = await api.takeDose(doseId);
      setToast({
        message: result.message || 'Dose recorded successfully! Stock decremented atomically.',
        type: 'success',
      });
      // Refresh dashboard state
      loadDashboard(true);
    } catch (err) {
      setToast({ message: err.message || 'Failed to record dose', type: 'error' });
    }
  };

  const handleSkipDose = async (doseId) => {
    try {
      const result = await api.skipDose(doseId);
      setToast({ message: 'Dose marked as skipped.', type: 'info' });
      loadDashboard(true);
    } catch (err) {
      setToast({ message: err.message || 'Failed to skip dose', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
        <p className="text-sm text-slate-500 font-medium">Syncing clinical schedule...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const doses = data?.doses || [];
  const lowStock = data?.lowStockMeds || [];

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Today's Intake Schedule
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time state machine tracking with atomic stock depletion and dual-tier caregiver watchdog.
          </p>
        </div>

        <button
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all shadow-xs"
        >
          <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Low Stock Alerts (Module 4) */}
      {lowStock.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Inventory Depletion Warning ({lowStock.length} medication{lowStock.length > 1 ? 's' : ''} low)
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  The following medications have breached clinical reorder thresholds based on rolling burn rates:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {lowStock.map((m) => (
                    <span
                      key={m.id}
                      className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-medium"
                    >
                      {m.name}: <strong className="font-bold">{m.stock} {m.unit}</strong> left (burn: {m.burnRate}/day)
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to="/reports/requisition"
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
            >
              Requisition Manifest
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Telemetry Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Adherence Gauge Card */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center">
          <AdherenceGauge rate={stats.adherence_rate || 0} size={130} />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">
            30-Day Rolling Score
          </p>
        </div>

        {/* Metric 1: Scheduled Today */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Today
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.total_today || doses.length}
            </div>
            <div className="text-xs text-slate-400 mt-1">Doses scheduled</div>
          </div>
        </div>

        {/* Metric 2: Taken Today */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Taken
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.taken_today || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">Confirmed intakes</div>
          </div>
        </div>

        {/* Metric 3: Missed / Escalated */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Missed / Escalated
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {stats.missed_today || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">Caregiver triggers</div>
          </div>
        </div>

      </div>

      {/* Dose Events Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Prescription Schedule Timeline
          </h2>
          <span className="text-xs text-slate-500">
            {doses.length} dose event{doses.length === 1 ? '' : 's'} registered
          </span>
        </div>

        {doses.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Pill className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No Doses Scheduled Today
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You don't have any pending medication intakes for today. Check your prescription regimens or add a new one.
            </p>
            <Link
              to="/regimens"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs"
            >
              Manage Regimens
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {doses.map((dose) => (
              <DoseCard
                key={dose.id}
                dose={dose}
                onTake={handleTakeDose}
                onSkip={handleSkipDose}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
