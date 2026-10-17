import React, { useState } from 'react';
import { useNotice } from '../context/NoticeContext';
import { formatDateDisplay } from '../utils/parser';
import { NoticeEvent } from '../types/notice';
import { TemporalConflictMap } from './TemporalConflictMap';
import { EventModal } from './EventModal';
import {
  Sparkles,
  Calendar,
  AlertTriangle,
  Clock,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  MapPin,
  FileSearch,
  FileText,
  RotateCcw,
  Zap,
  Edit2,
  CalendarDays,
  ShieldCheck,
  ChevronRight,
  Sliders
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    events,
    conflicts,
    stats,
    notices,
    setActiveTab,
    setEventFilter,
    loadSampleDataset,
    updateEvent,
    setInspectingEvent,
  } = useNotice();

  const [editingEvent, setEditingEvent] = useState<NoticeEvent | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Today's primary signal event (first clashing event or earliest session)
  const primarySignalEvent = React.useMemo(() => {
    if (events.length === 0) return null;
    if (conflicts.length > 0) {
      return conflicts[0].eventA;
    }
    return events[0];
  }, [events, conflicts]);

  const primarySignalConflict = React.useMemo(() => {
    if (!primarySignalEvent) return null;
    return conflicts.find(
      c => c.eventA.id === primarySignalEvent.id || c.eventB.id === primarySignalEvent.id
    );
  }, [primarySignalEvent, conflicts]);

  const handleEditClick = (evt: NoticeEvent) => {
    setEditingEvent(evt);
    setIsEditModalOpen(true);
  };

  const handleSaveModal = (data: Omit<NoticeEvent, 'id' | 'createdAt'>) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, data);
    }
  };

  const handleIndicatorClick = (filter: 'all' | 'conflicts' | 'deadlines' | 'review') => {
    if (filter === 'conflicts') {
      setActiveTab('conflicts');
    } else {
      setEventFilter(filter);
      setActiveTab('events');
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. CINEMATIC HERO SECTION (Section 2) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#121620] to-[#0E121A] border border-[#1F2637] p-6 sm:p-10 shadow-2xl">
        {/* Subtle background radial glow */}
        <div className="absolute top-0 right-1/4 -mt-20 w-96 h-96 bg-[#D7FF64]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-20 w-80 h-80 bg-[#63E6FF]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181D29] border border-[#2A3449] text-[11px] font-mono-code text-[#D7FF64]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF64] animate-pulse" />
              <span>ACADEMIC INTELLIGENCE SYSTEM · HIGH PRECISION ENGINE</span>
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.05]">
              Your notices.<br />
              <span className="text-[#D7FF64] underline decoration-[#D7FF64]/30 decoration-wavy decoration-2">
                Understood.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#9299A8] max-w-lg leading-relaxed">
              From scattered college circulars to a schedule you can actually trust.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('analyze')}
                className="px-5 py-3 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-xl transition-all shadow-[0_0_20px_rgba(215,255,100,0.3)] hover:shadow-[0_0_30px_rgba(215,255,100,0.45)] cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#0B0D12]" />
                <span>ANALYZE A NOTICE</span>
              </button>

              <button
                onClick={loadSampleDataset}
                className="px-5 py-3 text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-[#181D29] hover:bg-[#202738] border border-[#2A3449] rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-[#63E6FF]" />
                <span>LOAD LIVE DEMO</span>
              </button>
            </div>
          </div>

          {/* Right Visual: Floating Notice Document Transforming Into Structured Event Strips (Section 2) */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md p-5 rounded-2xl bg-[#0B0D12]/90 border border-[#1F2637] shadow-2xl backdrop-blur-md space-y-3">
              {/* Top document simulation snippet */}
              <div className="p-3 rounded-lg bg-[#121620] border border-[#2A3449]/60 text-[11px] font-mono-code text-slate-400 leading-snug">
                <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 mb-1 border-b border-[#1F2637]">
                  <span>RAW CIRCULAR EXCERPT</span>
                  <span className="text-[#D7FF64]">INPUT STREAM</span>
                </div>
                "Internal Test 2 will be held on 13 Nov from 10:00 to 11:30 AM..."
              </div>

              {/* Luminous transformation connector beam */}
              <div className="flex items-center justify-center py-0.5">
                <div className="w-px h-6 bg-gradient-to-b from-[#63E6FF] via-[#D7FF64] to-transparent shadow-[0_0_8px_#D7FF64]" />
              </div>

              {/* Structured Output Strips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141629] border border-[#6366F1]/50 text-xs text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-[#6366F1]/20 text-[#6366F1] font-bold">
                      TEST
                    </span>
                    <span className="font-semibold text-xs truncate max-w-[140px]">Internal Test 2</span>
                  </div>
                  <span className="font-mono-code text-[11px] text-[#9299A8]">10:00 AM</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#101C26] border border-[#63E6FF]/50 text-xs text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-[#63E6FF]/20 text-[#63E6FF] font-bold">
                      LECTURE
                    </span>
                    <span className="font-semibold text-xs truncate max-w-[140px]">AI in Healthcare</span>
                  </div>
                  <span className="font-mono-code text-[11px] text-[#9299A8]">11:00 AM</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#1A1812] border border-[#FFC86B]/50 text-xs text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-[#FFC86B]/20 text-[#FFC86B] font-bold">
                      DEADLINE
                    </span>
                    <span className="font-semibold text-xs truncate max-w-[140px]">Lab Records</span>
                  </div>
                  <span className="font-mono-code text-[11px] text-[#FFC86B]">12:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE COMMAND CENTER: Asymmetric Layout (Section 3) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT (lg:col-span-7): "TODAY'S SIGNAL" Panel */}
        <div className="lg:col-span-7 bg-[#121620] border border-[#1F2637] rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#1F2637] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D7FF64] shadow-[0_0_8px_#D7FF64]" />
              <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
                TODAY'S SIGNAL
              </h3>
            </div>
            <span className="text-[11px] font-mono-code text-[#63E6FF]">
              {primarySignalEvent ? formatDateDisplay(primarySignalEvent.date) : 'NO SIGNAL'}
            </span>
          </div>

          {primarySignalEvent ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-md uppercase ${
                      primarySignalEvent.type === 'Exam'
                        ? 'bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/30'
                        : primarySignalEvent.isDeadline
                        ? 'bg-[#FFC86B]/20 text-[#FFC86B] border border-[#FFC86B]/30'
                        : 'bg-[#63E6FF]/20 text-[#63E6FF] border border-[#63E6FF]/30'
                    }`}
                  >
                    {primarySignalEvent.type}
                  </span>
                  {primarySignalConflict && (
                    <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-md bg-[#FF647C]/20 text-[#FF647C] border border-[#FF647C]/30 animate-pulse">
                      ACTIVE CLASH
                    </span>
                  )}
                </div>

                <h4 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight pt-1">
                  {primarySignalEvent.title}
                </h4>
              </div>

              {/* Time and Location metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-[#181D29] border border-[#2A3449] space-y-1">
                  <span className="text-[10px] font-mono-code text-[#9299A8] uppercase">Interval</span>
                  <p className="text-sm font-mono-code font-bold text-[#D7FF64] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#D7FF64]" />
                    <span>
                      {primarySignalEvent.startTime}
                      {primarySignalEvent.endTime ? ` – ${primarySignalEvent.endTime}` : ''}
                    </span>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#181D29] border border-[#2A3449] space-y-1">
                  <span className="text-[10px] font-mono-code text-[#9299A8] uppercase">Assigned Venue</span>
                  <p className="text-sm font-mono-code font-semibold text-white flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#63E6FF]" />
                    <span>{primarySignalEvent.venue || 'Campus Venue'}</span>
                  </p>
                </div>
              </div>

              {/* Action recommendation */}
              {primarySignalConflict && (
                <div className="p-3.5 rounded-xl bg-[#1C141B] border border-[#FF647C]/40 text-xs text-[#FF647C] space-y-1">
                  <strong className="block font-mono-code">Collision Warning:</strong>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {primarySignalConflict.description} {primarySignalConflict.suggestion}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#1F2637]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInspectingEvent(primarySignalEvent)}
                    className="px-3 py-1.5 text-xs font-mono-code text-[#D7FF64] hover:bg-[#181D29] border border-[#2A3449] hover:border-[#D7FF64]/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Inspect supporting sentence in notice"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D7FF64]" />
                    <span>Evidence Dossier</span>
                  </button>

                  <button
                    onClick={() => handleEditClick(primarySignalEvent)}
                    className="px-3 py-1.5 text-xs font-mono-code text-slate-300 hover:text-white bg-[#181D29] hover:bg-[#202738] border border-[#2A3449] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {primarySignalConflict && (
                    <button
                      onClick={() => setActiveTab('conflicts')}
                      className="px-3 py-1.5 text-xs font-mono-code font-bold text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#0B0D12]" />
                      <span>Simulate Alternative</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('events')}
                    className="text-xs font-mono-code text-[#63E6FF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Schedule</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-mono-code text-slate-400">Nothing decoded yet.</p>
              <p className="text-xs text-slate-500">Drop in a college notice to discover your next important dates.</p>
              <button
                onClick={() => setActiveTab('analyze')}
                className="mt-2 px-4 py-2 text-xs font-mono-code font-bold text-[#0B0D12] bg-[#D7FF64] rounded-lg cursor-pointer"
              >
                Analyze First Notice
              </button>
            </div>
          )}
        </div>

        {/* RIGHT (lg:col-span-5): Compact Vertical Stack of Operational Indicators (Section 3) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-[#121620] border border-[#1F2637] rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-400 px-1">
              OPERATIONAL METRICS
            </h3>

            {/* Indicator 1: EVENTS EXTRACTED */}
            <div
              onClick={() => handleIndicatorClick('all')}
              className="p-3.5 rounded-2xl bg-[#181D29] border border-[#2A3449] hover:border-[#63E6FF]/50 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] font-mono-code text-[#9299A8] uppercase tracking-wider block">
                  EVENTS EXTRACTED
                </span>
                <span className="text-2xl font-mono-code font-extrabold text-white tabular-nums">
                  {stats.totalEvents}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#121620] border border-[#2A3449] flex items-center justify-center text-[#63E6FF] group-hover:scale-105 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            {/* Indicator 2: ACTIVE CONFLICTS */}
            <div
              onClick={() => handleIndicatorClick('conflicts')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                stats.conflictCount > 0
                  ? 'bg-[#1C141B] border-[#FF647C]/50 hover:border-[#FF647C]'
                  : 'bg-[#181D29] border-[#2A3449] hover:border-[#D7FF64]/50'
              }`}
            >
              <div>
                <span className="text-[10px] font-mono-code text-[#9299A8] uppercase tracking-wider block">
                  ACTIVE CONFLICTS
                </span>
                <span
                  className={`text-2xl font-mono-code font-extrabold tabular-nums ${
                    stats.conflictCount > 0 ? 'text-[#FF647C]' : 'text-white'
                  }`}
                >
                  {stats.conflictCount}
                </span>
              </div>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
                  stats.conflictCount > 0
                    ? 'bg-[#FF647C]/20 border border-[#FF647C]/40 text-[#FF647C]'
                    : 'bg-[#121620] border border-[#2A3449] text-[#D7FF64]'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            {/* Indicator 3: DEADLINES TO REVIEW */}
            <div
              onClick={() => handleIndicatorClick('deadlines')}
              className="p-3.5 rounded-2xl bg-[#181D29] border border-[#2A3449] hover:border-[#FFC86B]/50 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] font-mono-code text-[#9299A8] uppercase tracking-wider block">
                  DEADLINES TO REVIEW
                </span>
                <span className="text-2xl font-mono-code font-extrabold text-[#FFC86B] tabular-nums">
                  {stats.upcomingDeadlines}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#121620] border border-[#2A3449] flex items-center justify-center text-[#FFC86B] group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            {/* Indicator 4: FIELDS NEEDING REVIEW */}
            <div
              onClick={() => handleIndicatorClick('review')}
              className="p-3.5 rounded-2xl bg-[#181D29] border border-[#2A3449] hover:border-[#63E6FF]/50 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] font-mono-code text-[#9299A8] uppercase tracking-wider block">
                  FIELDS NEEDING REVIEW
                </span>
                <span className="text-2xl font-mono-code font-extrabold text-[#63E6FF] tabular-nums">
                  {stats.reviewCount}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#121620] border border-[#2A3449] flex items-center justify-center text-[#63E6FF] group-hover:scale-105 transition-transform">
                <HelpCircle className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Recent Notice Activity from localStorage */}
          <div className="bg-[#121620] border border-[#1F2637] rounded-3xl p-5 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-code text-slate-400">
              <span className="uppercase">Recent Circular History</span>
              <span>{notices.length} logged</span>
            </div>
            {notices.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No notices stored yet.</p>
            ) : (
              <div className="space-y-1.5">
                {notices.slice(0, 2).map(n => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-[#181D29] border border-[#2A3449] text-xs">
                    <p className="font-semibold text-white truncate">{n.title}</p>
                    <p className="text-[11px] font-mono-code text-[#9299A8] mt-0.5">
                      {n.extractedEventsCount} events · {new Date(n.analyzedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. SIGNATURE FEATURE: TEMPORAL CONFLICT MAP (Section 4) */}
      <section>
        <TemporalConflictMap onOpenEditEvent={handleEditClick} />
      </section>

      {/* 4. EDITORIAL SCHEDULE STRIPS (Section 6) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1F2637] pb-3">
          <div>
            <h3 className="text-lg font-bold font-display tracking-tight text-white">
              Schedule Registry
            </h3>
            <p className="text-xs text-[#9299A8]">
              Confirmed academic calendar entries formatted as editorial strips
            </p>
          </div>
          <button
            onClick={() => setActiveTab('events')}
            className="text-xs font-mono-code text-[#63E6FF] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Inspect All ({events.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {events.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#121620] border border-[#1F2637] text-center space-y-2">
            <p className="text-sm font-mono-code text-[#9299A8]">Nothing decoded yet.</p>
            <p className="text-xs text-slate-500">Drop in a college notice to discover your next important dates.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {events.map(evt => {
              const isClashing = conflicts.some(
                c => c.eventA.id === evt.id || c.eventB.id === evt.id
              );

              return (
                <div
                  key={evt.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isClashing
                      ? 'bg-[#18121A] border-[#FF647C]/80 ring-1 ring-[#FF647C]/30'
                      : evt.isDeadline
                      ? 'bg-[#1A1812] border-[#FFC86B]/60'
                      : 'bg-[#121620] border-[#1F2637] hover:border-[#2A3449]'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Large time label on the left (Section 6) */}
                    <div className="w-28 shrink-0 font-mono-code text-xs font-bold text-[#D7FF64]">
                      <span>{evt.startTime || 'ALL DAY'}</span>
                      {evt.endTime && (
                        <span className="block text-[11px] text-[#9299A8] font-normal">
                          until {evt.endTime}
                        </span>
                      )}
                    </div>

                    {/* Colored event-type indicator bar */}
                    <div
                      className={`w-1 h-8 rounded-full shrink-0 ${
                        isClashing
                          ? 'bg-[#FF647C]'
                          : evt.isDeadline
                          ? 'bg-[#FFC86B]'
                          : evt.type === 'Exam'
                          ? 'bg-[#6366F1]'
                          : 'bg-[#63E6FF]'
                      }`}
                    />

                    {/* Event title & venue */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{evt.title}</span>
                        {isClashing && (
                          <span className="text-[10px] font-mono-code font-bold px-1.5 py-0.2 rounded bg-[#FF647C]/20 text-[#FF647C]">
                            CLASH
                          </span>
                        )}
                        {evt.isDeadline && (
                          <span className="text-[10px] font-mono-code font-bold px-1.5 py-0.2 rounded bg-[#FFC86B]/20 text-[#FFC86B]">
                            DEADLINE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono-code text-[#9299A8] mt-0.5">
                        <span>{formatDateDisplay(evt.date)}</span>
                        {evt.venue && (
                          <>
                            <span>·</span>
                            <span className="truncate">{evt.venue}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleEditClick(evt)}
                      className="px-3 py-1.5 text-xs font-mono-code text-slate-300 hover:text-white bg-[#181D29] hover:bg-[#202738] border border-[#2A3449] rounded-lg transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Edit Modal */}
      <EventModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveModal}
        initialEvent={editingEvent}
      />
    </div>
  );
};
