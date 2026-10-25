import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Download,
  Upload,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  Database,
  Building,
  GraduationCap,
  FileSpreadsheet,
  Moon,
  Sun,
  HardDrive
} from 'lucide-react';
import { AppDatabase, StudentProfile } from '../types/index.ts';
import { exportDatabaseAsJson, exportTasksToCsv } from '../utils/storage.ts';
import { validateBackupSchema } from '../utils/academicMath.ts';
import { isSupabaseConfigured } from '../utils/supabaseClient.ts';

interface SettingsModuleProps {
  db: AppDatabase;
  onUpdateProfile: (profile: StudentProfile) => void;
  onImportBackup: (importedDb: AppDatabase) => void;
  onResetDatabase: () => void;
  authMode?: 'cloud' | 'local';
  userEmail?: string;
  onSignOut?: () => void;
  onReRunOnboarding?: () => void;
}

const NIGERIAN_INSTITUTION_PRESETS = [
  'Federal University of Technology, Owerri (FUTO)',
  'University of Lagos (UNILAG)',
  'University of Ibadan (UI)',
  'University of Nigeria, Nsukka (UNN)',
  'Ahmadu Bello University (ABU)',
  'Obafemi Awolowo University (OAU)',
  'Federal University of Technology, Akure (FUTA)',
  'Federal University of Technology, Minna (FUTMINNA)',
  'Nnamdi Azikiwe University (UNIZIK)',
  'Covenant University',
  'Yaba College of Technology (YABATECH)',
  'Federal Polytechnic, Nekede (NEKEDEPOLY)',
];

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  db,
  onUpdateProfile,
  onImportBackup,
  onResetDatabase,
  authMode = 'local',
  userEmail,
  onSignOut,
  onReRunOnboarding,
}) => {
  const [profileForm, setProfileForm] = useState<StudentProfile>({ ...db.profile });
  const [profileSaved, setProfileSaved] = useState(false);

  // Import state
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<AppDatabase | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  // Export full JSON database
  const handleExportJson = () => {
    const jsonStr = exportDatabaseAsJson(db);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polyvex-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Tasks CSV
  const handleExportCsv = () => {
    const csv = exportTasksToCsv(db.tasks, db.courses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polyvex-tasks-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle JSON file selection for backup restoration
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportErrors([]);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const validation = validateBackupSchema(parsed);

        if (!validation.valid || !validation.sanitized) {
          setImportErrors(validation.errors);
          setPendingImportData(null);
        } else {
          setPendingImportData(validation.sanitized);
        }
      } catch (err: any) {
        setImportErrors(['Selected file is not valid JSON. Please provide a valid .json backup.']);
        setPendingImportData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!pendingImportData) return;
    if (confirm('Restoring this backup will replace current local courses, timetable, tasks, and reports with the backup data. Continue?')) {
      onImportBackup(pendingImportData);
      setPendingImportData(null);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          <span>Academic Settings & Data Management</span>
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Student profile, Nigerian tertiary institution selection, JSON data export/import, and local storage controls.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols): Student Profile & Academic Settings */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-2 border-stone-200 dark:border-stone-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Student Profile & Institution</span>
            </h2>
            {profileSaved && (
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Profile Saved</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Preferred Name or Nickname <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Current Level / Year
                </label>
                <select
                  value={profileForm.level}
                  onChange={(e) => setProfileForm({ ...profileForm, level: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
                >
                  <option value="100L">100L (Year 1)</option>
                  <option value="200L">200L (Year 2)</option>
                  <option value="300L">300L (Year 3)</option>
                  <option value="400L">400L (Year 4)</option>
                  <option value="500L">500L (Year 5 / Engineering Finalist)</option>
                  <option value="Postgraduate">Postgraduate (PGD / M.Sc / Ph.D)</option>
                  <option value="ND I">ND I (Polytechnic)</option>
                  <option value="ND II">ND II (Polytechnic)</option>
                  <option value="HND I">HND I (Polytechnic)</option>
                  <option value="HND II">HND II (Polytechnic)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                Tertiary Institution
              </label>
              <div className="space-y-1.5">
                <select
                  value={profileForm.institution}
                  onChange={(e) => setProfileForm({ ...profileForm, institution: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                >
                  {NIGERIAN_INSTITUTION_PRESETS.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                  <option value="Other / Custom Institution">Other / Custom Institution</option>
                </select>

                <input
                  type="text"
                  placeholder="Or enter institution name manually..."
                  value={profileForm.institution}
                  onChange={(e) => setProfileForm({ ...profileForm, institution: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Faculty or School
                </label>
                <input
                  type="text"
                  placeholder="e.g. SEET - School of Engineering & Engr. Tech"
                  value={profileForm.faculty}
                  onChange={(e) => setProfileForm({ ...profileForm, faculty: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Department or Programme
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electrical & Electronic Engineering"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Current Semester
                </label>
                <select
                  value={profileForm.semester}
                  onChange={(e) => setProfileForm({ ...profileForm, semester: e.target.value as any })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                >
                  <option value="Harmattan / First">Harmattan / First Semester</option>
                  <option value="Rain / Second">Rain / Second Semester</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Academic Session
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2025/2026"
                  value={profileForm.academicSession}
                  onChange={(e) => setProfileForm({ ...profileForm, academicSession: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer shadow-sm transition"
              >
                Save Academic Profile
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (5 Cols): Storage Mode & Backup Export/Import */}
        <div className="lg:col-span-5 space-y-6">
          {/* Operating Mode Status Card */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-3 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2 border-b pb-2 border-stone-200 dark:border-stone-800">
              <HardDrive className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Authentication & Data Architecture</span>
            </h2>

            {/* Cloud Status or Local Mode Status */}
            {isSupabaseConfigured ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-800/60 rounded-xl text-emerald-950 dark:text-emerald-200 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Supabase Cloud Auth Active</span>
                  </strong>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200/50 dark:bg-emerald-800/40">
                    {authMode === 'cloud' ? 'Authenticated' : 'Local Workspace'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {userEmail ? `Signed in as: ${userEmail}` : 'Connected to Supabase cloud project.'}
                </p>
              </div>
            ) : (
              <div className="p-3 bg-stone-50 dark:bg-[#1A1E24] border border-[#262A30] rounded-xl text-stone-700 dark:text-stone-300 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="font-semibold flex items-center gap-1.5 text-stone-900 dark:text-stone-100">
                    <HardDrive className="w-3.5 h-3.5 text-[#35F2D0]" />
                    <span>Offline Local Storage Active</span>
                  </strong>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#171A1E] text-[#35F2D0] border border-[#262A30]">
                    Local Mode
                  </span>
                </div>
                <p className="text-[11px] text-[#A1A8B3] leading-relaxed">
                  Polyvex is running locally in your browser storage with zero cloud dependencies. No mandatory cloud accounts or recurring fees.
                </p>
                <div className="p-2.5 rounded-lg bg-[#090B0D] border border-[#262A30] text-[10px] text-stone-400 space-y-1">
                  <span className="font-semibold text-stone-300 block">Supabase Cloud Setup:</span>
                  <p>To enable cloud authentication and sync across devices, provide these keys in your <code className="text-[#35F2D0]">.env</code>:</p>
                  <code className="block text-[10px] text-stone-400 font-mono select-all">
                    VITE_SUPABASE_URL=https://your-project.supabase.co<br />
                    VITE_SUPABASE_ANON_KEY=your-anon-key
                  </code>
                </div>
              </div>
            )}

            {/* Quick Actions: Re-run Onboarding & Sign Out */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {onReRunOnboarding && (
                <button
                  type="button"
                  onClick={onReRunOnboarding}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium cursor-pointer"
                >
                  <RefreshCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Re-run Onboarding Flow</span>
                </button>
              )}
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-medium cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Sign Out / Switch Mode</span>
                </button>
              )}
            </div>
          </div>

          {/* Backup, Export & Restore Card */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-4 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2 border-b pb-2 border-stone-200 dark:border-stone-800">
              <Database className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Data Backup & Restore</span>
            </h2>

            {/* Export Actions */}
            <div className="space-y-2">
              <span className="font-semibold text-stone-700 dark:text-stone-300 block">
                Export Personal Records
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium cursor-pointer shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full JSON Backup</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 text-stone-700 dark:text-stone-300 font-medium cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tasks CSV</span>
                </button>
              </div>
            </div>

            {/* Import Backup */}
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <span className="font-semibold text-stone-700 dark:text-stone-300 block">
                Restore from JSON Backup
              </span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-100 dark:file:bg-stone-800 file:text-stone-700 dark:file:text-stone-200 hover:file:bg-stone-200 cursor-pointer"
              />

              {importErrors.length > 0 && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-lg space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Backup validation failed:</span>
                  </div>
                  <ul className="list-disc pl-4 text-[11px]">
                    {importErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {pendingImportData && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2">
                  <span className="font-semibold text-blue-900 dark:text-blue-200 block">
                    Valid Backup Verified:
                  </span>
                  <div className="text-[11px] text-blue-800 dark:text-blue-300">
                    Contains {pendingImportData.courses.length} courses, {pendingImportData.timetable.length} classes, {pendingImportData.tasks.length} tasks, and {pendingImportData.practicals.length} lab records.
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="w-full py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold cursor-pointer shadow-xs"
                  >
                    Confirm & Restore Backup
                  </button>
                </div>
              )}

              {importSuccess && (
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Backup restored successfully!</span>
                </div>
              )}
            </div>

            {/* Clear Data Reset */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <span className="font-semibold text-rose-700 dark:text-rose-400 block mb-1">
                Danger Zone
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reset all academic records to a clean empty workspace? This will clear all courses, timetable entries, tasks, and lab records. Export a backup first to preserve your custom notes.')) {
                    onResetDatabase();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer text-xs"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Reset to Clean Empty Workspace</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
