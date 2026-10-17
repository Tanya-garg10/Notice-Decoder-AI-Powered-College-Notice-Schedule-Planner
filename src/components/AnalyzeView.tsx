import React, { useState } from 'react';
import { useNotice } from '../context/NoticeContext';
import { NoticeEvent, EventType } from '../types/notice';
import { parseNoticeText, formatDateDisplay } from '../utils/parser';
import { analyzeNotice } from '../utils/aiAnalysis';
import { OFFICIAL_SAMPLE_NOTICE } from '../utils/sampleData';
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Info,
  Trash2,
  Edit3,
  Download,
  AlertTriangle,
  FileText,
  FileSearch,
  Check,
  ChevronRight,
  ShieldCheck,
  Sliders
} from 'lucide-react';
import { downloadIcsFile } from '../utils/icsExport';

const EVENT_TYPES: EventType[] = ['Exam', 'Lecture', 'Workshop', 'Assignment', 'Deadline', 'Other'];

export const AnalyzeView: React.FC = () => {
  const { addEvents, setActiveTab, conflicts, setInspectingEvent } = useNotice();
  const [noticeText, setNoticeText] = useState(OFFICIAL_SAMPLE_NOTICE);
  const [extractedEvents, setExtractedEvents] = useState<NoticeEvent[]>(() => parseNoticeText(OFFICIAL_SAMPLE_NOTICE));
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(() => new Set(parseNoticeText(OFFICIAL_SAMPLE_NOTICE).map(e => e.id)));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setSuccessMessage(null);
    if (!noticeText.trim()) {
      setValidationError('Please paste notice text before clicking Analyze Notice.');
      setExtractedEvents([]);
      return;
    }

    if (noticeText.trim().length < 15) {
      setValidationError('Notice text is too brief to extract dates or schedule parameters.');
      setExtractedEvents([]);
      return;
    }

    setValidationError(null);
    setIsAnalyzing(true);
    try {
      const parsed = await analyzeNotice(noticeText);
      setExtractedEvents(parsed);
      setSelectedEventIds(new Set(parsed.map(e => e.id)));

      if (parsed.length === 0) {
        setValidationError('No schedule events were found in this notice. Check the text or add events manually in Schedule.');
      }
    } catch (error) {
      setExtractedEvents([]);
      setSelectedEventIds(new Set());
      setValidationError(error instanceof Error ? error.message : 'Notice analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setNoticeText('');
    setExtractedEvents([]);
    setSelectedEventIds(new Set());
    setValidationError(null);
    setSuccessMessage(null);
  };

  const handleLoadOfficialSample = () => {
    setNoticeText(OFFICIAL_SAMPLE_NOTICE);
    setValidationError(null);
    setSuccessMessage(null);
    const parsed = parseNoticeText(OFFICIAL_SAMPLE_NOTICE);
    setExtractedEvents(parsed);
    setSelectedEventIds(new Set(parsed.map(e => e.id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedEventIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedEventIds(next);
  };

  const updateExtractedField = (id: string, field: keyof NoticeEvent, value: any) => {
    setExtractedEvents(prev =>
      prev.map(evt => {
        if (evt.id === id) {
          const updated = { ...evt, [field]: value };
          const reasons: string[] = [];
          if (!updated.date || updated.date.length < 10) reasons.push('Missing date');
          if (!updated.startTime && !updated.isDeadline) reasons.push('Missing start time');
          if (!updated.endTime && !updated.isDeadline && updated.startTime) reasons.push('Missing end time');
          if (!updated.venue && updated.type !== 'Deadline') reasons.push('Missing venue');
          updated.requiresReview = reasons.length > 0;
          updated.reviewReasons = reasons;
          return updated;
        }
        return evt;
      })
    );
  };

  const removeExtractedItem = (id: string) => {
    setExtractedEvents(prev => prev.filter(e => e.id !== id));
    const next = new Set(selectedEventIds);
    next.delete(id);
    setSelectedEventIds(next);
  };

  const handleConfirmAndSave = () => {
    const toSave = extractedEvents.filter(e => selectedEventIds.has(e.id));
    if (toSave.length === 0) {
      setValidationError('Select at least one extracted event to save to your schedule.');
      return;
    }

    addEvents(toSave, {
      title: toSave[0]?.title ? `Circular: ${toSave[0].title}` : 'Notice Circular',
      rawText: noticeText,
    });

    setSuccessMessage(`Saved ${toSave.length} event(s) to schedule.`);
  };

  const handleExportReviewed = () => {
    const toExport = extractedEvents.filter(e => selectedEventIds.has(e.id));
    if (toExport.length === 0) {
      setValidationError('Select at least one event to export.');
      return;
    }
    const result = downloadIcsFile(toExport, 'extracted_schedule.ics');
    if (!result.success) {
      setValidationError(result.skippedReasons.join(' ') || 'No dated events are available to export.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-3 border-b border-[#1F2637] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
            Notice Intelligence Workspace
          </h2>
          <p className="text-xs sm:text-sm text-[#9299A8] mt-0.5">
            Featherless AI extracts candidate events from unstructured notices. Review every extracted detail before saving.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-code text-[#9299A8]">Parsing:</span>
          <span className="text-xs font-mono-code px-2.5 py-1 rounded bg-[#181D29] border border-[#2A3449] text-[#D7FF64]">
            ● FEATHERLESS AI
          </span>
        </div>
      </div>

      {/* SPLIT PANEL LAYOUT WITH LUMINOUS CONNECTOR (Section 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative">
        {/* LEFT PANEL — SOURCE DOCUMENT (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-[#121620] rounded-2xl border border-[#1F2637] p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2637] pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#63E6FF]" />
              <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-white">
                SOURCE DOCUMENT
              </h3>
            </div>
            <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded bg-[#181D29] border border-[#2A3449] text-[#D7FF64]">
              PASTED TEXT
            </span>
          </div>

          <div>
            <label className="text-xs font-mono-code text-[#9299A8] block mb-1">
              PASTE NOTICE TEXT
            </label>
            <div className="relative">
              <textarea
                value={noticeText}
                onChange={e => setNoticeText(e.target.value)}
                rows={11}
                placeholder="Paste university or department notice text here... E.g. Internal Test 2 will be held on 13 November 2026 from 10:00 AM to 11:30 AM in Room 204..."
                className="w-full p-4 text-xs font-mono-code border border-[#2A3449] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D7FF64] focus:border-[#D7FF64] text-slate-200 bg-[#0B0D12] leading-relaxed resize-y"
              />
              <div className="absolute right-3 bottom-3 text-[10px] font-mono-code text-[#9299A8] bg-[#121620]/90 border border-[#1F2637] px-2 py-0.5 rounded">
                {noticeText.length} chars · {noticeText.split(/\s+/).filter(Boolean).length} words
              </div>
            </div>
          </div>

          {validationError && (
            <div className="p-3 bg-[#1C141B] border border-[#FF647C]/40 text-[#FF647C] text-xs font-mono-code rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-3 px-4 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] disabled:opacity-60 disabled:cursor-wait rounded-xl transition-all shadow-[0_0_15px_rgba(215,255,100,0.25)] cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#0B0D12]" />
              <span>{isAnalyzing ? 'ANALYZING WITH FEATHERLESS...' : 'ANALYZE NOTICE WITH AI'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadOfficialSample}
                disabled={isAnalyzing}
                className="flex-1 py-2 px-3 text-xs font-mono-code text-slate-300 hover:text-white bg-[#181D29] hover:bg-[#202738] border border-[#2A3449] rounded-xl transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Load Sample Notice
              </button>
              <button
                onClick={handleClear}
                disabled={isAnalyzing}
                className="py-2 px-3 text-xs font-mono-code text-slate-400 hover:text-slate-200 bg-[#181D29] hover:bg-[#202738] border border-[#2A3449] rounded-xl transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — DECODED STRUCTURE (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#121620] rounded-2xl border border-[#1F2637] p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2637] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-white">
                    DECODED STRUCTURE
                  </h3>
                  <span className="text-[11px] font-mono-code px-2 py-0.5 bg-[#181D29] border border-[#2A3449] text-[#63E6FF] rounded-md font-bold">
                    {extractedEvents.length} items
                  </span>
                </div>
                <p className="text-xs text-[#9299A8] mt-0.5">
                  Verified parameters extracted with confidence indicators and source snippets.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('conflicts')}
                  className="px-3 py-1.5 text-xs font-mono-code font-semibold text-[#FF647C] bg-[#FF647C]/10 hover:bg-[#FF647C]/20 border border-[#FF647C]/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#FF647C]" />
                  <span>Inspect Conflicts</span>
                </button>
                <button
                  onClick={handleExportReviewed}
                  className="px-3 py-1.5 text-xs font-mono-code font-semibold text-slate-300 hover:text-white bg-[#181D29] hover:bg-[#202738] border border-[#2A3449] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#63E6FF]" />
                  <span>.ICS</span>
                </button>
              </div>
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs font-mono-code text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
                <button
                  onClick={() => setActiveTab('events')}
                  className="underline hover:text-white cursor-pointer"
                >
                  View Schedule
                </button>
              </div>
            )}

            {extractedEvents.length === 0 ? (
              <div className="py-10 text-center space-y-2 text-slate-500">
                <FileSearch className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-mono-code">No parameters extracted yet. Paste circular text and analyze.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {extractedEvents.map(evt => {
                  const isSelected = selectedEventIds.has(evt.id);
                  const isEditing = isEditingId === evt.id;

                  return (
                    <div
                      key={evt.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[#2A3449] bg-[#181D29]'
                          : 'border-[#1F2637] bg-[#121620]/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(evt.id)}
                            className="w-4 h-4 mt-1 accent-[#D7FF64] rounded cursor-pointer"
                            aria-label={`Select ${evt.title}`}
                          />

                          <div className="space-y-2 flex-1">
                            {isEditing ? (
                              <div className="space-y-3 p-3 bg-[#0B0D12] rounded-lg border border-[#2A3449]">
                                <div>
                                  <label className="text-[10px] font-mono-code text-slate-400 block mb-0.5">Title</label>
                                  <input
                                    type="text"
                                    value={evt.title}
                                    onChange={e => updateExtractedField(evt.id, 'title', e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs font-mono-code bg-[#121620] border border-[#2A3449] rounded text-white"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <div>
                                    <label className="text-[10px] font-mono-code text-slate-400 block mb-0.5">Type</label>
                                    <select
                                      value={evt.type}
                                      onChange={e => updateExtractedField(evt.id, 'type', e.target.value as EventType)}
                                      className="w-full px-2 py-1.5 text-xs font-mono-code bg-[#121620] border border-[#2A3449] rounded text-white"
                                    >
                                      {EVENT_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-mono-code text-slate-400 block mb-0.5">Date</label>
                                    <input
                                      type="date"
                                      value={evt.date}
                                      onChange={e => updateExtractedField(evt.id, 'date', e.target.value)}
                                      className="w-full px-2 py-1.5 text-xs font-mono-code bg-[#121620] border border-[#2A3449] rounded text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-mono-code text-slate-400 block mb-0.5">Venue</label>
                                    <input
                                      type="text"
                                      value={evt.venue}
                                      onChange={e => updateExtractedField(evt.id, 'venue', e.target.value)}
                                      className="w-full px-2 py-1.5 text-xs font-mono-code bg-[#121620] border border-[#2A3449] rounded text-white"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-mono-code text-slate-400 block mb-0.5">Start Time</label>
                                    <input
                                      type="text"
                                      value={evt.startTime}
                                      onChange={e => updateExtractedField(evt.id, 'startTime', e.target.value)}
                                      className="w-full px-2 py-1.5 text-xs font-mono-code bg-[#121620] border border-[#2A3449] rounded text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-mono-code text-slate-400 block mb-0.5">End Time</label>
                                    <input
                                      type="text"
                                      value={evt.endTime}
                                      onChange={e => updateExtractedField(evt.id, 'endTime', e.target.value)}
                                      className="w-full px-2 py-1.5 text-xs font-mono-code bg-[#121620] border border-[#2A3449] rounded text-white"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => setIsEditingId(null)}
                                    className="px-3 py-1 text-xs font-mono-code font-bold text-[#0B0D12] bg-[#D7FF64] rounded"
                                  >
                                    Done
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-white">{evt.title}</span>
                                  <span
                                    className={`text-[10px] font-mono-code px-2 py-0.2 rounded uppercase ${
                                      evt.type === 'Exam'
                                        ? 'bg-[#6366F1]/20 text-[#6366F1]'
                                        : evt.isDeadline
                                        ? 'bg-[#FFC86B]/20 text-[#FFC86B]'
                                        : 'bg-[#63E6FF]/20 text-[#63E6FF]'
                                    }`}
                                  >
                                    {evt.type}
                                  </span>
                                  {evt.userConfirmed ? (
                                    <span className="text-[10px] font-mono-code font-bold px-2 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
                                      CONFIRMED BY USER
                                    </span>
                                  ) : evt.requiresReview ? (
                                    <span className="text-[10px] font-mono-code font-bold px-2 py-0.2 rounded bg-amber-950/50 text-[#FFC86B] border border-[#FFC86B]/40">
                                      NEEDS REVIEW
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono-code font-bold px-2 py-0.2 rounded bg-[#181D29] text-[#63E6FF] border border-[#2A3449]">
                                      PARSED (UNCONFIRMED)
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs font-mono-code text-[#9299A8] mt-1">
                                  <span>{formatDateDisplay(evt.date)}</span>
                                  {(evt.startTime || evt.endTime) && (
                                    <>
                                      <span>·</span>
                                      <span className="text-white font-semibold">
                                        {evt.startTime} {evt.endTime ? `– ${evt.endTime}` : ''}
                                      </span>
                                    </>
                                  )}
                                  {evt.venue && (
                                    <>
                                      <span>·</span>
                                      <span>{evt.venue}</span>
                                    </>
                                  )}
                                </div>

                                {evt.requiresReview && evt.reviewReasons.length > 0 && (
                                  <div className="p-2 rounded-lg bg-[#1C141B] border border-[#FF647C]/30 text-[#FFC86B] text-[11px] font-mono-code flex items-start gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#FFC86B] mt-0.5" />
                                    <span>Flag: {evt.reviewReasons.join('; ')}</span>
                                  </div>
                                )}

                                {evt.rawSnippet && (
                                  <div className="text-[11px] font-mono-code text-slate-300 bg-[#0B0D12] p-2.5 rounded-lg border border-[#1F2637] space-y-1">
                                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                                      <span className="text-slate-400">Source sentence from notice:</span>
                                      <button
                                        onClick={() => setInspectingEvent(evt)}
                                        className="text-[#D7FF64] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                                      >
                                        <ShieldCheck className="w-3 h-3 text-[#D7FF64]" />
                                        <span>Open Evidence Dossier</span>
                                      </button>
                                    </div>
                                    <p className="italic text-slate-300">"{evt.rawSnippet}"</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setIsEditingId(isEditing ? null : evt.id)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#181D29]"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeExtractedItem(evt.id)}
                            className="p-1.5 text-slate-400 hover:text-[#FF647C] rounded hover:bg-[#181D29]"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2 flex items-center justify-between border-t border-[#1F2637]">
                  <span className="text-xs font-mono-code text-[#9299A8]">
                    {selectedEventIds.size} of {extractedEvents.length} selected
                  </span>
                  <button
                    onClick={handleConfirmAndSave}
                    className="px-4 py-2 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-xl transition-all shadow-[0_0_15px_rgba(215,255,100,0.2)] cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-[#0B0D12]" />
                    <span>SAVE TO SCHEDULE REGISTRY</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
