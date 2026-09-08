'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ScenePlate, SectionOverlay, SectionShell } from '../shared/UniversalSectionFrame';
import {
  fetchHopewoodSummationArchive,
  getHopewoodArtifactUrl,
  getHopewoodRecordDate,
  HOPEWOOD_ARCHIVE_UPDATED_EVENT,
  readHopewoodSummationArchive,
} from '../../src/services/hopewoodService';
import {
  cleanAnalyticsText,
  normalizeDayCapsuleRecord,
} from '../../src/services/dayCapsuleAnalytics';
import '../../styles/sections/hopewood.css';

const BACKGROUND_URL = '/backgrounds/HOPEWOOD/hopewood-archive-chamber-approved-v7.png';
const SEARCH_CATEGORIES = [
  ['date', 'DAY'],
  ['title', 'TITLE OF THE DAY'],
  ['mood', 'MOOD'],
  ['era', 'ERA'],
  ['phrase', 'PHRASE'],
  ['event', 'EVENT'],
  ['song', 'SONG'],
];

function fieldValues(record, mode) {
  const day = normalizeDayCapsuleRecord(record);
  const values = {
    date: [day.sourceDate],
    title: [day.title],
    mood: [day.mood],
    era: [day.era],
    phrase: [day.word, day.battleCry, ...(day.assuredThoughts || [])],
    event: [...(day.moments || []), ...(day.schedule || [])],
    song: [day.headHummer],
  }[mode] || [];
  return [...new Set(values.map(cleanAnalyticsText).filter(Boolean))];
}

export default function HopewoodSection() {
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [filters, setFilters] = useState(() => Object.fromEntries(SEARCH_CATEGORIES.map(([key]) => [key, ''])));

  useEffect(() => {
    const applyArchive = (archive = []) => {
      setRecords(archive);
      setSelectedDate((current) => current || getHopewoodRecordDate(archive.at(-1)));
    };
    const refresh = () => applyArchive(readHopewoodSummationArchive());
    refresh();
    fetchHopewoodSummationArchive().then(applyArchive).catch(() => {});
    window.addEventListener(HOPEWOOD_ARCHIVE_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(HOPEWOOD_ARCHIVE_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const optionsByCategory = useMemo(() => Object.fromEntries(SEARCH_CATEGORIES.map(([key]) => [
    key,
    [...new Set(records.flatMap((record) => fieldValues(record, key)))]
      .sort((left, right) => key === 'date' ? right.localeCompare(left) : left.localeCompare(right)),
  ])), [records]);

  const matches = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(([, value]) => value);
    return [...records].reverse().filter((record) => activeFilters.every(([key, value]) => (
      fieldValues(record, key).some((candidate) => candidate.toLocaleLowerCase() === value.toLocaleLowerCase())
    )));
  }, [filters, records]);

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const selected = matches.find((record) => getHopewoodRecordDate(record) === selectedDate) || matches[0] || (hasActiveFilters ? null : records.at(-1)) || null;
  const day = selected ? normalizeDayCapsuleRecord(selected) : null;
  const artifactUrl = getHopewoodArtifactUrl(selected);

  const updateFilter = (key, value) => {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    const match = [...records].reverse().find((record) => Object.entries(nextFilters)
      .filter(([, filterValue]) => filterValue)
      .every(([filterKey, filterValue]) => fieldValues(record, filterKey)
        .some((candidate) => candidate.toLocaleLowerCase() === filterValue.toLocaleLowerCase())));
    if (match) setSelectedDate(getHopewoodRecordDate(match));
  };

  return (
    <SectionShell className="hopewood-page" aria-label="Hopewood Day Capsule archive">
      <ScenePlate className="hopewood-scene-plate"><Image className="hopewood-bg" src={BACKGROUND_URL} alt="" fill priority sizes="100vw" /></ScenePlate>
      <SectionOverlay className="hopewood-overlay">
        <section className="hopewood-render-panel" aria-label="Completed Summation render">
          {artifactUrl ? (
            <figure>
              <div className="hopewood-render-artifact" role="img" aria-label={`Completed Day Sketch for ${day?.displayDate || ''}`} style={{ backgroundImage: `url(${artifactUrl})` }} />
              <figcaption><strong>{day?.title || 'UNTITLED DAY'}</strong><span>{[day?.displayDate, day?.dayOfWeek].filter(Boolean).join(' · ')}</span></figcaption>
            </figure>
          ) : (
            <div className="hopewood-render-empty"><span>HOPEWOOD ARCHIVE</span><strong>{day?.title || 'NO SEALED DAY SELECTED'}</strong><p>{day ? 'This sealed day has no completed landscape visualization yet.' : 'Seal a completed day in THE.SUMMATION to begin the archive.'}</p></div>
          )}
        </section>

        <aside className="hopewood-lookup" aria-label="Find a Day Capsule">
          <div className="hopewood-drawer-content">
            <div className="hopewood-search-primary">
              {SEARCH_CATEGORIES.slice(0, 2).map(([key, label]) => (
                <label key={key}><span>{label}</span><select value={filters[key]} onChange={(event) => updateFilter(key, event.target.value)} aria-label={`Search Hopewood by ${label}`}><option value="">ALL {label}</option>{optionsByCategory[key].map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
              ))}
            </div>
            <div className="hopewood-search-crystals" aria-live="polite">
              {SEARCH_CATEGORIES.slice(2).map(([key, label]) => (
                <label key={key}><span>{label}</span><select value={filters[key]} onChange={(event) => updateFilter(key, event.target.value)} aria-label={`Search Hopewood by ${label}`}><option value="">ALL</option>{optionsByCategory[key].map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
              ))}
            </div>
            {hasActiveFilters && matches.length > 1 ? <select className="hopewood-match-picker" value={getHopewoodRecordDate(selected)} onChange={(event) => setSelectedDate(event.target.value)} aria-label="Matching sealed days">{matches.map((record) => { const recordDay = normalizeDayCapsuleRecord(record); const date = getHopewoodRecordDate(record); return <option key={record.id || date} value={date}>{recordDay.displayDate || date} · {recordDay.title}</option>; })}</select> : null}
          </div>
        </aside>
      </SectionOverlay>
    </SectionShell>
  );
}
