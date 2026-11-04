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

const { countArchivedDaysThrough, getNextDaySourceDate, resetPersonalDailyDraftForDate } = await import('../src/services/dailyLifecycle.js');

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

test('successful seal rollover clears Day Capsule pointers and starts a blank personal next day', async () => {
  const source = await readFile(new URL('../src/services/summationService.js', import.meta.url), 'utf8');
  const start = source.indexOf('export function activateCleanNextDay');
  const end = source.indexOf('\n}\n', start) + 2;
  const rollover = source.slice(start, end);

  assert.match(rollover, /resetPersonalDailyDraftForDate\(nextSourceDate/);
  assert.match(rollover, /setStoredSummationActiveDay\(nextDate/);
  assert.match(rollover, /localStorage\.removeItem\(DAY_CAPSULE_PAYLOAD_KEY\)/);
  assert.match(rollover, /localStorage\.removeItem\(DAY_CAPSULE_RENDER_RECORD_KEY\)/);
  assert.match(rollover, /sessionStorage\?\.removeItem\(PENDING_SUMMATE_RENDER_KEY\)/);
  assert.doesNotMatch(rollover, /SUMMATION_SEALED_STORAGE_KEY|HOPEWOOD|REMEMBER_ME|ITS_GETTING_THICC/);
});

test('legacy active-day migration repairs the already-open stale personal draft once', async () => {
  const source = await readFile(new URL('../src/services/summationService.js', import.meta.url), 'utf8');
  const start = source.indexOf('export function getStoredSummationActiveDay');
  const end = source.indexOf('\n}\n', start) + 2;
  const migration = source.slice(start, end);

  assert.match(migration, /PERSONAL_DAILY_RESET_MIGRATION_KEY/);
  assert.match(migration, /resetPersonalDailyDraftForDate\(stored\.sourceDate/);
  assert.match(migration, /legacy-rollover-repair/);
  assert.match(migration, /personalDailyResetVersion: PERSONAL_DAILY_RESET_VERSION/);
});

test('personal next-day reset preserves history and client records while clearing only the target draft', () => {
  records.set('truthinstyle_thicc_fitt_days_v2', JSON.stringify({
    '2026-11-03': { date: '2026-11-03', control: { gymLocation: 'SEALED HISTORY' } },
    '2026-11-04': { date: '2026-11-04', control: { gymLocation: 'STALE NEXT DAY' } },
  }));
  records.set('truthinstyle_da_eater_days_v1', JSON.stringify({
    '2026-11-03': { date: '2026-11-03', meals: [{ name: 'SEALED MEAL' }] },
    '2026-11-04': { date: '2026-11-04', meals: [{ name: 'STALE MEAL' }] },
  }));
  records.set('the_assurer_feed', JSON.stringify([
    { source: 'thicc-fitt', date: '2026-11-03', gym: 'SEALED HISTORY' },
    { source: 'thicc-fitt', date: '2026-11-04', gym: 'STALE NEXT DAY' },
  ]));
  records.set('truthinstyle_client_records', JSON.stringify([{ id: 'client-1', name: 'PROTECTED CLIENT' }]));

  const result = resetPersonalDailyDraftForDate('2026-11-04', {
    storage: window.localStorage,
    resetAt: '2026-11-04T12:00:00.000Z',
  });

  assert.equal(result.reset, true);
  assert.equal(result.recovered, true);
  assert.equal(JSON.parse(records.get('truthinstyle_thicc_fitt_days_v2'))['2026-11-04'], undefined);
  assert.equal(JSON.parse(records.get('truthinstyle_da_eater_days_v1'))['2026-11-04'], undefined);
  assert.equal(JSON.parse(records.get('truthinstyle_thicc_fitt_days_v2'))['2026-11-03'].control.gymLocation, 'SEALED HISTORY');
  assert.equal(JSON.parse(records.get('truthinstyle_da_eater_days_v1'))['2026-11-03'].meals[0].name, 'SEALED MEAL');
  assert.deepEqual(JSON.parse(records.get('truthinstyle_client_records')), [{ id: 'client-1', name: 'PROTECTED CLIENT' }]);
  assert.equal(JSON.parse(records.get('truthinstyle_personal_daily_reset_recovery_v1'))[0].dateKey, '2026-11-04');
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
