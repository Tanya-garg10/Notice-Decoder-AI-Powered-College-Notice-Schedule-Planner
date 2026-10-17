import { EventEvidence, EventType, FieldEvidence, NoticeEvent } from '../types/notice';
import { formatDateDisplay, normalizeTimeString } from './parser';

const EVENT_TYPES: EventType[] = ['Exam', 'Lecture', 'Workshop', 'Assignment', 'Deadline', 'Other'];

interface ExtractedEvent {
  title: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  isDeadline: boolean;
  dateIsAmbiguous: boolean;
  sourceSentence: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`AI response has an invalid "${field}" field. Please retry the analysis.`);
  }
  return value.trim();
}

function isValidIsoDate(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function fieldEvidence(
  field: FieldEvidence['field'],
  value: string,
  sourceSentence: string,
  missingFlag: string,
  flag?: string,
): FieldEvidence {
  return {
    field,
    value,
    sourceSentence,
    status: value ? 'needs_review' : 'missing',
    flag: flag || (value ? undefined : missingFlag),
  };
}

function toNoticeEvent(event: ExtractedEvent, sourceNoticeText: string, index: number): NoticeEvent {
  const normalizedNotice = sourceNoticeText.replace(/\s+/g, ' ').trim().toLowerCase();
  const normalizedSentence = event.sourceSentence.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!normalizedSentence || !normalizedNotice.includes(normalizedSentence)) {
    throw new Error('AI returned an event without a matching quote from the notice. Please retry or review the notice manually.');
  }
  if (!event.title || !EVENT_TYPES.includes(event.type)) {
    throw new Error('AI returned an event with an invalid title or type. Please retry the analysis.');
  }
  if (event.date && !isValidIsoDate(event.date)) {
    throw new Error('AI returned an invalid event date. Please retry the analysis.');
  }
  if (typeof event.isDeadline !== 'boolean') {
    throw new Error('AI returned an invalid deadline value. Please retry the analysis.');
  }

  const startTime = event.startTime ? normalizeTimeString(event.startTime) : '';
  const endTime = event.endTime ? normalizeTimeString(event.endTime) : '';
  const validTime = (time: string) => !time || /^(0[1-9]|1[0-2]):[0-5]\d (AM|PM)$/.test(time);
  if (!validTime(startTime) || !validTime(endTime)) {
    throw new Error('AI returned an invalid event time. Please retry the analysis.');
  }

  const reviewReasons = ['AI-extracted details must be checked against the original notice.'];
  if (!event.date) reviewReasons.push(event.dateIsAmbiguous ? 'Date format is ambiguous.' : 'Date is missing from the notice.');
  if (!startTime && !event.isDeadline) reviewReasons.push('Start time is missing from the notice.');
  if (!endTime && !event.isDeadline && startTime) reviewReasons.push('End time is missing from the notice.');
  if (!event.venue && event.type !== 'Deadline' && !event.isDeadline) reviewReasons.push('Venue is missing from the notice.');

  const timeValue = startTime ? (endTime ? `${startTime} – ${endTime}` : startTime) : '';
  const fields: EventEvidence['fields'] = {
    title: fieldEvidence('title', event.title, event.sourceSentence, 'Title is missing from the notice.'),
    date: fieldEvidence(
      'date',
      event.date ? formatDateDisplay(event.date) : '',
      event.sourceSentence,
      'Date is missing from the notice.',
      event.dateIsAmbiguous ? 'Ambiguous numeric date format' : undefined,
    ),
    time: fieldEvidence('time', timeValue, event.sourceSentence, 'Time is missing from the notice.'),
    venue: fieldEvidence('venue', event.venue, event.sourceSentence, 'Venue is missing from the notice.'),
  };
  const evidence: EventEvidence = {
    sourceNoticeText,
    sourceSentence: event.sourceSentence,
    fields,
    hasAmbiguousDate: event.dateIsAmbiguous,
    hasIncompleteTime: !event.isDeadline && Boolean(startTime) && !endTime,
  };

  return {
    id: `ai-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    title: event.title,
    type: event.type,
    date: event.date,
    startTime,
    endTime,
    venue: event.venue,
    isDeadline: event.isDeadline,
    requiresReview: true,
    reviewReasons,
    rawSnippet: event.sourceSentence,
    sourceNoticeText,
    createdAt: new Date().toISOString(),
    evidence,
    userConfirmed: false,
    confirmedFields: { title: false, date: false, time: false, venue: false },
  };
}

export async function analyzeNotice(noticeText: string): Promise<NoticeEvent[]> {
  let response: Response;
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noticeText }),
    });
  } catch {
    throw new Error('Could not contact the local API server. Make sure the app server is running and try again.');
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The server returned an unreadable response. Please retry the analysis.');
  }
  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.error === 'string' ? payload.error : 'Notice analysis failed.';
    throw new Error(message);
  }
  if (!isRecord(payload) || typeof payload.content !== 'string') {
    throw new Error('The server returned an unexpected response. Please retry the analysis.');
  }

  const jsonText = payload.content.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Featherless returned invalid JSON. Please retry the analysis.');
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.events)) {
    throw new Error('Featherless returned an invalid event list. Please retry the analysis.');
  }

  const events = parsed.events.map((value, index) => {
    if (!isRecord(value)) {
      throw new Error('Featherless returned an invalid event. Please retry the analysis.');
    }
    const type = requireString(value.type, 'type');
    if (!EVENT_TYPES.includes(type as EventType)) {
      throw new Error('Featherless returned an unsupported event type. Please retry the analysis.');
    }
    if (typeof value.dateIsAmbiguous !== 'boolean' || typeof value.isDeadline !== 'boolean') {
      throw new Error('Featherless returned invalid event details. Please retry the analysis.');
    }
    return toNoticeEvent({
      title: requireString(value.title, 'title'),
      type: type as EventType,
      date: requireString(value.date, 'date'),
      startTime: requireString(value.startTime, 'startTime'),
      endTime: requireString(value.endTime, 'endTime'),
      venue: requireString(value.venue, 'venue'),
      isDeadline: value.isDeadline,
      dateIsAmbiguous: value.dateIsAmbiguous,
      sourceSentence: requireString(value.sourceSentence, 'sourceSentence'),
    }, noticeText, index);
  });
  return events;
}
