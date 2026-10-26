import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  Layers,
  Sparkles,
  HelpCircle,
  GraduationCap,
  FileText,
  Calculator,
  FileCode,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  RotateCcw,
  Search,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  FolderOpen,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { Course, StudyResource } from '../types/index.ts';
import { PolyvexLogo } from './PolyvexLogo.tsx';
import {
  AI_STUDY_RESOURCES,
  AIResourceId,
  AIResourceDefinition,
  parseFlashcards,
} from '../utils/aiStudyResources.ts';
import { preprocessMarkdown, renderCellWithBreaks, markdownComponents, PolyvexMarkdown } from '../utils/markdownUtils.tsx';
import { FlashcardDeck } from './FlashcardDeck.tsx';

interface AIStudyResourcesModuleProps {
  courses: Course[];
  studentLevel?: string;
  resources?: StudyResource[];
  onUseInAssistant?: (courseId: string, promptText: string) => void;
  onNavigate?: (tab: any) => void;
  onOpenReportDraft?: (reportId?: string, practicalId?: string, courseId?: string, experimentTitle?: string) => void;
}

type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

const HAS_DIFFICULTY_SELECTOR: AIResourceId[] = [
  'explain-topics',
  'break-down-problems',
  'teach-worked-examples',
  'practice-questions',
  'calculation-assistant',
];

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
}

export const AIStudyResourcesModule: React.FC<AIStudyResourcesModuleProps> = ({
  courses,
  resources = [],
  onUseInAssistant,
  onNavigate,
  onOpenReportDraft,
}) => {
  // Navigation & active specialist selection
  const [activeResourceId, setActiveResourceId] = useState<AIResourceId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Common course & library resource context
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLibraryResourceId, setSelectedLibraryResourceId] = useState<string>('');

  // Per-specialist difficulty level map (default 'Intermediate')
  const [difficultyMap, setDifficultyMap] = useState<Record<string, DifficultyLevel>>({
    'explain-topics': 'Intermediate',
    'break-down-problems': 'Intermediate',
    'teach-worked-examples': 'Intermediate',
    'practice-questions': 'Intermediate',
    'calculation-assistant': 'Intermediate',
  });

  // Per-specialist Chat History map
  const [chatHistoryMap, setChatHistoryMap] = useState<Record<string, ChatMessage[]>>({});
  const [followUpInputs, setFollowUpInputs] = useState<Record<string, string>>({});
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  // 1. Explain Topics
  const [topicExplain, setTopicExplain] = useState('');
  const [explainStyle, setExplainStyle] = useState('Intuitive with Analogies');
  const [specificQuestions, setSpecificQuestions] = useState('');

  // 2. Break Down Problems
  const [problemStatement, setProblemStatement] = useState('');
  const [givenValues, setGivenValues] = useState('');
  const [targetUnknowns, setTargetUnknowns] = useState('');

  // 3. Teach with Worked Examples
  const [workedConcept, setWorkedConcept] = useState('');
  const [workedFocus, setWorkedFocus] = useState('');

  // 4. Practice Questions
  const [practiceTopic, setPracticeTopic] = useState('');
  const [practiceCount, setPracticeCount] = useState<number>(5);
  const [practiceTypes, setPracticeTypes] = useState('Mixed (MCQ + Calculations)');

  // 5. Generate Flashcards
  const [flashcardTopic, setFlashcardTopic] = useState('');
  const [flashcardNotes, setFlashcardNotes] = useState('');
  const [flashcardCount, setFlashcardCount] = useState<number>(8);
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState<number>(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState<boolean>(false);
  const [flashcardViewMode, setFlashcardViewMode] = useState<'card' | 'list'>('card');

  // 6. Summarize Notes
  const [summaryTopicTitle, setSummaryTopicTitle] = useState('');
  const [summaryNotes, setSummaryNotes] = useState('');
  const [summaryFocus, setSummaryFocus] = useState('Comprehensive Technical Summary');

  // 7. Calculation Assistant
  const [calcTask, setCalcTask] = useState('');
  const [calcGivenValues, setCalcGivenValues] = useState('');
  const [calcTargetQuantity, setCalcTargetQuantity] = useState('');

  // 8. Report Writer
  const [reportType, setReportType] = useState<'Laboratory Practical Report' | 'Academic Project Report'>('Laboratory Practical Report');
  const [reportTitle, setReportTitle] = useState('');
  const [reportAim, setReportAim] = useState('');
  const [reportInstructions, setReportInstructions] = useState('');
  const [reportFindings, setReportFindings] = useState('');
  const [lecturerFormat, setLecturerFormat] = useState('');

  // Execution & Output state
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTextMap, setGeneratedTextMap] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Active resource object
  const activeResource = useMemo(() => {
    if (!activeResourceId) return null;
    return AI_STUDY_RESOURCES.find((r) => r.id === activeResourceId) || null;
  }, [activeResourceId]);

  // Active course object
  const activeCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    return courses.find((c) => c.id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  // Active difficulty for current tool
  const currentDifficulty = activeResourceId ? difficultyMap[activeResourceId] || 'Intermediate' : 'Intermediate';

  // Active generated text for current tool
  const currentGeneratedText = activeResourceId ? generatedTextMap[activeResourceId] || null : null;

  // Active chat history for current tool
  const activeChatHistory = activeResourceId ? chatHistoryMap[activeResourceId] || [] : [];

  // Active follow-up input for current tool
  const activeFollowUpInput = activeResourceId ? followUpInputs[activeResourceId] || '' : '';

  // Filtered resources list for the 8-tool directory view
  const filteredResources = useMemo(() => {
    return AI_STUDY_RESOURCES.filter((res) => {
      if (categoryFilter !== 'all' && res.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          res.title.toLowerCase().includes(q) ||
          res.shortDescription.toLowerCase().includes(q) ||
          res.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [categoryFilter, searchQuery]);

  // Cleaned markdown output for display
  const cleanedMarkdown = useMemo(() => {
    return currentGeneratedText ? preprocessMarkdown(currentGeneratedText) : '';
  }, [currentGeneratedText]);

  // Extracted flashcards if resource is generate-flashcards
  const parsedCards = useMemo(() => {
    if (activeResourceId === 'generate-flashcards' && currentGeneratedText) {
      return parseFlashcards(currentGeneratedText);
    }
    return [];
  }, [activeResourceId, currentGeneratedText]);

  // Answer key visibility for practice questions
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);

  // Split practice questions into questions and answer key if divider exists
  const practiceQuestionParts = useMemo(() => {
    if (activeResourceId !== 'practice-questions' || !cleanedMarkdown) return null;
    const dividerRegex = /(?:---+|\*\*\*+|___+)?\s*(?:#+\s*)?ANSWER KEY\s*&?\s*(?:FULL|DETAILED)?\s*EXPLANATIONS?\s*(?:---+|\*\*\*+|___+)?/i;
    const match = cleanedMarkdown.search(dividerRegex);
    if (match === -1) return null;
    const questionsPart = cleanedMarkdown.slice(0, match).trim();
    const answersPart = cleanedMarkdown.slice(match).trim();
    return { questionsPart, answersPart };
  }, [activeResourceId, cleanedMarkdown]);

  // Open a specific specialist workspace
  const handleOpenResource = (id: AIResourceId) => {
    setActiveResourceId(id);
    setErrorMessage(null);
    setValidationError(null);
    setActiveFlashcardIndex(0);
    setIsFlashcardFlipped(false);
    setShowAnswerKey(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Return to the 8-tool directory
  const handleBackToDirectory = () => {
    setActiveResourceId(null);
    setErrorMessage(null);
    setValidationError(null);
    setShowAnswerKey(false);
  };

  // Icon mapper helper
  const renderResourceIcon = (id: AIResourceId, className: string = 'w-5 h-5') => {
    switch (id) {
      case 'explain-topics':
        return <BookOpen className={className} />;
      case 'break-down-problems':
        return <Layers className={className} />;
      case 'teach-worked-examples':
        return <Sparkles className={className} />;
      case 'practice-questions':
        return <HelpCircle className={className} />;
      case 'generate-flashcards':
        return <GraduationCap className={className} />;
      case 'summarize-notes':
        return <FileText className={className} />;
      case 'calculation-assistant':
        return <Calculator className={className} />;
      case 'report-writer':
        return <FileCode className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  // Autofill notes from Library Resource if selected
  const handleSelectLibraryResource = (resId: string) => {
    setSelectedLibraryResourceId(resId);
    if (!resId) return;
    const item = resources.find((r) => r.id === resId);
    if (item) {
      const compiled = `${item.title} (${item.type})\n${item.description || ''}\n${item.notes || ''}\n${item.linkOrRef ? `Ref: ${item.linkOrRef}` : ''}`.trim();
      setSummaryNotes(compiled);
      if (!summaryTopicTitle) setSummaryTopicTitle(item.title);
    }
  };

  // Form submission & real AI API execution for initial specialist generation
  const handleGenerate = async () => {
    if (!activeResource) return;
    setValidationError(null);
    setErrorMessage(null);

    // Validate inputs per resource
    let params: Record<string, any> = {
      course: activeCourse ? `${activeCourse.code} — ${activeCourse.title}` : 'General (All Subjects)',
      courseCode: activeCourse?.code || 'General',
      courseTitle: activeCourse?.title || '',
      difficulty: currentDifficulty,
    };

    switch (activeResource.id) {
      case 'explain-topics':
        if (!topicExplain.trim()) {
          setValidationError('Please enter a topic or concept to explain.');
          return;
        }
        params.topic = topicExplain.trim();
        params.style = explainStyle;
        params.specificQuestions = specificQuestions.trim();
        break;

      case 'break-down-problems':
        if (!problemStatement.trim()) {
          setValidationError('Please enter the problem statement or equation.');
          return;
        }
        params.problemStatement = problemStatement.trim();
        params.givenValues = givenValues.trim();
        params.targetUnknowns = targetUnknowns.trim();
        break;

      case 'teach-worked-examples':
        if (!workedConcept.trim()) {
          setValidationError('Please specify the concept or problem type for the worked example.');
          return;
        }
        params.concept = workedConcept.trim();
        params.focusArea = workedFocus.trim();
        break;

      case 'practice-questions':
        if (!practiceTopic.trim()) {
          setValidationError('Please enter a topic or syllabus scope for the practice questions.');
          return;
        }
        params.topic = practiceTopic.trim();
        params.count = practiceCount;
        params.questionTypes = practiceTypes;
        break;

      case 'generate-flashcards':
        if (!flashcardTopic.trim() && !flashcardNotes.trim()) {
          setValidationError('Please provide a topic or paste lecture notes to generate flashcards.');
          return;
        }
        params.topic = flashcardTopic.trim();
        params.notes = flashcardNotes.trim();
        params.count = flashcardCount;
        break;

      case 'summarize-notes':
        if (!summaryNotes.trim()) {
          setValidationError('Please paste lecture notes or select a study resource from your library.');
          return;
        }
        params.topicTitle = summaryTopicTitle.trim();
        params.notes = summaryNotes.trim();
        params.focus = summaryFocus;
        break;

      case 'calculation-assistant':
        if (!calcTask.trim()) {
          setValidationError('Please describe the numerical problem or calculation task.');
          return;
        }
        if (!calcGivenValues.trim()) {
          setValidationError('Please state the known given values with their units.');
          return;
        }
        if (!calcTargetQuantity.trim()) {
          setValidationError('Please specify the required quantity to compute.');
          return;
        }
        params.calculationTask = calcTask.trim();
        params.givenValues = calcGivenValues.trim();
        params.targetQuantity = calcTargetQuantity.trim();
        break;

      case 'report-writer':
        if (!reportTitle.trim()) {
          setValidationError(`Please enter the ${reportType === 'Laboratory Practical Report' ? 'experiment' : 'project'} title.`);
          return;
        }
        if (!reportAim.trim()) {
          setValidationError('Please state the aim or primary objectives.');
          return;
        }
        params.reportType = reportType;
        params.title = reportTitle.trim();
        params.aim = reportAim.trim();
        params.instructions = reportInstructions.trim();
        params.findings = reportFindings.trim();
        params.lecturerFormat = lecturerFormat.trim();
        break;
    }

    const constructedPrompt = activeResource.buildPrompt(params);

    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/study-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'ai-mode',
          question: constructedPrompt,
          courseCode: activeCourse?.code || '',
          courseTitle: activeCourse?.title || '',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      if (data.text) {
        setGeneratedTextMap((prev) => ({ ...prev, [activeResource.id]: data.text }));
        setActiveFlashcardIndex(0);
        setIsFlashcardFlipped(false);

        // Record in conversation history for this specialist
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const userMsg: ChatMessage = {
          role: 'user',
          text: `[Specialist Task Search: ${activeResource.title} - ${currentDifficulty}]\n${constructedPrompt.slice(0, 300)}...`,
          timestamp,
        };
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          text: data.text,
          timestamp,
        };

        setChatHistoryMap((prev) => ({
          ...prev,
          [activeResource.id]: [userMsg, assistantMsg],
        }));
      } else {
        throw new Error('No generated response received from the study assistant engine.');
      }
    } catch (err: any) {
      console.error('AI Study Resource generation error:', err);
      setErrorMessage(err.message || 'Unable to generate response. Please check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Follow-up conversation handler inside specialist workspace
  const handleSendFollowUp = async () => {
    if (!activeResource || !activeFollowUpInput.trim() || isFollowUpLoading) return;

    const followUpText = activeFollowUpInput.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message immediately
    const userMsg: ChatMessage = { role: 'user', text: followUpText, timestamp };
    const currentHistory = activeChatHistory;
    const updatedHistory = [...currentHistory, userMsg];

    setChatHistoryMap((prev) => ({
      ...prev,
      [activeResource.id]: updatedHistory,
    }));

    // Clear input
    setFollowUpInputs((prev) => ({ ...prev, [activeResource.id]: '' }));
    setIsFollowUpLoading(true);

    try {
      const res = await fetch('/api/ai/study-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'ai-mode',
          question: followUpText,
          courseCode: activeCourse?.code || '',
          courseTitle: activeCourse?.title || '',
          conversationHistory: updatedHistory,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      if (data.text) {
        const assistantMsg: ChatMessage = { role: 'assistant', text: data.text, timestamp };
        setChatHistoryMap((prev) => ({
          ...prev,
          [activeResource.id]: [...updatedHistory, assistantMsg],
        }));
      }
    } catch (err: any) {
      console.error('Follow-up generation error:', err);
      setErrorMessage(err.message || 'Unable to send follow-up message.');
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!currentGeneratedText) return;
    navigator.clipboard.writeText(currentGeneratedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full min-w-0 max-w-5xl mx-auto space-y-6 pb-12 overflow-x-hidden text-[#F5F7FA]">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171A1E] px-5 py-4 rounded-2xl border border-[#262A30] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#090B0D] text-[#35F2D0] border border-[#262A30] shadow-xs">
            <PolyvexLogo size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-[#F5F7FA] tracking-tight">
                AI Study Resources
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#090B0D] text-[#35F2D0] border border-[#262A30]">
                8 SPECIALISTS
              </span>
            </div>
            <p className="text-xs text-[#A1A8B3] mt-0.5">
              Choose a study task and let POLYVEX help you complete it with AI.
            </p>
          </div>
        </div>

        {/* Action Controls: Course Context & Separate Add Materials Action */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Separate option to open Add / Manage Resources */}
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('resources')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#090B0D] hover:bg-[#20252C] border border-[#262A30] hover:border-[#35F2D0]/40 text-xs font-semibold text-[#A1A8B3] hover:text-[#35F2D0] transition cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#35F2D0]" />
              <span>Add / Manage Materials</span>
            </button>
          )}

          {/* Active Course Context */}
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="bg-[#090B0D] border border-[#262A30] hover:border-[#35F2D0]/50 text-[#F5F7FA] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#35F2D0] transition cursor-pointer"
            aria-label="Active course selector"
          >
            <option value="">General (All Subjects)</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. DIRECTORY VIEW: Cards for the 8 Specialist Tools */}
      {!activeResource ? (
        <div className="space-y-6">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search specialist tools (e.g. explain, calculation, report, flashcards)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171A1E] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:outline-none focus:border-[#35F2D0] transition"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 text-xs">
              {['all', 'Conceptual', 'Problem Solving', 'Exam Prep', 'Reports & Writing'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#35F2D0] text-[#090B0D] font-bold shadow-[0_0_12px_rgba(53,242,208,0.25)]'
                      : 'bg-[#171A1E] text-[#A1A8B3] hover:text-[#F5F7FA] border border-[#262A30]'
                  }`}
                >
                  {cat === 'all' ? 'All Specialist Tools' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of the 8 Exactly Specified Specialist Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResources.map((res) => (
              <div
                key={res.id}
                onClick={() => handleOpenResource(res.id)}
                className="group relative bg-[#171A1E] hover:bg-[#1a1e24] border border-[#262A30] hover:border-[#35F2D0]/50 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-[#090B0D] text-[#35F2D0] border border-[#262A30] group-hover:scale-105 transition-transform">
                      {renderResourceIcon(res.id)}
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#090B0D] text-[#A1A8B3] border border-[#262A30] uppercase">
                      {res.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#F5F7FA] group-hover:text-[#35F2D0] transition">
                    {res.title}
                  </h3>
                  <p className="text-xs text-[#A1A8B3] mt-1.5 leading-relaxed">
                    {res.shortDescription}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#262A30]/60 flex items-center justify-between text-xs font-semibold text-[#35F2D0]">
                  <span>Open Specialist Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 3. TASK-SPECIFIC SPECIALIST SEARCH WORKSPACE: Search/Input Area + Real AI Execution */
        <div className="space-y-6">
          {/* Top navigation back button */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBackToDirectory}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#A1A8B3] hover:text-[#35F2D0] transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to AI Study Resources</span>
            </button>

            {/* Separate option to open Add / Manage Resources */}
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('resources')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171A1E] border border-[#262A30] hover:border-[#35F2D0]/40 text-xs font-medium text-[#A1A8B3] hover:text-[#35F2D0] transition cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#35F2D0]" />
                <span>Import Study Materials</span>
              </button>
            )}
          </div>

          {/* Active Specialist Workspace Card Header & Search Engine Input Controls */}
          <div className="bg-[#171A1E] border border-[#262A30] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262A30]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#090B0D] text-[#35F2D0] border border-[#262A30]">
                  {renderResourceIcon(activeResource.id, 'w-6 h-6')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-[#F5F7FA]">
                      {activeResource.title}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#090B0D] text-[#35F2D0] border border-[#262A30]">
                      SPECIALIST SEARCH WORKSPACE
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A8B3] mt-1">
                    {activeResource.shortDescription}
                  </p>
                </div>
              </div>

              <div className="text-xs text-[#64748B] flex items-center gap-1.5">
                <span>Context:</span>
                <strong className="text-[#35F2D0] font-mono">{activeCourse?.code || 'General'}</strong>
              </div>
            </div>

            {/* Validation Notice */}
            {validationError && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Error Notice */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* DIFFICULTY LEVEL SELECTOR (For the 5 specified tools) */}
            {HAS_DIFFICULTY_SELECTOR.includes(activeResource.id) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#F5F7FA]">
                    Difficulty Level
                  </label>
                  <span className="text-[11px] text-[#35F2D0] font-mono font-semibold">
                    {currentDifficulty} Mode
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#090B0D] border border-[#262A30] rounded-xl">
                  {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => {
                    const isSelected = currentDifficulty === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() =>
                          setDifficultyMap((prev) => ({ ...prev, [activeResource.id]: level }))
                        }
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? 'bg-[#35F2D0] text-[#090B0D] shadow-[0_0_12px_rgba(53,242,208,0.25)]'
                            : 'text-[#A1A8B3] hover:text-[#F5F7FA] hover:bg-[#171A1E]'
                        }`}
                      >
                        <span>{level}</span>
                        <span
                          className={`text-[9px] font-normal hidden sm:inline ${
                            isSelected ? 'text-[#090B0D]/80' : 'text-[#64748B]'
                          }`}
                        >
                          {level === 'Beginner'
                            ? 'Foundational'
                            : level === 'Intermediate'
                            ? 'Standard Exam'
                            : 'Advanced Rigor'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TASK SEARCH & INPUTS FORM */}
            <div className="space-y-4 pt-1">
              {/* SPECIALIST 1: Explain Difficult Topics */}
              {activeResource.id === 'explain-topics' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                      Topic or Concept to Explain *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter a topic to explain (e.g. Fourier Transform, Thevenin’s Theorem, CRISPR, Osmosis)..."
                      value={topicExplain}
                      onChange={(e) => setTopicExplain(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                        Preferred Explanation Style
                      </label>
                      <select
                        value={explainStyle}
                        onChange={(e) => setExplainStyle(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] focus:border-[#35F2D0] outline-none cursor-pointer"
                      >
                        <option value="Intuitive with Analogies">Intuitive with Analogies (Best for first-time understanding)</option>
                        <option value="Foundational to Advanced">Foundational to Advanced (Rigorous step-by-step)</option>
                        <option value="Exam-Oriented Deep Dive">Exam-Oriented Deep Dive (Focus on assessment questions)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                        Specific Questions or Confusion (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. What is the physical meaning of the imaginary j term?"
                        value={specificQuestions}
                        onChange={(e) => setSpecificQuestions(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* SPECIALIST 2: Break Down Problems Step by Step */}
              {activeResource.id === 'break-down-problems' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                      Problem Statement or Equation *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Paste your specific assignment problem, circuit parameters, differential equation, or physics problem..."
                      value={problemStatement}
                      onChange={(e) => setProblemStatement(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                        Supplied Given Values & Constraints (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. V = 120V, R = 15Ω, L = 0.2H, f = 60Hz"
                        value={givenValues}
                        onChange={(e) => setGivenValues(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                        Target Unknowns to Determine (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Total Current I, Power Dissipated P"
                        value={targetUnknowns}
                        onChange={(e) => setTargetUnknowns(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* SPECIALIST 3: Teach with Worked Examples */}
              {activeResource.id === 'teach-worked-examples' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                      Concept or Problem Type to Demonstrate *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nodal Analysis with Dependent Sources, Integration by Partial Fractions, Mendelian Dihybrid Cross..."
                      value={workedConcept}
                      onChange={(e) => setWorkedConcept(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                      Specific Focus Area (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Include supernodes, negative roots, or matrix inversion..."
                      value={workedFocus}
                      onChange={(e) => setWorkedFocus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none"
                    />
                  </div>
                </>
              )}

              {/* SPECIALIST 4: Practice Questions with Answer Key */}
              {activeResource.id === 'practice-questions' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                      Topic or Syllabus Scope *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kirchhoff's Laws & Superposition, Enzyme Kinetics, Eigenvalues and Diagonalization..."
                      value={practiceTopic}
                      onChange={(e) => setPracticeTopic(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                        Number of Questions
                      </label>
                      <select
                        value={practiceCount}
                        onChange={(e) => setPracticeCount(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] focus:border-[#35F2D0] outline-none cursor-pointer"
                      >
                        <option value={5}>5 Practice Questions</option>
                        <option value={8}>8 Practice Questions</option>
                        <option value={10}>10 Practice Questions</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                        Question Format
                      </label>
                      <select
                        value={practiceTypes}
                        onChange={(e) => setPracticeTypes(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] focus:border-[#35F2D0] outline-none cursor-pointer"
                      >
                        <option value="Mixed (MCQ + Calculations)">Mixed (MCQs + Calculations)</option>
                        <option value="Calculations & Derivations">Calculations & Derivations</option>
                        <option value="Multiple Choice Only (MCQ)">Multiple Choice Only</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#A1A8B3]">
                    Questions are presented first; full worked solutions and answer keys will appear at the bottom for active recall.
                  </p>
                </>
              )}

              {/* SPECIALIST 5: Generate Flashcards */}
              {activeResource.id === 'generate-flashcards' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                        Topic or Concept
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Photosynthesis Light Reactions, Maxwell’s Equations, Sorting Algorithms..."
                        value={flashcardTopic}
                        onChange={(e) => setFlashcardTopic(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                        Card Count
                      </label>
                      <select
                        value={flashcardCount}
                        onChange={(e) => setFlashcardCount(Number(e.target.value))}
                        className="w-full px-3 py-3 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] focus:border-[#35F2D0] outline-none cursor-pointer"
                      >
                        <option value={5}>5 Flashcards</option>
                        <option value={8}>8 Flashcards</option>
                        <option value={10}>10 Flashcards</option>
                        <option value={15}>15 Flashcards</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                      Source Notes or Key Excerpts (Optional if Topic provided)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Paste textbook definitions, lecture slide bullets, or specific terms to convert into flashcards..."
                      value={flashcardNotes}
                      onChange={(e) => setFlashcardNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none resize-y"
                    />
                  </div>
                </>
              )}

              {/* SPECIALIST 6: Summarize and Simplify Lecture Notes */}
              {activeResource.id === 'summarize-notes' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                        Lecture Topic / Heading (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Chapter 4: Bipolar Junction Transistors (BJT)..."
                        value={summaryTopicTitle}
                        onChange={(e) => setSummaryTopicTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                        Summary Focus
                      </label>
                      <select
                        value={summaryFocus}
                        onChange={(e) => setSummaryFocus(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] focus:border-[#35F2D0] outline-none cursor-pointer"
                      >
                        <option value="Comprehensive Technical Summary">Comprehensive Technical Summary</option>
                        <option value="Key Formulas & Definitions Focus">Key Formulas & Definitions Focus</option>
                        <option value="Plain-English Simplification">Plain-English Simplification (Intuitive)</option>
                      </select>
                    </div>
                  </div>

                  {/* Load from Library Resource if available */}
                  {resources.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-[#A1A8B3] mb-1.5">
                        Or load from your Resource Library:
                      </label>
                      <select
                        value={selectedLibraryResourceId}
                        onChange={(e) => handleSelectLibraryResource(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] focus:border-[#35F2D0] outline-none cursor-pointer"
                      >
                        <option value="">-- Choose saved study resource to autofill --</option>
                        {resources.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title} ({r.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                      Pasted Lecture Notes Content *
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Paste your raw lecture notes, transcribed audio, slides text, or textbook section here..."
                      value={summaryNotes}
                      onChange={(e) => setSummaryNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none resize-y"
                    />
                  </div>
                </>
              )}

              {/* SPECIALIST 7: Calculation Assistant */}
              {activeResource.id === 'calculation-assistant' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                      Calculation Task / Numerical Problem *
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Calculate the total equivalent resistance, resonant frequency of an RLC circuit, or Reynolds number of pipe flow..."
                      value={calcTask}
                      onChange={(e) => setCalcTask(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                        Known Given Values with Units *
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. V = 240 V, R1 = 100 Ω, R2 = 50 Ω, f = 50 Hz, L = 0.5 H"
                        value={calcGivenValues}
                        onChange={(e) => setCalcGivenValues(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                        Required Unknowns to Calculate *
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Total Impedance Z, Current I, Power Factor, Dissipated Real Power P"
                        value={calcTargetQuantity}
                        onChange={(e) => setCalcTargetQuantity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none resize-y"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#A1A8B3]">
                    The assistant provides 8 structured stages: Given, Required, Formulas, Conversions, Substitutions, Arithmetic, Final Answer with Units, and a Physical Reasonableness Check.
                  </p>
                </>
              )}

              {/* SPECIALIST 8: Practical and Project Report Writer */}
              {activeResource.id === 'report-writer' && (
                <>
                  {/* Two Report Types Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7FA] mb-2">
                      Report Type Selector *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setReportType('Laboratory Practical Report')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                          reportType === 'Laboratory Practical Report'
                            ? 'bg-[#102427] border-[#35F2D0] text-[#35F2D0] shadow-[0_0_15px_rgba(53,242,208,0.2)]'
                            : 'bg-[#090B0D] border-[#262A30] text-[#A1A8B3] hover:text-[#F5F7FA]'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-[#F5F7FA]">Laboratory Practical Report</div>
                          <div className="text-[11px] text-[#A1A8B3] mt-0.5">Apparatus, measurements, readings, and error analysis</div>
                        </div>
                        {reportType === 'Laboratory Practical Report' && <CheckCircle2 className="w-4 h-4 text-[#35F2D0]" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setReportType('Academic Project Report')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                          reportType === 'Academic Project Report'
                            ? 'bg-[#102427] border-[#35F2D0] text-[#35F2D0] shadow-[0_0_15px_rgba(53,242,208,0.2)]'
                            : 'bg-[#090B0D] border-[#262A30] text-[#A1A8B3] hover:text-[#F5F7FA]'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-[#F5F7FA]">Academic Project Report</div>
                          <div className="text-[11px] text-[#A1A8B3] mt-0.5">Project brief, technical implementation, and evaluation</div>
                        </div>
                        {reportType === 'Academic Project Report' && <CheckCircle2 className="w-4 h-4 text-[#35F2D0]" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                        {reportType === 'Laboratory Practical Report' ? 'Experiment Title *' : 'Project Title *'}
                      </label>
                      <input
                        type="text"
                        placeholder={reportType === 'Laboratory Practical Report' ? 'e.g. Verification of Ohm’s Law & Resistor Networks' : 'e.g. Autonomous Solar Tracking Controller'}
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                        Aim & Objectives *
                      </label>
                      <input
                        type="text"
                        placeholder={reportType === 'Laboratory Practical Report' ? 'e.g. To verify the linear relationship between voltage and current' : 'e.g. To design and implement a dual-axis tracker'}
                        value={reportAim}
                        onChange={(e) => setReportAim(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                      {reportType === 'Laboratory Practical Report' ? 'Supplied Experiment Instructions / Manual Details' : 'Project Brief / Source Material'}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={reportType === 'Laboratory Practical Report' ? 'Paste apparatus list, manual procedure, or circuit diagrams guidelines...' : 'Paste project requirements, system constraints, or specifications...'}
                      value={reportInstructions}
                      onChange={(e) => setReportInstructions(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none resize-y"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                      Recorded Observations, Readings, or Findings (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Paste recorded table values or findings. If left blank, clear placeholders will be generated without fabrication."
                      value={reportFindings}
                      onChange={(e) => setReportFindings(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none resize-y"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-[#F5F7FA]">
                        Lecturer's Instructions / Required Format (Optional)
                      </label>
                      <span className="text-[11px] text-[#A1A8B3]">Overrides default template</span>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Paste departmental guidelines, preferred section headings, writing style, or specific marking rubric instructions..."
                      value={lecturerFormat}
                      onChange={(e) => setLecturerFormat(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none resize-y"
                    />
                  </div>
                </>
              )}

              {/* Action Submit Button */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] text-[#64748B]">
                  Powered by POLYVEX Academic AI engine • Zero data fabrication guardrails
                </span>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#35F2D0] text-[#090B0D] font-bold text-xs hover:bg-[#35F2D0]/90 transition shadow-[0_0_15px_rgba(53,242,208,0.25)] disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#090B0D]" />
                      <span>Generating with AI...</span>
                    </>
                  ) : (
                    <>
                      <span>{activeResource.submitButtonText}</span>
                      <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="bg-[#171A1E] border border-[#262A30] rounded-2xl p-8 text-center space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-[#090B0D] border border-[#262A30] mx-auto flex items-center justify-center shadow-xs">
                <Loader2 className="w-6 h-6 text-[#35F2D0] animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-[#F5F7FA]">Generating Academic Response</h3>
                <p className="text-xs text-[#A1A8B3] max-w-md mx-auto">
                  {activeResource.loadingMessage}
                </p>
              </div>
            </div>
          )}

          {/* Generated Response Output Display */}
          {currentGeneratedText && !isLoading && (
            <div className="bg-[#171A1E] border border-[#262A30] rounded-2xl p-5 sm:p-7 shadow-sm space-y-5 animate-fadeIn">
              {/* Output Header Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262A30]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#090B0D] text-[#35F2D0] border border-[#262A30]">
                    <CheckCircle2 className="w-4 h-4 text-[#35F2D0]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F7FA]">Generated Result ({currentDifficulty})</h3>
                    <p className="text-[11px] text-[#A1A8B3]">Review, edit, copy, or export your AI response</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyResult}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#090B0D] hover:bg-[#20252C] border border-[#262A30] text-xs font-semibold text-[#F5F7FA] hover:text-[#35F2D0] transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#35F2D0]" />
                        <span className="text-[#35F2D0]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Output</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#090B0D] hover:bg-[#20252C] border border-[#262A30] text-xs font-semibold text-[#A1A8B3] hover:text-[#F5F7FA] transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>

                  {/* For Report Writer: Action to open in Lab Report Editor */}
                  {activeResource.id === 'report-writer' && onOpenReportDraft && (
                    <button
                      type="button"
                      onClick={() => onOpenReportDraft(undefined, undefined, selectedCourseId, reportTitle)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#35F2D0] text-[#090B0D] text-xs font-bold hover:bg-[#35F2D0]/90 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Open in Report Editor</span>
                    </button>
                  )}

                  {/* Open in Assistant Chat follow-up */}
                  {onUseInAssistant && (
                    <button
                      type="button"
                      onClick={() => onUseInAssistant(selectedCourseId, `Regarding ${activeResource.title}: ${currentGeneratedText.slice(0, 80)}...`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#102427] border border-[#35F2D0]/40 text-[#35F2D0] text-xs font-bold hover:bg-[#35F2D0]/20 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Continue in AI Chat</span>
                    </button>
                  )}
                </div>
              </div>

              {/* SPECIAL INTERACTIVE RENDERER FOR FLASHCARDS */}
              {activeResource.id === 'generate-flashcards' && parsedCards.length > 0 && (
                <FlashcardDeck
                  cards={parsedCards}
                  title={flashcardTopic ? `Flashcards: ${flashcardTopic}` : activeCourse ? `Flashcards: ${activeCourse.title}` : 'Generated Flashcard Deck'}
                />
              )}

              {/* Full Markdown Response Body with Active Recall Divider Handling */}
              {activeResource.id === 'practice-questions' && practiceQuestionParts ? (
                <div className="space-y-6">
                  {/* Questions Section (Presented First) */}
                  <div className="w-full min-w-0 max-w-full font-sans text-sm sm:text-base text-[#F5F7FA] space-y-3 selection:bg-[#35F2D0]/30 markdown-body break-words [overflow-wrap:anywhere]">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#102427] text-[#35F2D0] border border-[#35F2D0]/30 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Practice Examination Questions</span>
                    </div>
                    <PolyvexMarkdown text={practiceQuestionParts.questionsPart} />
                  </div>

                  {/* Active Recall Answer Key Reveal Toggle */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#090B0D] border border-[#262A30] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-[#F5F7FA]">Self-Assessment Answer Key</h4>
                        <p className="text-xs text-[#A1A8B3]">Attempt the questions first, then reveal step-by-step solutions and rationale.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAnswerKey(!showAnswerKey)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          showAnswerKey
                            ? 'bg-[#20252C] text-[#F5F7FA] border border-[#262A30] hover:bg-[#2A3038]'
                            : 'bg-[#35F2D0] text-[#090B0D] hover:bg-[#35F2D0]/90 shadow-[0_0_12px_rgba(53,242,208,0.2)]'
                        }`}
                      >
                        {showAnswerKey ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hide Answer Key</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Reveal Answer Key & Explanations</span>
                          </>
                        )}
                      </button>
                    </div>

                    {showAnswerKey && (
                      <div className="pt-4 border-t border-[#262A30] animate-fadeIn">
                        <PolyvexMarkdown text={practiceQuestionParts.answersPart} />
                      </div>
                    )}
                  </div>
                </div>
              ) : activeResource.id !== 'generate-flashcards' ? (
                <PolyvexMarkdown text={currentGeneratedText} />
              ) : null}

              {/* SPECIALIST CONVERSATION CHAT & FOLLOW-UP SECTION */}
              {activeChatHistory.length > 0 && (
                <div className="space-y-4 pt-5 border-t border-[#262A30]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#A1A8B3] flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-[#35F2D0]" />
                      <span>{activeResource.title} Follow-Up Conversation</span>
                    </h3>
                    <span className="text-[11px] font-mono text-[#64748B]">
                      {activeChatHistory.length} messages
                    </span>
                  </div>

                  {/* Render follow-up conversation turns (if more than initial result) */}
                  {activeChatHistory.length > 2 && (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {activeChatHistory.slice(2).map((msg, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border ${
                            msg.role === 'user'
                              ? 'bg-[#102427] border-[#35F2D0]/30 text-[#F5F7FA] ml-4 sm:ml-8'
                              : 'bg-[#090B0D] border-[#262A30] text-[#F5F7FA] mr-4 sm:mr-8'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-[#A1A8B3] pb-1.5 mb-2 border-b border-[#262A30]/50">
                            <span className="font-bold text-[#35F2D0]">
                              {msg.role === 'user' ? 'You (Follow-Up)' : `${activeResource.title} Specialist`}
                            </span>
                            <span>{msg.timestamp || 'Just now'}</span>
                          </div>

                          <PolyvexMarkdown text={msg.text} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Follow-up Question Bar */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                      Ask a Follow-Up Question in this Specialist Workspace
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Ask a follow-up about this ${activeResource.title} response...`}
                        value={activeFollowUpInput}
                        onChange={(e) =>
                          setFollowUpInputs((prev) => ({
                            ...prev,
                            [activeResource.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendFollowUp();
                          }
                        }}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#35F2D0] outline-none"
                      />
                      <button
                        type="button"
                        disabled={isFollowUpLoading || !activeFollowUpInput.trim()}
                        onClick={handleSendFollowUp}
                        className="px-4 py-2.5 rounded-xl bg-[#35F2D0] text-[#090B0D] font-bold text-xs hover:bg-[#35F2D0]/90 transition disabled:opacity-50 cursor-pointer flex items-center justify-center shrink-0"
                      >
                        {isFollowUpLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span className="hidden sm:inline">Send</span>
                            <Send className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
