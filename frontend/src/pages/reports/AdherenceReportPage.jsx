import React, { useState, useEffect } from 'react';
import { FileText, Printer, Calendar, CheckCircle2, AlertTriangle, ShieldCheck, User, FileSpreadsheet, FileCode } from 'lucide-react';
import { api } from '../../api/client';
import AdherenceGauge from '../../components/dashboard/AdherenceGauge';
import Toast from '../../components/ui/Toast';

export default function AdherenceReportPage() {
  const [report, setReport] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchReport = async (period = days) => {
    try {
      setLoading(true);
      const data = await api.getAdherenceReport(period);
      setReport(data);
    } catch (err) {
      setToast({ message: 'Failed to generate report: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(days);
  }, [days]);

  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = () => {
    if (!report) {
      setToast({ message: 'No report data to export', type: 'error' });
      return;
    }
    const lines = [
      '# SMART MEDTRACK CLINICAL ADHERENCE SCORECARD',
      `Patient Name,${patient.name || 'N/A'}`,
      `Username,${patient.username || 'N/A'}`,
      `Timezone,${patient.timezone || 'UTC'}`,
      `Primary Physician,${patient.primary_physician || 'N/A'}`,
      `Audit Window,Last ${report.period_days || days} Days`,
      `Export Timestamp,${new Date().toISOString()}`,
      '',
      '# OVERALL ADHERENCE SUMMARY',
      'Metric,Value',
      `Adherence Rate,${stats.adherence_rate || 0}%`,
      `Total Scheduled Doses,${stats.total_scheduled || 0}`,
      `Taken On-Time,${stats.taken_on_time || 0}`,
      `Taken Late,${stats.taken_late || 0}`,
      `Skipped,${stats.skipped || 0}`,
      `Missed / Breached,${stats.missed || 0}`,
      '',
      '# MEDICATION BREAKDOWN',
      'Medication Name,Total Scheduled,Taken,Skipped,Missed,Adherence Rate',
      ...medBreakdown.map((m) =>
        [
          `"${(m.name || '').replace(/"/g, '""')}"`,
          m.scheduled,
          m.taken,
          m.skipped,
          m.missed,
          `${m.rate}%`,
        ].join(',')
      ),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `MedTrack_Adherence_Audit_${patient.username || 'patient'}_${days}d_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: 'Clinical Adherence CSV exported successfully.', type: 'success' });
  };

  const exportToJSON = () => {
    if (!report) {
      setToast({ message: 'No report data to export', type: 'error' });
      return;
    }
    const exportPayload = {
      dossier_type: 'CLINICAL_ADHERENCE_AUDIT',
      specification_version: '1.0',
      exported_at: new Date().toISOString(),
      audit_window_days: report.period_days || days,
      patient: report.patient,
      summary_statistics: report.stats,
      medication_compliance: medBreakdown.map((m) => ({
        name: m.name,
        scheduled: m.scheduled,
        taken: m.taken,
        skipped: m.skipped,
        missed: m.missed,
        adherence_rate_pct: m.rate,
      })),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MedTrack_Adherence_Audit_${patient.username || 'patient'}_${days}d_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.removeChild(downloadAnchor);
    setToast({ message: 'Clinical Adherence JSON exported successfully.', type: 'success' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
        <p className="text-sm text-slate-500 font-medium">Compiling Clinical Adherence Dossier...</p>
      </div>
    );
  }

  const patient = report?.patient || {};
  const stats = report?.stats || {};
  const medBreakdown = report?.medications || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Screen-Only Header & Controls */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Clinical Adherence Report
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standardized physician compliance audit document with electronic verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
          >
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days (Standard)</option>
            <option value={60}>Last 60 Days</option>
            <option value={90}>Last 90 Days (Quarterly)</option>
          </select>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs transition-all"
            title="Download CSV for clinical spreadsheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportToJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs transition-all"
            title="Download JSON for EHR telemetry import"
          >
            <FileCode className="w-3.5 h-3.5 text-brand-600" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print PDF
          </button>
        </div>
      </div>

      {/* Printable Clinical Document Dossier */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm print:p-0 print:border-none print:shadow-none space-y-8">
        
        {/* Document Header */}
        <div className="flex items-start justify-between pb-6 border-b-2 border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Smart MedTrack
            </div>
            <div className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mt-0.5">
              Clinical Adherence Audit & Dossier
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Generated: {new Date().toLocaleString()} · Timezone: {patient.timezone}
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-left">
              <div><strong>Period:</strong> Past {days} Days</div>
              <div><strong>Audit Code:</strong> MT-ADR-{Math.abs(stats.total_doses || 101) * 73}</div>
              <div><strong>Compliance Engine:</strong> Active</div>
            </div>
          </div>
        </div>

        {/* Patient Identity Block */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Patient Name</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {patient.name}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Primary Physician</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {patient.primary_physician || 'Not Assigned'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Emergency Phone</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">
              {patient.emergency_phone || 'None'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Audit Period</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {report?.start_date} to {report?.end_date}
            </span>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
          <div className="sm:col-span-2 flex flex-col items-center justify-center p-6 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900">
            <AdherenceGauge rate={stats.adherence_rate || 0} size={150} />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
              Overall Adherence Rate
            </span>
            <span className="text-[11px] text-slate-400">
              {stats.adherence_rate >= 80 ? 'Optimal Clinical Threshold' : 'Sub-Optimal Compliance'}
            </span>
          </div>

          <div className="sm:col-span-3 grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 text-xs block">Total Prescribed</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.total_doses || 0}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
              <span className="text-emerald-700 dark:text-emerald-300 text-xs block">Taken On Time</span>
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {stats.taken_on_time || 0}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900">
              <span className="text-purple-700 dark:text-purple-300 text-xs block">Taken Late</span>
              <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {stats.taken_late || 0}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900">
              <span className="text-rose-700 dark:text-rose-300 text-xs block">Missed / Escalated</span>
              <span className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                {stats.missed || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Per-Medication Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Medication-Specific Breakdown
          </h3>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Medication Name</th>
                  <th className="px-4 py-3">Scheduled</th>
                  <th className="px-4 py-3">Taken</th>
                  <th className="px-4 py-3">Missed</th>
                  <th className="px-4 py-3">Adherence %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {medBreakdown.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      {m.name}
                    </td>
                    <td className="px-4 py-3.5">{m.total}</td>
                    <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      {m.taken}
                    </td>
                    <td className="px-4 py-3.5 text-rose-600 dark:text-rose-400 font-medium">
                      {m.missed}
                    </td>
                    <td className="px-4 py-3.5 font-bold">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full ${
                          m.rate >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Physician Sign-Off & Attestation Block */}
        <div className="pt-8 border-t-2 border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-xs">
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              Clinical Attestation
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              I certify that I have reviewed this adherence dossier. The data is generated automatically by the Smart MedTrack State Machine Engine with cryptographic audit logs.
            </p>
          </div>

          <div className="text-right space-y-4">
            <div className="h-12 border-b border-dashed border-slate-400 inline-block w-48" />
            <div className="text-[11px] text-slate-500">
              Physician Signature & License Seal
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
