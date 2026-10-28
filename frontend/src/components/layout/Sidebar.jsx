import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Pill,
  CalendarClock,
  Users,
  ShieldAlert,
  FileText,
  ShoppingBag,
  Clock,
  HeartPulse,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Intake Dashboard', icon: LayoutDashboard },
  { to: '/medications', label: 'Medications', icon: Pill },
  { to: '/regimens', label: 'Prescription Regimens', icon: CalendarClock },
  { to: '/caregivers', label: 'Caregivers', icon: Users },
  { to: '/caregiver/portal', label: 'Caregiver Live Portal', icon: ShieldAlert, badge: 'Live' },
  { to: '/reports/adherence', label: 'Adherence Report', icon: FileText },
  { to: '/reports/requisition', label: 'Refill Requisition', icon: ShoppingBag },
  { to: '/profile', label: 'Daily Routine Anchors', icon: Clock },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white leading-tight">
              Smart MedTrack
            </div>
            <div className="text-xs text-brand-600 dark:text-brand-400 font-medium">
              Clinical Adherence System
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Engine: Django 5 + React 19
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Phase 1-4 Complete · Production Ready
          </div>
        </div>
      </aside>
    </>
  );
}
