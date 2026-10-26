import React, { useState, useEffect } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
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
import { WelcomeScreen } from './components/WelcomeScreen.tsx';
import { OnboardingFlow } from './components/OnboardingFlow.tsx';
import { SignUpScreen } from './components/SignUpScreen.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { CreateCourseModal } from './components/CreateCourseModal.tsx';
import {
  auth,
  subscribeToAuthState,
  fetchUserProfile,
  syncOnboardingCompletion,
  signOutUser,
} from './utils/auth.ts';

export type AuthScreenView = 'welcome' | 'onboarding' | 'signup' | 'login' | 'app';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [currentTab, setCurrentTab] = useState<ScreenTab>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return db.profile.preferredTheme === 'dark' ? 'dark' : 'light';
  });

  // Active auth / onboarding screen view - default to login for new visitors
  const [authScreen, setAuthScreen] = useState<AuthScreenView>('login');
  const [authMode, setAuthMode] = useState<'cloud' | 'local'>('local');
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [tokenServiceNotice, setTokenServiceNotice] = useState<boolean>(false);

  // Subscribe to Firebase Authentication state for session persistence
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (user) => {
      if (user) {
        setUserEmail(user.email || undefined);
        setAuthMode('cloud');
        try {
          const cloudProfile = await fetchUserProfile(user.uid);
          if (cloudProfile) {
            setDb((prev) => ({
              ...prev,
              profile: {
                ...prev.profile,
                name: cloudProfile.displayName || prev.profile.name || user.displayName || 'Scholar',
                institution: cloudProfile.institution || prev.profile.institution,
                faculty: cloudProfile.faculty || prev.profile.faculty,
                department: cloudProfile.department || prev.profile.department,
                level: cloudProfile.level || prev.profile.level,
                semester: (cloudProfile.semester as any) || prev.profile.semester,
                academicSession: cloudProfile.academicSession || prev.profile.academicSession,
                onboardingCompleted: cloudProfile.onboardingCompleted,
              },
            }));

            if (cloudProfile.onboardingCompleted || db.profile.onboardingCompleted) {
              setAuthScreen('app');
            } else {
              setAuthScreen('onboarding');
            }
          } else {
            // New cloud account without document yet or offline cache
            if (db.profile.onboardingCompleted) {
              setAuthScreen('app');
            } else {
              setAuthScreen('onboarding');
            }
          }
        } catch (err: any) {
          console.warn('Failed to load user profile on auth state change:', err);
          if (err?.message?.includes('token-service-api') || err?.message?.includes('securetoken')) {
            setTokenServiceNotice(true);
          }
          if (db.profile.onboardingCompleted) {
            setAuthScreen('app');
          } else {
            setAuthScreen((prev) => (prev === 'login' || prev === 'signup' ? 'onboarding' : prev));
          }
        }
      }
    });

    return () => unsubscribe();
  }, [db.profile.onboardingCompleted]);

  // Active practical report to open in editor
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Pre-fill state for AI Study Assistant
  const [assistantPrefill, setAssistantPrefill] = useState<{ courseId?: string; topic?: string }>({});

  // Global course creation modal state
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);

  // Desktop sidebar collapse state
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(() => {
    try {
      return localStorage.getItem('polyvex_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleDesktopSidebar = () => {
    setIsDesktopCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('polyvex_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };


  // Sync database state to localStorage with debounce for performance
  useEffect(() => {
    const handler = setTimeout(() => {
      saveDatabase(db);
    }, 350);
    return () => clearTimeout(handler);
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

  // Flow navigation handlers
  const handleWelcomeGetStarted = () => {
    setAuthScreen('onboarding');
  };

  const handleWelcomeLogIn = () => {
    setAuthScreen('login');
  };

  const handleWelcomeContinueLocal = () => {
    setAuthMode('local');
    setAuthScreen('onboarding');
  };

  const handleSignUpSuccess = (userData: { email: string; name: string; uid?: string; onboardingCompleted?: boolean }) => {
    setUserEmail(userData.email);
    setAuthMode('cloud');
    if (userData.name) {
      setDb((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          name: userData.name,
        },
      }));
    }
    if (userData.onboardingCompleted) {
      setAuthScreen('app');
      setCurrentTab('dashboard');
    } else {
      setAuthScreen('onboarding');
    }
  };

  const handleLoginSuccess = (userData: { email: string; name?: string; uid?: string; onboardingCompleted?: boolean }) => {
    setUserEmail(userData.email);
    setAuthMode('cloud');
    if (userData.name) {
      setDb((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          name: userData.name || prev.profile.name || '',
        },
      }));
    }
    if (userData.onboardingCompleted || db.profile.onboardingCompleted) {
      setAuthScreen('app');
      setCurrentTab('dashboard');
    } else {
      setAuthScreen('onboarding');
    }
  };

  const handleOnboardingComplete = async (updatedProfile: StudentProfile, _preferences: string[]) => {
    const finalProfile: StudentProfile = {
      ...updatedProfile,
      onboardingCompleted: true,
    };
    setDb((prev) => ({
      ...prev,
      profile: finalProfile,
    }));
    saveDatabase({
      ...db,
      profile: finalProfile,
    });

    if (auth.currentUser) {
      try {
        await syncOnboardingCompletion(auth.currentUser.uid, finalProfile);
      } catch (err) {
        console.warn('Could not sync onboarding to Firestore:', err);
      }
    }

    setAuthScreen('app');
    setCurrentTab('dashboard');
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setUserEmail(undefined);
    setAuthMode('local');
    setAuthScreen('login');
  };

  const handleReRunOnboarding = () => {
    setAuthScreen('onboarding');
  };

  // Report to pass into ReportEditor
  const activeReport = db.reports.find((r) => r.id === selectedReportId) || db.reports[0] || null;

  // Unauthenticated / Onboarding Screen Branches
  if (authScreen === 'welcome') {
    return (
      <WelcomeScreen
        onGetStarted={() => setAuthScreen('signup')}
        onLogIn={() => setAuthScreen('login')}
        onContinueLocal={handleWelcomeContinueLocal}
        isCloudConfigured={true}
      />
    );
  }

  if (authScreen === 'signup') {
    return (
      <SignUpScreen
        onSuccess={handleSignUpSuccess}
        onNavigateToLogin={() => setAuthScreen('login')}
        onContinueLocal={() => {
          setAuthMode('local');
          setAuthScreen('onboarding');
        }}
      />
    );
  }

  if (authScreen === 'login') {
    return (
      <LoginScreen
        onSuccess={handleLoginSuccess}
        onNavigateToSignUp={() => setAuthScreen('signup')}
        onContinueLocal={() => {
          setAuthMode('local');
          if (db.profile.onboardingCompleted) {
            setAuthScreen('app');
            setCurrentTab('dashboard');
          } else {
            setAuthScreen('onboarding');
          }
        }}
      />
    );
  }

  if (authScreen === 'onboarding') {
    return (
      <OnboardingFlow
        initialProfile={db.profile}
        onComplete={handleOnboardingComplete}
        onCancel={() => setAuthScreen('login')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#090B0D] text-[#F5F7FA] transition-colors pb-10 font-sans antialiased overflow-x-hidden">
      {/* Navigation Header & Desktop Sidebar */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        profile={db.profile}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenQuickAdd={handleOpenQuickAdd}
        onOpenAddCourse={() => setIsAddCourseModalOpen(true)}
        authMode={authMode}
        userEmail={userEmail}
        onSignOut={handleSignOut}
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleDesktopSidebar={handleToggleDesktopSidebar}
      />

      {/* Main View Area with Desktop Sidebar Offset */}
      <div className={`min-w-0 max-w-full transition-all duration-200 ease-in-out ${isDesktopCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {tokenServiceNotice && (
          <div className="bg-[#1C160C] border-b border-[#F59E0B]/30 px-4 py-2.5 text-xs text-[#FDE68A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2">
              <span className="p-1 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-bold text-[10px] uppercase tracking-wider">Cloud Notice</span>
              <span>
                To enable Cloud Authentication synchronization, please activate the <strong>Token Service API</strong> in your Google Cloud Project:
                <a
                  href="https://console.developers.google.com/apis/api/securetoken.googleapis.com/overview?project=771985830822"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1.5 underline text-[#35F2D0] font-semibold hover:text-[#35F2D0]/80 inline-flex items-center gap-1"
                >
                  <span>Enable API in Google Cloud Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  signOutUser();
                  setTokenServiceNotice(false);
                  setAuthMode('local');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#2A2315] hover:bg-[#382F1D] text-[11px] text-[#FDE68A] transition cursor-pointer"
              >
                Continue in Local Mode
              </button>
              <button
                onClick={() => setTokenServiceNotice(false)}
                className="text-[#FDE68A]/60 hover:text-[#FDE68A] text-xs font-bold px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <main className="w-full min-w-0 max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-4 sm:pt-6 overflow-x-hidden">
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
              resources={db.resources}
              prefilledCourseId={assistantPrefill.courseId}
              prefilledTopic={assistantPrefill.topic}
              onNavigate={setCurrentTab}
              onOpenAddCourse={() => setIsAddCourseModalOpen(true)}
            />
          )}

          {currentTab === 'prompt-library' && (
            <PromptLibraryModule
              courses={db.courses}
              studentLevel={db.profile.level}
              resources={db.resources}
              onNavigate={setCurrentTab}
              onOpenReportDraft={handleOpenReportDraft}
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
              authMode={authMode}
              userEmail={userEmail}
              onSignOut={handleSignOut}
              onReRunOnboarding={handleReRunOnboarding}
            />
          )}
        </main>
      </div>

      {/* Global Add Course Modal (triggered by header 'Add Courses' button) */}
      <CreateCourseModal
        isOpen={isAddCourseModalOpen}
        onClose={() => setIsAddCourseModalOpen(false)}
        onSave={handleSaveCourse}
        existingCourseCount={db.courses.length}
        defaultSemester={db.profile.semester}
        defaultDepartment={db.profile.department}
      />
    </div>
  );
}
