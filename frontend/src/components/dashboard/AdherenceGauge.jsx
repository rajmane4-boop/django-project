import React from 'react';

export default function AdherenceGauge({ rate = 0, size = 160, strokeWidth = 14 }) {
  const normalizedRate = Math.min(Math.max(Math.round(rate), 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedRate / 100) * circumference;

  const getColor = (val) => {
    if (val >= 85) return 'text-emerald-500 stroke-emerald-500';
    if (val >= 70) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-100 dark:stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`transition-all duration-700 ease-out ${getColor(normalizedRate)}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {/* Centered Content */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
          {normalizedRate}%
        </span>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
          Adherence
        </span>
      </div>
    </div>
  );
}
