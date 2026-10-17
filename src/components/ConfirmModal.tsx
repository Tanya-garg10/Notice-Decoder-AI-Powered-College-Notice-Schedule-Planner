import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#121620] text-[#F5F5F0] rounded-2xl shadow-2xl border border-[#1F2637] w-full max-w-md overflow-hidden p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${isDestructive ? 'bg-[#1C141B] text-[#FF647C] border border-[#FF647C]/30' : 'bg-[#122329] text-[#63E6FF] border border-[#63E6FF]/30'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-display text-white">{title}</h3>
            <p className="text-xs font-mono-code text-[#9299A8] mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2637]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-mono-code text-slate-300 hover:text-white bg-[#181D29] hover:bg-[#202738] border border-[#2A3449] rounded-xl transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-mono-code font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer ${
              isDestructive
                ? 'bg-[#FF647C] hover:bg-[#ff4f6b] text-white shadow-[0_0_12px_rgba(255,100,124,0.3)]'
                : 'bg-[#D7FF64] hover:bg-[#c8f54c] text-[#0B0D12] shadow-[0_0_12px_rgba(215,255,100,0.3)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
