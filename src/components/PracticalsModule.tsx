import React, { useState } from 'react';
import {
  FlaskConical,
  Plus,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  ArrowRight,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { Course, PracticalSession, ReportDraft, ReportStatus } from '../types/index.ts';
import { calculateDaysRemaining } from '../utils/academicMath.ts';

interface PracticalsModuleProps {
  practicals: PracticalSession[];
  courses: Course[];
  reports: ReportDraft[];
  onSavePractical: (practical: PracticalSession) => void;
  onDeletePractical: (id: string) => void;
  onOpenReportDraft: (reportId?: string, practicalId?: string, courseId?: string, experimentTitle?: string) => void;
}

export const PracticalsModule: React.FC<PracticalsModuleProps> = ({
  practicals,
  courses,
  reports,
  onSavePractical,
  onDeletePractical,
  onOpenReportDraft,
}) => {
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPractical, setEditingPractical] = useState<PracticalSession | null>(null);
  const [formError, setFormError] = useState('');

  const courseMap = new Map(courses.map(c => [c.id, c]));
  const reportMap = new Map(reports.map(r => [r.id, r]));
  const now = new Date();

  const filteredPracticals = practicals.filter((p) => {
    if (filterCourse !== 'all' && p.courseId !== filterCourse) return false;
    if (filterStatus !== 'all' && p.reportStatus !== filterStatus) return false;
    return true;
  });

  const handleOpenNew = () => {
    setEditingPractical({
      id: '',
      courseId: courses[0]?.id || '',
      experimentTitle: '',
      practicalDate: new Date().toISOString().split('T')[0],
      reportDeadline: '',
      reportStatus: 'Not Started',
      experimentNotes: '',
      apparatus: '',
      measurementsNotes: '',
      relatedResources: [],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEdit = (p: PracticalSession) => {
    setEditingPractical({ ...p });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPractical) return;
    if (!editingPractical.experimentTitle.trim()) {
      setFormError('Please enter the experiment title.');
      return;
    }
    if (!editingPractical.courseId) {
      setFormError('Please select a course.');
      return;
    }

    const payload: PracticalSession = {
      ...editingPractical,
      id: editingPractical.id || `prac-${Date.now().toString(36)}`,
    };

    onSavePractical(payload);
    setIsModalOpen(false);
    setEditingPractical(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-700 dark:text-purple-400" />
            <span>Practical & Laboratory Organizer</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Track lab sessions, apparatus notes, raw data observations, and formal lab reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenReportDraft()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 text-xs font-semibold cursor-pointer hover:bg-purple-100 transition"
          >
            <FileText className="w-4 h-4" />
            <span>New Blank Report</span>
          </button>
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Practical Session</span>
          </button>
        </div>
      </div>

      {/* Academic Integrity Notice Card */}
      <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-800/60 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <strong className="font-semibold block">Academic Integrity & Scientific Accuracy:</strong>
          <span>
            Polyvex helps organize laboratory writing, structure 19-section reports, and check calculations.
            The system strictly refuses to fabricate experimental readings, meter observations, or lecturer results.
            All measurements must be student-recorded.
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 text-xs bg-stone-50 dark:bg-stone-900/50 p-3 rounded-lg border border-stone-200 dark:border-stone-800">
        <span className="font-semibold text-stone-600 dark:text-stone-400">Filter Practicals:</span>
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md px-2.5 py-1 text-stone-800 dark:text-stone-200"
          aria-label="Filter practicals by course"
        >
          <option value="all">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md px-2.5 py-1 text-stone-800 dark:text-stone-200"
          aria-label="Filter practicals by report status"
        >
          <option value="all">All Report Statuses</option>
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Ready for Review">Ready for Review</option>
          <option value="Submitted">Submitted</option>
        </select>
      </div>

      {/* Practicals List */}
      <div className="space-y-4">
        {filteredPracticals.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center text-xs">
            <FlaskConical className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              {practicals.length === 0 ? 'No practical reports yet.' : 'No practical records match your filter.'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {practicals.length === 0
                ? 'Record your laboratory experiments, observations, and structured reports.'
                : 'Adjust your course or status filter.'}
            </p>
            <button
              type="button"
              onClick={handleOpenNew}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium cursor-pointer transition shadow-sm"
            >
              Add First Practical Session
            </button>
          </div>
        ) : (
          filteredPracticals.map((prac) => {
            const course = courseMap.get(prac.courseId);
            const reportDraft = prac.reportDraftId ? reportMap.get(prac.reportDraftId) : null;
            const deadline = calculateDaysRemaining(prac.reportDeadline, now);

            return (
              <div
                key={prac.id}
                className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: course?.color || '#00674f' }}
                    />
                    <span className="font-bold text-sm text-purple-700 dark:text-purple-400 font-mono">
                      {course?.code}
                    </span>
                    <span className="text-xs text-stone-500">•</span>
                    <span className="text-xs text-stone-500">
                      Practical Date: <strong className="text-stone-800 dark:text-stone-200 font-mono">{prac.practicalDate}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-medium">
                      Report: {prac.reportStatus}
                    </span>
                    {prac.reportDeadline && (
                      <span className="text-xs font-mono text-stone-500">
                        Due: {deadline.label}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-base text-stone-900 dark:text-stone-100">
                    {prac.experimentTitle}
                  </h3>
                </div>

                {/* Apparatus & Observations details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {prac.apparatus && (
                    <div className="bg-stone-50 dark:bg-stone-800/40 p-3 rounded-lg border border-stone-200/60 dark:border-stone-800">
                      <strong className="text-stone-700 dark:text-stone-300 block mb-1">
                        Apparatus & Materials:
                      </strong>
                      <p className="text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-line">
                        {prac.apparatus}
                      </p>
                    </div>
                  )}

                  {prac.measurementsNotes && (
                    <div className="bg-stone-50 dark:bg-stone-800/40 p-3 rounded-lg border border-stone-200/60 dark:border-stone-800">
                      <strong className="text-stone-700 dark:text-stone-300 block mb-1">
                        Measurements & Raw Observations:
                      </strong>
                      <p className="text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-line">
                        {prac.measurementsNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
                  <div className="flex items-center gap-2 text-stone-500">
                    {reportDraft ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Report Draft Linked ({reportDraft.readingsTable?.length || 0} readings saved)</span>
                      </span>
                    ) : (
                      <span className="italic">No formal report draft created yet.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenReportDraft(
                          prac.reportDraftId,
                          prac.id,
                          prac.courseId,
                          prac.experimentTitle
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold cursor-pointer shadow-xs transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{reportDraft ? 'Open Report Editor' : 'Generate 19-Section Report Draft'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEdit(prac)}
                      className="p-1.5 text-stone-500 hover:text-emerald-700 rounded cursor-pointer"
                      title="Edit practical details"
                      aria-label="Edit practical details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete practical "${prac.experimentTitle}"?`)) {
                          onDeletePractical(prac.id);
                        }
                      }}
                      className="p-1.5 text-stone-500 hover:text-rose-600 rounded cursor-pointer"
                      title="Delete practical"
                      aria-label="Delete practical"
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

      {/* Practical Session Edit/Create Modal */}
      {isModalOpen && editingPractical && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-xs max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">
              {editingPractical.id ? 'Edit Practical Session' : 'Record Laboratory Practical Session'}
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
                  Experiment Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verification of Ohm’s Law and Determination of Unknown Resistance"
                  value={editingPractical.experimentTitle}
                  onChange={(e) => setEditingPractical({ ...editingPractical, experimentTitle: e.target.value })}
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
                    value={editingPractical.courseId}
                    onChange={(e) => setEditingPractical({ ...editingPractical, courseId: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                    required
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
                    Report Status
                  </label>
                  <select
                    value={editingPractical.reportStatus}
                    onChange={(e) => setEditingPractical({ ...editingPractical, reportStatus: e.target.value as ReportStatus })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Ready for Review">Ready for Review</option>
                    <option value="Submitted">Submitted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Practical Session Date
                  </label>
                  <input
                    type="date"
                    value={editingPractical.practicalDate}
                    onChange={(e) => setEditingPractical({ ...editingPractical, practicalDate: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                    Report Submission Deadline
                  </label>
                  <input
                    type="date"
                    value={editingPractical.reportDeadline || ''}
                    onChange={(e) => setEditingPractical({ ...editingPractical, reportDeadline: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Apparatus and Materials Used
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. DC Power supply, Voltmeter, Ammeter, Constantan wire, Rheostat, Key switch"
                  value={editingPractical.apparatus || ''}
                  onChange={(e) => setEditingPractical({ ...editingPractical, apparatus: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Measurements, Readings & Observation Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Record your actual meter readings or observations here (e.g. V = 1.0V -> I = 0.048A)..."
                  value={editingPractical.measurementsNotes || ''}
                  onChange={(e) => setEditingPractical({ ...editingPractical, measurementsNotes: e.target.value })}
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
                  Save Practical
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
