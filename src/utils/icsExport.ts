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
  const cleanDate = isoDate.replace(/-/g, '');

  if (!timeStr || !timeStr.trim()) {
    // All-day event/deadline without specific hours: VALUE=DATE:YYYYMMDD
    return {
      dtstart: `DTSTART;VALUE=DATE:${cleanDate}`,
      dtend: `DTEND;VALUE=DATE:${cleanDate}`,
      isAllDay: true,
    };
  }

  const minutes = timeToMinutes(timeStr);
  if (minutes === null) {
    return {
      dtstart: `DTSTART;VALUE=DATE:${cleanDate}`,
      isAllDay: true,
    };
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const timeFormatted = `${hours.toString().padStart(2, '0')}${mins.toString().padStart(2, '0')}00`;

  return {
    dtstart: `DTSTART:${cleanDate}T${timeFormatted}`,
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
