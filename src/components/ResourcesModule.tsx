import React, { useState, useMemo } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  Tag,
  BookMarked,
  FileText,
  Video,
  Globe,
  AlertTriangle,
  CheckCircle2,
  X,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { StudyResource, Course, ResourceType, RevisionTopic } from '../types/index.ts';
import { safeCopyToClipboard } from '../utils/revisionPlanner.ts';

interface ResourcesModuleProps {
  resources: StudyResource[];
  courses: Course[];
  topics?: RevisionTopic[];
  onSaveResource: (res: StudyResource) => void;
  onDeleteResource: (id: string) => void;
}

const RESOURCE_TYPES: ResourceType[] = [
  'PDF',
  'lecture note',
  'textbook reference',
  'website',
  'video',
  'past question',
  'personal note',
  'other',
];

export const ResourcesModule: React.FC<ResourcesModuleProps> = ({
  resources,
  courses,
  topics = [],
  onSaveResource,
  onDeleteResource,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Notification feedback state
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRes, setEditingRes] = useState<StudyResource | null>(null);
  const [rawTags, setRawTags] = useState('');
  const [formError, setFormError] = useState('');

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  // Aggregate all unique tags from resources for quick filtering
  const allTags = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => {
      (r.tags || []).forEach((t) => {
        const cleaned = t.trim();
        if (cleaned) set.add(cleaned);
      });
    });
    return Array.from(set).sort();
  }, [resources]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (filterCourse !== 'all' && r.courseId !== filterCourse) return false;
      if (filterType !== 'all' && r.type !== filterType) return false;
      if (filterTag !== 'all') {
        const hasTag = (r.tags || []).some(
          (t) => t.toLowerCase() === filterTag.toLowerCase()
        );
        if (!hasTag) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (r.title || '').toLowerCase().includes(q);
        const matchTopic = (r.topic || '').toLowerCase().includes(q);
        const matchDesc = (r.description || '').toLowerCase().includes(q);
        const matchTags = (r.tags || []).some((t) => t.toLowerCase().includes(q));
        const course = courseMap.get(r.courseId);
        const matchCourse =
          (course?.code || '').toLowerCase().includes(q) ||
          (course?.title || '').toLowerCase().includes(q);
        const matchRef = (r.linkOrRef || '').toLowerCase().includes(q);

        if (!matchTitle && !matchTopic && !matchDesc && !matchTags && !matchCourse && !matchRef) {
          return false;
        }
      }
      return true;
    });
  }, [resources, filterCourse, filterType, filterTag, searchQuery, courseMap]);

  const handleOpenNew = () => {
    setEditingRes({
      id: '',
      title: '',
      courseId: courses[0]?.id || '',
      topic: '',
      type: 'textbook reference',
      linkOrRef: '',
      description: '',
      tags: [],
      dateAdded: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setRawTags('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEdit = (r: StudyResource) => {
    setEditingRes({ ...r });
    setRawTags((r.tags || []).join(', '));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRes) return;
    if (!editingRes.title.trim()) {
      setFormError('Please enter a resource title.');
      return;
    }
    if (!editingRes.linkOrRef.trim()) {
      setFormError('Please enter a web link, local path, or shelf reference.');
      return;
    }

    const parsedTags = rawTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const isExisting = Boolean(editingRes.id);
    const payload: StudyResource = {
      ...editingRes,
      id: editingRes.id || `res-${Date.now().toString(36)}`,
      title: editingRes.title.trim(),
      topic: editingRes.topic?.trim() || undefined,
      linkOrRef: editingRes.linkOrRef.trim(),
      tags: parsedTags,
      dateAdded: editingRes.dateAdded || new Date().toISOString().split('T')[0],
    };

    onSaveResource(payload);
    setIsModalOpen(false);
    setEditingRes(null);
    showToast(
      isExisting
        ? `Resource "${payload.title}" updated successfully.`
        : `Resource "${payload.title}" added to your library.`,
      'success'
    );
  };

  const handleDelete = (res: StudyResource) => {
    if (confirm(`Remove resource "${res.title}" from your library?`)) {
      onDeleteResource(res.id);
      showToast(`Resource "${res.title}" removed.`, 'info');
    }
  };

  const handleCopyLink = (res: StudyResource) => {
    safeCopyToClipboard(res.linkOrRef);
    setCopiedId(res.id);
    showToast('Reference copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isWebUrl = (url: string) => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const hasActiveFilters =
    filterCourse !== 'all' || filterType !== 'all' || filterTag !== 'all' || searchQuery.trim() !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCourse('all');
    setFilterType('all');
    setFilterTag('all');
  };

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'website':
        return <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'past question':
        return <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      default:
        return <BookMarked className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-medium shadow-md transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-stone-50 dark:bg-stone-800/90 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <FolderOpen className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>Academic Resource Library ({resources.length})</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Store, search, and categorize lecture PDFs, textbook links, past questions, and notes by course, topic, and tags.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Study Resource</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by title, topic, course, description, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-emerald-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                aria-label="Clear search text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Course, Tag, & Type Selectors */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Course Filter */}
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-stone-800 dark:text-stone-200 font-medium"
              aria-label="Filter resources by course"
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>

            {/* Tag Filter */}
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-stone-800 dark:text-stone-200 font-medium"
              aria-label="Filter resources by tag"
            >
              <option value="all">All Tags ({allTags.length})</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>

            {/* Resource Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-stone-800 dark:text-stone-200 font-medium"
              aria-label="Filter resources by type"
            >
              <option value="all">All Types</option>
              {RESOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-2.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 transition flex items-center gap-1 cursor-pointer"
                title="Clear all filters"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Tag Pill Bar */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px]">
            <span className="text-stone-400 flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider">
              <Tag className="w-3 h-3" />
              <span>Filter by tag:</span>
            </span>
            <button
              type="button"
              onClick={() => setFilterTag('all')}
              className={`px-2 py-0.5 rounded-full border transition cursor-pointer text-[10px] ${
                filterTag === 'all'
                  ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                  : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-emerald-500'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => {
              const isSelected = filterTag.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFilterTag(isSelected ? 'all' : tag)}
                  className={`px-2 py-0.5 rounded-full border transition cursor-pointer text-[10px] flex items-center gap-1 ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                      : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-emerald-500'
                  }`}
                >
                  <span>#{tag}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Resources Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.length === 0 ? (
          /* Empty State: Zero resources in library */
          <div className="col-span-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center text-xs space-y-4 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <FolderOpen className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                No study resources added.
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Save textbook links, departmental past question drives, lecture PDF notes, and tutorial videos in one central place. Filter by course and tag at examination time.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenNew}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Resource</span>
              </button>
            </div>
          </div>
        ) : filteredResources.length === 0 ? (
          /* Empty State: Filter mismatch */
          <div className="col-span-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center text-xs space-y-3 shadow-xs">
            <Filter className="w-8 h-8 text-stone-400 mx-auto" />
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">
              No matching resources found
            </h3>
            <p className="text-stone-500 dark:text-stone-400 max-w-sm mx-auto text-[11px]">
              No items match your active filters. Try resetting the course, tag, or search keyword.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 px-3.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-medium cursor-pointer transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredResources.map((res) => {
            const course = courseMap.get(res.courseId);
            const isWeb = isWebUrl(res.linkOrRef);
            const isCopied = copiedId === res.id;

            return (
              <div
                key={res.id}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div className="space-y-2.5">
                  {/* Card Header: Course + Type Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-emerald-800 dark:text-emerald-400 font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                      {course?.code || 'GEN'}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center gap-1">
                      {getTypeIcon(res.type)}
                      <span>{res.type}</span>
                    </span>
                  </div>

                  {/* Resource Title */}
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 leading-snug">
                    {res.title}
                  </h3>

                  {/* Associated Topic Badge */}
                  {res.topic && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                      <BookOpen className="w-3 h-3 shrink-0" />
                      <span className="truncate">Topic: {res.topic}</span>
                    </div>
                  )}

                  {/* Link / Shelf Ref */}
                  <div className="bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl font-mono text-[11px] text-stone-700 dark:text-stone-300 break-all flex items-center justify-between gap-2 border border-stone-200/60 dark:border-stone-700/60">
                    <span className="truncate">{res.linkOrRef}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(res)}
                        className="p-1 hover:text-emerald-700 text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition cursor-pointer"
                        title="Copy link / shelf reference"
                        aria-label="Copy link"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      {isWeb && (
                        <a
                          href={res.linkOrRef}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:text-blue-600 text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition"
                          title="Open external link"
                          aria-label="Open external link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {res.description && (
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-2">
                      {res.description}
                    </p>
                  )}

                  {/* Tags */}
                  {(res.tags || []).length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {res.tags.map((tag, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFilterTag(tag)}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 border border-transparent hover:border-emerald-300 dark:hover:border-emerald-800 transition cursor-pointer flex items-center gap-1"
                        >
                          <Tag className="w-2.5 h-2.5 text-stone-400" />
                          <span>{tag}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer: Date & Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-400">
                  <span className="font-mono text-[10px] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    <span>Added {res.dateAdded}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(res)}
                      className="p-1.5 text-stone-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition cursor-pointer"
                      title="Edit resource"
                      aria-label="Edit resource"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(res)}
                      className="p-1.5 text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition cursor-pointer"
                      title="Delete resource"
                      aria-label="Delete resource"
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

      {/* Edit / Create Resource Modal */}
      {isModalOpen && editingRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-xs max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-stone-800">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>{editingRes.id ? 'Edit Study Resource' : 'Add Study Resource'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer p-1"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Resource Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electric Circuits 5th Ed - Alexander & Sadiku"
                  value={editingRes.title}
                  onChange={(e) => setEditingRes({ ...editingRes, title: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Course <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingRes.courseId}
                    onChange={(e) => setEditingRes({ ...editingRes, courseId: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100 font-medium"
                  >
                    {courses.length === 0 ? (
                      <option value="">No courses added yet (Register a course first)</option>
                    ) : (
                      courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Resource Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingRes.type}
                    onChange={(e) => setEditingRes({ ...editingRes, type: e.target.value as ResourceType })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100 font-medium"
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topic Field */}
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Topic or Syllabus Unit
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="revision-topic-options"
                    placeholder="e.g. Kirchhoff's Laws, Carnot Cycle, Bernoulli's Equation"
                    value={editingRes.topic || ''}
                    onChange={(e) => setEditingRes({ ...editingRes, topic: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100"
                  />
                  {topics.length > 0 && (
                    <datalist id="revision-topic-options">
                      {topics
                        .filter((t) => !editingRes.courseId || t.courseId === editingRes.courseId)
                        .map((t) => (
                          <option key={t.id} value={t.title} />
                        ))}
                    </datalist>
                  )}
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Link this resource to a specific study topic for direct access during revision.
                </p>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Link URL or Shelf / File Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="https://... or SEET Library Shelf QA76.73, or /Drive/EEE301/PastQuestions.pdf"
                  value={editingRes.linkOrRef}
                  onChange={(e) => setEditingRes({ ...editingRes, linkOrRef: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Short Description & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Scope, key chapters (e.g. Ch. 4-6 for Mid-Term), or test questions contained..."
                  value={editingRes.description || ''}
                  onChange={(e) => setEditingRes({ ...editingRes, description: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. exam2025, past-questions, solved"
                    value={rawTags}
                    onChange={(e) => setRawTags(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Date Added
                  </label>
                  <input
                    type="date"
                    value={editingRes.dateAdded}
                    onChange={(e) => setEditingRes({ ...editingRes, dateAdded: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer shadow-sm active:scale-95 transition"
                >
                  {editingRes.id ? 'Save Changes' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
