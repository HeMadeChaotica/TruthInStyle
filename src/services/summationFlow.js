import { appState } from '../state/appState.js';
import { archiveRepository, synthesisRepository } from '../storage/storageAdapter.js';

export function sealTruthForActiveDay() {
  const dateKey = appState.activeDay.activeDate;
  const page = synthesisRepository.read('summation_page', dateKey) ?? { versionId: 'v1', sealed: false };
  const sealedPage = { ...page, sealed: true, sealedVersionId: appState.ui.versionId };
  synthesisRepository.write('summation_page', dateKey, sealedPage);
  archiveRepository.sealToHopewood({
    dateKey,
    titleOfDay: appState.activeDay.titleOfDay,
    summationPage: sealedPage
  });
  return sealedPage;
}

export function buildYearlyTrendScaffold(year, entries) {
  return {
    year,
    repeatedMoods: [],
    repeatedEras: [],
    workFeedSignals: entries.map((entry) => entry?.workSignal).filter(Boolean)
  };
}
