import assert from 'node:assert/strict';
import test from 'node:test';

import { THICC_SCHOOL_COURSES, THICC_SCHOOL_MASTERY_SCORE, THICC_SCHOOL_RESERVED_DATES } from '../lib/thiccSchool/catalog.mjs';
import { CPT_SOURCE, NUTRITION_SOURCE, VERIFIED_MODULE_SOURCES } from '../lib/thiccSchool/sourceCurriculum.mjs';
import { CPT_WORKBOOK_FIELD_COUNT } from '../lib/thiccSchool/cptWorkbookLayout.mjs';
import { getNutritionWorkbookAssignment, getNutritionWorkbookCompletion } from '../lib/thiccSchool/nutritionWorkbook.mjs';
import { getCptWorkbookAssignment, getCptWorkbookCompletion, getSourceWorkbookCompletion } from '../lib/thiccSchool/workbookAssignments.mjs';
import { assessCptWorkbookAnswer, assessWorkbookAnswer, parseWorkbookAssessment } from '../src/server/cptWorkbookAssessment.mjs';
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

const completeWorkbook = (state, courseId, sectionId) => {
  const item = state.courses[courseId].sections[sectionId];
  const assignment = item.sourcePlan?.workbookType === 'generated'
    ? getNutritionWorkbookAssignment(item.sourcePlan)
    : getCptWorkbookAssignment(item.sourcePlan);
  const workbookAnswers = Object.fromEntries(assignment.fieldIds.map((fieldId) => [fieldId, 'Completed source-grounded response.']));
  const workbookAssessments = Object.fromEntries(assignment.fieldIds.map((fieldId) => [fieldId, { accepted: true, score: 100, feedback: 'Accepted.', missingConcepts: [] }]));
  return updateSectionStudyProgress(state, courseId, sectionId, { workbookAnswers, workbookAssessments });
};

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
  assert.equal(CPT_SOURCE.workbookType, 'official');
  assert.equal(NUTRITION_SOURCE.workbookType, 'generated');
});

test('the attached CPT workbook is fully mapped into automatic module assignments', () => {
  assert.equal(CPT_WORKBOOK_FIELD_COUNT, 604);
  const assignedFieldIds = Object.entries(VERIFIED_MODULE_SOURCES.cpt)
    .filter(([sectionId]) => !sectionId.endsWith('-final'))
    .flatMap(([, sourcePlan]) => getCptWorkbookAssignment(sourcePlan).fieldIds);
  assert.equal(assignedFieldIds.length, 604);
  assert.equal(new Set(assignedFieldIds).size, 604);
});

test('the generated Nutrition workbook covers every assigned chapter with source-based fields', () => {
  const assignments = Object.values(VERIFIED_MODULE_SOURCES.nutrition).map(getNutritionWorkbookAssignment);
  const chapters = assignments.flatMap((assignment) => assignment.chapters.map((chapter) => chapter.number));
  const fields = assignments.flatMap((assignment) => assignment.fields);
  assert.deepEqual(chapters, Array.from({ length: 18 }, (_, index) => index + 1));
  assert.ok(fields.length >= 70);
  assert.equal(new Set(fields.map((field) => field.id)).size, fields.length);
  assert.equal(fields.every((field) => /textbook page|textbook pages|textbook page or page range/i.test(field.prompt)), true);
});

test('next study day always leaves December 22 open', () => {
  assert.equal(nextAvailableStudyDate('2026-12-21'), '2026-12-23');
});

test('unfinished work rolls to the next available day and adds reserved time', () => {
  let state = createDefaultSchoolState();
  Object.values(state.courses).forEach((course) => Object.values(course.sections).forEach((section) => {
    section.status = 'complete';
    if (course.verifiedMaterial) {
      section.issaCompleted = true;
      section.textbookCompleted = true;
      section.workbookCompleted = true;
      section.practiceBestScore = 100;
    }
  }));
  Object.values(state.courses.cpt.sections).forEach((section) => {
    if (getCptWorkbookAssignment(section.sourcePlan).fieldIds.length) state = completeWorkbook(state, 'cpt', section.id);
  });
  Object.values(state.courses.nutrition.sections).forEach((section) => {
    if (section.sourcePlan) state = completeWorkbook(state, 'nutrition', section.id);
  });
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
  }, '2026-11-16T20:00:00.000Z');
  state = completeWorkbook(state, 'cpt', 'cpt-1');
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
  }, '2026-11-16T20:00:00.000Z');
  state = completeWorkbook(state, 'cpt', 'cpt-1');
  assert.deepEqual(getSectionMasteryGates(state.courses.cpt.sections['cpt-1']), {
    issa: true,
    textbookRequired: true,
    textbook: true,
    workbookRequired: true,
    workbook: true,
    issaReady: true,
    workbookReady: true,
    practiceReady: true,
    practice: false,
    complete: false,
  });
  const questions = getSectionQuestions('cpt', 'cpt-1', 0, 15);
  const answers = Object.fromEntries(questions.map((question) => [question.id, question.answer]));
  const recorded = recordSectionPracticeAttempt(state, 'cpt', 'cpt-1', questions, answers, '2026-11-16T21:00:00.000Z');
  assert.equal(recorded.result.score, 100);
  assert.equal(recorded.state.courses.cpt.sections['cpt-1'].status, 'complete');
  assert.equal(getSectionMasteryGates(recorded.state.courses.cpt.sections['cpt-1']).complete, true);
  assert.equal(recorded.state.courses.cpt.sections['cpt-1'].passedPracticeReview.rows.length, 15);
  assert.equal(recorded.state.courses.cpt.sections['cpt-1'].passedPracticeReview.rows.every((row) => row.correctAnswer && row.rationale && row.topic), true);
});

test('module practice is blocked until the source-first stages are complete', () => {
  const state = createDefaultSchoolState();
  const questions = getSectionQuestions('cpt', 'cpt-1', 0, 15);
  const answers = Object.fromEntries(questions.map((question) => [question.id, question.answer]));
  const recorded = recordSectionPracticeAttempt(state, 'cpt', 'cpt-1', questions, answers);
  assert.equal(recorded.result.blocked, true);
  assert.equal(recorded.state.courses.cpt.sections['cpt-1'].practiceAttempts.length, 0);
});

test('workbook completion cannot be manually claimed and requires every accepted response', () => {
  let state = createDefaultSchoolState();
  state = updateSectionStudyProgress(state, 'cpt', 'cpt-1', { workbookCompleted: true });
  assert.equal(state.courses.cpt.sections['cpt-1'].workbookCompleted, false);
  const item = state.courses.cpt.sections['cpt-1'];
  const assignment = getCptWorkbookAssignment(item.sourcePlan);
  const workbookAnswers = Object.fromEntries(assignment.fieldIds.map((fieldId) => [fieldId, 'Response']));
  const workbookAssessments = Object.fromEntries(assignment.fieldIds.map((fieldId) => [fieldId, { accepted: true, score: 90 }]));
  const lastFieldId = assignment.fieldIds.at(-1);
  workbookAssessments[lastFieldId] = { accepted: false, score: 70 };
  state = updateSectionStudyProgress(state, 'cpt', 'cpt-1', { workbookAnswers, workbookAssessments });
  assert.equal(getCptWorkbookCompletion(item.sourcePlan, workbookAnswers, workbookAssessments).complete, false);
  assert.equal(state.courses.cpt.sections['cpt-1'].workbookCompleted, false);
  workbookAssessments[lastFieldId] = { accepted: true, score: 90 };
  state = updateSectionStudyProgress(state, 'cpt', 'cpt-1', { workbookAnswers, workbookAssessments });
  assert.equal(state.courses.cpt.sections['cpt-1'].workbookCompleted, true);
});

test('Nutrition workbook completion is cumulative and automatic', () => {
  let state = createDefaultSchoolState();
  const item = state.courses.nutrition.sections['nutrition-1'];
  const assignment = getNutritionWorkbookAssignment(item.sourcePlan);
  const workbookAnswers = Object.fromEntries(assignment.fieldIds.map((fieldId) => [fieldId, 'Source explanation with coaching application and textbook page 10.']));
  const workbookAssessments = Object.fromEntries(assignment.fieldIds.map((fieldId) => [fieldId, { accepted: true, score: 90 }]));
  workbookAssessments[assignment.fieldIds.at(-1)] = { accepted: false, score: 70 };
  state = updateSectionStudyProgress(state, 'nutrition', 'nutrition-1', { workbookAnswers, workbookAssessments });
  assert.equal(state.courses.nutrition.sections['nutrition-1'].workbookCompleted, false);
  workbookAssessments[assignment.fieldIds.at(-1)] = { accepted: true, score: 90 };
  state = updateSectionStudyProgress(state, 'nutrition', 'nutrition-1', { workbookAnswers, workbookAssessments });
  assert.equal(getNutritionWorkbookCompletion(item.sourcePlan, workbookAnswers, workbookAssessments).complete, true);
  assert.equal(getSourceWorkbookCompletion(item.sourcePlan, workbookAnswers, workbookAssessments).complete, true);
  assert.equal(state.courses.nutrition.sections['nutrition-1'].workbookCompleted, true);
});

test('instant workbook feedback enforces the 80 percent response gate', () => {
  assert.equal(parseWorkbookAssessment({ accepted: true, score: 79, feedback: 'Almost.', missingConcepts: ['scope'] }).accepted, false);
  assert.equal(parseWorkbookAssessment({ accepted: true, score: 95, feedback: 'Complete.', missingConcepts: [] }).accepted, true);
});

test('workbook assessment sends one source-grounded answer and reads structured feedback', async () => {
  const sourcePlan = VERIFIED_MODULE_SOURCES.cpt['cpt-1'];
  const assignment = getCptWorkbookAssignment(sourcePlan);
  const page = assignment.pages.find((candidate) => candidate.fields.length);
  const field = page.fields[0];
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-api-key-for-unit-test';
  let requestBody;
  const fetchMock = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ output: [{ content: [{ type: 'output_text', text: JSON.stringify({ accepted: true, score: 92, feedback: 'Source concepts are present.', missingConcepts: [] }) }] }] }),
    };
  };
  try {
    const result = await assessCptWorkbookAnswer({ sectionId: 'cpt-1', pageNumber: page.number, fieldId: field.id, answer: 'A source-grounded response.' }, fetchMock);
    assert.equal(result.accepted, true);
    assert.equal(result.score, 92);
    assert.match(requestBody.input[1].content[0].text, /Relevant attached CPT11 textbook excerpts/);
    assert.doesNotMatch(JSON.stringify(requestBody), /test-api-key-for-unit-test/);
  } finally {
    if (previousKey == null) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test('Nutrition workbook assessment uses attached Nutrition text and the existing protected server key fallback', async () => {
  const sourcePlan = VERIFIED_MODULE_SOURCES.nutrition['nutrition-1'];
  const field = getNutritionWorkbookAssignment(sourcePlan).fields[0];
  const previousOpenAiKey = process.env.OPENAI_API_KEY;
  const previousRenderKey = process.env.DAY_CAPSULE_RENDER_API_KEY;
  delete process.env.OPENAI_API_KEY;
  process.env.DAY_CAPSULE_RENDER_API_KEY = 'protected-render-key-for-unit-test';
  let requestBody;
  const fetchMock = async (_url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer protected-render-key-for-unit-test');
    requestBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ output: [{ content: [{ type: 'output_text', text: JSON.stringify({ accepted: true, score: 96, feedback: 'Complete source response.', missingConcepts: [] }) }] }] }),
    };
  };
  try {
    const result = await assessWorkbookAnswer({ courseId: 'nutrition', sectionId: 'nutrition-1', pageNumber: field.chapterNumber, fieldId: field.id, answer: 'Source explanation, coaching example, textbook page 10.' }, fetchMock);
    assert.equal(result.accepted, true);
    assert.match(requestBody.input[1].content[0].text, /Relevant attached Nutrition Coach textbook excerpts/);
    assert.doesNotMatch(JSON.stringify(requestBody), /protected-render-key-for-unit-test/);
  } finally {
    if (previousOpenAiKey == null) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousOpenAiKey;
    if (previousRenderKey == null) delete process.env.DAY_CAPSULE_RENDER_API_KEY;
    else process.env.DAY_CAPSULE_RENDER_API_KEY = previousRenderKey;
  }
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
