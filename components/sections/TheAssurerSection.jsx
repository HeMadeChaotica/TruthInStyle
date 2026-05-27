'use client';

import '../../styles/sections/the-assurer.css';

const PROGRESS_ITEMS = [
  { label: 'PROTEIN', value: 74 },
  { label: 'CARBS', value: 58 },
  { label: 'FATS', value: 67 },
  { label: 'CALORIES', value: 81 },
  { label: 'WATER', value: 62 },
];

const CHIPS = ['MOOD', 'ERA', 'SINGLE', 'LOCATION', 'WORD', 'HUMMER'];

const LEFT_FLOW = [
  'Meal cadence: clean + timed',
  'Body pulse: steady rhythm',
  'Hydration + sleep locked',
  'Quote: Keep the standard high',
];

const RIGHT_FLOW = [
  'Timeline fragment • 06:10 rise',
  'Week check rhythm • 5/7',
  'Trophy placeholder • golden hour',
  'Memory tile • sharp focus',
];

const BOTTOM_FLOW = ['Moment card A', 'Moment card B', 'Daily rhythm cluster'];

export default function TheAssurerSection() {
  return (
    <section className="assurer-shell" aria-label="THE.ASSURER">
      <div className="assurer-stage">
        <div className="assurer-scene-plate" role="img" aria-label="THE.ASSURER background" />

        <div className="assurer-overlay">
          <header className="assurer-title-cluster">
            <h1 className="assurer-title">DISCIPLINE IS ROYALTY</h1>

            <div className="assurer-progress-stack" aria-label="Daily progress placeholders">
              {PROGRESS_ITEMS.map((item) => (
                <div className="assurer-progress-row" key={item.label}>
                  <span className="assurer-progress-label">{item.label}</span>
                  <div className="assurer-progress-track">
                    <span className="assurer-progress-fill" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="assurer-chip-row" aria-label="Daily chips">
              {CHIPS.map((chip) => (
                <span className="assurer-chip" key={chip}>{chip}</span>
              ))}
            </div>
          </header>

          <div className="assurer-flow-layer" aria-label="Integrated visual clusters">
            <article className="assurer-module assurer-module-left">
              {LEFT_FLOW.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </article>

            <article className="assurer-module assurer-thought-card">
              <h2>ASSURED THOUGHTS</h2>
              <p>Hold your line. Keep your timing. Carry your crown into every hour.</p>
            </article>

            <article className="assurer-module assurer-module-right">
              {RIGHT_FLOW.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </article>

            <article className="assurer-module assurer-module-bottom">
              {BOTTOM_FLOW.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </article>
          </div>
        </div>

        <div className="assurer-mista-clear-zone" aria-hidden="true" />
      </div>
    </section>
  );
}
