'use client';

import { useCallback, useEffect, useState } from 'react';
import { readSummationDraftBundle } from '../../src/services/summationService';
import '../../styles/sections/the-summation.css';

const BACKGROUND_URL = '/backgrounds/THE-SUMMATION/the-summation-bg.png';
const DRAFT_EVENT_NAME = 'truthinstyle-summation-draft';

function ShellPanel({ className = '', eyebrow, title, children }) {
  return (
    <section className={`summation-panel ${className}`.trim()}>
      <header className="summation-panel-header">
        {eyebrow ? <p>{eyebrow}</p> : null}
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function DetailPill({ label, value }) {
  if (!value) return null;
  return (
    <span className="summation-detail-pill">
      <strong>{label}</strong>
      {value}
    </span>
  );
}

export default function TheSummationSection() {
  const [bundle, setBundle] = useState(null);

  const loadBundle = useCallback(() => {
    setBundle(readSummationDraftBundle());
  }, []);

  useEffect(() => {
    loadBundle();
    const onDraft = () => loadBundle();
    window.addEventListener(DRAFT_EVENT_NAME, onDraft);
    window.addEventListener('truthinstyle-summation-sealed', onDraft);
    window.addEventListener('truthinstyle-summation-seal-blocked', onDraft);
    return () => {
      window.removeEventListener(DRAFT_EVENT_NAME, onDraft);
      window.removeEventListener('truthinstyle-summation-sealed', onDraft);
      window.removeEventListener('truthinstyle-summation-seal-blocked', onDraft);
    };
  }, [loadBundle]);

  const draft = bundle?.draft || null;

  if (!draft) {
    return (
      <main className="summation-shell" style={{ '--summation-bg': `url(${BACKGROUND_URL})` }}>
        <div className="summation-background-plate" aria-hidden="true" />
        <section className="summation-empty-state">
          <h1>THE.SUMMATION</h1>
          <p>No valid Summation draft is loaded. Open THE.ASSURER, choose the active day with Eye of Truth if needed, then use Crystal Wand / Summate from the right-side rail.</p>
        </section>
      </main>
    );
  }

  const title = draft.titleOfDay || draft.title || `Summation for ${draft.displayDate}`;

  return (
    <main className="summation-shell" style={{ '--summation-bg': `url(${BACKGROUND_URL})` }}>
      <div className="summation-background-plate" aria-hidden="true" />
      <section className="summation-stage" aria-label="THE.SUMMATION visual layout shell">
        <ShellPanel className="summation-identity-panel" eyebrow="Day Identity / Header Zone" title="THE.SUMMATION">
          <h1>{title}</h1>
          <div className="summation-detail-grid" aria-label="Loaded draft identity">
            <DetailPill label="Display" value={draft.displayDate} />
            <DetailPill label="Day" value={draft.dayOfWeek} />
            <DetailPill label="Source" value={draft.sourceDate} />
            <DetailPill label="Chaotica" value={draft.chaoticaDayNumber ? `Day #${draft.chaoticaDayNumber}` : ''} />
          </div>
        </ShellPanel>

        <ShellPanel className="summation-workspace-panel" eyebrow="Main Workspace Zone" title="Writing / Version Preview">
          <div className="summation-reserved-surface">
            <p>Draft loaded. Active Summation writing and preview controls will land here in the next functional pass.</p>
          </div>
        </ShellPanel>

        <ShellPanel className="summation-penny-panel" eyebrow="Reserved Panel" title="Penny for Your Thoughts">
          <p className="summation-empty-copy">Empty structural state. Penny logic is not built in this pass.</p>
        </ShellPanel>

        <ShellPanel className="summation-version-panel" eyebrow="Reserved Panel" title="Version Selector">
          <p className="summation-empty-copy">Empty structural state. Version selector logic is not built in this pass.</p>
        </ShellPanel>

        <ShellPanel className="summation-sketch-panel" eyebrow="Reserved Panel" title="Sketch / Doodle Artifact">
          <div className="summation-artifact-placeholder">
            <p>Empty structural state. No fake doodles or sketch content are created.</p>
          </div>
        </ShellPanel>

        <ShellPanel className="summation-seal-panel" eyebrow="Reserved Panel" title="Seal Readiness">
          <p className="summation-empty-copy">Empty structural state. Hopewood sealing logic remains untouched for later passes.</p>
        </ShellPanel>
      </section>
    </main>
  );
}
