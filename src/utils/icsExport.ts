import { NoticeEvent } from '../types/notice';
import { timeToMinutes } from './parser';

/**
 * Escapes characters for iCalendar format per RFC 5545 Section 3.3.11
 */
function escapeIcsText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Formats a date string (YYYY-MM-DD) and optional time to RFC 5545 DTSTART/DTEND
 */
function formatIcsDateTime(isoDate: string, timeStr?: string): { dtstart: string; dtend?: string; isAllDay: boolean } {
  const dateMatch = isoDate.match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
  if (!dateMatch) {
    throw new Error(`Invalid event date: ${isoDate}`);
  }

  const [, yearText, monthText, dayText] = dateMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const dateCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    dateCheck.getUTCFullYear() !== year ||
    dateCheck.getUTCMonth() !== month - 1 ||
    dateCheck.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${isoDate}`);
  }

  const cleanDate = `${yearText}${monthText}${dayText}`;

  if (!timeStr || !timeStr.trim()) {
    // RFC 5545 all-day DTEND is exclusive, so it must be the following day.
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
    const nextDayStr = `${nextDay.getUTCFullYear()}${String(nextDay.getUTCMonth() + 1).padStart(2, '0')}${String(nextDay.getUTCDate()).padStart(2, '0')}`;
    return {
      dtstart: `DTSTART;VALUE=DATE:${cleanDate}`,
      dtend: `DTEND;VALUE=DATE:${nextDayStr}`,
      isAllDay: true,
    };
  }

  const minutes = timeToMinutes(timeStr);
  if (minutes === null || minutes < 0 || minutes >= 24 * 60) {
    throw new Error(`Invalid event time: ${timeStr}`);
  }

  // Notice Decoder interprets notice times as India local time (Asia/Kolkata, UTC+05:30).
  // Export explicit UTC timestamps so calendar apps do not reinterpret floating local times.
  const utcDate = new Date(Date.UTC(year, month - 1, day, Math.floor(minutes / 60) - 5, (minutes % 60) - 30));
  const utcStamp = `${utcDate.getUTCFullYear()}${String(utcDate.getUTCMonth() + 1).padStart(2, '0')}${String(utcDate.getUTCDate()).padStart(2, '0')}T${String(utcDate.getUTCHours()).padStart(2, '0')}${String(utcDate.getUTCMinutes()).padStart(2, '0')}00Z`;

  return {
    dtstart: `DTSTART:${utcStamp}`,
    isAllDay: false,
  };
}

/**
 * Generates valid RFC 5545 VCALENDAR string
 */
export function generateIcsContent(events: NoticeEvent[], calendarName: string = 'Notice Decoder Schedule'): { icsString: string; exportedCount: number; skippedCount: number; skippedReasons: string[] } {
  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const validEvents: NoticeEvent[] = [];
  const skippedReasons: string[] = [];

  events.forEach(e => {
    if (!e.date || e.date.length < 10) {
      skippedReasons.push(`"${e.title}": Missing mandatory date.`);
    } else {
      validEvents.push(e);
    }
  });

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SETU 2026 Hackathon//Notice Decoder v1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    'X-WR-TIMEZONE:Asia/Kolkata',
  ];

  validEvents.forEach(evt => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${escapeIcsText(evt.id)}@noticedecoder.hackathon.setu`);
    lines.push(`DTSTAMP:${dtstamp}`);

    const startFormatted = formatIcsDateTime(evt.date, evt.startTime);
    lines.push(startFormatted.dtstart);

    if (evt.endTime && evt.endTime.trim()) {
      const endFormatted = formatIcsDateTime(evt.date, evt.endTime);
      lines.push(`DTEND:${endFormatted.dtstart.replace('DTSTART:', '')}`);
    } else if (startFormatted.dtend) {
      lines.push(startFormatted.dtend);
    }

    const titlePrefix = evt.isDeadline ? '[DEADLINE] ' : evt.type === 'Exam' ? '[EXAM] ' : '';
    lines.push(`SUMMARY:${escapeIcsText(titlePrefix + evt.title)}`);

    if (evt.venue) {
      lines.push(`LOCATION:${escapeIcsText(evt.venue)}`);
    }

    const descParts: string[] = [
      `Type: ${evt.type}`,
      evt.isDeadline ? 'Status: Mandatory Submission Deadline' : 'Status: Scheduled Session',
    ];
    if (evt.notes) descParts.push(`Notes: ${evt.notes}`);
    if (evt.rawSnippet) descParts.push(`Notice excerpt: ${evt.rawSnippet}`);
    descParts.push('Decoded via Notice Decoder (SETU 2026 Hackathon)');

    lines.push(`DESCRIPTION:${escapeIcsText(descParts.join('\\n'))}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:OPAQUE');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return {
    icsString: lines.join('\r\n'),
    exportedCount: validEvents.length,
    skippedCount: skippedReasons.length,
    skippedReasons,
  };
}

/**
 * Initiates browser download of .ics file
 */
export function downloadIcsFile(events: NoticeEvent[], filename: string = 'college_schedule.ics'): { success: boolean; exportedCount: number; skippedCount: number; skippedReasons: string[] } {
  const { icsString, exportedCount, skippedCount, skippedReasons } = generateIcsContent(events);

  if (exportedCount === 0) {
    return { success: false, exportedCount: 0, skippedCount, skippedReasons };
  }

  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, exportedCount, skippedCount, skippedReasons };
}
