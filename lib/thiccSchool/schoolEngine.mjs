import {
  THICC_SCHOOL_COURSES,
  THICC_SCHOOL_MASTERY_SCORE,
  THICC_SCHOOL_QUESTION_BANK,
  THICC_SCHOOL_RESERVED_DATES,
  THICC_SCHOOL_VERSION,
} from './catalog.mjs';

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
      sections: Object.fromEntries(course.sections.map((item) => [item.id, {
        ...clone(item),
        status: 'not_started',
        completedAt: '',
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
      normalized.courses[courseDefinition.id].sections[definition.id] = {
        ...defaults.courses[courseDefinition.id].sections[definition.id],
        ...saved,
        id: definition.id,
      };
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
  Object.values(state.courses).forEach((course) => Object.values(course.sections).forEach((item) => {
    if (item.status !== 'complete' && item.assignedDate >= today) {
      scheduledMinutes[item.assignedDate] = (scheduledMinutes[item.assignedDate] || 0) + Number(item.minutes || 0);
    }
  }));

  const moved = [];
  Object.values(state.courses).forEach((course) => {
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

export function getCourseQuestions(courseId, attemptIndex = 0, limit = 20) {
  const pool = THICC_SCHOOL_QUESTION_BANK.filter((question) => question.courses.includes(courseId));
  if (!pool.length) return [];
  const offset = attemptIndex % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
  return rotated.slice(0, Math.min(limit, rotated.length));
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
  state.updatedAt = new Date().toISOString();
  return { state, result };
}

export function summarizeSchoolState(value) {
  const state = normalizeSchoolState(value);
  const courses = Object.values(state.courses);
  const sections = courses.flatMap((course) => Object.values(course.sections));
  const complete = sections.filter((item) => item.status === 'complete').length;
  const remainingMinutes = sections.filter((item) => item.status !== 'complete').reduce((sum, item) => sum + Number(item.minutes || 0), 0);
  const attempts = courses.flatMap((course) => course.attempts || []);
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
  return Object.values(state.courses).flatMap((course) => Object.values(course.sections)
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
