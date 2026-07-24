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
  dayCapsuleFactGroups,
  normalizeDayCapsuleRecord,
} from '../../src/services/dayCapsuleAnalytics';
import '../../styles/sections/hopewood.css';

const BACKGROUND_URL = '/backgrounds/HOPEWOOD/hopewood-archive-landscape-v4.png';
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

function FactGroup({ group }) {
  return (
    <section className={`hopewood-fact-group tone-${group.tone || 'steady'}`}>
      <h2>{group.title}</h2>
      {group.rows?.length ? <dl>{group.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{cleanAnalyticsText(value)}</dd></div>)}</dl> : null}
      {group.items?.length ? <ul>{group.items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : null}
    </section>
  );
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
  const groups = selected ? dayCapsuleFactGroups(selected) : [];
  const artifactUrl = getHopewoodArtifactUrl(selected);

  const chooseMode = (event) => {
    setLookupMode(event.target.value);
    setLookupValue('');
  };

  return (
    <SectionShell className="hopewood-page" aria-label="Hopewood Day Capsule archive">
      <ScenePlate className="hopewood-scene-plate"><img className="hopewood-bg" src={BACKGROUND_URL} alt="" aria-hidden="true" /></ScenePlate>
      <SectionOverlay className="hopewood-overlay">
        <article className="hopewood-facts-panel" aria-label="Factual Day Capsule">
          {!day ? <div className="hopewood-empty">NO SEALED DAYS</div> : (
            <div className="hopewood-facts-scroll">
              <header><span>SEALED DAY CAPSULE</span><h1>{day.title}</h1><p>{[day.displayDate, day.dayOfWeek].filter(Boolean).join(' · ')}</p></header>
              {groups.map((group) => <FactGroup key={group.title} group={group} />)}
            </div>
          )}
        </article>

        <section className="hopewood-render-panel" aria-label="Completed Summation render">
          {artifactUrl ? <img src={artifactUrl} alt={`Completed Day Sketch for ${day?.displayDate || ''}`} /> : <div className="hopewood-empty">NO LANDSCAPE RENDER SEALED</div>}
        </section>

        <aside className="hopewood-lookup" aria-label="Find a Day Capsule">
          <div className="hopewood-search-controls">
            <strong>FIND A DAY</strong>
            <select aria-label="Search Hopewood by" value={lookupMode} onChange={chooseMode}>
              {LOOKUP_MODES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {lookupMode === 'phrase'
              ? <input type="search" value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} placeholder="TYPE A WORD OR PHRASE" aria-label="Keyword or phrase" />
              : <select value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} aria-label={`${lookupMode} value`}><option value="">ALL</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>}
          </div>
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
