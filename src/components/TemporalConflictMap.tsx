import React, { useState, useMemo } from 'react';
import { useNotice } from '../context/NoticeContext';
import { NoticeEvent, Conflict } from '../types/notice';
import { timeToMinutes, minutesToTimeString, formatDateDisplay } from '../utils/parser';
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Info,
  Calendar,
  MapPin,
  CheckCircle2,
  X,
  Edit3,
  Sliders
} from 'lucide-react';
import { EventModal } from './EventModal';

interface TemporalConflictMapProps {
  onOpenEditEvent?: (event: NoticeEvent) => void;
  onOpenSimulator?: (conflict: Conflict) => void;
}

export const TemporalConflictMap: React.FC<TemporalConflictMapProps> = ({
  onOpenEditEvent,
  onOpenSimulator,
}) => {
  const { events, conflicts, updateEvent, setInspectingEvent } = useNotice();
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [editingEvent, setEditingEvent] = useState<NoticeEvent | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, NoticeEvent[]> = {};
    events.forEach(e => {
      const d = e.date || 'Unspecified';
      if (!map[d]) map[d] = [];
      map[d].push(e);
    });
    return map;
  }, [events]);

  // Primary active date to visualize on timeline (prefer dates with conflicts, or first date)
  const activeDate = useMemo(() => {
    if (conflicts.length > 0 && conflicts[0].date) {
      return conflicts[0].date;
    }
    const dates = Object.keys(eventsByDate);
    return dates.length > 0 ? dates[0] : '';
  }, [conflicts, eventsByDate]);

  const activeDayEvents = useMemo(() => {
    return eventsByDate[activeDate] || [];
  }, [eventsByDate, activeDate]);

  const activeDayConflicts = useMemo(() => {
    return conflicts.filter(c => c.date === activeDate);
  }, [conflicts, activeDate]);

  // Calculate dynamic ruler bounds (in minutes from midnight)
  const { minRulerMin, maxRulerMin, totalSpan, hourTicks } = useMemo(() => {
    const mins: number[] = [];
    activeDayEvents.forEach(e => {
      const s = timeToMinutes(e.startTime);
      const end = timeToMinutes(e.endTime);
      if (s !== null) mins.push(s);
      if (end !== null) mins.push(end);
    });

    if (mins.length === 0) {
      return { minRulerMin: 540, maxRulerMin: 840, totalSpan: 300, hourTicks: [540, 600, 660, 720, 780, 840] };
    }

    const minRaw = Math.min(...mins);
    const maxRaw = Math.max(...mins);

    // Pad to nearest half hour
    const startBound = Math.max(0, Math.floor((minRaw - 30) / 60) * 60);
    const endBound = Math.min(1440, Math.ceil((maxRaw + 45) / 60) * 60);
    const span = Math.max(120, endBound - startBound);

    const ticks: number[] = [];
    for (let m = startBound; m <= endBound; m += 60) {
      ticks.push(m);
    }

    return { minRulerMin: startBound, maxRulerMin: endBound, totalSpan: span, hourTicks: ticks };
  }, [activeDayEvents]);

  const handleEditClick = (evt: NoticeEvent) => {
    if (onOpenEditEvent) {
      onOpenEditEvent(evt);
    } else {
      setEditingEvent(evt);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveModal = (data: Omit<NoticeEvent, 'id' | 'createdAt'>) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, data);
    }
  };

  if (!activeDate || activeDayEvents.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-[#121620] border border-[#1F2637] text-center space-y-2">
        <p className="text-sm font-mono-code text-[#9299A8]">No timed sessions to map.</p>
        <p className="text-xs text-slate-500">Analyze a circular to plot the temporal conflict map.</p>
      </div>
    );
  }

  // Filter timed sessions vs deadlines
  const timedSessions = activeDayEvents.filter(e => !e.isDeadline && e.startTime);
  const deadlineEvents = activeDayEvents.filter(e => e.isDeadline && e.startTime);

  return (
    <div className="space-y-4">
      {/* Container Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#121620] border border-[#1F2637] p-5 sm:p-7 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2637] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF647C] shadow-[0_0_8px_#FF647C] animate-pulse" />
              <h3 className="text-sm font-bold tracking-wider font-display uppercase text-white">
                Temporal Conflict Map
              </h3>
              <span className="text-xs font-mono-code text-[#9299A8]">· {formatDateDisplay(activeDate)}</span>
            </div>
            <p className="text-xs text-[#9299A8]">
              Mathematical timeline rendering of overlapping intervals and deadline intersections.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono-code">
            <span className="text-slate-400">Scale:</span>
            <span className="px-2.5 py-1 rounded bg-[#181D29] text-[#63E6FF] border border-[#2A3449]">
              {minutesToTimeString(minRulerMin)} – {minutesToTimeString(maxRulerMin)}
            </span>
          </div>
        </div>

        {/* DESKTOP / TABLET HORIZONTAL TIME RULER (Hidden on small mobile) */}
        <div className="hidden md:block space-y-6 pt-2">
          {/* Time Ruler Axis */}
          <div className="relative h-8 border-b border-[#2A3449] select-none">
            {hourTicks.map(t => {
              const posPercent = ((t - minRulerMin) / totalSpan) * 100;
              return (
                <div
                  key={t}
                  className="absolute -bottom-2 -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${posPercent}%` }}
                >
                  <span className="text-[10px] font-mono-code text-[#9299A8] mb-1">
                    {minutesToTimeString(t)}
                  </span>
                  <div className="w-px h-2.5 bg-[#2A3449]" />
                </div>
              );
            })}
          </div>

          {/* Interactive Events Track Canvas */}
          <div className="relative min-h-[190px] pt-4 space-y-3">
            {/* Background vertical hour grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              {hourTicks.map(t => {
                const posPercent = ((t - minRulerMin) / totalSpan) * 100;
                return (
                  <div
                    key={t}
                    className="absolute top-0 bottom-0 w-px bg-white/[0.03]"
                    style={{ left: `${posPercent}%` }}
                  />
                );
              })}
            </div>

            {/* Overlap Collision Highlight Zones (Section 4) */}
            {activeDayConflicts.map(c => {
              if (c.type === 'time_overlap' && c.overlapStartTime && c.overlapEndTime) {
                const s = timeToMinutes(c.overlapStartTime);
                const e = timeToMinutes(c.overlapEndTime);
                if (s !== null && e !== null) {
                  const leftP = Math.max(0, ((s - minRulerMin) / totalSpan) * 100);
                  const widthP = Math.min(100 - leftP, ((e - s) / totalSpan) * 100);

                  return (
                    <div
                      key={`overlap-zone-${c.id}`}
                      className="absolute top-0 bottom-0 z-10 pointer-events-none rounded-lg border-x-2 border-[#FF647C] bg-[#FF647C]/15 backdrop-blur-[1px] glow-red animate-pulse"
                      style={{ left: `${leftP}%`, width: `${widthP}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#FF647C] text-[#0B0D12] text-[10px] font-mono-code font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                        {c.overlapMinutes || 30} MIN OVERLAP
                      </div>
                    </div>
                  );
                }
              }
              return null;
            })}

            {/* Timed Session Blocks */}
            {timedSessions.map((evt, idx) => {
              const startM = timeToMinutes(evt.startTime) || minRulerMin;
              const endM = timeToMinutes(evt.endTime) || (startM + 60);

              const leftPercent = Math.max(0, ((startM - minRulerMin) / totalSpan) * 100);
              const widthPercent = Math.max(12, Math.min(100 - leftPercent, ((endM - startM) / totalSpan) * 100));

              const isClashing = activeDayConflicts.some(
                c => c.eventA.id === evt.id || c.eventB.id === evt.id
              );

              return (
                <div
                  key={evt.id}
                  className="relative group transition-all duration-150"
                  style={{
                    marginLeft: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                >
                  <div
                    className={`p-3 rounded-xl border text-xs shadow-md transition-all ${
                      isClashing
                        ? 'bg-[#18121A] border-[#FF647C] text-white ring-1 ring-[#FF647C]/40'
                        : evt.type === 'Exam'
                        ? 'bg-[#141629] border-[#6366F1]/60 text-white'
                        : 'bg-[#101C26] border-[#63E6FF]/50 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold truncate text-white">{evt.title}</span>
                      <span
                        className={`text-[9px] font-mono-code px-1.5 py-0.2 rounded uppercase ${
                          evt.type === 'Exam'
                            ? 'bg-[#6366F1]/20 text-[#6366F1]'
                            : 'bg-[#63E6FF]/20 text-[#63E6FF]'
                        }`}
                      >
                        {evt.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono-code text-[#9299A8]">
                      <span>{evt.startTime} – {evt.endTime}</span>
                      {evt.venue && (
                        <>
                          <span>·</span>
                          <span className="truncate">{evt.venue}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Vertical Marker Needle for Deadlines (Section 4) */}
            {deadlineEvents.map(dl => {
              const dlMin = timeToMinutes(dl.startTime);
              if (dlMin === null) return null;
              const posPercent = Math.max(0, Math.min(100, ((dlMin - minRulerMin) / totalSpan) * 100));

              // Check if falls inside any session
              const parentSession = timedSessions.find(ts => {
                const s = timeToMinutes(ts.startTime);
                const e = timeToMinutes(ts.endTime);
                return s !== null && e !== null && dlMin > s && dlMin <= e;
              });

              return (
                <div
                  key={`dl-marker-${dl.id}`}
                  className="absolute top-0 bottom-0 z-20 flex flex-col items-center pointer-events-auto"
                  style={{ left: `${posPercent}%` }}
                >
                  {/* Vertical luminous needle */}
                  <div className="w-0.5 h-full bg-[#FFC86B] shadow-[0_0_10px_#FFC86B]" />

                  {/* Top Flag */}
                  <div className="absolute -top-3 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded bg-[#FFC86B] text-[#0B0D12] text-[10px] font-mono-code font-bold shadow-lg whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    <span>{dl.startTime} DEADLINE</span>
                  </div>

                  {/* Warning banner below needle */}
                  {parentSession && (
                    <div className="absolute bottom-2 -translate-x-1/2 p-2 rounded-lg bg-[#181D29] border border-[#FFC86B]/50 text-[10px] text-[#FFC86B] font-mono-code shadow-md whitespace-nowrap">
                      ⚠️ Cutoff falls during "{parentSession.title}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* MOBILE FALLBACK AGENDA (Section 4) */}
        <div className="block md:hidden space-y-3 pt-2">
          {activeDayEvents.map(evt => {
            const isClashing = activeDayConflicts.some(
              c => c.eventA.id === evt.id || c.eventB.id === evt.id
            );

            return (
              <div
                key={`mob-${evt.id}`}
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  isClashing
                    ? 'bg-[#18121A] border-[#FF647C] text-white'
                    : evt.isDeadline
                    ? 'bg-[#1A1812] border-[#FFC86B]/60 text-white'
                    : 'bg-[#121620] border-[#1F2637] text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{evt.title}</span>
                  {isClashing && (
                    <span className="text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded bg-[#FF647C] text-[#0B0D12]">
                      COLLISION
                    </span>
                  )}
                  {evt.isDeadline && (
                    <span className="text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded bg-[#FFC86B] text-[#0B0D12]">
                      DEADLINE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono-code text-[#9299A8]">
                  <span>{evt.startTime} {evt.endTime ? `– ${evt.endTime}` : ''}</span>
                  {evt.venue && <span>· {evt.venue}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Compact Explanation & View Details Interaction (Section 4) */}
        <div className="pt-2 border-t border-[#1F2637] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            {activeDayConflicts.length > 0 ? (
              <div className="flex items-center gap-2 text-xs text-[#FF647C]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-medium">
                  {activeDayConflicts[0].description}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#D7FF64]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Zero collisions. Non-overlapping time boundaries verified.</span>
              </div>
            )}
          </div>

          {activeDayConflicts.length > 0 && (
            <button
              onClick={() => setSelectedConflict(activeDayConflicts[0])}
              className="px-3.5 py-1.5 text-xs font-mono-code font-semibold text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <span>View Conflict Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* CONFLICT DETAIL MODAL / DRAWER (Section 7) */}
      {selectedConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121620] border border-[#2A3449] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl p-6 space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-[#1F2637] pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[#FF647C]/20 text-[#FF647C] border border-[#FF647C]/40">
                  CONFIRMED CONFLICT
                </span>
                <h4 className="text-sm font-bold text-white">{selectedConflict.title}</h4>
              </div>
              <button
                onClick={() => setSelectedConflict(null)}
                className="p-1 text-[#9299A8] hover:text-white rounded-lg hover:bg-[#181D29]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overlapping items cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#181D29] border border-[#2A3449] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{selectedConflict.eventA.title}</span>
                  <button
                    onClick={() => {
                      setSelectedConflict(null);
                      handleEditClick(selectedConflict.eventA);
                    }}
                    className="text-[10px] font-mono-code text-[#63E6FF] hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <p className="font-mono-code text-[#9299A8]">
                  {selectedConflict.eventA.startTime} {selectedConflict.eventA.endTime ? `– ${selectedConflict.eventA.endTime}` : ''}
                </p>
                {selectedConflict.eventA.venue && (
                  <p className="text-[11px] text-slate-400">Venue: {selectedConflict.eventA.venue}</p>
                )}
                {selectedConflict.eventA.rawSnippet && (
                  <p className="text-[10px] text-slate-500 italic mt-1 border-t border-[#2A3449] pt-1">
                    "{selectedConflict.eventA.rawSnippet}"
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[#181D29] border border-[#2A3449] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{selectedConflict.eventB.title}</span>
                  <button
                    onClick={() => {
                      setSelectedConflict(null);
                      handleEditClick(selectedConflict.eventB);
                    }}
                    className="text-[10px] font-mono-code text-[#63E6FF] hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <p className="font-mono-code text-[#9299A8]">
                  {selectedConflict.eventB.startTime} {selectedConflict.eventB.endTime ? `– ${selectedConflict.eventB.endTime}` : ''}
                </p>
                {selectedConflict.eventB.venue && (
                  <p className="text-[11px] text-slate-400">Venue: {selectedConflict.eventB.venue}</p>
                )}
                {selectedConflict.eventB.rawSnippet && (
                  <p className="text-[10px] text-slate-500 italic mt-1 border-t border-[#2A3449] pt-1">
                    "{selectedConflict.eventB.rawSnippet}"
                  </p>
                )}
              </div>
            </div>

            {/* Why the rule triggered & suggested step */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#1F141A] border border-[#FF647C]/30 text-[#FF647C]">
                <strong className="block mb-0.5">Rule Collision Trigger:</strong>
                <span>{selectedConflict.description}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0F2027] border border-[#63E6FF]/30 text-[#63E6FF]">
                <strong className="block mb-0.5">Suggested Next Step:</strong>
                <span className="text-slate-300">{selectedConflict.suggestion}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1F2637]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const evt = selectedConflict.eventA;
                    setSelectedConflict(null);
                    setInspectingEvent(evt);
                  }}
                  className="px-2.5 py-1.5 text-[11px] font-mono-code text-[#D7FF64] hover:bg-[#181D29] border border-[#2A3449] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D7FF64]" />
                  <span>Evidence A</span>
                </button>
                <button
                  onClick={() => {
                    const evt = selectedConflict.eventB;
                    setSelectedConflict(null);
                    setInspectingEvent(evt);
                  }}
                  className="px-2.5 py-1.5 text-[11px] font-mono-code text-[#D7FF64] hover:bg-[#181D29] border border-[#2A3449] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D7FF64]" />
                  <span>Evidence B</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedConflict(null)}
                  className="px-3.5 py-1.5 text-xs font-mono-code text-slate-300 bg-[#181D29] hover:bg-[#2A3449] rounded-lg cursor-pointer"
                >
                  Close
                </button>

                {onOpenSimulator && (
                  <button
                    onClick={() => {
                      const c = selectedConflict;
                      setSelectedConflict(null);
                      onOpenSimulator(c);
                    }}
                    className="px-4 py-1.5 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-lg transition-all shadow-[0_0_12px_rgba(215,255,100,0.25)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#0B0D12]" />
                    <span>Simulate Alternative</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
