'use client';

import { useEffect, useMemo, useState } from 'react';
import { ContentScroller, ScenePlate, SectionOverlay, SectionShell } from '../shared/UniversalSectionFrame';
import { fetchHopewoodSummationArchive, getHopewoodArtifactUrl, getHopewoodRecordDate, HOPEWOOD_ARCHIVE_UPDATED_EVENT, readHopewoodSummationArchive } from '../../src/services/hopewoodService';
import '../../styles/sections/hopewood.css';

const BACKGROUND_URL = '/backgrounds/HOPEWOOD/hopewood-archive-v3.png';
const LOOKUP_MODES = [
  ['date', 'DATE'],
  ['mood', 'MOOD'],
  ['era', 'ERA'],
  ['title', 'DAY TITLE'],
  ['word', 'WORD OF THE DAY'],
  ['phrase', 'KEYWORD / PHRASE'],
];

function recordIdentity(record) {
  return record?.dayIdentity || record?.future525600?.dayIdentity || {};
}

function recordTruth(record) {
  return record?.sourceTruthSnapshot || record?.fullAssurerDaySnapshot || {};
}

function valueText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(valueText).filter(Boolean).join(' ');
  if (typeof value === 'object') return Object.values(value).map(valueText).filter(Boolean).join(' ');
  return '';
}

function fieldValue(record, mode) {
  const identity = recordIdentity(record);
  const truth = recordTruth(record);
  const word = truth.wordOfDay;
  const fields = {
    date: record.displayDate || identity.displayDate || getHopewoodRecordDate(record),
    mood: record.mood || truth.mood,
    era: record.era || truth.era,
    title: record.title || identity.titleOfDay,
    word: typeof word === 'object' ? word?.word : word,
  };
  return valueText(fields[mode]).trim();
}

function searchableText(record) {
  return valueText({
    date: getHopewoodRecordDate(record),
    displayDate: fieldValue(record, 'date'),
    mood: fieldValue(record, 'mood'),
    era: fieldValue(record, 'era'),
    title: fieldValue(record, 'title'),
    word: fieldValue(record, 'word'),
    summation: record?.selectedVersionContent,
    truth: recordTruth(record),
    signals: record?.sourceSignals || record?.future525600?.sourceSignals,
  }).toLocaleLowerCase();
}

function readableDate(record) {
  return fieldValue(record, 'date') || getHopewoodRecordDate(record);
}

export default function HopewoodSection() {
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [lookupMode, setLookupMode] = useState('date');
  const [lookupValue, setLookupValue] = useState('');

  useEffect(() => {
    const applyArchive = (archive) => {
      setRecords(archive);
      setSelectedDate((current) => current || getHopewoodRecordDate(archive[archive.length - 1]));
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
    const newestFirst = [...records].reverse();
    if (!query) return newestFirst;
    if (lookupMode === 'phrase') return newestFirst.filter((record) => searchableText(record).includes(query));
    return newestFirst.filter((record) => fieldValue(record, lookupMode).toLocaleLowerCase() === query);
  }, [lookupMode, lookupValue, records]);

  const selected = records.find((record) => getHopewoodRecordDate(record) === selectedDate) || matches[0] || records[records.length - 1] || null;
  const identity = recordIdentity(selected);
  const truth = recordTruth(selected);
  const signals = selected?.sourceSignals || selected?.future525600?.sourceSignals || {};
  const artifactUrl = getHopewoodArtifactUrl(selected);
  const wordOfDay = typeof truth.wordOfDay === 'object' ? truth.wordOfDay?.word : truth.wordOfDay;
  const facts = [
    ['MOOD', selected?.mood || truth.mood],
    ['ERA', selected?.era || truth.era],
    ['SINGLENESS', selected?.singleness || truth.singlenessLevel],
    ['WORD', wordOfDay],
  ].filter(([, value]) => valueText(value));

  const chooseMode = (event) => {
    setLookupMode(event.target.value);
    setLookupValue('');
  };

  return (
    <SectionShell className="hopewood-page" aria-label="Hopewood Day Capsule archive">
      <ScenePlate className="hopewood-scene-plate">
        <img className="hopewood-bg" src={BACKGROUND_URL} alt="" aria-hidden="true" />
      </ScenePlate>
      <SectionOverlay className="hopewood-overlay">
        <ContentScroller className="hopewood-page-panel hopewood-left-page" aria-label="Factual Day Record">
          {!selected ? <div className="hopewood-empty">NO SEALED DAYS</div> : <article className="hopewood-record">
            <header>
              <span>DAY RECORD</span>
              <h1>{selected.title || identity.titleOfDay || 'UNTITLED DAY'}</h1>
              <p>{readableDate(selected)}{selected.dayOfWeek || identity.dayOfWeek ? ` · ${selected.dayOfWeek || identity.dayOfWeek}` : ''}</p>
            </header>
            {facts.length ? <dl className="hopewood-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{valueText(value)}</dd></div>)}</dl> : null}
            {selected.selectedVersionContent ? <section className="hopewood-summation"><h2>THE SUMMATION</h2><p>{selected.selectedVersionContent}</p></section> : null}
            {Object.values(signals).some(Boolean) ? <section className="hopewood-sources"><h2>SOURCES</h2><p>{['thiccTime', 'rememberMe', 'thiccFitt', 'daEater'].filter((key) => signals[key]).map((key) => key.replace(/([a-z])([A-Z])/g, '$1.$2').toUpperCase()).join(' · ')}</p></section> : null}
          </article>}
        </ContentScroller>

        <section className="hopewood-page-panel hopewood-right-page" aria-label="Day Visualization">
          {artifactUrl ? <img src={artifactUrl} alt={`Day Visualization for ${readableDate(selected)}`} /> : <div className="hopewood-empty">NO VISUALIZATION SEALED</div>}
        </section>

        <aside className="hopewood-catalog" aria-label="Find a Day Capsule">
          <div className="hopewood-search-controls">
            <h2>FIND A DAY</h2>
            <select aria-label="Search Hopewood by" value={lookupMode} onChange={chooseMode}>
              {LOOKUP_MODES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {lookupMode === 'phrase' ? <input type="search" value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} placeholder="TYPE A WORD OR PHRASE" aria-label="Keyword or phrase" /> : <select value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} aria-label={`${lookupMode} value`}><option value="">ALL</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>}
          </div>
          <div className="hopewood-results" aria-live="polite">
            {matches.length ? matches.map((record) => {
              const date = getHopewoodRecordDate(record);
              const active = date === getHopewoodRecordDate(selected);
              return <button type="button" className={active ? 'is-active' : ''} key={record.id || date} onClick={() => setSelectedDate(date)}><strong>{fieldValue(record, 'title') || 'UNTITLED DAY'}</strong><span>{readableDate(record)}</span></button>;
            }) : <span className="hopewood-no-results">NO MATCHES</span>}
          </div>
        </aside>
      </SectionOverlay>
    </SectionShell>
  );
}
