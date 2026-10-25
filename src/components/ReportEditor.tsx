import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  Save,
  Eye,
  Edit3,
  Plus,
  Trash2,
  Calculator,
  ShieldAlert,
  ChevronDown,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { ReportDraft, Course, PracticalSession, StudentProfile } from '../types/index.ts';
import { checkOhmLawCalculations } from '../utils/academicMath.ts';

interface ReportEditorProps {
  initialReport?: ReportDraft | null;
  courses: Course[];
  practicals: PracticalSession[];
  profile: StudentProfile;
  onSaveReport: (report: ReportDraft) => void;
  onBackToPracticals?: () => void;
}

export const ReportEditor: React.FC<ReportEditorProps> = ({
  initialReport,
  courses,
  practicals,
  profile,
  onSaveReport,
  onBackToPracticals,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Electrical engineering calculation checker state
  const [calcV, setCalcV] = useState<string>('5.0');
  const [calcI, setCalcI] = useState<string>('0.245');
  const [calcR, setCalcR] = useState<string>('20.41');
  const [calcResult, setCalcResult] = useState<string>('');

  // Draft state initialized
  const [draft, setDraft] = useState<ReportDraft>(() => {
    if (initialReport) return { ...initialReport };
    return {
      id: `rep-${Date.now().toString(36)}`,
      courseId: courses[0]?.id || '',
      experimentTitle: 'Verification of Ohm’s Law and Determination of Unknown Resistance',
      experimentDate: new Date().toISOString().split('T')[0],
      submissionDate: new Date().toISOString().split('T')[0],
      aim: 'To verify Ohm’s Law by determining the linear relationship between potential difference and current.',
      objectives: '1. To measure current I across a metallic conductor at incrementing voltage values.\n2. To plot a graph of V against I and deduce experimental resistance from the slope.\n3. To compare the experimental slope with the rated nominal resistance.',
      apparatus: '1. Regulated DC Power Supply (0-15V)\n2. Digital Multimeter (Voltmeter)\n3. Digital Multimeter (Ammeter)\n4. Constantan Wire Resistor Spool\n5. Connecting Leads & Knife Switch\n6. Variable Rheostat',
      theory: 'Ohm’s Law states that at constant temperature, the current (I) through a conductor is directly proportional to the potential difference (V) across its ends: V = I × R. The slope of the V-I plot gives the resistance R = ΔV / ΔI.',
      diagramNotes: 'Circuit consists of DC source in series with key switch, rheostat, ammeter, and test resistor. Voltmeter is connected in parallel across the test resistor.',
      procedure: '1. Connected the circuit components in series with the key open.\n2. Placed the voltmeter across the unknown resistor in parallel.\n3. Closed the key and adjusted the power supply in increments of 1.0 V from 1.0 V to 6.0 V.\n4. Recorded corresponding ammeter current readings.\n5. Opened the switch between readings to prevent conductor heating.',
      observations: 'Current increased in direct proportion with voltage. Conductor remained at ambient temperature without heating.',
      readingsTable: [
        { sn: 1, voltage: '1.00', current: '0.048', resistance: '20.83', computedPower: '0.048', notes: 'Reading 1' },
        { sn: 2, voltage: '2.00', current: '0.098', resistance: '20.41', computedPower: '0.196', notes: 'Reading 2' },
        { sn: 3, voltage: '3.00', current: '0.147', resistance: '20.41', computedPower: '0.441', notes: 'Reading 3' },
        { sn: 4, voltage: '4.00', current: '0.196', resistance: '20.41', computedPower: '0.784', notes: 'Reading 4' },
        { sn: 5, voltage: '5.00', current: '0.245', resistance: '20.41', computedPower: '1.225', notes: 'Reading 5' },
        { sn: 6, voltage: '6.00', current: '0.294', resistance: '20.41', computedPower: '1.764', notes: 'Reading 6' },
      ],
      calculations: 'Slope of V-I graph = (6.00 - 1.00) / (0.294 - 0.048) = 5.00 / 0.246 = 20.33 Ω.\nNominal value: 20.0 Ω. Percentage error: |20.33 - 20.0| / 20.0 × 100% = 1.65%.',
      discussion: 'The linear graph passing through the origin proves the validity of Ohm’s law for the metallic conductor. The calculated resistance closely matches nominal rating with an acceptable 1.65% error.',
      sourcesOfError: '1. Contact resistance at terminal alligator clips.\n2. Slight thermal heating if current is left on.\n3. Parallax reading or meter calibration tolerances.',
      precautions: '1. Ensured all connections were firm.\n2. Opened key switch immediately after recording readings.\n3. Verified meter zero calibrations before tests.',
      conclusion: 'Ohm’s Law was experimentally verified. The resistance obtained from graph slope is 20.33 Ω within 1.65% deviation.',
      references: '1. Department of Physics Lab Manual, FUTO Press (2024).\n2. Nelkon & Parker, Advanced Level Physics (7th ed.).',
      isHypothetical: false,
      lastSaved: new Date().toISOString(),
    };
  });

  useEffect(() => {
    if (initialReport) {
      setDraft({ ...initialReport });
    }
  }, [initialReport]);

  const course = courses.find((c) => c.id === draft.courseId) || courses[0];

  // Save handler
  const handleSaveDraft = () => {
    const updated: ReportDraft = {
      ...draft,
      lastSaved: new Date().toISOString(),
    };
    onSaveReport(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Readings Table Helpers
  const addTableRow = () => {
    const nextSn = (draft.readingsTable?.length || 0) + 1;
    const newRow = { sn: nextSn, voltage: '', current: '', resistance: '', computedPower: '', notes: '' };
    setDraft({
      ...draft,
      readingsTable: [...(draft.readingsTable || []), newRow],
    });
  };

  const updateTableRow = (index: number, field: string, val: string) => {
    const rows = [...(draft.readingsTable || [])];
    const row = { ...rows[index], [field]: val };

    // Auto-calculate Resistance and Power if both V and I are entered
    const v = parseFloat(row.voltage || '');
    const i = parseFloat(row.current || '');
    if (!isNaN(v) && !isNaN(i) && i > 0) {
      row.resistance = (v / i).toFixed(2);
      row.computedPower = (v * i).toFixed(3);
    }

    rows[index] = row;
    setDraft({ ...draft, readingsTable: rows });
  };

  const removeTableRow = (index: number) => {
    const rows = draft.readingsTable.filter((_, idx) => idx !== index);
    setDraft({
      ...draft,
      readingsTable: rows.map((r, i) => ({ ...r, sn: i + 1 })),
    });
  };

  // Run calculation validator
  const handleCheckCalculation = () => {
    const v = parseFloat(calcV);
    const i = parseFloat(calcI);
    const r = parseFloat(calcR);
    const res = checkOhmLawCalculations(
      isNaN(v) ? undefined : v,
      isNaN(i) ? undefined : i,
      isNaN(r) ? undefined : r
    );
    setCalcResult(res.message);
  };

  // Markdown Export
  const handleExportMarkdown = () => {
    const md = `# LABORATORY REPORT: ${draft.experimentTitle}
**Course:** ${course?.code} - ${course?.title}  
**Student:** ${profile.name} (${profile.department}, ${profile.institution})  
**Experiment Date:** ${draft.experimentDate} | **Submission Date:** ${draft.submissionDate}  
${draft.isHypothetical ? '\n> ⚠️ *NOTICE: This report draft contains illustrative/hypothetical sample data.*\n' : ''}

---

## 1. Aim
${draft.aim}

## 2. Objectives
${draft.objectives}

## 3. Apparatus and Materials
${draft.apparatus}

## 4. Theory & Background
${draft.theory}

## 5. Circuit / Apparatus Setup
${draft.diagramNotes}

## 6. Experimental Procedure
${draft.procedure}

## 7. Observations & Raw Readings
${draft.observations}

### Data Table
| S/N | Voltage (V) | Current (A) | Resistance (Ω) | Power (W) | Notes |
|:---:|:---:|:---:|:---:|:---:|:---|
${(draft.readingsTable || [])
  .map(
    (r) =>
      `| ${r.sn} | ${r.voltage || '—'} | ${r.current || '—'} | ${r.resistance || '—'} | ${r.computedPower || '—'} | ${r.notes || ''} |`
  )
  .join('\n')}

## 8. Calculations
${draft.calculations}

## 9. Discussion
${draft.discussion}

## 10. Sources of Error & Limitations
${draft.sourcesOfError}

## 11. Precautions & Safety
${draft.precautions}

## 12. Conclusion
${draft.conclusion}

## 13. References
${draft.references}
`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LabReport-${course?.code || 'EXP'}-${draft.experimentDate}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const handleCopyClipboard = () => {
    const text = `LABORATORY REPORT: ${draft.experimentTitle}
Course: ${course?.code} - ${course?.title}
Student: ${profile.name} (${profile.institution})
Date: ${draft.experimentDate}

AIM:
${draft.aim}

THEORY:
${draft.theory}

PROCEDURE:
${draft.procedure}

CALCULATIONS:
${draft.calculations}

CONCLUSION:
${draft.conclusion}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          {onBackToPracticals && (
            <button
              type="button"
              onClick={onBackToPracticals}
              className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 cursor-pointer"
              title="Back to practicals list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-700 dark:text-purple-400" />
              <span>Standard 19-Section Lab Report Editor</span>
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Draft formal laboratory reports with data tables, calculation verification, and clean print-to-PDF formatting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium cursor-pointer transition ${
                activeTab === 'editor'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Report Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium cursor-pointer transition ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Document Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer shadow-sm transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveSuccess ? 'Saved!' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium cursor-pointer"
            title="Export as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export .md</span>
          </button>

          <button
            type="button"
            onClick={handleCopyClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium cursor-pointer"
            title="Copy Report to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* SAMPLE DATA / HYPOTHETICAL BANNER */}
      {draft.isHypothetical && (
        <div className="bg-amber-100 dark:bg-amber-950/80 border border-amber-400 text-amber-900 dark:text-amber-200 p-3 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Sample Draft with Hypothetical Data:</strong> Replace sample readings with your actual laboratory measurements before final submission.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDraft({ ...draft, isHypothetical: false })}
            className="text-[11px] underline font-semibold cursor-pointer"
          >
            Remove Sample Label
          </button>
        </div>
      )}

      {/* TAB 1: REPORT EDITOR MODE */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          {/* Section 1-4: Meta Information */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 border-b pb-2 border-stone-200 dark:border-stone-800">
              1. Title Page & Academic Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Course
                </label>
                <select
                  value={draft.courseId}
                  onChange={(e) => setDraft({ ...draft, courseId: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
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
                  Experiment Title
                </label>
                <input
                  type="text"
                  value={draft.experimentTitle}
                  onChange={(e) => setDraft({ ...draft, experimentTitle: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-semibold"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Experiment Date
                </label>
                <input
                  type="date"
                  value={draft.experimentDate}
                  onChange={(e) => setDraft({ ...draft, experimentDate: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Report Submission Date
                </label>
                <input
                  type="date"
                  value={draft.submissionDate}
                  onChange={(e) => setDraft({ ...draft, submissionDate: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 5-8: Aim, Objectives, Apparatus, Theory */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-4 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 border-b pb-2 border-stone-200 dark:border-stone-800">
              2. Aim, Objectives & Scientific Theory
            </h2>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                Aim of Experiment
              </label>
              <textarea
                rows={2}
                value={draft.aim}
                onChange={(e) => setDraft({ ...draft, aim: e.target.value })}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                Specific Objectives
              </label>
              <textarea
                rows={3}
                value={draft.objectives}
                onChange={(e) => setDraft({ ...draft, objectives: e.target.value })}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                Apparatus and Materials
              </label>
              <textarea
                rows={3}
                value={draft.apparatus}
                onChange={(e) => setDraft({ ...draft, apparatus: e.target.value })}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                Scientific Theory & Background (with governing equations)
              </label>
              <textarea
                rows={5}
                value={draft.theory}
                onChange={(e) => setDraft({ ...draft, theory: e.target.value })}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
              />
            </div>
          </div>

          {/* Section 9-10: Setup Diagram & Procedure */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-4 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 border-b pb-2 border-stone-200 dark:border-stone-800">
              3. Experimental Setup & Procedure
            </h2>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                Circuit / Apparatus Setup Diagram Notes
              </label>
              <textarea
                rows={3}
                value={draft.diagramNotes}
                onChange={(e) => setDraft({ ...draft, diagramNotes: e.target.value })}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                Experimental Procedure (Formal 3rd-person passive past tense)
              </label>
              <textarea
                rows={5}
                value={draft.procedure}
                onChange={(e) => setDraft({ ...draft, procedure: e.target.value })}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          {/* Section 11-13: Observations, Interactive Readings Table, and Electrical Validator */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2 border-stone-200 dark:border-stone-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                4. Observations, Readings Table & Calculations
              </h2>
              <button
                type="button"
                onClick={addTableRow}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                Raw Observations Notes
              </label>
              <textarea
                rows={2}
                value={draft.observations}
                onChange={(e) => setDraft({ ...draft, observations: e.target.value })}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
              />
            </div>

            {/* Interactive Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold">
                  <tr>
                    <th className="p-2 w-12 text-center">S/N</th>
                    <th className="p-2">Voltage (V)</th>
                    <th className="p-2">Current (A)</th>
                    <th className="p-2">R = V/I (Ω)</th>
                    <th className="p-2">P = V×I (W)</th>
                    <th className="p-2">Remarks / Notes</th>
                    <th className="p-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {(draft.readingsTable || []).map((row, idx) => (
                    <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="p-2 text-center font-mono text-stone-500">{row.sn}</td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.voltage || ''}
                          onChange={(e) => updateTableRow(idx, 'voltage', e.target.value)}
                          placeholder="e.g. 1.00"
                          className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded p-1 font-mono"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.current || ''}
                          onChange={(e) => updateTableRow(idx, 'current', e.target.value)}
                          placeholder="e.g. 0.048"
                          className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded p-1 font-mono"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.resistance || ''}
                          onChange={(e) => updateTableRow(idx, 'resistance', e.target.value)}
                          placeholder="Calculated"
                          className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded p-1 font-mono"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.computedPower || ''}
                          onChange={(e) => updateTableRow(idx, 'computedPower', e.target.value)}
                          placeholder="Calculated"
                          className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded p-1 font-mono"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.notes || ''}
                          onChange={(e) => updateTableRow(idx, 'notes', e.target.value)}
                          placeholder="e.g. Stable"
                          className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded p-1"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeTableRow(idx)}
                          className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                          aria-label={`Remove row ${row.sn}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Practical Calculation Assistant Card */}
            <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-200">
                <Calculator className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                <span>Electrical Engineering Calculation & Calibration Verifier</span>
              </div>
              <p className="text-[11px] text-purple-800 dark:text-purple-300">
                Check whether your recorded Voltage (V), Current (I), and Resistance (R) comply with Ohm's Law (5% tolerance for lab instrumentation):
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="font-mono">V:</span>
                  <input
                    type="text"
                    value={calcV}
                    onChange={(e) => setCalcV(e.target.value)}
                    className="w-16 bg-white dark:bg-stone-800 border border-purple-300 dark:border-purple-700 rounded px-1.5 py-1 font-mono"
                    placeholder="V"
                  />
                  <span>V</span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="font-mono">I:</span>
                  <input
                    type="text"
                    value={calcI}
                    onChange={(e) => setCalcI(e.target.value)}
                    className="w-16 bg-white dark:bg-stone-800 border border-purple-300 dark:border-purple-700 rounded px-1.5 py-1 font-mono"
                    placeholder="I"
                  />
                  <span>A</span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="font-mono">R:</span>
                  <input
                    type="text"
                    value={calcR}
                    onChange={(e) => setCalcR(e.target.value)}
                    className="w-16 bg-white dark:bg-stone-800 border border-purple-300 dark:border-purple-700 rounded px-1.5 py-1 font-mono"
                    placeholder="R"
                  />
                  <span>Ω</span>
                </div>

                <button
                  type="button"
                  onClick={handleCheckCalculation}
                  className="px-3 py-1 rounded-md bg-purple-700 hover:bg-purple-800 text-white font-semibold cursor-pointer"
                >
                  Verify Readings
                </button>
              </div>

              {calcResult && (
                <div className="p-2 rounded bg-white dark:bg-stone-800 border border-purple-200 dark:border-purple-800 text-stone-800 dark:text-stone-200 font-mono text-[11px] mt-2">
                  {calcResult}
                </div>
              )}
            </div>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                Calculations & Slope Deductions
              </label>
              <textarea
                rows={4}
                value={draft.calculations}
                onChange={(e) => setDraft({ ...draft, calculations: e.target.value })}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
              />
            </div>
          </div>

          {/* Section 15-19: Discussion, Errors, Precautions, Conclusion, References */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-4 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 border-b pb-2 border-stone-200 dark:border-stone-800">
              5. Discussion, Sources of Error, Precautions & Conclusion
            </h2>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                Discussion of Results
              </label>
              <textarea
                rows={4}
                value={draft.discussion}
                onChange={(e) => setDraft({ ...draft, discussion: e.target.value })}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  Sources of Experimental Error
                </label>
                <textarea
                  rows={4}
                  value={draft.sourcesOfError}
                  onChange={(e) => setDraft({ ...draft, sourcesOfError: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  Precautions & Safety Measures Taken
                </label>
                <textarea
                  rows={4}
                  value={draft.precautions}
                  onChange={(e) => setDraft({ ...draft, precautions: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                Conclusion
              </label>
              <textarea
                rows={3}
                value={draft.conclusion}
                onChange={(e) => setDraft({ ...draft, conclusion: e.target.value })}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                References & Bibliography
              </label>
              <textarea
                rows={3}
                value={draft.references}
                onChange={(e) => setDraft({ ...draft, references: e.target.value })}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMIC DOCUMENT PREVIEW (PRINT-READY SHEET) */}
      {activeTab === 'preview' && (
        <div className="bg-white dark:bg-stone-900 p-8 sm:p-12 rounded-2xl border border-stone-300 dark:border-stone-800 shadow-xl max-w-4xl mx-auto text-stone-900 dark:text-stone-100 space-y-6 font-serif leading-relaxed print:p-0 print:border-none print:shadow-none print:text-black">
          {/* Institutional Header */}
          <div className="text-center border-b-2 border-stone-900 dark:border-stone-300 pb-6 print:border-black">
            <h2 className="text-lg font-bold tracking-wider uppercase font-sans">
              {profile.institution}
            </h2>
            <h3 className="text-sm font-semibold text-stone-600 dark:text-stone-400 font-sans mt-0.5 uppercase print:text-black">
              {profile.faculty} • {profile.department}
            </h3>
            <div className="mt-4 pt-3 border-t border-stone-300 dark:border-stone-700 print:border-black">
              <span className="text-xs uppercase font-sans font-bold text-emerald-800 dark:text-emerald-400 print:text-black">
                FORMAL LABORATORY REPORT
              </span>
              <h1 className="text-2xl font-bold font-sans mt-1">
                {draft.experimentTitle}
              </h1>
            </div>

            {draft.isHypothetical && (
              <div className="mt-2 text-xs text-amber-700 font-sans font-bold bg-amber-50 p-1 rounded inline-block border border-amber-300 print:hidden">
                NOTICE: SAMPLE REPORT DRAFT WITH ILLUSTRATIVE DATA
              </div>
            )}
          </div>

          {/* Student Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans border-b pb-4 border-stone-200 dark:border-stone-800 print:border-black">
            <div>
              <span className="text-stone-500 block">Course:</span>
              <strong className="font-semibold">{course?.code} ({course?.title})</strong>
            </div>
            <div>
              <span className="text-stone-500 block">Student Name:</span>
              <strong className="font-semibold">{profile.name}</strong>
            </div>
            <div>
              <span className="text-stone-500 block">Experiment Date:</span>
              <span className="font-mono">{draft.experimentDate}</span>
            </div>
            <div>
              <span className="text-stone-500 block">Submission Date:</span>
              <span className="font-mono">{draft.submissionDate}</span>
            </div>
          </div>

          {/* Section 1: Aim */}
          <section className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider font-sans border-b border-stone-200 dark:border-stone-800 pb-1">
              1. Aim of the Experiment
            </h4>
            <p className="text-sm text-stone-800 dark:text-stone-200 whitespace-pre-line print:text-black">
              {draft.aim || '(Aim section is pending student entry)'}
            </p>
          </section>

          {/* Section 2: Objectives */}
          <section className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider font-sans border-b border-stone-200 dark:border-stone-800 pb-1">
              2. Objectives
            </h4>
            <p className="text-sm text-stone-800 dark:text-stone-200 whitespace-pre-line print:text-black">
              {draft.objectives || '(Objectives pending entry)'}
            </p>
          </section>

          {/* Section 3: Apparatus */}
          <section className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider font-sans border-b border-stone-200 dark:border-stone-800 pb-1">
              3. Apparatus and Materials
            </h4>
            <p className="text-sm text-stone-800 dark:text-stone-200 whitespace-pre-line print:text-black">
              {draft.apparatus || '(Apparatus list pending entry)'}
            </p>
          </section>

          {/* Section 4: Theory */}
          <section className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider font-sans border-b border-stone-200 dark:border-stone-800 pb-1">
              4. Theory & Governing Equations
            </h4>
            <p className="text-sm text-stone-800 dark:text-stone-200 whitespace-pre-line print:text-black">
              {draft.theory || '(Scientific theory pending entry)'}
            </p>
          </section>

          {/* Section 5: Experimental Setup */}
          {draft.diagramNotes && (
            <section className="space-y-1">
              <h4 className="text-sm font-bold uppercase tracking-wider font-sans border-b border-stone-200 dark:border-stone-800 pb-1">
                5. Experimental Setup & Circuit Layout
              </h4>
              <p className="text-sm text-stone-800 dark:text-stone-200 whitespace-pre-line print:text-black">
                {draft.diagramNotes}
              </p>
            </section>
          )}

          {/* Section 6: Procedure */}
          <section className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider font-sans border-b border-stone-200 dark:border-stone-800 pb-1">
              6. Experimental Procedure
            </h4>
            <p className="text-sm text-stone-800 dark:text-stone-200 whitespace-pre-line print:text-black">
              {draft.procedure || '(Procedure pending entry)'}
            </p>
          </section>

          {/* Section 7: Observations & Data Table */}
          <section className="space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider font-sans border-b border-stone-200 dark:border-stone-800 pb-1">
              7. Observations & Experimental Measurements
            </h4>
            {draft.observations && (
              <p className="text-sm text-stone-800 dark:text-stone-200 whitespace-pre-line print:text-black">
                {draft.observations}
              </p>
            )}

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs font-sans border border-stone-300 dark:border-stone-700 print:border-black">
                <thead className="bg-stone-100 dark:bg-stone-800 print:bg-stone-200 font-bold">
                  <tr>
                    <th className="p-2 border">S/N</th>
                    <th className="p-2 border">Potential Diff. V (Volts)</th>
                    <th className="p-2 border">Electric Current I (Amperes)</th>
                    <th className="p-2 border">Calculated R (Ω)</th>
                    <th className="p-2 border">Power P (Watts)</th>
                    <th className="p-2 border">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800 print:divide-black">
                  {(draft.readingsTable || []).map((row) => (
                    <tr key={row.sn}>
                      <td className="p-2 border text-center font-mono">{row.sn}</td>
                      <td className="p-2 border font-mono">{row.voltage || '—'}</td>
                      <td className="p-2 border font-mono">{row.current || '—'}</td>
                      <td className="p-2 border font-mono">{row.resistance || '—'}</td>
                      <td className="p-2 border font-mono">{row.computedPower || '—'}</td>
                      <td className="p-2 border">{row.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 8: Calculations */}
          <section className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider font-sans border-b border-stone-200 dark:border-stone-800 pb-1">
              8. Calculations & Deductions
            </h4>
            <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-lg border border-stone-200 dark:border-stone-700 font-mono text-xs whitespace-pre-line print:border-black print:bg-white print:text-black">
              {draft.calculations || '(Calculations pending entry)'}
            </div>
          </section>

          {/* Section 9: Discussion */}
          <section className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider font-sans border-b border-stone-200 dark:border-stone-800 pb-1">
              9. Discussion of Results
            </h4>
            <p className="text-sm text-stone-800 dark:text-stone-200 whitespace-pre-line print:text-black">
              {draft.discussion || '(Discussion pending entry)'}
            </p>
          </section>

          {/* Section 10 & 11: Error & Precautions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="space-y-1">
              <h4 className="text-sm font-bold uppercase tracking-wider font-sans border-b border-stone-200 dark:border-stone-800 pb-1">
                10. Sources of Error & Limitations
              </h4>
              <p className="text-sm text-stone-800 dark:text-stone-200 whitespace-pre-line print:text-black">
                {draft.sourcesOfError || '(Sources of error pending entry)'}
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="text-sm font-bold uppercase tracking-wider font-sans border-b border-stone-200 dark:border-stone-800 pb-1">
                11. Precautions & Safety
              </h4>
              <p className="text-sm text-stone-800 dark:text-stone-200 whitespace-pre-line print:text-black">
                {draft.precautions || '(Precautions pending entry)'}
              </p>
            </section>
          </div>

          {/* Section 12: Conclusion */}
          <section className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider font-sans border-b border-stone-200 dark:border-stone-800 pb-1">
              12. Conclusion
            </h4>
            <p className="text-sm text-stone-800 dark:text-stone-200 whitespace-pre-line print:text-black">
              {draft.conclusion || '(Conclusion pending entry)'}
            </p>
          </section>

          {/* Section 13: References */}
          {draft.references && (
            <section className="space-y-1 pt-4 border-t border-stone-300 dark:border-stone-700 print:border-black">
              <h4 className="text-xs font-bold uppercase tracking-wider font-sans">
                13. References
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 font-mono whitespace-pre-line print:text-black">
                {draft.references}
              </p>
            </section>
          )}

          {/* Signoff / Verification block for printing */}
          <div className="pt-8 border-t border-stone-300 dark:border-stone-700 grid grid-cols-2 gap-8 text-xs font-sans print:border-black">
            <div>
              <div className="border-b border-stone-400 dark:border-stone-600 pb-8"></div>
              <span className="block mt-1 text-stone-500">Student Signature & Date</span>
            </div>
            <div>
              <div className="border-b border-stone-400 dark:border-stone-600 pb-8"></div>
              <span className="block mt-1 text-stone-500">Lab Instructor / Technologist Endorsement</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
