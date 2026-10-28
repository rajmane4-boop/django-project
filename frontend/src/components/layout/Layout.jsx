import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useTheme } from '../../context/ThemeContext';
import KeyboardShortcutsModal from '../ui/KeyboardShortcutsModal';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { isOnline } = useOnlineStatus();
  const { toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger hotkeys if user is typing inside an input/textarea/select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      } else if (e.key === 'd') {
        navigate('/');
      } else if (e.key === 'm') {
        navigate('/medications');
      } else if (e.key === 'r') {
        navigate('/regimens');
      } else if (e.key === 'c') {
        navigate('/caregivers');
      } else if (e.key === 'p') {
        navigate('/caregiver/portal');
      } else if (e.key === 't') {
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toggleTheme]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Global Offline Persistent Banner */}
      {!isOnline && (
        <div className="bg-rose-600 text-white text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <WifiOff className="w-4 h-4 animate-bounce" />
          <span>
            Offline Mode: Network disconnected. Cached dose events remain accessible; logging will synchronize once online.
          </span>
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      <KeyboardShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}
