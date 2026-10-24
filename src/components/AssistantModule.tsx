import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Info,
  ShieldAlert,
  HelpCircle,
  Brain,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { Course } from '../types/index.ts';

interface AssistantModuleProps {
  courses: Course[];
  prefilledCourseId?: string;
  prefilledTopic?: string;
}

const AI_TOOLS = [
  'Explain a difficult topic step by step',
  'Summarize notes supplied by the student',
  'Generate practice questions with hidden answer key',
  'Create flashcards for spaced repetition',
  'Create a multiple-choice quiz (practice mode)',
  'Give worked examples for mathematical/engineering problem',
  'Explain a practical procedure and underlying theory',
  'Help interpret measurements and check calculations',
  'Review student’s answer and explain mistakes',
  'Help structure and improve practical report',
  'Make a revision plan for upcoming test or exam',
  'Explain differences between two related concepts',
  'Produce a glossary of important technical terms',
  'Generate a short self-test at chosen difficulty level',
];

export const AssistantModule: React.FC<AssistantModuleProps> = ({
  courses,
  prefilledCourseId,
  prefilledTopic,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState(prefilledCourseId || courses[0]?.id || '');
  const [selectedTool, setSelectedTool] = useState(AI_TOOLS[0]);
  const [topic, setTopic] = useState(prefilledTopic || '');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [style, setStyle] = useState<'Simple explanation' | 'Step-by-step' | 'Worked example' | 'Exam preparation'>('Step-by-step');
  const [numQuestions, setNumQuestions] = useState(5);
  const [notes, setNotes] = useState('');
  const [userPrompt, setUserPrompt] = useState('');

  // AI server connection status
  const [isAiConfigured, setIsAiConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseOutput, setResponseOutput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Practice quiz mode states (hide answer key until student tests themselves)
  const [quizRevealAnswer, setQuizRevealAnswer] = useState(false);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Check server AI status on mount
  useEffect(() => {
    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((data) => {
        setIsAiConfigured(Boolean(data.configured));
      })
      .catch(() => {
        setIsAiConfigured(false);
      });
  }, []);

  // Update when prefilled props change
  useEffect(() => {
    if (prefilledCourseId) setSelectedCourseId(prefilledCourseId);
    if (prefilledTopic) setTopic(prefilledTopic);
  }, [prefilledCourseId, prefilledTopic]);

  // Construct external prompt
  const generatedExternalPrompt = React.useMemo(() => {
    return `You are an elite university professor and academic tutor.
Course: ${selectedCourse?.code || ''} - ${selectedCourse?.title || ''}
Topic: ${topic || 'Core Subject Matter'}
Assistance Tool: ${selectedTool}
Difficulty Level: ${difficulty}
Style Preference: ${style}
Number of Questions (if applicable): ${numQuestions}

ACADEMIC INTEGRITY DIRECTIVE:
For laboratory and practical reports, DO NOT invent, fabricate, or hallucinate experimental measurements, apparatus readings, or lecturer requirements. If calculations are checked, use only the numbers supplied.

STUDENT NOTES / PROBLEM STATEMENT:
${notes || '(No notes attached)'}

SPECIFIC STUDENT INSTRUCTION / ATTEMPT:
${userPrompt || `Please execute the "${selectedTool}" method on this topic with rigorous step-by-step explanations.`}
`;
  }, [selectedCourse, topic, selectedTool, difficulty, style, numQuestions, notes, userPrompt]);

  const handleExecute = async () => {
    if (!topic.trim() && !notes.trim() && !userPrompt.trim()) {
      setErrorMessage('Please provide a topic title, notes, or specific problem to solve.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    setQuizRevealAnswer(false);

    try {
      const res = await fetch('/api/ai/study-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: selectedTool,
          courseCode: selectedCourse?.code,
          courseTitle: selectedCourse?.title,
          topic,
          difficulty,
          style,
          numQuestions,
          notes,
          userPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.configured === false || res.status === 503) {
          setIsAiConfigured(false);
          setErrorMessage(
            'Server AI credentials are not configured. You can use the External Prompt Mode below with zero setup!'
          );
        } else {
          setErrorMessage(data.error || 'Failed to generate study assistance.');
        }
      } else {
        setResponseOutput(data.text);
      }
    } catch (err: any) {
      setIsAiConfigured(false);
      setErrorMessage('Unable to reach server AI endpoint. External Prompt Mode is active.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedExternalPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(responseOutput);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>AI Study Assistant & Tutor</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Step-by-step topic breakdowns, engineering worked examples, quiz generator, and report editing.
          </p>
        </div>

        {/* Operating Mode Status Pill */}
        <div className="flex items-center gap-2">
          {isAiConfigured === true ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Native Gemini AI Active</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-semibold border border-amber-300 dark:border-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>External Prompt Mode (No API Key Required)</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Parameter Controls */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 border-b pb-2 border-stone-200 dark:border-stone-800">
            Study Tool Configuration
          </h2>

          <div>
            <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
              Select Study Tool
            </label>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
            >
              {AI_TOOLS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced (Exam prep)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
              Academic Topic
            </label>
            <input
              type="text"
              placeholder="e.g. Norton Equivalent Circuits or Fourier Transform"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                Explanation Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
              >
                <option value="Step-by-step">Step-by-step</option>
                <option value="Simple explanation">Simple explanation</option>
                <option value="Worked example">Worked example</option>
                <option value="Exam preparation">Exam preparation</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                Quiz / Question Count
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
              Lecture Notes / Problem Statement (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Paste relevant textbook excerpt, formulas, or raw question..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
              Specific Question or Student Attempt (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Why does my circuit simulation differ when finding R_th?"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleExecute}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Consulting Study Assistant...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Generate AI Study Assistance</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column (7 Cols): Output Display or External Prompt Fallback */}
        <div className="lg:col-span-7 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong className="block font-semibold">Notice:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Response Container (if server generated response) */}
          {responseOutput ? (
            <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    Generated Study Explanation
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyResponse}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-medium cursor-pointer"
                  >
                    {copiedResponse ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedResponse ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponseOutput('')}
                    className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-line font-sans">
                {responseOutput}
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
                <span>Model: Google Gemini 3.8 Flash • Always verify formulas against lecture slides</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">Polyvex AI</span>
              </div>
            </div>
          ) : (
            /* External Prompt Mode Card */
            <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-3 border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    External AI Prompt Builder
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer shadow-xs transition"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? 'Copied Prompt!' : 'Copy Formatted Prompt'}</span>
                </button>
              </div>

              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                Polyvex formats an academic prompt containing your course context, syllabus instructions, and anti-hallucination directives. Copy and paste it into any AI tool you use (ChatGPT, Claude, Gemini Web, DeepSeek, etc.):
              </p>

              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 font-mono text-[11px] text-stone-800 dark:text-stone-200 whitespace-pre-line leading-relaxed max-h-[320px] overflow-y-auto">
                {generatedExternalPrompt}
              </div>

              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-3.5 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-[11px] text-blue-900 dark:text-blue-200">
                  <strong className="block font-semibold">How to Enable Server-Side Native Gemini:</strong>
                  <span>
                    To run AI requests natively inside Polyvex without copying prompts, ensure a valid <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">GEMINI_API_KEY</code> is configured in the environment. Polyvex will automatically detect it!
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
