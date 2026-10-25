import React, { useState } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  Layers
} from 'lucide-react';
import { AI_PROMPT_LIBRARY, PromptTemplate } from '../utils/promptLibrary.ts';
import { Course } from '../types/index.ts';

interface PromptLibraryModuleProps {
  courses: Course[];
  studentLevel?: string;
  onUseInAssistant?: (courseId: string, promptText: string) => void;
}

export const PromptLibraryModule: React.FC<PromptLibraryModuleProps> = ({
  courses,
  studentLevel = '300L',
  onUseInAssistant,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCourseCode, setSelectedCourseCode] = useState(courses[0]?.code || 'EEE 311');
  const [customTopic, setCustomTopic] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    'all',
    'Concepts & Theory',
    'Problem Solving',
    'Practice & Quizzes',
    'Practicals & Lab Reports',
    'Planning & Summaries',
  ];

  const filteredPrompts = AI_PROMPT_LIBRARY.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopy = (prompt: PromptTemplate) => {
    const text = prompt.template({
      course: selectedCourseCode,
      topic: customTopic || undefined,
      level: studentLevel,
      notes: customNotes || undefined,
    });

    navigator.clipboard.writeText(text);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>Built-in Copyable AI Study Prompt Library</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            12 field-tested prompts for engineering, science, and university exams. Works with zero API key.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Anti-Fabrication Guardrails Built-in</span>
        </div>
      </div>

      {/* Preset Customizer Bar */}
      <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider text-[11px]">
            Template Personalization (Injected into copied prompts)
          </span>
          <span className="text-[11px] text-stone-400">Updates all templates below in real time</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-stone-600 dark:text-stone-400 font-medium mb-1">Course Code</label>
            <select
              value={selectedCourseCode}
              onChange={(e) => setSelectedCourseCode(e.target.value)}
              className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
            >
              {courses.length === 0 ? (
                <option value="GENERAL">No courses registered (General)</option>
              ) : (
                courses.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} — {c.title}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-stone-600 dark:text-stone-400 font-medium mb-1">Target Topic</label>
            <input
              type="text"
              placeholder="e.g. Thevenin’s Theorem or Fourier Series"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block text-stone-600 dark:text-stone-400 font-medium mb-1">Optional Problem / Notes</label>
            <input
              type="text"
              placeholder="e.g. Find R_th across terminals A-B..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search prompts by keyword or academic technique..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-800 text-white font-semibold'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPrompts.map((prompt) => {
          const renderedText = prompt.template({
            course: selectedCourseCode,
            topic: customTopic || undefined,
            level: studentLevel,
            notes: customNotes || undefined,
          });
          const isCopied = copiedId === prompt.id;

          return (
            <div
              key={prompt.id}
              className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    {prompt.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(prompt)}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-emerald-700 hover:text-white transition font-medium cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied!' : 'Copy Prompt'}</span>
                  </button>
                </div>

                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {prompt.title}
                </h3>

                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {prompt.description}
                </p>

                {/* Live Preview Box */}
                <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-700 font-mono text-[11px] text-stone-700 dark:text-stone-300 line-clamp-4 whitespace-pre-line">
                  {renderedText}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="text-[10px] text-stone-400">
                  Ready to paste into ChatGPT / Claude / Gemini
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(prompt)}
                  className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Copy Ready-to-Use</span>
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
