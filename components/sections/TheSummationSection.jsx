'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createOrUpdateSummationSketch,
  generateSummationVersions,
  listSummationSealMissingFields,
  markSummationVersionForSeal,
  readSummationDraftBundle,
  saveSummationVersionEdits,
  sealActiveSummationSelection,
} from '../../src/services/summationService';
import '../../styles/sections/the-summation.css';

const BACKGROUND_URL = '/backgrounds/THE-SUMMATION/the-summation-bg.png';
const DRAFT_EVENT_NAME = 'truthinstyle-summation-draft';

function fieldValue(value) {
  if (Array.isArray(value)) return value.length ? value.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(' • ') : 'Available when sourced.';
  if (value && typeof value === 'object') return Object.keys(value).length ? JSON.stringify(value, null, 2) : 'Available when sourced.';
  return value || 'Available when sourced.';
}

function SourceBlock({ title, value }) {
  return (
    <article className="summation-source-row">
      <h3>{title}</h3>
      <p>{fieldValue(value)}</p>
    </article>
  );
}

export default function TheSummationSection() {
  const [bundle, setBundle] = useState(null);
  const [activeVersionId, setActiveVersionId] = useState('');
  const [selectedForSealVersionId, setSelectedForSealVersionId] = useState('');
  const [activeSketchId, setActiveSketchId] = useState('');
  const [editor, setEditor] = useState({ title: '', body: '' });
  const [doodleNote, setDoodleNote] = useState('');
  const [sealMessage, setSealMessage] = useState('');
  const [dirty, setDirty] = useState(false);

  const loadBundle = useCallback(() => {
    const nextBundle = readSummationDraftBundle();
    setBundle(nextBundle);
    const selected = nextBundle?.versions?.find((version) => version.selectedForSeal);
    const active = nextBundle?.versions?.find((version) => version.id === activeVersionId) || selected || nextBundle?.versions?.[0];
    setSelectedForSealVersionId(selected?.id || '');
    setActiveVersionId(active?.id || '');
    setActiveSketchId((nextBundle?.sketches || []).find((sketch) => sketch.linkedVersionId === active?.id)?.sketchId || '');
  }, [activeVersionId]);

  useEffect(() => {
    loadBundle();
    const onDraft = () => loadBundle();
    const onSealed = (event) => {
      setSealMessage(event?.detail?.message || 'THE.SUMMATION sealed.');
      loadBundle();
    };
    window.addEventListener(DRAFT_EVENT_NAME, onDraft);
    window.addEventListener('truthinstyle-summation-sealed', onSealed);
    window.addEventListener('truthinstyle-summation-seal-blocked', onSealed);
    return () => {
      window.removeEventListener(DRAFT_EVENT_NAME, onDraft);
      window.removeEventListener('truthinstyle-summation-sealed', onSealed);
      window.removeEventListener('truthinstyle-summation-seal-blocked', onSealed);
    };
  }, [loadBundle]);

  const draft = bundle?.draft || null;
  const versions = bundle?.versions || [];
  const sketches = bundle?.sketches || [];
  const activeVersion = versions.find((version) => version.id === activeVersionId) || versions[0] || null;
  const activeSketch = sketches.find((sketch) => sketch.sketchId === activeSketchId) || sketches.find((sketch) => sketch.linkedVersionId === activeVersion?.id) || null;
  const sealVersion = versions.find((version) => version.id === selectedForSealVersionId) || null;
  const sealSketch = sketches.find((sketch) => sketch.linkedVersionId === selectedForSealVersionId && (sketch.selectedForSeal || sketch.sketchId === sealVersion?.sketchId)) || null;
  const missingFields = useMemo(() => listSummationSealMissingFields({ draft, version: sealVersion, sketch: sealSketch }), [draft, sealVersion, sealSketch]);

  useEffect(() => {
    setEditor({ title: activeVersion?.title || '', body: activeVersion?.body || '' });
    setDoodleNote(activeSketch?.doodleLayer?.annotationNotes || '');
    setDirty(false);
  }, [activeVersion?.id, activeVersion?.title, activeVersion?.body, activeSketch?.sketchId, activeSketch?.doodleLayer?.annotationNotes]);

  const handleGenerate = () => {
    if (!draft) return;
    generateSummationVersions(draft, { preserveSelectedVersionId: selectedForSealVersionId });
    loadBundle();
  };

  const handleSaveVersion = () => {
    if (!activeVersion) return;
    saveSummationVersionEdits(activeVersion.id, editor);
    setDirty(false);
    loadBundle();
  };

  const handleCreateSketch = () => {
    if (!draft || !activeVersion) return;
    const sketch = createOrUpdateSummationSketch({ draft, version: activeVersion, doodleLayer: activeSketch?.doodleLayer });
    setActiveSketchId(sketch.sketchId || '');
    setDoodleNote(sketch.doodleLayer.annotationNotes || '');
    loadBundle();
  };

  const handleSaveSketch = () => {
    if (!draft || !activeVersion) return;
    createOrUpdateSummationSketch({
      draft,
      version: { ...activeVersion, title: editor.title, body: editor.body },
      doodleLayer: {
        ...(activeSketch?.doodleLayer || {}),
        annotationNotes: doodleNote,
        marks: activeSketch?.doodleLayer?.marks || [],
        decorativeStrokes: activeSketch?.doodleLayer?.decorativeStrokes || [],
        memoryMarks: activeSketch?.doodleLayer?.memoryMarks || [],
        stamps: activeSketch?.doodleLayer?.stamps || [],
      },
    });
    loadBundle();
  };

  const handleSelectForSeal = () => {
    if (!activeVersion) return;
    const selected = markSummationVersionForSeal(activeVersion.id);
    setSelectedForSealVersionId(selected?.id || activeVersion.id);
    loadBundle();
  };

  const handleSeal = () => {
    const result = sealActiveSummationSelection(null, selectedForSealVersionId);
    setSealMessage(result?.sealedRecord ? `Sealed ${result.sealedRecord.displayDate}.` : `Seal blocked: ${(result?.missingFields || []).join(', ')}`);
    loadBundle();
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

  const pennyAnswers = draft.sourceTruth?.pennyAnswers || draft.sourceTruth?.wrapAnswers || [];

  return (
    <main className="summation-shell" style={{ '--summation-bg': `url(${BACKGROUND_URL})` }}>
      <div className="summation-background-plate" aria-hidden="true" />
      <section className="summation-stage" aria-label="THE.SUMMATION day-fusion chamber">
        <section className="summation-workspace summation-panel">
          <header className="summation-day-line">
            <p>THE.SUMMATION</p>
            <h1>{draft.titleOfDay || draft.title || `Summation for ${draft.displayDate}`}</h1>
            <span>Draft loaded • {draft.displayDate} • {draft.dayOfWeek} • Source {draft.sourceDate}{draft.chaoticaDayNumber ? ` • Chaotica Day # ${draft.chaoticaDayNumber}` : ''}</span>
          </header>
          <div className="summation-editor-grid">
            <label>Active version title
              <input value={editor.title} disabled={activeVersion?.sealed} onChange={(event) => { setEditor((current) => ({ ...current, title: event.target.value })); setDirty(true); }} />
            </label>
            <label>Active version body
              <textarea value={editor.body} disabled={activeVersion?.sealed} onChange={(event) => { setEditor((current) => ({ ...current, body: event.target.value })); setDirty(true); }} />
            </label>
          </div>
          <div className="summation-action-row">
            <button type="button" onClick={handleSaveVersion} disabled={!activeVersion || activeVersion.sealed}>Save version edits</button>
            <button type="button" onClick={handleSelectForSeal} disabled={!activeVersion || activeVersion.sealed}>Select version/sketch for seal</button>
            <span>{dirty ? 'Unsaved edits' : 'Version metadata preserved'}</span>
          </div>
        </section>

        <aside className="summation-version-panel summation-panel">
          <header><h2>Version Selector</h2><button type="button" onClick={handleGenerate}>Regenerate / remix versions</button></header>
          <div className="summation-version-list">
            {versions.map((version) => {
              const sketch = sketches.find((item) => item.linkedVersionId === version.id);
              return (
                <button key={version.id} type="button" className={version.id === activeVersion?.id ? 'is-active' : ''} onClick={() => { setActiveVersionId(version.id); setActiveSketchId(sketch?.sketchId || ''); }}>
                  <strong>{version.label}</strong>
                  <span>{version.styleLabel}</span>
                  <em>{version.status || 'Draft'}{version.id === activeVersion?.id ? ' • Active' : ''}{sketch ? ' • Sketch created' : ' • No sketch yet'}{version.id === selectedForSealVersionId || version.selectedForSeal ? ' • Selected for Seal' : ''}{version.sealed ? ' • Sealed' : ''}</em>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="summation-sketch-panel summation-panel">
          <header><h2>Sketch / Doodle</h2><span>{activeSketch ? `Sketch ${activeSketch.sketchId}` : 'No sketch yet'}</span></header>
          {activeSketch ? (
            <article className="summation-sketch-page">
              <div className="summation-sketch-date">{activeSketch.displayDate} • {activeSketch.selectedVersionLabel}</div>
              <h3>{editor.title}</h3>
              <p>{editor.body}</p>
              <label>Doodle / annotation layer
                <textarea value={doodleNote} onChange={(event) => setDoodleNote(event.target.value)} disabled={activeSketch.sealed} placeholder="Add your actual annotation notes here. No marks are generated for you." />
              </label>
              <small>Marks: {(activeSketch.doodleLayer?.marks || []).length} • Strokes: {(activeSketch.doodleLayer?.decorativeStrokes || []).length} • Memory marks: {(activeSketch.doodleLayer?.memoryMarks || []).length} • Stamps: {(activeSketch.doodleLayer?.stamps || []).length}</small>
            </article>
          ) : (
            <div className="summation-no-sketch"><p>Create a sketch from the selected version when the text is ready. No fake doodles will be created.</p></div>
          )}
          <div className="summation-action-row">
            <button type="button" onClick={handleCreateSketch} disabled={!activeVersion || activeVersion.sealed}>Create sketch from selected version</button>
            <button type="button" onClick={handleSaveSketch} disabled={!activeVersion || !activeSketch || activeSketch.sealed}>Save / update sketch</button>
          </div>
        </section>

        <aside className="summation-source-panel summation-panel">
          <h2>Penny for Your Thoughts</h2>
          <SourceBlock title="Penny/source answers" value={pennyAnswers} />
          <h2>Source truth</h2>
          <SourceBlock title="Date" value={`${draft.displayDate} • ${draft.dayOfWeek} • ${draft.sourceDate}`} />
          <SourceBlock title="Mood / era / singleness" value={[draft.sourceTruth?.mood, draft.sourceTruth?.era, draft.sourceTruth?.singlenessLevel].filter(Boolean)} />
          <SourceBlock title="Head hummer" value={draft.sourceTruth?.headHummer} />
          <SourceBlock title="Word of the day" value={draft.sourceTruth?.wordOfDay} />
          <SourceBlock title="Assured thoughts" value={draft.sourceTruth?.assuredThoughts} />
          <SourceBlock title="THICC.TIME signals" value={draft.sourceTruth?.weekSignal} />
          <SourceBlock title="REMEMBER.ME moments" value={draft.sourceTruth?.moments || draft.sourceTruth?.timelineHighlights} />
          <SourceBlock title="THICC.FITT signals" value={draft.sourceTruth?.workoutHighlights} />
          <SourceBlock title="DA.EATER signals" value={draft.sourceTruth?.macroHighlights || draft.sourceTruth?.mealHighlights} />
        </aside>

        <section className="summation-seal-panel summation-panel">
          <h2>Seal readiness</h2>
          {missingFields.length ? <p>Not ready: {missingFields.join(', ')}</p> : <p>Ready: selected version and linked sketch can be sealed from the right-side rail.</p>}
          <button type="button" onClick={handleSeal}>Validate seal payload</button>
          {sealMessage ? <span>{sealMessage}</span> : null}
        </section>
      </section>
    </main>
  );
}
