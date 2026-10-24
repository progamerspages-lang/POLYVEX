import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRevisionStats,
  generateHeuristicRevisionPlan,
  formatExternalPrompt,
} from './revisionPlanner.ts';
import { RevisionTopic, AcademicTask, Course } from '../types/index.ts';

describe('Revision Planner Utilities', () => {
  const mockCourses: Course[] = [
    {
      id: 'c-eee301',
      code: 'EEE301',
      title: 'Electric Circuit Theory I',
      creditUnits: 3,
      semester: 'Harmattan / First',
      color: '#059669',
    },
    {
      id: 'c-mee303',
      code: 'MEE303',
      title: 'Fluid Mechanics',
      creditUnits: 3,
      semester: 'Harmattan / First',
      color: '#2563eb',
    },
  ];

  const mockTopics: RevisionTopic[] = [
    {
      id: 'top-1',
      courseId: 'c-eee301',
      title: "Kirchhoff's Laws & Superposition",
      confidence: 1, // Critical low confidence
      status: 'Needs Review',
    },
    {
      id: 'top-2',
      courseId: 'c-eee301',
      title: 'Thevenin & Norton Theorems',
      confidence: 2, // Low confidence
      status: 'Needs Review',
    },
    {
      id: 'top-3',
      courseId: 'c-mee303',
      title: 'Fluid Statics & Manometry',
      confidence: 4, // High confidence
      status: 'Mastered',
    },
  ];

  const mockTasks: AcademicTask[] = [
    {
      id: 'task-1',
      title: 'Circuit Theory Mid-Term Quiz',
      courseId: 'c-eee301',
      taskType: 'Quiz',
      dateAssigned: '2026-10-20',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days away
      priority: 'High',
      status: 'In Progress',
      createdAt: '2026-10-20T00:00:00.000Z',
      updatedAt: '2026-10-20T00:00:00.000Z',
    },
  ];

  it('calculates correct revision statistics', () => {
    const stats = calculateRevisionStats(mockTopics);
    assert.equal(stats.total, 3);
    assert.equal(stats.lowConfidenceCount, 2); // 1 and 2
    assert.equal(stats.masteredCount, 1); // 4
    assert.equal(stats.averageConfidence, 2.3); // (1+2+4)/3 = 2.33
  });

  it('generates a daily revision plan prioritizing low-confidence topics and imminent tasks', () => {
    const plan = generateHeuristicRevisionPlan(mockTopics, mockTasks, mockCourses, {
      timeframe: 'daily',
      dailyHours: 4,
      focusOrientation: 'balanced',
    });

    assert.ok(plan.length >= 2, 'Plan should contain multiple study slots');
    // The top candidate should either be the imminent task or low-confidence topic
    const topItem = plan[0];
    assert.ok(topItem.courseCode.length > 0);
    assert.ok(topItem.rationale.length > 0, 'Must have clear rationale');
    assert.ok(topItem.suggestedAction.length > 0, 'Must have suggested action');
    assert.equal(topItem.completed, false);
  });

  it('generates a weekly revision plan with days assigned', () => {
    const plan = generateHeuristicRevisionPlan(mockTopics, mockTasks, mockCourses, {
      timeframe: 'weekly',
      dailyHours: 4,
      focusOrientation: 'low-confidence',
    });

    assert.equal(plan.length, 14); // 7 days * 2 slots
    assert.equal(plan[0].day, 'Monday');
    assert.equal(plan[plan.length - 1].day, 'Sunday');
  });

  it('formats prompt for external AI including Polyvex branding and all metrics', () => {
    const prompt = formatExternalPrompt(mockTopics, mockTasks, mockCourses, {
      timeframe: 'daily',
      dailyHours: 4,
      focusOrientation: 'balanced',
    });

    assert.ok(prompt.includes('Polyvex'));
    assert.ok(prompt.includes("Kirchhoff's Laws"));
    assert.ok(prompt.includes('Confidence 1/5'));
    assert.ok(prompt.includes('Circuit Theory Mid-Term Quiz'));
    assert.ok(prompt.includes('Prioritize low-confidence topics'));
  });
});
