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

const BACKGROUND_URL = '/backgrounds/HOPEWOOD/hopewood-archive-hall-approved-v6.png';
const LOOKUP_MODES = [
  ['date', 'DATE'],
  ['phrase', 'WORDS'],
  ['mood', 'FEELING'],
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
  const [drawerOpen, setDrawerOpen] = useState(true);

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

  const chooseMode = (mode) => {
    setLookupMode(mode);
    setLookupValue('');
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
            <div className="hopewood-render-empty"><span>SEALED DAY VISUALIZATION</span><strong>{day?.title || 'NO SEALED DAY SELECTED'}</strong><p>{day ? 'This Day Capsule has facts, but no completed landscape visualization is sealed yet.' : 'Choose a sealed day from the archive.'}</p></div>
          )}
        </section>

        <aside className={`hopewood-lookup ${drawerOpen ? 'is-open' : 'is-collapsed'}`} aria-label="Find a Day Capsule">
          <button className="hopewood-drawer-crystal" type="button" onClick={() => setDrawerOpen((current) => !current)} aria-expanded={drawerOpen} aria-label={drawerOpen ? 'Collapse Hopewood archive search' : 'Open Hopewood archive search'}>✦</button>
          {drawerOpen ? <div className="hopewood-drawer-content">
            <div className="hopewood-search-row">
              <label><span className="sr-only">SEARCH HOPEWOOD</span>{lookupMode === 'phrase'
                ? <input type="search" value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} placeholder="SEARCH HOPEWOOD" aria-label="Search Hopewood words" />
                : <select value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} aria-label={`${lookupMode} value`}><option value="">SEARCH HOPEWOOD · ALL</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>}</label>
              <div className="hopewood-mode-tabs">{LOOKUP_MODES.map(([value, label]) => <button type="button" key={value} className={lookupMode === value ? 'active' : ''} onClick={() => chooseMode(value)}>{label}</button>)}</div>
            </div>
            <div className="hopewood-results" aria-live="polite">
            {matches.length ? matches.slice(0, 12).map((record) => {
              const date = getHopewoodRecordDate(record);
              const recordDay = normalizeDayCapsuleRecord(record);
              const thumb = getHopewoodArtifactUrl(record);
              return <button type="button" className={date === getHopewoodRecordDate(selected) ? 'is-active' : ''} key={record.id || date} onClick={() => setSelectedDate(date)}>{thumb ? <span className="hopewood-result-thumb" style={{ backgroundImage: `url(${thumb})` }} /> : <span className="hopewood-result-thumb is-empty">✦</span>}<strong>{recordDay.title || 'UNTITLED DAY'}</strong><span>{recordDay.displayDate || date}</span></button>;
            }) : <span>NO MATCHES</span>}
            </div>
          </div> : null}
        </aside>
      </SectionOverlay>
    </SectionShell>
  );
}
