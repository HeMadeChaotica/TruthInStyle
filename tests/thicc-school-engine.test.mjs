import assert from 'node:assert/strict';
import test from 'node:test';

import { THICC_SCHOOL_COURSES, THICC_SCHOOL_MASTERY_SCORE, THICC_SCHOOL_RESERVED_DATES } from '../lib/thiccSchool/catalog.mjs';
import { CPT_SOURCE, NUTRITION_SOURCE, VERIFIED_MODULE_SOURCES } from '../lib/thiccSchool/sourceCurriculum.mjs';
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
  assert.equal(nutrition.deadline, '2027-01-31');
  assert.equal(THICC_SCHOOL_COURSES.flatMap((course) => course.sections).some((item) => item.assignedDate === '2026-12-22'), false);
  assert.equal(cpt.verifiedMaterial, true);
  assert.equal(nutrition.verifiedMaterial, true);
});

test('verified source maps cover every attached textbook chapter exactly once', () => {
  assert.equal(CPT_SOURCE.chapters.length, 20);
  assert.equal(NUTRITION_SOURCE.chapters.length, 18);
  const cptMapped = Object.values(VERIFIED_MODULE_SOURCES.cpt).flatMap((module) => module.chapters.map((chapter) => chapter.number));
  const nutritionMapped = Object.values(VERIFIED_MODULE_SOURCES.nutrition).flatMap((module) => module.chapters.map((chapter) => chapter.number));
  assert.deepEqual(cptMapped, Array.from({ length: 20 }, (_, index) => index + 1));
  assert.deepEqual(nutritionMapped, Array.from({ length: 18 }, (_, index) => index + 1));
  assert.equal(CPT_SOURCE.chapters.find((chapter) => chapter.number === 1).workbookPages, '');
  assert.equal(CPT_SOURCE.chapters.find((chapter) => chapter.number === 14).workbookPages, '');
});

test('next study day always leaves December 22 open', () => {
  assert.equal(nextAvailableStudyDate('2026-12-21'), '2026-12-23');
});

test('unfinished work rolls to the next available day and adds reserved time', () => {
  const state = createDefaultSchoolState();
  Object.values(state.courses).forEach((course) => Object.values(course.sections).forEach((section) => {
    section.status = 'complete';
    if (course.verifiedMaterial) {
      section.issaCompleted = true;
      section.textbookCompleted = true;
      section.workbookCompleted = true;
      section.practiceBestScore = 100;
    }
  }));
  const item = state.courses.cpt.sections['cpt-1'];
  item.assignedDate = '2026-12-21';
  item.minutes = 120;
  item.status = 'not_started';
  item.issaCompleted = false;
  const { state: movedState, moved } = rollForwardMissedSections(state, '2026-12-22', { dailyCapacityMinutes: 360 });
  const movedItem = movedState.courses.cpt.sections['cpt-1'];
  assert.equal(moved.length, 1);
  assert.equal(movedItem.assignedDate, '2026-12-23');
  assert.equal(movedItem.rolloverCount, 1);
  assert.equal(movedItem.status, 'rolled_over');
  const calendarEntry = buildRolloverCalendarEntries(movedState).find((entry) => entry.id.includes('cpt-1'));
  assert.equal(calendarEntry.date_key, '2026-12-23');
  assert.equal(calendarEntry.detail, '120 MINUTES RESERVED');
  assert.match(calendarEntry.label, /THICC.SCHOOL ROLLOVER/);
});

test('unsupported placeholder courses do not create rollover work', () => {
  const state = createDefaultSchoolState();
  Object.values(state.courses).forEach((course) => Object.values(course.sections).forEach((section) => {
    section.status = 'complete';
  }));
  const unsupported = state.courses.cpr.sections['cpr-guided-1'];
  unsupported.assignedDate = '2026-11-01';
  unsupported.status = 'not_started';
  const { state: movedState, moved } = rollForwardMissedSections(state, '2026-11-11');
  assert.equal(moved.length, 0);
  assert.equal(movedState.courses.cpr.sections['cpr-guided-1'].assignedDate, '2026-11-01');
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

test('verified completion and editable course details survive catalog normalization', () => {
  let state = createDefaultSchoolState();
  state = updateSectionStudyProgress(state, 'cpt', 'cpt-1', {
    issaCompleted: true,
    textbookCompleted: true,
    workbookCompleted: true,
  }, '2026-11-16T20:00:00.000Z');
  const questions = getSectionQuestions('cpt', 'cpt-1', 0, 15);
  const answers = Object.fromEntries(questions.map((question) => [question.id, question.answer]));
  state = recordSectionPracticeAttempt(state, 'cpt', 'cpt-1', questions, answers, '2026-11-16T21:00:00.000Z').state;
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

test('legacy manual completion is cleared unless every verified mastery gate is satisfied', () => {
  const state = createDefaultSchoolState();
  state.courses.cpt.sections['cpt-1'].status = 'complete';
  state.courses.cpt.sections['cpt-1'].completedAt = '2026-11-01T12:00:00.000Z';
  const normalized = normalizeSchoolState(state);
  assert.equal(normalized.courses.cpt.sections['cpt-1'].status, 'not_started');
  assert.equal(normalized.courses.cpt.sections['cpt-1'].completedAt, '');
});

test('every CPT learning module has a 15-question original practice form', () => {
  for (let moduleNumber = 1; moduleNumber <= 10; moduleNumber += 1) {
    const questions = getSectionQuestions('cpt', `cpt-${moduleNumber}`, 0, 15);
    assert.equal(questions.length, 15);
    assert.equal(new Set(questions.map((question) => question.id)).size, 15);
    assert.equal(questions.every((question) => question.sectionId === `cpt-${moduleNumber}`), true);
  }
});

test('every Nutrition learning module has a source-based practice form', () => {
  for (let moduleNumber = 1; moduleNumber <= 10; moduleNumber += 1) {
    const questions = getSectionQuestions('nutrition', `nutrition-${moduleNumber}`, 0, 15);
    assert.equal(questions.length, 10);
    assert.equal(new Set(questions.map((question) => question.id)).size, 10);
    assert.equal(questions.every((question) => question.sectionId === `nutrition-${moduleNumber}`), true);
  }
});

test('module retakes rotate question order and answer positions', () => {
  const first = getSectionQuestions('cpt', 'cpt-1', 0, 15);
  const retake = getSectionQuestions('cpt', 'cpt-1', 1, 15);
  assert.notDeepEqual(first.map((question) => question.id), retake.map((question) => question.id));
  assert.ok(new Set(first.map((question) => question.answer)).size > 1);
  assert.notDeepEqual(first.map((question) => question.options), retake.map((question) => question.options));
});

test('module completion is automatic only after source work, ISSA, and 95 percent practice', () => {
  let state = createDefaultSchoolState();
  state = updateSectionStudyProgress(state, 'cpt', 'cpt-1', {
    issaCompleted: true,
    textbookCompleted: true,
    workbookCompleted: true,
  }, '2026-11-16T20:00:00.000Z');
  assert.deepEqual(getSectionMasteryGates(state.courses.cpt.sections['cpt-1']), {
    issa: true,
    textbookRequired: true,
    textbook: true,
    workbookRequired: true,
    workbook: true,
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
