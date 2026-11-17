import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const records = new Map();

globalThis.CustomEvent = class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
};

globalThis.window = {
  localStorage: {
    get length() { return records.size; },
    key(index) { return [...records.keys()][index] || null; },
    getItem(key) { return records.has(key) ? records.get(key) : null; },
    setItem(key, value) { records.set(key, String(value)); },
    removeItem(key) { records.delete(key); },
  },
  sessionStorage: {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
  },
  dispatchEvent() { return true; },
};

const { createDefaultSchoolState } = await import('../lib/thiccSchool/schoolEngine.mjs');
const {
  THICC_FITT_LLC_BUILD_STORAGE_KEY,
  buildThiccFittLlcBuildSignal,
} = await import('../src/services/thiccFittLlcBuildService.js');
const { normalizeDayCapsuleRecord } = await import('../src/services/dayCapsuleAnalytics.js');
const { buildAnnual525600Intelligence } = await import('../src/services/annual525600Service.js');

test.beforeEach(() => records.clear());

test('THICC.FITT LLC work, school readiness, and operations survive the sealed path into 525600', () => {
  const school = createDefaultSchoolState();
  school.courses.cpt.sections['cpt-1'].status = 'complete';
  school.courses.cpt.sections['cpt-1'].issaCompleted = true;
  school.courses.cpt.sections['cpt-1'].textbookCompleted = true;
  school.courses.cpt.sections['cpt-1'].workbookCompleted = true;
  school.courses.cpt.sections['cpt-1'].practiceBestScore = 100;
  records.set('thicc_school_state_v1', JSON.stringify(school));
  records.set('thicc_clients', JSON.stringify([{ id: 'client-1', name: 'PRIVATE CLIENT', active: true }]));
  records.set('thicc_client_forms', JSON.stringify([{ id: 'intake', active: true }]));
  records.set('thicc_client_form_assignments', JSON.stringify([{ id: 'assignment-1' }]));
  records.set('thicc_client_logs', JSON.stringify([{ id: 'log-1', event: 'client:ready', ts: '2026-11-23T15:00:00.000Z' }]));
  records.set(THICC_FITT_LLC_BUILD_STORAGE_KEY, JSON.stringify({
    milestones: [{
      id: 'llc-filing-payment',
      category: 'FORMATION & COMPLIANCE',
      title: 'FILE AND PAY FOR THICC.FITT LLC',
      targetDate: '2026-11-23',
      status: 'complete',
      completedAt: '2026-11-23T18:00:00.000Z',
      nextAction: 'OBTAIN EIN',
    }],
    workLog: [{
      id: 'work-1',
      date: '2026-11-23',
      category: 'FORMATION & COMPLIANCE',
      title: 'FILED THICC.FITT LLC',
      minutes: 90,
      status: 'complete',
      notes: 'Formation submitted and paid.',
    }],
  }));

  const signal = buildThiccFittLlcBuildSignal('2026-11-23');
  assert.equal(signal.source, 'THICC.FITT LLC BUILD');
  assert.equal(signal.workMinutes, 90);
  assert.equal(signal.completedWork, 1);
  assert.equal(signal.operations.activeClients, 1);
  assert.equal(signal.operations.readyForms, 1);
  assert.ok(signal.school.totalSections >= 1);

  const sealed = {
    sourceDate: '2026-11-23',
    title: 'THE COMPANY BECAME REAL',
    sourceSignals: { thiccFittLlcBuild: signal },
  };
  const normalized = normalizeDayCapsuleRecord(sealed);
  assert.equal(normalized.businessBuild.workMinutes, 90);

  const annual = buildAnnual525600Intelligence([sealed], { year: '2026', windowKey: 'year' });
  assert.equal(annual.business.workMinutes, 90);
  assert.equal(annual.business.completedWork, 1);
  assert.equal(annual.business.operations.activeClients, 1);
  assert.equal(annual.business.school.totalSections, signal.school.totalSections);
  assert.equal(annual.business.monthly[0].month, '2026-11');
});

test('THE.SUMMATION contract copies the LLC signal into the render snapshot and sealed source signals', async () => {
  const source = await readFile(new URL('../src/services/summationService.js', import.meta.url), 'utf8');
  assert.match(source, /const thiccFittLlcBuild = buildThiccFittLlcBuildSignal\(sourceDate\)/);
  assert.match(source, /thiccFittLlcBuildSignals:\s*normalizeNullable\(activeDayPayload\.thiccFittLlcBuildSignals \|\| activeDayPayload\.thiccFittLlcBuild\)/);
  assert.match(source, /thiccFittLlcBuild:\s*snapshot\.thiccFittLlcBuildSignals \|\| null/);
  assert.match(source, /thiccFittBody:\s*snapshot\.thiccFittBodySignals \|\| null/);
  assert.match(source, /detailSignals:\s*normalizeNullable\(activeDayPayload\.daEaterSignals\?\.detailSignals \|\| activeDayPayload\.daEaterDetailSignals\)/);
});

test('DA.EATER detail behavior and THICC.FITT body receipts remain visible to 525600 analytics', () => {
  const day = normalizeDayCapsuleRecord({
    sourceDate: '2026-11-24',
    sourceSignals: {
      daEater: {
        detailSignals: {
          supplements: [{ name: 'CREATINE', amount: '5', unit: 'G' }],
          cravings: [{ item: 'CAKE', intensity: 'HIGH' }],
          treats: [{ meal: 'PIZZA', worthItPercent: '100' }],
          obsession: { currentFixation: 'SALMON BOWL' },
        },
      },
      thiccFittBody: {
        body: { weight: { today: '245' }, bodyFat: { today: '12.5' } },
        sleep: { sleep_total: '8.0' },
      },
    },
  });
  assert.ok(day.meals.some((value) => /CREATINE|CAKE|PIZZA|SALMON BOWL/.test(value)));
  assert.equal(day.weight, 245);
  assert.equal(day.bodyFat, 12.5);
  assert.equal(day.sleep, '8.0');
});

test('the November 23 filing target remains a first-class default milestone', () => {
  const signal = buildThiccFittLlcBuildSignal('2026-11-17');
  const filing = signal.milestones.find((item) => item.id === 'llc-filing-payment');
  assert.equal(filing.targetDate, '2026-11-23');
  assert.match(filing.title, /FILE AND PAY/);
});
