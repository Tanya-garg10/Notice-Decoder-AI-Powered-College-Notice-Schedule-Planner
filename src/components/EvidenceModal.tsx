import React from 'react';
import { useNotice } from '../context/NoticeContext';
import { NoticeEvent, FieldVerificationStatus } from '../types/notice';
import { formatDateDisplay } from '../utils/parser';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Clock,
  Calendar,
  MapPin,
  Check,
  Info,
  Quote,
  Eye,
  AlertCircle
} from 'lucide-react';

interface EvidenceModalProps {
  event: NoticeEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ event, isOpen, onClose }) => {
  const { confirmField, unconfirmField, confirmAllFields } = useNotice();

  if (!isOpen || !event) return null;

  const evidence = event.evidence;
  const sourceSentence = event.rawSnippet || evidence?.sourceSentence || 'Source sentence not recorded.';
  const fullNotice = event.sourceNoticeText || evidence?.sourceNoticeText || '';

  // Get field statuses
  const getFieldStatus = (field: 'title' | 'date' | 'time' | 'venue'): FieldVerificationStatus => {
    if (event.confirmedFields?.[field]) return 'confirmed';
    if (evidence?.fields[field]) return evidence.fields[field].status;
    if (field === 'title' && event.title) return 'needs_review';
    if (field === 'date' && event.date) return 'needs_review';
    if (field === 'time' && event.startTime) return 'needs_review';
    if (field === 'venue' && event.venue) return 'needs_review';
    return 'missing';
  };

  const getFieldValue = (field: 'title' | 'date' | 'time' | 'venue'): string => {
    if (field === 'title') return event.title || 'Missing';
    if (field === 'date') return event.date ? formatDateDisplay(event.date) : 'Missing';
    if (field === 'time') {
      if (!event.startTime) return 'Missing';
      return event.endTime ? `${event.startTime} – ${event.endTime}` : `${event.startTime} (Single point / deadline)`;
    }
    if (field === 'venue') return event.venue || (event.isDeadline ? 'Department Office (Default)' : 'Missing');
    return '';
  };

  const getFieldFlag = (field: 'title' | 'date' | 'time' | 'venue'): string | undefined => {
    return evidence?.fields[field]?.flag;
  };

  const fields: ('title' | 'date' | 'time' | 'venue')[] = ['title', 'date', 'time', 'venue'];

  const fieldLabels: Record<'title' | 'date' | 'time' | 'venue', { label: string; icon: any }> = {
    title: { label: 'Event Title', icon: FileText },
    date: { label: 'Event Date', icon: Calendar },
    time: { label: 'Time Window / Deadline', icon: Clock },
    venue: { label: 'Venue Location', icon: MapPin },
  };

  const statusBadge = (status: FieldVerificationStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>CONFIRMED BY USER</span>
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-amber-950/50 text-[#FFC86B] border border-[#FFC86B]/40">
            <AlertTriangle className="w-3 h-3 text-[#FFC86B]" />
            <span>NEEDS REVIEW</span>
          </span>
        );
      case 'missing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-rose-950/50 text-[#FF647C] border border-[#FF647C]/40">
            <AlertCircle className="w-3 h-3 text-[#FF647C]" />
            <span>MISSING</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs">
      <div className="bg-[#121620] text-[#F5F5F0] rounded-2xl shadow-2xl border border-[#1F2637] w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2637] bg-[#181D29]/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1C2538] border border-[#2A3449] flex items-center justify-center text-[#63E6FF]">
              <ShieldCheck className="w-5 h-5 text-[#63E6FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-white">
                  Notice Trust & Evidence Dossier
                </h3>
                <span className="text-[10px] font-mono-code px-2 py-0.2 rounded bg-[#0B0D12] text-[#D7FF64] border border-[#2A3449]">
                  AUDIT LAYER
                </span>
              </div>
              <p className="text-xs font-mono-code text-[#9299A8]">
                Ground truth verification comparing extracted data directly with source notice wording
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#9299A8] hover:text-white rounded-lg hover:bg-[#181D29] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Top Banner: Verification Status Summary & Bulk Action */}
          <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#1F2637] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-code text-[#9299A8] uppercase tracking-wider">
                  Target Event:
                </span>
                <span className="text-sm font-bold text-white font-display">
                  {event.title}
                </span>
              </div>
              <p className="text-xs font-mono-code text-[#9299A8]">
                Category: <strong className="text-[#63E6FF]">{event.type}</strong> · Status:{' '}
                {event.userConfirmed ? (
                  <span className="text-emerald-400 font-bold">All Fields Confirmed by User</span>
                ) : (
                  <span className="text-[#FFC86B] font-bold">Unconfirmed (Rule-Based Parsed)</span>
                )}
              </p>
            </div>

            <button
              onClick={() => confirmAllFields(event.id)}
              className="px-3.5 py-2 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-xl transition-all shadow-[0_0_12px_rgba(215,255,100,0.2)] flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Check className="w-3.5 h-3.5 text-[#0B0D12]" />
              <span>Confirm All Fields</span>
            </button>
          </div>

          {/* Ambiguity or Contradiction Callout if present */}
          {(evidence?.hasAmbiguousDate || evidence?.hasIncompleteTime || evidence?.hasConflictingClauses || event.requiresReview) && (
            <div className="p-4 rounded-xl bg-[#1C141B] border border-[#FF647C]/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono-code font-bold text-[#FF647C]">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF647C]" />
                <span>Notice Trust Alert & Ambiguity Flags Detected</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs font-mono-code text-slate-300">
                {evidence?.hasAmbiguousDate && (
                  <li>
                    <strong className="text-[#FFC86B]">Ambiguous Date:</strong> Numeric date notation in notice requires verification of day/month interpretation.
                  </li>
                )}
                {evidence?.hasIncompleteTime && (
                  <li>
                    <strong className="text-[#FFC86B]">Incomplete Time Window:</strong> Circular specifies start time but leaves end time open-ended.
                  </li>
                )}
                {evidence?.conflictingNoticeClauses?.map((c, idx) => (
                  <li key={idx} className="text-[#FF647C]">
                    <strong>Contradictory Clause:</strong> {c}
                  </li>
                ))}
                {!evidence?.hasAmbiguousDate && !evidence?.hasIncompleteTime && !evidence?.hasConflictingClauses && event.reviewReasons?.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Supporting Source Sentence Highlight */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-code text-[#9299A8]">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Quote className="w-3.5 h-3.5 text-[#D7FF64]" />
                <span>Exact Supporting Source Sentence in Notice</span>
              </span>
              <span className="text-[10px] text-[#63E6FF] bg-[#181D29] px-2 py-0.5 rounded border border-[#2A3449]">
                VERBATIM EXTRACT
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border-l-4 border-l-[#D7FF64] border-y border-r border-[#1F2637] text-xs font-mono-code text-slate-200 leading-relaxed">
              "{sourceSentence}"
            </div>
          </div>

          {/* Field-by-Field Evidence Audit Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono-code font-bold text-white uppercase tracking-wider">
              Field-Level Ground Truth Comparison
            </h4>

            <div className="space-y-3">
              {fields.map(field => {
                const status = getFieldStatus(field);
                const value = getFieldValue(field);
                const flag = getFieldFlag(field);
                const meta = fieldLabels[field];
                const Icon = meta.icon;
                const isConfirmed = status === 'confirmed';

                return (
                  <div
                    key={field}
                    className="p-4 rounded-xl bg-[#181D29]/60 border border-[#1F2637] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#2A3449] transition-colors"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#63E6FF] shrink-0" />
                        <span className="text-xs font-mono-code font-bold text-white uppercase tracking-wider">
                          {meta.label}
                        </span>
                        {statusBadge(status)}
                      </div>

                      <div className="text-xs font-mono-code pl-6">
                        <div className="text-slate-200 font-semibold truncate">
                          Extracted Value: <span className="text-[#D7FF64]">{value}</span>
                        </div>
                        {flag && (
                          <div className="text-[11px] text-[#FFC86B] mt-0.5 flex items-center gap-1">
                            <span>⚠</span>
                            <span>{flag}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pl-6 md:pl-0">
                      {isConfirmed ? (
                        <button
                          onClick={() => unconfirmField(event.id, field)}
                          className="px-3 py-1.5 text-xs font-mono-code text-[#9299A8] hover:text-white bg-[#121620] hover:bg-[#1F2637] border border-[#2A3449] rounded-lg transition-colors cursor-pointer"
                        >
                          Mark Needs Review
                        </button>
                      ) : (
                        <button
                          onClick={() => confirmField(event.id, field)}
                          disabled={status === 'missing'}
                          className="px-3 py-1.5 text-xs font-mono-code font-bold uppercase tracking-wider text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Confirm Value</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Original Notice Context with Highlighting */}
          {fullNotice && (
            <div className="space-y-2 pt-2 border-t border-[#1F2637]">
              <div className="flex items-center justify-between text-xs font-mono-code text-[#9299A8]">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-[#63E6FF]" />
                  <span>Full Stored Notice Context</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  {fullNotice.length} characters
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#2A3449] text-xs font-mono-code text-[#9299A8] leading-relaxed max-h-40 overflow-y-auto">
                {fullNotice.split(/(?<=[.!?])\s+|\n+/).map((s, idx) => {
                  const isMatching = s.trim() === sourceSentence.trim();
                  return (
                    <span
                      key={idx}
                      className={
                        isMatching
                          ? 'bg-[#D7FF64]/20 text-white font-bold px-1 rounded border border-[#D7FF64]/40 inline-block my-0.5'
                          : 'inline'
                      }
                    >
                      {s}{' '}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Non-Fabrication Compliance Statement */}
          <div className="p-3.5 rounded-xl bg-[#0E121A] border border-[#1F2637] flex items-start gap-2.5 text-[11px] font-mono-code text-[#9299A8]">
            <Info className="w-4 h-4 text-[#63E6FF] shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Notice Trust Guarantee:</strong> Citations reflect verbatim sentence boundaries from the uploaded circular. Automated rule parsing is never treated as verified official schedule until certified by you.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#1F2637] bg-[#181D29]/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Done Inspecting
          </button>
        </div>
      </div>
    </div>
  );
};
