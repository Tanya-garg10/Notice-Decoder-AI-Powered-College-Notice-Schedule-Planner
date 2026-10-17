import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  NoticeEvent,
  Conflict,
  NoticeRecord,
  ActionPlanItem,
  SimulationState,
  FieldVerificationStatus,
} from '../types/notice';
import { detectConflicts } from '../utils/conflictDetector';
import { parseNoticeText, normalizeTimeString } from '../utils/parser';
import { OFFICIAL_SAMPLE_NOTICE } from '../utils/sampleData';

interface NoticeContextType {
  events: NoticeEvent[];
  notices: NoticeRecord[];
  conflicts: Conflict[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  eventFilter: 'all' | 'conflicts' | 'deadlines' | 'review';
  setEventFilter: (filter: 'all' | 'conflicts' | 'deadlines' | 'review') => void;
  addEvent: (event: Omit<NoticeEvent, 'id' | 'createdAt'>) => NoticeEvent;
  addEvents: (events: NoticeEvent[], noticeSnippet?: { title: string; rawText: string }) => void;
  updateEvent: (id: string, updated: Partial<NoticeEvent>) => void;
  deleteEvent: (id: string) => void;
  clearAllEvents: () => void;
  loadSampleDataset: () => void;
  loadScenario: (type: 'sample' | 'backtoback' | 'differentdates' | 'incomplete') => void;
  actionPlan: ActionPlanItem[];
  completedActionIds: Set<string>;
  toggleActionPlanItem: (id: string) => void;
  stats: {
    totalEvents: number;
    conflictCount: number;
    upcomingDeadlines: number;
    noticesAnalyzed: number;
    reviewCount: number;
  };

  // Feature 1: Notice Trust & Evidence Layer
  inspectingEvent: NoticeEvent | null;
  setInspectingEvent: (event: NoticeEvent | null) => void;
  confirmField: (eventId: string, field: 'title' | 'date' | 'time' | 'venue') => void;
  unconfirmField: (eventId: string, field: 'title' | 'date' | 'time' | 'venue') => void;
  confirmAllFields: (eventId: string) => void;

  // Feature 2: What-If Schedule Simulator
  simulation: SimulationState | null;
  startSimulation: (targetEventId: string) => boolean;
  updateSimulationModifications: (mods: { date?: string; startTime?: string; endTime?: string }) => void;
  applySimulation: () => void;
  discardSimulation: () => void;
  simulatedEvents: NoticeEvent[];
  simulatedConflicts: Conflict[];
}

const STORAGE_KEY_EVENTS = 'notice_decoder_events_v2';
const STORAGE_KEY_NOTICES = 'notice_decoder_notices_v2';
const STORAGE_KEY_ACTIONS = 'notice_decoder_actions_v2';

const NoticeContext = createContext<NoticeContextType | undefined>(undefined);

export const NoticeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [eventFilter, setEventFilter] = useState<'all' | 'conflicts' | 'deadlines' | 'review'>('all');

  // Evidence panel state
  const [inspectingEvent, setInspectingEvent] = useState<NoticeEvent | null>(null);

  // What-If Simulation State
  const [simulation, setSimulation] = useState<SimulationState | null>(null);

  const [events, setEvents] = useState<NoticeEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    // Default initial dataset: parse the official sample notice
    return parseNoticeText(OFFICIAL_SAMPLE_NOTICE);
  });

  const [notices, setNotices] = useState<NoticeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTICES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return [
      {
        id: 'notice-sample-initial',
        title: 'CSE All-Year Internal Test & Guest Lecture Notice',
        rawText: OFFICIAL_SAMPLE_NOTICE,
        extractedEventsCount: 3,
        analyzedAt: new Date().toISOString(),
      },
    ];
  });

  const [completedActionIds, setCompletedActionIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIONS);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {
      // Fallback
    }
    return new Set();
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save events to localStorage', e);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTICES, JSON.stringify(notices));
    } catch (e) {
      console.error('Failed to save notices to localStorage', e);
    }
  }, [notices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIONS, JSON.stringify(Array.from(completedActionIds)));
    } catch (e) {
      console.error('Failed to save actions to localStorage', e);
    }
  }, [completedActionIds]);

  // Dynamic real conflict calculation (original saved data)
  const conflicts = useMemo(() => {
    return detectConflicts(events);
  }, [events]);

  // Simulated events array: if simulation is active, replaces target event with simulated copy
  const simulatedEvents = useMemo(() => {
    if (!simulation) return events;
    return events.map(e => (e.id === simulation.targetEventId ? simulation.simulatedEvent : e));
  }, [events, simulation]);

  // Simulated conflicts calculated reactively with existing conflict-detection engine
  const simulatedConflicts = useMemo(() => {
    return detectConflicts(simulatedEvents);
  }, [simulatedEvents]);

  // Keep inspectingEvent in sync if updated
  useEffect(() => {
    if (inspectingEvent) {
      const current = events.find(e => e.id === inspectingEvent.id);
      if (current) {
        setInspectingEvent(current);
      }
    }
  }, [events]);

  // Dynamic Action Plan derived directly from events & conflicts
  const actionPlan = useMemo(() => {
    const items: ActionPlanItem[] = [];

    // Conflict-driven action items
    conflicts.forEach(c => {
      if (c.type === 'time_overlap') {
        items.push({
          id: `act-overlap-${c.eventA.id}-${c.eventB.id}`,
          title: `Resolve overlap: "${c.eventA.title}" vs "${c.eventB.title}"`,
          description: `Sessions overlap from ${c.overlapStartTime || ''} to ${c.overlapEndTime || ''} (${c.overlapMinutes || 30} mins). ${c.suggestion}`,
          reason: 'Time collision prevents attending both sessions simultaneously.',
          completed: completedActionIds.has(`act-overlap-${c.eventA.id}-${c.eventB.id}`),
          priority: 'high',
          category: 'conflict',
        });
      } else if (c.type === 'deadline_inside_event') {
        items.push({
          id: `act-deadline-${c.eventA.id}-${c.eventB.id}`,
          title: `Pre-submit "${c.eventA.title}" before "${c.eventB.title}"`,
          description: `The deadline (${c.eventA.startTime}) falls inside "${c.eventB.title}". Submit to ${c.eventA.venue || 'department office'} prior to start time.`,
          reason: 'In-person submission is obstructed during scheduled attendance.',
          completed: completedActionIds.has(`act-deadline-${c.eventA.id}-${c.eventB.id}`),
          priority: 'high',
          category: 'deadline',
        });
      }
    });

    // Incomplete review action items
    const reviewNeeded = events.filter(e => e.requiresReview);
    if (reviewNeeded.length > 0) {
      items.push({
        id: 'act-review-params',
        title: `Verify ${reviewNeeded.length} event(s) with missing parameters`,
        description: `Check notice circular for missing venues or timings (${reviewNeeded.map(e => e.title).slice(0, 2).join(', ')}).`,
        reason: 'Complete timestamps ensure conflict engine reliability.',
        completed: completedActionIds.has('act-review-params'),
        priority: 'medium',
        category: 'review',
      });
    }

    // General academic advisory
    if (conflicts.length > 0) {
      items.push({
        id: 'act-coord-consult',
        title: 'Confirm conflicting schedule with Department Coordinator',
        description: 'Inform course professors regarding the timetable clash to request an official attendance concession or backup slot.',
        reason: 'Institution regulations require prior notice for exam or lab absences.',
        completed: completedActionIds.has('act-coord-consult'),
        priority: 'medium',
        category: 'conflict',
      });
    }

    return items;
  }, [conflicts, events, completedActionIds]);

  const toggleActionPlanItem = (id: string) => {
    setCompletedActionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Summary statistics calculated from actual application data
  const stats = useMemo(() => {
    const totalEvents = events.length;
    const conflictCount = conflicts.filter(c => c.severity === 'high').length;
    const upcomingDeadlines = events.filter(e => e.isDeadline).length;
    const noticesAnalyzed = notices.length;
    const reviewCount = events.filter(e => e.requiresReview).length;

    return {
      totalEvents,
      conflictCount,
      upcomingDeadlines,
      noticesAnalyzed,
      reviewCount,
    };
  }, [events, conflicts, notices]);

  const addEvent = (eventData: Omit<NoticeEvent, 'id' | 'createdAt'>): NoticeEvent => {
    const newEvent: NoticeEvent = {
      ...eventData,
      id: `evt-man-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  };

  const addEvents = (newEvents: NoticeEvent[], noticeSnippet?: { title: string; rawText: string }) => {
    setEvents(prev => [...prev, ...newEvents]);
    if (noticeSnippet) {
      const record: NoticeRecord = {
        id: `notice-${Date.now()}`,
        title: noticeSnippet.title || `Notice (${newEvents.length} events)`,
        rawText: noticeSnippet.rawText,
        extractedEventsCount: newEvents.length,
        analyzedAt: new Date().toISOString(),
      };
      setNotices(prev => [record, ...prev]);
    }
  };

  const updateEvent = (id: string, updated: Partial<NoticeEvent>) => {
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id === id) {
          const merged = { ...evt, ...updated };
          const reasons: string[] = [];
          if (!merged.date || merged.date.length < 10) reasons.push('Missing date');
          if (!merged.startTime && !merged.isDeadline) reasons.push('Missing start time');
          if (!merged.endTime && !merged.isDeadline && merged.startTime) reasons.push('Missing end time');
          if (!merged.venue && merged.type !== 'Deadline') reasons.push('Missing venue');
          merged.requiresReview = reasons.length > 0;
          merged.reviewReasons = reasons;

          // If evidence exists, update evidence field values
          if (merged.evidence) {
            if (updated.title) merged.evidence.fields.title.value = updated.title;
            if (updated.date) merged.evidence.fields.date.value = updated.date;
            if (updated.startTime || updated.endTime) {
              merged.evidence.fields.time.value = `${merged.startTime || ''} ${merged.endTime ? `– ${merged.endTime}` : ''}`.trim();
            }
            if (updated.venue) merged.evidence.fields.venue.value = updated.venue;
          }

          return merged;
        }
        return evt;
      })
    );
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(evt => evt.id !== id));
    if (simulation && simulation.targetEventId === id) {
      setSimulation(null);
    }
  };

  const clearAllEvents = () => {
    setEvents([]);
    setNotices([]);
    setCompletedActionIds(new Set());
    setSimulation(null);
  };

  const loadScenario = (type: 'sample' | 'backtoback' | 'differentdates' | 'incomplete') => {
    let raw = OFFICIAL_SAMPLE_NOTICE;
    let title = 'CSE All-Year Internal Test & Guest Lecture Notice';

    if (type === 'backtoback') {
      raw = `Notice: Database Lab session will be conducted on 18 November 2026 from 09:00 AM to 11:00 AM in Lab 2. Followed immediately by Computer Networks tutorial on 18 November 2026 from 11:00 AM to 01:00 PM in Room 102.`;
      title = 'Lab & Tutorial Consecutive Sessions';
    } else if (type === 'differentdates') {
      raw = `Notice: Web Development Workshop will be held on 20 November 2026 from 10:00 AM to 01:00 PM in Seminar Hall. Cloud Computing Seminar is scheduled on 21 November 2026 from 10:00 AM to 01:00 PM in Auditorium.`;
      title = 'Multi-Day Technical Workshops';
    } else if (type === 'incomplete') {
      raw = `Notice: Department meeting will be held on 13 November 2026. Project synopsis submission must be completed soon.`;
      title = 'Department Advisory Circular (Unspecified Times)';
    }

    const parsed = parseNoticeText(raw);
    setEvents(parsed);
    setSimulation(null);
    setNotices([
      {
        id: `notice-${type}-${Date.now()}`,
        title,
        rawText: raw,
        extractedEventsCount: parsed.length,
        analyzedAt: new Date().toISOString(),
      },
    ]);
  };

  const loadSampleDataset = () => {
    loadScenario('sample');
  };

  // Feature 1: Field Confirmation Handlers
  const confirmField = (eventId: string, field: 'title' | 'date' | 'time' | 'venue') => {
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id === eventId) {
          const nextConfirmed = { ...(evt.confirmedFields || {}), [field]: true };
          const allConfirmed = Boolean(
            nextConfirmed.title && nextConfirmed.date && nextConfirmed.time && nextConfirmed.venue
          );

          const updatedEvidence = evt.evidence
            ? {
                ...evt.evidence,
                fields: {
                  ...evt.evidence.fields,
                  [field]: {
                    ...evt.evidence.fields[field],
                    status: 'confirmed' as FieldVerificationStatus,
                    flag: undefined,
                  },
                },
              }
            : undefined;

          return {
            ...evt,
            confirmedFields: nextConfirmed,
            userConfirmed: allConfirmed,
            evidence: updatedEvidence,
          };
        }
        return evt;
      })
    );
  };

  const unconfirmField = (eventId: string, field: 'title' | 'date' | 'time' | 'venue') => {
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id === eventId) {
          const nextConfirmed = { ...(evt.confirmedFields || {}), [field]: false };

          const updatedEvidence = evt.evidence
            ? {
                ...evt.evidence,
                fields: {
                  ...evt.evidence.fields,
                  [field]: {
                    ...evt.evidence.fields[field],
                    status: (evt.evidence.fields[field].value ? 'needs_review' : 'missing') as FieldVerificationStatus,
                  },
                },
              }
            : undefined;

          return {
            ...evt,
            confirmedFields: nextConfirmed,
            userConfirmed: false,
            evidence: updatedEvidence,
          };
        }
        return evt;
      })
    );
  };

  const confirmAllFields = (eventId: string) => {
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id === eventId) {
          const allConfirmed = { title: true, date: true, time: true, venue: true };

          const updatedEvidence = evt.evidence
            ? {
                ...evt.evidence,
                fields: {
                  title: { ...evt.evidence.fields.title, status: (evt.evidence.fields.title.value ? 'confirmed' : 'missing') as FieldVerificationStatus },
                  date: { ...evt.evidence.fields.date, status: (evt.evidence.fields.date.value ? 'confirmed' : 'missing') as FieldVerificationStatus },
                  time: { ...evt.evidence.fields.time, status: (evt.evidence.fields.time.value ? 'confirmed' : 'missing') as FieldVerificationStatus },
                  venue: { ...evt.evidence.fields.venue, status: (evt.evidence.fields.venue.value ? 'confirmed' : 'missing') as FieldVerificationStatus },
                },
              }
            : undefined;

          return {
            ...evt,
            confirmedFields: allConfirmed,
            userConfirmed: true,
            evidence: updatedEvidence,
          };
        }
        return evt;
      })
    );
  };

  // Feature 2: What-If Schedule Simulator Handlers
  const startSimulation = (targetEventId: string): boolean => {
    const target = events.find(e => e.id === targetEventId);
    if (!target) return false;

    // Check if target event has required details
    if (!target.date) {
      return false; // Cannot simulate without date
    }

    setSimulation({
      active: true,
      targetEventId,
      originalEvent: { ...target },
      simulatedEvent: { ...target },
      modifications: {
        date: target.date,
        startTime: target.startTime,
        endTime: target.endTime,
      },
    });
    return true;
  };

  const updateSimulationModifications = (mods: { date?: string; startTime?: string; endTime?: string }) => {
    setSimulation(prev => {
      if (!prev) return null;
      const nextDate = mods.date !== undefined ? mods.date : prev.modifications.date;
      const nextStart = mods.startTime !== undefined ? mods.startTime : prev.modifications.startTime;
      const nextEnd = mods.endTime !== undefined ? mods.endTime : prev.modifications.endTime;

      const normStart = nextStart ? normalizeTimeString(nextStart) : '';
      const normEnd = nextEnd ? normalizeTimeString(nextEnd) : '';

      const updatedSimEvent: NoticeEvent = {
        ...prev.originalEvent,
        date: nextDate,
        startTime: normStart || nextStart,
        endTime: normEnd || nextEnd,
      };

      return {
        ...prev,
        modifications: {
          date: nextDate,
          startTime: nextStart,
          endTime: nextEnd,
        },
        simulatedEvent: updatedSimEvent,
      };
    });
  };

  const applySimulation = () => {
    if (!simulation) return;
    const { targetEventId, simulatedEvent } = simulation;

    // Update the real event
    updateEvent(targetEventId, {
      date: simulatedEvent.date,
      startTime: simulatedEvent.startTime,
      endTime: simulatedEvent.endTime,
    });

    // Clear simulation state
    setSimulation(null);
  };

  const discardSimulation = () => {
    // Simply reset simulation state with zero side-effects
    setSimulation(null);
  };

  return (
    <NoticeContext.Provider
      value={{
        events,
        notices,
        conflicts,
        activeTab: activeTab === 'dashboard' ? 'overview' : activeTab,
        setActiveTab,
        eventFilter,
        setEventFilter,
        addEvent,
        addEvents,
        updateEvent,
        deleteEvent,
        clearAllEvents,
        loadSampleDataset,
        loadScenario,
        actionPlan,
        completedActionIds,
        toggleActionPlanItem,
        stats,

        // Notice Trust & Evidence
        inspectingEvent,
        setInspectingEvent,
        confirmField,
        unconfirmField,
        confirmAllFields,

        // What-If Schedule Simulator
        simulation,
        startSimulation,
        updateSimulationModifications,
        applySimulation,
        discardSimulation,
        simulatedEvents,
        simulatedConflicts,
      }}
    >
      {children}
    </NoticeContext.Provider>
  );
};

export const useNotice = () => {
  const ctx = useContext(NoticeContext);
  if (!ctx) {
    throw new Error('useNotice must be used within NoticeProvider');
  }
  return ctx;
};
