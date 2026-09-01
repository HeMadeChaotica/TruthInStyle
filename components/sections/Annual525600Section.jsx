'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ScenePlate, SectionShell } from '../shared/UniversalSectionFrame';
import { fetchHopewoodSummationArchive, HOPEWOOD_ARCHIVE_UPDATED_EVENT, readHopewoodSummationArchive } from '../../src/services/hopewoodService';
import { buildAnnual525600Intelligence } from '../../src/services/annual525600Service';
import '../../styles/sections/525600.css';
import FloatingCrystalTileDeck from '../shared/FloatingCrystalTileDeck';

const BACKGROUND_URL = '/backgrounds/525600/525600-crystallization-operations-court-v3.png';
const WINDOWS = [['week', '7 DAYS'], ['30d', '30 DAYS'], ['6m', '6 MONTHS'], ['9m', '9 MONTHS'], ['12m', '1 YEAR']];

function RankedList({ title, items = [] }) {
  if (!items.length) return <div className="annual525600-no-signal">NO SEALED SIGNALS</div>;
  return <div className="annual525600-ranked"><h3>{title}</h3>{items.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.count}</strong></div>)}</div>;
}

function Trend({ label, trend }) {
  return <div className="annual525600-trend"><span>{label}</span><strong>{trend.latest ?? '—'}</strong><small>{trend.change === null ? 'NO COMPARISON' : `${trend.change > 0 ? '+' : ''}${trend.change} CHANGE`}</small></div>;
}

export default function Annual525600Section() {
  const [records, setRecords] = useState([]);
  const [windowKey, setWindowKey] = useState('12m');
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
  const intelligence = useMemo(() => buildAnnual525600Intelligence(records, { windowKey }), [records, windowKey]);

  const tiles = [
    { id: 'emotional-weather', title: '01 EMOTIONAL WEATHER', summary: `${intelligence.emotional.intenseDays} INTENSE DAYS\n${intelligence.emotional.victoryDays} VICTORY DAYS`, content: <><div className="annual525600-callouts"><strong>{intelligence.emotional.intenseDays}</strong><span>IS YOU GOOD BRO 👀? DAYS</span><strong>{intelligence.emotional.victoryDays}</strong><span>VICTORY DAYS</span></div><div className="annual525600-two"><RankedList title="MOOD" items={intelligence.emotional.moods} /><RankedList title="MOOD + ERA + LOBITO" items={intelligence.emotional.combinations} /></div></> },
    { id: 'words-carried', title: '02 WORDS THAT CARRIED ME', summary: `${intelligence.words.penny.length} PENNY ANSWERS\n${intelligence.words.battleCries.length} BATTLE CRIES`, content: <><div className="annual525600-two"><RankedList title="PENNY ANSWERS" items={intelligence.words.penny} /><RankedList title="BATTLE CRIES" items={intelligence.words.battleCries} /></div><RankedList title="ASSURED THOUGHTS" items={intelligence.words.assured} /></> },
    { id: 'plot-memory', title: '03 PLOT, MEMORY & LIFE', summary: `${intelligence.memory.total} SEALED MOMENTS`, content: <><div className="annual525600-big-number"><strong>{intelligence.memory.total}</strong><span>SEALED MOMENTS</span></div><RankedList title="WOW · WTF · PLOT TWIST · EVENTS" items={intelligence.memory.highlights} /></> },
    { id: 'food-macros', title: '04 FOOD, MACROS & ADHERENCE', summary: `${intelligence.nutrition.loggedDays} LOGGED DAYS\n${intelligence.nutrition.signals} FOOD SIGNALS`, content: <><div className="annual525600-callouts"><strong>{intelligence.nutrition.loggedDays}</strong><span>LOGGED DAYS</span><strong>{intelligence.nutrition.signals}</strong><span>FOOD SIGNALS</span></div><RankedList title="MEALS · MACROS · TREATS · CRAVINGS" items={intelligence.nutrition.highlights} /></> },
    { id: 'strength-body', title: '05 STRENGTH, MUSCLE & BODY', summary: `${intelligence.strength.trainedDays} TRAINED DAYS\n${intelligence.strength.signals} STRENGTH SIGNALS`, content: <><div className="annual525600-trends"><Trend label="WEIGHT" trend={intelligence.strength.weight} /><Trend label="BMI" trend={intelligence.strength.bmi} /><Trend label="BODY FAT" trend={intelligence.strength.bodyFat} /></div><RankedList title={`${intelligence.strength.trainedDays} TRAINED DAYS · HEAVY LIFTS & DEVELOPMENT`} items={intelligence.strength.highlights} /></> },
    { id: 'discipline-time', title: '06 DISCIPLINE, TIME & MOMENTUM', summary: `${intelligence.discipline.scheduledDays} SCHEDULED DAYS\n${intelligence.discipline.sleepDays} SLEEP RECEIPTS`, content: <><div className="annual525600-callouts"><strong>{intelligence.discipline.scheduledDays}</strong><span>SCHEDULED DAYS</span><strong>{intelligence.discipline.sleepDays}</strong><span>SLEEP RECEIPTS</span></div><RankedList title="THICC.TIME · CONSISTENCY · RECOVERY" items={intelligence.discipline.highlights} /></> },
    { id: 'years-verdict', title: '07 THE YEAR’S VERDICT', summary: `${intelligence.verdict.dominantMood || 'MOOD PENDING'}\n${intelligence.verdict.definingWord || 'DEFINING WORD PENDING'}`, content: <><dl className="annual525600-verdict-list"><div><dt>DOMINANT MOOD</dt><dd>{intelligence.verdict.dominantMood || '—'}</dd></div><div><dt>DOMINANT ERA</dt><dd>{intelligence.verdict.dominantEra || '—'}</dd></div><div><dt>DEFINING WORD</dt><dd>{intelligence.verdict.definingWord || '—'}</dd></div><div><dt>BIGGEST WIN</dt><dd>{intelligence.verdict.biggestWin || '—'}</dd></div><div><dt>HARDEST PATTERN</dt><dd>{intelligence.verdict.hardestPattern || '—'}</dd></div></dl><blockquote>{intelligence.verdict.goodBroAnswer}</blockquote></> },
  ];

  return (
    <SectionShell className="annual525600-page" aria-label="525600 trend and annual review">
      <ScenePlate className="annual525600-scene-plate"><Image className="annual525600-bg" src={BACKGROUND_URL} alt="" fill priority sizes="100vw" /></ScenePlate>
      <nav className="annual525600-window-tabs" aria-label="Review range">{WINDOWS.map(([value, label]) => <button type="button" key={value} className={windowKey === value ? 'active' : ''} onClick={() => setWindowKey(value)}>{label}</button>)}</nav>
      <p className="annual525600-capsule-count">{intelligence.sealedDays} SEALED DAY CAPSULES IN THIS VIEW</p>
      <FloatingCrystalTileDeck className="annual525600-floating-deck" tiles={tiles} ariaLabel="525600 review stations" />
    </SectionShell>
  );
}
