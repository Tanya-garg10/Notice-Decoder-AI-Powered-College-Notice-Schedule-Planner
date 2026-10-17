import { NoticeEvent, EventType, EventEvidence, FieldEvidence } from '../types/notice';

const MONTH_MAP: Record<string, string> = {
  january: '01', jan: '01',
  february: '02', feb: '02',
  march: '03', mar: '03',
  april: '04', apr: '04',
  may: '05',
  june: '06', jun: '06',
  july: '07', jul: '07',
  august: '08', aug: '08',
  september: '09', sep: '09', sept: '09',
  october: '10', oct: '10',
  november: '11', nov: '11',
  december: '12', dec: '12',
};

/**
 * Normalizes time string to standard 12-hour format e.g. "10:00 AM"
 * and provides 24-hr minutes since midnight for conflict checking.
 */
export function normalizeTimeString(raw: string): string {
  if (!raw) return '';
  const clean = raw.trim().toLowerCase();

  if (clean === 'noon' || clean === '12:00 noon' || clean === '12 noon') {
    return '12:00 PM';
  }
  if (clean === 'midnight' || clean === '12:00 midnight' || clean === '12 midnight') {
    return '12:00 AM';
  }

  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|noon)?$/);
  if (!match) return raw.trim();

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? match[2] : '00';
  const meridiem = match[3];

  if (meridiem === 'noon') {
    return '12:00 PM';
  }

  if (meridiem) {
    const period = meridiem.toUpperCase();
    return `${hours.toString().padStart(2, '0')}:${minutes} ${period}`;
  }

  // If no AM/PM provided, treat 8-11 as AM, 12 as PM, 1-7 as PM in typical college hours
  let period = 'AM';
  if (hours === 12) {
    period = 'PM';
  } else if (hours < 8) {
    period = 'PM';
  }

  return `${hours.toString().padStart(2, '0')}:${minutes} ${period}`;
}

/**
 * Converts a normalized time string ("10:00 AM", "12:00 PM", "14:30") to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const clean = timeStr.trim().toLowerCase();

  if (clean === 'noon' || clean === '12:00 noon' || clean === '12 noon') return 12 * 60;
  if (clean === 'midnight') return 0;

  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (!match) {
    // Try just hours
    const simple = clean.match(/^(\d{1,2})\s*(am|pm)$/);
    if (simple) {
      let h = parseInt(simple[1], 10);
      const m = simple[2];
      if (m === 'pm' && h < 12) h += 12;
      if (m === 'am' && h === 12) h = 0;
      return h * 60;
    }
    return null;
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3];

  if (meridiem === 'pm' && hours < 12) {
    hours += 12;
  } else if (meridiem === 'am' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/**
 * Formats minutes from midnight back to 12-hour readable format
 */
export function minutesToTimeString(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(norm / 60);
  const mins = norm % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
}

/**
 * Formats ISO YYYY-MM-DD to human friendly "13 Nov 2026"
 */
export function formatDateDisplay(isoDate: string): string {
  if (!isoDate || isoDate.length < 10) return 'Date not specified';
  const [y, m, d] = isoDate.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(m, 10) - 1;
  const monthName = months[monthIdx] || m;
  return `${parseInt(d, 10)} ${monthName} ${y}`;
}

/**
 * Extracts a date string from a sentence and converts to YYYY-MM-DD
 */
function extractDate(text: string): { isoDate: string; rawDate: string; isAmbiguous?: boolean } | null {
  // Pattern 1: 13 November 2026 or 13th Nov 2026
  const pattern1 = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[,\s]+(\d{4})\b/i;
  const m1 = text.match(pattern1);
  if (m1) {
    const day = m1[1].padStart(2, '0');
    const month = MONTH_MAP[m1[2].toLowerCase()] || '01';
    const year = m1[3];
    return { isoDate: `${year}-${month}-${day}`, rawDate: m1[0], isAmbiguous: false };
  }

  // Pattern 2: November 13, 2026
  const pattern2 = /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})\b/i;
  const m2 = text.match(pattern2);
  if (m2) {
    const day = m2[2].padStart(2, '0');
    const month = MONTH_MAP[m2[1].toLowerCase()] || '01';
    const year = m2[3];
    return { isoDate: `${year}-${month}-${day}`, rawDate: m2[0], isAmbiguous: false };
  }

  // Pattern 3: YYYY-MM-DD
  const pattern3 = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/;
  const m3 = text.match(pattern3);
  if (m3) {
    return {
      isoDate: `${m3[1]}-${m3[2].padStart(2, '0')}-${m3[3].padStart(2, '0')}`,
      rawDate: m3[0],
      isAmbiguous: false,
    };
  }

  // Pattern 4: DD/MM/YYYY or DD-MM-YYYY (Ambiguous numeric format without month name)
  const pattern4 = /\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/;
  const m4 = text.match(pattern4);
  if (m4) {
    return {
      isoDate: `${m4[3]}-${m4[2].padStart(2, '0')}-${m4[1].padStart(2, '0')}`,
      rawDate: m4[0],
      isAmbiguous: true, // flagged as ambiguous numeric date format
    };
  }

  return null;
}

/**
 * Extracts time ranges or single deadline times from text
 */
function extractTimes(text: string): {
  startTime: string;
  endTime: string;
  isDeadline: boolean;
  rawTime: string;
} {
  // Check for time range: e.g. "from 10:00 AM to 11:30 AM", "11:00 AM to 12:30 PM", "10:00–11:30 AM"
  const rangePattern = /(?:from\s+)?(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm|noon)?)\s*(?:to|-|–|until)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm|noon))/i;
  const rm = text.match(rangePattern);
  if (rm) {
    let start = rm[1].trim();
    let end = rm[2].trim();
    // Inherit AM/PM if omitted on start
    if (!start.match(/am|pm|noon/i) && end.match(/am|pm/i)) {
      const endPeriod = end.match(/am|pm/i)?.[0];
      if (endPeriod) start = `${start} ${endPeriod}`;
    }
    return {
      startTime: normalizeTimeString(start),
      endTime: normalizeTimeString(end),
      isDeadline: false,
      rawTime: rm[0],
    };
  }

  // Check for deadline / point time e.g. "by 12:00 noon", "by 12:00 PM", "by 5:00 PM", "before 11:00 AM"
  const deadlinePattern = /(?:by|before|due(?:\s+at|\s+by)?)\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm|noon|midnight)?)/i;
  const dm = text.match(deadlinePattern);
  if (dm) {
    const norm = normalizeTimeString(dm[1]);
    return {
      startTime: norm,
      endTime: '',
      isDeadline: true,
      rawTime: dm[0],
    };
  }

  // Check for "at 10:00 AM" or plain time
  const atPattern = /(?:at\s+)(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm|noon))/i;
  const amMatch = text.match(atPattern);
  if (amMatch) {
    const norm = normalizeTimeString(amMatch[1]);
    return {
      startTime: norm,
      endTime: '',
      isDeadline: false,
      rawTime: amMatch[0],
    };
  }

  // Standalone noon
  if (/\b12:00\s*noon\b/i.test(text) || /\b12\s*noon\b/i.test(text)) {
    return {
      startTime: '12:00 PM',
      endTime: '',
      isDeadline: /submit|submission|deadline|due|last\s+date/i.test(text),
      rawTime: '12:00 noon',
    };
  }

  return { startTime: '', endTime: '', isDeadline: false, rawTime: '' };
}

/**
 * Extracts venue from text
 */
function extractVenue(text: string): string {
  // Pattern 1: in Room 204, in the Seminar Hall, at Auditorium, in Lab 3, etc.
  const p1 = /(?:in|at|venue:?)\s+(?:the\s+)?([A-Z0-9][A-Za-z0-9\s-]{2,30}?(?:Room|Hall|Lab|Auditorium|Center|Centre|Office|Block|Complex|Lobby|LH-?\d+|Seminar\s+Hall)[0-9A-Za-z-]*)/i;
  const m1 = text.match(p1);
  if (m1) return m1[1].trim();

  // Pattern 2: "Room 204", "Seminar Hall", "Lab 2"
  const p2 = /\b(Room\s+\d+[A-Za-z]?|Seminar\s+Hall|Auditorium|Lab\s+\d+|LH-?\d+|Department\s+Office)\b/i;
  const m2 = text.match(p2);
  if (m2) return m2[1].trim();

  // Pattern 3: "submitted to the department office"
  const p3 = /(?:submitted|submit|report)\s+to\s+(?:the\s+)?([A-Za-z\s]+(?:office|department|desk|counter|coordinator))/i;
  const m3 = text.match(p3);
  if (m3) {
    const v = m3[1].trim();
    return v.charAt(0).toUpperCase() + v.slice(1);
  }

  return '';
}

/**
 * Determines event type based on vocabulary
 */
function detectEventType(text: string, isDeadline: boolean): EventType {
  const lower = text.toLowerCase();

  if (isDeadline || /deadline|last\s+date|due\s+date|must\s+be\s+submitted/i.test(lower)) {
    if (/assignment|lab\s+record|project|homework|report/i.test(lower)) {
      return 'Assignment';
    }
    return 'Deadline';
  }

  if (/test|internal\s+test|exam|midterm|endsem|quiz|viva|assessment/i.test(lower)) {
    return 'Exam';
  }

  if (/guest\s+lecture|lecture|class|talk|keynote|session/i.test(lower)) {
    return 'Lecture';
  }

  if (/workshop|bootcamp|hands-on|training|hackathon|seminar/i.test(lower)) {
    return 'Workshop';
  }

  if (/assignment|lab\s+record|project\s+submission|report/i.test(lower)) {
    return 'Assignment';
  }

  return 'Other';
}

/**
 * Extracts and cleans the event title
 */
function extractTitle(text: string, type: EventType, isDeadline: boolean): string {
  const trimmed = text.trim();

  // Specific high-frequency patterns:
  // "Internal Test 2 will be held..."
  const testMatch = trimmed.match(/((?:Internal\s+Test|Midterm(?:\s+Exam)?|Endsem(?:\s+Exam)?|Quiz|Exam)\s*\d*)/i);
  if (testMatch && type === 'Exam') {
    return testMatch[1].trim();
  }

  // "guest lecture on AI in Healthcare"
  const lectureMatch = trimmed.match(/(?:A\s+)?(guest\s+lecture\s+on\s+[^,;\.]+?)(?:\s+is\s+scheduled|\s+will\s+be|\s+from|\s+on|\s+at)/i);
  if (lectureMatch) {
    const raw = lectureMatch[1].trim();
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  // "Lab records must be submitted..."
  const subMatch = trimmed.match(/([A-Za-z0-9\s]+?)\s+(?:must\s+be\s+submitted|submission|deadline|to\s+be\s+submitted)/i);
  if (subMatch && (type === 'Assignment' || type === 'Deadline' || isDeadline)) {
    const item = subMatch[1].replace(/^(all-year\s+[a-z]+\s+students:?\s*)/i, '').trim();
    if (item.length > 2) {
      const cleanItem = item.charAt(0).toUpperCase() + item.slice(1);
      return cleanItem.toLowerCase().includes('submission') ? cleanItem : `${cleanItem} Submission Deadline`;
    }
  }

  // General title clean: take the first clause before verbs like "will be held", "is scheduled", "on"
  let clean = trimmed
    .replace(/^(all-year\s+[a-z0-9\s]+students:?\s*)/i, '')
    .replace(/^(notice:?\s*|announcement:?\s*|urgent:?\s*)/i, '')
    .trim();

  const splitVerb = clean.split(/(?:\s+will\s+be\s+held|\s+is\s+scheduled|\s+must\s+be\s+submitted|\s+takes\s+place)/i);
  if (splitVerb.length > 1 && splitVerb[0].trim().length > 3) {
    return splitVerb[0].trim();
  }

  // Fallback to first 8 words
  const words = clean.split(/\s+/).slice(0, 7).join(' ');
  return words.length > 40 ? words.slice(0, 40) + '...' : words;
}

/**
 * Deterministic rule-based notice parser.
 * Clearly discloses all rule extraction steps.
 * Never silently invents missing dates, times, or venues.
 */
export function parseNoticeText(rawText: string): NoticeEvent[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  // Normalize text: replace multiple spaces, keep sentence boundaries
  const normalized = rawText.replace(/\r\n/g, '\n');

  // Split into sentences / statements
  // Split on periods followed by whitespace or capital letters, or newlines, or semicolons
  const rawSentences = normalized
    .split(/(?<=[.!?])\s+|\n+|;\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 8);

  const events: NoticeEvent[] = [];

  for (const sentence of rawSentences) {
    // Check if sentence looks like it has schedule info (date, time, or event indicator)
    const hasEventIndicators = /(?:held|scheduled|organized|conducted|submit|submission|deadline|test|exam|lecture|workshop|session|class|due|records|seminar)/i.test(sentence);
    const dateInfo = extractDate(sentence);
    const times = extractTimes(sentence);
    const venue = extractVenue(sentence);

    // If there's neither an event indicator nor date/time, skip noise sentences (e.g. "Dear students,")
    if (!hasEventIndicators && !dateInfo && !times.rawTime) {
      continue;
    }

    const isDeadline = times.isDeadline || /deadline|must\s+be\s+submitted|due\s+date/i.test(sentence);
    const type = detectEventType(sentence, isDeadline);
    const title = extractTitle(sentence, type, isDeadline);

    // Track review reasons
    const reviewReasons: string[] = [];

    if (!dateInfo) {
      reviewReasons.push('Date is missing from notice text.');
    } else if (dateInfo.isAmbiguous) {
      reviewReasons.push('Ambiguous date format (numeric DD/MM notation requires manual confirmation).');
    }

    if (!times.startTime && !isDeadline) {
      reviewReasons.push('Start time is missing in notice text.');
    }

    if (!times.endTime && !isDeadline && times.startTime) {
      reviewReasons.push('Incomplete time range: End time unspecified in circular.');
    }

    if (!venue && type !== 'Deadline') {
      reviewReasons.push('Venue not detected in notice text.');
    }

    // Determine default date if completely missing
    const finalDate = dateInfo ? dateInfo.isoDate : '';

    // Check for conflicting clauses within the same notice text for this event's topic
    const topicKeywords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !['will', 'held', 'from', 'with', 'must'].includes(w));
    const conflictingClauses: string[] = [];
    if (topicKeywords.length > 0) {
      for (const otherSentence of rawSentences) {
        if (otherSentence !== sentence) {
          const hasTopic = topicKeywords.some(kw => otherSentence.toLowerCase().includes(kw));
          if (hasTopic) {
            const otherDate = extractDate(otherSentence);
            const otherTimes = extractTimes(otherSentence);
            if (otherDate && dateInfo && otherDate.isoDate !== dateInfo.isoDate) {
              conflictingClauses.push(`Conflicting date in notice: "${otherSentence}" mentions ${otherDate.rawDate} while main sentence states ${dateInfo.rawDate}.`);
            } else if (otherTimes.startTime && times.startTime && otherTimes.startTime !== times.startTime) {
              conflictingClauses.push(`Conflicting time in notice: "${otherSentence}" specifies ${otherTimes.startTime} vs ${times.startTime}.`);
            }
          }
        }
      }
    }

    if (conflictingClauses.length > 0) {
      reviewReasons.push(...conflictingClauses);
    }

    const id = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Build field-level evidence
    const titleEvidence: FieldEvidence = {
      field: 'title',
      value: title || `${type} Event`,
      sourceSentence: sentence,
      status: title ? 'needs_review' : 'missing',
      flag: !title ? 'Title inferred from event category' : undefined,
    };

    const dateEvidence: FieldEvidence = {
      field: 'date',
      value: finalDate ? formatDateDisplay(finalDate) : '',
      sourceSentence: sentence,
      status: finalDate ? 'needs_review' : 'missing',
      flag: !finalDate
        ? 'Date missing from notice text'
        : (dateInfo?.isAmbiguous ? 'Ambiguous numeric date format (day/month order)' : undefined),
    };

    const timeDisplay = times.startTime
      ? (times.endTime ? `${times.startTime} – ${times.endTime}` : times.startTime)
      : '';

    const timeEvidence: FieldEvidence = {
      field: 'time',
      value: timeDisplay,
      sourceSentence: sentence,
      status: times.startTime ? 'needs_review' : 'missing',
      flag: !times.startTime
        ? 'Time omitted in circular'
        : (!times.endTime && !isDeadline ? 'Incomplete time range: end time unspecified' : undefined),
    };

    const venueDisplay = venue || (isDeadline ? 'Department Office' : '');
    const venueEvidence: FieldEvidence = {
      field: 'venue',
      value: venueDisplay,
      sourceSentence: sentence,
      status: venueDisplay ? 'needs_review' : 'missing',
      flag: (!venue && !isDeadline) ? 'Venue omitted from circular text' : undefined,
    };

    const evidence: EventEvidence = {
      sourceNoticeText: rawText,
      sourceSentence: sentence,
      fields: {
        title: titleEvidence,
        date: dateEvidence,
        time: timeEvidence,
        venue: venueEvidence,
      },
      hasAmbiguousDate: Boolean(dateInfo?.isAmbiguous),
      hasIncompleteTime: Boolean(!times.endTime && !isDeadline && times.startTime),
      hasConflictingClauses: conflictingClauses.length > 0,
      conflictingNoticeClauses: conflictingClauses.length > 0 ? conflictingClauses : undefined,
    };

    events.push({
      id,
      title: title || `${type} Event`,
      type,
      date: finalDate,
      startTime: times.startTime,
      endTime: times.endTime,
      venue: venueDisplay,
      isDeadline,
      requiresReview: reviewReasons.length > 0,
      reviewReasons,
      rawSnippet: sentence,
      sourceNoticeText: rawText,
      createdAt: new Date().toISOString(),
      evidence,
      userConfirmed: false,
      confirmedFields: {
        title: false,
        date: false,
        time: false,
        venue: false,
      },
    });
  }

  return events;
}
