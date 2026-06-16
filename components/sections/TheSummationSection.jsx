'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  generateSummationVersions,
  markSummationVersionForSeal,
  readSummationDraftBundle,
  saveSummationVersionEdits,
  setSummationActiveVersion,
} from '../../src/services/summationService';
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
  const [editor, setEditor] = useState({ title: '', body: '' });
  const [saveStatus, setSaveStatus] = useState('');

  const loadBundle = useCallback(() => {
    const nextBundle = readSummationDraftBundle();
    if (nextBundle?.draft && !nextBundle.versions?.length) {
      generateSummationVersions(nextBundle.draft, { preserveSelectedVersionId: false });
      setBundle(readSummationDraftBundle());
      return;
    }
    setBundle(nextBundle);
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
  const versions = bundle?.versions || [];
  const activeVersionId = bundle?.activeVersionId || versions[0]?.id || '';
  const selectedForSealVersionId = bundle?.selectedForSealVersionId || '';
  const activeVersion = versions.find((version) => version.id === activeVersionId) || versions[0] || null;

  useEffect(() => {
    setEditor({
      title: activeVersion?.title || '',
      body: activeVersion?.body || activeVersion?.content || '',
    });
    setSaveStatus('');
  }, [activeVersion?.id, activeVersion?.title, activeVersion?.body, activeVersion?.content]);

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

  const refresh = () => setBundle(readSummationDraftBundle());
  const selectActiveVersion = (versionId) => {
    setSummationActiveVersion(versionId);
    refresh();
  };
  const selectForSeal = (versionId) => {
    markSummationVersionForSeal(versionId);
    refresh();
  };
  const saveActiveVersion = () => {
    if (!activeVersion?.id) return;
    saveSummationVersionEdits(activeVersion.id, editor);
    setSaveStatus('Saved.');
    refresh();
  };
  const regenerateVersions = () => {
    generateSummationVersions(draft, {
      preserveExistingEdits: false,
      preserveSelectedVersionId: selectedForSealVersionId || false,
      activeVersionId,
    });
    refresh();
  };

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
          {activeVersion ? (
            <div className="summation-editor">
              <div className="summation-editor-meta">
                <DetailPill label="Active" value={activeVersion.label || activeVersion.versionNumber} />
                <DetailPill label="Version ID" value={activeVersion.id} />
                <DetailPill label="Seal Pick" value={activeVersion.selectedForSeal ? 'Selected for seal' : 'Not selected'} />
              </div>
              <label className="summation-field">
                <span>Editable title</span>
                <input value={editor.title} onChange={(event) => setEditor((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label className="summation-field">
                <span>Editable body / content</span>
                <textarea value={editor.body} onChange={(event) => setEditor((current) => ({ ...current, body: event.target.value }))} />
              </label>
              <div className="summation-editor-actions">
                <button type="button" onClick={saveActiveVersion}>Save / Update Version</button>
                <button type="button" onClick={() => selectForSeal(activeVersion.id)} aria-pressed={activeVersion.selectedForSeal}>
                  {activeVersion.selectedForSeal ? 'Selected for Seal' : 'Mark Selected for Seal'}
                </button>
                <button type="button" onClick={regenerateVersions}>Regenerate / Remix Versions</button>
                {saveStatus ? <span>{saveStatus}</span> : null}
              </div>
            </div>
          ) : (
            <div className="summation-reserved-surface">
              <p>No generated Summation versions are available yet.</p>
            </div>
          )}
        </ShellPanel>

        <ShellPanel className="summation-penny-panel" eyebrow="Reserved Panel" title="Penny for Your Thoughts">
          <p className="summation-empty-copy">Empty structural state. Penny logic is not built in this pass.</p>
        </ShellPanel>

        <ShellPanel className="summation-version-panel" eyebrow="Reserved Panel" title="Version Selector">
          <div className="summation-version-list">
            {versions.map((version) => (
              <button
                type="button"
                key={version.id}
                className={`summation-version-card${version.id === activeVersionId ? ' is-active' : ''}${version.selectedForSeal ? ' is-selected-for-seal' : ''}`}
                onClick={() => selectActiveVersion(version.id)}
              >
                <span className="summation-version-title">{version.label || `Version ${version.versionNumber}`}</span>
                <span>{version.title}</span>
                <span>{version.styleLabel || version.tone || 'Truth style'}</span>
                <span className="summation-version-markers">
                  {version.id === activeVersionId ? 'Active' : 'Inactive'}
                  {' · '}
                  {version.selectedForSeal ? 'Selected for seal' : 'Not for seal'}
                  {' · '}
                  {version.sketchId ? 'Sketch linked' : 'Sketch pending'}
                  {version.sealed ? ' · Sealed' : ''}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  className="summation-inline-select"
                  onClick={(event) => {
                    event.stopPropagation();
                    selectForSeal(version.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      selectForSeal(version.id);
                    }
                  }}
                >
                  Mark for seal
                </span>
              </button>
            ))}
          </div>
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
