import React, { useState, useEffect } from 'react';
import { ShoppingBag, Printer, AlertTriangle, CheckCircle2, Building2, Calendar, FileCheck } from 'lucide-react';
import { api } from '../../api/client';
import Toast from '../../components/ui/Toast';

export default function RequisitionManifestPage() {
  const [manifest, setManifest] = useState(null);
  const [includeAll, setIncludeAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchManifest = async (all = includeAll) => {
    try {
      setLoading(true);
      const data = await api.getRequisitionManifest(30, all);
      setManifest(data);
    } catch (err) {
      setToast({ message: 'Failed to load requisition manifest: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManifest(includeAll);
  }, [includeAll]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
        <p className="text-sm text-slate-500 font-medium">Generating Refill Requisition Manifest...</p>
      </div>
    );
  }

  const patient = manifest?.patient || {};
  const items = manifest?.items || [];
  const lowCount = manifest?.low_stock_count || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Screen Controls */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Pharmacy Refill Requisition Manifest
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Purchase order document for pharmacy drop-off or automated replenishment (Phase 4 Engine).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAll}
              onChange={(e) => setIncludeAll(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            Include All Medications
          </label>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Purchase Order
          </button>
        </div>
      </div>

      {/* Manifest Printable Sheet */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm print:p-0 print:border-none print:shadow-none space-y-8">
        
        {/* Manifest Header */}
        <div className="flex items-start justify-between pb-6 border-b-2 border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Pharmacy Refill Requisition Manifest
            </div>
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mt-0.5">
              Official Prescription Replenishment Order
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Generated: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-left">
              <div><strong>Manifest PO #:</strong> REQ-{Date.now().toString().slice(-6)}</div>
              <div><strong>Lead-Time Buffer:</strong> 14 Days</div>
              <div><strong>Reorder Cycle:</strong> 30 Days</div>
            </div>
          </div>
        </div>

        {/* Patient Block */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Patient Name</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {patient.name}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Emergency Contact</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">
              {patient.emergency_phone || 'None'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Prescribing Physician</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {patient.primary_physician || 'Attending Physician'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Depleted Items</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {lowCount} Flagged
            </span>
          </div>
        </div>

        {/* Requisition Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Required Prescription Inventory Replenishment
          </h3>

          {items.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              All medication inventories are currently healthy and above the reorder threshold. Check "Include All Medications" above to view full inventory.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3">Medication & Formulation</th>
                    <th className="px-4 py-3">Current Stock</th>
                    <th className="px-4 py-3">Daily Burn</th>
                    <th className="px-4 py-3">Days Left</th>
                    <th className="px-4 py-3">Replenishment Qty</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </div>
                        {item.chemical_name && (
                          <div className="text-[11px] text-slate-400 italic">
                            {item.chemical_name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {item.current_stock} {item.unit}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                        {item.burn_rate}/day
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-bold ${
                            item.days_remaining <= 5
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {item.days_remaining !== null ? `${item.days_remaining} d` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-extrabold text-sm text-brand-600 dark:text-brand-400">
                          {item.replenishment_units || item.suggested_reorder || 30} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.is_low
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                          }`}
                        >
                          {item.is_low ? 'REORDER' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pharmacy Fulfillment & Dispenser Sign-Off */}
        <div className="pt-8 border-t-2 border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-xs">
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              Dispensing Pharmacy Verification
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              This order manifest is formulated from the Smart MedTrack clinical burn-rate engine, ensuring uninterrupted pharmacotherapy with a 14-day supply cushion.
            </p>
            <div className="mt-4 p-3 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-[10px]">
              Official Pharmacy Stamp & Date
            </div>
          </div>

          <div className="text-right space-y-4">
            <div className="h-12 border-b border-dashed border-slate-400 inline-block w-48" />
            <div className="text-[11px] text-slate-500">
              Registered Pharmacist Signature
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
