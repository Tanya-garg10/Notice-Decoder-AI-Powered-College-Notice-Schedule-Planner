import React, { useState } from 'react';
import { useNotice } from '../context/NoticeContext';
import { NoticeEvent, Conflict } from '../types/notice';
import { formatDateDisplay } from '../utils/parser';
import { TemporalConflictMap } from './TemporalConflictMap';
import { EventModal } from './EventModal';
import { ScheduleSimulator } from './ScheduleSimulator';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  Edit2,
  Calendar,
  MapPin,
  PlayCircle,
  FileCheck,
  ArrowRight,
  Info,
  RotateCcw,
  Sliders,
  Eye,
  Check,
  Layers
} from 'lucide-react';

export const ConflictCenterView: React.FC = () => {
  const {
    conflicts,
    events,
    updateEvent,
    loadScenario,
    setInspectingEvent,
    simulation,
    startSimulation,
    applySimulation,
    discardSimulation,
    simulatedConflicts,
  } = useNotice();

  const [editingEvent, setEditingEvent] = useState<NoticeEvent | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeScenarioLabel, setActiveScenarioLabel] = useState<string>('Official Sample Circular');
  const [activeSimulatorConflict, setActiveSimulatorConflict] = useState<Conflict | null>(null);

  const handleEdit = (evt: NoticeEvent) => {
    setEditingEvent(evt);
    setIsEditModalOpen(true);
  };

  const handleSaveModal = (data: Omit<NoticeEvent, 'id' | 'createdAt'>) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, data);
    }
  };

  const handleScenarioSelect = (testType: 'sample' | 'backtoback' | 'differentdates' | 'incomplete', label: string) => {
    loadScenario(testType);
    setActiveScenarioLabel(label);
    setActiveSimulatorConflict(null);
  };

  const handleOpenSimulator = (conflict: Conflict) => {
    setActiveSimulatorConflict(conflict);
    // Start simulation with event B (or non-exam event)
    const target = conflict.eventB.type !== 'Exam' ? conflict.eventB : conflict.eventA;
    startSimulation(target.id);
  };

  return (
    <div className="space-y-8">
      {/* Title & Status */}
      <div className="pb-3 border-b border-[#1F2637] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
            Temporal Conflict Center
          </h2>
          <p className="text-xs sm:text-sm text-[#9299A8] mt-0.5">
            Real-time interval collision math, overlap window mapping, and What-If Schedule Simulator
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-code text-[#9299A8]">Status:</span>
          <span
            className={`px-3 py-1 text-xs font-mono-code font-bold rounded-lg border tabular-nums ${
              conflicts.length > 0
                ? 'bg-[#1C141B] text-[#FF647C] border-[#FF647C]/40'
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
            }`}
          >
            {conflicts.length} {conflicts.length === 1 ? 'collision' : 'collisions'} detected
          </span>
        </div>
      </div>

      {/* ACTIVE SIMULATION TOP CALLOUT BANNER IF SIMULATION IS ENGAGED */}
      {simulation && (
        <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#181D29] via-[#1A251E] to-[#181D29] border-2 border-[#D7FF64] shadow-[0_0_25px_rgba(215,255,100,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#D7FF64]/20 border border-[#D7FF64]/40 text-[#D7FF64] shrink-0 mt-0.5">
              <Sliders className="w-5 h-5 text-[#D7FF64]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-white">
                  WHAT-IF SIMULATION RUNNING
                </span>
                <span className="text-[10px] font-mono-code px-2 py-0.2 rounded bg-[#D7FF64] text-[#0B0D12] font-bold">
                  UNSAVED DRAFT
                </span>
              </div>
              <p className="text-xs font-mono-code text-slate-300 mt-1">
                Testing alternative slot for <strong className="text-[#D7FF64]">{simulation.originalEvent.title}</strong>:{' '}
                <span className="text-white font-bold">{simulation.modifications.startTime} – {simulation.modifications.endTime}</span>
                {' · '}
                Collisions result:{' '}
                <strong className={simulatedConflicts.length === 0 ? 'text-emerald-400' : 'text-[#FF647C]'}>
                  {simulatedConflicts.length} conflict(s)
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={discardSimulation}
              className="px-3.5 py-1.5 text-xs font-mono-code text-slate-300 hover:text-white bg-[#121620] hover:bg-[#181D29] border border-[#2A3449] rounded-xl transition-colors cursor-pointer"
            >
              Discard Simulation
            </button>
            <button
              onClick={applySimulation}
              className="px-4 py-1.5 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-xl transition-all shadow-[0_0_12px_rgba(215,255,100,0.3)] cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-[#0B0D12]" />
              <span>Apply Changes</span>
            </button>
          </div>
        </section>
      )}

      {/* FEATURE 2: EMBEDDED WHAT-IF SCHEDULE SIMULATOR SECTION */}
      {activeSimulatorConflict && (
        <section id="schedule-simulator-section">
          <ScheduleSimulator
            conflict={activeSimulatorConflict}
            onClose={() => setActiveSimulatorConflict(null)}
          />
        </section>
      )}

      {/* 1. SIGNATURE FEATURE: Interactive Horizontal Temporal Conflict Map */}
      <section>
        <TemporalConflictMap
          onOpenEditEvent={handleEdit}
          onOpenSimulator={conflict => handleOpenSimulator(conflict)}
        />
      </section>

      {/* 2. DETAILED COLLISION CARDS WITH SIMULATE ALTERNATIVE & EVIDENCE INSPECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
            Collision Registry & Explanations
          </h3>
          <span className="text-xs font-mono-code text-[#9299A8]">
            {conflicts.length} active rule violations
          </span>
        </div>

        {conflicts.length === 0 ? (
          <div className="bg-[#121620] rounded-2xl border border-[#1F2637] p-10 text-center space-y-3 shadow-xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-mono-code font-bold text-white">
                Zero Schedule Conflicts Found
              </h4>
              <p className="text-xs text-[#9299A8] max-w-md mx-auto mt-1 leading-relaxed">
                All confirmed sessions have clear non-overlapping time boundaries, deadlines do not intersect active lectures, and distinct dates are respected.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => handleScenarioSelect('sample', 'Official Sample Circular')}
                className="px-4 py-2 text-xs font-mono-code font-bold text-[#0B0D12] bg-[#D7FF64] rounded-lg cursor-pointer"
              >
                Load Sample Circular to Test Overlap
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {conflicts.map(conflict => {
              const isDeadlineClash = conflict.type === 'deadline_inside_event';
              const isSimulatorOpenForThis = activeSimulatorConflict?.id === conflict.id;

              return (
                <div
                  key={conflict.id}
                  className="bg-[#121620] rounded-2xl border border-[#FF647C]/40 shadow-xl overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="px-5 py-3.5 bg-gradient-to-r from-[#1C141B] to-[#121620] border-b border-[#2A1F26] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded uppercase border ${
                          isDeadlineClash
                            ? 'bg-[#FFC86B]/20 text-[#FFC86B] border-[#FFC86B]/40'
                            : 'bg-[#FF647C]/20 text-[#FF647C] border-[#FF647C]/40'
                        }`}
                      >
                        {isDeadlineClash ? 'DEADLINE DURING EVENT' : 'SCHEDULE CONFLICT'}
                      </span>
                      <span className="text-sm font-bold text-white font-display">
                        {conflict.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono-code text-[#9299A8]">
                      <span>{formatDateDisplay(conflict.date)}</span>
                      {conflict.overlapMinutes !== undefined && conflict.overlapMinutes > 0 && (
                        <span className="px-2 py-0.5 rounded bg-[#FF647C]/20 text-[#FF647C] font-bold border border-[#FF647C]/40 tabular-nums">
                          {conflict.overlapMinutes} min overlap
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Clashing items side-by-side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Event A */}
                      <div className="p-4 rounded-xl border border-[#2A3449] bg-[#181D29] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white font-display">
                            {conflict.eventA.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setInspectingEvent(conflict.eventA)}
                              className="text-[10px] font-mono-code text-[#D7FF64] hover:underline flex items-center gap-1 cursor-pointer"
                              title="Inspect source sentence and field evidence"
                            >
                              <ShieldCheck className="w-3 h-3 text-[#D7FF64]" />
                              <span>Evidence</span>
                            </button>
                            <button
                              onClick={() => handleEdit(conflict.eventA)}
                              className="text-[10px] font-mono-code text-[#63E6FF] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Adjust</span>
                            </button>
                          </div>
                        </div>

                        <div className="text-xs font-mono-code text-[#9299A8] space-y-1">
                          <p className="text-white font-semibold">
                            {conflict.eventA.startTime}
                            {conflict.eventA.endTime ? ` – ${conflict.eventA.endTime}` : ''}
                            {conflict.eventA.isDeadline && (
                              <span className="text-[10px] text-[#FFC86B] ml-2 font-bold">
                                [SUBMISSION CUTOFF]
                              </span>
                            )}
                          </p>
                          {conflict.eventA.venue && <p>Venue: {conflict.eventA.venue}</p>}
                        </div>
                      </div>

                      {/* Event B */}
                      <div className="p-4 rounded-xl border border-[#2A3449] bg-[#181D29] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white font-display">
                            {conflict.eventB.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setInspectingEvent(conflict.eventB)}
                              className="text-[10px] font-mono-code text-[#D7FF64] hover:underline flex items-center gap-1 cursor-pointer"
                              title="Inspect source sentence and field evidence"
                            >
                              <ShieldCheck className="w-3 h-3 text-[#D7FF64]" />
                              <span>Evidence</span>
                            </button>
                            <button
                              onClick={() => handleEdit(conflict.eventB)}
                              className="text-[10px] font-mono-code text-[#63E6FF] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Adjust</span>
                            </button>
                          </div>
                        </div>

                        <div className="text-xs font-mono-code text-[#9299A8] space-y-1">
                          <p className="text-white font-semibold">
                            {conflict.eventB.startTime}
                            {conflict.eventB.endTime ? ` – ${conflict.eventB.endTime}` : ''}
                            {conflict.eventB.isDeadline && (
                              <span className="text-[10px] text-[#FFC86B] ml-2 font-bold">
                                [SUBMISSION CUTOFF]
                              </span>
                            )}
                          </p>
                          {conflict.eventB.venue && <p>Venue: {conflict.eventB.venue}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Explanation and Suggestion */}
                    <div className="space-y-2 pt-1 text-xs">
                      <div className="p-3.5 rounded-xl bg-[#18121A] border border-[#FF647C]/30 text-[#FF647C] font-mono-code">
                        <strong className="block mb-1 font-sans font-bold">Mathematical Cause:</strong>
                        <p className="text-slate-300 leading-relaxed font-sans">{conflict.description}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#0F2027] border border-[#63E6FF]/30 text-[#63E6FF] font-mono-code flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <strong className="font-sans font-bold text-white block mb-0.5">Practical Suggested Action:</strong>
                          <p className="text-slate-300 leading-relaxed font-sans">{conflict.suggestion}</p>
                        </div>

                        {/* FEATURE 2: SIMULATE ALTERNATIVE ACTION BUTTON */}
                        <button
                          onClick={() => handleOpenSimulator(conflict)}
                          className="px-4 py-2 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-xl transition-all shadow-[0_0_15px_rgba(215,255,100,0.25)] flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Sliders className="w-3.5 h-3.5 text-[#0B0D12]" />
                          <span>Simulate Alternative</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. ZERO-RELOAD TEST SUITE (Section 12) */}
      <section className="bg-[#121620] rounded-2xl border border-[#1F2637] p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-[#D7FF64]" />
              <span>TEST HARNESS FOR EVALUATORS</span>
            </h3>
            <p className="text-xs text-[#9299A8] mt-0.5">
              Verify interval collisions, deadline intersections, and back-to-back exemptions with live in-memory recalculation.
            </p>
          </div>
          <span className="text-[10px] font-mono-code text-[#D7FF64] bg-[#181D29] border border-[#2A3449] px-2 py-1 rounded">
            Active: {activeScenarioLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <button
            onClick={() => handleScenarioSelect('sample', 'Official Hackathon Sample')}
            className="p-3 text-left rounded-xl bg-[#181D29] border border-[#2A3449] hover:border-[#D7FF64]/60 transition-colors group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-code font-bold text-white group-hover:text-[#D7FF64]">
                1. Official Sample
              </span>
              <FileCheck className="w-3.5 h-3.5 text-[#D7FF64]" />
            </div>
            <p className="text-[11px] text-[#9299A8] mt-1">
              Tests 11:00–11:30 overlap & noon deadline inside 11:00–12:30 lecture.
            </p>
          </button>

          <button
            onClick={() => handleScenarioSelect('backtoback', 'Back-to-Back (Zero Clash)')}
            className="p-3 text-left rounded-xl bg-[#181D29] border border-[#2A3449] hover:border-[#D7FF64]/60 transition-colors group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-code font-bold text-white group-hover:text-[#D7FF64]">
                2. Back-to-Back
              </span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[11px] text-[#9299A8] mt-1">
              09:00–11:00 & 11:00–13:00. Verifies 0 conflict rule.
            </p>
          </button>

          <button
            onClick={() => handleScenarioSelect('differentdates', 'Different Dates (Zero Clash)')}
            className="p-3 text-left rounded-xl bg-[#181D29] border border-[#2A3449] hover:border-[#D7FF64]/60 transition-colors group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-code font-bold text-white group-hover:text-[#D7FF64]">
                3. Different Dates
              </span>
              <Calendar className="w-3.5 h-3.5 text-[#63E6FF]" />
            </div>
            <p className="text-[11px] text-[#9299A8] mt-1">
              20 Nov vs 21 Nov at same times. Verifies 0 conflict rule.
            </p>
          </button>

          <button
            onClick={() => handleScenarioSelect('incomplete', 'Incomplete Information Flagged')}
            className="p-3 text-left rounded-xl bg-[#181D29] border border-[#2A3449] hover:border-[#D7FF64]/60 transition-colors group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-code font-bold text-white group-hover:text-[#D7FF64]">
                4. Incomplete Info
              </span>
              <HelpCircle className="w-3.5 h-3.5 text-[#FFC86B]" />
            </div>
            <p className="text-[11px] text-[#9299A8] mt-1">
              Missing times. Flags for review rather than falsely claiming 0 conflicts.
            </p>
          </button>
        </div>
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
