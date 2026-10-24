import { RevisionTopic, AcademicTask, Course } from '../types/index.ts';

export interface RevisionPlanItem {
  id: string;
  day?: string; // 'Today' or 'Monday', 'Tuesday', etc.
  timeSlot: string; // e.g. "08:30 - 09:30"
  durationMinutes: number;
  courseId: string;
  courseCode: string;
  topicTitle: string;
  topicId?: string;
  priority: 'high' | 'medium' | 'normal';
  rationale: string;
  suggestedAction: string;
  completed: boolean;
}

export interface PlanOptions {
  timeframe: 'daily' | 'weekly';
  dailyHours: number; // e.g. 2, 4, 6
  focusOrientation: 'low-confidence' | 'deadlines' | 'balanced';
}

/**
 * Robust cross-browser clipboard copy with fallback
 */
export function safeCopyToClipboard(text: string): boolean {
  try {
    if (navigator?.clipboard?.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackCopyText(text);
      });
      return true;
    }
    return fallbackCopyText(text);
  } catch {
    return fallbackCopyText(text);
  }
}

function fallbackCopyText(text: string): boolean {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Calculates revision metrics across topics
 */
export function calculateRevisionStats(topics: RevisionTopic[]) {
  if (topics.length === 0) {
    return {
      total: 0,
      lowConfidenceCount: 0,
      moderateCount: 0,
      masteredCount: 0,
      averageConfidence: 0,
    };
  }

  const lowConfidenceCount = topics.filter((t) => t.confidence <= 2).length;
  const moderateCount = topics.filter((t) => t.confidence === 3).length;
  const masteredCount = topics.filter((t) => t.confidence >= 4).length;
  const sum = topics.reduce((acc, t) => acc + t.confidence, 0);

  return {
    total: topics.length,
    lowConfidenceCount,
    moderateCount,
    masteredCount,
    averageConfidence: Number((sum / topics.length).toFixed(1)),
  };
}

/**
 * Generates an automated, heuristic revision schedule prioritizing low-confidence topics (1 & 2)
 * and imminent academic deadlines.
 */
export function generateHeuristicRevisionPlan(
  topics: RevisionTopic[],
  tasks: AcademicTask[],
  courses: Course[],
  options: PlanOptions = { timeframe: 'daily', dailyHours: 4, focusOrientation: 'balanced' }
): RevisionPlanItem[] {
  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const now = new Date();
  const planItems: RevisionPlanItem[] = [];

  // 1. Score each topic based on confidence and review urgency
  interface ScoredCandidate {
    type: 'topic' | 'task';
    topic?: RevisionTopic;
    task?: AcademicTask;
    courseCode: string;
    courseId: string;
    title: string;
    score: number; // Higher = more urgent
    priority: 'high' | 'medium' | 'normal';
    rationale: string;
    action: string;
  }

  const candidates: ScoredCandidate[] = [];

  // Evaluate Revision Topics
  for (const topic of topics) {
    const course = courseMap.get(topic.courseId);
    const code = course?.code || 'Course';
    let score = 0;
    let rationale = '';
    let action = '';

    // Confidence weighting: 1=50pts, 2=40pts, 3=25pts, 4=10pts, 5=5pts
    const confWeight = (6 - Math.max(1, Math.min(5, topic.confidence))) * 10;
    score += confWeight;

    if (topic.confidence <= 2) {
      rationale = `Critical knowledge gap (Confidence ${topic.confidence}/5). Spaced repetition mandates early active recall before exam pressure builds.`;
      action = `Formula derivation & solving 2-3 foundational textbook examples without notes.`;
    } else if (topic.confidence === 3) {
      rationale = `Moderate understanding (${topic.confidence}/5). Transitioning from passive review to timed problem sets.`;
      action = `Solve 3 past examination questions under timed conditions to identify edge-cases.`;
    } else {
      rationale = `Maintenance review (${topic.confidence}/5). Quick reinforcement to keep retrieval pathways fresh.`;
      action = `15-minute quick flashcard recall & summarization from memory.`;
    }

    if (options.focusOrientation === 'low-confidence' && topic.confidence <= 2) {
      score += 25;
    }

    candidates.push({
      type: 'topic',
      topic,
      courseCode: code,
      courseId: topic.courseId,
      title: topic.title,
      score,
      priority: topic.confidence <= 2 ? 'high' : topic.confidence === 3 ? 'medium' : 'normal',
      rationale,
      action,
    });
  }

  // Evaluate Upcoming Academic Tasks/Deadlines
  for (const task of tasks) {
    if (task.status === 'Completed' || task.status === 'Submitted') continue;
    const course = courseMap.get(task.courseId);
    const code = course?.code || 'Course';

    let daysUntilDue = 999;
    if (task.dueDate) {
      const diffTime = new Date(`${task.dueDate}T23:59:59`).getTime() - now.getTime();
      daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    let score = 0;
    if (daysUntilDue <= 1) score = 70;
    else if (daysUntilDue <= 3) score = 55;
    else if (daysUntilDue <= 7) score = 40;
    else score = 15;

    if (task.priority === 'High') score += 15;
    if (options.focusOrientation === 'deadlines') score += 20;

    const rationale = `Approaching deadline: "${task.title}" is due in ${
      daysUntilDue <= 0 ? 'Today / Overdue' : `${daysUntilDue} day(s)`
    }. Prioritize submission readiness.`;

    const action = `Draft practical/assignment deliverables and verify rubrics against course syllabus.`;

    candidates.push({
      type: 'task',
      task,
      courseCode: code,
      courseId: task.courseId,
      title: task.title,
      score,
      priority: daysUntilDue <= 3 || task.priority === 'High' ? 'high' : 'medium',
      rationale,
      action,
    });
  }

  // Sort candidates by descending urgency score
  candidates.sort((a, b) => b.score - a.score);

  // Time slot templates
  const dailySlots = [
    { start: '08:30 - 09:30', duration: 60 },
    { start: '10:00 - 11:00', duration: 60 },
    { start: '11:15 - 12:00', duration: 45 },
    { start: '14:30 - 15:30', duration: 60 },
    { start: '16:00 - 17:00', duration: 60 },
    { start: '19:30 - 20:30', duration: 60 },
  ];

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (options.timeframe === 'daily') {
    // Determine how many slots based on target hours
    const maxSlots = Math.max(2, Math.min(6, Math.round(options.dailyHours)));
    const selectedSlots = dailySlots.slice(0, maxSlots);

    selectedSlots.forEach((slot, index) => {
      const candidate = candidates[index % candidates.length];
      if (!candidate) return;

      planItems.push({
        id: `plan-d-${index}-${Date.now().toString(36)}`,
        day: 'Today',
        timeSlot: slot.start,
        durationMinutes: slot.duration,
        courseId: candidate.courseId,
        courseCode: candidate.courseCode,
        topicTitle: candidate.title,
        topicId: candidate.topic?.id,
        priority: candidate.priority,
        rationale: candidate.rationale,
        suggestedAction: candidate.action,
        completed: false,
      });
    });
  } else {
    // Weekly Plan: 2 focused sessions per day for 7 days
    let candIdx = 0;
    weekDays.forEach((day, dayIndex) => {
      const slots = [
        { time: '09:00 - 10:15', dur: 75 },
        { time: '15:00 - 16:15', dur: 75 },
      ];

      slots.forEach((slot, slotIndex) => {
        if (candidates.length === 0) return;
        const candidate = candidates[candIdx % candidates.length];
        candIdx++;

        planItems.push({
          id: `plan-w-${dayIndex}-${slotIndex}-${Date.now().toString(36)}`,
          day,
          timeSlot: slot.time,
          durationMinutes: slot.dur,
          courseId: candidate.courseId,
          courseCode: candidate.courseCode,
          topicTitle: candidate.title,
          topicId: candidate.topic?.id,
          priority: candidate.priority,
          rationale: candidate.rationale,
          suggestedAction: candidate.action,
          completed: false,
        });
      });
    });
  }

  return planItems;
}

/**
 * Formats a clean markdown prompt for external AI chatbots (ChatGPT, Claude, Gemini Web)
 */
export function formatExternalPrompt(
  topics: RevisionTopic[],
  tasks: AcademicTask[],
  courses: Course[],
  options: PlanOptions
): string {
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const topicLines = topics.length > 0
    ? topics
        .map((t) => {
          const c = courseMap.get(t.courseId);
          return `- [${c?.code || 'Course'}] "${t.title}": Confidence ${t.confidence}/5, Status: ${t.status}${
            t.nextRevisionDate ? `, Next Review: ${t.nextRevisionDate}` : ''
          }`;
        })
        .join('\n')
    : 'No individual topics registered yet.';

  const taskLines = tasks.length > 0
    ? tasks
        .filter((t) => t.status !== 'Completed' && t.status !== 'Submitted')
        .map((t) => {
          const c = courseMap.get(t.courseId);
          return `- [${c?.code || 'Course'}] "${t.title}" (${t.taskType}): Due ${t.dueDate || 'Unscheduled'}, Priority: ${t.priority}`;
        })
        .join('\n')
    : 'No pending deadlines registered.';

  return `I am a university student using Polyvex to prepare for my examinations and coursework.
Please synthesize an optimized ${options.timeframe.toUpperCase()} REVISION SCHEDULE tailored to my workload and cognitive retention.

=== STUDY PARAMETERS ===
- Timeframe: ${options.timeframe === 'weekly' ? '7-Day Weekly Revision Timetable' : 'Daily Action Plan'}
- Available study allocation: ${options.dailyHours} hours/day
- Strategic Focus: ${options.focusOrientation.replace('-', ' ')}

=== MY TOPICS & CONFIDENCE RATINGS (1=Need Help, 5=Mastered) ===
${topicLines}

=== UPCOMING DEADLINES & EXAMINATIONS ===
${taskLines}

=== INSTRUCTIONS FOR THE REVISION PLAN ===
1. Prioritize low-confidence topics (levels 1 & 2) and imminent deadlines first.
2. Structure sessions into 45-60 min blocks followed by 10-15 min recall/buffer breaks.
3. For EACH study block, specify:
   - Specific time slot & duration
   - Course & specific topic
   - Explicit pedagogical reason WHY it is placed at this time
   - Concrete active revision technique (e.g., past questions, flashcards, derivation, problem set)
4. Keep the pace sustainable and prevent cramming fatigue.`;
}
