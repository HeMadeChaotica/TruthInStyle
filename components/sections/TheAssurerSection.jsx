import '../../styles/sections/the-assurer.css';

const nutrientBars = [
  { label: 'PROTEIN', value: '142g', pct: 76 },
  { label: 'CARBS', value: '198g', pct: 64 },
  { label: 'FATS', value: '62g', pct: 58 },
  { label: 'WATER', value: '2.8L', pct: 70 },
  { label: 'CALORIES', value: '2210', pct: 69 }
];

export default function TheAssurerSection() {
  return (
    <section className="assurer-shell" aria-label="THE.ASSURER">
      <div className="assurer-stage">
        <div className="assurer-scene-plate" role="img" aria-label="THE.ASSURER background" />

        <div className="assurer-overlay">
          <div className="assurer-top">
            <input
              className="assurer-title-input"
              type="text"
              defaultValue=""
              placeholder="Daily title"
              aria-label="Daily title"
            />

            <div className="assurer-bars" aria-label="Daily progress">
              {nutrientBars.map((bar) => (
                <div className="assurer-bar" key={bar.label}>
                  <div className="assurer-bar-meta">
                    <span>{bar.label}</span>
                    <span>{bar.value}</span>
                  </div>
                  <div className="assurer-bar-track">
                    <span className="assurer-bar-fill" style={{ width: `${bar.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="assurer-chip-row">
              <span className="assurer-chip">Today</span>
              <span className="assurer-chip">Focus: Consistency</span>
              <span className="assurer-chip">Energy ↑</span>
              <span className="assurer-chip">Recovery 7h 42m</span>
            </div>
          </div>

          <div className="assurer-content-grid">
            <div className="assurer-col assurer-col-left">
              <article className="assurer-panel assurer-list-panel">
                <h3>Meals + Body Signals</h3>
                <p>Breakfast · Oats + berries · Stable focus</p>
                <p>Lunch · Chicken bowl · Hydration up</p>
                <p>Mobility · 22 min · Lower-back loose</p>
              </article>

              <article className="assurer-panel assurer-metrics">
                <div className="metric">Sleep 7h 42m</div>
                <div className="metric">Weight 212.4</div>
                <div className="metric">Stress 18%</div>
                <div className="metric">Steps 8,904</div>
              </article>

              <article className="assurer-panel assurer-memory-strip">
                <div className="memory-tile">Memory</div>
                <div className="memory-tile">Trophy</div>
                <div className="memory-tile">Moment</div>
              </article>
            </div>

            <div className="assurer-col assurer-col-right">
              <article className="assurer-panel assurer-thoughts">
                <h3>Assured Thoughts</h3>
                <textarea defaultValue="Held form under pressure. Keep shoulders stacked, breathe slower into each set, then carry that calm into meals." />
              </article>

              <article className="assurer-panel assurer-timeline">
                <h3>Daily Rhythm</h3>
                <p>06:15 · Wake + water</p>
                <p>07:05 · Walk + sunlight</p>
                <p>12:30 · Lunch reset</p>
                <p>18:10 · Training block</p>
              </article>
            </div>
          </div>
        </div>

        <div className="assurer-clear-zone" aria-hidden="true" />
      </div>
    </section>
  );
}
