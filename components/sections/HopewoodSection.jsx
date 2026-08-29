'use client';

import { useEffect, useMemo, useState } from 'react';
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

const BACKGROUND_URL = '/backgrounds/HOPEWOOD/hopewood-archive-crystallization-v5.png';
const LOOKUP_MODES = [
  ['date', 'DATE'],
  ['mood', 'MOOD'],
  ['era', 'ERA'],
  ['lobito', 'LOBITO'],
  ['title', 'DAY TITLE'],
  ['word', 'WORD OF THE DAY'],
  ['phrase', 'KEYWORD / PHRASE'],
];

function fieldValue(record, mode) {
  const day = normalizeDayCapsuleRecord(record);
  return cleanAnalyticsText({
    date: day.sourceDate,
    mood: day.mood,
    era: day.era,
    lobito: day.lobito,
    title: day.title,
    word: day.word,
  }[mode]);
}

function searchableText(record) {
  return JSON.stringify(record).toLocaleLowerCase();
}

export default function HopewoodSection() {
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [lookupMode, setLookupMode] = useState('date');
  const [lookupValue, setLookupValue] = useState('');

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

  const options = useMemo(() => {
    if (lookupMode === 'phrase') return [];
    return [...new Set(records.map((record) => fieldValue(record, lookupMode)).filter(Boolean))]
      .sort((left, right) => lookupMode === 'date' ? right.localeCompare(left) : left.localeCompare(right));
  }, [lookupMode, records]);

  const matches = useMemo(() => {
    const query = lookupValue.trim().toLocaleLowerCase();
    const newest = [...records].reverse();
    if (!query) return newest;
    if (lookupMode === 'phrase') return newest.filter((record) => searchableText(record).includes(query));
    return newest.filter((record) => fieldValue(record, lookupMode).toLocaleLowerCase() === query);
  }, [lookupMode, lookupValue, records]);

  const selected = records.find((record) => getHopewoodRecordDate(record) === selectedDate) || matches[0] || records.at(-1) || null;
  const day = selected ? normalizeDayCapsuleRecord(selected) : null;
  const artifactUrl = getHopewoodArtifactUrl(selected);

  const chooseMode = (event) => {
    setLookupMode(event.target.value);
    setLookupValue('');
  };

  return (
    <SectionShell className="hopewood-page" aria-label="Hopewood Day Capsule archive">
      <ScenePlate className="hopewood-scene-plate"><img className="hopewood-bg" src={BACKGROUND_URL} alt="" aria-hidden="true" /></ScenePlate>
      <SectionOverlay className="hopewood-overlay">
        <section className="hopewood-render-panel" aria-label="Completed Summation render">
          {artifactUrl ? (
            <figure>
              <img src={artifactUrl} alt={`Completed Day Sketch for ${day?.displayDate || ''}`} />
              <figcaption><strong>{day?.title || 'UNTITLED DAY'}</strong><span>{[day?.displayDate, day?.dayOfWeek].filter(Boolean).join(' · ')}</span></figcaption>
            </figure>
          ) : (
            <div className="hopewood-render-empty"><span>SEALED DAY VISUALIZATION</span><strong>{day?.title || 'NO SEALED DAY SELECTED'}</strong><p>{day ? 'This Day Capsule has facts, but no completed landscape visualization is sealed yet.' : 'Choose a sealed day from the archive.'}</p></div>
          )}
        </section>

        <aside className="hopewood-lookup" aria-label="Find a Day Capsule">
          <header className="hopewood-lookup-heading"><span>HOPEWOOD ARCHIVE</span><h1>Find a sealed day</h1><p>Search only what CHAOTICA has actually saved.</p></header>
          <div className="hopewood-search-controls">
            <label htmlFor="hopewood-search-mode">LOOK UP BY</label>
            <select id="hopewood-search-mode" aria-label="Search Hopewood by" value={lookupMode} onChange={chooseMode}>
              {LOOKUP_MODES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {lookupMode === 'phrase'
              ? <input type="search" value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} placeholder="TYPE A WORD OR PHRASE" aria-label="Keyword or phrase" />
              : <select value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} aria-label={`${lookupMode} value`}><option value="">ALL</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>}
          </div>
          {day ? <section className="hopewood-selected-day" aria-label="Selected day"><span>SELECTED DAY</span><strong>{day.title || 'UNTITLED DAY'}</strong><p>{[day.displayDate, day.dayOfWeek].filter(Boolean).join(' · ')}</p>{[day.mood, day.era].filter(Boolean).length ? <small>{[day.mood, day.era].filter(Boolean).join(' · ')}</small> : null}</section> : null}
          <div className="hopewood-results" aria-live="polite">
            {matches.length ? matches.slice(0, 20).map((record) => {
              const date = getHopewoodRecordDate(record);
              return <button type="button" className={date === getHopewoodRecordDate(selected) ? 'is-active' : ''} key={record.id || date} onClick={() => setSelectedDate(date)}><strong>{fieldValue(record, 'title') || 'UNTITLED DAY'}</strong><span>{fieldValue(record, 'date')}</span></button>;
            }) : <span>NO MATCHES</span>}
          </div>
        </aside>
      </SectionOverlay>
    </SectionShell>
  );
}
