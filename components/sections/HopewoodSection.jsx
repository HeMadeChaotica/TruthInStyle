'use client';

import { useEffect, useMemo, useState } from 'react';
import { ContentScroller, ScenePlate, SectionOverlay, SectionShell } from '../shared/UniversalSectionFrame';
import { getHopewoodArtifactUrl, getHopewoodRecordDate, HOPEWOOD_ARCHIVE_UPDATED_EVENT, readHopewoodSummationArchive } from '../../src/services/hopewoodService';
import '../../styles/sections/hopewood.css';

const BACKGROUND_URL = '/backgrounds/HOPEWOOD/hopewood-bg.png';

function signalCount(value) {
  if (Array.isArray(value)) return value.filter(Boolean).length;
  if (value && typeof value === 'object') return Object.values(value).reduce((total, entry) => total + signalCount(entry), 0);
  return value === null || value === undefined || value === '' ? 0 : 1;
}

function signalSummary(value, singular) {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  const count = signalCount(value);
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

export default function HopewoodSection() {
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const refresh = () => {
      const archive = readHopewoodSummationArchive();
      setRecords(archive);
      setSelectedDate((current) => current || getHopewoodRecordDate(archive[archive.length - 1]));
    };
    refresh();
    window.addEventListener(HOPEWOOD_ARCHIVE_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(HOPEWOOD_ARCHIVE_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const selectedIndex = useMemo(() => records.findIndex((record) => getHopewoodRecordDate(record) === selectedDate), [records, selectedDate]);
  const selected = selectedIndex >= 0 ? records[selectedIndex] : records[records.length - 1] || null;
  const artifactUrl = getHopewoodArtifactUrl(selected);
  const identity = selected?.dayIdentity || selected?.future525600?.dayIdentity || {};
  const truth = selected?.sourceTruthSnapshot || selected?.fullAssurerDaySnapshot || {};
  const signals = selected?.sourceSignals || selected?.future525600?.sourceSignals || {};
  const move = (offset) => {
    const next = records[selectedIndex + offset];
    if (next) setSelectedDate(getHopewoodRecordDate(next));
  };

  return (
    <SectionShell className="hopewood-page" aria-label="Hopewood archive viewer">
      <ScenePlate className="hopewood-scene-plate">
        <img className="hopewood-bg" src={BACKGROUND_URL} alt="" aria-hidden="true" />
      </ScenePlate>
      <SectionOverlay className="hopewood-overlay">
        <section className="hopewood-lookup-reserve" aria-label="Hopewood archive lookup">
          <span className="hopewood-eyebrow">THE ARCHIVE OF LIVED TRUTH</span>
          <h1>HOPEWOOD</h1>
          <p>Every completed Day Capsule, sealed exactly as it was lived.</p>
          <label>
            OPEN A DAY
            <select value={selected ? getHopewoodRecordDate(selected) : ''} onChange={(event) => setSelectedDate(event.target.value)} disabled={!records.length}>
              {!records.length ? <option value="">NO SEALED DAYS YET</option> : null}
              {[...records].reverse().map((record) => {
                const date = getHopewoodRecordDate(record);
                return <option key={record.id || date} value={date}>{record.displayDate || record.dayIdentity?.displayDate || date} · {record.title || record.dayIdentity?.titleOfDay || 'UNTITLED DAY'}</option>;
              })}
            </select>
          </label>
          <div className="hopewood-day-nav">
            <button type="button" onClick={() => move(-1)} disabled={selectedIndex <= 0}>PREVIOUS</button>
            <span>{records.length ? `${selectedIndex + 1} OF ${records.length}` : '0 DAYS'}</span>
            <button type="button" onClick={() => move(1)} disabled={selectedIndex < 0 || selectedIndex >= records.length - 1}>NEXT</button>
          </div>
        </section>
        <section className="hopewood-art-reserve" aria-label="Sealed Day Capsule artwork">
          {artifactUrl ? <img src={artifactUrl} alt={`Day Capsule for ${selected?.displayDate || getHopewoodRecordDate(selected)}`} /> : <div className="hopewood-art-empty">THE VISUAL ARTIFACT WILL REST HERE</div>}
        </section>
        <ContentScroller className="hopewood-book-space" aria-label="Open Book of Life viewing space">
          {!selected ? (
            <div className="hopewood-empty"><span>THE BOOK AWAITS</span><h2>No sealed Day Capsules yet.</h2><p>Complete a render in THE.SUMMATION, then use So Let It Be Done in the Control Panel.</p></div>
          ) : (
            <article className="hopewood-record">
              <header><span>OPEN BOOK OF LIFE</span><h2>{selected.title || identity.titleOfDay || 'UNTITLED DAY'}</h2><p>{selected.displayDate || identity.displayDate || getHopewoodRecordDate(selected)} · {selected.dayOfWeek || identity.dayOfWeek || ''}</p></header>
              <section><h3>THE DAY</h3><dl>
                {selected.mood || truth.mood ? <div><dt>Mood</dt><dd>{selected.mood || truth.mood}</dd></div> : null}
                {selected.era || truth.era ? <div><dt>Era</dt><dd>{selected.era || truth.era}</dd></div> : null}
                {selected.singleness || truth.singlenessLevel ? <div><dt>Singleness</dt><dd>{selected.singleness || truth.singlenessLevel}</dd></div> : null}
                {truth.wordOfDay ? <div><dt>Word</dt><dd>{typeof truth.wordOfDay === 'object' ? truth.wordOfDay.word : truth.wordOfDay}</dd></div> : null}
              </dl></section>
              {selected.selectedVersionContent ? <section><h3>THE SUMMATION</h3><p className="hopewood-story">{selected.selectedVersionContent}</p></section> : null}
              {Object.values(signals).some(Boolean) ? <section><h3>THE RECEIPTS</h3><dl>
                {signals.thiccTime ? <div><dt>THICC.TIME</dt><dd>{signalSummary(signals.thiccTime, 'schedule signal')}</dd></div> : null}
                {signals.rememberMe ? <div><dt>REMEMBER.ME</dt><dd>{signalSummary(signals.rememberMe, 'captured moment')}</dd></div> : null}
                {signals.thiccFitt ? <div><dt>THICC.FITT</dt><dd>{signalSummary(signals.thiccFitt, 'workout signal')}</dd></div> : null}
                {signals.daEater ? <div><dt>DA.EATER</dt><dd>{signalSummary(signals.daEater, 'food signal')}</dd></div> : null}
              </dl></section> : null}
              <footer>SEALED {selected.sealedAt ? new Date(selected.sealedAt).toLocaleString() : 'IN THE.SUMMATION'}</footer>
            </article>
          )}
        </ContentScroller>
      </SectionOverlay>
    </SectionShell>
  );
}
