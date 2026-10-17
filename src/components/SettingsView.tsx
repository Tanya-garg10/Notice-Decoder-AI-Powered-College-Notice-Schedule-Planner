import React, { useState } from 'react';
import { useNotice } from '../context/NoticeContext';
import {
  Settings,
  Database,
  RotateCcw,
  Trash2,
  Download,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Lock,
  Cpu
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export const SettingsView: React.FC = () => {
  const { events, notices, clearAllEvents, loadSampleDataset } = useNotice();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleExportJson = () => {
    const data = {
      app: 'Notice Decoder (The Notice Intelligence Lab)',
      exportedAt: new Date().toISOString(),
      events,
      notices,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `notice_decoder_backup_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage('Backup JSON snapshot exported successfully.');
  };

  const handleConfirmClear = () => {
    clearAllEvents();
    setShowClearConfirm(false);
    setMessage('All local events and notices have been reset.');
  };

  const handleResetSample = () => {
    loadSampleDataset();
    setMessage('Restored built-in CSE benchmark circular dataset.');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-3 border-b border-[#1F2637] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
            System & Storage Console
          </h2>
          <p className="text-xs sm:text-sm text-[#9299A8] mt-0.5">
            Manage browser database, export JSON snapshots, and inspect deterministic engine specifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-code text-[#9299A8]">Storage:</span>
          <span className="text-xs font-mono-code px-2.5 py-1 rounded bg-[#181D29] border border-[#2A3449] text-[#D7FF64]">
            HTML5 LOCALSTORAGE (ENCRYPTED CLIENT)
          </span>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-[#0E1B18] border border-emerald-500/40 text-emerald-300 text-xs font-mono-code rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Storage & Data Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121620] rounded-2xl border border-[#1F2637] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#63E6FF]" />
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
              Browser Local Storage
            </h3>
          </div>
          <p className="text-xs text-[#9299A8] leading-relaxed">
            All notices and extracted schedules remain strictly on your device inside standard HTML5 localStorage. No data is sent to external servers.
          </p>

          <div className="p-4 bg-[#0B0D12] border border-[#2A3449] rounded-xl space-y-2.5 text-xs font-mono-code">
            <div className="flex justify-between text-[#9299A8]">
              <span>Saved Events:</span>
              <span className="text-white font-bold">{events.length}</span>
            </div>
            <div className="flex justify-between text-[#9299A8]">
              <span>Notices Processed:</span>
              <span className="text-white font-bold">{notices.length}</span>
            </div>
            <div className="flex justify-between text-[#9299A8]">
              <span>External Telemetry:</span>
              <span className="font-bold text-[#D7FF64]">None (100% Client-Side)</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleExportJson}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200 hover:text-white bg-[#181D29] hover:bg-[#202738] border border-[#2A3449] rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#63E6FF]" />
              <span>Export Schedule Snapshot (.JSON)</span>
            </button>

            <button
              onClick={handleResetSample}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-xl transition-all shadow-[0_0_12px_rgba(215,255,100,0.2)] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#0B0D12]" />
              <span>Restore Benchmark Sample Circular</span>
            </button>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-mono-code font-bold uppercase tracking-wider text-[#FF647C] hover:bg-[#FF647C]/10 border border-[#FF647C]/30 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#FF647C]" />
              <span>Reset & Wipe Local Database</span>
            </button>
          </div>
        </div>

        {/* Engine Invariants & Specifications */}
        <div className="bg-[#121620] rounded-2xl border border-[#1F2637] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D7FF64]" />
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
              Deterministic Engine Invariants
            </h3>
          </div>
          <p className="text-xs text-[#9299A8] leading-relaxed">
            Strict architectural guardrails enforced across the Notice Decoder processing pipeline:
          </p>

          <ul className="space-y-3 text-xs font-mono-code text-[#9299A8]">
            <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#0B0D12] border border-[#1F2637]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF64] mt-1.5 shrink-0" />
              <div>
                <strong className="text-white block font-sans">Interval Collision Math:</strong>
                <span className="text-[11px] text-[#9299A8]">Strictly evaluates startA &lt; endB and startB &lt; endA. Back-to-back transitions (endA = startB) are allowed without false positives.</span>
              </div>
            </li>
            <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#0B0D12] border border-[#1F2637]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#63E6FF] mt-1.5 shrink-0" />
              <div>
                <strong className="text-white block font-sans">Zero Hallucination Guarantee:</strong>
                <span className="text-[11px] text-[#9299A8]">Never fabricates missing venues, dates, or timings. Ambiguous entries are tagged with clear review flags.</span>
              </div>
            </li>
            <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#0B0D12] border border-[#1F2637]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF64] mt-1.5 shrink-0" />
              <div>
                <strong className="text-white block font-sans">RFC 5545 iCalendar Standards:</strong>
                <span className="text-[11px] text-[#9299A8]">Generates compliant VCALENDAR payloads with correct line folding and escaped parameters for universal calendar compatibility.</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <ConfirmModal
        isOpen={showClearConfirm}
        title="Reset All Local Data"
        message="This will permanently delete all parsed events, custom edits, and notice history from this browser. This cannot be undone."
        confirmLabel="Yes, Clear All"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmClear}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};
