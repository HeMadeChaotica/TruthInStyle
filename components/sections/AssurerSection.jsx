'use client';

import { useEffect, useState } from 'react';
import { REMEMBER_MOMENT_BACKS, formatDisplayDate } from './RememberMeSection';

const MOMENTS_STORAGE_KEY = 'remember_me_standout_moments_v1';

export default function AssurerSection() {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState({});

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(MOMENTS_STORAGE_KEY) || '{}');
      const standoutCards = Object.entries(raw || {}).flatMap(([date, moments]) => (moments || [])
        .filter((moment) => moment?.stamped)
        .map((moment) => ({ ...moment, date })));
      setCards(standoutCards);
    } catch {
      setCards([]);
    }
  }, []);

  return <section className="assurer-section">{cards.map((standout) => {
    const momentBack = REMEMBER_MOMENT_BACKS[standout.standoutType] || REMEMBER_MOMENT_BACKS[standout.type];
    return <button key={standout.id} type="button" className="assurer-flip-card" onClick={() => setFlipped((c) => ({ ...c, [standout.id]: !c[standout.id] }))}>
      {!flipped[standout.id] ? (
        momentBack ? <img src={momentBack.src} alt={momentBack.alt} onError={(e) => { console.warn('MOMENT BACK MISSING', momentBack.src); e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'grid'; }} /> : null
      ) : (
        <div className="assurer-flip-back">
          <p>{formatDisplayDate(standout.date)}</p><p>{standout.standoutType || standout.type}</p><p>{standout.time || ''}</p><p>{standout.location || standout.detail || ''}</p><p>{standout.description || ''}</p>
          {(standout.photoRef || standout.mediaRef) ? <img src={standout.photoRef || standout.mediaRef} alt="Standout attachment" /> : null}
        </div>
      )}
      <div style={{ display: 'none', minHeight: '220px', placeItems: 'center', background: '#25051a', color: '#ff86c9' }}>MOMENT BACK MISSING</div>
    </button>;
  })}</section>;
}
