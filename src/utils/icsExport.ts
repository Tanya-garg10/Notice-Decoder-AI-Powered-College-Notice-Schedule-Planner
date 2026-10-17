import { NoticeEvent } from '../types/notice';
import { timeToMinutes } from './parser';

function escapeIcsText(value: string): string {
  return (value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function compactUtcDate(date: Date): string {
  return \`\${date.getUTCFullYear()}\${String(date.getUTCMonth() + 1).padStart(2, '0')}\${String(date.getUTCDate()).padStart(2, '0')}T\${String(date.getUTCHours()).padStart(2, '0')}\${String(date.getUTCMinutes()).padStart(2, '0')}\${String(date.getUTCSeconds()).padStart(2, '0')}Z\`;
}

function parseIsoDate(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || '');
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

/** Convert an Asia/Kolkata local date and minutes-after-midnight to an explicit UTC timestamp. */
function indiaLocalToUtc(date: Date, minutes: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), Math.floor(minutes / 60) - 5, (minutes % 60) - 30, 0));
}

function timeMinutes(value: string): number | null {
  if (!value?.trim()) return null;
  const minutes = timeToMinutes(value);
  if (minutes === null || !Number.isInteger(minutes) || minutes < 0 || minutes >= 1440) return null;
  return minutes;
}

function makeEventLines(event: NoticeEvent, dtstamp: string): { lines?: string[]; reason?: string } {
  const date = parseIsoDate(event.date);
  if (!date) return { reason: 'Invalid or missing date (expected YYYY-MM-DD).' };

  const startText = event.startTime?.trim() || '';
  const endText = event.endTime?.trim() || '';
  const startMinutes = startText ? timeMinutes(startText) : null;
  const endMinutes = endText ? timeMinutes(endText) : null;

  if (startText && startMinutes === null) return { reason: \`Invalid start time: "\${startText}".\` };
  if (endText && endMinutes === null) return { reason: \`Invalid end time: "\${endText}".\` };
  if (endText && !startText) return { reason: 'An end time was provided without a start time.' };
  if (!event.isDeadline && startText && !endText) return { reason: 'Timed event is missing an end time.' };
  if (startMinutes !== null && endMinutes !== null && endMinutes <= startMinutes) {
    return { reason: 'End time must be later than start time on the same date.' };
  }

  const lines = ['BEGIN:VEVENT', \`UID:\${escapeIcsText(event.id)}@noticedecoder.setu2026\`, \`DTSTAMP:\${dtstamp}\`];

  if (startMinutes === null) {
    const endDate = new Date(date.getTime() + 86400000);
    const ymd = (d: Date) => \`\${d.getUTCFullYear()}\${String(d.getUTCMonth() + 1).padStart(2, '0')}\${String(d.getUTCDate()).padStart(2, '0')}\`;
    lines.push(\`DTSTART;VALUE=DATE:\${ymd(date)}\`);
    lines.push(\`DTEND;VALUE=DATE:\${ymd(endDate)}\`);
  } else {
    lines.push(\`DTSTART:\${compactUtcDate(indiaLocalToUtc(date, startMinutes))}\`);
    if (endMinutes !== null) {
      lines.push(\`DTEND:\${compactUtcDate(indiaLocalToUtc(date, endMinutes))}\`);
    } else {
      lines.push('DURATION:PT1M');
    }
  }

  const titlePrefix = event.isDeadline ? '[DEADLINE] ' : event.type === 'Exam' ? '[EXAM] ' : '';
  lines.push(\`SUMMARY:\${escapeIcsText(titlePrefix + (event.title || 'Untitled event'))}\`);
  if (event.venue?.trim()) lines.push(\`LOCATION:\${escapeIcsText(event.venue)}\`);

  const description = [
    \`Type: \${event.type || 'Other'}\`,
    event.isDeadline ? 'Status: Submission deadline' : 'Status: Scheduled event',
    event.notes ? \`Notes: \${event.notes}\` : '',
    event.rawSnippet ? \`Notice excerpt: \${event.rawSnippet}\` : '',
    'Decoded by Notice Decoder (SETU 2026).',
  ].filter(Boolean).join('\n');
  lines.push(\`DESCRIPTION:\${escapeIcsText(description)}\`);
  lines.push('STATUS:CONFIRMED', 'TRANSP:OPAQUE', 'END:VEVENT');
  return { lines };
}

/** Generate an RFC 5545 calendar. Invalid events are skipped with explicit reasons. */
export function generateIcsContent(
  events: NoticeEvent[],
  calendarName: string = 'Notice Decoder Schedule',
): { icsString: string; exportedCount: number; skippedCount: number; skippedReasons: string[] } {
  const now = new Date();
  const dtstamp = compactUtcDate(new Date(Math.floor(now.getTime() / 1000) * 1000));
  const eventLines: string[] = [];
  const skippedReasons: string[] = [];
  let exportedCount = 0;

  for (const event of events) {
    try {
      const result = makeEventLines(event, dtstamp);
      if (!result.lines) {
        skippedReasons.push(\`"\${event.title || 'Untitled event'}": \${result.reason || 'Could not validate event.'}\`);
        continue;
      }
      eventLines.push(...result.lines);
      exportedCount += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected event formatting error.';
      skippedReasons.push(\`"\${event.title || 'Untitled event'}": \${message}\`);
    }
  }

  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//SETU 2026 Hackathon//Notice Decoder v1.0//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    \`X-WR-CALNAME:\${escapeIcsText(calendarName.trim() || 'Notice Decoder Schedule')}\`,
    'X-WR-TIMEZONE:Asia/Kolkata',
    ...eventLines, 'END:VCALENDAR',
  ];

  return { icsString: \`\${lines.join('\r\n')}\r\n\`, exportedCount, skippedCount: skippedReasons.length, skippedReasons };
}

export function downloadIcsFile(
  events: NoticeEvent[],
  filename: string = 'college_schedule.ics',
): { success: boolean; exportedCount: number; skippedCount: number; skippedReasons: string[] } {
  const result = generateIcsContent(events);
  if (result.exportedCount === 0) {
    return { success: false, exportedCount: 0, skippedCount: result.skippedCount, skippedReasons: result.skippedReasons };
  }

  try {
    const blob = new Blob([result.icsString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.toLowerCase().endsWith('.ics') ? filename : \`\${filename}.ics\`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { success: true, exportedCount: result.exportedCount, skippedCount: result.skippedCount, skippedReasons: result.skippedReasons };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Browser could not initiate the download.';
    return { success: false, exportedCount: 0, skippedCount: result.skippedCount, skippedReasons: [...result.skippedReasons, message] };
  }
}
