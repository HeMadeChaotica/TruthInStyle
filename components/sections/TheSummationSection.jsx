'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createSummationDraftFromAssurerDay,
  readSummationDraftBundle,
  resolveSummationActiveDay,
} from '../../src/services/summationService';
import '../../styles/sections/the-summation.css';

const BACKGROUND_URL = '/backgrounds/THE-SUMMATION/the-summation-bg.png';
const DRAFT_EVENT_NAME = 'truthinstyle-summation-draft';
const OPEN_EYE_EVENT_NAME = 'truthinstyle-open-eye-of-truth';

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
  const [bootstrapStatus, setBootstrapStatus] = useState('');

  const loadBundle = useCallback(() => {
    setBundle(readSummationDraftBundle());
  }, []);

  useEffect(() => {
    loadBundle();
    const onDraft = () => loadBundle();
    window.addEventListener(DRAFT_EVENT_NAME, onDraft);
    window.addEventListener('truthinstyle-summation-sealed', onDraft);
    return () => {
      window.removeEventListener(DRAFT_EVENT_NAME, onDraft);
      window.removeEventListener('truthinstyle-summation-sealed', onDraft);
    };
  }, [loadBundle]);

  const draft = bundle?.draft || null;
  const title = draft?.titleOfDay || draft?.title || (draft?.displayDate ? `Summation for ${draft.displayDate}` : 'THE.SUMMATION');

  const handleLoadActiveAssurerDay = async () => {
    setBootstrapStatus('Checking active Assurer day…');
    const activeDay = await resolveSummationActiveDay();
    if (!activeDay?.sourceDate || !activeDay?.displayDate) {
      setBootstrapStatus('No active Assurer day data found. Open Eye of Truth and choose a saved day.');
      return;
    }
    const draftPayload = createSummationDraftFromAssurerDay(activeDay);
    if (!draftPayload) {
      setBootstrapStatus('Active day exists, but it is missing required draft identity fields. Nothing was invented.');
      return;
    }
    window.dispatchEvent(new CustomEvent(DRAFT_EVENT_NAME, { detail: { sourceDate: activeDay.sourceDate, draft: draftPayload } }));
    setBootstrapStatus(`Loaded real Assurer day ${activeDay.displayDate}.`);
    loadBundle();
  };

  const handleOpenEye = () => {
    window.dispatchEvent(new CustomEvent(OPEN_EYE_EVENT_NAME));
    setBootstrapStatus('Eye of Truth opened from the right-side rail.');
  };

  return (
    <main className="summation-shell" style={{ '--summation-bg': `url(${BACKGROUND_URL})` }}>
      <div className="summation-background-plate" aria-hidden="true" />
      <section className="summation-cleared-shell" aria-labelledby="summation-title">
        <p className="summation-kicker">THE.SUMMATION · DAY CAPSULE REVIEW SPACE</p>
        <h1 id="summation-title">{title}</h1>
        <p className="summation-cleared-copy">
          The old version board, sketch manager, source dashboard, metadata dumps, and in-page seal controls have been cleared.
          Use Crystal Wand / Summate from the right-side rail to gather the active day and return here when the Day Capsule renderer is ready.
        </p>

        <div className="summation-detail-grid" aria-label={draft ? 'Loaded day identity' : 'Empty day identity'}>
          {draft ? (
            <>
              <DetailPill label="Display" value={draft.displayDate} />
              <DetailPill label="Day" value={draft.dayOfWeek} />
              <DetailPill label="Source" value={draft.sourceDate} />
              <DetailPill label="Chaotica" value={draft.chaoticaDayNumber ? `Day #${draft.chaoticaDayNumber}` : ''} />
            </>
          ) : (
            <span className="summation-detail-pill"><strong>Status</strong>No active day loaded</span>
          )}
        </div>

        {!draft ? (
          <div className="summation-bootstrap-actions" aria-label="Active-day utility actions">
            <button type="button" onClick={handleLoadActiveAssurerDay}>Load Active Assurer Day</button>
            <button type="button" onClick={handleOpenEye}>Open Eye of Truth</button>
            {bootstrapStatus ? <p role="status">{bootstrapStatus}</p> : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
