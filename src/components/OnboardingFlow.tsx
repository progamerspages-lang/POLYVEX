import React, { useState } from 'react';
import {
  User,
  Building,
  GraduationCap,
  Layers,
  Calendar,
  CheckSquare,
  FlaskConical,
  Brain,
  FolderOpen,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2
} from 'lucide-react';
import { StudentProfile } from '../types/index.ts';
import { PolyvexLogo } from './PolyvexLogo.tsx';

interface OnboardingFlowProps {
  initialProfile: StudentProfile;
  onComplete: (profile: StudentProfile, preferences: string[]) => void;
  onCancel?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialProfile,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Profile fields (all optional except display name)
  const [name, setName] = useState(initialProfile.name || '');
  const [institution, setInstitution] = useState(initialProfile.institution || '');
  const [department, setDepartment] = useState(initialProfile.department || '');
  const [level, setLevel] = useState(initialProfile.level || '');

  // Step 2: Feature preferences
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'timetable',
    'tasks',
    'practicals',
    'revision',
    'resources',
    'ai-assistant',
  ]);

  const toggleFeature = (id: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const featureOptions = [
    { id: 'timetable', label: 'Timetable & Classes', desc: 'Weekly schedule and lecture rooms', icon: <Calendar className="w-4 h-4 text-[#35F2D0]" /> },
    { id: 'tasks', label: 'Tasks & Deadlines', desc: 'Assignments, quizzes, and project alerts', icon: <CheckSquare className="w-4 h-4 text-[#35F2D0]" /> },
    { id: 'practicals', label: 'Practical Reports', desc: 'Lab sessions, apparatus, and Ohm’s Law checks', icon: <FlaskConical className="w-4 h-4 text-[#35F2D0]" /> },
    { id: 'revision', label: 'Revision Tracker', desc: 'Confidence tracking and spaced repetition', icon: <Brain className="w-4 h-4 text-[#35F2D0]" /> },
    { id: 'resources', label: 'Study Resources', desc: 'Lecture slides, PDFs, notes, and past papers', icon: <FolderOpen className="w-4 h-4 text-[#35F2D0]" /> },
    { id: 'ai-assistant', label: 'AI Study Tutor', desc: 'Step-by-step academic problem solver', icon: <Sparkles className="w-4 h-4 text-[#35F2D0]" /> },
  ];

  const handleFinish = () => {
    const updatedProfile: StudentProfile = {
      ...initialProfile,
      name: name.trim() || 'Scholar',
      institution: institution.trim(),
      department: department.trim(),
      level: level.trim(),
      onboardingCompleted: true,
      preferredTheme: 'dark',
    };
    onComplete(updatedProfile, selectedFeatures);
  };

  return (
    <div className="min-h-screen bg-[#090B0D] text-[#F5F7FA] flex flex-col justify-between selection:bg-[#35F2D0]/20 selection:text-[#35F2D0] px-4 py-8">
      {/* Top Header */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between pb-6 border-b border-[#262A30]">
        <PolyvexLogo size={32} showWordmark={true} />
        <div className="text-xs font-semibold text-[#A1A8B3]">
          Step {step} of 3
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xl mx-auto mt-4">
        <div className="w-full bg-[#171A1E] h-1.5 rounded-full overflow-hidden border border-[#262A30]">
          <div
            className="bg-gradient-to-r from-[#35F2D0] to-[#00AFC8] h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Wizard Container */}
      <div className="w-full max-w-xl mx-auto my-auto py-8">
        {/* STEP 1: YOUR PROFILE */}
        {step === 1 && (
          <div className="bg-[#171A1E] border border-[#262A30] rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="mb-6">
              <span className="text-xs font-bold text-[#35F2D0] uppercase tracking-wider">
                Step 1: Your Profile
              </span>
              <h2 className="text-2xl font-black text-[#F5F7FA] mt-1">
                Tell us about your studies
              </h2>
              <p className="text-xs text-[#A1A8B3] mt-1.5">
                These details help personalize your academic reports and timetable. All fields except your display name are optional.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                  Display Name <span className="text-[#35F2D0]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex, Chidi, Sarah"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-[#F5F7FA] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#35F2D0] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                  Institution <span className="text-[#64748B] text-[10px] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. University, Institute, Polytechnic"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-[#F5F7FA] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#35F2D0] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                  Department or Course of Study <span className="text-[#64748B] text-[10px] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science, Mechanical Engineering, Law"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-[#F5F7FA] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#35F2D0] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">
                  Academic Level <span className="text-[#64748B] text-[10px] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="e.g. 100L, 200L, 300L, Year 1, Masters"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-[#F5F7FA] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#35F2D0] transition"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!name.trim()) setName('Scholar');
                  setStep(2);
                }}
                className="text-xs text-[#A1A8B3] hover:text-[#F5F7FA] transition underline underline-offset-4 cursor-pointer"
              >
                Skip optional details
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#35F2D0] text-[#090B0D] font-bold text-xs hover:bg-[#35F2D0]/90 transition shadow-sm cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: STUDY PREFERENCES */}
        {step === 2 && (
          <div className="bg-[#171A1E] border border-[#262A30] rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="mb-6">
              <span className="text-xs font-bold text-[#35F2D0] uppercase tracking-wider">
                Step 2: Study Preferences
              </span>
              <h2 className="text-2xl font-black text-[#F5F7FA] mt-1">
                Choose your focus areas
              </h2>
              <p className="text-xs text-[#A1A8B3] mt-1.5">
                Select the modules you want to utilize. Courses, timetable classes, tasks, and resources can all be created manually as you study. No sample entries will be created.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featureOptions.map((opt) => {
                const isSelected = selectedFeatures.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleFeature(opt.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                      isSelected
                        ? 'bg-[#090B0D] border-[#35F2D0]/60 text-[#F5F7FA]'
                        : 'bg-[#171A1E] border-[#262A30] text-[#A1A8B3] hover:border-[#64748B]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                        isSelected
                          ? 'bg-[#35F2D0] border-[#35F2D0] text-[#090B0D]'
                          : 'border-[#64748B] bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#F5F7FA] flex items-center gap-1.5">
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-[#A1A8B3] mt-0.5">{opt.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs text-[#A1A8B3] hover:text-[#F5F7FA] transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#35F2D0] text-[#090B0D] font-bold text-xs hover:bg-[#35F2D0]/90 transition shadow-sm cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FINISH SETUP */}
        {step === 3 && (
          <div className="bg-[#171A1E] border border-[#262A30] rounded-2xl p-6 sm:p-8 shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#090B0D] border border-[#35F2D0]/40 flex items-center justify-center mx-auto mb-4 text-[#35F2D0]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-xs font-bold text-[#35F2D0] uppercase tracking-wider">
              Step 3: Setup Complete
            </span>

            <h2 className="text-2xl font-black text-[#F5F7FA] mt-1">
              You’re ready to get started.
            </h2>

            <p className="text-xs text-[#A1A8B3] mt-2 max-w-md mx-auto">
              Your clean academic workspace is prepared. You can add your courses, schedule your lectures, and start planning assignments immediately.
            </p>

            <div className="mt-6 p-4 rounded-xl bg-[#090B0D] border border-[#262A30] text-left max-w-md mx-auto text-xs space-y-1.5">
              <div className="flex justify-between text-[#A1A8B3]">
                <span>Student Name:</span>
                <span className="text-[#F5F7FA] font-medium">{name || 'Scholar'}</span>
              </div>
              {institution && (
                <div className="flex justify-between text-[#A1A8B3]">
                  <span>Institution:</span>
                  <span className="text-[#F5F7FA] font-medium">{institution}</span>
                </div>
              )}
              {department && (
                <div className="flex justify-between text-[#A1A8B3]">
                  <span>Department:</span>
                  <span className="text-[#F5F7FA] font-medium">{department}</span>
                </div>
              )}
              {level && (
                <div className="flex justify-between text-[#A1A8B3]">
                  <span>Academic Level:</span>
                  <span className="text-[#F5F7FA] font-medium">{level}</span>
                </div>
              )}
              <div className="flex justify-between text-[#A1A8B3] pt-1.5 border-t border-[#262A30]">
                <span>Active Modules:</span>
                <span className="text-[#35F2D0] font-medium">{selectedFeatures.length} enabled</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#090B0D] text-[#A1A8B3] hover:text-[#F5F7FA] border border-[#262A30] text-xs transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Adjust Preferences</span>
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#35F2D0] text-[#090B0D] font-bold text-xs hover:bg-[#35F2D0]/90 transition shadow-[0_0_15px_rgba(53,242,208,0.3)] cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full max-w-xl mx-auto pt-6 border-t border-[#262A30] text-center text-xs text-[#64748B]">
        POLYVEX • “Your potential. Without limits.”
      </div>
    </div>
  );
};
