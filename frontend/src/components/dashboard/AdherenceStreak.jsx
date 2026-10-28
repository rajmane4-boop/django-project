import React from 'react';
import { Flame, Award, HeartHandshake } from 'lucide-react';

export default function AdherenceStreak({ rate = 0, totalTaken = 0 }) {
  // Compute approximate streak days based on taken doses and adherence rate
  const estimatedStreak = rate >= 90 ? Math.min(Math.max(Math.floor(totalTaken / 2), 5), 14) : rate >= 75 ? 3 : 1;
  const isHighStreak = estimatedStreak >= 5;

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isHighStreak
        ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-orange-200 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-orange-800'
        : 'bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200 dark:from-teal-950/30 dark:to-emerald-950/30 dark:border-teal-800'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
            isHighStreak
              ? 'bg-orange-500 text-white animate-pulse'
              : 'bg-teal-500 text-white'
          }`}>
            {isHighStreak ? <Flame className="w-6 h-6" /> : <Award className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Clinical Streak
              </span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-white/80 dark:bg-slate-900/80 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                {estimatedStreak} Days Active
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
              {rate >= 85
                ? 'Outstanding Adherence! Keep up the physiological timing.'
                : 'Steady Progress: Stay aligned with your meal anchors.'}
            </h4>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <HeartHandshake className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Caregiver Watchdog Active</span>
        </div>
      </div>
    </div>
  );
}
