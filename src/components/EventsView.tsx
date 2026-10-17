import React, { useState, useMemo } from 'react';
import { useNotice } from '../context/NoticeContext';
import { NoticeEvent, EventType } from '../types/notice';
import { formatDateDisplay } from '../utils/parser';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  CalendarDays,
  Filter,
  ShieldCheck
} from 'lucide-react';
import { EventModal } from './EventModal';
import { ConfirmModal } from './ConfirmModal';

const EVENT_TYPE_OPTIONS: ('All' | EventType)[] = [
  'All',
  'Exam',
  'Lecture',
  'Workshop',
  'Assignment',
  'Deadline',
  'Other',
];

export const EventsView: React.FC = () => {
  const { events, conflicts, addEvent, updateEvent, deleteEvent, eventFilter, setInspectingEvent } = useNotice();

  const [viewMode, setViewMode] = useState<'agenda' | 'timeline'>('agenda');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'All' | EventType>('All');
  const [filterConflictOnly, setFilterConflictOnly] = useState(false);
  const [filterReviewOnly, setFilterReviewOnly] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // Sync from context filter (when clicked from summary cards)
  React.useEffect(() => {
    if (eventFilter === 'conflicts') {
      setFilterConflictOnly(true);
      setFilterReviewOnly(false);
      setSelectedType('All');
    } else if (eventFilter === 'deadlines') {
      setFilterConflictOnly(false);
      setFilterReviewOnly(false);
      setSelectedType('Deadline');
    } else if (eventFilter === 'review') {
      setFilterConflictOnly(false);
      setFilterReviewOnly(true);
      setSelectedType('All');
    }
  }, [eventFilter]);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<NoticeEvent | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Set of event IDs involved in conflicts
  const clashingEventIds = useMemo(() => {
    const set = new Set<string>();
    conflicts.forEach(c => {
      set.add(c.eventA.id);
      set.add(c.eventB.id);
    });
    return set;
  }, [conflicts]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          evt.title.toLowerCase().includes(q) ||
          (evt.venue && evt.venue.toLowerCase().includes(q)) ||
          (evt.notes && evt.notes.toLowerCase().includes(q)) ||
          (evt.date && evt.date.includes(q));
        if (!matches) return false;
      }

      if (selectedType !== 'All' && evt.type !== selectedType) {
        return false;
      }

      if (filterConflictOnly && !clashingEventIds.has(evt.id)) {
        return false;
      }

      if (filterReviewOnly && !evt.requiresReview) {
        return false;
      }

      if (selectedDate && evt.date !== selectedDate) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedType, filterConflictOnly, filterReviewOnly, selectedDate, clashingEventIds]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, NoticeEvent[]> = {};
    const sorted = [...filteredEvents].sort((a, b) => {
      if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    sorted.forEach(evt => {
      const d = evt.date || 'Unspecified Date';
      if (!groups[d]) groups[d] = [];
      groups[d].push(evt);
    });

    return groups;
  }, [filteredEvents]);

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt: NoticeEvent) => {
    setEditingEvent(evt);
    setIsModalOpen(true);
  };

  const handleSaveModal = (data: Omit<NoticeEvent, 'id' | 'createdAt'>) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, data);
    } else {
      addEvent(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteEvent(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1F2637]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
            Schedule Registry
          </h2>
          <p className="text-xs sm:text-sm text-[#9299A8] mt-0.5">
            Confirmed academic sessions, examinations, and submission cutoffs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-[#121620] rounded-xl border border-[#2A3449]">
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 text-xs font-mono-code rounded-lg transition-colors cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-[#181D29] text-white shadow-xs border border-[#2A3449]'
                  : 'text-[#9299A8] hover:text-white'
              }`}
            >
              Agenda
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 text-xs font-mono-code rounded-lg transition-colors cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-[#181D29] text-white shadow-xs border border-[#2A3449]'
                  : 'text-[#9299A8] hover:text-white'
              }`}
            >
              Timeline
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-xl transition-all shadow-[0_0_15px_rgba(215,255,100,0.2)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#0B0D12]" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121620] p-4 sm:p-5 rounded-2xl border border-[#1F2637] shadow-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#9299A8] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by title, venue, date..."
              className="w-full pl-9 pr-3 py-2 text-xs font-mono-code bg-[#0B0D12] border border-[#2A3449] rounded-xl text-white focus:outline-none focus:border-[#D7FF64]"
            />
          </div>

          {/* Specific Date Filter */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono-code bg-[#0B0D12] border border-[#2A3449] rounded-xl text-white focus:outline-none focus:border-[#D7FF64]"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="absolute right-8 top-2 text-[10px] font-mono-code text-[#9299A8] hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Quick Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterConflictOnly(!filterConflictOnly)}
              className={`flex-1 px-2.5 py-2 text-xs font-mono-code rounded-xl border transition-colors cursor-pointer text-center ${
                filterConflictOnly
                  ? 'bg-[#1C141B] border-[#FF647C] text-[#FF647C] font-bold'
                  : 'bg-[#181D29] border-[#2A3449] text-[#9299A8] hover:text-white'
              }`}
            >
              Conflicts Only ({conflicts.length})
            </button>
            <button
              onClick={() => setFilterReviewOnly(!filterReviewOnly)}
              className={`flex-1 px-2.5 py-2 text-xs font-mono-code rounded-xl border transition-colors cursor-pointer text-center ${
                filterReviewOnly
                  ? 'bg-[#1A1812] border-[#FFC86B] text-[#FFC86B] font-bold'
                  : 'bg-[#181D29] border-[#2A3449] text-[#9299A8] hover:text-white'
              }`}
            >
              Needs Review
            </button>
          </div>
        </div>

        {/* Category Horizontal Segmented Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          <span className="text-[10px] font-mono-code text-[#9299A8] uppercase tracking-wider mr-1">
            CATEGORY:
          </span>
          {EVENT_TYPE_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setSelectedType(opt)}
              className={`px-3 py-1 text-xs font-mono-code rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedType === opt
                  ? 'bg-[#D7FF64] text-[#0B0D12] font-bold'
                  : 'text-[#9299A8] bg-[#181D29] hover:bg-[#202738] hover:text-white'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Main Events Display */}
      {filteredEvents.length === 0 ? (
        <div className="bg-[#121620] rounded-2xl border border-[#1F2637] p-12 text-center space-y-3">
          <Calendar className="w-8 h-8 mx-auto text-slate-600" />
          <h3 className="text-sm font-mono-code text-white">No schedule entries matched.</h3>
          <p className="text-xs text-[#9299A8]">Try clearing filters or add an event manually.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('All');
              setFilterConflictOnly(false);
              setFilterReviewOnly(false);
              setSelectedDate('');
            }}
            className="px-4 py-2 text-xs font-mono-code text-[#0B0D12] bg-[#D7FF64] rounded-lg cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'agenda' ? (
        /* EDITORIAL EVENT STRIPS AGENDA (Section 6) */
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([dateStr, items]) => (
            <div key={dateStr} className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#63E6FF]" />
                <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
                  {formatDateDisplay(dateStr)}
                </h3>
                <span className="text-xs font-mono-code text-[#9299A8]">({items.length})</span>
              </div>

              <div className="space-y-2.5">
                {items.map(evt => {
                  const isClashing = clashingEventIds.has(evt.id);
                  const relatedConflicts = conflicts.filter(
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
                        {/* Large time label on left (Section 6) */}
                        <div className="w-28 shrink-0 font-mono-code text-xs font-bold text-[#D7FF64]">
                          <span>{evt.startTime || 'ALL DAY'}</span>
                          {evt.endTime && (
                            <span className="block text-[11px] text-[#9299A8] font-normal">
                              until {evt.endTime}
                            </span>
                          )}
                        </div>

                        {/* Event type indicator bar */}
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

                        {/* Title & Venue */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-white">{evt.title}</span>
                            <span
                              className={`text-[9px] font-mono-code px-1.5 py-0.2 rounded uppercase ${
                                evt.type === 'Exam'
                                  ? 'bg-[#6366F1]/20 text-[#6366F1]'
                                  : evt.isDeadline
                                  ? 'bg-[#FFC86B]/20 text-[#FFC86B]'
                                  : 'bg-[#63E6FF]/20 text-[#63E6FF]'
                              }`}
                            >
                              {evt.type}
                            </span>
                            {isClashing && (
                              <span className="text-[9px] font-mono-code font-bold px-1.5 py-0.2 rounded bg-[#FF647C]/20 text-[#FF647C]">
                                CLASH
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono-code text-[#9299A8]">
                            <span>{formatDateDisplay(evt.date)}</span>
                            {evt.venue && (
                              <>
                                <span>·</span>
                                <span className="truncate">{evt.venue}</span>
                              </>
                            )}
                          </div>

                          {relatedConflicts.length > 0 && (
                            <div className="mt-1 p-2 rounded-lg bg-[#1C141B] border border-[#FF647C]/40 text-xs font-mono-code text-[#FF647C]">
                              ⚠️ {relatedConflicts[0].description}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => setInspectingEvent(evt)}
                          className="px-2.5 py-1.5 text-xs font-mono-code text-[#D7FF64] hover:bg-[#202738] bg-[#181D29] border border-[#2A3449] hover:border-[#D7FF64]/50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Inspect Notice Trust & Source Evidence"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#D7FF64]" />
                          <span>Evidence</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(evt)}
                          className="p-2 text-[#9299A8] hover:text-white rounded-lg bg-[#181D29] hover:bg-[#202738] border border-[#2A3449] transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(evt.id)}
                          className="p-2 text-[#9299A8] hover:text-[#FF647C] rounded-lg bg-[#181D29] hover:bg-[#202738] border border-[#2A3449] transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([dateStr, items]) => (
            <div key={dateStr} className="bg-[#121620] rounded-2xl border border-[#1F2637] p-6 shadow-xl space-y-4">
              <div className="border-b border-[#1F2637] pb-3 flex items-center justify-between">
                <span className="text-sm font-mono-code font-bold text-white">
                  {formatDateDisplay(dateStr)}
                </span>
                <span className="text-xs font-mono-code text-[#9299A8]">
                  {items.length} items
                </span>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2A3449]">
                {items.map(evt => {
                  const isClashing = clashingEventIds.has(evt.id);

                  return (
                    <div key={evt.id} className="relative group">
                      <div
                        className={`absolute -left-[27px] top-3.5 w-3.5 h-3.5 rounded-full border-2 border-[#121620] shadow-xs ${
                          isClashing
                            ? 'bg-[#FF647C] ring-2 ring-[#FF647C]/40'
                            : evt.isDeadline
                            ? 'bg-[#FFC86B]'
                            : 'bg-[#63E6FF]'
                        }`}
                      />

                      <div
                        className={`p-4 rounded-xl border transition-all ${
                          isClashing
                            ? 'bg-[#18121A] border-[#FF647C]/80'
                            : 'bg-[#181D29] border-[#2A3449] hover:border-slate-500'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono-code font-bold text-[#D7FF64]">
                                {evt.startTime || 'ALL DAY'} {evt.endTime ? `– ${evt.endTime}` : ''}
                              </span>
                              <span className="text-sm font-bold text-white">{evt.title}</span>
                            </div>
                            <div className="text-xs font-mono-code text-[#9299A8] mt-1">
                              <span>{evt.type}</span>
                              {evt.venue && <span> · {evt.venue}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => setInspectingEvent(evt)}
                              className="px-2.5 py-1 text-xs font-mono-code text-[#D7FF64] hover:bg-[#181D29] bg-[#121620] border border-[#2A3449] hover:border-[#D7FF64]/50 rounded-md cursor-pointer flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3 text-[#D7FF64]" />
                              <span>Evidence</span>
                            </button>
                            <button
                              onClick={() => handleOpenEdit(evt)}
                              className="px-2.5 py-1 text-xs font-mono-code text-slate-300 hover:text-white bg-[#121620] border border-[#2A3449] rounded-md cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(evt.id)}
                              className="px-2.5 py-1 text-xs font-mono-code text-[#FF647C] hover:underline bg-[#121620] border border-[#2A3449] rounded-md cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveModal}
        initialEvent={editingEvent}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Delete Scheduled Event"
        message="Are you sure you want to remove this event from your schedule? This action will immediately recalculate all conflicts."
        confirmLabel="Delete Event"
        cancelLabel="Keep Event"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
