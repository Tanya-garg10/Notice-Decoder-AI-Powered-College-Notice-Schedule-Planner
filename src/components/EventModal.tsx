import React, { useState, useEffect } from 'react';
import { NoticeEvent, EventType } from '../types/notice';
import { X, Calendar, Clock, MapPin, AlertCircle, Check } from 'lucide-react';
import { normalizeTimeString } from '../utils/parser';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<NoticeEvent, 'id' | 'createdAt'>) => void;
  initialEvent?: NoticeEvent | null;
}

const EVENT_TYPES: EventType[] = ['Exam', 'Lecture', 'Workshop', 'Assignment', 'Deadline', 'Other'];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEvent,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('Lecture');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [isDeadline, setIsDeadline] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      setType(initialEvent.type);
      setDate(initialEvent.date || '');
      setStartTime(initialEvent.startTime || '');
      setEndTime(initialEvent.endTime || '');
      setVenue(initialEvent.venue || '');
      setIsDeadline(initialEvent.isDeadline || false);
      setNotes(initialEvent.notes || '');
    } else {
      setTitle('');
      setType('Lecture');
      setDate(new Date().toISOString().split('T')[0]);
      setStartTime('10:00 AM');
      setEndTime('11:30 AM');
      setVenue('');
      setIsDeadline(false);
      setNotes('');
    }
    setError(null);
  }, [initialEvent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Event title is required.');
      return;
    }

    if (!date) {
      setError('Date is required (YYYY-MM-DD).');
      return;
    }

    const normStart = startTime ? normalizeTimeString(startTime) : '';
    const normEnd = endTime ? normalizeTimeString(endTime) : '';

    // Calculate review reasons
    const reasons: string[] = [];
    if (!normStart && !isDeadline) {
      reasons.push('Missing start time');
    }
    if (!normEnd && !isDeadline && normStart) {
      reasons.push('Missing end time for interval');
    }
    if (!venue && type !== 'Deadline') {
      reasons.push('Missing venue');
    }

    onSave({
      title: title.trim(),
      type,
      date,
      startTime: normStart || startTime.trim(),
      endTime: normEnd || endTime.trim(),
      venue: venue.trim(),
      isDeadline,
      notes: notes.trim(),
      requiresReview: reasons.length > 0,
      reviewReasons: reasons,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#121620] text-[#F5F5F0] rounded-2xl shadow-2xl border border-[#1F2637] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2637] bg-[#181D29]/60">
          <div>
            <h3 className="text-base font-bold font-display text-white">
              {initialEvent ? 'Edit Event Details' : 'Add Event to Schedule'}
            </h3>
            <p className="text-xs font-mono-code text-[#9299A8]">
              {initialEvent ? 'Modify fields to recalculate collision math' : 'Record a scheduled session or deadline'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9299A8] hover:text-white rounded-lg hover:bg-[#181D29] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#1C141B] border border-[#FF647C]/40 text-[#FF647C] text-xs font-mono-code rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#FF647C]" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono-code text-[#9299A8] mb-1 uppercase tracking-wider">
              Event Title <span className="text-[#FF647C]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Internal Test 2, Guest Lecture, Lab Record Submission"
              className="w-full px-3.5 py-2.5 text-xs font-mono-code bg-[#0B0D12] border border-[#2A3449] rounded-xl text-white focus:outline-none focus:border-[#D7FF64]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-code text-[#9299A8] mb-1 uppercase tracking-wider">
                Category / Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as EventType)}
                className="w-full px-3.5 py-2.5 text-xs font-mono-code bg-[#0B0D12] border border-[#2A3449] rounded-xl text-white focus:outline-none focus:border-[#D7FF64]"
              >
                {EVENT_TYPES.map(t => (
                  <option key={t} value={t} className="bg-[#121620] text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono-code text-[#9299A8] mb-1 uppercase tracking-wider">
                Date <span className="text-[#FF647C]">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-mono-code bg-[#0B0D12] border border-[#2A3449] rounded-xl text-white focus:outline-none focus:border-[#D7FF64]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-code text-[#9299A8] mb-1 flex items-center gap-1 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-[#63E6FF]" />
                <span>{isDeadline ? 'Deadline Due Time' : 'Start Time'}</span>
              </label>
              <input
                type="text"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                placeholder="e.g. 10:00 AM, 12:00 noon"
                className="w-full px-3.5 py-2.5 text-xs font-mono-code bg-[#0B0D12] border border-[#2A3449] rounded-xl text-white focus:outline-none focus:border-[#D7FF64]"
              />
              <span className="text-[10px] font-mono-code text-slate-500 mt-1 block">e.g. 10:00 AM, 12:00 noon</span>
            </div>

            <div>
              <label className="block text-xs font-mono-code text-[#9299A8] mb-1 flex items-center gap-1 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-[#63E6FF]" />
                <span>End Time {!isDeadline && <span className="text-slate-500 font-normal">(intervals)</span>}</span>
              </label>
              <input
                type="text"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                placeholder="e.g. 11:30 AM"
                disabled={isDeadline}
                className="w-full px-3.5 py-2.5 text-xs font-mono-code bg-[#0B0D12] border border-[#2A3449] rounded-xl text-white focus:outline-none focus:border-[#D7FF64] disabled:opacity-40"
              />
              <span className="text-[10px] font-mono-code text-slate-500 mt-1 block">
                {isDeadline ? 'Deadlines are point-in-time' : 'Required for interval collision'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono-code text-[#9299A8] mb-1 flex items-center gap-1 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-[#63E6FF]" />
              <span>Venue / Location</span>
            </label>
            <input
              type="text"
              value={venue}
              onChange={e => setVenue(e.target.value)}
              placeholder="e.g. Room 204, Seminar Hall, Department Office"
              className="w-full px-3.5 py-2.5 text-xs font-mono-code bg-[#0B0D12] border border-[#2A3449] rounded-xl text-white focus:outline-none focus:border-[#D7FF64]"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#0B0D12] border border-[#2A3449] rounded-xl">
            <input
              type="checkbox"
              id="isDeadlineCheck"
              checked={isDeadline}
              onChange={e => {
                const checked = e.target.checked;
                setIsDeadline(checked);
                if (checked) {
                  setEndTime('');
                  if (type === 'Lecture') setType('Deadline');
                }
              }}
              className="w-4 h-4 accent-[#D7FF64] rounded cursor-pointer"
            />
            <label htmlFor="isDeadlineCheck" className="text-xs font-mono-code text-[#F5F5F0] cursor-pointer select-none">
              <span className="font-bold block text-white">Mark as Mandatory Submission Cutoff</span>
              <span className="text-[#9299A8] block text-[11px]">Triggers collision warning if scheduled inside another session interval.</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-mono-code text-[#9299A8] mb-1 uppercase tracking-wider">
              Notes / Circular Instructions
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Carry scientific calculator, submit to Lab Incharge..."
              rows={2}
              className="w-full px-3.5 py-2.5 text-xs font-mono-code bg-[#0B0D12] border border-[#2A3449] rounded-xl text-white focus:outline-none focus:border-[#D7FF64]"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#1F2637]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono-code text-slate-300 hover:text-white bg-[#181D29] hover:bg-[#202738] border border-[#2A3449] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-xl transition-all shadow-[0_0_15px_rgba(215,255,100,0.25)] flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-[#0B0D12]" />
              <span>{initialEvent ? 'Save Changes' : 'Add Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
