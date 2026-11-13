const pad = (value) => String(value).padStart(2, '0');
const toDateKey = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const fromDateKey = (value) => {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
};
const addDays = (date, amount) => new Date(date.getTime() + amount * 86400000);
const range = (startKey, endKey) => {
  const rows = [];
  for (let cursor = fromDateKey(startKey), end = fromDateKey(endKey); cursor <= end; cursor = addDays(cursor, 1)) rows.push(new Date(cursor));
  return rows;
};
const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const makeEntry = ({ date, label, start = '', end = '', description = '', type = 'ISSA STUDY', rank = 72 }) => ({
  id: `issa-plan-${date}-${slug(`${start}-${label}`)}`,
  date_key: date,
  date,
  entry_type: type,
  type,
  label,
  time_value: start,
  time: start,
  end_time: end,
  detail: 'ISSA MASTER TRAINER',
  description,
  schedule_kind: 'issa',
  recurrence_type: 'none',
  recurrence_days: [],
  recurrence_active: false,
  rank,
});

const CPT_BLOCKS = [
  'CPT · FINISH MODULE 1 + QUIZ', 'CPT · FINISH MODULE 2 + QUIZ',
  'CPT · MODULE 3 · BLOCK 1', 'CPT · MODULE 3 · FINISH + QUIZ', 'CPT · MODULE 4 + QUIZ',
  'CPT · MODULE 5 · BLOCK 1', 'CPT · MODULE 5 · BLOCK 2', 'CPT · MODULE 5 · FINISH + QUIZ',
  'CPT · MODULE 6 · BLOCK 1', 'CPT · MODULE 6 · FINISH + QUIZ',
  'CPT · MODULE 7 · BLOCK 1', 'CPT · MODULE 7 · FINISH + QUIZ',
  'CPT · MODULE 8 · BLOCK 1', 'CPT · MODULE 8 · BLOCK 2', 'CPT · MODULE 8 · BLOCK 3',
  'CPT · MODULE 8 · BLOCK 4', 'CPT · MODULE 8 · FINISH + QUIZ',
  'CPT · MODULE 9 · BLOCK 1', 'CPT · MODULE 9 · BLOCK 2', 'CPT · MODULE 9 · FINISH + QUIZ',
  'CPT · MODULE 10 · BLOCK 1', 'CPT · MODULE 10 · BLOCK 2', 'CPT · MODULE 10 · FINISH + QUIZ',
  'CPT · FINAL REVIEW', 'CPT · FINAL EXAM TARGET',
];

const NUTRITION_BLOCKS = [
  'NUTRITION · FINISH MODULE 1', 'NUTRITION · FINISH MODULE 2 + QUIZ', 'NUTRITION · MODULE 3 + QUIZ',
  'NUTRITION · MODULE 4 · BLOCK 1', 'NUTRITION · MODULE 4 · FINISH + QUIZ',
  'NUTRITION · MODULE 5 · BLOCK 1', 'NUTRITION · MODULE 5 · FINISH + QUIZ',
  'NUTRITION · MODULE 6 · BLOCK 1', 'NUTRITION · MODULE 6 · BLOCK 2', 'NUTRITION · MODULE 6 · FINISH + QUIZ',
  'NUTRITION · MODULE 7 + QUIZ', 'NUTRITION · MODULE 8 · BLOCK 1', 'NUTRITION · MODULE 8 · FINISH + QUIZ',
  'NUTRITION · MODULE 9 · BLOCK 1', 'NUTRITION · MODULE 9 · FINISH + QUIZ', 'NUTRITION · MODULE 10 + QUIZ',
  'NUTRITION · FINAL REVIEW', 'NUTRITION · FINAL EXAM TARGET',
];

const CPT_QA_DATES = new Set(['2026-11-17', '2026-12-01', '2026-12-08', '2026-12-15', '2027-01-05', '2027-01-12']);
const NUTRITION_OFFICE_DATES = new Set(['2026-11-19', '2026-12-03', '2026-12-10', '2026-12-17']);
const LIGHT_HOLIDAYS = new Set(['2026-11-26', '2026-12-25', '2027-01-01']);
const RESERVED_DATES = new Set(['2026-12-22']);

const addWebinars = (entries, date) => {
  if (CPT_QA_DATES.has(date)) entries.push(makeEntry({
    date, label: 'CPT LIVE Q&A · SELECTED SESSION', start: '08:00', end: '09:00',
    description: 'Selected from the ISSA webinar feed. Use the 11:00 AM option only if the 8:00 AM session is missed.', type: 'ISSA WEBINAR', rank: 70,
  }));
  if (NUTRITION_OFFICE_DATES.has(date)) entries.push(makeEntry({
    date, label: 'NUTRITION COACH OFFICE HOURS', start: '13:00', end: '14:00',
    description: 'Bring module questions and quiz topics that need clarification.', type: 'ISSA WEBINAR', rank: 70,
  }));
};

const sourceFirstSequence = 'Work in order: read the assigned textbook pages, complete the matching ISSA lesson, complete the THICC.SCHOOL study guide/workbook, then pass module practice at 95% or higher. The passed practice becomes the open-book exam review source.';
const studyDescription = (purpose, label = '') => `${purpose} ${/CPT|NUTRITION/.test(label) ? sourceFirstSequence : ''} Document completion before leaving the block.`.replace(/\s+/g, ' ').trim();
const addStudyPair = (entries, date, morning, afternoon, afternoonStart = '13:30', afternoonEnd = '16:00') => {
  const morningStart = CPT_QA_DATES.has(date) ? '09:15' : '08:00';
  const morningEnd = CPT_QA_DATES.has(date) ? '12:15' : '11:00';
  entries.push(makeEntry({ date, label: morning, start: morningStart, end: morningEnd, description: studyDescription('Finish the assigned primary work.', morning) }));
  entries.push(makeEntry({ date, label: afternoon, start: afternoonStart, end: afternoonEnd, description: studyDescription('Finish the assigned secondary work.', afternoon) }));
};

export const ISSA_STUDY_PLAN_VERSION = 'issa-master-trainer-2026-11-v2';
export const ISSA_STUDY_PLAN_RESERVED_DATE = '2026-12-22';

export function getIssaStudyPlanEntries() {
  const entries = [];

  [
    ['2026-11-13', 'CPR/AED · FINAL REVIEW + EXAM', 'BODYBUILDING · FINISH ONBOARDING'],
    ['2026-11-14', 'STRENGTH · FINISH ONBOARDING', 'COURSE MAP · CONFIRM ALL UNLOCKED MODULES'],
  ].forEach(([date, morning, afternoon]) => {
    addStudyPair(entries, date, morning, afternoon);
    addWebinars(entries, date);
  });

  let cptIndex = 0;
  let nutritionIndex = 0;
  range('2026-11-15', '2026-12-14').forEach((dateValue) => {
    const date = toDateKey(dateValue);
    if (RESERVED_DATES.has(date)) return;
    addWebinars(entries, date);
    if (LIGHT_HOLIDAYS.has(date)) {
      entries.push(makeEntry({ date, label: 'ISSA · LIGHT REVIEW + CATCH-UP', start: '10:00', end: '12:00', description: studyDescription('Keep the holiday workload intentionally light.') }));
      return;
    }
    if (dateValue.getUTCDay() === 0) {
      entries.push(makeEntry({ date, label: 'ISSA · WEEKLY REVIEW + RECOVERY', start: '10:00', end: '12:00', description: studyDescription('Close unfinished quizzes and organize the coming week.') }));
      return;
    }
    const morning = CPT_BLOCKS[Math.min(cptIndex++, CPT_BLOCKS.length - 1)];
    const afternoon = NUTRITION_BLOCKS[Math.min(nutritionIndex++, NUTRITION_BLOCKS.length - 1)];
    addStudyPair(entries, date, morning, afternoon, NUTRITION_OFFICE_DATES.has(date) ? '14:15' : '13:30', NUTRITION_OFFICE_DATES.has(date) ? '16:15' : '16:00');
  });

  let bodybuildingQuiz = 1;
  let strengthBlock = 1;
  range('2026-12-15', '2027-01-03').forEach((dateValue) => {
    const date = toDateKey(dateValue);
    if (RESERVED_DATES.has(date)) return;
    addWebinars(entries, date);
    if (LIGHT_HOLIDAYS.has(date)) {
      entries.push(makeEntry({ date, label: 'ISSA · LIGHT REVIEW + CATCH-UP', start: '10:00', end: '12:00', description: studyDescription('Keep the holiday workload intentionally light.') }));
      return;
    }
    if (dateValue.getUTCDay() === 0) {
      entries.push(makeEntry({ date, label: 'ISSA · WEEKLY REVIEW + RECOVERY', start: '10:00', end: '12:00', description: studyDescription('Clear incomplete topics and quizzes before the next week.') }));
      return;
    }
    const bodyLabel = bodybuildingQuiz <= 16 ? `BODYBUILDING · CHAPTER + QUIZ ${bodybuildingQuiz}` : 'BODYBUILDING · FINAL REVIEW + CERTIFICATION EXAM';
    bodybuildingQuiz += 1;
    addStudyPair(entries, date, bodyLabel, `STRENGTH · COURSE BLOCK ${strengthBlock++}`, NUTRITION_OFFICE_DATES.has(date) ? '14:15' : '13:30', NUTRITION_OFFICE_DATES.has(date) ? '16:15' : '16:00');
  });

  let effectBlock = 1;
  range('2027-01-04', '2027-01-09').forEach((dateValue) => {
    const date = toDateKey(dateValue);
    addWebinars(entries, date);
    addStudyPair(entries, date, `EXERCISE EFFECT · COURSE BLOCK ${effectBlock++}`, 'STRENGTH / BODYBUILDING · COMPLETION BLOCK');
  });

  range('2027-01-10', '2027-01-14').forEach((dateValue) => {
    const date = toDateKey(dateValue);
    addWebinars(entries, date);
    addStudyPair(entries, date, 'CPT · FINAL PROOF / RETAKE BUFFER', 'NCCPT · EXAM PREP');
  });

  range('2027-01-15', '2027-01-22').forEach((dateValue) => {
    const date = toDateKey(dateValue);
    addWebinars(entries, date);
    if (dateValue.getUTCDay() === 0) {
      entries.push(makeEntry({ date, label: 'ISSA · WEEKLY REVIEW + RECOVERY', start: '10:00', end: '12:00', description: studyDescription('Close specialization work and protect exam week.') }));
      return;
    }
    addStudyPair(entries, date, 'NCCPT · EXAM PREP', 'EXERCISE EFFECT / SPECIALIZATIONS · FINISH');
  });

  entries.push(makeEntry({ date: '2027-01-23', label: 'NCCPT · TARGET EXAM DAY', start: '09:00', end: '12:00', description: 'Target date only. Book the actual proctored exam through the approved NCCPT process.', type: 'ISSA DEADLINE', rank: 68 }));
  range('2027-01-24', '2027-01-28').forEach((dateValue) => {
    const date = toDateKey(dateValue);
    addWebinars(entries, date);
    addStudyPair(entries, date, 'ISSA · EXAM / RETAKE / COMPLETION BUFFER', 'ISSA · RECORDS + CERTIFICATION PROOF', '13:30', '15:30');
  });

  entries.push(
    makeEntry({ date: '2027-01-15', label: 'CPT EXPIRATION · MUST ALREADY BE COMPLETE', description: 'Hard portal expiration date observed November 11, 2026.', type: 'ISSA DEADLINE', rank: 65 }),
    makeEntry({ date: '2027-01-29', label: 'NCCPT + EXERCISE EFFECT EXPIRATION', description: 'Hard portal expiration date observed November 11, 2026.', type: 'ISSA DEADLINE', rank: 65 }),
    makeEntry({ date: '2027-01-29', label: 'ISSA · DEADLINE VERIFICATION', start: '09:30', end: '12:30', description: 'Confirm both expiring items are complete and visible in the portal.', type: 'ISSA DEADLINE', rank: 68 }),
    makeEntry({ date: '2027-01-30', label: 'MASTER TRAINER · COMPLETION AUDIT', start: '09:30', end: '12:30', description: 'Verify every enrolled course, exam, and certification prerequisite.', rank: 70 }),
    makeEntry({ date: '2027-01-31', label: 'MASTER TRAINER TARGET · COMPLETE', description: 'Personal completion target. No unfinished course should remain after this date.', type: 'ISSA DEADLINE', rank: 64 }),
  );

  return entries.sort((left, right) => left.date_key.localeCompare(right.date_key) || left.time_value.localeCompare(right.time_value) || left.rank - right.rank);
}
