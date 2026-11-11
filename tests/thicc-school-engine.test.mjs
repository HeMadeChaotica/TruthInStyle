import assert from 'node:assert/strict';
import test from 'node:test';

import { THICC_SCHOOL_COURSES, THICC_SCHOOL_MASTERY_SCORE, THICC_SCHOOL_RESERVED_DATES } from '../lib/thiccSchool/catalog.mjs';
import {
  buildRolloverCalendarEntries,
  createDefaultSchoolState,
  getSectionMasteryGates,
  getSectionQuestions,
  gradePracticeQuestions,
  nextAvailableStudyDate,
  normalizeSchoolState,
  recordPracticeAttempt,
  recordSectionPracticeAttempt,
  rollForwardMissedSections,
  setSectionCompletion,
  updateSectionStudyProgress,
  updateSectionDetails,
} from '../lib/thiccSchool/schoolEngine.mjs';

test('catalog preserves verified curriculum, the 95 percent gate, and birthday protection', () => {
  assert.equal(THICC_SCHOOL_MASTERY_SCORE, 95);
  assert.deepEqual(THICC_SCHOOL_RESERVED_DATES, ['2026-12-22']);
  const cpt = THICC_SCHOOL_COURSES.find((course) => course.id === 'cpt');
  const nutrition = THICC_SCHOOL_COURSES.find((course) => course.id === 'nutrition');
  assert.match(cpt.sections[0].title, /FOUNDATIONS OF HEALTH & BEHAVIOR/);
  assert.match(nutrition.sections[0].title, /FOUNDATIONS OF NUTRITION/);
  assert.equal(THICC_SCHOOL_COURSES.flatMap((course) => course.sections).some((item) => item.assignedDate === '2026-12-22'), false);
});

test('next study day always leaves December 22 open', () => {
  assert.equal(nextAvailableStudyDate('2026-12-21'), '2026-12-23');
});

test('unfinished work rolls to the next available day and adds reserved time', () => {
  const state = createDefaultSchoolState();
  Object.values(state.courses).forEach((course) => Object.values(course.sections).forEach((section) => {
    section.status = 'complete';
  }));
  const item = state.courses.cpr.sections['cpr-guided-1'];
  item.assignedDate = '2026-12-21';
  item.minutes = 120;
  item.status = 'not_started';
  const { state: movedState, moved } = rollForwardMissedSections(state, '2026-12-22', { dailyCapacityMinutes: 360 });
  const movedItem = movedState.courses.cpr.sections['cpr-guided-1'];
  assert.equal(moved.length, 1);
  assert.equal(movedItem.assignedDate, '2026-12-23');
  assert.equal(movedItem.rolloverCount, 1);
  assert.equal(movedItem.status, 'rolled_over');
  const calendarEntry = buildRolloverCalendarEntries(movedState).find((entry) => entry.id.includes('cpr-guided-1'));
  assert.equal(calendarEntry.date_key, '2026-12-23');
  assert.equal(calendarEntry.detail, '120 MINUTES RESERVED');
  assert.match(calendarEntry.label, /THICC.SCHOOL ROLLOVER/);
});

test('practice gate passes at 95 and requires another attempt below 95', () => {
  const questions = Array.from({ length: 20 }, (_, index) => ({
    id: `q-${index}`,
    topic: index === 19 ? 'repair topic' : 'core topic',
    answer: 0,
    rationale: 'Original practice rationale.',
  }));
  const perfectAnswers = Object.fromEntries(questions.map((question) => [question.id, 0]));
  const ninetyFiveAnswers = { ...perfectAnswers, 'q-19': 1 };
  const ninetyAnswers = { ...ninetyFiveAnswers, 'q-18': 1 };
  assert.equal(gradePracticeQuestions(questions, ninetyFiveAnswers).score, 95);
  assert.equal(gradePracticeQuestions(questions, ninetyFiveAnswers).passed, true);
  assert.equal(gradePracticeQuestions(questions, ninetyAnswers).score, 90);
  assert.equal(gradePracticeQuestions(questions, ninetyAnswers).passed, false);
});

test('saved completion and editable course details survive catalog normalization', () => {
  let state = createDefaultSchoolState();
  state = setSectionCompletion(state, 'cpt', 'cpt-1', true, '2026-11-16T20:00:00.000Z');
  state = updateSectionDetails(state, 'bodybuilding', 'bodybuilding-chapter-1', {
    title: 'VERIFIED PORTAL CHAPTER',
    assignedDate: '2026-12-18',
    minutes: 210,
    guide: 'Verified objectives and study notes.',
  });
  const normalized = normalizeSchoolState(state);
  assert.equal(normalized.courses.cpt.sections['cpt-1'].status, 'complete');
  assert.equal(normalized.courses.bodybuilding.sections['bodybuilding-chapter-1'].title, 'VERIFIED PORTAL CHAPTER');
  assert.equal(normalized.courses.bodybuilding.sections['bodybuilding-chapter-1'].minutes, 210);
});

test('every CPT learning module has a 15-question original practice form', () => {
  for (let moduleNumber = 1; moduleNumber <= 10; moduleNumber += 1) {
    const questions = getSectionQuestions('cpt', `cpt-${moduleNumber}`, 0, 15);
    assert.equal(questions.length, 15);
    assert.equal(new Set(questions.map((question) => question.id)).size, 15);
    assert.equal(questions.every((question) => question.sectionId === `cpt-${moduleNumber}`), true);
  }
});

test('module retakes rotate question order and answer positions', () => {
  const first = getSectionQuestions('cpt', 'cpt-1', 0, 15);
  const retake = getSectionQuestions('cpt', 'cpt-1', 1, 15);
  assert.notDeepEqual(first.map((question) => question.id), retake.map((question) => question.id));
  assert.ok(new Set(first.map((question) => question.answer)).size > 1);
  assert.notDeepEqual(first.map((question) => question.options), retake.map((question) => question.options));
});

test('module completion is automatic only after ISSA, study work, and 95 percent practice', () => {
  let state = createDefaultSchoolState();
  state = updateSectionStudyProgress(state, 'cpt', 'cpt-1', {
    issaCompleted: true,
    studyNotes: 'Scope, communication, and behavior-change applications.',
    recallNotes: 'Refer outside scope and use client-centered process goals.',
  }, '2026-11-16T20:00:00.000Z');
  assert.deepEqual(getSectionMasteryGates(state.courses.cpt.sections['cpt-1']), {
    issa: true,
    notes: true,
    practice: false,
    complete: false,
  });
  const questions = getSectionQuestions('cpt', 'cpt-1', 0, 15);
  const answers = Object.fromEntries(questions.map((question) => [question.id, question.answer]));
  const recorded = recordSectionPracticeAttempt(state, 'cpt', 'cpt-1', questions, answers, '2026-11-16T21:00:00.000Z');
  assert.equal(recorded.result.score, 100);
  assert.equal(recorded.state.courses.cpt.sections['cpt-1'].status, 'complete');
  assert.equal(getSectionMasteryGates(recorded.state.courses.cpt.sections['cpt-1']).complete, true);
});

test('cumulative practice supplies the final-section practice gate without completing ISSA for the user', () => {
  let state = createDefaultSchoolState();
  state = updateSectionStudyProgress(state, 'cpt', 'cpt-final', {
    studyNotes: 'Cumulative review notes.',
    recallNotes: 'Weak domains repaired.',
    issaCompleted: false,
  });
  const questions = Array.from({ length: 20 }, (_, index) => ({ id: `final-${index}`, topic: 'cumulative', prompt: 'Prompt', options: ['A', 'B'], answer: 0, rationale: 'A' }));
  const answers = Object.fromEntries(questions.map((question) => [question.id, 0]));
  const recorded = recordPracticeAttempt(state, 'cpt', questions, answers, '2026-12-14T18:00:00.000Z');
  assert.equal(recorded.state.courses.cpt.sections['cpt-final'].practiceBestScore, 100);
  assert.equal(recorded.state.courses.cpt.sections['cpt-final'].status, 'not_started');
  assert.equal(recorded.state.courses.cpt.sections['cpt-final'].issaCompleted, false);
});
