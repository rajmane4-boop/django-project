import React, { useState, useEffect } from 'react';
import { Clock, Save, Shield, UserCheck, Stethoscope, Phone, Globe, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import Toast from '../../components/ui/Toast';

export default function ProfileSetupPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getProfile();
      setProfile(data);
    } catch (err) {
      setToast({ message: 'Failed to load profile: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateProfile(profile);
      setProfile(updated);
      setToast({ message: 'Profile & Routine Anchors updated successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to update routine: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Patient Profile & Routine Anchors
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Smart MedTrack anchors your medication schedules to physiological events (meals and sleep) rather than rigid arbitrary clock hours.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Module 1: Biological Anchor Schedule */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Daily Biological Routine (Module 1 Engine)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All prescribed regimen times with anchor offsets (±60m) are computed dynamically from these times.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                🍳 Breakfast Time
              </label>
              <input
                type="time"
                value={profile?.routine?.breakfast_time || '08:00'}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    routine: { ...profile.routine, breakfast_time: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                🥗 Lunch Time
              </label>
              <input
                type="time"
                value={profile?.routine?.lunch_time || '13:00'}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    routine: { ...profile.routine, lunch_time: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                🍲 Dinner Time
              </label>
              <input
                type="time"
                value={profile?.routine?.dinner_time || '19:30'}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    routine: { ...profile.routine, dinner_time: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                🌙 Bedtime
              </label>
              <input
                type="time"
                value={profile?.routine?.bedtime || '22:00'}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    routine: { ...profile.routine, bedtime: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Clinical Profile Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Clinical Details & Timezone Alignment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Used in clinical adherence reports and automated SMS/Email escalations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Attending Physician
              </label>
              <input
                type="text"
                value={profile?.primary_physician || ''}
                onChange={(e) =>
                  setProfile({ ...profile, primary_physician: e.target.value })
                }
                placeholder="Dr. Anjali Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                value={profile?.emergency_phone || ''}
                onChange={(e) =>
                  setProfile({ ...profile, emergency_phone: e.target.value })
                }
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Timezone (IANA Aware)
              </label>
              <select
                value={profile?.timezone || 'Asia/Kolkata'}
                onChange={(e) =>
                  setProfile({ ...profile, timezone: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                <option value="America/New_York">America/New_York (EST -05:00)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST -08:00)</option>
                <option value="America/Chicago">America/Chicago (CST -06:00)</option>
                <option value="Europe/London">Europe/London (GMT/BST +01:00)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-600/30 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving changes...' : 'Save Routine Anchors'}
          </button>
        </div>
      </form>
    </div>
  );
}
