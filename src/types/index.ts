export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type ActivityType = 'lecture' | 'tutorial' | 'laboratory' | 'workshop' | 'seminar' | 'other';

export type TaskType =
  | 'Assignment'
  | 'Take-home test'
  | 'Quiz'
  | 'Examination'
  | 'Practical report'
  | 'Project'
  | 'Reading task'
  | 'Other academic task';

export type TaskPriority = 'Low' | 'Medium' | 'High';

export type TaskStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Completed';

export type ReportStatus = 'Not Started' | 'In Progress' | 'Ready for Review' | 'Submitted';

export type ResourceType =
  | 'PDF'
  | 'lecture note'
  | 'textbook reference'
  | 'website'
  | 'video'
  | 'past question'
  | 'personal note'
  | 'other';

export interface StudentProfile {
  name: string;
  institution: string;
  faculty: string;
  department: string;
  level: string; // e.g. "100L", "200L", "300L", "400L", "500L"
  semester: 'Harmattan / First' | 'Rain / Second';
  academicSession: string; // e.g. "2025/2026"
  preferredTheme: 'light' | 'dark' | 'system';
  weekStartPreference: 'Monday' | 'Sunday';
  onboardingCompleted: boolean;
}

export interface Course {
  id: string;
  code: string; // e.g. "MTH 201", "ENG 211", "CHM 101"
  title: string;
  creditUnits: number;
  department?: string;
  semester: 'Harmattan / First' | 'Rain / Second' | 'Both';
  lecturer?: string;
  notes?: string;
  color: string; // hex code or tailwind color token
}

export interface TimetableEntry {
  id: string;
  courseId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "08:00"
  endTime: string; // "10:00"
  venue: string; // e.g. "SEET Hall A", "Hall of Excellence"
  activityType: ActivityType;
  lecturer?: string;
  notes?: string;
  recurring: boolean;
  cancelledDates?: string[]; // ISO Date strings "YYYY-MM-DD" when class was cancelled
}

export interface AcademicTask {
  id: string;
  title: string;
  courseId: string;
  description?: string;
  taskType: TaskType;
  dateAssigned: string; // "YYYY-MM-DD"
  dueDate?: string; // "YYYY-MM-DD"
  dueTime?: string; // "23:59"
  priority: TaskPriority;
  status: TaskStatus;
  percentComplete?: number; // 0 - 100
  notes?: string;
  resourceLinks?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PracticalSession {
  id: string;
  courseId: string;
  experimentTitle: string;
  practicalDate: string; // "YYYY-MM-DD"
  reportDeadline?: string; // "YYYY-MM-DD"
  reportStatus: ReportStatus;
  experimentNotes?: string;
  apparatus?: string;
  measurementsNotes?: string;
  relatedResources?: string[];
  reportDraftId?: string;
}

export interface ReportDraft {
  id: string;
  practicalId?: string;
  courseId: string;
  experimentTitle: string;
  experimentDate: string;
  submissionDate: string;
  aim: string;
  objectives: string;
  apparatus: string;
  theory: string;
  diagramNotes: string;
  procedure: string;
  observations: string; // Raw measurements
  readingsTable: Array<{
    sn: number;
    voltage?: string;
    current?: string;
    resistance?: string;
    computedPower?: string;
    notes?: string;
  }>;
  calculations: string;
  discussion: string;
  sourcesOfError: string;
  precautions: string;
  conclusion: string;
  references: string;
  customSections?: Array<{ title: string; content: string }>;
  isHypothetical: boolean; // Flag to indicate illustrative/sample data
  lastSaved: string;
}

export interface RevisionTopic {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  confidence: number; // 1 to 5
  lastRevisedDate?: string; // "YYYY-MM-DD"
  nextRevisionDate?: string; // "YYYY-MM-DD"
  questionsCompleted?: number;
  practiceScore?: number; // 0-100%
  status: 'Needs Review' | 'On Track' | 'Mastered';
  notes?: string;
}

export interface RevisionSession {
  id: string;
  topicId: string;
  date: string; // "YYYY-MM-DD"
  durationMinutes: number;
  confidenceBefore: number;
  confidenceAfter: number;
  notes?: string;
}

export interface StudyResource {
  id: string;
  title: string;
  courseId: string;
  topic?: string;
  topicId?: string;
  type: ResourceType;
  linkOrRef: string;
  description?: string;
  tags: string[];
  dateAdded: string; // "YYYY-MM-DD"
  notes?: string;
}

export interface AppDatabase {
  version: number;
  profile: StudentProfile;
  courses: Course[];
  timetable: TimetableEntry[];
  tasks: AcademicTask[];
  practicals: PracticalSession[];
  reports: ReportDraft[];
  topics: RevisionTopic[];
  revisionSessions: RevisionSession[];
  resources: StudyResource[];
  lastExportDate?: string;
}
