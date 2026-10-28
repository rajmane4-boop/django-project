import React from 'react';
import Modal from './Modal';
import { Command } from 'lucide-react';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  const shortcuts = [
    { key: '?', desc: 'Open / Close this shortcuts guide' },
    { key: 'd', desc: 'Navigate to Intake Dashboard' },
    { key: 'm', desc: 'Navigate to Medication Inventory' },
    { key: 'r', desc: 'Navigate to Prescription Regimens' },
    { key: 'c', desc: 'Navigate to Caregiver Contacts' },
    { key: 'p', desc: 'Navigate to Caregiver Live Portal' },
    { key: 't', desc: 'Toggle Dark / Light Theme' },
    { key: 'Esc', desc: 'Close open dialogs & overlays' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Navigation Shortcuts">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Navigate quickly throughout the Smart MedTrack clinical interface using single-key hotkeys:
        </p>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-xs bg-white dark:bg-slate-900">
              <span className="text-slate-700 dark:text-slate-200 font-medium">{s.desc}</span>
              <kbd className="px-2 py-1 font-mono font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <span className="text-[11px] text-slate-400">
            Press <kbd className="px-1.5 py-0.5 font-mono bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">Esc</kbd> anytime to dismiss.
          </span>
        </div>
      </div>
    </Modal>
  );
}
