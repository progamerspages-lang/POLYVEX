import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Copy,
  Download,
  Share2,
  FileSpreadsheet,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { AcademicTask, Course, TaskPriority, TaskStatus, TaskType } from '../types/index.ts';
import { calculateDaysRemaining } from '../utils/academicMath.ts';
import { generateIcsCalendar, downloadCalendarFile } from '../utils/icsExport.ts';
import { exportTasksToCsv } from '../utils/storage.ts';

interface TasksModuleProps {
  tasks: AcademicTask[];
  courses: Course[];
  onSaveTask: (task: AcademicTask) => void;
  onDeleteTask: (id: string) => void;
  onDuplicateTask: (task: AcademicTask) => void;
  onToggleStatus: (id: string, newStatus: TaskStatus) => void;
}

const TASK_TYPES: TaskType[] = [
  'Assignment',
  'Take-home test',
  'Quiz',
  'Examination',
  'Practical report',
  'Project',
  'Reading task',
  'Other academic task',
];

export const TasksModule: React.FC<TasksModuleProps> = ({
  tasks,
  courses,
  onSaveTask,
  onDeleteTask,
  onDuplicateTask,
  onToggleStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'created'>('deadline');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AcademicTask | null>(null);
  const [formError, setFormError] = useState('');

  const courseMap = useMemo(() => new Map(courses.map(c => [c.id, c])), [courses]);
  const now = new Date();

  // Filtered & sorted task collection
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesNotes = (task.notes || '').toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        const courseCode = (courseMap.get(task.courseId)?.code || '').toLowerCase();
        if (!matchesTitle && !matchesNotes && !matchesDesc && !courseCode.includes(q)) return false;
      }
      if (filterCourse !== 'all' && task.courseId !== filterCourse) return false;
      if (filterType !== 'all' && task.taskType !== filterType) return false;
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'deadline') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === 'priority') {
        const pOrder: Record<TaskPriority, number> = { High: 3, Medium: 2, Low: 1 };
        return pOrder[b.priority] - pOrder[a.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks, searchQuery, filterCourse, filterType, filterStatus, filterPriority, sortBy, courseMap]);

  const handleOpenNew = () => {
    setEditingTask({
      id: '',
      title: '',
      courseId: courses[0]?.id || '',
      description: '',
      taskType: 'Assignment',
      dateAssigned: new Date().toISOString().split('T')[0],
      dueDate: '',
      dueTime: '23:59',
      priority: 'Medium',
      status: 'Not Started',
      percentComplete: 0,
      notes: '',
      resourceLinks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEdit = (task: AcademicTask) => {
    setEditingTask({ ...task });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!editingTask.title.trim()) {
      setFormError('Please enter a task title.');
      return;
    }
    if (!editingTask.courseId) {
      setFormError('Please select a course.');
      return;
    }

    const payload: AcademicTask = {
      ...editingTask,
      id: editingTask.id || `task-${Date.now().toString(36)}`,
      updatedAt: new Date().toISOString(),
    };

    onSaveTask(payload);
    setIsModalOpen(false);
    setEditingTask(null);
  };

  // Export handlers
  const handleExportIcs = () => {
    const ics = generateIcsCalendar(tasks, [], courses);
    downloadCalendarFile(ics, 'polyvex-deadlines.ics');
  };

  const handleExportCsv = () => {
    const csv = exportTasksToCsv(tasks, courses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polyvex-tasks-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>Academic Task & Deadline Tracker</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Assignments, quizzes, mid-term tests, practical reports, and final examinations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportIcs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium cursor-pointer transition"
            title="Download .ics calendar file"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Export .ics</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium cursor-pointer transition"
            title="Export CSV spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search tasks by title, course, or instructions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-800 dark:text-stone-200"
              aria-label="Filter tasks by course"
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-800 dark:text-stone-200"
              aria-label="Filter tasks by type"
            >
              <option value="all">All Types</option>
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-800 dark:text-stone-200"
              aria-label="Filter tasks by status"
            >
              <option value="all">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted">Submitted</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-800 dark:text-stone-200"
              aria-label="Sort tasks by"
            >
              <option value="deadline">Sort by Deadline</option>
              <option value="priority">Sort by Priority</option>
              <option value="created">Sort by Date Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List Content */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center">
            <CheckSquare className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              {tasks.length === 0 ? 'No upcoming tasks.' : 'No tasks match your criteria'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {tasks.length === 0
                ? 'Create your first assignment, test, or coursework deadline.'
                : 'Adjust your search filters or create a new task.'}
            </p>
            <button
              type="button"
              onClick={handleOpenNew}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Task</span>
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const course = courseMap.get(task.courseId);
            const isCompleted = task.status === 'Completed' || task.status === 'Submitted';
            const deadline = calculateDaysRemaining(task.dueDate, now);

            let statusBadge = 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300';
            if (isCompleted) {
              statusBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
            } else if (deadline.status === 'overdue') {
              statusBadge = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold';
            } else if (deadline.status === 'due-today') {
              statusBadge = 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-bold';
            } else if (deadline.status === 'due-soon') {
              statusBadge = 'bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
            }

            return (
              <div
                key={task.id}
                className={`bg-white dark:bg-stone-900 rounded-xl border p-4 shadow-xs transition hover:border-emerald-600/50 ${
                  isCompleted
                    ? 'border-stone-200 dark:border-stone-800 opacity-75'
                    : deadline.status === 'overdue'
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/15'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Status Checkbox / Toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        onToggleStatus(task.id, isCompleted ? 'In Progress' : 'Completed')
                      }
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition ${
                        isCompleted
                          ? 'bg-emerald-700 border-emerald-700 text-white'
                          : 'border-stone-400 dark:border-stone-600 hover:border-emerald-600'
                      }`}
                      title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                      aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                    >
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-emerald-800 dark:text-emerald-400">
                          {course?.code}
                        </span>
                        <h3
                          className={`text-sm font-semibold ${
                            isCompleted
                              ? 'line-through text-stone-500 dark:text-stone-400'
                              : 'text-stone-900 dark:text-stone-100'
                          }`}
                        >
                          {task.title}
                        </h3>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                          {task.taskType}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            task.priority === 'High'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : task.priority === 'Medium'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                          }`}
                        >
                          {task.priority} Priority
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {task.notes && (
                        <div className="text-[11px] text-stone-500 italic mt-0.5">
                          Note: {task.notes}
                        </div>
                      )}

                      {/* Progress Bar & Sub-meta */}
                      <div className="flex items-center gap-4 text-[11px] text-stone-500 pt-1 flex-wrap">
                        <span>Assigned: {task.dateAssigned}</span>
                        {task.percentComplete !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 rounded-full"
                                style={{ width: `${task.percentComplete}%` }}
                              />
                            </div>
                            <span className="font-mono">{task.percentComplete}%</span>
                          </div>
                        )}
                        <span>Status: <strong className="text-stone-700 dark:text-stone-300">{task.status}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Deadline & Action Buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                    <div className="text-right">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-md ${statusBadge}`}>
                        {isCompleted ? task.status : deadline.label}
                      </span>
                      {task.dueDate && (
                        <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                          {task.dueDate} {task.dueTime || ''}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(task)}
                        className="p-1.5 text-stone-500 hover:text-emerald-700 dark:hover:text-emerald-400 rounded cursor-pointer"
                        title="Edit task"
                        aria-label="Edit task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateTask(task)}
                        className="p-1.5 text-stone-500 hover:text-blue-700 dark:hover:text-blue-400 rounded cursor-pointer"
                        title="Duplicate task"
                        aria-label="Duplicate task"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete task "${task.title}"?`)) {
                            onDeleteTask(task.id);
                          }
                        }}
                        className="p-1.5 text-stone-500 hover:text-rose-600 rounded cursor-pointer"
                        title="Delete task"
                        aria-label="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Edit/Create Modal */}
      {isModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-xs max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">
              {editingTask.id ? 'Edit Academic Task' : 'Add New Academic Task'}
            </h2>

            {formError && (
              <div className="mb-4 p-2.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Assignment 2: Thevenin Equivalent Circuits"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Course <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingTask.courseId}
                    onChange={(e) => setEditingTask({ ...editingTask, courseId: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                    required
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
                    Task Type
                  </label>
                  <select
                    value={editingTask.taskType}
                    onChange={(e) => setEditingTask({ ...editingTask, taskType: e.target.value as TaskType })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                  >
                    {TASK_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editingTask.dueDate || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={editingTask.dueTime || '23:59'}
                    onChange={(e) => setEditingTask({ ...editingTask, dueTime: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Priority
                  </label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as TaskPriority })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Status
                  </label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    % Progress
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingTask.percentComplete ?? 0}
                    onChange={(e) => setEditingTask({ ...editingTask, percentComplete: Number(e.target.value) })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Description & Submission Guidelines
                </label>
                <textarea
                  rows={3}
                  placeholder="Problem numbers, group partner names, submission email, or special format..."
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Private Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Check Appendix B for formula table"
                  value={editingTask.notes || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer shadow-sm"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
