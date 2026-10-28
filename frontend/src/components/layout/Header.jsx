import React from 'react';
import { Menu, LogOut, User, ShieldCheck, Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { isOnline, wasOffline } = useOnlineStatus();
  const { theme, toggleTheme } = useTheme();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      {/* Left: Mobile hamburger & Date */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
          <span className="hidden sm:inline">Clinical Portal — </span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">{formattedDate}</span>
        </div>
      </div>

      {/* Right: Network Status, User info & Logout */}
      <div className="flex items-center gap-3">
        {/* Network Connectivity Pill */}
        {!isOnline ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-semibold animate-pulse">
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        ) : wasOffline ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold">
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Online</span>
          </div>
        ) : null}

        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pl-3 py-1 pr-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-xs uppercase">
                {user.username.slice(0, 2)}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {user.fullName || user.username}
                </div>
                <div className="text-[10px] text-slate-400 leading-none">
                  {user.isCaregiver ? 'Caregiver Persona' : 'Patient Persona'}
                </div>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-sm text-slate-400">Not signed in</div>
        )}
      </div>
    </header>
  );
}
