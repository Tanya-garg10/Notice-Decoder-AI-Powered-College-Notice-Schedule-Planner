import React, { useState } from 'react';
import { useNotice } from '../context/NoticeContext';
import { compareNotices } from '../utils/diffEngine';
import { parseNoticeText } from '../utils/parser';
import { NoticeDiffResult } from '../types/notice';
import {
  OFFICIAL_SAMPLE_NOTICE,
  SAMPLE_REVISED_NOTICE,
} from '../utils/sampleData';
import {
  GitCompare,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  FileText
} from 'lucide-react';

export const NoticeUpdatesView: React.FC = () => {
  const { addEvents, setActiveTab } = useNotice();

  const [originalText, setOriginalText] = useState(OFFICIAL_SAMPLE_NOTICE);
  const [revisedText, setRevisedText] = useState(SAMPLE_REVISED_NOTICE);
  const [diffResult, setDiffResult] = useState<NoticeDiffResult | null>(() =>
    compareNotices(OFFICIAL_SAMPLE_NOTICE, SAMPLE_REVISED_NOTICE)
  );
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null);

  const handleCompare = () => {
    setAppliedMessage(null);
    if (!originalText.trim() || !revisedText.trim()) {
      return;
    }
    const result = compareNotices(originalText, revisedText);
    setDiffResult(result);
  };

  const handleLoadSampleRevision = () => {
    setOriginalText(OFFICIAL_SAMPLE_NOTICE);
    setRevisedText(SAMPLE_REVISED_NOTICE);
    setAppliedMessage(null);
    const result = compareNotices(OFFICIAL_SAMPLE_NOTICE, SAMPLE_REVISED_NOTICE);
    setDiffResult(result);
  };

  const handleClear = () => {
    setOriginalText('');
    setRevisedText('');
    setDiffResult(null);
    setAppliedMessage(null);
  };

  const handleApplyRevisedNotice = () => {
    const parsed = parseNoticeText(revisedText);
    if (parsed.length === 0) return;

    addEvents(parsed, {
      title: 'Corrigendum Schedule Circular',
      rawText: revisedText,
    });

    setAppliedMessage(`Applied ${parsed.length} updated events to Schedule Registry.`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-3 border-b border-[#1F2637]">
        <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
          Notice Change Radar
        </h2>
        <p className="text-xs sm:text-sm text-[#9299A8] mt-0.5">
          Developer-grade semantic diff engine comparing original and revised circulars for rescheduled dates, times, and venues
        </p>
      </div>

      {/* Input Columns */}
      <div className="bg-[#121620] rounded-2xl border border-[#1F2637] p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-code text-[#9299A8]">Presets:</span>
            <button
              onClick={handleLoadSampleRevision}
              className="px-2.5 py-1 text-xs font-mono-code text-[#D7FF64] bg-[#181D29] hover:bg-[#202738] border border-[#2A3449] rounded-md transition-colors cursor-pointer"
            >
              Load Official Reschedule Sample
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-mono-code text-slate-400 hover:text-white bg-[#181D29] hover:bg-[#202738] border border-[#2A3449] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              onClick={handleCompare}
              className="px-4 py-1.5 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-lg transition-all shadow-[0_0_15px_rgba(215,255,100,0.2)] cursor-pointer flex items-center gap-1.5"
            >
              <GitCompare className="w-3.5 h-3.5 text-[#0B0D12]" />
              <span>COMPARE NOTICES</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {/* Original Notice */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono-code font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Original Notice</span>
              </label>
              <span className="text-[10px] font-mono-code text-[#9299A8]">
                {originalText.length} chars
              </span>
            </div>
            <textarea
              value={originalText}
              onChange={e => setOriginalText(e.target.value)}
              rows={6}
              placeholder="Paste original notice text here..."
              className="w-full p-3 text-xs font-mono-code border border-[#2A3449] rounded-xl focus:outline-none focus:border-[#D7FF64] bg-[#0B0D12] text-slate-200"
            />
          </div>

          {/* Revised Notice */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono-code font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#63E6FF]" />
                <span>Revised / Corrigendum Notice</span>
              </label>
              <span className="text-[10px] font-mono-code text-[#9299A8]">
                {revisedText.length} chars
              </span>
            </div>
            <textarea
              value={revisedText}
              onChange={e => setRevisedText(e.target.value)}
              rows={6}
              placeholder="Paste updated notice text here..."
              className="w-full p-3 text-xs font-mono-code border border-[#2A3449] rounded-xl focus:outline-none focus:border-[#D7FF64] bg-[#0B0D12] text-slate-200"
            />
          </div>
        </div>

        {appliedMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs font-mono-code text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{appliedMessage}</span>
            </div>
            <button
              onClick={() => setActiveTab('events')}
              className="underline hover:text-white cursor-pointer"
            >
              View Schedule
            </button>
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {diffResult && (
        <div className="space-y-6">
          {/* Key Change Summary Cards */}
          <div className="bg-[#121620] rounded-2xl border border-[#1F2637] p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2637] pb-3">
              <div>
                <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
                  Detected Modifications & Invariants
                </h3>
                <p className="text-xs text-[#9299A8] mt-0.5">
                  Extracted variance in dates, venues, timings, and requirements
                </p>
              </div>

              <button
                onClick={handleApplyRevisedNotice}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-xl transition-all shadow-[0_0_15px_rgba(215,255,100,0.2)] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0B0D12]" />
                <span>APPLY REVISED SCHEDULE</span>
              </button>
            </div>

            {/* Structured change callouts with Source Evidence */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Date Changes */}
              <div className="p-3.5 rounded-xl border border-[#2A3449] bg-[#181D29] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-code font-bold text-white">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#63E6FF]" />
                    <span>Date Revisions</span>
                  </span>
                  <span className="text-[10px] text-[#D7FF64]">EVIDENCE VERIFIED</span>
                </div>
                {diffResult.dateChanges.length === 0 ? (
                  <p className="text-xs font-mono-code text-slate-500">No date modifications</p>
                ) : (
                  <div className="space-y-2.5 text-xs font-mono-code">
                    {diffResult.dateChanges.map((dc, i) => (
                      <div key={i} className="p-2 rounded-lg bg-[#0B0D12] border border-[#1F2637] space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="line-through text-[#FF647C]">{dc.original}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="font-bold text-[#D7FF64]">{dc.revised}</span>
                        </div>
                        {dc.originalSentence && (
                          <div className="text-[10px] text-[#9299A8] leading-tight">
                            <span className="text-slate-500">Orig notice:</span> "{dc.originalSentence}"
                          </div>
                        )}
                        {dc.revisedSentence && (
                          <div className="text-[10px] text-emerald-400 leading-tight">
                            <span className="text-emerald-600">Rev notice:</span> "{dc.revisedSentence}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Time Changes */}
              <div className="p-3.5 rounded-xl border border-[#2A3449] bg-[#181D29] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-code font-bold text-white">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#FFC86B]" />
                    <span>Timing Adjustments</span>
                  </span>
                  <span className="text-[10px] text-[#D7FF64]">EVIDENCE VERIFIED</span>
                </div>
                {diffResult.timeChanges.length === 0 ? (
                  <p className="text-xs font-mono-code text-slate-500">No time modifications</p>
                ) : (
                  <div className="space-y-2.5 text-xs font-mono-code">
                    {diffResult.timeChanges.map((tc, i) => (
                      <div key={i} className="p-2 rounded-lg bg-[#0B0D12] border border-[#1F2637] space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="line-through text-[#FF647C]">{tc.original}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="font-bold text-[#D7FF64]">{tc.revised}</span>
                        </div>
                        {tc.originalSentence && (
                          <div className="text-[10px] text-[#9299A8] leading-tight">
                            <span className="text-slate-500">Orig notice:</span> "{tc.originalSentence}"
                          </div>
                        )}
                        {tc.revisedSentence && (
                          <div className="text-[10px] text-emerald-400 leading-tight">
                            <span className="text-emerald-600">Rev notice:</span> "{tc.revisedSentence}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Venue Changes */}
              <div className="p-3.5 rounded-xl border border-[#2A3449] bg-[#181D29] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-code font-bold text-white">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#63E6FF]" />
                    <span>Location Moves</span>
                  </span>
                  <span className="text-[10px] text-[#D7FF64]">EVIDENCE VERIFIED</span>
                </div>
                {diffResult.venueChanges.length === 0 ? (
                  <p className="text-xs font-mono-code text-slate-500">No venue movements</p>
                ) : (
                  <div className="space-y-2.5 text-xs font-mono-code">
                    {diffResult.venueChanges.map((vc, i) => (
                      <div key={i} className="p-2 rounded-lg bg-[#0B0D12] border border-[#1F2637] space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="line-through text-[#FF647C]">{vc.original}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="font-bold text-[#D7FF64]">{vc.revised}</span>
                        </div>
                        {vc.originalSentence && (
                          <div className="text-[10px] text-[#9299A8] leading-tight">
                            <span className="text-slate-500">Orig notice:</span> "{vc.originalSentence}"
                          </div>
                        )}
                        {vc.revisedSentence && (
                          <div className="text-[10px] text-emerald-400 leading-tight">
                            <span className="text-emerald-600">Rev notice:</span> "{vc.revisedSentence}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Summary List */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-mono-code font-bold text-slate-400 uppercase tracking-wider">
                Change Log Items:
              </h4>
              <ul className="space-y-1.5 text-xs font-mono-code text-slate-300">
                {diffResult.summaryItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF64] mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Visual Side-by-Side Diff Markup (Section 8) */}
          <div className="bg-[#121620] rounded-2xl border border-[#1F2637] p-5 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
              Annotated Semantic Difference
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono-code text-xs">
              <div className="p-4 rounded-xl border border-[#2A3449] bg-[#0B0D12] space-y-2">
                <span className="text-[10px] text-slate-500 block uppercase">Original Notice Excerpt</span>
                <div className="leading-relaxed text-slate-300">
                  {diffResult.annotatedOriginal.map((tok, i) => (
                    <span
                      key={i}
                      className={`mr-1 inline-block ${
                        tok.status === 'removed'
                          ? 'bg-[#FF647C]/20 text-[#FF647C] line-through px-0.5 rounded'
                          : ''
                      }`}
                    >
                      {tok.text}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#2A3449] bg-[#0B0D12] space-y-2">
                <span className="text-[10px] text-slate-500 block uppercase">Revised Notice Excerpt</span>
                <div className="leading-relaxed text-slate-300">
                  {diffResult.annotatedRevised.map((tok, i) => (
                    <span
                      key={i}
                      className={`mr-1 inline-block ${
                        tok.status === 'added'
                          ? 'bg-[#D7FF64]/20 text-[#D7FF64] font-bold px-0.5 rounded'
                          : ''
                      }`}
                    >
                      {tok.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
