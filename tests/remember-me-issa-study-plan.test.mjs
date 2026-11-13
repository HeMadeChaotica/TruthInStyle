import assert from 'node:assert/strict';
import test from 'node:test';

import { getIssaStudyPlanEntries, ISSA_STUDY_PLAN_RESERVED_DATE } from '../lib/rememberMe/issaStudyPlan.mjs';

test('ISSA plan protects Mista.Thicc birthday and uses deterministic unique entries', () => {
  const entries = getIssaStudyPlanEntries();
  assert.equal(entries[0].date_key, '2026-11-13');
  assert.ok(entries.length >= 120);
  assert.equal(entries.filter((entry) => entry.date_key === ISSA_STUDY_PLAN_RESERVED_DATE).length, 0);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
});

test('ISSA plan carries the observed hard deadlines and completion target', () => {
  const entries = getIssaStudyPlanEntries();
  const labelsByDate = (date) => entries.filter((entry) => entry.date_key === date).map((entry) => entry.label).join(' | ');
  assert.match(labelsByDate('2027-01-15'), /CPT EXPIRATION/);
  assert.match(labelsByDate('2027-01-29'), /NCCPT \+ EXERCISE EFFECT EXPIRATION/);
  assert.match(labelsByDate('2027-01-31'), /MASTER TRAINER TARGET · COMPLETE/);
});

test('ISSA plan includes selected webinars without importing every duplicate option', () => {
  const webinars = getIssaStudyPlanEntries().filter((entry) => entry.type === 'ISSA WEBINAR');
  assert.equal(webinars.filter((entry) => entry.label.includes('CPT LIVE Q&A')).length, 6);
  assert.equal(webinars.filter((entry) => entry.label.includes('NUTRITION COACH OFFICE HOURS')).length, 4);
});

test('ISSA plan starts tomorrow at 8 AM and makes CPT and Nutrition source-first', () => {
  const entries = getIssaStudyPlanEntries();
  const tomorrowMorning = entries.find((entry) => entry.date_key === '2026-11-13' && entry.label.includes('CPR/AED'));
  assert.equal(tomorrowMorning.time_value, '08:00');
  const sourceFirst = entries.filter((entry) => /CPT|NUTRITION/.test(entry.label) && entry.type === 'ISSA STUDY');
  assert.ok(sourceFirst.length > 20);
  assert.equal(sourceFirst.every((entry) => /read the assigned textbook pages.*ISSA lesson.*study guide\/workbook.*95%/i.test(entry.description)), true);
});
