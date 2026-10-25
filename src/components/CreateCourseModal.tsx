import React, { useState } from 'react';
import { X, BookOpen, AlertCircle } from 'lucide-react';
import { Course } from '../types/index.ts';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Course) => void;
  existingCourseCount?: number;
  defaultSemester?: 'Harmattan / First' | 'Rain / Second' | 'Both';
  defaultDepartment?: string;
}

const PALETTE = [
  '#35F2D0', // Polyvex cyan
  '#00AFC8', // Teal
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#6366F1', // Indigo
];

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCourseCount = 0,
  defaultSemester = 'Harmattan / First',
  defaultDepartment = '',
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [creditUnits, setCreditUnits] = useState(3);
  const [semester, setSemester] = useState<'Harmattan / First' | 'Rain / Second' | 'Both'>(defaultSemester);
  const [department, setDepartment] = useState(defaultDepartment);
  const [lecturer, setLecturer] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(PALETTE[existingCourseCount % PALETTE.length]);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setFormError('Please enter a course code (e.g. PHY 201 or MTH 101).');
      return;
    }
    if (!title.trim()) {
      setFormError('Please enter a course title.');
      return;
    }

    const newCourse: Course = {
      id: `c-${Date.now().toString(36)}`,
      code: code.toUpperCase().trim(),
      title: title.trim(),
      creditUnits: Math.max(1, Number(creditUnits) || 3),
      semester,
      department: department.trim(),
      lecturer: lecturer.trim(),
      notes: notes.trim(),
      color,
    };

    onSave(newCourse);
    onClose();
    // Reset form
    setCode('');
    setTitle('');
    setCreditUnits(3);
    setLecturer('');
    setNotes('');
    setFormError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-[#171A1E] text-[#F5F7FA] rounded-2xl max-w-md w-full border border-[#262A30] shadow-2xl p-6 text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#262A30] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#090B0D] text-[#35F2D0] border border-[#262A30]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F5F7FA]">Add Academic Course</h2>
              <p className="text-[11px] text-[#A1A8B3]">Register a course for timetables, tasks, and AI study materials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#A1A8B3] hover:text-[#F5F7FA] hover:bg-[#20252C] transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[#A1A8B3] font-semibold mb-1">
                Course Code <span className="text-[#35F2D0]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. PHY 201"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-[#090B0D] border border-[#262A30] focus:border-[#35F2D0] rounded-xl p-2.5 text-[#F5F7FA] font-mono uppercase tracking-wider text-sm transition outline-none"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-[#A1A8B3] font-semibold mb-1">
                Credit Units
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={creditUnits}
                onChange={(e) => setCreditUnits(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#090B0D] border border-[#262A30] focus:border-[#35F2D0] rounded-xl p-2.5 text-[#F5F7FA] font-mono text-sm transition outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[#A1A8B3] font-semibold mb-1">
              Course Title <span className="text-[#35F2D0]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. General Physics II (Electricity & Magnetism)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#090B0D] border border-[#262A30] focus:border-[#35F2D0] rounded-xl p-2.5 text-[#F5F7FA] text-sm transition outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A1A8B3] font-semibold mb-1">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as any)}
                className="w-full bg-[#090B0D] border border-[#262A30] focus:border-[#35F2D0] rounded-xl p-2.5 text-[#F5F7FA] text-xs transition outline-none"
              >
                <option value="Harmattan / First">Harmattan / First</option>
                <option value="Rain / Second">Rain / Second</option>
                <option value="Both">Both</option>
              </select>
            </div>

            <div>
              <label className="block text-[#A1A8B3] font-semibold mb-1">
                Course Color
              </label>
              <div className="flex items-center gap-1.5 pt-1.5">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full cursor-pointer transition ${
                      color === c ? 'ring-2 ring-offset-2 ring-offset-[#171A1E] ring-[#35F2D0] scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#A1A8B3] font-semibold mb-1">
              Lecturer (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Prof. N. A. Okonkwo"
              value={lecturer}
              onChange={(e) => setLecturer(e.target.value)}
              className="w-full bg-[#090B0D] border border-[#262A30] focus:border-[#35F2D0] rounded-xl p-2 text-[#F5F7FA] text-xs transition outline-none"
            />
          </div>

          <div>
            <label className="block text-[#A1A8B3] font-semibold mb-1">
              Department / Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Syllabus focus, textbook references, lab expectations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#090B0D] border border-[#262A30] focus:border-[#35F2D0] rounded-xl p-2 text-[#F5F7FA] text-xs transition outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262A30]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#262A30] text-[#A1A8B3] hover:text-[#F5F7FA] hover:bg-[#20252C] cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#35F2D0] hover:bg-[#35F2D0]/90 text-[#090B0D] font-bold cursor-pointer shadow-[0_0_12px_rgba(53,242,208,0.25)] transition active:scale-95"
            >
              Save Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
