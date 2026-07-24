'use client';

import { useEffect, useMemo, useState } from 'react';
import { ScenePlate, SectionShell } from '../shared/UniversalSectionFrame';
import { fetchHopewoodSummationArchive, HOPEWOOD_ARCHIVE_UPDATED_EVENT, readHopewoodSummationArchive } from '../../src/services/hopewoodService';
import { buildAnnual525600Intelligence } from '../../src/services/annual525600Service';
import '../../styles/sections/525600.css';

const BACKGROUND_URL = '/backgrounds/525600/525600-bg.png';
const WINDOWS = [['week', '7 DAYS'], ['6m', '6 MONTHS'], ['12m', '12 MONTHS'], ['year', 'YEAR']];

function RankedList({ title, items = [] }) {
  if (!items.length) return <div className="annual525600-no-signal">NO SEALED SIGNALS</div>;
  return <div className="annual525600-ranked"><h3>{title}</h3>{items.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.count}</strong></div>)}</div>;
}

function Trend({ label, trend }) {
  return <div className="annual525600-trend"><span>{label}</span><strong>{trend.latest ?? '—'}</strong><small>{trend.change === null ? 'NO COMPARISON' : `${trend.change > 0 ? '+' : ''}${trend.change} CHANGE`}</small></div>;
}

function ReviewCard({ number, title, children, className = '' }) {
  return <section className={`annual525600-card ${className}`}><header><span>0{number}</span><h2>{title}</h2></header>{children}</section>;
}

export default function Annual525600Section() {
  const [records, setRecords] = useState([]);
  const [year, setYear] = useState('');
  const [windowKey, setWindowKey] = useState('year');
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
  const intelligence = useMemo(() => buildAnnual525600Intelligence(records, { year, windowKey }), [records, year, windowKey]);

  return (
    <SectionShell className="annual525600-page" aria-label="525600 trend and annual review">
      <ScenePlate className="annual525600-scene-plate"><img className="annual525600-bg" src={BACKGROUND_URL} alt="" aria-hidden="true" /></ScenePlate>
      <main className="annual525600-shell">
        <header className="annual525600-header">
          <div><span>THE YEAR IN LIVED TRUTH</span><h1>525,600</h1><p>{intelligence.sealedDays} sealed Day Capsules in this view · every conclusion links back to HOPEWOOD.</p></div>
          <div className="annual525600-controls">
            <div>{WINDOWS.map(([value, label]) => <button type="button" key={value} className={windowKey === value ? 'active' : ''} onClick={() => setWindowKey(value)}>{label}</button>)}</div>
            <label>YEAR<select value={intelligence.year} onChange={(event) => setYear(event.target.value)}>{intelligence.years.length ? intelligence.years.map((option) => <option key={option}>{option}</option>) : <option>{intelligence.year}</option>}</select></label>
          </div>
        </header>

        {!intelligence.days.length ? <section className="annual525600-empty"><h2>THE YEAR AWAITS ITS RECEIPTS</h2><p>Seal completed Day Capsules into HOPEWOOD to begin the review.</p></section> : (
          <div className="annual525600-review-grid">
            <ReviewCard number="1" title="EMOTIONAL WEATHER" className="annual525600-emotional">
              <div className="annual525600-callouts"><strong>{intelligence.emotional.intenseDays}</strong><span>IS YOU GOOD BRO 👀? DAYS</span><strong>{intelligence.emotional.victoryDays}</strong><span>VICTORY DAYS</span></div>
              <div className="annual525600-two"><RankedList title="MOOD" items={intelligence.emotional.moods} /><RankedList title="MOOD + ERA + LOBITO" items={intelligence.emotional.combinations} /></div>
            </ReviewCard>

            <ReviewCard number="2" title="WORDS THAT CARRIED ME">
              <div className="annual525600-two"><RankedList title="PENNY ANSWERS" items={intelligence.words.penny} /><RankedList title="BATTLE CRIES" items={intelligence.words.battleCries} /></div>
              <RankedList title="ASSURED THOUGHTS" items={intelligence.words.assured} />
            </ReviewCard>

            <ReviewCard number="3" title="PLOT, MEMORY & LIFE">
              <div className="annual525600-big-number"><strong>{intelligence.memory.total}</strong><span>SEALED MOMENTS</span></div>
              <RankedList title="WOW · WTF · PLOT TWIST · EVENTS" items={intelligence.memory.highlights} />
            </ReviewCard>

            <ReviewCard number="4" title="FOOD, MACROS & ADHERENCE">
              <div className="annual525600-callouts"><strong>{intelligence.nutrition.loggedDays}</strong><span>LOGGED DAYS</span><strong>{intelligence.nutrition.signals}</strong><span>FOOD SIGNALS</span></div>
              <RankedList title="MEALS · MACROS · TREATS · CRAVINGS" items={intelligence.nutrition.highlights} />
            </ReviewCard>

            <ReviewCard number="5" title="STRENGTH, MUSCLE & BODY">
              <div className="annual525600-trends"><Trend label="WEIGHT" trend={intelligence.strength.weight} /><Trend label="BMI" trend={intelligence.strength.bmi} /><Trend label="BODY FAT" trend={intelligence.strength.bodyFat} /></div>
              <RankedList title={`${intelligence.strength.trainedDays} TRAINED DAYS · HEAVY LIFTS & DEVELOPMENT`} items={intelligence.strength.highlights} />
            </ReviewCard>

            <ReviewCard number="6" title="DISCIPLINE, TIME & MOMENTUM">
              <div className="annual525600-callouts"><strong>{intelligence.discipline.scheduledDays}</strong><span>SCHEDULED DAYS</span><strong>{intelligence.discipline.sleepDays}</strong><span>SLEEP RECEIPTS</span></div>
              <RankedList title="THICC.TIME · CONSISTENCY · RECOVERY" items={intelligence.discipline.highlights} />
            </ReviewCard>

            <ReviewCard number="7" title="THE YEAR’S VERDICT" className="annual525600-verdict">
              <dl>
                <div><dt>DOMINANT MOOD</dt><dd>{intelligence.verdict.dominantMood || '—'}</dd></div>
                <div><dt>DOMINANT ERA</dt><dd>{intelligence.verdict.dominantEra || '—'}</dd></div>
                <div><dt>DEFINING WORD</dt><dd>{intelligence.verdict.definingWord || '—'}</dd></div>
                <div><dt>BIGGEST WIN</dt><dd>{intelligence.verdict.biggestWin || '—'}</dd></div>
                <div><dt>HARDEST PATTERN</dt><dd>{intelligence.verdict.hardestPattern || '—'}</dd></div>
              </dl>
              <blockquote>{intelligence.verdict.goodBroAnswer}</blockquote>
            </ReviewCard>
          </div>
        )}
      </main>
    </SectionShell>
  );
}
