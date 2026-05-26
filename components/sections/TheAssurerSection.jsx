'use client';

import '../../styles/sections/the-assurer.css';

const PROGRESS_ITEMS = ['PROTEIN', 'CARBS', 'FATS', 'CALORIES', 'WATER'];
const CHIP_ITEMS = ['MOOD', 'ERA', 'SINGLE', 'LOCATION', 'WORD', 'HUMMER'];

export default function TheAssurerSection() {
  return (
    <section className="assurer-shell" aria-label="THE.ASSURER">
      <div className="assurer-stage">
        <div className="assurer-scene-plate" role="img" aria-label="THE.ASSURER background" />

        <div className="assurer-overlay">
          <header className="assurer-top">
            <h1 className="assurer-title">DISCIPLINE IS ROYALTY</h1>

            <div className="assurer-bars" aria-label="Daily progress placeholders">
              {PROGRESS_ITEMS.map((item, index) => (
                <div className="assurer-bar" key={item}>
                  <div className="assurer-bar-meta">
                    <span>{item}</span>
                  </div>
                  <div className="assurer-bar-track">
                    <span className="assurer-bar-fill" style={{ width: `${65 - index * 8}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="assurer-chip-row" aria-label="Daily chips">
              {CHIP_ITEMS.map((chip) => (
                <span className="assurer-chip" key={chip}>{chip}</span>
              ))}
            </div>
          </header>

          <div className="assurer-content-grid" aria-label="Placeholder visual clusters">
            <article className="assurer-panel assurer-cluster assurer-cluster-left" />
            <article className="assurer-panel assurer-thoughts">
              <h2>ASSURED THOUGHTS</h2>
              <div className="assurer-thoughts-body" />
            </article>
            <article className="assurer-panel assurer-cluster assurer-cluster-right" />
            <article className="assurer-panel assurer-cluster assurer-cluster-rhythm" />
            <article className="assurer-panel assurer-cluster assurer-cluster-memory" />
          </div>
        </div>

        <div className="assurer-clear-zone" aria-hidden="true" />
      </div>
    </section>
  );
}
