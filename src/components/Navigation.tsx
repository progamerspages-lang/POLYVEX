import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  GraduationCap,
  FlaskConical,
  FileText,
  Brain,
  Sparkles,
  BookOpen,
  FolderOpen,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Plus,
  LogOut,
  HardDrive,
  UserCheck
} from 'lucide-react';
import { StudentProfile } from '../types/index.ts';
import { PolyvexLogo } from './PolyvexLogo.tsx';

export type ScreenTab =
  | 'dashboard'
  | 'timetable'
  | 'tasks'
  | 'courses'
  | 'practicals'
  | 'report-editor'
  | 'revision'
  | 'ai-assistant'
  | 'prompt-library'
  | 'resources'
  | 'settings';

interface NavigationProps {
  currentTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
  profile: StudentProfile;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenQuickAdd: (type: 'task' | 'class' | 'practical' | 'topic') => void;
  authMode?: 'cloud' | 'local';
  userEmail?: string;
  onSignOut?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  profile,
  theme,
  onToggleTheme,
  onOpenQuickAdd,
  authMode = 'local',
  userEmail,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const mainNavItems: Array<{ id: ScreenTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'timetable', label: 'Timetable', icon: <Calendar className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks & Deadlines', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'practicals', label: 'Practicals & Labs', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'report-editor', label: 'Lab Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'revision', label: 'Revision Tracker', icon: <Brain className="w-4 h-4" /> },
    { id: 'ai-assistant', label: 'AI Study Assistant', icon: <Sparkles className="w-4 h-4 text-[#35F2D0]" /> },
    { id: 'prompt-library', label: 'Prompt Library', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'courses', label: 'Courses', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'resources', label: 'Resource Library', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Data', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleTabClick = (tab: ScreenTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#090B0D]/95 backdrop-blur-md border-b border-[#262A30] transition-colors">
        {/* Top Banner Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Institution Info */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleTabClick('dashboard')}
                className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-none rounded-lg p-1 group"
              >
                <PolyvexLogo size={34} showWordmark={true} />
                <div className="hidden sm:block pl-2 border-l border-[#262A30]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-[#171A1E] text-[#35F2D0] border border-[#262A30] flex items-center gap-1">
                      {authMode === 'cloud' ? (
                        <>
                          <UserCheck className="w-2.5 h-2.5" />
                          <span>Cloud</span>
                        </>
                      ) : (
                        <>
                          <HardDrive className="w-2.5 h-2.5" />
                          <span>Local Mode</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#A1A8B3] truncate max-w-[200px]">
                    {profile.institution || profile.department || 'Academic Workspace'}
                  </div>
                </div>
              </button>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Add Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setQuickAddOpen(!quickAddOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#35F2D0] hover:bg-[#35F2D0]/90 text-[#090B0D] text-xs font-bold cursor-pointer shadow-[0_0_12px_rgba(53,242,208,0.2)] transition"
                  aria-label="Quick add new academic item"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span className="hidden sm:inline">Add Item</span>
                </button>

                {quickAddOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#171A1E] border border-[#262A30] rounded-xl shadow-2xl py-1 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenQuickAdd('task');
                        setQuickAddOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#20252C] text-[#F5F7FA] flex items-center gap-2.5 cursor-pointer"
                    >
                      <CheckSquare className="w-4 h-4 text-[#35F2D0]" />
                      <span>New Task / Deadline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenQuickAdd('class');
                        setQuickAddOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#20252C] text-[#F5F7FA] flex items-center gap-2.5 cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-[#00AFC8]" />
                      <span>Add Timetable Class</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenQuickAdd('practical');
                        setQuickAddOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#20252C] text-[#F5F7FA] flex items-center gap-2.5 cursor-pointer"
                    >
                      <FlaskConical className="w-4 h-4 text-purple-400" />
                      <span>New Lab Practical</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenQuickAdd('topic');
                        setQuickAddOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#20252C] text-[#F5F7FA] flex items-center gap-2.5 cursor-pointer"
                    >
                      <Brain className="w-4 h-4 text-amber-400" />
                      <span>Add Revision Topic</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 text-[#A1A8B3] hover:text-[#F5F7FA] hover:bg-[#171A1E] rounded-xl border border-transparent hover:border-[#262A30] cursor-pointer transition"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Sign Out Action if requested */}
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#A1A8B3] hover:text-rose-400 hover:bg-[#171A1E] rounded-xl border border-[#262A30] transition cursor-pointer"
                  title="Sign Out / Switch Workspace"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#A1A8B3] hover:text-[#F5F7FA] hover:bg-[#171A1E] rounded-xl border border-[#262A30] cursor-pointer"
                aria-label="Toggle navigation drawer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Horizontal Navigation Links */}
        <nav className="hidden lg:block bg-[#101317] border-t border-[#262A30]/80 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1 py-1.5">
            {mainNavItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition ${
                    isActive
                      ? 'bg-[#35F2D0] text-[#090B0D] shadow-[0_0_10px_rgba(53,242,208,0.25)]'
                      : 'text-[#A1A8B3] hover:bg-[#171A1E] hover:text-[#F5F7FA]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#090B0D] text-[#35F2D0] font-bold border border-[#262A30]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile Drawer (Expanded) */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#171A1E] border-b border-[#262A30] px-4 py-3 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A8B3]">
                Navigation Menu
              </span>
              {onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOut();
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:underline"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Exit / Sign Out</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mainNavItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                      isActive
                        ? 'bg-[#35F2D0] text-[#090B0D] font-bold'
                        : 'bg-[#090B0D] text-[#A1A8B3] hover:text-[#F5F7FA] border border-[#262A30]'
                    }`}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Primary Bottom Bar for Quick Thumb Reach */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#090B0D]/95 backdrop-blur-md border-t border-[#262A30] py-2 px-4 flex justify-around items-center shadow-2xl">
        <button
          type="button"
          onClick={() => handleTabClick('dashboard')}
          className={`flex flex-col items-center gap-1 text-[11px] cursor-pointer ${
            currentTab === 'dashboard' ? 'text-[#35F2D0] font-bold' : 'text-[#A1A8B3]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('tasks')}
          className={`flex flex-col items-center gap-1 text-[11px] cursor-pointer ${
            currentTab === 'tasks' ? 'text-[#35F2D0] font-bold' : 'text-[#A1A8B3]'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Tasks</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('timetable')}
          className={`flex flex-col items-center gap-1 text-[11px] cursor-pointer ${
            currentTab === 'timetable' ? 'text-[#35F2D0] font-bold' : 'text-[#A1A8B3]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Classes</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('practicals')}
          className={`flex flex-col items-center gap-1 text-[11px] cursor-pointer ${
            currentTab === 'practicals' ? 'text-[#35F2D0] font-bold' : 'text-[#A1A8B3]'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Labs</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center gap-1 text-[11px] cursor-pointer ${
            mobileMenuOpen ? 'text-[#35F2D0] font-bold' : 'text-[#A1A8B3]'
          }`}
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
