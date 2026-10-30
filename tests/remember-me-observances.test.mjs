import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REMEMBER_ME_MONTH_IDENTITIES,
  buildRememberMeObservances,
  groupRememberMeObservancesByDate,
} from '../lib/rememberMe/observances.mjs';

test('REMEMBER.ME has twelve distinct locked month identities', () => {
  assert.equal(REMEMBER_ME_MONTH_IDENTITIES.length, 12);
  assert.equal(new Set(REMEMBER_ME_MONTH_IDENTITIES.map((month) => month.title)).size, 12);
  assert.match(REMEMBER_ME_MONTH_IDENTITIES[5].title, /PRIDE/);
  assert.match(REMEMBER_ME_MONTH_IDENTITIES[9].title, /HALLOWEEN/);
  assert.match(REMEMBER_ME_MONTH_IDENTITIES[11].title, /DECEMBER 22/);
});

test('federal holiday rules generate movable and observed dates', () => {
  const rows = buildRememberMeObservances(2026);
  const byLabel = Object.fromEntries(rows.map((row) => [row.label, row.date_key]));
  assert.equal(byLabel['MARTIN LUTHER KING JR. DAY'], '2026-01-19');
  assert.equal(byLabel['MEMORIAL DAY'], '2026-05-25');
  assert.equal(byLabel['THANKSGIVING DAY'], '2026-11-26');
  assert.equal(byLabel['INDEPENDENCE DAY · OBSERVED'], '2026-07-03');
});

test('the calendar layers remain distinguishable', () => {
  const rows = buildRememberMeObservances(2026);
  assert.ok(rows.some((row) => row.layer === 'official'));
  assert.ok(rows.some((row) => row.layer === 'fun'));
  assert.ok(rows.some((row) => row.layer === 'personal'));
  assert.equal(groupRememberMeObservancesByDate(2026)['2026-12-22'][0].label, 'MISTA.THICC BIRTHDAY');
  assert.ok(rows.every((row) => row.readOnly));
});
