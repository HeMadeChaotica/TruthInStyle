import {
  THICC_SCHOOL_COURSES,
  THICC_SCHOOL_MASTERY_SCORE,
  THICC_SCHOOL_QUESTION_BANK,
  THICC_SCHOOL_RESERVED_DATES,
  THICC_SCHOOL_VERSION,
} from './catalog.mjs';
import { CPT_MODULE_QUESTION_BANK } from './cptModuleQuestions.mjs';
import { NUTRITION_MODULE_QUESTION_BANK } from './nutritionModuleQuestions.mjs';

const dateKey = (value) => {
  const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const addDays = (value, amount) => {
  const date = new Date(`${dateKey(value)}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return dateKey(date);
};

const clone = (value) => JSON.parse(JSON.stringify(value));

export function createDefaultSchoolState() {
  return {
    version: THICC_SCHOOL_VERSION,
    masteryScore: THICC_SCHOOL_MASTERY_SCORE,
    updatedAt: new Date(0).toISOString(),
    courses: Object.fromEntries(THICC_SCHOOL_COURSES.map((course) => [course.id, {
      id: course.id,
      title: course.title,
      short: course.short,
      deadline: course.deadline,
      portalCourseId: course.portalCourseId,
      portalStatus: course.portalStatus,
      verifiedMaterial: Boolean(course.verifiedMaterial),
      sourceSummary: course.sourceSummary || '',
      sections: Object.fromEntries(course.sections.map((item) => [item.id, {
        ...clone(item),
        status: 'not_started',
        completedAt: '',
        issaCompleted: false,
        textbookCompleted: false,
        workbookCompleted: false,
        studyNotes: '',
        recallNotes: '',
        practiceAttempts: [],
        practiceBestScore: 0,
        rolloverCount: 0,
        originalAssignedDate: item.assignedDate,
      }])),
      attempts: [],
    }])),
  };
}

export function normalizeSchoolState(value) {
  const defaults = createDefaultSchoolState();
  const incoming = value && typeof value === 'object' ? value : {};
  const normalized = { ...defaults, ...incoming, courses: {} };
  THICC_SCHOOL_COURSES.forEach((courseDefinition) => {
    const savedCourse = incoming.courses?.[courseDefinition.id] || {};
    normalized.courses[courseDefinition.id] = {
      ...defaults.courses[courseDefinition.id],
      ...savedCourse,
      sections: {},
      attempts: Array.isArray(savedCourse.attempts) ? savedCourse.attempts : [],
    };
    courseDefinition.sections.forEach((definition) => {
      const saved = savedCourse.sections?.[definition.id] || {};
      const normalizedSection = {
        ...defaults.courses[courseDefinition.id].sections[definition.id],
        ...saved,
        id: definition.id,
        sourcePlan: definition.sourcePlan ? clone(definition.sourcePlan) : null,
        issaCompleted: Boolean(saved.issaCompleted),
        textbookCompleted: Boolean(saved.textbookCompleted),
        workbookCompleted: Boolean(saved.workbookCompleted),
        studyNotes: typeof saved.studyNotes === 'string' ? saved.studyNotes : '',
        recallNotes: typeof saved.recallNotes === 'string' ? saved.recallNotes : '',
        practiceAttempts: Array.isArray(saved.practiceAttempts) ? saved.practiceAttempts : [],
        practiceBestScore: Number(saved.practiceBestScore || 0),
      };
      if (courseDefinition.verifiedMaterial) applyAutomaticSectionStatus(normalizedSection, normalizedSection.completedAt || new Date().toISOString());
      normalized.courses[courseDefinition.id].sections[definition.id] = normalizedSection;
    });
  });
  normalized.version = THICC_SCHOOL_VERSION;
  normalized.masteryScore = THICC_SCHOOL_MASTERY_SCORE;
  return normalized;
}

const isReserved = (value) => THICC_SCHOOL_RESERVED_DATES.includes(dateKey(value));

export function nextAvailableStudyDate(value) {
  let candidate = addDays(value, 1);
  while (isReserved(candidate)) candidate = addDays(candidate, 1);
  return candidate;
}

export function rollForwardMissedSections(value, todayValue, { dailyCapacityMinutes = 360 } = {}) {
  const state = normalizeSchoolState(value);
  const today = dateKey(todayValue);
  if (!today) return { state, moved: [] };

  const scheduledMinutes = {};
  Object.values(state.courses).filter((course) => course.verifiedMaterial).forEach((course) => Object.values(course.sections).forEach((item) => {
    if (item.status !== 'complete' && item.assignedDate >= today) {
      scheduledMinutes[item.assignedDate] = (scheduledMinutes[item.assignedDate] || 0) + Number(item.minutes || 0);
    }
  }));

  const moved = [];
  Object.values(state.courses).filter((course) => course.verifiedMaterial).forEach((course) => {
    Object.values(course.sections).forEach((item) => {
      if (item.status === 'complete' || !item.assignedDate || item.assignedDate >= today) return;
      let nextDate = nextAvailableStudyDate(today);
      const minutes = Number(item.minutes || 0);
      while ((scheduledMinutes[nextDate] || 0) > 0 && (scheduledMinutes[nextDate] || 0) + minutes > dailyCapacityMinutes) nextDate = nextAvailableStudyDate(nextDate);
      const previousDate = item.assignedDate;
      item.assignedDate = nextDate;
      item.rolloverCount = Number(item.rolloverCount || 0) + 1;
      item.status = 'rolled_over';
      scheduledMinutes[nextDate] = (scheduledMinutes[nextDate] || 0) + minutes;
      moved.push({ courseId: course.id, sectionId: item.id, previousDate, nextDate, minutes });
    });
  });
  if (moved.length) state.updatedAt = new Date().toISOString();
  return { state, moved };
}

export function setSectionCompletion(value, courseId, sectionId, complete, completedAt = new Date().toISOString()) {
  const state = normalizeSchoolState(value);
  const item = state.courses?.[courseId]?.sections?.[sectionId];
  if (!item) return state;
  item.status = complete ? 'complete' : 'not_started';
  item.completedAt = complete ? completedAt : '';
  state.updatedAt = new Date().toISOString();
  return state;
}

export function updateSectionDetails(value, courseId, sectionId, updates = {}) {
  const state = normalizeSchoolState(value);
  const item = state.courses?.[courseId]?.sections?.[sectionId];
  if (!item) return state;
  const safe = {};
  if (typeof updates.title === 'string' && updates.title.trim()) safe.title = updates.title.trim();
  if (typeof updates.guide === 'string') safe.guide = updates.guide.trim();
  if (typeof updates.assignedDate === 'string' && dateKey(updates.assignedDate)) safe.assignedDate = dateKey(updates.assignedDate);
  if (Number.isFinite(Number(updates.minutes)) && Number(updates.minutes) > 0) safe.minutes = Math.round(Number(updates.minutes));
  Object.assign(item, safe);
  state.updatedAt = new Date().toISOString();
  return state;
}

const sourceRequirements = (item) => {
  const chapters = Array.isArray(item?.sourcePlan?.chapters) ? item.sourcePlan.chapters : [];
  return {
    textbook: chapters.length > 0,
    workbook: chapters.some((chapter) => Boolean(chapter?.workbookPages)),
  };
};

const applyAutomaticSectionStatus = (item, completedAt = new Date().toISOString()) => {
  const required = sourceRequirements(item);
  const mastered = Boolean(item?.issaCompleted)
    && (!required.textbook || Boolean(item?.textbookCompleted))
    && (!required.workbook || Boolean(item?.workbookCompleted))
    && Number(item?.practiceBestScore || 0) >= THICC_SCHOOL_MASTERY_SCORE;
  item.status = mastered ? 'complete' : (Number(item.rolloverCount || 0) > 0 ? 'rolled_over' : 'not_started');
  item.completedAt = mastered ? (item.completedAt || completedAt) : '';
  return mastered;
};

export function updateSectionStudyProgress(value, courseId, sectionId, updates = {}, updatedAt = new Date().toISOString()) {
  const state = normalizeSchoolState(value);
  const item = state.courses?.[courseId]?.sections?.[sectionId];
  if (!item) return state;
  if (typeof updates.issaCompleted === 'boolean') item.issaCompleted = updates.issaCompleted;
  if (typeof updates.textbookCompleted === 'boolean') item.textbookCompleted = updates.textbookCompleted;
  if (typeof updates.workbookCompleted === 'boolean') item.workbookCompleted = updates.workbookCompleted;
  if (typeof updates.studyNotes === 'string') item.studyNotes = updates.studyNotes.trim();
  if (typeof updates.recallNotes === 'string') item.recallNotes = updates.recallNotes.trim();
  applyAutomaticSectionStatus(item, updatedAt);
  state.updatedAt = updatedAt;
  return state;
}

const rotateQuestionOptions = (question, shiftValue) => {
  const options = Array.isArray(question.options) ? question.options : [];
  if (!options.length) return { ...question };
  const shift = ((Number(shiftValue) % options.length) + options.length) % options.length;
  return {
    ...question,
    options: [...options.slice(shift), ...options.slice(0, shift)],
    answer: (Number(question.answer) - shift + options.length) % options.length,
  };
};

export function getCourseQuestions(courseId, attemptIndex = 0, limit = 20) {
  const sourceBank = courseId === 'cpt'
    ? CPT_MODULE_QUESTION_BANK
    : courseId === 'nutrition'
      ? NUTRITION_MODULE_QUESTION_BANK
      : THICC_SCHOOL_QUESTION_BANK;
  const pool = sourceBank.filter((question) => question.courses.includes(courseId));
  if (!pool.length) return [];
  const count = Math.min(limit, pool.length);
  const stride = Math.max(1, Math.floor(pool.length / count));
  const selected = Array.from({ length: count }, (_, index) => pool[(attemptIndex + (index * stride)) % pool.length]);
  return selected.map((question, index) => rotateQuestionOptions(question, attemptIndex + index));
}

export function getSectionQuestions(courseId, sectionId, attemptIndex = 0, limit = 15) {
  const sourceBank = courseId === 'cpt'
    ? CPT_MODULE_QUESTION_BANK
    : courseId === 'nutrition'
      ? NUTRITION_MODULE_QUESTION_BANK
      : THICC_SCHOOL_QUESTION_BANK;
  const sectionPool = sourceBank.filter((question) => question.courses.includes(courseId) && question.sectionId === sectionId);
  if (!sectionPool.length) return [];
  const offset = attemptIndex % sectionPool.length;
  const rotated = [...sectionPool.slice(offset), ...sectionPool.slice(0, offset)];
  return rotated.slice(0, Math.min(limit, rotated.length)).map((question, index) => rotateQuestionOptions(question, attemptIndex + index));
}

export function gradePracticeQuestions(questions = [], answers = {}) {
  const results = questions.map((question) => ({
    id: question.id,
    topic: question.topic,
    correct: Number(answers[question.id]) === question.answer,
    selected: answers[question.id],
    answer: question.answer,
    rationale: question.rationale,
  }));
  const correct = results.filter((result) => result.correct).length;
  const score = results.length ? Math.round((correct / results.length) * 100) : 0;
  return {
    score,
    correct,
    total: results.length,
    passed: results.length > 0 && score >= THICC_SCHOOL_MASTERY_SCORE,
    weakTopics: [...new Set(results.filter((result) => !result.correct).map((result) => result.topic))],
    results,
  };
}

export function recordPracticeAttempt(value, courseId, questions, answers, takenAt = new Date().toISOString()) {
  const state = normalizeSchoolState(value);
  const course = state.courses?.[courseId];
  if (!course) return { state, result: gradePracticeQuestions([], {}) };
  const result = gradePracticeQuestions(questions, answers);
  course.attempts.push({
    id: `${courseId}-attempt-${takenAt}`,
    takenAt,
    score: result.score,
    passed: result.passed,
    weakTopics: result.weakTopics,
    questionIds: questions.map((question) => question.id),
  });
  const finalSection = course.sections?.[`${courseId}-final`];
  if (finalSection) {
    finalSection.practiceBestScore = Math.max(Number(finalSection.practiceBestScore || 0), result.score);
    finalSection.practiceAttempts.push({
      id: `${finalSection.id}-cumulative-${takenAt}`,
      takenAt,
      score: result.score,
      passed: result.passed,
      weakTopics: result.weakTopics,
      questionIds: questions.map((question) => question.id),
    });
    applyAutomaticSectionStatus(finalSection, takenAt);
  }
  state.updatedAt = new Date().toISOString();
  return { state, result };
}

export function recordSectionPracticeAttempt(value, courseId, sectionId, questions, answers, takenAt = new Date().toISOString()) {
  const state = normalizeSchoolState(value);
  const item = state.courses?.[courseId]?.sections?.[sectionId];
  if (!item) return { state, result: gradePracticeQuestions([], {}) };
  const result = gradePracticeQuestions(questions, answers);
  item.practiceAttempts.push({
    id: `${sectionId}-attempt-${takenAt}`,
    takenAt,
    score: result.score,
    passed: result.passed,
    weakTopics: result.weakTopics,
    questionIds: questions.map((question) => question.id),
  });
  item.practiceBestScore = Math.max(Number(item.practiceBestScore || 0), result.score);
  applyAutomaticSectionStatus(item, takenAt);
  state.updatedAt = takenAt;
  return { state, result };
}

export function getSectionMasteryGates(item) {
  const required = sourceRequirements(item);
  return {
    issa: Boolean(item?.issaCompleted),
    textbookRequired: required.textbook,
    textbook: !required.textbook || Boolean(item?.textbookCompleted),
    workbookRequired: required.workbook,
    workbook: !required.workbook || Boolean(item?.workbookCompleted),
    practice: Number(item?.practiceBestScore || 0) >= THICC_SCHOOL_MASTERY_SCORE,
    complete: item?.status === 'complete',
  };
}

export function summarizeSchoolState(value) {
  const state = normalizeSchoolState(value);
  const courses = Object.values(state.courses).filter((course) => course.verifiedMaterial);
  const sections = courses.flatMap((course) => Object.values(course.sections));
  const complete = sections.filter((item) => item.status === 'complete').length;
  const remainingMinutes = sections.filter((item) => item.status !== 'complete').reduce((sum, item) => sum + Number(item.minutes || 0), 0);
  const attempts = courses.flatMap((course) => [
    ...(course.attempts || []),
    ...Object.values(course.sections || {}).flatMap((item) => item.practiceAttempts || []),
  ]);
  const bestScore = attempts.reduce((best, attempt) => Math.max(best, Number(attempt.score || 0)), 0);
  return {
    totalSections: sections.length,
    completeSections: complete,
    completionPercent: sections.length ? Math.round((complete / sections.length) * 100) : 0,
    remainingMinutes,
    bestScore,
    masteredCourses: courses.filter((course) => (course.attempts || []).some((attempt) => attempt.score >= THICC_SCHOOL_MASTERY_SCORE)).length,
  };
}

export function buildRolloverCalendarEntries(value) {
  const state = normalizeSchoolState(value);
  return Object.values(state.courses).filter((course) => course.verifiedMaterial).flatMap((course) => Object.values(course.sections)
    .filter((item) => item.status !== 'complete' && Number(item.rolloverCount || 0) > 0)
    .map((item) => ({
      id: `thicc-school-rollover-${course.id}-${item.id}`,
      date_key: item.assignedDate,
      date: item.assignedDate,
      entry_type: 'ISSA STUDY',
      type: 'ISSA STUDY',
      label: `THICC.SCHOOL ROLLOVER · ${course.short} · ${item.title}`,
      time_value: '17:00',
      time: '17:00',
      end_time: '',
      detail: `${item.minutes} MINUTES RESERVED`,
      description: `${item.guide} Focus: ${(item.focus || []).join(', ')}.`,
      schedule_kind: 'issa',
      recurrence_type: 'none',
      recurrence_days: [],
      recurrence_active: false,
    })));
}
