import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const records = new Map();
const events = [];

globalThis.CustomEvent = class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
};

globalThis.window = {
  localStorage: {
    getItem(key) { return records.has(key) ? records.get(key) : null; },
    setItem(key, value) { records.set(key, String(value)); },
    removeItem(key) { records.delete(key); },
  },
  dispatchEvent(event) { events.push(event); return true; },
};

const { countArchivedDaysThrough, getNextDaySourceDate } = await import('../src/services/dailyLifecycle.js');

const { readThiccFittWorkoutMirror } = await import('../lib/theAssurer/thiccFittWorkoutMirror.js');

test.beforeEach(() => {
  records.clear();
  events.length = 0;
});

test('CHAOTICA count remains zero without successfully archived days', () => {
  assert.equal(countArchivedDaysThrough([], '2026-10-28'), 0);
});

test('CHAOTICA count uses unique successfully archived dates, not calendar distance', () => {
  const archive = [
    { sourceDate: '2026-09-18', archive: 'HOPEWOOD' },
    { sourceDate: '2026-10-28', archive: 'HOPEWOOD', lifecycleStatus: 'complete_tested_archived' },
    { sourceDate: '2026-10-28', archive: 'HOPEWOOD', lifecycleStatus: 'complete_tested_archived' },
    { sourceDate: '2026-10-30', archive: 'HOPEWOOD', lifecycleStatus: 'complete_tested_archived' },
  ];
  assert.equal(countArchivedDaysThrough(archive, '2026-10-27'), 0);
  assert.equal(countArchivedDaysThrough(archive, '2026-10-28'), 1);
  assert.equal(countArchivedDaysThrough(archive, '2026-10-29'), 1);
  assert.equal(countArchivedDaysThrough(archive, '2026-10-30'), 2);
});

test('successful seal rollover activates the next calendar day', () => {
  assert.equal(getNextDaySourceDate('2026-10-31'), '2026-11-01');
  assert.equal(getNextDaySourceDate('2028-02-28'), '2028-02-29');
});

test('successful seal rollover clears only active Day Capsule pointers', async () => {
  const source = await readFile(new URL('../src/services/summationService.js', import.meta.url), 'utf8');
  const start = source.indexOf('export function activateCleanNextDay');
  const end = source.indexOf('\n}\n', start) + 2;
  const rollover = source.slice(start, end);

  assert.match(rollover, /setStoredSummationActiveDay\(nextDate\)/);
  assert.match(rollover, /localStorage\.removeItem\(DAY_CAPSULE_PAYLOAD_KEY\)/);
  assert.match(rollover, /localStorage\.removeItem\(DAY_CAPSULE_RENDER_RECORD_KEY\)/);
  assert.match(rollover, /sessionStorage\?\.removeItem\(PENDING_SUMMATE_RENDER_KEY\)/);
  assert.doesNotMatch(rollover, /SUMMATION_SEALED_STORAGE_KEY|HOPEWOOD|ASSURER|THICC_FITT|DA_EATER|REMEMBER_ME/);
});

test('THICC.FITT reads only the requested date from the dated personal-day store', () => {
  records.set('truthinstyle_thicc_fitt_days_v2', JSON.stringify({
    '2026-10-28': { date: '2026-10-28', control: { gymLocation: 'DAY ONE GYM' } },
    '2026-10-29': { date: '2026-10-29', control: { gymLocation: 'DAY TWO GYM' } },
  }));
  assert.equal(readThiccFittWorkoutMirror('2026-10-28').control.gymLocation, 'DAY ONE GYM');
  assert.equal(readThiccFittWorkoutMirror('2026-10-29').control.gymLocation, 'DAY TWO GYM');
  assert.equal(readThiccFittWorkoutMirror('2026-10-30').hasData, false);
});
