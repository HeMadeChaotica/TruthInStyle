import { archive_trend_intelligence, daily_synthesis, source_inputs } from '../data/scaffoldData.js';

function ensureDayBucket(bucket, dateKey, fallback) {
  if (!bucket[dateKey]) bucket[dateKey] = fallback;
  return bucket[dateKey];
}

export const sourceRepository = {
  write(sectionKey, dateKey, payload) {
    const sectionBucket = source_inputs[sectionKey];
    if (!sectionBucket) return;
    ensureDayBucket(sectionBucket, dateKey, {});
    sectionBucket[dateKey] = { ...sectionBucket[dateKey], ...payload };
  },
  read(sectionKey, dateKey) {
    return source_inputs[sectionKey]?.[dateKey] ?? null;
  }
};

export const synthesisRepository = {
  write(sectionKey, dateKey, payload) {
    const sectionBucket = daily_synthesis[sectionKey];
    if (!sectionBucket) return;
    ensureDayBucket(sectionBucket, dateKey, {});
    sectionBucket[dateKey] = { ...sectionBucket[dateKey], ...payload };
  },
  read(sectionKey, dateKey) {
    return daily_synthesis[sectionKey]?.[dateKey] ?? null;
  }
};

export const archiveRepository = {
  sealToHopewood({ dateKey, titleOfDay, summationPage }) {
    archive_trend_intelligence.hopewood_entries[dateKey] = {
      dateKey,
      titleOfDay,
      summationPage,
      sealedAt: new Date().toISOString()
    };
  },
  readHopewoodEntry(dateKey) {
    return archive_trend_intelligence.hopewood_entries[dateKey] ?? null;
  }
};

export const supabaseReadiness = {
  assetFamilies: ['opening', 'app-icons', 'section-anchors', 'control-panel', 'triggers'],
  uploadMediaScopes: ['da.eater', 'remember.me', 'thicc.fitt', 'its.getting.THICC'],
  archiveWriteKey: 'day_state.activeDate',
  searchableHopewoodMetadata: ['titleOfDay', 'dateKey', 'qualifiers', 'phrases'],
  yearlyTrendScaffold: ['repeatedMoods', 'repeatedEras', 'workFeedSignals']
};
