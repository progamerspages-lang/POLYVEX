import React, { useState, useMemo, useEffect } from 'react';
import {
  Brain,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Edit2,
  Trash2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Target,
  Sliders,
  ListOrdered,
  FileText,
  Layers,
  Flame,
} from 'lucide-react';
import { Course, RevisionTopic, RevisionSession, AcademicTask } from '../types/index.ts';
import { calculateDaysRemaining, calculateSuggestedNextReview } from '../utils/academicMath.ts';
import {
  RevisionPlanItem,
  PlanOptions,
  generateHeuristicRevisionPlan,
  calculateRevisionStats,
  formatExternalPrompt,
  safeCopyToClipboard,
} from '../utils/revisionPlanner.ts';

interface RevisionModuleProps {
  topics: RevisionTopic[];
  courses: Course[];
  tasks: AcademicTask[];
  onSaveTopic: (topic: RevisionTopic) => void;
  onDeleteTopic: (id: string) => void;
  onRecordSession: (session: RevisionSession, updatedTopic: RevisionTopic) => void;
  onOpenAssistantForTopic?: (courseId: string, topicTitle: string) => void;
}

export const RevisionModule: React.FC<RevisionModuleProps> = ({
  topics,
  courses,
  tasks,
  onSaveTopic,
  onDeleteTopic,
  onRecordSession,
  onOpenAssistantForTopic,
}) => {
  // Sub-tab view: 'planner' or 'topics'
  const [activeSubTab, setActiveSubTab] = useState<'planner' | 'topics'>('planner');

  // Filter & Search states for topics
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterConfidence, setFilterConfidence] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Planner Options State
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly'>('daily');
  const [dailyHours, setDailyHours] = useState<number>(4);
  const [focusOrientation, setFocusOrientation] = useState<'low-confidence' | 'deadlines' | 'balanced'>('low-confidence');

  // Active Plan State
  const [planItems, setPlanItems] = useState<RevisionPlanItem[]>(() => {
    return generateHeuristicRevisionPlan(topics, tasks, courses, {
      timeframe: 'daily',
      dailyHours: 4,
      focusOrientation: 'low-confidence',
    });
  });

  // AI Generation State
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPlanMarkdown, setAiPlanMarkdown] = useState<string | null>(null);
  const [showAiNotes, setShowAiNotes] = useState(false);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Modal states: Topic creation / editing
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<RevisionTopic | null>(null);

  // Modal states: Session Logger
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [activeTopicForSession, setActiveTopicForSession] = useState<RevisionTopic | null>(null);
  const [sessionDuration, setSessionDuration] = useState(30);
  const [sessionNewConfidence, setSessionNewConfidence] = useState(3);
  const [sessionNotes, setSessionNotes] = useState('');

  // Modal states: Manual Plan Block Editing / Adding
  const [isPlanBlockModalOpen, setIsPlanBlockModalOpen] = useState(false);
  const [editingPlanBlock, setEditingPlanBlock] = useState<RevisionPlanItem | null>(null);

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const now = new Date();

  // Metrics for overview cards
  const stats = useMemo(() => calculateRevisionStats(topics), [topics]);

  // Imminent tasks count
  const imminentTasksCount = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === 'Completed' || t.status === 'Submitted') return false;
      const d = calculateDaysRemaining(t.dueDate, now);
      return d.status === 'due-today' || (d.daysRemaining !== null && d.daysRemaining >= 0 && d.daysRemaining <= 5);
    }).length;
  }, [tasks, now]);

  // Filter topics for the topics list view
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const courseCode = (courseMap.get(t.courseId)?.code || '').toLowerCase();
        if (!matchTitle && !matchDesc && !courseCode.includes(q)) return false;
      }
      if (filterCourse !== 'all' && t.courseId !== filterCourse) return false;
      if (filterConfidence !== 'all' && t.confidence !== parseInt(filterConfidence, 10)) return false;
      return true;
    });
  }, [topics, searchQuery, filterCourse, filterConfidence, courseMap]);

  // Automatically refresh plan when timeframe or focus change if user requests
  const handleRegenerateHeuristicPlan = () => {
    const newPlan = generateHeuristicRevisionPlan(topics, tasks, courses, {
      timeframe,
      dailyHours,
      focusOrientation,
    });
    setPlanItems(newPlan);
    setAiPlanMarkdown(null);
    setAiError(null);
    showToast(`Smart plan generated for ${timeframe === 'daily' ? 'Today' : '7-Day Week'}.`);
  };

  // Call server-side Gemini endpoint /api/ai/revision-plan
  const handleGenerateAiPlan = async () => {
    setIsAiGenerating(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/revision-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeframe,
          dailyHours,
          preferredFocus: focusOrientation,
          topics: topics.map((t) => ({
            title: t.title,
            courseCode: courseMap.get(t.courseId)?.code,
            confidence: t.confidence,
            lastRevisedDate: t.lastRevisedDate,
            nextRevisionDate: t.nextRevisionDate,
          })),
          tasks: tasks.map((tsk) => ({
            title: tsk.title,
            courseCode: courseMap.get(tsk.courseId)?.code,
            taskType: tsk.taskType,
            dueDate: tsk.dueDate,
            priority: tsk.priority,
            status: tsk.status,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 503) {
          setAiError('Direct Gemini API is unconfigured on server. Please use the "Copy AI Prompt" option below to run with external ChatGPT, Claude, or Gemini.');
        } else {
          setAiError(data.error || 'Failed to generate AI plan. Switched to smart heuristic schedule.');
        }
        // Still generate the smart local plan as a high quality working fallback!
        handleRegenerateHeuristicPlan();
      } else {
        setAiPlanMarkdown(data.planMarkdown || '');
        setShowAiNotes(true);
        // Refresh local items to match the newly requested timeframe
        handleRegenerateHeuristicPlan();
        showToast('Polyvex AI synthesized your revision schedule with detailed rationale!');
      }
    } catch (err: any) {
      console.error('Error generating AI revision plan:', err);
      setAiError('Network error connecting to AI endpoint. Local smart plan active.');
      handleRegenerateHeuristicPlan();
    } finally {
      setIsAiGenerating(false);
    }
  };

  // 1-Click Copy External AI Prompt fallback
  const handleCopyPrompt = () => {
    const prompt = formatExternalPrompt(topics, tasks, courses, {
      timeframe,
      dailyHours,
      focusOrientation,
    });
    safeCopyToClipboard(prompt);
    showToast('Revision planner prompt copied to clipboard! Paste into ChatGPT, Claude, or Gemini.');
  };

  // Toggle item completed
  const handleTogglePlanItem = (id: string) => {
    setPlanItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  // Delete plan block
  const handleDeletePlanBlock = (id: string) => {
    setPlanItems((prev) => prev.filter((item) => item.id !== id));
    showToast('Plan block removed.');
  };

  // Open modal to add a new manual block
  const handleOpenAddBlock = () => {
    const firstCourse = courses[0];
    setEditingPlanBlock({
      id: '',
      day: timeframe === 'weekly' ? 'Monday' : 'Today',
      timeSlot: '16:00 - 17:00',
      durationMinutes: 60,
      courseId: firstCourse?.id || '',
      courseCode: firstCourse?.code || 'Course',
      topicTitle: '',
      priority: 'high',
      rationale: 'Manually scheduled revision sprint.',
      suggestedAction: 'Review formula sheet and practice 2 tutorial problems.',
      completed: false,
    });
    setIsPlanBlockModalOpen(true);
  };

  // Open modal to edit existing block
  const handleOpenEditBlock = (block: RevisionPlanItem) => {
    setEditingPlanBlock({ ...block });
    setIsPlanBlockModalOpen(true);
  };

  // Save plan block
  const handleSavePlanBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlanBlock) return;
    if (!editingPlanBlock.topicTitle.trim()) return;

    const course = courseMap.get(editingPlanBlock.courseId);
    const updated: RevisionPlanItem = {
      ...editingPlanBlock,
      id: editingPlanBlock.id || `plan-custom-${Date.now().toString(36)}`,
      courseCode: course?.code || editingPlanBlock.courseCode || 'GEN',
      topicTitle: editingPlanBlock.topicTitle.trim(),
    };

    setPlanItems((prev) => {
      const exists = prev.some((p) => p.id === updated.id);
      return exists ? prev.map((p) => (p.id === updated.id ? updated : p)) : [...prev, updated];
    });

    setIsPlanBlockModalOpen(false);
    setEditingPlanBlock(null);
    showToast('Study block saved to revision plan.');
  };

  // Log session from a plan block
  const handleLogSessionFromPlan = (block: RevisionPlanItem) => {
    const matchedTopic = topics.find((t) => t.id === block.topicId) ||
      topics.find((t) => t.title.toLowerCase() === block.topicTitle.toLowerCase()) ||
      topics[0];

    if (matchedTopic) {
      setActiveTopicForSession(matchedTopic);
      setSessionDuration(block.durationMinutes || 45);
      setSessionNewConfidence(matchedTopic.confidence);
      setSessionNotes(`Completed plan block: ${block.timeSlot}. ${block.suggestedAction}`);
      setIsSessionModalOpen(true);
    } else {
      // Create a temporary session on first available topic
      showToast('Select or create a topic to record this study session.');
      setActiveSubTab('topics');
    }
  };

  // Save session & update topic
  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTopicForSession) return;

    const reviewCalc = calculateSuggestedNextReview(sessionNewConfidence, now);
    const updatedTopic: RevisionTopic = {
      ...activeTopicForSession,
      confidence: sessionNewConfidence,
      lastRevisedDate: now.toISOString().split('T')[0],
      nextRevisionDate: reviewCalc.nextReviewDate,
      status: sessionNewConfidence >= 4 ? 'Mastered' : sessionNewConfidence >= 3 ? 'On Track' : 'Needs Review',
    };

    const session: RevisionSession = {
      id: `sess-${Date.now().toString(36)}`,
      topicId: activeTopicForSession.id,
      date: now.toISOString().split('T')[0],
      durationMinutes: sessionDuration,
      confidenceBefore: activeTopicForSession.confidence,
      confidenceAfter: sessionNewConfidence,
      notes: sessionNotes,
    };

    onRecordSession(session, updatedTopic);
    setIsSessionModalOpen(false);
    setActiveTopicForSession(null);
    showToast(`Study session recorded! "${updatedTopic.title}" confidence is now ${sessionNewConfidence}/5.`);
  };

  // Topic creation / edit handlers
  const handleOpenNewTopic = () => {
    const reviewCalc = calculateSuggestedNextReview(2, now);
    setEditingTopic({
      id: '',
      courseId: courses[0]?.id || '',
      title: '',
      description: '',
      confidence: 2,
      lastRevisedDate: '',
      nextRevisionDate: reviewCalc.nextReviewDate,
      questionsCompleted: 0,
      practiceScore: 0,
      status: 'Needs Review',
      notes: '',
    });
    setIsTopicModalOpen(true);
  };

  const handleEditTopic = (t: RevisionTopic) => {
    setEditingTopic({ ...t });
    setIsTopicModalOpen(true);
  };

  const handleSaveTopicForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;
    if (!editingTopic.title.trim()) return;

    const payload: RevisionTopic = {
      ...editingTopic,
      id: editingTopic.id || `top-${Date.now().toString(36)}`,
      title: editingTopic.title.trim(),
    };
    onSaveTopic(payload);
    setIsTopicModalOpen(false);
    setEditingTopic(null);
    showToast(`Topic "${payload.title}" saved.`);
  };

  // Group plan items by Day
  const groupedPlan = useMemo(() => {
    const map = new Map<string, RevisionPlanItem[]>();
    planItems.forEach((item) => {
      const d = item.day || 'Today';
      const existing = map.get(d) || [];
      existing.push(item);
      map.set(d, existing);
    });
    return map;
  }, [planItems]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-medium shadow-md transition-all"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Revision Planner & Spaced Repetition</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Automated intelligence that prioritizes low-confidence topics (1–2) and upcoming academic deadlines.
          </p>
        </div>

        {/* View Switcher: AI Planner vs. All Topics */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-stone-100 dark:bg-stone-800 p-1 border border-stone-200 dark:border-stone-700 text-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('planner')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeSubTab === 'planner'
                  ? 'bg-white dark:bg-stone-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Revision Planner</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('topics')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeSubTab === 'topics'
                  ? 'bg-white dark:bg-stone-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Topics & Scores ({topics.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenNewTopic}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Topic</span>
          </button>
        </div>
      </div>

      {/* Academic Load Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Total Topics
          </span>
          <div className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-stone-400" />
            <span>{stats.total}</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">Across {courses.length} courses</p>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-1 bg-gradient-to-br from-white to-rose-50/30 dark:from-stone-900 dark:to-rose-950/20">
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-semibold">
            Low Confidence (1–2)
          </span>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <Flame className="w-4 h-4" />
            <span>{stats.lowConfidenceCount}</span>
          </div>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-300">High priority for revision</p>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
            Imminent Deadlines
          </span>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{imminentTasksCount}</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">Tests / Tasks due ≤ 5 days</p>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
            Avg. Confidence
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Target className="w-4 h-4" />
            <span>{stats.averageConfidence} / 5</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">{stats.masteredCount} topics mastered</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: AI REVISION PLANNER */}
      {/* ========================================================================= */}
      {activeSubTab === 'planner' && (
        <div className="space-y-6">
          {/* Planner Control & Synthesis Bar */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Revision Schedule Configuration</span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Tune target hours and strategic focus, then generate with native Gemini AI or copy prompt for external tools.
                </p>
              </div>

              {/* Timeframe Toggle: Daily vs Weekly */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Schedule:</span>
                <div className="flex bg-stone-100 dark:bg-stone-800 rounded-xl p-1 border border-stone-200 dark:border-stone-700 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setTimeframe('daily');
                      const plan = generateHeuristicRevisionPlan(topics, tasks, courses, {
                        timeframe: 'daily',
                        dailyHours,
                        focusOrientation,
                      });
                      setPlanItems(plan);
                    }}
                    className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition ${
                      timeframe === 'daily'
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    Daily Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimeframe('weekly');
                      const plan = generateHeuristicRevisionPlan(topics, tasks, courses, {
                        timeframe: 'weekly',
                        dailyHours,
                        focusOrientation,
                      });
                      setPlanItems(plan);
                    }}
                    className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition ${
                      timeframe === 'weekly'
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    Weekly (7-Day)
                  </button>
                </div>
              </div>
            </div>

            {/* Parameters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1 border-t border-stone-100 dark:border-stone-800 text-xs">
              <div>
                <label className="block text-stone-600 dark:text-stone-400 font-medium mb-1">
                  Target Daily Study Allocation
                </label>
                <select
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-stone-900 dark:text-stone-100 font-medium"
                >
                  <option value={2}>2 Hours / Day (Light Review)</option>
                  <option value={4}>4 Hours / Day (Standard Sprint)</option>
                  <option value={6}>6 Hours / Day (Intensive Exam Prep)</option>
                  <option value={8}>8 Hours / Day (Reading Week / Marathon)</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 dark:text-stone-400 font-medium mb-1">
                  Revision Priority Orientation
                </label>
                <select
                  value={focusOrientation}
                  onChange={(e) => setFocusOrientation(e.target.value as any)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-stone-900 dark:text-stone-100 font-medium"
                >
                  <option value="low-confidence">Prioritize Weak Topics (Confidence 1 & 2)</option>
                  <option value="deadlines">Prioritize Imminent Deadlines & Tests</option>
                  <option value="balanced">Balanced Spaced Repetition</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleRegenerateHeuristicPlan}
                  className="w-full py-2 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold cursor-pointer transition text-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Update Smart Plan</span>
                </button>
              </div>
            </div>

            {/* Action Buttons: Native Gemini AI + Copy Prompt Fallback + Add Manual Block */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleGenerateAiPlan}
                  disabled={isAiGenerating}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-900 text-white text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50 transition active:scale-95"
                >
                  <Sparkles className={`w-4 h-4 ${isAiGenerating ? 'animate-spin' : ''}`} />
                  <span>{isAiGenerating ? 'Synthesizing with Gemini...' : 'Synthesize with Polyvex AI'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold cursor-pointer transition border border-stone-200 dark:border-stone-700"
                  title="Copy formatted prompt for external AI (ChatGPT, Claude, Gemini Web)"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy External AI Prompt</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleOpenAddBlock}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 hover:border-blue-500 text-stone-700 dark:text-stone-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-medium cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Study Block</span>
              </button>
            </div>

            {/* AI Warning or Status Banner */}
            {aiError && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{aiError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 font-bold hover:bg-amber-300 text-[11px] shrink-0"
                >
                  Copy Prompt
                </button>
              </div>
            )}
          </div>

          {/* AI Strategic Synthesis Notes (if Gemini generated markdown) */}
          {aiPlanMarkdown && (
            <div className="bg-gradient-to-br from-indigo-950 to-blue-950 text-white rounded-2xl p-5 shadow-md border border-indigo-800/60 space-y-3">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowAiNotes(!showAiNotes)}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <h3 className="text-sm font-bold tracking-tight">
                    Polyvex AI Strategic Revision Analysis
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      safeCopyToClipboard(aiPlanMarkdown);
                      showToast('AI revision synthesis copied!');
                    }}
                    className="p-1 text-blue-200 hover:text-white rounded"
                    title="Copy AI analysis text"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {showAiNotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {showAiNotes && (
                <div className="pt-3 border-t border-indigo-800/60 text-xs leading-relaxed text-indigo-100 whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">
                  {aiPlanMarkdown}
                </div>
              )}
            </div>
          )}

          {/* Plan Schedule Cards */}
          <div className="space-y-6">
            {planItems.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center text-xs space-y-3 shadow-xs">
                <Brain className="w-8 h-8 text-stone-400 mx-auto" />
                <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                  No revision blocks in plan
                </h3>
                <p className="text-stone-500 dark:text-stone-400 max-w-sm mx-auto text-[11px]">
                  Add study topics or academic deadlines to auto-generate an optimized revision timetable.
                </p>
                <button
                  type="button"
                  onClick={handleRegenerateHeuristicPlan}
                  className="mt-2 px-4 py-2 rounded-xl bg-blue-700 text-white font-medium cursor-pointer"
                >
                  Generate Plan Now
                </button>
              </div>
            ) : (
              Array.from(groupedPlan.entries()).map(([dayLabel, items]) => (
                <div key={dayLabel} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 font-mono uppercase tracking-wider">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>{dayLabel}</span>
                      <span className="text-xs font-normal text-stone-400">({items.length} sessions)</span>
                    </h3>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {items.reduce((acc, it) => acc + it.durationMinutes, 0)} min total
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {items.map((item) => {
                      const isComplete = item.completed;
                      const isHighPriority = item.priority === 'high';

                      return (
                        <div
                          key={item.id}
                          className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between shadow-xs ${
                            isComplete
                              ? 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-75'
                              : isHighPriority
                              ? 'bg-white dark:bg-stone-900 border-rose-200/80 dark:border-rose-900/50 hover:shadow-md'
                              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:shadow-md'
                          }`}
                        >
                          <div className="space-y-2.5">
                            {/* Card Top: Time, Priority Badge, Checkbox */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePlanItem(item.id)}
                                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition cursor-pointer ${
                                    isComplete
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-stone-300 dark:border-stone-600 hover:border-emerald-500'
                                  }`}
                                  title={isComplete ? 'Mark as incomplete' : 'Mark as completed'}
                                  aria-label="Toggle completed"
                                >
                                  {isComplete && <Check className="w-3.5 h-3.5" />}
                                </button>
                                <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                                  <span>{item.timeSlot}</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                                    isHighPriority
                                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                                  }`}
                                >
                                  {isHighPriority ? 'High Urgency' : 'Standard'}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold">
                                  {item.courseCode}
                                </span>
                              </div>
                            </div>

                            {/* Topic Title */}
                            <div>
                              <h4
                                className={`text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug ${
                                  isComplete ? 'line-through text-stone-500 dark:text-stone-400' : ''
                                }`}
                              >
                                {item.topicTitle}
                              </h4>
                            </div>

                            {/* Why this is suggested (Pedagogical Rationale) */}
                            <div className="bg-stone-50 dark:bg-stone-800/50 p-2.5 rounded-xl border border-stone-200/60 dark:border-stone-700/60 text-[11px] space-y-1">
                              <span className="font-bold text-stone-700 dark:text-stone-300 block text-[10px] uppercase font-mono tracking-wider">
                                Pedagogical Rationale:
                              </span>
                              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                                {item.rationale}
                              </p>
                            </div>

                            {/* Recommended Strategy / Action */}
                            <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                              <strong className="block text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                Recommended Action:
                              </strong>
                              <p className="mt-0.5 leading-relaxed">{item.suggestedAction}</p>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => handleLogSessionFromPlan(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold cursor-pointer transition text-[11px]"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Log Session ({item.durationMinutes}m)</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditBlock(item)}
                                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer transition"
                                title="Edit block details"
                                aria-label="Edit block"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePlanBlock(item.id)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer transition"
                                title="Remove block"
                                aria-label="Remove block"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: TOPICS & SPACED REPETITION LIST */}
      {/* ========================================================================= */}
      {activeSubTab === 'topics' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search revision topics by name or syllabus description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-stone-800 dark:text-stone-200 font-medium"
                  aria-label="Filter topics by course"
                >
                  <option value="all">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>

                <select
                  value={filterConfidence}
                  onChange={(e) => setFilterConfidence(e.target.value)}
                  className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-stone-800 dark:text-stone-200 font-medium"
                  aria-label="Filter topics by confidence level"
                >
                  <option value="all">All Confidence Levels</option>
                  <option value="1">Level 1 - Need Help (Urgent)</option>
                  <option value="2">Level 2 - Basic</option>
                  <option value="3">Level 3 - Moderate</option>
                  <option value="4">Level 4 - Good</option>
                  <option value="5">Level 5 - Mastered</option>
                </select>
              </div>
            </div>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center text-xs space-y-3">
                <BookOpen className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-stone-600 dark:text-stone-400">No revision topics found matching your criteria.</p>
                <button
                  type="button"
                  onClick={handleOpenNewTopic}
                  className="mt-2 px-3.5 py-1.5 rounded-xl bg-blue-700 text-white font-medium cursor-pointer"
                >
                  Add New Topic
                </button>
              </div>
            ) : (
              filteredTopics.map((topic) => {
                const course = courseMap.get(topic.courseId);
                const reviewCountdown = calculateDaysRemaining(topic.nextRevisionDate, now);

                let confColor = 'bg-rose-500';
                if (topic.confidence >= 4) confColor = 'bg-emerald-500';
                else if (topic.confidence === 3) confColor = 'bg-blue-500';
                else if (topic.confidence === 2) confColor = 'bg-amber-500';

                return (
                  <div
                    key={topic.id}
                    className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-blue-700 dark:text-blue-400 font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900">
                          {course?.code || 'GEN'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {topic.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 leading-snug">
                        {topic.title}
                      </h3>

                      {topic.description && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                          {topic.description}
                        </p>
                      )}

                      {/* Confidence Bar 1-5 */}
                      <div className="pt-2">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className="text-stone-500">Confidence Level:</span>
                          <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                            {topic.confidence} / 5
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden flex gap-1 p-0.5">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <div
                              key={lvl}
                              className={`h-full flex-1 rounded-sm ${
                                lvl <= topic.confidence ? confColor : 'bg-stone-200 dark:bg-stone-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Spaced Interval Details */}
                      <div className="bg-stone-50 dark:bg-stone-800/50 p-2.5 rounded-xl text-[11px] text-stone-600 dark:text-stone-400 space-y-1 border border-stone-200/50 dark:border-stone-700/50">
                        <div className="flex justify-between">
                          <span>Next Spaced Review:</span>
                          <strong className="font-mono text-stone-800 dark:text-stone-200">
                            {topic.nextRevisionDate ? reviewCountdown.label : 'Pending'}
                          </strong>
                        </div>
                        {topic.lastRevisedDate && (
                          <div className="flex justify-between text-[10px] text-stone-400">
                            <span>Last Revised:</span>
                            <span className="font-mono">{topic.lastRevisedDate}</span>
                          </div>
                        )}
                      </div>

                      {topic.notes && (
                        <p className="text-[11px] text-stone-500 italic line-clamp-1">
                          Note: {topic.notes}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTopicForSession(topic);
                          setSessionDuration(30);
                          setSessionNewConfidence(topic.confidence);
                          setSessionNotes('');
                          setIsSessionModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Log Session</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {onOpenAssistantForTopic && (
                          <button
                            type="button"
                            onClick={() => onOpenAssistantForTopic(topic.courseId, topic.title)}
                            className="p-1.5 text-stone-500 hover:text-blue-600 rounded-lg cursor-pointer transition"
                            title="Open with AI Study Tutor"
                            aria-label="Open with AI Tutor"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEditTopic(topic)}
                          className="p-1.5 text-stone-500 hover:text-emerald-700 rounded-lg cursor-pointer transition"
                          title="Edit topic"
                          aria-label="Edit topic"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete revision topic "${topic.title}"?`)) {
                              onDeleteTopic(topic.id);
                            }
                          }}
                          className="p-1.5 text-stone-500 hover:text-rose-600 rounded-lg cursor-pointer transition"
                          title="Delete topic"
                          aria-label="Delete topic"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT / CREATE REVISION TOPIC */}
      {/* ========================================================================= */}
      {isTopicModalOpen && editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-xs max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-stone-800">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{editingTopic.id ? 'Edit Revision Topic' : 'Add Revision Topic'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsTopicModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer p-1"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTopicForm} className="space-y-4">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Topic Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kirchhoff's Laws, Thevenin Theorem, Carnot Engine"
                  value={editingTopic.title}
                  onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Associated Course
                </label>
                <select
                  value={editingTopic.courseId}
                  onChange={(e) => setEditingTopic({ ...editingTopic, courseId: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Initial Confidence Level (1 = Low / Urgent, 5 = Mastered)
                </label>
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEditingTopic({ ...editingTopic, confidence: lvl })}
                      className={`p-2.5 rounded-xl font-bold text-center cursor-pointer transition ${
                        editingTopic.confidence === lvl
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Syllabus Description / Problem Areas
                </label>
                <textarea
                  rows={2}
                  placeholder="Key sub-topics, difficult derivations, or past question reference numbers..."
                  value={editingTopic.description || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Next Revision Target Date
                </label>
                <input
                  type="date"
                  value={editingTopic.nextRevisionDate || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, nextRevisionDate: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold cursor-pointer shadow-sm transition active:scale-95"
                >
                  Save Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LOG STUDY SESSION (CONFIDENCE UPDATE) */}
      {/* ========================================================================= */}
      {isSessionModalOpen && activeTopicForSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-xs max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-stone-800">
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Log Revision Session
                </h2>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  {activeTopicForSession.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSessionModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer p-1"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-4">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Study Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(Number(e.target.value))}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Updated Confidence Level (After Review)
                </label>
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSessionNewConfidence(lvl)}
                      className={`p-2.5 rounded-xl font-bold text-center cursor-pointer transition ${
                        sessionNewConfidence === lvl
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Session Notes (Problems solved, key takeaways)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Solved 4 past exam questions on Norton theorem with dependent sources..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer shadow-sm transition active:scale-95"
                >
                  Record Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: MANUAL PLAN BLOCK EDIT / ADD */}
      {/* ========================================================================= */}
      {isPlanBlockModalOpen && editingPlanBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-xs max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-stone-800">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{editingPlanBlock.id ? 'Adjust Study Block' : 'Add Custom Study Block'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsPlanBlockModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer p-1"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlanBlock} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Day
                  </label>
                  <select
                    value={editingPlanBlock.day || 'Today'}
                    onChange={(e) => setEditingPlanBlock({ ...editingPlanBlock, day: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100"
                  >
                    <option value="Today">Today</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Time Slot
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09:00 - 10:15"
                    value={editingPlanBlock.timeSlot}
                    onChange={(e) => setEditingPlanBlock({ ...editingPlanBlock, timeSlot: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Course
                </label>
                <select
                  value={editingPlanBlock.courseId}
                  onChange={(e) => setEditingPlanBlock({ ...editingPlanBlock, courseId: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Topic / Target Activity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Superposition Theorem, Fluid Statics Drill"
                  value={editingPlanBlock.topicTitle}
                  onChange={(e) => setEditingPlanBlock({ ...editingPlanBlock, topicTitle: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Pedagogical Rationale (Why study this now?)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Upcoming assignment deadline or confidence level need..."
                  value={editingPlanBlock.rationale}
                  onChange={(e) => setEditingPlanBlock({ ...editingPlanBlock, rationale: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Recommended Action / Focus Strategy
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Solve 3 textbook problems, derive governing formulas..."
                  value={editingPlanBlock.suggestedAction}
                  onChange={(e) => setEditingPlanBlock({ ...editingPlanBlock, suggestedAction: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsPlanBlockModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold cursor-pointer shadow-sm transition active:scale-95"
                >
                  Save Study Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
