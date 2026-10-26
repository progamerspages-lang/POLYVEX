import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { preprocessMarkdown, renderCellWithBreaks, markdownComponents, PolyvexMarkdown } from '../utils/markdownUtils.tsx';
import {
  Sparkles,
  Globe,
  BookOpen,
  Layers,
  Send,
  Paperclip,
  X,
  Search,
  Plus,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  FileText,
  Video,
  FileCode,
  Tag,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Info,
  CheckSquare,
  HelpCircle,
  Loader2,
  CornerDownLeft,
  ThumbsUp,
  ThumbsDown,
  Share2,
  MoreVertical
} from 'lucide-react';
import { Course, StudyResource, ResourceType } from '../types/index.ts';
import { PolyvexLogo } from './PolyvexLogo.tsx';

export type ResearchMode = 'ai-mode' | 'study-materials' | 'combined' | 'web-search';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  mode?: ResearchMode;
  courseCode?: string;
  materialCitations?: Array<{ id: string; title: string; type: string; linkOrRef?: string; description?: string }>;
  webSources?: Array<{ title: string; url: string; domain?: string }>;
  webSearchQueries?: string[];
  isOfflineFallback?: boolean;
  feedback?: 'good' | 'bad';
}

interface AssistantModuleProps {
  courses: Course[];
  resources: StudyResource[];
  prefilledCourseId?: string;
  prefilledTopic?: string;
  onNavigate?: (tab: any) => void;
  onOpenAddCourse?: () => void;
}

export const AssistantModule: React.FC<AssistantModuleProps> = ({
  courses,
  resources,
  prefilledCourseId,
  prefilledTopic,
  onNavigate,
  onOpenAddCourse,
}) => {
  // Course selection (Default to General context '')
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    if (prefilledCourseId && courses.some((c) => c.id === prefilledCourseId)) {
      return prefilledCourseId;
    }
    return '';
  });

  // Research mode: 'ai-mode' | 'study-materials' | 'combined'
  const [mode, setMode] = useState<ResearchMode>('ai-mode');

  // Question input in composer
  const [inputQuery, setInputQuery] = useState(prefilledTopic || '');

  // Attached study materials (selected resource IDs)
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);

  // Picker modal state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerTypeFilter, setPickerTypeFilter] = useState<string>('all');

  // Conversation history
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Loading & status
  const [isLoading, setIsLoading] = useState(false);
  const [currentStepStatus, setCurrentStepStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAiConfigured, setIsAiConfigured] = useState<boolean | null>(null);

  // External prompt modal / preview
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [previewPromptText, setPreviewPromptText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);

  // Close overflow menu on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.assistant-action-menu-container')) {
        setActiveMenuMsgId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuMsgId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Active course object (null when General is selected)
  const activeCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    return courses.find((c) => c.id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  // Safely fallback to General if active course is deleted
  useEffect(() => {
    if (selectedCourseId && !courses.some((c) => c.id === selectedCourseId)) {
      setSelectedCourseId('');
      setSelectedResourceIds([]);
    }
  }, [courses, selectedCourseId]);

  // Available resources (all resources if General, or filtered for active course)
  const courseResources = useMemo(() => {
    if (!activeCourse) return resources;
    return resources.filter((r) => r.courseId === activeCourse.id);
  }, [resources, activeCourse]);

  // Map of selected resources
  const selectedMaterials = useMemo(() => {
    return courseResources.filter((r) => selectedResourceIds.includes(r.id));
  }, [courseResources, selectedResourceIds]);

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

  // Sync prefilled props if changed
  useEffect(() => {
    if (prefilledCourseId && courses.some((c) => c.id === prefilledCourseId)) {
      setSelectedCourseId(prefilledCourseId);
      // Reset selected materials from previous course
      setSelectedResourceIds([]);
    }
  }, [prefilledCourseId, courses]);

  useEffect(() => {
    if (prefilledTopic) {
      setInputQuery(prefilledTopic);
    }
  }, [prefilledTopic]);

  // When active course changes: reset attached study materials so previous course items don't linger
  const handleCourseChange = (newCourseId: string) => {
    setSelectedCourseId(newCourseId);
    setSelectedResourceIds([]); // Requirement: prevent materials from previous course from remaining selected
  };

  const [isNearBottom, setIsNearBottom] = useState(true);

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    setIsNearBottom(distanceToBottom < 140);
  };

  // Scroll to bottom only if user is near bottom during message streaming or new messages
  useEffect(() => {
    if (isNearBottom && messages.length > 0) {
      requestAnimationFrame(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'auto' });
      });
    }
  }, [messages]);

  // Adjust textarea height automatically
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputQuery(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
    }
  };

  // Material attachment toggles
  const handleToggleResource = (id: string) => {
    setSelectedResourceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllResources = () => {
    setSelectedResourceIds(courseResources.map((r) => r.id));
  };

  const handleClearSelectedResources = () => {
    setSelectedResourceIds([]);
  };

  const handleRemoveMaterialChip = (id: string) => {
    setSelectedResourceIds((prev) => prev.filter((item) => item !== id));
  };

  // Generate external prompt for fallback or inspection
  const constructPrompt = (query: string, attached: StudyResource[]) => {
    let modeLabel = 'COMBINED (STUDY MATERIALS + GENERAL AI)';
    if (mode === 'ai-mode' || mode === 'web-search') modeLabel = 'AI MODE (GENERAL ASSISTANT)';
    if (mode === 'study-materials') modeLabel = 'STUDY MATERIALS ONLY (STRICT GROUNDING)';

    let materialsSection = attached.length > 0
      ? attached.map((r, i) => `[Material ${i + 1}] "${r.title}" (${r.type})\n${r.description ? `Description: ${r.description}\n` : ''}${r.linkOrRef ? `Ref: ${r.linkOrRef}\n` : ''}${r.notes ? `Student Notes: ${r.notes}\n` : ''}`).join('\n\n')
      : '(No specific files attached. Use general course syllabus context)';

    return `You are Polyvex, a friendly, intelligent, conversational AI assistant and study companion.
COURSE CONTEXT: ${activeCourse ? `${activeCourse.code} — ${activeCourse.title}` : 'General Studies'}
RESEARCH MODE: ${modeLabel}

STUDENT'S INQUIRY:
${query}

STUDY MATERIALS SUPPLIED (${attached.length}):
${materialsSection}

INSTRUCTIONS:
1. Explain step-by-step with rigorous academic depth, clear headings, formulas with units, and examples.
2. If in Study Materials mode, ground your explanation strictly in the materials supplied. If missing key info, state so explicitly.
3. If in Combined mode, distinguish citations from [Course Materials] vs [External Web Literature].
4. Never invent experimental laboratory measurements or lecturer requirements.`;
  };

  // Regenerate assistant response
  const handleRegenerate = async (msgToRegenerate: ChatMessage, index: number) => {
    if (isLoading) return;
    let targetUserQuery = '';
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        targetUserQuery = messages[i].text;
        break;
      }
    }
    if (!targetUserQuery) return;

    setErrorMessage(null);
    setIsLoading(true);
    setCurrentStepStatus('Regenerating response...');

    try {
      const conversationHistory = messages
        .slice(0, index)
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          text: m.text,
        }));

      const res = await fetch('/api/ai/study-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: msgToRegenerate.mode || mode,
          question: targetUserQuery,
          courseCode: activeCourse?.code || '',
          courseTitle: activeCourse?.title || '',
          selectedResources: selectedMaterials.map((r) => ({
            id: r.id,
            title: r.title,
            type: r.type,
            description: r.description,
            linkOrRef: r.linkOrRef,
            notes: r.notes,
          })),
          conversationHistory,
          stream: true,
        }),
      });

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream')) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgToRegenerate.id ? { ...m, text: '', webSources: [], materialCitations: [] } : m
          )
        );
        setIsLoading(false);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let assistantText = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunkStr = decoder.decode(value, { stream: true });
            const lines = chunkStr.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const dataStr = trimmed.replace(/^data:\s*/, '');
              if (dataStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.chunk) {
                  assistantText += parsed.chunk;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === msgToRegenerate.id ? { ...m, text: assistantText } : m))
                  );
                }
                if (parsed.webSources) {
                  setMessages((prev) =>
                    prev.map((m) => (m.id === msgToRegenerate.id ? { ...m, webSources: parsed.webSources } : m))
                  );
                }
                if (parsed.materialCitations) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === msgToRegenerate.id ? { ...m, materialCitations: parsed.materialCitations } : m
                    )
                  );
                }
              } catch {}
            }
          }
        }
      } else {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgToRegenerate.id
              ? {
                  ...m,
                  text: data.text || 'No response generated.',
                  materialCitations: data.materialCitations || [],
                  webSources: data.webSources || [],
                }
              : m
          )
        );
      }
    } catch (err: any) {
      setErrorMessage('Failed to regenerate response.');
    } finally {
      setIsLoading(false);
      setCurrentStepStatus(null);
    }
  };

  const handleShare = async (msg: ChatMessage) => {
    const shareText = `Polyvex AI Study Assistant Response:\n\n${msg.text}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'POLYVEX Study Answer',
          text: shareText,
        });
        return;
      } catch {}
    }
    navigator.clipboard.writeText(shareText);
    setCopiedId(`share-${msg.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (msgId: string, feedbackType: 'good' | 'bad') => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, feedback: m.feedback === feedbackType ? undefined : feedbackType } : m
      )
    );
  };

  // Submit query
  const handleSendMessage = async (queryToSend?: string) => {
    const q = (queryToSend !== undefined ? queryToSend : inputQuery).trim();
    if (!q || isLoading) return;

    setErrorMessage(null);

    // Create user message
    const userMsg: ChatMessage = {
      id: `usr-${Date.now().toString(36)}`,
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode,
      courseCode: activeCourse?.code,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsLoading(true);

    if (mode === 'ai-mode' || mode === 'web-search') {
      setCurrentStepStatus('Thinking...');
    } else if (mode === 'study-materials') {
      setCurrentStepStatus(`Retrieving information from ${selectedMaterials.length} course material(s)...`);
    } else {
      setCurrentStepStatus('Synthesizing course materials with AI reasoning...');
    }

    try {
      // Build conversation history for context
      const conversationHistory = messages.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await fetch('/api/ai/study-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          question: q,
          courseCode: activeCourse?.code || '',
          courseTitle: activeCourse?.title || '',
          selectedResources: selectedMaterials.map((r) => ({
            id: r.id,
            title: r.title,
            type: r.type,
            description: r.description,
            linkOrRef: r.linkOrRef,
            notes: r.notes,
          })),
          conversationHistory,
          stream: true,
        }),
      });

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream')) {
        const assistantMsgId = `ast-${Date.now().toString(36)}`;
        const assistantMsg: ChatMessage = {
          id: assistantMsgId,
          role: 'assistant',
          text: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode,
          courseCode: activeCourse?.code,
          materialCitations: [],
          webSources: [],
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false); // Stop loading spinner once streaming starts receiving chunks

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let assistantText = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunkStr = decoder.decode(value, { stream: true });
            const lines = chunkStr.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const dataStr = trimmed.replace(/^data:\s*/, '');
              if (dataStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  setErrorMessage(parsed.error);
                }
                if (parsed.chunk) {
                  assistantText += parsed.chunk;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMsgId ? { ...m, text: assistantText } : m))
                  );
                }
                if (parsed.webSources) {
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMsgId ? { ...m, webSources: parsed.webSources } : m))
                  );
                }
                if (parsed.materialCitations) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId ? { ...m, materialCitations: parsed.materialCitations } : m
                    )
                  );
                }
              } catch {}
            }
          }
        }
      } else {
        const data = await res.json();

        if (!res.ok || data.configured === false) {
          setIsAiConfigured(false);

          // Honest offline handling: Do NOT fabricate search citations or pretend API succeeded
          const promptForFallback = constructPrompt(q, selectedMaterials);
          setPreviewPromptText(promptForFallback);

          let fallbackText = '';
          if (mode === 'web-search') {
            fallbackText = `### Web Search Integration Notice

The native Gemini AI / Google Search integration is not currently active on the server (server-side \`GEMINI_API_KEY\` is unconfigured).

**How to get this answered right now:**
1. Click **"Copy Structured Prompt for External AI"** below.
2. Paste into ChatGPT, Claude, or Gemini Web — your question, course details, and academic guidelines are pre-packaged.`;
          } else if (mode === 'study-materials') {
            const matTitles = selectedMaterials.map((m) => `**${m.title}** (${m.type})`).join(', ');
            fallbackText = `### Study Materials Synthesis (Offline Local Mode)

*Grounded on selected materials:* ${matTitles || 'Active Course Context'}

Polyvex is currently operating in **Offline Local Workspace Mode**.

**Selected Material References:**
${selectedMaterials.map((m) => `- **${m.title}** [${m.type}]: ${m.description || m.linkOrRef || 'Course reference notes'}${m.notes ? `\n  *Notes:* ${m.notes}` : ''}`).join('\n') || '- *No direct file notes attached.*'}

**Immediate Study Recommendation:**
To receive deep AI comprehension with your specific syllabus materials, click **"Copy Structured Prompt"** below and paste it into any external AI assistant.`;
          } else {
            fallbackText = `### Combined Mode Integration Notice

Native Gemini multi-source synthesis with Google Search grounding requires a server-side API configuration.

**Transparent Status:**
- **Course Materials Attached:** ${selectedMaterials.length} material(s)
- **Web Grounding:** Offline

You can copy the structured research prompt containing both your course context and external queries below.`;
          }

          const fallbackMsg: ChatMessage = {
            id: `ast-${Date.now().toString(36)}`,
            role: 'assistant',
            text: fallbackText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mode,
            courseCode: activeCourse?.code,
            materialCitations: selectedMaterials.map((r) => ({
              id: r.id,
              title: r.title,
              type: r.type,
              linkOrRef: r.linkOrRef,
              description: r.description,
            })),
            isOfflineFallback: true,
          };

          setMessages((prev) => [...prev, fallbackMsg]);
        } else {
          // Successful response from native server AI
          const assistantMsg: ChatMessage = {
            id: `ast-${Date.now().toString(36)}`,
            role: 'assistant',
            text: data.text || 'No response generated.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mode: data.mode || mode,
            courseCode: activeCourse?.code,
            materialCitations: data.materialCitations || [],
            webSources: data.webSources || [],
            webSearchQueries: data.webSearchQueries || [],
          };

          setMessages((prev) => [...prev, assistantMsg]);
        }
      }
    } catch (err: any) {
      setErrorMessage('Unable to communicate with the study assistant endpoint. Local Mode prompt tools remain available.');
    } finally {
      setIsLoading(false);
      setCurrentStepStatus(null);
    }
  };

  // Copy text helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Keyboard shortcut: Enter to submit, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Starters
  const STARTER_PROMPTS = [
    {
      title: 'Solve a math or engineering problem',
      prompt: 'Solve this problem step by step with clear formulas, units, and verification: ',
      mode: 'ai-mode' as ResearchMode,
    },
    {
      title: 'Break down a complex concept',
      prompt: 'Explain the core principles and derivations of this topic step by step with clear intuition.',
      mode: 'ai-mode' as ResearchMode,
    },
    {
      title: 'Practice exam questions',
      prompt: 'Generate 5 rigorous practice examination questions with step-by-step solutions based on my course.',
      mode: 'combined' as ResearchMode,
    },
    {
      title: 'Laboratory report guidance',
      prompt: 'Help me structure a standard formal report for this experiment, including theory, apparatus, and calculations.',
      mode: 'study-materials' as ResearchMode,
    },
  ];

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-3.5 h-3.5 text-rose-400" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-purple-400" />;
      case 'website':
        return <Globe className="w-3.5 h-3.5 text-blue-400" />;
      case 'past question':
        return <FileCode className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-[#35F2D0]" />;
    }
  };

  // Filtered resources in picker modal
  const filteredPickerResources = useMemo(() => {
    return courseResources.filter((res) => {
      if (pickerSearch.trim()) {
        const q = pickerSearch.toLowerCase();
        const matchTitle = res.title.toLowerCase().includes(q);
        const matchDesc = (res.description || '').toLowerCase().includes(q);
        const matchTags = res.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTags) return false;
      }
      if (pickerTypeFilter !== 'all' && res.type !== pickerTypeFilter) {
        return false;
      }
      return true;
    });
  }, [courseResources, pickerSearch, pickerTypeFilter]);

  return (
    <div className="w-full min-w-0 max-w-5xl mx-auto space-y-4 pb-6 overflow-x-hidden">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#171A1E] px-5 py-4 rounded-2xl border border-[#262A30] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#090B0D] border border-[#262A30] shadow-xs">
            <PolyvexLogo size={28} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#F5F7FA] flex items-center gap-2">
              <span>AI Study Assistant</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#090B0D] text-[#35F2D0] border border-[#262A30]">
                POLYVEX
              </span>
            </h1>
            <p className="text-xs text-[#A1A8B3] mt-0.5">
              Learn from your course materials, explore the web, or combine both.
            </p>
          </div>
        </div>

        {/* Course Selector Dropdown & Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#A1A8B3] flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-[#35F2D0]" />
                <span className="hidden sm:inline">Active Course:</span>
              </span>
              <select
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="bg-[#090B0D] border border-[#262A30] hover:border-[#35F2D0]/50 text-[#F5F7FA] font-mono text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#35F2D0] transition cursor-pointer"
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

            {courses.length === 0 && (
              <button
                type="button"
                onClick={onOpenAddCourse}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#35F2D0] text-[#090B0D] text-xs font-bold hover:bg-[#35F2D0]/90 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Courses</span>
              </button>
            )}

          {/* Transparent Connection Status Pill */}
          <div className="hidden md:flex items-center">
            {isAiConfigured === true ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#102427] text-[#35F2D0] border border-[#35F2D0]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#35F2D0] animate-pulse"></span>
                <span>Native AI Connected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#20252C] text-[#A1A8B3] border border-[#262A30]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Local Workspace Mode</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 cursor-pointer p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Main Conversation Area */}
      <div className="w-full min-w-0 bg-[#171A1E] rounded-2xl border border-[#262A30] min-h-[460px] flex flex-col justify-between shadow-sm overflow-hidden">
        {/* Messages Thread */}
        <div className="w-full min-w-0 p-3 sm:p-6 space-y-6 flex-1 overflow-y-auto overflow-x-hidden" onScroll={handleChatScroll}>
          {messages.length === 0 ? (
            /* First-Time Welcoming Empty State */
            <div className="py-10 px-4 text-center max-w-2xl mx-auto space-y-6">
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#35F2D0]/10 to-[#00AFC8]/10 blur-xl rounded-full pointer-events-none" />
                <PolyvexLogo size={56} className="relative mx-auto" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#F5F7FA] tracking-tight">
                  Understand more. Study smarter.
                </h2>
                <p className="text-xs sm:text-sm text-[#A1A8B3] max-w-lg mx-auto leading-relaxed">
                  Ask questions, explore difficult concepts, and learn directly from your course materials.
                </p>
              </div>

              {/* Mode Explanation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                <div
                  onClick={() => setMode('ai-mode')}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    mode === 'ai-mode' || mode === 'web-search'
                      ? 'bg-[#102427] border-[#35F2D0]/60 shadow-[0_0_12px_rgba(53,242,208,0.15)]'
                      : 'bg-[#090B0D] border-[#262A30] hover:border-[#35F2D0]/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-[#F5F7FA]">
                    <Sparkles className="w-4 h-4 text-[#35F2D0]" />
                    <span>AI Mode</span>
                  </div>
                  <p className="text-[11px] text-[#A1A8B3] leading-snug">
                    General-purpose conversational assistant for solving math, engineering, and coursework.
                  </p>
                </div>

                <div
                  onClick={() => setMode('study-materials')}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    mode === 'study-materials'
                      ? 'bg-[#102427] border-[#35F2D0]/60 shadow-[0_0_12px_rgba(53,242,208,0.15)]'
                      : 'bg-[#090B0D] border-[#262A30] hover:border-[#35F2D0]/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-[#F5F7FA]">
                    <BookOpen className="w-4 h-4 text-[#35F2D0]" />
                    <span>Study Materials</span>
                  </div>
                  <p className="text-[11px] text-[#A1A8B3] leading-snug">
                    Grounded strictly in your attached course slides, notes, and references.
                  </p>
                </div>

                <div
                  onClick={() => setMode('combined')}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    mode === 'combined'
                      ? 'bg-[#102427] border-[#35F2D0]/60 shadow-[0_0_12px_rgba(53,242,208,0.15)]'
                      : 'bg-[#090B0D] border-[#262A30] hover:border-[#35F2D0]/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-[#F5F7FA]">
                    <Layers className="w-4 h-4 text-[#35F2D0]" />
                    <span>Combined</span>
                  </div>
                  <p className="text-[11px] text-[#A1A8B3] leading-snug">
                    Combines general AI reasoning with your course materials for complete answers.
                  </p>
                </div>
              </div>

              {/* Starter Suggestions */}
              <div className="space-y-2 pt-2 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                  Suggested inquiries for {activeCourse?.code || 'your course'}:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STARTER_PROMPTS.map((starter, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setMode(starter.mode);
                        handleSendMessage(starter.prompt);
                      }}
                      className="p-3 rounded-xl bg-[#090B0D] hover:bg-[#20252C] border border-[#262A30] hover:border-[#35F2D0]/40 text-left transition cursor-pointer group"
                    >
                      <div className="text-xs font-semibold text-[#F5F7FA] group-hover:text-[#35F2D0] transition">
                        {starter.title}
                      </div>
                      <div className="text-[11px] text-[#A1A8B3] mt-1 line-clamp-1">
                        {starter.prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Conversation Messages List */
            messages.map((msg, index) => (
              <React.Fragment key={msg.id}>
                <ChatMessageItem
                  msg={msg}
                  index={index}
                  messages={messages}
                  selectedMaterials={selectedMaterials}
                  handleCopy={handleCopy}
                  handleRegenerate={handleRegenerate}
                  handleFeedback={handleFeedback}
                  handleShare={handleShare}
                  constructPrompt={constructPrompt}
                  setPreviewPromptText={setPreviewPromptText}
                  setShowPromptPreview={setShowPromptPreview}
                  copiedId={copiedId}
                  activeMenuMsgId={activeMenuMsgId}
                  setActiveMenuMsgId={setActiveMenuMsgId}
                />

                </React.Fragment>
            ))
          )}

          {/* Real request loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-[#090B0D] border border-[#262A30] flex items-center justify-center shrink-0">
                <PolyvexLogo size={20} />
              </div>
              <div className="bg-[#090B0D] border border-[#262A30] rounded-2xl p-4 text-xs text-[#A1A8B3] flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-[#35F2D0] animate-spin" />
                <span>{currentStepStatus || 'Processing research query...'}</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* 3. Message Composer Container */}
        <div className="p-4 bg-[#101317] border-t border-[#262A30] space-y-3">
          {/* Segmented Mode Selector & Attached Materials Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Mode Switcher */}
            <div className="flex items-center bg-[#090B0D] p-1 rounded-xl border border-[#262A30] self-start sm:self-auto text-xs">
              <button
                type="button"
                onClick={() => setMode('ai-mode')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  mode === 'ai-mode' || mode === 'web-search'
                    ? 'bg-[#35F2D0] text-[#090B0D] shadow-[0_0_10px_rgba(53,242,208,0.25)]'
                    : 'text-[#A1A8B3] hover:text-[#F5F7FA]'
                }`}
                title="General-purpose AI assistant for coursework, math, and concepts"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('study-materials')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  mode === 'study-materials'
                    ? 'bg-[#35F2D0] text-[#090B0D] shadow-[0_0_10px_rgba(53,242,208,0.25)]'
                    : 'text-[#A1A8B3] hover:text-[#F5F7FA]'
                }`}
                title="Strictly grounded in your selected course materials"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Study Materials</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('combined')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  mode === 'combined'
                    ? 'bg-[#35F2D0] text-[#090B0D] shadow-[0_0_10px_rgba(53,242,208,0.25)]'
                    : 'text-[#A1A8B3] hover:text-[#F5F7FA]'
                }`}
                title="Synthesize course materials with general AI reasoning"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Combined</span>
              </button>
            </div>

            {/* Study Materials Attachment Trigger Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition ${
                  selectedMaterials.length > 0
                    ? 'bg-[#102427] text-[#35F2D0] border-[#35F2D0]/40'
                    : 'bg-[#090B0D] text-[#A1A8B3] hover:text-[#F5F7FA] border-[#262A30] hover:border-[#35F2D0]/30'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>
                  {selectedMaterials.length === 0
                    ? 'Attach Study Materials'
                    : `${selectedMaterials.length} material${selectedMaterials.length === 1 ? '' : 's'} attached`}
                </span>
                {courseResources.length > 0 && selectedMaterials.length === 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#171A1E] text-[#64748B]">
                    {courseResources.length} available
                  </span>
                )}
              </button>

              {selectedMaterials.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelectedResources}
                  className="text-[11px] text-[#64748B] hover:text-rose-400 cursor-pointer"
                  title="Remove all attachments"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Removable Material Chips */}
          {selectedMaterials.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {selectedMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#090B0D] border border-[#262A30] text-[11px] text-[#F5F7FA] shadow-xs"
                >
                  {getResourceTypeIcon(mat.type)}
                  <span className="max-w-[180px] truncate font-medium">{mat.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMaterialChip(mat.id)}
                    className="p-0.5 rounded-md hover:bg-[#20252C] text-[#64748B] hover:text-rose-400 cursor-pointer"
                    aria-label={`Remove ${mat.title}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Multiline Textarea Composer */}
          <div className="relative rounded-2xl bg-[#090B0D] border border-[#262A30] focus-within:border-[#35F2D0] focus-within:ring-2 focus-within:ring-[#35F2D0]/10 transition">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputQuery}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your course, a difficult concept, or a problem you're solving..."
              className="w-full bg-transparent p-3.5 pr-14 text-xs sm:text-sm text-[#F5F7FA] placeholder-[#64748B] outline-none resize-none min-h-[58px]"
            />

            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || isLoading}
                className={`p-2.5 rounded-xl font-bold transition flex items-center justify-center cursor-pointer ${
                  inputQuery.trim() && !isLoading
                    ? 'bg-[#35F2D0] text-[#090B0D] hover:bg-[#35F2D0]/90 shadow-[0_0_12px_rgba(53,242,208,0.25)]'
                    : 'bg-[#171A1E] text-[#64748B] cursor-not-allowed border border-[#262A30]'
                }`}
                aria-label="Send inquiry"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#35F2D0]" />
                ) : (
                  <Send className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>

          {/* Composer Footer Status & Subtle Desktop Hints */}
          <div className="flex items-center justify-end sm:justify-between text-[11px] text-[#64748B] px-1 pt-0.5">
            {/* Subtle keyboard instruction on desktop only */}
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[#525E6F]">
              <CornerDownLeft className="w-3 h-3 text-[#3D4754]" />
              <span>
                Press <strong className="font-semibold text-[#8B95A5]">Enter</strong> to send,{' '}
                <strong className="font-semibold text-[#8B95A5]">Shift + Enter</strong> for newline
              </span>
            </span>

            {/* Target course & active research mode indicators */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-[#64748B]">
                Target: <strong className="text-[#A1A8B3] font-medium">{activeCourse?.code || 'General'}</strong>
              </span>
              <span className="text-[#3D4754]">•</span>
              <span className="text-[#64748B]">
                Mode: <strong className="text-[#35F2D0] font-semibold uppercase tracking-wider">{mode.replace('-', ' ')}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Study Materials Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#171A1E] text-[#F5F7FA] rounded-2xl max-w-xl w-full border border-[#262A30] shadow-2xl p-6 text-xs max-h-[85vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div>
              <div className="flex items-center justify-between border-b border-[#262A30] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#090B0D] text-[#35F2D0] border border-[#262A30]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#F5F7FA]">
                      Select Course Materials ({activeCourse?.code || 'Active Course'})
                    </h2>
                    <p className="text-[11px] text-[#A1A8B3]">
                      Choose syllabus notes, past questions, and slides to ground the AI assistant
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(false)}
                  className="p-1 rounded-lg text-[#A1A8B3] hover:text-[#F5F7FA] hover:bg-[#20252C] transition cursor-pointer"
                  aria-label="Close picker"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                <div className="col-span-2 relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="text"
                    placeholder="Search materials by title or tag..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#090B0D] border border-[#262A30] focus:border-[#35F2D0] text-xs text-[#F5F7FA] placeholder-[#64748B] outline-none"
                  />
                </div>
                <div>
                  <select
                    value={pickerTypeFilter}
                    onChange={(e) => setPickerTypeFilter(e.target.value)}
                    className="w-full py-2 px-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] focus:border-[#35F2D0] text-xs text-[#F5F7FA] outline-none"
                    aria-label="Filter by material type"
                  >
                    <option value="all">All Types</option>
                    <option value="PDF">PDF Documents</option>
                    <option value="notes">Lecture Notes</option>
                    <option value="slides">Slides</option>
                    <option value="textbook">Textbooks</option>
                    <option value="past question">Past Questions</option>
                    <option value="website">Websites</option>
                  </select>
                </div>
              </div>

              {/* Selection Summary Controls */}
              <div className="flex items-center justify-between text-[11px] pb-2 px-0.5 text-[#A1A8B3]">
                <span>
                  <strong>{selectedResourceIds.length}</strong> of {courseResources.length} materials selected
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSelectAllResources}
                    className="text-[#35F2D0] hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelectedResources}
                    className="text-[#A1A8B3] hover:text-rose-400 cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            </div>

            {/* Materials List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2 max-h-[380px]">
              {courseResources.length === 0 ? (
                <div className="py-10 text-center space-y-3 bg-[#090B0D] rounded-xl border border-dashed border-[#262A30] p-6">
                  <BookOpen className="w-8 h-8 text-[#64748B] mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-[#F5F7FA]">No study resources found for {activeCourse?.code}</h3>
                    <p className="text-[11px] text-[#A1A8B3] max-w-sm mx-auto">
                      Add lecture slides, past question files, or textbook notes to your Resource Library to attach them here.
                    </p>
                  </div>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPickerOpen(false);
                        onNavigate('resources');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#35F2D0] text-[#090B0D] font-bold text-xs hover:bg-[#35F2D0]/90 transition cursor-pointer"
                    >
                      Open Resource Library
                    </button>
                  )}
                </div>
              ) : filteredPickerResources.length === 0 ? (
                <div className="py-8 text-center text-[#A1A8B3]">
                  No materials match your search filter.
                </div>
              ) : (
                filteredPickerResources.map((res) => {
                  const isSelected = selectedResourceIds.includes(res.id);
                  return (
                    <div
                      key={res.id}
                      onClick={() => handleToggleResource(res.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-[#102427] border-[#35F2D0]/50'
                          : 'bg-[#090B0D] border-[#262A30] hover:border-[#35F2D0]/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div
                        className="mt-1 accent-[#35F2D0] cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getResourceTypeIcon(res.type)}
                          <span className="font-semibold text-[#F5F7FA] text-xs truncate">
                            {res.title}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#171A1E] text-[#35F2D0] border border-[#262A30]">
                            {res.type}
                          </span>
                        </div>
                        {res.description && (
                          <p className="text-[11px] text-[#A1A8B3] line-clamp-2 mb-1">
                            {res.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                          <span>Added: {res.dateAdded}</span>
                          {res.tags?.length > 0 && (
                            <span>• {res.tags.slice(0, 3).map((t) => `#${t}`).join(' ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#262A30] flex items-center justify-between">
              <span className="text-[11px] text-[#A1A8B3]">
                Selected materials will be prioritized in Study Materials and Combined modes.
              </span>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#35F2D0] hover:bg-[#35F2D0]/90 text-[#090B0D] font-bold text-xs cursor-pointer transition shadow-xs"
              >
                Done ({selectedResourceIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Prompt Preview Modal (Optional Secondary Action) */}
      {showPromptPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#171A1E] text-[#F5F7FA] rounded-2xl max-w-xl w-full border border-[#262A30] shadow-2xl p-6 text-xs max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-[#262A30] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <PolyvexLogo size={20} />
                <h3 className="font-bold text-sm text-[#F5F7FA]">Structured Academic Prompt</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPromptPreview(false)}
                className="text-[#A1A8B3] hover:text-[#F5F7FA] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-[#A1A8B3] mb-2">
              This formatted prompt includes your active course boundaries, research mode directives, and attached study material summaries for use in external LLMs (ChatGPT, Claude, etc.):
            </p>

            <pre className="p-3 bg-[#090B0D] border border-[#262A30] rounded-xl text-[11px] font-mono text-[#F5F7FA] overflow-y-auto max-h-[340px] whitespace-pre-wrap select-all">
              {previewPromptText}
            </pre>

            <div className="pt-3 border-t border-[#262A30] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowPromptPreview(false)}
                className="px-3 py-1.5 rounded-xl border border-[#262A30] text-[#A1A8B3]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleCopy(previewPromptText, 'modal-prompt')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#35F2D0] text-[#090B0D] font-bold"
              >
                {copiedId === 'modal-prompt' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



// Memoized message item to prevent unnecessary re-renders during streaming
const ChatMessageItem = React.memo(({ msg, handleCopy, handleRegenerate, handleFeedback, handleShare, copiedId }: any) => {
  const cleanedText = useMemo(() => preprocessMarkdown(msg.text), [msg.text]);

  return (
    <div className={`w-full min-w-0 max-w-full flex gap-2.5 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {msg.role === 'assistant' && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#090B0D] border border-[#262A30] flex items-center justify-center shrink-0 mt-1 shadow-xs">
          <PolyvexLogo size={18} />
        </div>
      )}

      <div
        className={`w-full min-w-0 max-w-full sm:max-w-3xl rounded-2xl p-3.5 sm:p-5 text-sm leading-relaxed space-y-3 overflow-hidden ${
          msg.role === 'user'
            ? 'bg-[#102427] text-[#F5F7FA] border border-[#35F2D0]/30 shadow-xs'
            : 'bg-[#090B0D] text-[#F5F7FA] border border-[#262A30] shadow-sm'
        }`}
      >
        {/* Message Meta Info */}
        <div className="flex items-center justify-between text-[11px] text-[#A1A8B3] pb-1 border-b border-[#262A30]/50 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
            <span className="font-semibold text-[#F5F7FA] truncate">
              {msg.role === 'user' ? 'You' : 'Polyvex Study Assistant'}
            </span>
            {msg.mode && (
              <span className="px-1.5 py-0.5 rounded bg-[#171A1E] text-[#35F2D0] border border-[#262A30] uppercase font-mono text-[10px] shrink-0">
                {msg.mode === 'ai-mode' || msg.mode === 'web-search' ? 'AI Mode' : msg.mode === 'study-materials' ? 'Study Materials' : 'Combined'}
              </span>
            )}
            {msg.courseCode && (
              <span className="font-mono text-[10px] text-[#64748B] shrink-0">
                [{msg.courseCode}]
              </span>
            )}
          </div>
          <span className="shrink-0 pl-2 text-[10px] sm:text-[11px]">{msg.timestamp}</span>
        </div>

        {/* Body Text with Markdown */}
        <PolyvexMarkdown text={msg.text} />

        {/* Citations & Sources Panel */}
        {((msg.materialCitations && msg.materialCitations.length > 0) || (msg.webSources && msg.webSources.length > 0)) && (
          <div className="mt-4 pt-3 border-t border-[#262A30] space-y-2.5 max-w-full overflow-hidden">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A8B3] block font-semibold">
              Referenced Sources & Citations:
            </span>
            <div className="flex flex-wrap gap-2">
              {msg.materialCitations?.map((mat: any, i: number) => (
                <div
                  key={mat.id || i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#101317] border border-[#262A30] text-[11px] text-[#35F2D0] max-w-full"
                >
                  <BookOpen className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-[260px]">{mat.title}</span>
                </div>
              ))}
              {msg.webSources?.map((src: any, i: number) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#101317] border border-[#262A30] text-[11px] text-[#A1A8B3] hover:text-[#35F2D0] hover:border-[#35F2D0]/40 transition max-w-full cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3 shrink-0 text-[#35F2D0]" />
                  <span className="truncate max-w-[180px] sm:max-w-[240px]">{src.title || src.domain || 'Web Source'}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Response Action Toolbar */}
        {msg.role === 'assistant' && (
          <div className="pt-2 flex items-center justify-between border-t border-[#262A30]/50 text-[11px]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleCopy(msg.text, msg.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[#171A1E] text-[#A1A8B3] hover:text-[#35F2D0] transition cursor-pointer"
                title="Copy response"
              >
                {copiedId === msg.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#35F2D0]" />
                    <span className="text-[10px] text-[#35F2D0]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Copy</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleRegenerate(msg)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#171A1E] text-[#A1A8B3] hover:text-[#35F2D0] transition cursor-pointer"
                title="Regenerate response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">Retry</span>
              </button>
              <div className="h-3 w-[1px] bg-[#262A30] mx-0.5" />
              <button
                type="button"
                onClick={() => handleFeedback(msg.id, 'good')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  msg.feedback === 'good' ? 'bg-[#35F2D0]/10 text-[#35F2D0]' : 'text-[#64748B] hover:text-[#A1A8B3]'
                }`}
                title="Good response"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleFeedback(msg.id, 'bad')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  msg.feedback === 'bad' ? 'bg-rose-500/10 text-rose-400' : 'text-[#64748B] hover:text-[#A1A8B3]'
                }`}
                title="Poor response"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleShare(msg)}
                className="p-1.5 rounded-lg hover:bg-[#171A1E] text-[#A1A8B3] hover:text-[#F5F7FA] transition cursor-pointer"
                title="Share response"
              >
                {copiedId === `share-${msg.id}` ? (
                  <Check className="w-3.5 h-3.5 text-[#35F2D0]" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
