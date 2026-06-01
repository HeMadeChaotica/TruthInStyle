const SUMMATION_PAGES_KEY = 'summation_sealed_pages_v1';
const SUMMATION_DRAFT_KEY = 'summation_wrap_draft_v1';
const ASSURER_FEED_KEY = 'the_assurer_feed';
const ASSURER_TITLE_KEY = 'the_assurer_title_of_day';
const ASSURER_WORD_KEY = 'the_assurer_word_of_day';

const safeJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const todayKey = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const mmddyyyy = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
};

const compactText = (value, fallback = '') => String(value || fallback).trim();

const pickFirstValue = (source, keys) => {
  if (!source || typeof source !== 'object') return '';
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
};

const readLocalStorage = (key, fallback = null) => {
  if (typeof window === 'undefined') return fallback;
  return window.localStorage.getItem(key) ?? fallback;
};

export function getSummationDateParts(date = new Date()) {
  return {
    isoDate: todayKey(date),
    displayDate: mmddyyyy(date),
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
  };
}

export function readSummationPages() {
  if (typeof window === 'undefined') return [];
  const pages = safeJson(window.localStorage.getItem(SUMMATION_PAGES_KEY), []);
  return Array.isArray(pages) ? pages : [];
}

export function getChaoticaDayNumber(date = new Date()) {
  const pages = readSummationPages();
  const { isoDate } = getSummationDateParts(date);
  const sealedForToday = pages.find((page) => page?.dateKey === isoDate);

  if (sealedForToday?.chaoticaDayNumber) {
    return sealedForToday.chaoticaDayNumber;
  }

  return pages.length + 1;
}

export function readSummationDraft(dateKey = todayKey()) {
  if (typeof window === 'undefined') return null;
  const drafts = safeJson(window.localStorage.getItem(SUMMATION_DRAFT_KEY), {});
  return drafts?.[dateKey] || null;
}

export function saveSummationDraft(dateKey, draft) {
  if (typeof window === 'undefined' || !dateKey) return;
  const drafts = safeJson(window.localStorage.getItem(SUMMATION_DRAFT_KEY), {});
  window.localStorage.setItem(SUMMATION_DRAFT_KEY, JSON.stringify({ ...drafts, [dateKey]: draft }));
}

export function sealSummationPage(page) {
  if (typeof window === 'undefined') return null;
  const pages = readSummationPages();
  const existing = pages.find((saved) => saved?.dateKey === page.dateKey);
  const chaoticaDayNumber = existing?.chaoticaDayNumber || pages.length + 1;
  const sealedPage = {
    ...page,
    chaoticaDayNumber,
    sealedAt: new Date().toISOString(),
  };
  const nextPages = [
    ...pages.filter((saved) => saved?.dateKey !== page.dateKey),
    sealedPage,
  ].sort((a, b) => (a.chaoticaDayNumber || 0) - (b.chaoticaDayNumber || 0));

  window.localStorage.setItem(SUMMATION_PAGES_KEY, JSON.stringify(nextPages));
  window.localStorage.setItem('completed_summation_sketch', JSON.stringify(sealedPage));
  return sealedPage;
}

export function readAssurerStoryInput(date = new Date()) {
  if (typeof window === 'undefined') {
    return {
      title: '',
      dailyWord: null,
      feed: [],
      sparks: [],
    };
  }

  const { isoDate } = getSummationDateParts(date);
  const feed = safeJson(readLocalStorage(ASSURER_FEED_KEY, '[]'), []);
  const title = readLocalStorage(`${ASSURER_TITLE_KEY}:${isoDate}`, '') || '';
  const dailyWord = safeJson(readLocalStorage(`${ASSURER_WORD_KEY}:${isoDate}`, ''), null);
  const todaysFeed = Array.isArray(feed) ? feed.filter((entry) => !entry?.date || entry.date === isoDate) : [];
  const sparks = todaysFeed.flatMap((entry, index) => {
    const workout = compactText(pickFirstValue(entry, ['seasonPhase', 'prepStatus', 'workoutLength', 'gym']), 'movement logged');
    const feeling = compactText(pickFirstValue(entry, ['soHowYouDoinSelectedOption', 'soHowYouDoinNotes', 'sorenessRecovery']), 'body told the truth');
    return [
      { id: `${index}-movement`, tone: 'motion', text: workout },
      { id: `${index}-signal`, tone: 'signal', text: feeling },
    ].filter((spark) => spark.text);
  });

  return {
    title,
    dailyWord,
    feed: todaysFeed,
    sparks,
  };
}
