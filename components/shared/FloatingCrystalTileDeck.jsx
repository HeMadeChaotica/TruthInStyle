'use client';

import { useEffect, useState } from 'react';
import '../../styles/sections/floating-crystal-tiles.css';

export default function FloatingCrystalTileDeck({ tiles, className = '', ariaLabel }) {
  const [activeId, setActiveId] = useState(null);
  const activeTile = tiles.find((tile) => tile.id === activeId) || null;

  useEffect(() => {
    if (!activeId) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setActiveId(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [activeId]);

  return (
    <div className={`crystal-tile-deck ${className}`.trim()} aria-label={ariaLabel}>
      {tiles.map((tile) => (
        <button
          type="button"
          className={`crystal-summary-tile crystal-summary-tile--${tile.id} ${tile.className || ''}`.trim()}
          key={tile.id}
          onClick={() => setActiveId(tile.id)}
          aria-label={`OPEN ${tile.title}`}
        >
          <span className="crystal-summary-copy">
            <strong>{tile.title}</strong>
            <span>{tile.summary}</span>
          </span>
          {tile.media || null}
          <span className="crystal-summary-expand" aria-hidden="true">✦</span>
        </button>
      ))}

      {activeTile ? (
        <div className="crystal-detail-backdrop" role="presentation" onClick={() => setActiveId(null)}>
          <section
            className="crystal-detail-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crystal-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2 id="crystal-detail-title">{activeTile.title}</h2>
              <button type="button" onClick={() => setActiveId(null)}>CLOSE</button>
            </header>
            <div className="crystal-detail-body">{activeTile.content}</div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
