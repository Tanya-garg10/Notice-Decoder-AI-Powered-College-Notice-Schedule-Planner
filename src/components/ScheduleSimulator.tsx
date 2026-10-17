import React, { useState } from 'react';
import { useNotice } from '../context/NoticeContext';
import { NoticeEvent, Conflict } from '../types/notice';
import { timeToMinutes, minutesToTimeString, formatDateDisplay } from '../utils/parser';
import {
  Sliders,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Clock,
  Calendar,
  Lock,
  Layers,
  Info
} from 'lucide-react';

interface ScheduleSimulatorProps {
  conflict?: Conflict | null;
  onClose?: () => void;
}

export const ScheduleSimulator: React.FC<ScheduleSimulatorProps> = ({ conflict, onClose }) => {
  const {
    events,
    conflicts,
    simulation,
    startSimulation,
    updateSimulationModifications,
    applySimulation,
    discardSimulation,
    simulatedEvents,
    simulatedConflicts,
  } = useNotice();

  // If a specific conflict is passed, let user toggle which event to simulate modifying
  const initialTarget = conflict?.eventB || (events.length > 0 ? events[0] : null);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    simulation?.targetEventId || initialTarget?.id || ''
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // Synchronize target event if simulation starts
  React.useEffect(() => {
    if (conflict && (!simulation || simulation.targetEventId !== selectedTargetId)) {
      // By default prefer non-exam event (e.g. Guest Lecture instead of Exam), or eventB
      const preferred = conflict.eventB.type !== 'Exam' ? conflict.eventB : conflict.eventA;
      setSelectedTargetId(preferred.id);
      const ok = startSimulation(preferred.id);
      if (!ok) {
        setValidationError('Cannot simulate: Selected event lacks date or timing parameters.');
      } else {
        setValidationError(null);
      }
    }
  }, [conflict]);

  const targetEvent = events.find(e => e.id === selectedTargetId);
  const otherEventInConflict = conflict
    ? (conflict.eventA.id === selectedTargetId ? conflict.eventB : conflict.eventA)
    : null;

  // Handle switching target event
  const handleSwitchTarget = (id: string) => {
    setSelectedTargetId(id);
    const ok = startSimulation(id);
    if (!ok) {
      setValidationError('Cannot simulate: Selected event is missing mandatory date or time parameters.');
    } else {
      setValidationError(null);
    }
  };

  // Overlap metrics before and after
  const beforeConflicts = conflicts;
  const afterConflicts = simulatedConflicts;

  const relevantBefore = conflict
    ? beforeConflicts.find(c => c.id === conflict.id)
    : beforeConflicts[0];

  const relevantAfter = conflict
    ? afterConflicts.find(c => c.id === conflict.id)
    : afterConflicts[0];

  const overlapBeforeMins = relevantBefore?.overlapMinutes || (relevantBefore?.type === 'deadline_inside_event' ? 30 : 0);
  const overlapAfterMins = relevantAfter?.overlapMinutes || (relevantAfter?.type === 'deadline_inside_event' ? 30 : 0);
  const isResolved = !relevantAfter;

  // Preset time shifts
  const applyPreset = (start: string, end: string) => {
    updateSimulationModifications({
      startTime: start,
      endTime: end,
    });
  };

  if (!targetEvent) {
    return (
      <div className="p-6 rounded-2xl bg-[#121620] border border-[#1F2637] text-center space-y-2">
        <p className="text-sm font-mono-code text-[#9299A8]">No target event available for simulation.</p>
      </div>
    );
  }

  const isExam = targetEvent.type === 'Exam';

  return (
    <div className="rounded-2xl bg-[#121620] border-2 border-[#D7FF64]/40 shadow-2xl overflow-hidden space-y-0 relative">
      {/* Simulation Mode Glowing Status Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-[#181D29] via-[#1A231C] to-[#181D29] border-b border-[#D7FF64]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D7FF64] shadow-[0_0_8px_#D7FF64] animate-pulse" />
          <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#D7FF64]" />
            <span>WHAT-IF SCHEDULE SIMULATOR</span>
          </span>
          <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded bg-[#D7FF64]/20 text-[#D7FF64] border border-[#D7FF64]/40">
            SIMULATION MODE — NOT SAVED
          </span>
        </div>

        {onClose && (
          <button
            onClick={() => {
              discardSimulation();
              onClose();
            }}
            className="text-[#9299A8] hover:text-white p-1 rounded-lg transition-colors cursor-pointer self-end sm:self-auto"
            aria-label="Close simulator"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Validation Error if any */}
        {validationError && (
          <div className="p-3.5 rounded-xl bg-[#1C141B] border border-[#FF647C]/40 text-[#FF647C] text-xs font-mono-code flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Target Event Selector if part of collision */}
        {conflict && (
          <div className="space-y-2">
            <label className="text-xs font-mono-code text-[#9299A8] uppercase tracking-wider block">
              Choose Event to Simulate Modifying
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[conflict.eventA, conflict.eventB].map(evt => {
                const isSelected = evt.id === selectedTargetId;
                const isEvtExam = evt.type === 'Exam';
                return (
                  <button
                    key={evt.id}
                    onClick={() => handleSwitchTarget(evt.id)}
                    className={`p-3 rounded-xl border text-left font-mono-code transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#181D29] border-[#D7FF64] shadow-[0_0_15px_rgba(215,255,100,0.15)] text-white'
                        : 'bg-[#0B0D12] border-[#2A3449] text-[#9299A8] hover:text-white hover:border-[#1F2637]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate max-w-[170px]">{evt.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#121620] border border-[#2A3449] text-[#63E6FF]">
                        {evt.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {evt.startTime} {evt.endTime ? `– ${evt.endTime}` : ''} ({evt.venue || 'No venue'})
                    </div>
                    {isEvtExam && (
                      <div className="text-[10px] text-[#FFC86B] mt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Fixed Academic Assessment</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Exam Protection Guardrail */}
        {isExam && (
          <div className="p-3.5 rounded-xl bg-[#1C1914] border border-[#FFC86B]/40 text-[#FFC86B] text-xs font-mono-code flex items-start gap-2">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#FFC86B]" />
            <span>
              <strong>Fixed Official Assessment Notice:</strong> "{targetEvent.title}" is an examination scheduled by university departments. Modifying its time will not automatically alter official schedules without faculty approval.
            </span>
          </div>
        )}

        {/* Interactive Parameter Controls */}
        <div className="bg-[#0B0D12] rounded-xl border border-[#1F2637] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2637] pb-3">
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-white">
              Simulate Alternative Timings for: <span className="text-[#D7FF64]">{targetEvent.title}</span>
            </span>
            <span className="text-[10px] font-mono-code text-[#63E6FF]">
              REAL-TIME RECALCULATION
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono-code text-[#9299A8] mb-1 uppercase tracking-wider">
                Simulated Date
              </label>
              <input
                type="date"
                value={simulation?.modifications.date || targetEvent.date}
                onChange={e => updateSimulationModifications({ date: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono-code bg-[#121620] border border-[#2A3449] rounded-xl text-white focus:outline-none focus:border-[#D7FF64]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono-code text-[#9299A8] mb-1 uppercase tracking-wider">
                Simulated Start Time
              </label>
              <input
                type="text"
                value={simulation?.modifications.startTime || targetEvent.startTime}
                onChange={e => updateSimulationModifications({ startTime: e.target.value })}
                placeholder="e.g. 12:30 PM"
                className="w-full px-3 py-2 text-xs font-mono-code bg-[#121620] border border-[#2A3449] rounded-xl text-white focus:outline-none focus:border-[#D7FF64]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono-code text-[#9299A8] mb-1 uppercase tracking-wider">
                Simulated End Time
              </label>
              <input
                type="text"
                value={simulation?.modifications.endTime || targetEvent.endTime}
                onChange={e => updateSimulationModifications({ endTime: e.target.value })}
                placeholder="e.g. 02:00 PM"
                className="w-full px-3 py-2 text-xs font-mono-code bg-[#121620] border border-[#2A3449] rounded-xl text-white focus:outline-none focus:border-[#D7FF64]"
              />
            </div>
          </div>

          {/* Quick Presets for College Schedules (Specifically tailored to 13 Nov scenario) */}
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono-code text-[#9299A8]">Quick Shift Presets:</span>
            <button
              onClick={() => applyPreset('12:30 PM', '02:00 PM')}
              className="px-2.5 py-1 text-[11px] font-mono-code font-bold bg-[#181D29] hover:bg-[#202738] text-[#D7FF64] border border-[#2A3449] hover:border-[#D7FF64]/50 rounded-lg transition-colors cursor-pointer"
            >
              Move to 12:30 PM – 2:00 PM (After Test & Deadline)
            </button>
            <button
              onClick={() => applyPreset('01:00 PM', '02:30 PM')}
              className="px-2.5 py-1 text-[11px] font-mono-code bg-[#181D29] hover:bg-[#202738] text-slate-300 hover:text-white border border-[#2A3449] rounded-lg transition-colors cursor-pointer"
            >
              Shift +2 Hours (1:00 – 2:30 PM)
            </button>
            <button
              onClick={() => applyPreset('02:00 PM', '03:30 PM')}
              className="px-2.5 py-1 text-[11px] font-mono-code bg-[#181D29] hover:bg-[#202738] text-slate-300 hover:text-white border border-[#2A3449] rounded-lg transition-colors cursor-pointer"
            >
              Afternoon Slot (2:00 – 3:30 PM)
            </button>
          </div>
        </div>

        {/* BEFORE & AFTER TIMELINE COMPARISON */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2637] pb-2">
            <h4 className="text-xs font-mono-code font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#63E6FF]" />
              <span>Before & After Collision Timeline Comparison</span>
            </h4>
            <div className="text-xs font-mono-code">
              {isResolved ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 font-bold">
                  ✓ ALL COLLISIONS RESOLVED (0 MINS OVERLAP)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-950/60 text-[#FF647C] border border-[#FF647C]/40 font-bold">
                  ⚠ {overlapAfterMins} MINS REMAINING OVERLAP
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. ORIGINAL STATE (BEFORE) */}
            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#FF647C]/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="font-bold text-[#FF647C] uppercase">1. CURRENT SAVED SCHEDULE</span>
                <span className="px-2 py-0.5 rounded bg-[#1C141B] text-[#FF647C] border border-[#FF647C]/30 text-[10px] font-bold">
                  {overlapBeforeMins} MINS OVERLAP
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono-code text-slate-300">
                <div className="p-2.5 rounded-lg bg-[#181D29] border border-[#2A3449] flex items-center justify-between">
                  <span className="truncate">{targetEvent.title}</span>
                  <span className="text-[#63E6FF]">{targetEvent.startTime} – {targetEvent.endTime || 'Deadline'}</span>
                </div>
                {otherEventInConflict && (
                  <div className="p-2.5 rounded-lg bg-[#181D29] border border-[#2A3449] flex items-center justify-between">
                    <span className="truncate">{otherEventInConflict.title}</span>
                    <span className="text-[#63E6FF]">{otherEventInConflict.startTime} – {otherEventInConflict.endTime || 'Deadline'}</span>
                  </div>
                )}
              </div>

              {/* Visual mini-bar representation */}
              <div className="pt-2">
                <div className="h-6 rounded-lg bg-[#181D29] relative overflow-hidden flex items-center px-2">
                  <div className="absolute left-[30%] w-[45%] h-full bg-[#6366F1]/30 border border-[#6366F1]" />
                  <div className="absolute left-[40%] w-[40%] h-full bg-[#FF647C]/30 border border-[#FF647C]" />
                  <div className="relative z-10 text-[10px] font-mono-code text-[#FF647C] font-bold">
                    Collision Window (11:00 – 11:30 AM)
                  </div>
                </div>
              </div>
            </div>

            {/* 2. PROPOSED SIMULATED STATE (AFTER) */}
            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#D7FF64]/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="font-bold text-[#D7FF64] uppercase">2. PROPOSED SIMULATION</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  isResolved
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                    : 'bg-[#1C141B] text-[#FF647C] border-[#FF647C]/30'
                }`}>
                  {isResolved ? '0 MINS OVERLAP' : `${overlapAfterMins} MINS OVERLAP`}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono-code text-slate-300">
                <div className="p-2.5 rounded-lg bg-[#1A231C] border border-[#D7FF64]/40 flex items-center justify-between text-white">
                  <span className="truncate font-semibold">{targetEvent.title} (Simulated)</span>
                  <span className="text-[#D7FF64] font-bold">
                    {simulation?.modifications.startTime || targetEvent.startTime} – {simulation?.modifications.endTime || targetEvent.endTime}
                  </span>
                </div>
                {otherEventInConflict && (
                  <div className="p-2.5 rounded-lg bg-[#181D29] border border-[#2A3449] flex items-center justify-between">
                    <span className="truncate">{otherEventInConflict.title} (Unchanged)</span>
                    <span className="text-[#63E6FF]">{otherEventInConflict.startTime} – {otherEventInConflict.endTime || 'Deadline'}</span>
                  </div>
                )}
              </div>

              {/* Visual mini-bar representation */}
              <div className="pt-2">
                <div className="h-6 rounded-lg bg-[#181D29] relative overflow-hidden flex items-center px-2">
                  <div className="absolute left-[15%] w-[35%] h-full bg-[#6366F1]/30 border border-[#6366F1]" />
                  <div className="absolute left-[55%] w-[40%] h-full bg-[#D7FF64]/30 border border-[#D7FF64]" />
                  <div className="relative z-10 text-[10px] font-mono-code text-emerald-400 font-bold">
                    {isResolved ? '✓ Clear Gap (Zero Overlap)' : 'Remaining Collision'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS: APPLY VS DISCARD */}
        <div className="pt-4 border-t border-[#1F2637] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] font-mono-code text-[#9299A8]">
            {isResolved ? (
              <span className="text-emerald-400 font-semibold">
                ✓ Applying will update this event and clear all {conflict ? '1 collision' : 'collisions'}.
              </span>
            ) : (
              <span>Simulated change reduces collision but does not completely eliminate it.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                discardSimulation();
                if (onClose) onClose();
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-mono-code text-slate-300 hover:text-white bg-[#181D29] hover:bg-[#202738] border border-[#2A3449] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#9299A8]" />
              <span>Discard Simulation</span>
            </button>

            <button
              onClick={() => {
                applySimulation();
                if (onClose) onClose();
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-xl transition-all shadow-[0_0_20px_rgba(215,255,100,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#0B0D12]" />
              <span>Apply Changes to Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
