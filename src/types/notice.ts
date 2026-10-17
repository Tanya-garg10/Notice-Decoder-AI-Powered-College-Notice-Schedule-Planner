export type EventType = 'Exam' | 'Lecture' | 'Workshop' | 'Assignment' | 'Deadline' | 'Other';

export type FieldVerificationStatus = 'confirmed' | 'needs_review' | 'missing';

export interface FieldEvidence {
  field: 'title' | 'date' | 'time' | 'venue';
  value: string;
  sourceSentence: string;
  status: FieldVerificationStatus;
  flag?: string; // e.g. "Omitted from notice text", "Incomplete time interval", "Ambiguous date format"
}

export interface EventEvidence {
  sourceNoticeText?: string;
  sourceSentence: string;
  fields: {
    title: FieldEvidence;
    date: FieldEvidence;
    time: FieldEvidence;
    venue: FieldEvidence;
  };
  hasAmbiguousDate?: boolean;
  hasIncompleteTime?: boolean;
  hasConflictingClauses?: boolean;
  conflictingNoticeClauses?: string[];
}

export interface NoticeEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // ISO format 'YYYY-MM-DD'
  startTime: string; // e.g., '10:00 AM' or '10:00'
  endTime: string; // e.g., '11:30 AM' or '11:30'
  venue: string;
  isDeadline: boolean;
  requiresReview: boolean;
  reviewReasons: string[];
  rawSnippet?: string;
  notes?: string;
  sourceNoticeId?: string;
  sourceNoticeText?: string;
  createdAt: string;

  // Notice Trust & Evidence Layer
  evidence?: EventEvidence;
  userConfirmed?: boolean;
  confirmedFields?: Partial<Record<'title' | 'date' | 'time' | 'venue', boolean>>;
}

export type ConflictType = 'time_overlap' | 'deadline_inside_event' | 'ambiguous_time';
export type ConflictSeverity = 'high' | 'medium' | 'info';

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  eventA: NoticeEvent;
  eventB: NoticeEvent;
  date: string;
  overlapStartTime?: string;
  overlapEndTime?: string;
  overlapMinutes?: number;
  title: string;
  description: string;
  suggestion: string;
}

export interface NoticeRecord {
  id: string;
  title: string;
  rawText: string;
  extractedEventsCount: number;
  analyzedAt: string;
}

export interface ChangeWithEvidence {
  original: string;
  revised: string;
  originalSentence?: string;
  revisedSentence?: string;
}

export interface NoticeDiffResult {
  addedPhrases: string[];
  removedPhrases: string[];
  dateChanges: ChangeWithEvidence[];
  timeChanges: ChangeWithEvidence[];
  venueChanges: ChangeWithEvidence[];
  summaryItems: string[];
  annotatedOriginal: { text: string; status: 'unchanged' | 'removed' | 'modified' }[];
  annotatedRevised: { text: string; status: 'unchanged' | 'added' | 'modified' }[];
}

export interface ActionPlanItem {
  id: string;
  title: string;
  description: string;
  reason: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'conflict' | 'deadline' | 'review';
}

export interface SimulationState {
  active: boolean;
  targetEventId: string;
  originalEvent: NoticeEvent;
  simulatedEvent: NoticeEvent;
  modifications: {
    date: string;
    startTime: string;
    endTime: string;
  };
}
