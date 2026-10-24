import React, { useState, useEffect } from 'react';
import { AppDatabase, Course, TimetableEntry, AcademicTask, PracticalSession, ReportDraft, RevisionTopic, RevisionSession, StudyResource, StudentProfile, TaskStatus } from './types/index.ts';
import { loadDatabase, saveDatabase, INITIAL_PROFILE, INITIAL_COURSES, INITIAL_TIMETABLE, INITIAL_TASKS, INITIAL_PRACTICALS, INITIAL_REPORTS, INITIAL_TOPICS, INITIAL_RESOURCES } from './utils/storage.ts';
import { Navigation, ScreenTab } from './components/Navigation.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { TimetableModule } from './components/TimetableModule.tsx';
import { TasksModule } from './components/TasksModule.tsx';
import { CoursesModule } from './components/CoursesModule.tsx';
import { PracticalsModule } from './components/PracticalsModule.tsx';
import { ReportEditor } from './components/ReportEditor.tsx';
import { RevisionModule } from './components/RevisionModule.tsx';
import { AssistantModule } from './components/AssistantModule.tsx';
import { PromptLibraryModule } from './components/PromptLibraryModule.tsx';
import { ResourcesModule } from './components/ResourcesModule.tsx';
import { SettingsModule } from './components/SettingsModule.tsx';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [currentTab, setCurrentTab] = useState<ScreenTab>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return db.profile.preferredTheme === 'dark' ? 'dark' : 'light';
  });

  // Active practical report to open in editor
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Pre-fill state for AI Study Assistant
  const [assistantPrefill, setAssistantPrefill] = useState<{ courseId?: string; topic?: string }>({});

  // Sync database state to localStorage
  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  // Sync theme to HTML document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle URL query parameters (e.g. ?autostart=1 or ?tab=revision)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as ScreenTab | null;
    if (tabParam) {
      setCurrentTab(tabParam);
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    setDb((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        preferredTheme: nextTheme,
      },
    }));
  };

  // Quick Add handler
  const handleOpenQuickAdd = (type: 'task' | 'class' | 'practical' | 'topic') => {
    if (type === 'task') setCurrentTab('tasks');
    else if (type === 'class') setCurrentTab('timetable');
    else if (type === 'practical') setCurrentTab('practicals');
    else if (type === 'topic') setCurrentTab('revision');
  };

  // Open report editor with a draft
  const handleOpenReportDraft = (
    reportId?: string,
    practicalId?: string,
    courseId?: string,
    experimentTitle?: string
  ) => {
    if (reportId) {
      setSelectedReportId(reportId);
    } else {
      // Create new draft
      const newDraftId = `rep-${Date.now().toString(36)}`;
      const newDraft: ReportDraft = {
        id: newDraftId,
        practicalId,
        courseId: courseId || db.courses[0]?.id || '',
        experimentTitle: experimentTitle || 'New Laboratory Experiment',
        experimentDate: new Date().toISOString().split('T')[0],
        submissionDate: new Date().toISOString().split('T')[0],
        aim: '',
        objectives: '',
        apparatus: '',
        theory: '',
        diagramNotes: '',
        procedure: '',
        observations: '',
        readingsTable: [
          { sn: 1, voltage: '', current: '', resistance: '', computedPower: '', notes: '' },
        ],
        calculations: '',
        discussion: '',
        sourcesOfError: '',
        precautions: '',
        conclusion: '',
        references: '',
        isHypothetical: false,
        lastSaved: new Date().toISOString(),
      };

      setDb((prev) => {
        // Link to practical if applicable
        const practicals = prev.practicals.map((p) =>
          p.id === practicalId ? { ...p, reportDraftId: newDraftId } : p
        );
        return {
          ...prev,
          practicals,
          reports: [newDraft, ...prev.reports],
        };
      });

      setSelectedReportId(newDraftId);
    }
    setCurrentTab('report-editor');
  };

  // Profile update
  const handleUpdateProfile = (newProfile: StudentProfile) => {
    setDb((prev) => ({ ...prev, profile: newProfile }));
  };

  // Timetable Handlers
  const handleSaveTimetableEntry = (entry: TimetableEntry) => {
    setDb((prev) => {
      const exists = prev.timetable.some((e) => e.id === entry.id);
      return {
        ...prev,
        timetable: exists
          ? prev.timetable.map((e) => (e.id === entry.id ? entry : e))
          : [...prev.timetable, entry],
      };
    });
  };

  const handleDeleteTimetableEntry = (id: string) => {
    setDb((prev) => ({
      ...prev,
      timetable: prev.timetable.filter((e) => e.id !== id),
    }));
  };

  const handleDuplicateTimetableEntry = (entry: TimetableEntry) => {
    const duplicated: TimetableEntry = {
      ...entry,
      id: `tt-${Date.now().toString(36)}`,
    };
    setDb((prev) => ({
      ...prev,
      timetable: [...prev.timetable, duplicated],
    }));
  };

  const handleToggleCancelledDate = (entryId: string, dateStr: string) => {
    setDb((prev) => ({
      ...prev,
      timetable: prev.timetable.map((t) => {
        if (t.id !== entryId) return t;
        const cancelled = t.cancelledDates || [];
        const isCancelled = cancelled.includes(dateStr);
        return {
          ...t,
          cancelledDates: isCancelled
            ? cancelled.filter((d) => d !== dateStr)
            : [...cancelled, dateStr],
        };
      }),
    }));
  };

  // Task Handlers
  const handleSaveTask = (task: AcademicTask) => {
    setDb((prev) => {
      const exists = prev.tasks.some((t) => t.id === task.id);
      return {
        ...prev,
        tasks: exists ? prev.tasks.map((t) => (t.id === task.id ? task : t)) : [task, ...prev.tasks],
      };
    });
  };

  const handleDeleteTask = (id: string) => {
    setDb((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  };

  const handleDuplicateTask = (task: AcademicTask) => {
    const duplicated: AcademicTask = {
      ...task,
      id: `task-${Date.now().toString(36)}`,
      title: `${task.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDb((prev) => ({
      ...prev,
      tasks: [duplicated, ...prev.tasks],
    }));
  };

  const handleToggleTaskStatus = (id: string, newStatus: TaskStatus) => {
    setDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== id) return t;
        const percent = newStatus === 'Completed' || newStatus === 'Submitted' ? 100 : t.percentComplete;
        return { ...t, status: newStatus, percentComplete: percent, updatedAt: new Date().toISOString() };
      }),
    }));
  };

  // Course Handlers
  const handleSaveCourse = (course: Course) => {
    setDb((prev) => {
      const exists = prev.courses.some((c) => c.id === course.id);
      return {
        ...prev,
        courses: exists ? prev.courses.map((c) => (c.id === course.id ? course : c)) : [...prev.courses, course],
      };
    });
  };

  const handleDeleteCourse = (id: string) => {
    setDb((prev) => ({
      ...prev,
      courses: prev.courses.filter((c) => c.id !== id),
    }));
  };

  // Practicals Handlers
  const handleSavePractical = (prac: PracticalSession) => {
    setDb((prev) => {
      const exists = prev.practicals.some((p) => p.id === prac.id);
      return {
        ...prev,
        practicals: exists
          ? prev.practicals.map((p) => (p.id === prac.id ? prac : p))
          : [prac, ...prev.practicals],
      };
    });
  };

  const handleDeletePractical = (id: string) => {
    setDb((prev) => ({
      ...prev,
      practicals: prev.practicals.filter((p) => p.id !== id),
    }));
  };

  // Report Handlers
  const handleSaveReport = (report: ReportDraft) => {
    setDb((prev) => {
      const exists = prev.reports.some((r) => r.id === report.id);
      return {
        ...prev,
        reports: exists
          ? prev.reports.map((r) => (r.id === report.id ? report : r))
          : [report, ...prev.reports],
      };
    });
  };

  // Revision Topics Handlers
  const handleSaveTopic = (topic: RevisionTopic) => {
    setDb((prev) => {
      const exists = prev.topics.some((t) => t.id === topic.id);
      return {
        ...prev,
        topics: exists
          ? prev.topics.map((t) => (t.id === topic.id ? topic : t))
          : [...prev.topics, topic],
      };
    });
  };

  const handleDeleteTopic = (id: string) => {
    setDb((prev) => ({
      ...prev,
      topics: prev.topics.filter((t) => t.id !== id),
    }));
  };

  const handleRecordSession = (session: RevisionSession, updatedTopic: RevisionTopic) => {
    setDb((prev) => ({
      ...prev,
      revisionSessions: [session, ...prev.revisionSessions],
      topics: prev.topics.map((t) => (t.id === updatedTopic.id ? updatedTopic : t)),
    }));
  };

  // Resource Handlers
  const handleSaveResource = (res: StudyResource) => {
    setDb((prev) => {
      const exists = prev.resources.some((r) => r.id === res.id);
      return {
        ...prev,
        resources: exists
          ? prev.resources.map((r) => (r.id === res.id ? res : r))
          : [res, ...prev.resources],
      };
    });
  };

  const handleDeleteResource = (id: string) => {
    setDb((prev) => ({
      ...prev,
      resources: prev.resources.filter((r) => r.id !== id),
    }));
  };

  // Database Backup Import & Reset
  const handleImportBackup = (importedDb: AppDatabase) => {
    setDb(importedDb);
    saveDatabase(importedDb);
  };

  const handleResetDatabase = () => {
    const cleanDb: AppDatabase = {
      version: 1,
      profile: INITIAL_PROFILE,
      courses: INITIAL_COURSES,
      timetable: INITIAL_TIMETABLE,
      tasks: INITIAL_TASKS,
      practicals: INITIAL_PRACTICALS,
      reports: INITIAL_REPORTS,
      topics: INITIAL_TOPICS,
      revisionSessions: [],
      resources: INITIAL_RESOURCES,
    };
    setDb(cleanDb);
    saveDatabase(cleanDb);
  };

  // Report to pass into ReportEditor
  const activeReport = db.reports.find((r) => r.id === selectedReportId) || db.reports[0] || null;

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors pb-20 lg:pb-12 font-sans antialiased">
      {/* Navigation Header */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        profile={db.profile}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenQuickAdd={handleOpenQuickAdd}
      />

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            db={db}
            onNavigate={setCurrentTab}
            onOpenQuickAdd={handleOpenQuickAdd}
            onSelectTask={(id) => {
              setCurrentTab('tasks');
            }}
            onSelectReport={(reportId) => {
              setSelectedReportId(reportId);
              setCurrentTab('report-editor');
            }}
          />
        )}

        {currentTab === 'timetable' && (
          <TimetableModule
            timetable={db.timetable}
            courses={db.courses}
            onSaveEntry={handleSaveTimetableEntry}
            onDeleteEntry={handleDeleteTimetableEntry}
            onDuplicateEntry={handleDuplicateTimetableEntry}
            onToggleCancelledDate={handleToggleCancelledDate}
          />
        )}

        {currentTab === 'tasks' && (
          <TasksModule
            tasks={db.tasks}
            courses={db.courses}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
            onDuplicateTask={handleDuplicateTask}
            onToggleStatus={handleToggleTaskStatus}
          />
        )}

        {currentTab === 'courses' && (
          <CoursesModule
            db={db}
            onSaveCourse={handleSaveCourse}
            onDeleteCourse={handleDeleteCourse}
          />
        )}

        {currentTab === 'practicals' && (
          <PracticalsModule
            practicals={db.practicals}
            courses={db.courses}
            reports={db.reports}
            onSavePractical={handleSavePractical}
            onDeletePractical={handleDeletePractical}
            onOpenReportDraft={handleOpenReportDraft}
          />
        )}

        {currentTab === 'report-editor' && (
          <ReportEditor
            initialReport={activeReport}
            courses={db.courses}
            practicals={db.practicals}
            profile={db.profile}
            onSaveReport={handleSaveReport}
            onBackToPracticals={() => setCurrentTab('practicals')}
          />
        )}

        {currentTab === 'revision' && (
          <RevisionModule
            topics={db.topics}
            courses={db.courses}
            tasks={db.tasks}
            onSaveTopic={handleSaveTopic}
            onDeleteTopic={handleDeleteTopic}
            onRecordSession={handleRecordSession}
            onOpenAssistantForTopic={(cId, tTitle) => {
              setAssistantPrefill({ courseId: cId, topic: tTitle });
              setCurrentTab('ai-assistant');
            }}
          />
        )}

        {currentTab === 'ai-assistant' && (
          <AssistantModule
            courses={db.courses}
            prefilledCourseId={assistantPrefill.courseId}
            prefilledTopic={assistantPrefill.topic}
          />
        )}

        {currentTab === 'prompt-library' && (
          <PromptLibraryModule
            courses={db.courses}
            studentLevel={db.profile.level}
            onUseInAssistant={(cId, pText) => {
              setAssistantPrefill({ courseId: cId, topic: pText.slice(0, 40) });
              setCurrentTab('ai-assistant');
            }}
          />
        )}

        {currentTab === 'resources' && (
          <ResourcesModule
            resources={db.resources}
            courses={db.courses}
            topics={db.topics}
            onSaveResource={handleSaveResource}
            onDeleteResource={handleDeleteResource}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsModule
            db={db}
            onUpdateProfile={handleUpdateProfile}
            onImportBackup={handleImportBackup}
            onResetDatabase={handleResetDatabase}
          />
        )}
      </main>
    </div>
  );
}
