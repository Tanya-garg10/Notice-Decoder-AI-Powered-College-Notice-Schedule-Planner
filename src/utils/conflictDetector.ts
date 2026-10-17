import { NoticeEvent, Conflict } from '../types/notice';
import { timeToMinutes, minutesToTimeString, formatDateDisplay } from './parser';

/**
 * Detects conflicts among a list of events according to strict scheduling math:
 * - Timed events on the same date conflict ONLY when their time intervals overlap (startA < endB && startB < endA).
 * - Back-to-back events (endA === startB) are NOT conflicts.
 * - Events on different dates NEVER conflict.
 * - Deadlines that fall inside scheduled events (startA <= deadlineB && deadlineB <= endA) are flagged.
 * - Incomplete time information on same-date events is flagged as ambiguous rather than falsely claiming 0 conflicts.
 * - No duplicate pairs.
 */
export function detectConflicts(events: NoticeEvent[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const count = events.length;

  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const a = events[i];
      const b = events[j];

      // Rule: Events on different dates must NEVER conflict
      if (!a.date || !b.date || a.date !== b.date) {
        continue;
      }

      const dateStr = a.date;
      const formattedDate = formatDateDisplay(dateStr);

      const startMinA = timeToMinutes(a.startTime);
      const endMinA = timeToMinutes(a.endTime);
      const startMinB = timeToMinutes(b.startTime);
      const endMinB = timeToMinutes(b.endTime);

      // Check for incomplete time data
      const aHasFullTime = startMinA !== null && endMinA !== null;
      const bHasFullTime = startMinB !== null && endMinB !== null;

      // Case 1: Both are fully timed non-deadline events
      if (!a.isDeadline && !b.isDeadline) {
        if (aHasFullTime && bHasFullTime) {
          // Strictly overlapping intervals: startA < endB && startB < endA
          // Note: if endA === startB, they are back-to-back and NOT conflicts.
          if (startMinA < endMinB && startMinB < endMinA) {
            const overlapStartMin = Math.max(startMinA, startMinB);
            const overlapEndMin = Math.min(endMinA, endMinB);
            const overlapDuration = overlapEndMin - overlapStartMin;

            if (overlapDuration > 0) {
              const startStr = minutesToTimeString(overlapStartMin);
              const endStr = minutesToTimeString(overlapEndMin);

              let suggestion = 'Check with the department coordinator to reschedule or request attendance waiver.';
              if (a.type === 'Exam' || b.type === 'Exam') {
                suggestion = 'Exam slots are compulsory. Contact the course professor immediately to request a makeup slot or official permission.';
              } else if (a.venue && b.venue && a.venue !== b.venue) {
                suggestion = `Events are in different venues (${a.venue} vs ${b.venue}). Prioritize the mandatory session and request slides/recording for the other.`;
              }

              conflicts.push({
                id: `conflict-${a.id}-${b.id}`,
                type: 'time_overlap',
                severity: 'high',
                eventA: a,
                eventB: b,
                date: dateStr,
                overlapStartTime: startStr,
                overlapEndTime: endStr,
                overlapMinutes: overlapDuration,
                title: `Time Overlap: "${a.title}" & "${b.title}"`,
                description: `These events on ${formattedDate} overlap from ${startStr} to ${endStr} (${overlapDuration} mins overlap).`,
                suggestion,
              });
              continue;
            }
          }
        } else {
          // One or both events on same date lack complete start/end times
          // Do not claim zero conflicts! Flag as ambiguous review
          conflicts.push({
            id: `ambiguous-${a.id}-${b.id}`,
            type: 'ambiguous_time',
            severity: 'info',
            eventA: a,
            eventB: b,
            date: dateStr,
            title: `Unverified Time on ${formattedDate}`,
            description: `Both "${a.title}" and "${b.title}" take place on ${formattedDate}, but one or both are missing complete start/end times.`,
            suggestion: 'Edit event times to confirm whether these sessions clash.',
          });
          continue;
        }
      }

      // Case 2: One is a deadline, one is a scheduled timed event
      // Deadline inside an event
      const checkDeadlineInside = (deadlineEvt: NoticeEvent, timedEvt: NoticeEvent, deadMin: number | null, tStart: number | null, tEnd: number | null) => {
        if (deadMin === null || tStart === null || tEnd === null) return;

        // Deadline strictly within or at the boundary of an active session
        // e.g. 11:00 AM to 12:30 PM with deadline at 12:00 PM
        if (deadMin > tStart && deadMin <= tEnd) {
          const deadlineTimeStr = minutesToTimeString(deadMin);
          conflicts.push({
            id: `conflict-deadline-${deadlineEvt.id}-${timedEvt.id}`,
            type: 'deadline_inside_event',
            severity: 'high',
            eventA: deadlineEvt,
            eventB: timedEvt,
            date: dateStr,
            overlapStartTime: timedEvt.startTime,
            overlapEndTime: timedEvt.endTime,
            title: `Deadline Clash: "${deadlineEvt.title}" during "${timedEvt.title}"`,
            description: `The deadline (${deadlineTimeStr}) falls directly inside "${timedEvt.title}" (${timedEvt.startTime} – ${timedEvt.endTime}). You cannot submit in person while attending this session.`,
            suggestion: `Submit "${deadlineEvt.title}" to ${deadlineEvt.venue || 'the office'} before ${timedEvt.startTime}, or request early electronic submission.`,
          });
        }
      };

      if (a.isDeadline && !b.isDeadline && bHasFullTime) {
        checkDeadlineInside(a, b, startMinA, startMinB, endMinB);
      } else if (b.isDeadline && !a.isDeadline && aHasFullTime) {
        checkDeadlineInside(b, a, startMinB, startMinA, endMinA);
      }
    }
  }

  return conflicts;
}
