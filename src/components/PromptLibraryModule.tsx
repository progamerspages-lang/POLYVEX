import React from 'react';
import { AIStudyResourcesModule } from './AIStudyResourcesModule.tsx';
import { Course, StudyResource } from '../types/index.ts';

interface PromptLibraryModuleProps {
  courses: Course[];
  studentLevel?: string;
  resources?: StudyResource[];
  onUseInAssistant?: (courseId: string, promptText: string) => void;
  onNavigate?: (tab: any) => void;
  onOpenReportDraft?: (reportId?: string, practicalId?: string, courseId?: string, experimentTitle?: string) => void;
}

/**
 * AI Study Resources Hub (formerly PromptLibraryModule)
 * Transformed into task-specific AI Study Resources with real AI integration.
 */
export const PromptLibraryModule: React.FC<PromptLibraryModuleProps> = (props) => {
  return <AIStudyResourcesModule {...props} />;
};

export default PromptLibraryModule;
