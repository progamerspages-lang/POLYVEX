import React from 'react';
import {
  Calendar,
  CheckSquare,
  FlaskConical,
  Brain,
  Sparkles,
  ArrowRight,
  Shield,
  HardDrive
} from 'lucide-react';
import { PolyvexLogo } from './PolyvexLogo.tsx';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogIn: () => void;
  onContinueLocal: () => void;
  isCloudConfigured: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onLogIn,
  onContinueLocal,
  isCloudConfigured,
}) => {
  const features = [
    {
      icon: <Calendar className="w-5 h-5 text-[#35F2D0]" />,
      title: 'Organize courses and timetables',
      description: 'Weekly schedule management, conflict detection, and course tracking with zero clutter.',
    },
    {
      icon: <CheckSquare className="w-5 h-5 text-[#35F2D0]" />,
      title: 'Track assignments, tests, and deadlines',
      description: 'Prioritized task queues, countdown timers, and CSV export for coursework deliverables.',
    },
    {
      icon: <FlaskConical className="w-5 h-5 text-[#35F2D0]" />,
      title: 'Prepare and organize practical reports',
      description: 'Structured scientific report drafting with live Ohm’s law validation and clean print export.',
    },
    {
      icon: <Brain className="w-5 h-5 text-[#35F2D0]" />,
      title: 'Plan revision sessions and monitor confidence',
      description: 'Pedagogical spaced repetition and prioritized study blocks mapped to your deadlines.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-[#35F2D0]" />,
      title: 'Access AI-assisted study tools & resources',
      description: 'Course-grounded concept explanations and centralized academic reference management.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090B0D] text-[#F5F7FA] flex flex-col justify-between selection:bg-[#35F2D0]/20 selection:text-[#35F2D0]">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between border-b border-[#262A30]/60">
        <PolyvexLogo size={36} showWordmark={true} />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLogIn}
            className="text-sm font-medium text-[#A1A8B3] hover:text-[#F5F7FA] transition px-3 py-1.5 cursor-pointer"
          >
            Log In
          </button>
          <button
            type="button"
            onClick={onGetStarted}
            className="text-sm font-semibold text-[#090B0D] bg-[#35F2D0] hover:bg-[#35F2D0]/90 px-4 py-2 rounded-xl transition shadow-[0_0_15px_rgba(53,242,208,0.3)] cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col items-center text-center">
        {/* Emblem Hero */}
        <div className="mb-6 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-[#35F2D0]/20 to-[#00AFC8]/10 blur-xl rounded-full opacity-70 pointer-events-none" />
          <PolyvexLogo size={88} className="relative" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#171A1E] text-[#35F2D0] border border-[#262A30] mb-4">
          <Shield className="w-3.5 h-3.5" />
          POLYVEX ACADEMIC OS
        </span>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#F5F7FA] font-sans">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#35F2D0] to-[#00AFC8]">POLYVEX</span>
        </h1>

        <p className="mt-3 text-lg sm:text-xl font-semibold text-[#35F2D0] tracking-wide">
          “Your potential. Without limits.”
        </p>

        <p className="mt-2 text-base sm:text-lg text-[#A1A8B3] max-w-xl">
          Your campus life, organized around you.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
          <button
            type="button"
            onClick={onGetStarted}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#35F2D0] text-[#090B0D] font-bold text-sm hover:bg-[#35F2D0]/90 transition shadow-[0_0_20px_rgba(53,242,208,0.35)] cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onLogIn}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#171A1E] text-[#F5F7FA] font-semibold text-sm border border-[#262A30] hover:border-[#64748B] hover:bg-[#1E2329] transition cursor-pointer"
          >
            <span>I already have an account</span>
          </button>
        </div>

        {/* Local mode option */}
        <div className="mt-4">
          <button
            type="button"
            onClick={onContinueLocal}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#A1A8B3] hover:text-[#35F2D0] transition py-1 cursor-pointer"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Or continue in Local-Only Mode (Offline browser storage)</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-14 w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className={`p-4 sm:p-5 rounded-2xl bg-[#171A1E] border border-[#262A30] hover:border-[#35F2D0]/40 transition duration-200 ${idx === features.length - 1 ? 'sm:col-span-2' : ''}`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] flex-shrink-0">
                  {feat.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F5F7FA]">{feat.title}</h3>
                  <p className="mt-1 text-xs text-[#A1A8B3] leading-relaxed">{feat.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cloud / Local transparent badge */}
        <div className="mt-10 p-3.5 rounded-xl bg-[#171A1E]/80 border border-[#262A30] text-xs text-[#A1A8B3] max-w-lg">
          {isCloudConfigured ? (
            <span className="text-emerald-400 font-medium">
              ✓ Supabase Cloud Authentication is configured and active.
            </span>
          ) : (
            <span>
              ℹ️ Polyvex starts ready in <strong className="text-[#F5F7FA]">Local-Only Mode</strong>. To sync across devices, configure Supabase credentials in your project environment.
            </span>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 border-t border-[#262A30]/60 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2">
        <p>© {new Date().getFullYear()} POLYVEX. “Your potential. Without limits.”</p>
        <p>Academic productivity and revision platform</p>
      </footer>
    </div>
  );
};
