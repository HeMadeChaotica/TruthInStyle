export const COMPLETED_DAY_LIFECYCLE_STATUS = 'complete_tested_archived';

export function countArchivedDaysThrough(records = [], requestedDateKey = '') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(requestedDateKey || '').trim())) return 0;
  return new Set(
    (Array.isArray(records) ? records : [])
      .filter((record) => record?.lifecycleStatus === COMPLETED_DAY_LIFECYCLE_STATUS)
      .map((record) => String(record?.sourceDate || record?.dayIdentity?.sourceDate || '').trim())
      .filter((sourceDate) => /^\d{4}-\d{2}-\d{2}$/.test(sourceDate) && sourceDate <= requestedDateKey),
  ).size;
}

export function getNextDaySourceDate(sourceDate = '') {
  const match = String(sourceDate || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
