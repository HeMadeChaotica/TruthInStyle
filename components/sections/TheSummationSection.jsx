'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createOrUpdateSummationSketch,
  generateSummationVersions,
  markSummationVersionForSeal,
  readSummationDraftBundle,
  saveSummationVersionEdits,
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
  const [activeVersionId, setActiveVersionId] = useState('');
  const [versionDraft, setVersionDraft] = useState({ title: '', body: '' });
  const [annotationDraft, setAnnotationDraft] = useState('');

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
  const versions = useMemo(() => bundle?.versions || [], [bundle]);
  const sketches = useMemo(() => bundle?.sketches || [], [bundle]);

  useEffect(() => {
    if (!draft) return;
    if (!versions.length) {
      const generated = generateSummationVersions(draft, { preserveExistingEdits: true });
      setBundle({ draft, versions: generated, sketches });
      return;
    }
    const selected = versions.find((version) => version.selectedForSeal) || versions[0];
    if (!activeVersionId || !versions.some((version) => version.id === activeVersionId)) setActiveVersionId(selected?.id || '');
  }, [activeVersionId, draft, sketches, versions]);

  const activeVersion = versions.find((version) => version.id === activeVersionId) || versions[0] || null;
  const activeSketch = sketches.find((sketch) => sketch.linkedVersionId === activeVersion?.id) || null;

  useEffect(() => {
    setVersionDraft({ title: activeVersion?.title || '', body: activeVersion?.body || activeVersion?.content || '' });
    setAnnotationDraft(activeSketch?.doodleLayer?.annotationNotes || '');
  }, [activeVersion?.id, activeVersion?.title, activeVersion?.body, activeVersion?.content, activeSketch?.sketchId, activeSketch?.doodleLayer?.annotationNotes]);

  const refreshBundle = () => setBundle(readSummationDraftBundle());

  const sketchStatusFor = (version) => {
    const sketch = sketches.find((item) => item.linkedVersionId === version.id);
    if (!sketch) return 'no sketch yet';
    if (sketch.sealed) return 'sealed sketch';
    if (sketch.selectedForSeal) return 'selected sketch for seal';
    if (sketch.doodleLayer?.updatedAt && sketch.doodleLayer.updatedAt !== sketch.doodleLayer.createdAt) return 'sketch edited';
    return 'sketch created';
  };

  const handleSaveVersion = () => {
    if (!activeVersion?.id) return;
    saveSummationVersionEdits(activeVersion.id, versionDraft);
    refreshBundle();
  };

  const handleCreateSketch = () => {
    if (!draft || !activeVersion?.id) return;
    createOrUpdateSummationSketch({ draft, version: activeVersion, doodleLayer: { marks: [], annotationNotes: '', decorativeStrokes: [], memoryMarks: [], stamps: [], positionData: {} } });
    refreshBundle();
  };

  const handleSaveAnnotation = () => {
    if (!draft || !activeVersion?.id) return;
    createOrUpdateSummationSketch({
      draft,
      version: activeVersion,
      doodleLayer: { ...(activeSketch?.doodleLayer || {}), annotationNotes: annotationDraft },
    });
    refreshBundle();
  };

  const handleSelectForSeal = () => {
    if (!activeVersion?.id || !activeSketch || activeSketch.linkedVersionId !== activeVersion.id) return;
    markSummationVersionForSeal(activeVersion.id);
    refreshBundle();
  };


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
              <label>
                Version title
                <input value={versionDraft.title} onChange={(event) => setVersionDraft((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label>
                Rendered body
                <textarea value={versionDraft.body} onChange={(event) => setVersionDraft((current) => ({ ...current, body: event.target.value }))} />
              </label>
              <button type="button" onClick={handleSaveVersion}>Save version text</button>
            </div>
          ) : (
            <div className="summation-reserved-surface"><p>No active version is available yet.</p></div>
          )}
        </ShellPanel>

        <ShellPanel className="summation-penny-panel" eyebrow="Reserved Panel" title="Penny for Your Thoughts">
          <p className="summation-empty-copy">Empty structural state. Penny logic is not built in this pass.</p>
        </ShellPanel>

        <ShellPanel className="summation-version-panel" eyebrow="Version Selector" title="Version Selector">
          <div className="summation-version-list">
            {versions.map((version) => (
              <button key={version.id} type="button" className={`summation-version-card ${activeVersion?.id === version.id ? 'is-active' : ''}`} onClick={() => setActiveVersionId(version.id)}>
                <strong>{version.label}</strong>
                <span>{version.styleLabel}</span>
                <em>{sketchStatusFor(version)}</em>
              </button>
            ))}
          </div>
        </ShellPanel>

        <ShellPanel className="summation-sketch-panel" eyebrow="Sketch / Doodle Artifact Zone" title="Sketch / Doodle Artifact">
          <div className="summation-sketch-zone">
            <div className="summation-sketch-meta">
              <DetailPill label="Status" value={activeVersion ? sketchStatusFor(activeVersion) : 'no active version'} />
              <DetailPill label="Version" value={activeVersion?.label} />
              <DetailPill label="Sketch ID" value={activeSketch?.sketchId} />
              <DetailPill label="Linked Version" value={activeSketch?.linkedVersionId || activeVersion?.id} />
            </div>
            {activeSketch ? (
              <div className="summation-sketch-preview">
                <article>
                  <h3>{activeSketch.title}</h3>
                  <p className="summation-sketch-date">{activeSketch.displayDate} · {activeSketch.dayOfWeek} · Chaotica Day #{activeSketch.chaoticaDayNumber}</p>
                  <pre>{activeSketch.renderedText}</pre>
                </article>
                <label>
                  Annotation notes / real doodle-layer mark
                  <textarea value={annotationDraft} onChange={(event) => setAnnotationDraft(event.target.value)} />
                </label>
                <button type="button" onClick={handleSaveAnnotation}>Save doodle / annotation layer</button>
                <button type="button" onClick={handleSelectForSeal} disabled={activeSketch.linkedVersionId !== activeVersion?.id}>Select this sketch/version pair for seal</button>
              </div>
            ) : (
              <div className="summation-artifact-placeholder">
                <p>No sketch exists for the selected version. No fake doodles are generated.</p>
                <button type="button" onClick={handleCreateSketch} disabled={!activeVersion?.id}>Create sketch from selected version</button>
              </div>
            )}
          </div>
        </ShellPanel>

        <ShellPanel className="summation-seal-panel" eyebrow="Reserved Panel" title="Seal Readiness">
          <p className="summation-empty-copy">Hopewood sealing logic remains untouched for later passes. This pass only marks one valid sketch/version pair as selected.</p>
        </ShellPanel>
      </section>
    </main>
  );
}
