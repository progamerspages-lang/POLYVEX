import React from 'react';
import {
  Calendar,
  CheckSquare,
  Clock,
  AlertTriangle,
  Brain,
  FlaskConical,
  GraduationCap,
  ArrowRight,
  Plus,
  CheckCircle2,
  FolderOpen,
  Sparkles
} from 'lucide-react';
import { AppDatabase, Course, DayOfWeek } from '../types/index.ts';
import { calculateDaysRemaining } from '../utils/academicMath.ts';
import { ScreenTab } from './Navigation.tsx';
import { PolyvexLogo } from './PolyvexLogo.tsx';

interface DashboardProps {
  db: AppDatabase;
  onNavigate: (tab: ScreenTab) => void;
  onOpenQuickAdd: (type: 'task' | 'class' | 'practical' | 'topic') => void;
  onSelectTask?: (taskId: string) => void;
  onSelectReport?: (reportId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  db,
  onNavigate,
  onOpenQuickAdd,
  onSelectTask,
  onSelectReport,
}) => {
  const { profile, courses, timetable, tasks, practicals, reports, topics, resources } = db;
  const courseMap = new Map<string, Course>(courses.map(c => [c.id, c]));

  // Current day & greeting calculation
  const now = new Date();
  const currentHour = now.getHours();
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  const dayNames: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayOfWeek = dayNames[now.getDay()];
  const formattedTodayDate = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Today's classes
  const todayClasses = timetable
    .filter(t => t.dayOfWeek === todayDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Task metrics & calculations
  const pendingTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Submitted');
  const completedTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'Submitted');

  const overdueTasks = pendingTasks.filter(t => {
    const calc = calculateDaysRemaining(t.dueDate, now);
    return calc.status === 'overdue';
  });

  const dueSoonTasks = pendingTasks.filter(t => {
    const calc = calculateDaysRemaining(t.dueDate, now);
    return calc.status === 'due-today' || calc.status === 'due-soon';
  });

  // Topics needing revision
  const topicsNeedingReview = topics.filter(t => {
    if (t.confidence <= 2) return true;
    if (t.nextRevisionDate) {
      const calc = calculateDaysRemaining(t.nextRevisionDate, now);
      return calc.status === 'overdue' || calc.status === 'due-today';
    }
    return false;
  });

  // Practicals with pending reports
  const pendingPracticals = practicals.filter(p => p.reportStatus !== 'Submitted');

  const institutionBadge = profile.institution
    ? `${profile.institution}${profile.department ? ` • ${profile.department}` : ''}${profile.level ? ` (${profile.level})` : ''}`
    : 'POLYVEX Academic Workspace';

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-[#171A1E] via-[#102427] to-[#171A1E] text-[#F5F7FA] rounded-2xl p-6 shadow-xl border border-[#262A30] relative overflow-hidden">
        <div className="absolute right-4 -top-6 opacity-10 pointer-events-none">
          <PolyvexLogo size={180} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#090B0D]/80 text-[#35F2D0] px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-[#35F2D0]/30 shadow-xs">
              <PolyvexLogo size={14} />
              <span>{institutionBadge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-sans text-[#F5F7FA]">
              {greeting}, {profile.name || 'Scholar'}!
            </h1>
            <p className="text-[#A1A8B3] text-sm mt-1">
              {formattedTodayDate} • {todayClasses.length} {todayClasses.length === 1 ? 'class' : 'classes'} scheduled today.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('courses')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#090B0D] hover:bg-[#20252C] text-[#F5F7FA] font-medium text-xs border border-[#262A30] transition cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-[#35F2D0]" />
              <span>Courses ({courses.length})</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ai-assistant')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#35F2D0] text-[#090B0D] font-bold text-xs hover:bg-[#35F2D0]/90 shadow-[0_0_15px_rgba(53,242,208,0.25)] cursor-pointer transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Study Tutor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clean Workspace Onboarding Banner when 0 courses exist */}
      {courses.length === 0 && (
        <div className="p-5 rounded-2xl bg-[#171A1E] border border-[#35F2D0]/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-[#090B0D] border border-[#262A30] text-[#35F2D0] flex-shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5F7FA]">
                Clean Academic Workspace Initialized
              </h3>
              <p className="text-xs text-[#A1A8B3] mt-1 max-w-xl">
                No fictional demo records are preloaded. All course lists and counters start at zero. Add your current courses to start scheduling classes and tracking coursework deadlines.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('courses')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#35F2D0] text-[#090B0D] font-bold text-xs hover:bg-[#35F2D0]/90 transition shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Course</span>
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#171A1E] p-4 rounded-xl border border-[#262A30] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A1A8B3]">Due Soon</span>
            <span className="p-1.5 bg-amber-950/40 text-amber-400 border border-amber-500/20 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#F5F7FA] mt-2 font-mono">
            {dueSoonTasks.length}
          </div>
          <div className="text-[11px] text-[#A1A8B3] mt-0.5">Tasks due within 3 days</div>
        </div>

        <div className="bg-[#171A1E] p-4 rounded-xl border border-[#262A30] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A1A8B3]">Overdue</span>
            <span className="p-1.5 bg-rose-950/40 text-rose-400 border border-rose-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2 font-mono">
            {overdueTasks.length}
          </div>
          <div className="text-[11px] text-[#A1A8B3] mt-0.5">Requires prompt submission</div>
        </div>

        <div className="bg-[#171A1E] p-4 rounded-xl border border-[#262A30] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A1A8B3]">Need Revision</span>
            <span className="p-1.5 bg-[#00AFC8]/10 text-[#00AFC8] border border-[#00AFC8]/20 rounded-lg">
              <Brain className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#F5F7FA] mt-2 font-mono">
            {topicsNeedingReview.length}
          </div>
          <div className="text-[11px] text-[#A1A8B3] mt-0.5">Low confidence / due review</div>
        </div>

        <div className="bg-[#171A1E] p-4 rounded-xl border border-[#262A30] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A1A8B3]">Completed</span>
            <span className="p-1.5 bg-emerald-950/40 text-[#35F2D0] border border-[#35F2D0]/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#35F2D0] mt-2 font-mono">
            {completedTasks.length}
          </div>
          <div className="text-[11px] text-[#A1A8B3] mt-0.5">Academic items cleared</div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on desktop): Classes & Deadlines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Classes Module */}
          <div className="bg-[#171A1E] rounded-xl border border-[#262A30] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#35F2D0]" />
                <h2 className="text-base font-bold text-[#F5F7FA]">
                  Today's Lecture Schedule ({todayDayOfWeek})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('timetable')}
                className="text-xs font-medium text-[#35F2D0] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Timetable</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todayClasses.length === 0 ? (
              <div className="text-center py-8 px-4 bg-[#090B0D] rounded-xl border border-dashed border-[#262A30]">
                <p className="text-sm text-[#A1A8B3]">No classes scheduled.</p>
                <button
                  type="button"
                  onClick={() => onOpenQuickAdd('class')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#35F2D0] text-[#090B0D] text-xs font-bold hover:bg-[#35F2D0]/90 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Class</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayClasses.map((entry) => {
                  const course = courseMap.get(entry.courseId);
                  return (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg border border-[#262A30] bg-[#090B0D]/50 flex items-center justify-between hover:bg-[#090B0D] transition"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-2.5 h-10 rounded-full shrink-0 mt-0.5"
                          style={{ backgroundColor: course?.color || '#35F2D0' }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#F5F7FA]">
                              {course?.code || 'Course'}
                            </span>
                            <span className="text-xs text-[#A1A8B3]">
                              {course?.title}
                            </span>
                            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#171A1E] text-[#35F2D0] border border-[#262A30]">
                              {entry.activityType}
                            </span>
                          </div>
                          <div className="text-xs text-[#A1A8B3] mt-1 flex items-center gap-3">
                            <span className="font-mono text-[#F5F7FA] font-medium">
                              {entry.startTime} – {entry.endTime}
                            </span>
                            <span>•</span>
                            <span>{entry.venue}</span>
                            {entry.lecturer && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[150px]">{entry.lecturer}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Academic Deadlines */}
          <div className="bg-[#171A1E] rounded-xl border border-[#262A30] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#35F2D0]" />
                <h2 className="text-base font-bold text-[#F5F7FA]">
                  Upcoming Tasks & Deadlines
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('tasks')}
                className="text-xs font-medium text-[#35F2D0] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Tasks ({pendingTasks.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 px-4 bg-[#090B0D] rounded-xl border border-dashed border-[#262A30]">
                <p className="text-sm text-[#A1A8B3]">No upcoming tasks.</p>
                <button
                  type="button"
                  onClick={() => onOpenQuickAdd('task')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#35F2D0] text-[#090B0D] text-xs font-bold hover:bg-[#35F2D0]/90 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Task</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingTasks.slice(0, 4).map((task) => {
                  const course = courseMap.get(task.courseId);
                  const deadline = calculateDaysRemaining(task.dueDate, now);

                  let badgeColor = 'bg-[#090B0D] text-[#A1A8B3] border border-[#262A30]';
                  if (deadline.status === 'overdue') {
                    badgeColor = 'bg-rose-950/60 text-rose-300 border border-rose-500/40';
                  } else if (deadline.status === 'due-today') {
                    badgeColor = 'bg-amber-950/60 text-amber-300 border border-amber-500/40 font-semibold';
                  } else if (deadline.status === 'due-soon') {
                    badgeColor = 'bg-amber-950/30 text-amber-300 border border-amber-500/20';
                  }

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask && onSelectTask(task.id)}
                      className="p-3 rounded-lg border border-[#262A30] bg-[#090B0D]/50 flex items-center justify-between hover:border-[#35F2D0]/50 hover:bg-[#090B0D] transition cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-[#35F2D0]">
                            {course?.code || 'Course'}
                          </span>
                          <span className="font-medium text-sm text-[#F5F7FA]">
                            {task.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#171A1E] text-[#A1A8B3] border border-[#262A30]">
                            {task.taskType}
                          </span>
                        </div>
                        <div className="text-xs text-[#A1A8B3] flex items-center gap-2">
                          <span>Priority: <span className={task.priority === 'High' ? 'text-rose-400 font-semibold' : ''}>{task.priority}</span></span>
                          {task.percentComplete !== undefined && (
                            <>
                              <span>•</span>
                              <span>{task.percentComplete}% done</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`inline-block text-xs px-2.5 py-1 rounded-md ${badgeColor}`}>
                          {deadline.label}
                        </span>
                        {task.dueDate && (
                          <div className="text-[11px] text-[#64748B] font-mono mt-0.5">
                            {task.dueDate} {task.dueTime || ''}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Labs, Revision Priorities, and Quick Resources */}
        <div className="space-y-6">
          {/* Practical Laboratory Organizer Widget */}
          <div className="bg-[#171A1E] rounded-xl border border-[#262A30] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#35F2D0]" />
                <h2 className="text-sm font-bold text-[#F5F7FA]">
                  Lab Practicals & Reports
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('practicals')}
                className="text-xs text-[#35F2D0] hover:underline cursor-pointer"
              >
                View ({practicals.length})
              </button>
            </div>

            {pendingPracticals.length === 0 ? (
              <div className="text-center py-6 px-3 bg-[#090B0D] rounded-xl border border-dashed border-[#262A30]">
                <p className="text-xs text-[#A1A8B3]">No practical reports yet.</p>
                <button
                  type="button"
                  onClick={() => onOpenQuickAdd('practical')}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#35F2D0] text-[#090B0D] font-bold text-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Practical</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingPracticals.slice(0, 2).map((prac) => {
                  const course = courseMap.get(prac.courseId);
                  const deadline = calculateDaysRemaining(prac.reportDeadline, now);
                  return (
                    <div
                      key={prac.id}
                      className="p-2.5 rounded-lg border border-[#262A30] bg-[#090B0D]/50 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-[#35F2D0]">{course?.code}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#171A1E] text-[#A1A8B3] border border-[#262A30]">
                          {prac.reportStatus}
                        </span>
                      </div>
                      <div className="font-medium text-[#F5F7FA] mt-1 line-clamp-1">
                        {prac.experimentTitle}
                      </div>
                      <div className="mt-1.5 flex justify-between items-center text-[11px] text-[#A1A8B3]">
                        <span>Report: {deadline.label}</span>
                        {prac.reportDraftId && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectReport && prac.reportDraftId) onSelectReport(prac.reportDraftId);
                              onNavigate('report-editor');
                            }}
                            className="text-[#35F2D0] font-medium hover:underline cursor-pointer"
                          >
                            Open Draft
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Revision Priorities Widget */}
          <div className="bg-[#171A1E] rounded-xl border border-[#262A30] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#00AFC8]" />
                <h2 className="text-sm font-bold text-[#F5F7FA]">
                  Revision Priorities
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('revision')}
                className="text-xs text-[#35F2D0] hover:underline cursor-pointer"
              >
                Tracker ({topics.length})
              </button>
            </div>

            {topicsNeedingReview.length === 0 ? (
              <div className="text-center py-6 px-3 bg-[#090B0D] rounded-xl border border-dashed border-[#262A30]">
                <p className="text-xs text-[#A1A8B3]">No revision items yet.</p>
                <button
                  type="button"
                  onClick={() => onOpenQuickAdd('topic')}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#35F2D0] text-[#090B0D] font-bold text-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Topic</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {topicsNeedingReview.slice(0, 3).map((topic) => {
                  const course = courseMap.get(topic.courseId);
                  return (
                    <div
                      key={topic.id}
                      className="p-2.5 rounded-lg border border-[#262A30] bg-[#090B0D]/50 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-[11px] text-[#00AFC8] block">
                          {course?.code}
                        </span>
                        <span className="font-medium text-[#F5F7FA] line-clamp-1">
                          {topic.title}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/20">
                          Confidence {topic.confidence}/5
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Study Resources */}
          <div className="bg-[#171A1E] rounded-xl border border-[#262A30] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#35F2D0]" />
                <h2 className="text-sm font-bold text-[#F5F7FA]">
                  Study Resources
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('resources')}
                className="text-xs text-[#35F2D0] hover:underline cursor-pointer"
              >
                All ({resources.length})
              </button>
            </div>

            {resources.length === 0 ? (
              <div className="text-center py-6 px-3 bg-[#090B0D] rounded-xl border border-dashed border-[#262A30]">
                <p className="text-xs text-[#A1A8B3]">No study resources added.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('resources')}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#35F2D0] text-[#090B0D] font-bold text-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Resource</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {resources.slice(0, 3).map((res) => (
                  <div
                    key={res.id}
                    className="p-2 rounded-lg border border-[#262A30] bg-[#090B0D]/50"
                  >
                    <div className="font-medium text-[#F5F7FA] truncate">
                      {res.title}
                    </div>
                    <div className="text-[11px] text-[#A1A8B3] truncate mt-0.5">
                      {res.linkOrRef}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
