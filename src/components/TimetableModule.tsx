import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Filter,
  Copy,
  Trash2,
  Edit2,
  CalendarOff,
  Check,
  ChevronLeft,
  ChevronRight,
  List,
  Columns
} from 'lucide-react';
import { Course, TimetableEntry, DayOfWeek, ActivityType } from '../types/index.ts';
import { detectTimetableConflicts, isValidTimeInterval } from '../utils/academicMath.ts';

interface TimetableModuleProps {
  timetable: TimetableEntry[];
  courses: Course[];
  onSaveEntry: (entry: TimetableEntry) => void;
  onDeleteEntry: (id: string) => void;
  onDuplicateEntry: (entry: TimetableEntry) => void;
  onToggleCancelledDate: (entryId: string, dateStr: string) => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TimetableModule: React.FC<TimetableModuleProps> = ({
  timetable,
  courses,
  onSaveEntry,
  onDeleteEntry,
  onDuplicateEntry,
  onToggleCancelledDate,
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'list'>('week');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterActivity, setFilterActivity] = useState<string>('all');

  // Modal / Form state
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string>('');

  const courseMap = new Map(courses.map(c => [c.id, c]));
  const conflictsMap = detectTimetableConflicts(timetable);

  // Filter entries
  const filteredEntries = timetable.filter(entry => {
    if (filterCourse !== 'all' && entry.courseId !== filterCourse) return false;
    if (filterActivity !== 'all' && entry.activityType !== filterActivity) return false;
    return true;
  });

  // Today helper
  const now = new Date();
  const todayDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()] as DayOfWeek;
  const todayDateStr = now.toISOString().split('T')[0];

  // Form handlers
  const handleOpenNew = (day: DayOfWeek = selectedDay) => {
    setEditingEntry({
      id: '',
      courseId: courses[0]?.id || '',
      dayOfWeek: day,
      startTime: '08:00',
      endTime: '10:00',
      venue: '',
      activityType: 'lecture',
      lecturer: '',
      notes: '',
      recurring: true,
      cancelledDates: [],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEdit = (entry: TimetableEntry) => {
    setEditingEntry({ ...entry });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    if (!editingEntry.courseId) {
      setFormError('Please select a course.');
      return;
    }
    if (!editingEntry.venue.trim()) {
      setFormError('Please provide a lecture venue or hall.');
      return;
    }
    if (!isValidTimeInterval(editingEntry.startTime, editingEntry.endTime)) {
      setFormError('End time must occur strictly after start time.');
      return;
    }

    const payload: TimetableEntry = {
      ...editingEntry,
      id: editingEntry.id || `tt-${Date.now().toString(36)}`,
    };

    onSaveEntry(payload);
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>Lecture Timetable</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Organize lectures, tutorials, and laboratories. Conflict detection active.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition ${
                viewMode === 'week' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              Week Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition ${
                viewMode === 'day' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              Day View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition ${
                viewMode === 'list' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              List View
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenNew()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 flex-wrap text-xs bg-stone-50 dark:bg-stone-900/50 p-3 rounded-lg border border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400 font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md px-2.5 py-1 text-stone-800 dark:text-stone-200"
          aria-label="Filter timetable by course"
        >
          <option value="all">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>

        <select
          value={filterActivity}
          onChange={(e) => setFilterActivity(e.target.value)}
          className="bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md px-2.5 py-1 text-stone-800 dark:text-stone-200"
          aria-label="Filter timetable by activity type"
        >
          <option value="all">All Activities</option>
          <option value="lecture">Lecture</option>
          <option value="tutorial">Tutorial</option>
          <option value="laboratory">Laboratory</option>
          <option value="workshop">Workshop</option>
          <option value="seminar">Seminar</option>
          <option value="other">Other</option>
        </select>

        {conflictsMap.size > 0 && (
          <div className="ml-auto flex items-center gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-300/40">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{conflictsMap.size} time overlapping warning(s) detected</span>
          </div>
        )}
      </div>

      {/* VIEW 1: WEEK GRID VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {DAYS.map((day) => {
            const dayEntries = filteredEntries
              .filter((e) => e.dayOfWeek === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            const isToday = day === todayDayName;

            return (
              <div
                key={day}
                className={`bg-white dark:bg-stone-900 rounded-xl border flex flex-col min-h-[380px] shadow-xs ${
                  isToday
                    ? 'border-emerald-600/70 ring-1 ring-emerald-500/30'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`p-3 border-b flex items-center justify-between rounded-t-xl ${
                    isToday
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
                      : 'bg-stone-50/70 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">{day}</span>
                    {isToday && (
                      <span className="ml-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                        Today
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenNew(day)}
                    className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                    title={`Add class to ${day}`}
                    aria-label={`Add class to ${day}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Entries List */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                  {dayEntries.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center p-3 text-stone-400 text-xs">
                      No classes
                    </div>
                  ) : (
                    dayEntries.map((entry) => {
                      const course = courseMap.get(entry.courseId);
                      const hasConflict = conflictsMap.has(entry.id);
                      const isCancelledToday = entry.cancelledDates?.includes(todayDateStr);

                      return (
                        <div
                          key={entry.id}
                          className={`p-2.5 rounded-lg border text-xs transition relative group ${
                            hasConflict
                              ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20'
                              : isCancelledToday
                              ? 'border-stone-200 bg-stone-100/60 dark:bg-stone-800/40 opacity-60'
                              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/60 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: course?.color || '#00674f' }}
                              />
                              <span className="font-bold text-stone-900 dark:text-stone-100">
                                {course?.code || 'Course'}
                              </span>
                            </div>
                            <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                              {entry.activityType}
                            </span>
                          </div>

                          <div className="font-mono text-emerald-800 dark:text-emerald-400 text-[11px] font-medium mt-1">
                            {entry.startTime} – {entry.endTime}
                          </div>

                          <div className="text-[11px] text-stone-600 dark:text-stone-400 flex items-center gap-1 mt-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0 text-stone-400" />
                            <span className="truncate">{entry.venue}</span>
                          </div>

                          {entry.lecturer && (
                            <div className="text-[11px] text-stone-500 truncate flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3 shrink-0 text-stone-400" />
                              <span className="truncate">{entry.lecturer}</span>
                            </div>
                          )}

                          {hasConflict && (
                            <div className="mt-1.5 text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1 font-medium">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>Overlaps another class!</span>
                            </div>
                          )}

                          {/* Quick Action Buttons */}
                          <div className="mt-2 pt-1.5 border-t border-stone-100 dark:border-stone-700/60 flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(entry)}
                              className="p-1 text-stone-500 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                              title="Edit class"
                              aria-label="Edit class"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDuplicateEntry(entry)}
                              className="p-1 text-stone-500 hover:text-blue-700 dark:hover:text-blue-400 cursor-pointer"
                              title="Duplicate entry"
                              aria-label="Duplicate entry"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteEntry(entry.id)}
                              className="p-1 text-stone-500 hover:text-rose-600 cursor-pointer"
                              title="Delete entry"
                              aria-label="Delete entry"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2">
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDay(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                    selectedDay === d
                      ? 'bg-emerald-800 text-white font-semibold'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleOpenNew(selectedDay)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to {selectedDay}</span>
            </button>
          </div>

          <div className="space-y-3">
            {filteredEntries.filter((e) => e.dayOfWeek === selectedDay).length === 0 ? (
              <p className="text-center py-10 text-stone-400 text-xs">No lectures scheduled for {selectedDay}.</p>
            ) : (
              filteredEntries
                .filter((e) => e.dayOfWeek === selectedDay)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((entry) => {
                  const course = courseMap.get(entry.courseId);
                  const hasConflict = conflictsMap.has(entry.id);
                  return (
                    <div
                      key={entry.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        hasConflict
                          ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-3 h-12 rounded-full shrink-0 mt-0.5"
                          style={{ backgroundColor: course?.color || '#00674f' }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-stone-900 dark:text-stone-100">
                              {course?.code}
                            </span>
                            <span className="text-xs text-stone-600 dark:text-stone-400">{course?.title}</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200">
                              {entry.activityType}
                            </span>
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-4 flex-wrap">
                            <span className="font-mono text-emerald-800 dark:text-emerald-400 font-semibold">
                              {entry.startTime} – {entry.endTime}
                            </span>
                            <span>•</span>
                            <span>Venue: {entry.venue}</span>
                            {entry.lecturer && (
                              <>
                                <span>•</span>
                                <span>Lecturer: {entry.lecturer}</span>
                              </>
                            )}
                          </div>
                          {entry.notes && (
                            <div className="text-xs text-stone-500 italic mt-1">Note: {entry.notes}</div>
                          )}
                          {hasConflict && (
                            <div className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Overlaps with another class! Check your start/end times.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleEdit(entry)}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDuplicateEntry(entry)}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEntry(entry.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-medium cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: FULL LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400">
              <tr>
                <th className="p-3">Day</th>
                <th className="p-3">Time</th>
                <th className="p-3">Course</th>
                <th className="p-3">Type</th>
                <th className="p-3">Venue</th>
                <th className="p-3">Lecturer</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-500 dark:text-stone-400">
                    <p className="font-medium text-sm">No classes scheduled.</p>
                    <button
                      type="button"
                      onClick={() => handleOpenNew()}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Class</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const course = courseMap.get(entry.courseId);
                const hasConflict = conflictsMap.has(entry.id);
                return (
                  <tr
                    key={entry.id}
                    className={`hover:bg-stone-50 dark:hover:bg-stone-800/40 ${
                      hasConflict ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="p-3 font-semibold text-stone-900 dark:text-stone-100">{entry.dayOfWeek}</td>
                    <td className="p-3 font-mono font-medium text-emerald-800 dark:text-emerald-400">
                      {entry.startTime} – {entry.endTime}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-stone-900 dark:text-stone-100">{course?.code}</span>{' '}
                      <span className="text-stone-500">{course?.title}</span>
                    </td>
                    <td className="p-3 uppercase text-[10px] font-mono">{entry.activityType}</td>
                    <td className="p-3">{entry.venue}</td>
                    <td className="p-3 text-stone-500">{entry.lecturer || '—'}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(entry)}
                          className="text-stone-600 dark:text-stone-400 hover:text-emerald-700 p-1 cursor-pointer"
                          aria-label="Edit class"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEntry(entry.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          aria-label="Delete class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit / Create Class Modal */}
      {isModalOpen && editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-xs">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">
              {editingEntry.id ? 'Edit Timetable Entry' : 'Add Class to Timetable'}
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
                  Course <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editingEntry.courseId}
                  onChange={(e) => setEditingEntry({ ...editingEntry, courseId: e.target.value })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Day of the Week <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingEntry.dayOfWeek}
                    onChange={(e) => setEditingEntry({ ...editingEntry, dayOfWeek: e.target.value as DayOfWeek })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Activity Type
                  </label>
                  <select
                    value={editingEntry.activityType}
                    onChange={(e) => setEditingEntry({ ...editingEntry, activityType: e.target.value as ActivityType })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                  >
                    <option value="lecture">Lecture</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={editingEntry.startTime}
                    onChange={(e) => setEditingEntry({ ...editingEntry, startTime: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    End Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={editingEntry.endTime}
                    onChange={(e) => setEditingEntry({ ...editingEntry, endTime: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Venue / Lecture Hall <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. SEET Lecture Theatre (LT 1)"
                  value={editingEntry.venue}
                  onChange={(e) => setEditingEntry({ ...editingEntry, venue: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Lecturer (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engr. Dr. O. N. Eze"
                  value={editingEntry.lecturer || ''}
                  onChange={(e) => setEditingEntry({ ...editingEntry, lecturer: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Notes / Syllabus Pointer (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions, textbooks, or recurring room changes..."
                  value={editingEntry.notes || ''}
                  onChange={(e) => setEditingEntry({ ...editingEntry, notes: e.target.value })}
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
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
