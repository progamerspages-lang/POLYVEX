import { TimetableEntry, AcademicTask, Course } from '../types/index.ts';

/**
 * Generates an iCalendar (.ics) string for upcoming academic tasks and classes
 */
export function generateIcsCalendar(tasks: AcademicTask[], timetable: TimetableEntry[], courses: Course[]): string {
  const courseMap = new Map(courses.map(c => [c.id, c.code]));

  function formatIcsDate(dateStr?: string, timeStr?: string): string {
    if (!dateStr) return '';
    const cleanDate = dateStr.replace(/-/g, '');
    const cleanTime = (timeStr || '12:00').replace(/:/g, '') + '00';
    return `${cleanDate}T${cleanTime}`;
  }

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Polyvex//Academic Organizer//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Polyvex Academic Schedule',
  ];

  // Add tasks with deadlines
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const courseCode = courseMap.get(task.courseId) || 'Course';
    const startIso = formatIcsDate(task.dueDate, task.dueTime || '12:00');
    const endIso = formatIcsDate(task.dueDate, task.dueTime ? undefined : '13:00');

    lines.push(
      'BEGIN:VEVENT',
      `UID:task-${task.id}@polyvex.app`,
      `DTSTAMP:${formatIcsDate(new Date().toISOString().split('T')[0], '00:00')}Z`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso || startIso}`,
      `SUMMARY:[${courseCode}] ${task.title.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${(task.description || task.notes || '').replace(/\n/g, '\\n')}`,
      `STATUS:${task.status === 'Completed' || task.status === 'Submitted' ? 'COMPLETED' : 'CONFIRMED'}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadCalendarFile(icsContent: string, filename = 'polyvex-schedule.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
