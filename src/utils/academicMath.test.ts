import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDaysRemaining,
  isValidTimeInterval,
  detectTimetableConflicts,
  calculateSuggestedNextReview,
  checkOhmLawCalculations,
  validateBackupSchema,
} from './academicMath.ts';
import { TimetableEntry } from '../types/index.ts';

test('calculateDaysRemaining accurately determines due today, due soon, upcoming and overdue', () => {
  const mockCurrentDate = new Date(2026, 9, 24); // Oct 24, 2026

  // Same day
  const dueToday = calculateDaysRemaining('2026-10-24', mockCurrentDate);
  assert.equal(dueToday.status, 'due-today');
  assert.equal(dueToday.daysRemaining, 0);
  assert.equal(dueToday.label, 'Due today');

  // Tomorrow
  const dueTomorrow = calculateDaysRemaining('2026-10-25', mockCurrentDate);
  assert.equal(dueTomorrow.status, 'due-soon');
  assert.equal(dueTomorrow.daysRemaining, 1);
  assert.equal(dueTomorrow.label, 'Due tomorrow');

  // 3 days away
  const due3Days = calculateDaysRemaining('2026-10-27', mockCurrentDate);
  assert.equal(due3Days.status, 'due-soon');
  assert.equal(due3Days.daysRemaining, 3);
  assert.equal(due3Days.label, 'Due in 3 days');

  // 10 days away
  const upcoming = calculateDaysRemaining('2026-11-03', mockCurrentDate);
  assert.equal(upcoming.status, 'upcoming');
  assert.equal(upcoming.daysRemaining, 10);

  // Past deadline (overdue)
  const overdue = calculateDaysRemaining('2026-10-20', mockCurrentDate);
  assert.equal(overdue.status, 'overdue');
  assert.equal(overdue.daysRemaining, -4);
  assert.equal(overdue.label, 'Overdue by 4 days');

  // No deadline
  const none = calculateDaysRemaining(undefined, mockCurrentDate);
  assert.equal(none.status, 'none');
  assert.equal(none.daysRemaining, null);
});

test('isValidTimeInterval validates start and end times', () => {
  assert.equal(isValidTimeInterval('08:00', '10:00'), true);
  assert.equal(isValidTimeInterval('14:30', '16:00'), true);
  assert.equal(isValidTimeInterval('10:00', '08:00'), false);
  assert.equal(isValidTimeInterval('09:00', '09:00'), false);
  assert.equal(isValidTimeInterval('invalid', '10:00'), false);
});

test('detectTimetableConflicts flags overlapping classes on same day', () => {
  const entries: TimetableEntry[] = [
    {
      id: 'entry-1',
      courseId: 'c1',
      dayOfWeek: 'Monday',
      startTime: '08:00',
      endTime: '10:00',
      venue: 'SEET Hall 1',
      activityType: 'lecture',
      recurring: true,
    },
    {
      id: 'entry-2',
      courseId: 'c2',
      dayOfWeek: 'Monday',
      startTime: '09:30', // Overlaps entry-1
      endTime: '11:30',
      venue: 'Physics Lab',
      activityType: 'laboratory',
      recurring: true,
    },
    {
      id: 'entry-3',
      courseId: 'c3',
      dayOfWeek: 'Monday',
      startTime: '12:00', // Non-overlapping
      endTime: '14:00',
      venue: 'Hall of Excellence',
      activityType: 'lecture',
      recurring: true,
    },
    {
      id: 'entry-4',
      courseId: 'c4',
      dayOfWeek: 'Tuesday', // Different day, same time as entry-1
      startTime: '08:00',
      endTime: '10:00',
      venue: 'SMAT Hall',
      activityType: 'lecture',
      recurring: true,
    },
  ];

  const conflicts = detectTimetableConflicts(entries);
  assert.equal(conflicts.has('entry-1'), true);
  assert.equal(conflicts.get('entry-1')?.includes('entry-2'), true);
  assert.equal(conflicts.has('entry-2'), true);
  assert.equal(conflicts.get('entry-2')?.includes('entry-1'), true);
  assert.equal(conflicts.has('entry-3'), false);
  assert.equal(conflicts.has('entry-4'), false);
});

test('calculateSuggestedNextReview maps confidence levels to spaced repetition intervals', () => {
  const base = new Date(2026, 9, 24); // 2026-10-24
  const rev1 = calculateSuggestedNextReview(1, base);
  assert.equal(rev1.intervalDays, 1);
  assert.equal(rev1.nextReviewDate, '2026-10-25');

  const rev3 = calculateSuggestedNextReview(3, base);
  assert.equal(rev3.intervalDays, 4);
  assert.equal(rev3.nextReviewDate, '2026-10-28');

  const rev5 = calculateSuggestedNextReview(5, base);
  assert.equal(rev5.intervalDays, 14);
  assert.equal(rev5.nextReviewDate, '2026-11-07');
});

test('checkOhmLawCalculations validates lab readings accurately', () => {
  // Consistent readings: V = 10V, I = 0.5A, R = 20 Ohm (0.5 * 20 = 10)
  const consistent = checkOhmLawCalculations(10, 0.5, 20);
  assert.equal(consistent.isConsistent, true);
  assert.equal(consistent.powerWatts, 5);

  // Inconsistent readings with high error: V = 15V, I = 0.5A, R = 20 Ohm (expected 10V)
  const inconsistent = checkOhmLawCalculations(15, 0.5, 20);
  assert.equal(inconsistent.isConsistent, false);
  assert.equal(inconsistent.discrepancyPercent !== undefined && inconsistent.discrepancyPercent > 5, true);

  // Partial calculation: V = 12V, R = 4 Ohm -> I = 3A
  const partialI = checkOhmLawCalculations(12, undefined, 4);
  assert.equal(partialI.isConsistent, true);
  assert.equal(partialI.computedCurrent, 3);
});

test('validateBackupSchema validates JSON backup data correctly', () => {
  const invalid = validateBackupSchema({ somethingElse: true });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.length > 0, true);

  const validData = {
    version: 1,
    profile: {
      name: 'Chidi Okonkwo',
      institution: 'Federal University of Technology, Owerri (FUTO)',
      department: 'Electrical & Electronic Engineering',
    },
    courses: [
      { id: 'c1', code: 'EEE 311', title: 'Electric Circuit Theory', creditUnits: 3, semester: 'Harmattan / First' },
    ],
    timetable: [],
    tasks: [],
    practicals: [],
  };

  const result = validateBackupSchema(validData);
  assert.equal(result.valid, true);
  assert.equal(result.sanitized?.courses[0].code, 'EEE 311');
});
