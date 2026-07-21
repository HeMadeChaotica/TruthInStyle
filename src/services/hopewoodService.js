const HOPEWOOD_SUMMATION_ARCHIVE_KEY = 'hopewood_summation_archive_v1';
export const HOPEWOOD_ARCHIVE_UPDATED_EVENT = 'truthinstyle-hopewood-archive-updated';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readArchive() {
  if (!canUseStorage()) return [];
  const parsed = safeParse(window.localStorage.getItem(HOPEWOOD_SUMMATION_ARCHIVE_KEY), []);
  return Array.isArray(parsed) ? parsed : [];
}

function sortChronologically(records) {
  return [...records].sort((left, right) => {
    const leftDate = String(left?.sourceDate || left?.date || '');
    const rightDate = String(right?.sourceDate || right?.date || '');
    return leftDate.localeCompare(rightDate) || String(left?.sealedAt || '').localeCompare(String(right?.sealedAt || ''));
  });
}

export function readHopewoodSummationArchive() {
  return sortChronologically(readArchive());
}

export function getHopewoodRecordDate(record) {
  return String(record?.sourceDate || record?.dayIdentity?.sourceDate || record?.date || '').trim();
}

export function getHopewoodArtifactUrl(record) {
  const artifact = record?.renderArtifact || record?.sketchArtifact?.renderArtifact || record?.sketchArtifact || {};
  return String(
    record?.artifactUrl
      || record?.previewPath
      || artifact?.url
      || artifact?.artifactUrl
      || artifact?.previewPath
      || '',
  ).trim();
}

export function findHopewoodSummationByDate(sourceDate) {
  const target = String(sourceDate || '').trim();
  return readHopewoodSummationArchive().find((record) => getHopewoodRecordDate(record) === target) || null;
}

export function receiveSealedSummation(sealedSummationRecord) {
  if (!canUseStorage() || !sealedSummationRecord?.sourceDate) {
    return null;
  }

  const archive = readArchive();
  const nextRecord = {
    ...sealedSummationRecord,
    archive: 'HOPEWOOD',
    archiveReceivedAt: new Date().toISOString(),
  };
  const withoutSameDay = archive.filter((record) => String(record?.sourceDate || '') !== String(nextRecord.sourceDate));
  const nextArchive = sortChronologically([...withoutSameDay, nextRecord]);

  window.localStorage.setItem(HOPEWOOD_SUMMATION_ARCHIVE_KEY, JSON.stringify(nextArchive));
  window.dispatchEvent(new CustomEvent(HOPEWOOD_ARCHIVE_UPDATED_EVENT, { detail: { record: nextRecord, archive: nextArchive } }));
  return nextRecord;
}
