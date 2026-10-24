import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  Calendar,
  CheckSquare,
  FlaskConical,
  Brain,
  AlertTriangle
} from 'lucide-react';
import { Course, AppDatabase } from '../types/index.ts';

interface CoursesModuleProps {
  db: AppDatabase;
  onSaveCourse: (course: Course) => void;
  onDeleteCourse: (id: string) => void;
}

const PALETTE = [
  '#00674f', // FUTO Forest Teal
  '#1e40af', // Blue
  '#7c3aed', // Purple
  '#b45309', // Amber
  '#be185d', // Rose
  '#0e7490', // Cyan
  '#4338ca', // Indigo
  '#15803d', // Green
];

export const CoursesModule: React.FC<CoursesModuleProps> = ({
  db,
  onSaveCourse,
  onDeleteCourse,
}) => {
  const { courses, timetable, tasks, practicals, topics } = db;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formError, setFormError] = useState('');

  const totalCreditUnits = courses.reduce((acc, c) => acc + (c.creditUnits || 0), 0);

  const handleOpenNew = () => {
    setEditingCourse({
      id: '',
      code: '',
      title: '',
      creditUnits: 3,
      department: db.profile.department,
      semester: db.profile.semester || 'Harmattan / First',
      lecturer: '',
      notes: '',
      color: PALETTE[courses.length % PALETTE.length],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse({ ...course });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    if (!editingCourse.code.trim()) {
      setFormError('Please enter a course code (e.g. EEE 311 or MTH 101).');
      return;
    }
    if (!editingCourse.title.trim()) {
      setFormError('Please enter a course title.');
      return;
    }

    const payload: Course = {
      ...editingCourse,
      id: editingCourse.id || `c-${Date.now().toString(36)}`,
      code: editingCourse.code.toUpperCase().trim(),
    };

    onSaveCourse(payload);
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>Registered Courses ({courses.length})</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Total Academic Load: <strong className="font-mono text-emerald-700 dark:text-emerald-400">{totalCreditUnits} Credit Units</strong> • {db.profile.semester}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Course</span>
        </button>
      </div>

      {/* Courses Grid or Empty State */}
      {courses.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            No courses added yet.
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
            Add your semester courses to begin scheduling lectures, tracking assignments, and preparing lab reports.
          </p>
          <button
            type="button"
            onClick={handleOpenNew}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Course</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const courseClasses = timetable.filter((t) => t.courseId === course.id);
          const courseTasks = tasks.filter((t) => t.courseId === course.id);
          const coursePracticals = practicals.filter((p) => p.courseId === course.id);
          const courseTopics = topics.filter((t) => t.courseId === course.id);

          return (
            <div
              key={course.id}
              className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-md shrink-0 shadow-xs"
                      style={{ backgroundColor: course.color }}
                    />
                    <span className="font-bold text-base text-stone-900 dark:text-stone-100 font-mono">
                      {course.code}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold font-mono bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded">
                    {course.creditUnits} CU
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-stone-800 dark:text-stone-200 mt-2 line-clamp-1">
                  {course.title}
                </h3>

                {course.lecturer && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 truncate">
                    Lecturer: {course.lecturer}
                  </p>
                )}

                {course.notes && (
                  <p className="text-xs text-stone-500 italic mt-2 line-clamp-2 bg-stone-50 dark:bg-stone-800/40 p-2 rounded-lg">
                    {course.notes}
                  </p>
                )}

                {/* Course Connected Modules Summary */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-center">
                  <div className="bg-stone-50 dark:bg-stone-800/50 p-1.5 rounded-lg">
                    <div className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div className="font-mono text-xs font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                      {courseClasses.length}
                    </div>
                    <div className="text-[9px] text-stone-400">Classes</div>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-800/50 p-1.5 rounded-lg">
                    <div className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
                      <CheckSquare className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="font-mono text-xs font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                      {courseTasks.length}
                    </div>
                    <div className="text-[9px] text-stone-400">Tasks</div>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-800/50 p-1.5 rounded-lg">
                    <div className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
                      <FlaskConical className="w-3 h-3 text-purple-600" />
                    </div>
                    <div className="font-mono text-xs font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                      {coursePracticals.length}
                    </div>
                    <div className="text-[9px] text-stone-400">Labs</div>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-800/50 p-1.5 rounded-lg">
                    <div className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
                      <Brain className="w-3 h-3 text-amber-600" />
                    </div>
                    <div className="font-mono text-xs font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                      {courseTopics.length}
                    </div>
                    <div className="text-[9px] text-stone-400">Topics</div>
                  </div>
                </div>
              </div>

              {/* Course Bottom Action Bar */}
              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleEdit(course)}
                  className="px-2.5 py-1 rounded-md text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remove course ${course.code}? Existing tasks and timetable entries will be retained.`)) {
                      onDeleteCourse(course.id);
                    }
                  }}
                  className="px-2.5 py-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Edit / Create Course Modal */}
      {isModalOpen && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-xs max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">
              {editingCourse.id ? 'Edit Course' : 'Register New Course'}
            </h2>

            {formError && (
              <div className="mb-4 p-2.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Course Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EEE 311"
                    value={editingCourse.code}
                    onChange={(e) => setEditingCourse({ ...editingCourse, code: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono font-bold uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Credit Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={editingCourse.creditUnits}
                    onChange={(e) => setEditingCourse({ ...editingCourse, creditUnits: Number(e.target.value) })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Course Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electric Circuit Theory I"
                  value={editingCourse.title}
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Semester
                  </label>
                  <select
                    value={editingCourse.semester}
                    onChange={(e) => setEditingCourse({ ...editingCourse, semester: e.target.value as any })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                  >
                    <option value="Harmattan / First">Harmattan / First</option>
                    <option value="Rain / Second">Rain / Second</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Course Color
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditingCourse({ ...editingCourse, color: c })}
                        className={`w-6 h-6 rounded-full cursor-pointer transition ${
                          editingCourse.color === c ? 'ring-2 ring-offset-2 ring-emerald-600 scale-110' : ''
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Select color ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Course Lecturer (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engr. Dr. O. N. Eze"
                  value={editingCourse.lecturer || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, lecturer: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Department / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Syllabus focus, textbook references, departmental notes..."
                  value={editingCourse.notes || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, notes: e.target.value })}
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
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
