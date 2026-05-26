'use client';

import { useEffect, useMemo, useState } from 'react';
import { REMEMBER_MOMENT_BACKS, formatDisplayDate } from './RememberMeSection';
import '@/styles/sections/assurer.css';

const MOMENTS_STORAGE_KEY = 'remember_me_standout_moments_v1';
const ASSURER_FEED_KEY = 'the_assurer_feed';

const defaultProgress = [
  { key: 'protein', label: 'PROTEIN', value: 76 },
  { key: 'carbs', label: 'CARBS', value: 63 },
  { key: 'fats', label: 'FATS', value: 51 },
  { key: 'calories', label: 'CALORIES', value: 69 },
  { key: 'water', label: 'WATER', value: 58 }
];

const dailyChips = ['MOOD: LOCKED IN', 'ERA: BUILDER', 'SINGLENESS: FOCUSED', 'LOCATION: STUDIO A', 'WORD: DISCIPLINE', 'HEAD HUMMER: STAY LOW + GO'];

export default function AssurerSection() {
  const [moments, setMoments] = useState([]);
  const [assurerFeed, setAssurerFeed] = useState([]);
  const [flipped, setFlipped] = useState({});

  useEffect(() => {
    try {
      const rawMoments = JSON.parse(localStorage.getItem(MOMENTS_STORAGE_KEY) || '{}');
      const standoutCards = Object.entries(rawMoments || {}).flatMap(([date, list]) => (list || [])
        .filter((moment) => moment?.stamped)
        .map((moment) => ({ ...moment, date })));
      setMoments(standoutCards.slice(0, 6));
    } catch {
      setMoments([]);
    }

    try {
      const rawFeed = JSON.parse(localStorage.getItem(ASSURER_FEED_KEY) || '[]');
      setAssurerFeed((rawFeed || []).slice(-8).reverse());
    } catch {
      setAssurerFeed([]);
    }
  }, []);

  const mixedFlow = useMemo(() => {
    const feedSignals = assurerFeed.map((entry, index) => ({
      id: `feed-${entry.id || index}`,
      title: entry.title || entry.sessionTitle || entry.goal || 'Live Signal',
      detail: entry.note || entry.description || entry.location || 'Fresh pull from your day.',
      stamp: entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'LIVE'
    }));

    const momentSignals = moments.map((moment) => ({
      id: `moment-${moment.id}`,
      title: moment.standoutType || moment.type || 'Stamped Moment',
      detail: moment.description || moment.location || moment.detail || 'Snapshot saved.',
      stamp: formatDisplayDate(moment.date)
    }));

    return [...feedSignals, ...momentSignals].slice(0, 10);
  }, [assurerFeed, moments]);

  return <section className="assurer-section">
    <div className="assurer-overlay-shell">
      <header className="assurer-daily-header">
        <p className="assurer-kicker">THE.ASSURER • DAILY BLUEPRINT</p>
        <h1>TUESDAY BUILD: STAY SHARP + FINISH STRONG</h1>
        <div className="assurer-progress-cluster">
          {defaultProgress.map((item) => <div className="assurer-progress-row" key={item.key}>
            <span>{item.label}</span>
            <div className="assurer-progress-track"><i style={{ width: `${item.value}%` }} /></div>
            <b>{item.value}%</b>
          </div>)}
        </div>
      </header>

      <div className="assurer-chip-ribbon">{dailyChips.map((chip) => <span key={chip}>{chip}</span>)}</div>

      <div className="assurer-main-islands">
        <div className="assurer-flow-column left">
          {mixedFlow.slice(0, 5).map((item) => <article key={item.id} className="assurer-signal-card">
            <h3>{item.title}</h3><p>{item.detail}</p><time>{item.stamp}</time>
          </article>)}
        </div>

        <aside className="assurer-thoughts-card">
          <h2>ASSURED THOUGHTS</h2>
          <p>I move with intention today. I protect the mission, feed the body with purpose, and keep my promises even when no one is watching.</p>
        </aside>

        <div className="assurer-flow-column right">
          {mixedFlow.slice(5, 10).map((item) => <article key={item.id} className="assurer-signal-card">
            <h3>{item.title}</h3><p>{item.detail}</p><time>{item.stamp}</time>
          </article>)}
        </div>
      </div>

      <div className="assurer-memory-strip">
        {moments.slice(0, 4).map((standout) => {
          const back = REMEMBER_MOMENT_BACKS[standout.standoutType] || REMEMBER_MOMENT_BACKS[standout.type];
          return <button key={standout.id} type="button" className="assurer-mini-flip" onClick={() => setFlipped((curr) => ({ ...curr, [standout.id]: !curr[standout.id] }))}>
            {!flipped[standout.id] ? <>
              {back ? <img src={back.src} alt={back.alt} /> : <div className="assurer-mini-fallback">MOMENT</div>}
              <span>{standout.standoutType || standout.type}</span>
            </> : <>
              <strong>{formatDisplayDate(standout.date)}</strong>
              <p>{standout.description || standout.location || standout.detail || 'Pinned moment.'}</p>
            </>}
          </button>;
        })}
      </div>

      <div className="assurer-rhythm-cluster">
        <h3>DAILY RHYTHM</h3>
        <ul>
          <li><span>06:30</span><p>Prep stack + water kickstart</p></li>
          <li><span>10:00</span><p>Training block + client power set</p></li>
          <li><span>14:30</span><p>Nutrition reset + note capture</p></li>
          <li><span>19:30</span><p>Reflection + next-day lock in</p></li>
        </ul>
      </div>

      <div className="assurer-mista-anchor">MISTA.THICC</div>
    </div>
  </section>;
}
