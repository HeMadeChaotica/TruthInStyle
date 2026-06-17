'use client';

import '../../styles/sections/the-summation.css';

const BACKGROUND_URL = '/backgrounds/THE-SUMMATION/the-summation-bg.png';

export default function TheSummationSection() {
  const hasRender = false;

  return (
    <main className="summation-shell" style={{ '--summation-bg': `url(${BACKGROUND_URL})` }}>
      <div className="summation-background-plate" aria-hidden="true" />
      <section className="summation-stage" aria-label="THE.SUMMATION Day Capsule review chamber frame">
        <div className="summation-render-zone" aria-label="Day Capsule render preview surface">
          <div className="summation-render-surface">
            <p>Day Capsule render will appear here.</p>
          </div>
        </div>

        <aside className="summation-art-preserve" aria-label="Approved Summation background art preserve area">
          <div className="summation-tailoring-box" aria-label="Tailoring Notes">
            <label htmlFor="summation-tailoring-notes">Tailoring Notes</label>
            <textarea
              id="summation-tailoring-notes"
              disabled={!hasRender}
              aria-disabled={!hasRender}
              placeholder="Available after first render."
            />
            <p>Available after first render.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
