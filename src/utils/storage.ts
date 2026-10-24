import {
  AppDatabase,
  StudentProfile,
  Course,
  TimetableEntry,
  AcademicTask,
  PracticalSession,
  ReportDraft,
  RevisionTopic,
  StudyResource,
} from '../types/index.ts';

export const STORAGE_KEY = 'polyvex_db_v1';
const LEGACY_STORAGE_KEY = 'campuspilot_db_v1';

// Known fictional sample IDs to purge if found in legacy storage
const FICTIONAL_COURSE_IDS = new Set(['c-eee311', 'c-mth301', 'c-eee313', 'c-phy107']);
const FICTIONAL_TASK_IDS = new Set(['task-1', 'task-2', 'task-3', 'task-4']);
const FICTIONAL_PRACTICAL_IDS = new Set(['prac-1', 'prac-2']);
const FICTIONAL_REPORT_IDS = new Set(['rep-draft-1']);
const FICTIONAL_TOPIC_IDS = new Set(['top-1', 'top-2', 'top-3', 'top-4']);
const FICTIONAL_RESOURCE_IDS = new Set(['res-1', 'res-2', 'res-3']);

// Clean initial state for new users - NO fictional data, starts completely empty
export const INITIAL_PROFILE: StudentProfile = {
  name: '',
  institution: '',
  faculty: '',
  department: '',
  level: '',
  semester: 'Harmattan / First',
  academicSession: '',
  preferredTheme: 'dark',
  weekStartPreference: 'Monday',
  onboardingCompleted: false,
};

export const INITIAL_COURSES: Course[] = [];
export const INITIAL_TIMETABLE: TimetableEntry[] = [];
export const INITIAL_TASKS: AcademicTask[] = [];
export const INITIAL_PRACTICALS: PracticalSession[] = [];
export const INITIAL_REPORTS: ReportDraft[] = [];
export const INITIAL_TOPICS: RevisionTopic[] = [];
export const INITIAL_RESOURCES: StudyResource[] = [];

/**
 * Filter out any fictional sample data from a database object
 */
export function purgeFictionalSampleData(db: AppDatabase): AppDatabase {
  const isDemoProfile =
    db.profile.name === 'Chidi' &&
    (db.profile.institution.includes('FUTO') || db.profile.institution.includes('Federal University of Technology'));

  const cleanedProfile: StudentProfile = isDemoProfile
    ? { ...INITIAL_PROFILE, preferredTheme: db.profile.preferredTheme || 'dark' }
    : {
        ...db.profile,
        preferredTheme: db.profile.preferredTheme || 'dark',
      };

  return {
    ...db,
    profile: cleanedProfile,
    courses: (db.courses || []).filter((c) => !FICTIONAL_COURSE_IDS.has(c.id)),
    timetable: (db.timetable || []).filter((t) => !FICTIONAL_COURSE_IDS.has(t.courseId)),
    tasks: (db.tasks || []).filter((t) => !FICTIONAL_TASK_IDS.has(t.id) && !FICTIONAL_COURSE_IDS.has(t.courseId)),
    practicals: (db.practicals || []).filter((p) => !FICTIONAL_PRACTICAL_IDS.has(p.id) && !FICTIONAL_COURSE_IDS.has(p.courseId)),
    reports: (db.reports || []).filter((r) => !FICTIONAL_REPORT_IDS.has(r.id) && !FICTIONAL_COURSE_IDS.has(r.courseId)),
    topics: (db.topics || []).filter((tp) => !FICTIONAL_TOPIC_IDS.has(tp.id) && !FICTIONAL_COURSE_IDS.has(tp.courseId)),
    revisionSessions: db.revisionSessions || [],
    resources: (db.resources || []).filter((res) => !FICTIONAL_RESOURCE_IDS.has(res.id) && !FICTIONAL_COURSE_IDS.has(res.courseId)),
  };
}

/**
 * Creates a brand new empty database
 */
export function createEmptyDatabase(): AppDatabase {
  return {
    version: 1,
    profile: { ...INITIAL_PROFILE },
    courses: [],
    timetable: [],
    tasks: [],
    practicals: [],
    reports: [],
    topics: [],
    revisionSessions: [],
    resources: [],
  };
}

/**
 * Load database from localStorage. Ensures no fictional sample records pollute user workspace.
 */
export function loadDatabase(): AppDatabase {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);

    // Check for legacy storage key if modern key not set
    if (!raw) {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        try {
          const parsedLegacy = JSON.parse(legacyRaw);
          const cleaned = purgeFictionalSampleData(parsedLegacy);
          saveDatabase(cleaned);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          return cleaned;
        } catch {
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      }
    }

    if (!raw) {
      const emptyDb = createEmptyDatabase();
      saveDatabase(emptyDb);
      return emptyDb;
    }

    const parsed: AppDatabase = JSON.parse(raw);
    // Sanitize any remaining fictional items
    const cleaned = purgeFictionalSampleData(parsed);

    // If cleaning removed fictional items, re-save
    if (
      cleaned.courses.length !== (parsed.courses || []).length ||
      cleaned.tasks.length !== (parsed.tasks || []).length ||
      cleaned.profile.name !== parsed.profile?.name
    ) {
      saveDatabase(cleaned);
    }

    return cleaned;
  } catch (err) {
    console.error('Failed to parse database from localStorage:', err);
    return createEmptyDatabase();
  }
}

/**
 * Save database to localStorage
 */
export function saveDatabase(db: AppDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Failed to save database to localStorage:', err);
  }
}

/**
 * Reset to completely empty clean workspace
 */
export function resetToCleanWorkspace(): AppDatabase {
  const emptyDb = createEmptyDatabase();
  saveDatabase(emptyDb);
  return emptyDb;
}

/**
 * Export database as formatted JSON
 */
export function exportDatabaseAsJson(db: AppDatabase): string {
  const exportPayload = {
    ...db,
    lastExportDate: new Date().toISOString(),
    _meta: {
      appName: 'POLYVEX',
      exportTimestamp: new Date().toISOString(),
      institution: db.profile.institution,
      schemaVersion: 1,
    },
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Export tasks list to standard CSV
 */
export function exportTasksToCsv(tasks: AcademicTask[], courses: Course[]): string {
  const courseMap = new Map(courses.map((c) => [c.id, c.code]));
  const headers = [
    'Title',
    'Course',
    'Type',
    'Date Assigned',
    'Due Date',
    'Due Time',
    'Priority',
    'Status',
    'Percent Complete',
    'Notes',
  ];
  const rows = tasks.map((t) => [
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${courseMap.get(t.courseId) || ''}"`,
    `"${t.taskType}"`,
    `"${t.dateAssigned}"`,
    `"${t.dueDate || ''}"`,
    `"${t.dueTime || ''}"`,
    `"${t.priority}"`,
    `"${t.status}"`,
    `"${t.percentComplete || 0}%"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
