'use client';

import { useEffect, useMemo, useState } from 'react';
import { ScenePlate, SectionShell } from '../shared/UniversalSectionFrame';
import { fetchHopewoodSummationArchive, HOPEWOOD_ARCHIVE_UPDATED_EVENT, readHopewoodSummationArchive } from '../../src/services/hopewoodService';
import { buildAnnual525600Intelligence } from '../../src/services/annual525600Service';
import '../../styles/sections/525600.css';

const BACKGROUND_URL = '/backgrounds/525600/525600-bg.png';
function RankedList({ title, items }) {
  if (!items.length) return null;
  return <div className="annual525600-ranked"><h3>{title}</h3>{items.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.count}</strong></div>)}</div>;
}

export default function Annual525600Section() {
  const [records, setRecords] = useState([]);
  const [year, setYear] = useState('');
  useEffect(() => {
    const refresh = () => setRecords(readHopewoodSummationArchive());
    refresh();
    fetchHopewoodSummationArchive().then(setRecords).catch(() => {});
    window.addEventListener(HOPEWOOD_ARCHIVE_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(HOPEWOOD_ARCHIVE_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  const intelligence = useMemo(() => buildAnnual525600Intelligence(records, year), [records, year]);

  return (
    <SectionShell className="annual525600-page" aria-label="525600 annual review and yearly trend intelligence">
      <ScenePlate className="annual525600-scene-plate">
        <img className="annual525600-bg" src={BACKGROUND_URL} alt="" aria-hidden="true" />
      </ScenePlate>
      <main className="annual525600-feed-grid" aria-label="525600 yearly intelligence feed zones">
        <header className="annual525600-header">
          <div><span>THE YEAR IN LIVED TRUTH</span><h1>525,600</h1><p>Minutes become days. Days become patterns. Nothing here is invented.</p></div>
          <label>YEAR<select value={intelligence.year} onChange={(event) => setYear(event.target.value)}>{intelligence.years.length ? intelligence.years.map((option) => <option key={option}>{option}</option>) : <option>{intelligence.year}</option>}</select></label>
        </header>
        {!intelligence.records.length ? (
          <section className="annual525600-empty"><span>THE YEAR AWAITS ITS RECEIPTS</span><h2>No HOPEWOOD records are sealed for {intelligence.year}.</h2><p>Completed Day Capsules will build this annual intelligence automatically.</p></section>
        ) : <>
          <section className="annual525600-feed-zone annual525600-coverage" aria-label="Year coverage">
            <header><h2>YEARLY PATTERNS</h2><strong>{intelligence.sealedDays}</strong><span>SEALED DAYS · {intelligence.coveragePercent}% OF THE YEAR</span></header>
            <div className="annual525600-months">{intelligence.months.map((month) => <div key={month.month} data-active={month.count > 0}><span>{month.label}</span><strong>{month.count}</strong></div>)}</div>
          </section>
          <section className="annual525600-feed-zone" aria-label="Normalized source data">
            <h2>NORMALIZED SOURCE DATA</h2>
            <div className="annual525600-totals"><div><strong>{intelligence.totals.rememberedMoments}</strong><span>REMEMBERED MOMENTS</span></div><div><strong>{intelligence.totals.workoutSignals}</strong><span>WORKOUT SIGNALS</span></div><div><strong>{intelligence.totals.mealSignals}</strong><span>FOOD SIGNALS</span></div></div>
          </section>
          <section className="annual525600-feed-zone" aria-label="Hopewood metadata">
            <h2>HOPEWOOD METADATA</h2>
            <ol className="annual525600-days">{[...intelligence.records].reverse().slice(0, 12).map((record) => <li key={record.id || record.sourceDate}><time>{record.displayDate || record.sourceDate}</time><span>{record.title || record.dayIdentity?.titleOfDay || 'UNTITLED DAY'}</span></li>)}</ol>
          </section>
          <section className="annual525600-feed-zone" aria-label="Trend intelligence">
            <h2>TREND INTELLIGENCE</h2>
            <div className="annual525600-patterns"><RankedList title="MOODS" items={intelligence.patterns.moods} /><RankedList title="ERAS" items={intelligence.patterns.eras} /><RankedList title="WORDS" items={intelligence.patterns.words} /><RankedList title="SINGLENESS" items={intelligence.patterns.singleness} /></div>
          </section>
        </>}
      </main>
    </SectionShell>
  );
}
