import React, { useState, useEffect } from 'react';
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
  X,
  Sun,
  Moon,
  Plus,
  LogOut,
  HardDrive,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
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
  onOpenAddCourse?: () => void;
  authMode?: 'cloud' | 'local';
  userEmail?: string;
  onSignOut?: () => void;
  isDesktopCollapsed?: boolean;
  onToggleDesktopSidebar?: () => void;
}

// Two-Line Menu Icon inspired by ChatGPT mobile UI
const TwoLinesIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <line x1="5" y1="9" x2="19" y2="9" />
    <line x1="5" y1="15" x2="19" y2="15" />
  </svg>
);

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  profile,
  theme,
  onToggleTheme,
  onOpenQuickAdd,
  onOpenAddCourse,
  authMode = 'local',
  onSignOut,
  isDesktopCollapsed = false,
  onToggleDesktopSidebar,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Group 1: YOUR WORKSPACE
  const workspaceItems: Array<{ id: ScreenTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'dashboard', label: 'Overview / Home', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'timetable', label: 'Timetable / Classes', icon: <Calendar className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks & Deadlines', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'courses', label: 'My Courses', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'practicals', label: 'Practicals & Labs', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'report-editor', label: 'Lab Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'revision', label: 'Revision Tracker', icon: <Brain className="w-4 h-4" /> },
  ];

  // Group 2: STUDY TOOLS & SYSTEM
  const studyToolItems: Array<{ id: ScreenTab; label: string; icon: React.ReactNode }> = [
    { id: 'ai-assistant', label: 'AI Study Assistant', icon: <Sparkles className="w-4 h-4 text-[#35F2D0]" /> },
    { id: 'prompt-library', label: 'Prompt Library', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'resources', label: 'Resource Library', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Data', icon: <Settings className="w-4 h-4" /> },
  ];

  const allNavItems = [...workspaceItems, ...studyToolItems];

  // Prevent background body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  // Keyboard Escape listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileDrawerOpen) {
          setMobileDrawerOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen]);

  const handleTabClick = (tab: ScreenTab) => {
    onSelectTab(tab);
    setMobileDrawerOpen(false);
  };

  return (
    <>
      {/* 1. Desktop Persistent Left Sidebar (Visible on lg: and up) */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 bottom-0 left-0 z-30 bg-[#090B0D] border-r border-[#262A30] transition-all duration-200 ease-in-out ${
          isDesktopCollapsed ? 'w-16' : 'w-64'
        }`}
        aria-label="Desktop navigation"
      >
        {/* Top Header of Sidebar */}
        <div className="h-16 px-3 border-b border-[#262A30] flex items-center justify-between shrink-0 bg-[#090B0D]">
          {!isDesktopCollapsed ? (
            <button
              type="button"
              onClick={() => handleTabClick('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer focus:outline-none rounded-lg p-1 group truncate"
            >
              <PolyvexLogo size={32} showWordmark={true} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleTabClick('dashboard')}
              className="mx-auto cursor-pointer focus:outline-none p-1"
              title="Polyvex Dashboard"
            >
              <PolyvexLogo size={28} showWordmark={false} />
            </button>
          )}

          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            className="p-1.5 rounded-lg text-[#A1A8B3] hover:text-[#F5F7FA] hover:bg-[#171A1E] border border-transparent hover:border-[#262A30] transition cursor-pointer shrink-0"
            title={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isDesktopCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-[#35F2D0]" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Primary Action Button: Add Courses */}
        <div className="p-3 border-b border-[#262A30]">
          {!isDesktopCollapsed ? (
            <button
              type="button"
              onClick={onOpenAddCourse}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#35F2D0] hover:bg-[#35F2D0]/90 text-[#090B0D] font-bold text-xs transition shadow-[0_0_10px_rgba(53,242,208,0.2)] active:scale-98 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 stroke-[2.2]" />
              <span>Add Academic Course</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAddCourse}
              className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl bg-[#35F2D0] hover:bg-[#35F2D0]/90 text-[#090B0D] transition shadow-xs cursor-pointer"
              title="Add Academic Course"
            >
              <BookOpen className="w-4 h-4 stroke-[2.2]" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Destination List */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-5 no-scrollbar">
          {/* Group 1: YOUR WORKSPACE */}
          <div>
            {!isDesktopCollapsed && (
              <div className="px-3 mb-2 text-[10px] font-extrabold tracking-wider uppercase text-[#64748B]">
                Your Workspace
              </div>
            )}
            <div className="space-y-1">
              {workspaceItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    title={isDesktopCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isDesktopCollapsed
                        ? 'h-10 justify-center p-0'
                        : 'px-3 py-2 justify-between'
                    } ${
                      isActive
                        ? 'bg-[#102427] text-[#35F2D0] border-l-2 border-[#35F2D0] font-bold shadow-xs'
                        : 'text-[#A1A8B3] hover:bg-[#101317] hover:text-[#F5F7FA]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={isActive ? 'text-[#35F2D0]' : 'text-[#8B95A5]'}>
                        {item.icon}
                      </span>
                      {!isDesktopCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: STUDY TOOLS */}
          <div>
            {!isDesktopCollapsed && (
              <div className="px-3 mb-2 text-[10px] font-extrabold tracking-wider uppercase text-[#64748B]">
                Study Tools
              </div>
            )}
            <div className="space-y-1">
              {studyToolItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    title={isDesktopCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isDesktopCollapsed
                        ? 'h-10 justify-center p-0'
                        : 'px-3 py-2 justify-between'
                    } ${
                      isActive
                        ? 'bg-[#102427] text-[#35F2D0] border-l-2 border-[#35F2D0] font-bold shadow-xs'
                        : 'text-[#A1A8B3] hover:bg-[#101317] hover:text-[#F5F7FA]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={isActive ? 'text-[#35F2D0]' : 'text-[#8B95A5]'}>
                        {item.icon}
                      </span>
                      {!isDesktopCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer / Profile Info */}
        <div className="p-3 border-t border-[#262A30] bg-[#090B0D] shrink-0">
          {!isDesktopCollapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#F5F7FA] truncate">
                  {profile.name || 'Student Workspace'}
                </div>
                <div className="text-[10px] text-[#A1A8B3] truncate">
                  {profile.institution || profile.department || 'Academic Profile'}
                </div>
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#171A1E] text-[#35F2D0] border border-[#262A30] shrink-0 flex items-center gap-1">
                {authMode === 'cloud' ? <UserCheck className="w-2.5 h-2.5" /> : <HardDrive className="w-2.5 h-2.5" />}
                <span>{authMode === 'cloud' ? 'Cloud' : 'Local'}</span>
              </span>
            </div>
          ) : (
            <div className="flex justify-center" title={profile.name || 'Student Workspace'}>
              <span className="w-8 h-8 rounded-full bg-[#171A1E] border border-[#262A30] text-[#35F2D0] flex items-center justify-center font-bold text-xs">
                {profile.name ? profile.name[0].toUpperCase() : 'P'}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Mobile Backdrop Overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs transition-opacity duration-250 ease-in-out lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 3. Mobile Left-Side Navigation Drawer */}
      <aside
        id="mobile-navigation-drawer"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-[#090B0D] border-r border-[#262A30] shadow-2xl flex flex-col transition-transform duration-250 ease-in-out lg:hidden motion-reduce:transition-none ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#262A30] flex items-center justify-between shrink-0 bg-[#101317]">
          <PolyvexLogo size={30} showWordmark={true} />
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1.5 rounded-lg text-[#A1A8B3] hover:text-[#F5F7FA] hover:bg-[#171A1E] border border-transparent hover:border-[#262A30] transition cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Action: Add Courses */}
        <div className="p-3 border-b border-[#262A30] bg-[#090B0D]">
          <button
            type="button"
            onClick={() => {
              setMobileDrawerOpen(false);
              if (onOpenAddCourse) onOpenAddCourse();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#35F2D0] hover:bg-[#35F2D0]/90 text-[#090B0D] font-bold text-xs transition shadow-sm active:scale-98 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 stroke-[2.2]" />
            <span>Add Academic Course</span>
          </button>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {/* Group 1: YOUR WORKSPACE */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-extrabold tracking-wider uppercase text-[#64748B]">
              Your Workspace
            </div>
            <div className="space-y-1">
              {workspaceItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-[#102427] text-[#35F2D0] border-l-2 border-[#35F2D0] font-bold shadow-xs'
                        : 'text-[#A1A8B3] hover:bg-[#101317] hover:text-[#F5F7FA]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-[#35F2D0]' : 'text-[#8B95A5]'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: STUDY TOOLS */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-extrabold tracking-wider uppercase text-[#64748B]">
              Study Tools
            </div>
            <div className="space-y-1">
              {studyToolItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-[#102427] text-[#35F2D0] border-l-2 border-[#35F2D0] font-bold shadow-xs'
                        : 'text-[#A1A8B3] hover:bg-[#101317] hover:text-[#F5F7FA]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-[#35F2D0]' : 'text-[#8B95A5]'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Footer / User Profile & Settings */}
        <div className="p-3 border-t border-[#262A30] bg-[#101317] shrink-0 space-y-2">
          <div className="flex items-center justify-between px-2">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold text-[#F5F7FA] truncate">
                {profile.name || 'Student Workspace'}
              </div>
              <div className="text-[10px] text-[#A1A8B3] truncate">
                {profile.institution || profile.department || 'Academic Profile'}
              </div>
            </div>
            <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#171A1E] text-[#35F2D0] border border-[#262A30] shrink-0 flex items-center gap-1">
              {authMode === 'cloud' ? <UserCheck className="w-2.5 h-2.5" /> : <HardDrive className="w-2.5 h-2.5" />}
              <span>{authMode === 'cloud' ? 'Cloud' : 'Local'}</span>
            </span>
          </div>

          {onSignOut && (
            <button
              type="button"
              onClick={() => {
                setMobileDrawerOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#A1A8B3] hover:text-rose-400 hover:bg-[#171A1E] transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit / Switch Workspace</span>
            </button>
          )}
        </div>
      </aside>

      {/* 4. Top Header Bar */}
      <header className="sticky top-0 z-20 bg-[#090B0D]/95 backdrop-blur-md border-b border-[#262A30] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Header Controls */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Circular Two-Line Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden w-11 h-11 rounded-full bg-[#101317] hover:bg-[#171A1E] text-[#F5F7FA] border border-[#262A30] hover:border-[#35F2D0]/40 flex items-center justify-center cursor-pointer transition shadow-sm shrink-0 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#35F2D0]/50"
                aria-label="Open navigation menu"
                aria-expanded={mobileDrawerOpen}
                aria-controls="mobile-navigation-drawer"
              >
                <TwoLinesIcon className="w-5 h-5 text-[#F5F7FA]" />
              </button>

              {/* Mobile Polyvex Logo */}
              <div className="lg:hidden flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTabClick('dashboard')}
                  className="flex items-center gap-2 text-left cursor-pointer focus:outline-none rounded-lg p-1 group min-w-0"
                >
                  <PolyvexLogo size={32} showWordmark={true} />
                </button>
              </div>

              {/* Desktop Active View Title & Breadcrumb */}
              <div className="hidden lg:flex items-center gap-2.5">
                <span className="text-sm font-bold text-[#F5F7FA]">
                  {allNavItems.find((i) => i.id === currentTab)?.label || 'Workspace'}
                </span>
                <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-[#171A1E] text-[#35F2D0] border border-[#262A30]">
                  POLYVEX OS
                </span>
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Primary Quick Action: Add Courses */}
              <div className="inline-flex items-center rounded-lg shadow-sm border border-[#35F2D0]/40 overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={onOpenAddCourse}
                  className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 sm:px-3 bg-[#35F2D0] hover:bg-[#35F2D0]/90 text-[#090B0D] text-xs font-bold cursor-pointer transition active:scale-95"
                  aria-label="Add Courses"
                  title="Add a new academic course"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
                  <span className="hidden sm:inline whitespace-nowrap">Add Courses</span>
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setQuickAddOpen(!quickAddOpen)}
                    className="h-8 w-8 bg-[#27d9b9] hover:bg-[#20bd9f] text-[#090B0D] border-l border-[#1fa78d]/70 cursor-pointer transition flex items-center justify-center shrink-0 active:scale-95"
                    aria-label="More quick actions"
                    title="Quick add coursework, classes, practicals, or revision"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>

                  {quickAddOpen && (
                    <div className="absolute right-0 mt-1.5 w-48 sm:w-52 bg-[#171A1E] border border-[#262A30] rounded-xl shadow-2xl py-1 z-50 text-xs animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenAddCourse) onOpenAddCourse();
                          setQuickAddOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-[#20252C] text-[#35F2D0] flex items-center gap-2.5 cursor-pointer font-semibold"
                      >
                        <BookOpen className="w-4 h-4 text-[#35F2D0]" />
                        <span>Add Courses</span>
                      </button>
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
              </div>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={onToggleTheme}
                className="h-8 w-8 flex items-center justify-center text-[#A1A8B3] hover:text-[#F5F7FA] hover:bg-[#171A1E] rounded-lg border border-transparent hover:border-[#262A30] cursor-pointer transition shrink-0"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Sign Out Action if requested */}
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 text-xs text-[#A1A8B3] hover:text-rose-400 hover:bg-[#171A1E] rounded-lg border border-[#262A30] transition cursor-pointer shrink-0"
                  title="Sign Out / Switch Workspace"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
