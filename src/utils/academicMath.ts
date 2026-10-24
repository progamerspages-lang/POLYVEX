import { TimetableEntry, AppDatabase } from '../types/index.ts';

/**
 * Calculates calendar days remaining until a deadline.
 * Handles month/year boundaries and local dates without timezone offset skew.
 */
export function calculateDaysRemaining(
  dueDateStr?: string,
  currentDate: Date = new Date()
): {
  daysRemaining: number | null;
  label: string;
  status: 'overdue' | 'due-today' | 'due-soon' | 'upcoming' | 'none';
} {
  if (!dueDateStr) {
    return { daysRemaining: null, label: 'No deadline', status: 'none' };
  }

  // Parse YYYY-MM-DD components directly to avoid timezone skew
  const parts = dueDateStr.split('-');
  if (parts.length !== 3) {
    return { daysRemaining: null, label: 'Invalid date', status: 'none' };
  }

  const dueYear = parseInt(parts[0], 10);
  const dueMonth = parseInt(parts[1], 10) - 1;
  const dueDay = parseInt(parts[2], 10);

  const dueUtc = Date.UTC(dueYear, dueMonth, dueDay);
  const curUtc = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((dueUtc - curUtc) / msPerDay);

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      daysRemaining: diffDays,
      label: `Overdue by ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'}`,
      status: 'overdue',
    };
  }

  if (diffDays === 0) {
    return {
      daysRemaining: 0,
      label: 'Due today',
      status: 'due-today',
    };
  }

  if (diffDays === 1) {
    return {
      daysRemaining: 1,
      label: 'Due tomorrow',
      status: 'due-soon',
    };
  }

  if (diffDays <= 3) {
    return {
      daysRemaining: diffDays,
      label: `Due in ${diffDays} days`,
      status: 'due-soon',
    };
  }

  return {
    daysRemaining: diffDays,
    label: `Due in ${diffDays} days`,
    status: 'upcoming',
  };
}

/**
 * Validates that end time is strictly after start time.
 * Expects "HH:MM" format.
 */
export function isValidTimeInterval(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return false;
  const startMin = sH * 60 + sM;
  const endMin = eH * 60 + eM;
  return endMin > startMin;
}

/**
 * Detects overlapping timetable entries for the same day of the week.
 * Returns a map of entry ID -> list of conflicting entry IDs.
 */
export function detectTimetableConflicts(entries: TimetableEntry[]): Map<string, string[]> {
  const conflictMap = new Map<string, string[]>();

  for (let i = 0; i < entries.length; i++) {
    const a = entries[i];
    const conflictsForA: string[] = [];

    const [asH, asM] = a.startTime.split(':').map(Number);
    const [aeH, aeM] = a.endTime.split(':').map(Number);
    const aStart = asH * 60 + asM;
    const aEnd = aeH * 60 + aeM;

    for (let j = 0; j < entries.length; j++) {
      if (i === j) continue;
      const b = entries[j];
      if (a.dayOfWeek !== b.dayOfWeek) continue;

      const [bsH, bsM] = b.startTime.split(':').map(Number);
      const [beH, beM] = b.endTime.split(':').map(Number);
      const bStart = bsH * 60 + bsM;
      const bEnd = beH * 60 + beM;

      // Overlap exists if: aStart < bEnd AND aEnd > bStart
      if (aStart < bEnd && aEnd > bStart) {
        conflictsForA.push(b.id);
      }
    }

    if (conflictsForA.length > 0) {
      conflictMap.set(a.id, conflictsForA);
    }
  }

  return conflictMap;
}

/**
 * Spaced repetition interval suggestion based on 1-5 confidence level.
 * 1 -> 1 day
 * 2 -> 2 days
 * 3 -> 4 days
 * 4 -> 7 days
 * 5 -> 14 days
 */
export function calculateSuggestedNextReview(
  confidence: number,
  baseDate: Date = new Date()
): { nextReviewDate: string; intervalDays: number; rationale: string } {
  const intervals: Record<number, { days: number; reason: string }> = {
    1: { days: 1, reason: 'Level 1: Needs immediate reinforcement within 24 hours.' },
    2: { days: 2, reason: 'Level 2: Early comprehension; review in 2 days to cement retention.' },
    3: { days: 4, reason: 'Level 3: Moderate understanding; 4-day interval test.' },
    4: { days: 7, reason: 'Level 4: Strong grasp; 1-week interval maintenance.' },
    5: { days: 14, reason: 'Level 5: Mastered; 2-week refresh check.' },
  };

  const config = intervals[Math.min(5, Math.max(1, Math.round(confidence)))] || intervals[3];
  const target = new Date(baseDate.getTime());
  target.setDate(target.getDate() + config.days);

  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');

  return {
    nextReviewDate: `${year}-${month}-${day}`,
    intervalDays: config.days,
    rationale: config.reason,
  };
}

/**
 * Practical Science & Electrical Engineering Calculation Validator:
 * Validates Ohm's Law (V = I * R) and Power (P = V * I) with real numeric tolerances.
 */
export function checkOhmLawCalculations(
  voltage?: number,
  current?: number,
  resistance?: number
): {
  isConsistent: boolean;
  computedVoltage?: number;
  computedCurrent?: number;
  computedResistance?: number;
  powerWatts?: number;
  discrepancyPercent?: number;
  message: string;
} {
  if (voltage !== undefined && current !== undefined && resistance !== undefined) {
    if (current <= 0 || resistance <= 0) {
      return { isConsistent: false, message: 'Current and resistance must be greater than zero.' };
    }
    const expectedV = current * resistance;
    const diff = Math.abs(voltage - expectedV);
    const discrepancyPercent = (diff / expectedV) * 100;
    const isConsistent = discrepancyPercent <= 5.0; // 5% tolerance for lab instrument error
    const power = voltage * current;

    return {
      isConsistent,
      computedVoltage: Number(expectedV.toFixed(4)),
      powerWatts: Number(power.toFixed(4)),
      discrepancyPercent: Number(discrepancyPercent.toFixed(2)),
      message: isConsistent
        ? `Readings are consistent (V = I × R = ${expectedV.toFixed(2)}V, discrepancy: ${discrepancyPercent.toFixed(1)}%). Power: ${power.toFixed(3)}W.`
        : `Discrepancy detected: Measured V is ${voltage}V, but I × R yields ${expectedV.toFixed(2)}V (${discrepancyPercent.toFixed(1)}% discrepancy). Check apparatus calibration or meter shunt resistance.`,
    };
  }

  // Two parameters provided; calculate the third
  if (voltage !== undefined && current !== undefined && current > 0) {
    const r = voltage / current;
    const p = voltage * current;
    return {
      isConsistent: true,
      computedResistance: Number(r.toFixed(4)),
      powerWatts: Number(p.toFixed(4)),
      message: `Calculated R = V / I = ${r.toFixed(2)}Ω. Power = ${p.toFixed(3)}W.`,
    };
  }

  if (voltage !== undefined && resistance !== undefined && resistance > 0) {
    const i = voltage / resistance;
    const p = (voltage * voltage) / resistance;
    return {
      isConsistent: true,
      computedCurrent: Number(i.toFixed(4)),
      powerWatts: Number(p.toFixed(4)),
      message: `Calculated I = V / R = ${i.toFixed(4)}A. Power = ${p.toFixed(3)}W.`,
    };
  }

  if (current !== undefined && resistance !== undefined) {
    const v = current * resistance;
    const p = current * current * resistance;
    return {
      isConsistent: true,
      computedVoltage: Number(v.toFixed(4)),
      powerWatts: Number(p.toFixed(4)),
      message: `Calculated V = I × R = ${v.toFixed(2)}V. Power = ${p.toFixed(3)}W.`,
    };
  }

  return {
    isConsistent: false,
    message: 'Provide at least two parameters (Voltage, Current, Resistance) to calculate or verify.',
  };
}

/**
 * Validates full JSON backup schema and sanitizes records
 */
export function validateBackupSchema(data: any): {
  valid: boolean;
  errors: string[];
  sanitized?: AppDatabase;
} {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Backup file does not contain a valid JSON object.'] };
  }

  if (!Array.isArray(data.courses)) {
    errors.push('Missing or invalid "courses" array.');
  }
  if (!Array.isArray(data.timetable)) {
    errors.push('Missing or invalid "timetable" array.');
  }
  if (!Array.isArray(data.tasks)) {
    errors.push('Missing or invalid "tasks" array.');
  }
  if (!Array.isArray(data.practicals)) {
    errors.push('Missing or invalid "practicals" array.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const sanitized: AppDatabase = {
    version: Number(data.version) || 1,
    profile: {
      name: String(data.profile?.name || ''),
      institution: String(data.profile?.institution || ''),
      faculty: String(data.profile?.faculty || ''),
      department: String(data.profile?.department || ''),
      level: String(data.profile?.level || ''),
      semester: data.profile?.semester === 'Rain / Second' ? 'Rain / Second' : 'Harmattan / First',
      academicSession: String(data.profile?.academicSession || ''),
      preferredTheme: data.profile?.preferredTheme || 'dark',
      weekStartPreference: data.profile?.weekStartPreference === 'Sunday' ? 'Sunday' : 'Monday',
      onboardingCompleted: Boolean(data.profile?.onboardingCompleted),
    },
    courses: data.courses.map((c: any) => ({
      id: String(c.id || Math.random().toString(36).substring(2, 9)),
      code: String(c.code || '').trim(),
      title: String(c.title || '').trim(),
      creditUnits: Number(c.creditUnits) || 3,
      department: c.department ? String(c.department) : undefined,
      semester: c.semester || 'Harmattan / First',
      lecturer: c.lecturer ? String(c.lecturer) : undefined,
      notes: c.notes ? String(c.notes) : undefined,
      color: String(c.color || '#00674f'),
    })),
    timetable: data.timetable.map((t: any) => ({
      id: String(t.id || Math.random().toString(36).substring(2, 9)),
      courseId: String(t.courseId || ''),
      dayOfWeek: t.dayOfWeek || 'Monday',
      startTime: String(t.startTime || '08:00'),
      endTime: String(t.endTime || '10:00'),
      venue: String(t.venue || 'Classroom'),
      activityType: t.activityType || 'lecture',
      lecturer: t.lecturer ? String(t.lecturer) : undefined,
      notes: t.notes ? String(t.notes) : undefined,
      recurring: t.recurring !== false,
      cancelledDates: Array.isArray(t.cancelledDates) ? t.cancelledDates : [],
    })),
    tasks: data.tasks.map((task: any) => ({
      id: String(task.id || Math.random().toString(36).substring(2, 9)),
      title: String(task.title || 'Untitled Task'),
      courseId: String(task.courseId || ''),
      description: task.description ? String(task.description) : '',
      taskType: task.taskType || 'Assignment',
      dateAssigned: String(task.dateAssigned || new Date().toISOString().split('T')[0]),
      dueDate: task.dueDate ? String(task.dueDate) : undefined,
      dueTime: task.dueTime ? String(task.dueTime) : undefined,
      priority: task.priority || 'Medium',
      status: task.status || 'Not Started',
      percentComplete: Number(task.percentComplete) || 0,
      notes: task.notes ? String(task.notes) : '',
      resourceLinks: Array.isArray(task.resourceLinks) ? task.resourceLinks : [],
      createdAt: String(task.createdAt || new Date().toISOString()),
      updatedAt: String(task.updatedAt || new Date().toISOString()),
    })),
    practicals: Array.isArray(data.practicals) ? data.practicals : [],
    reports: Array.isArray(data.reports) ? data.reports : [],
    topics: Array.isArray(data.topics) ? data.topics : [],
    revisionSessions: Array.isArray(data.revisionSessions) ? data.revisionSessions : [],
    resources: Array.isArray(data.resources) ? data.resources : [],
    lastExportDate: data.lastExportDate,
  };

  return { valid: true, errors: [], sanitized };
}
