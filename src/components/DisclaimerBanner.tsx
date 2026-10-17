import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside aria-label="Disclaimer" className="bg-slate-900 border-b border-slate-800 text-slate-300 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-white font-medium">Notice Decoder:</strong> Assists with notice interpretation. Always verify critical examination and deadline dates against your institution's official signed notice.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-[11px] text-cyan-400/80 font-mono">
            Local Engine · Zero Cloud APIs
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
