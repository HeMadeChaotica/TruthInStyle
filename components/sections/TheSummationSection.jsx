'use client';

import '../../styles/sections/the-summation.css';

const BACKGROUND_URL = '/backgrounds/THE-SUMMATION/the-summation-bg.png';
const DRAFT_EVENT_NAME = 'truthinstyle-summation-draft';
const OPEN_EYE_EVENT_NAME = 'truthinstyle-open-eye-of-truth';

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

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function cleanText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function hasValue(value) {
  if (Array.isArray(value)) return value.some(hasValue);
  if (isPlainObject(value)) return Object.values(value).some(hasValue);
  return cleanText(value).length > 0;
}

function displayValue(value) {
  if (!hasValue(value)) return <span className="summation-missing-value">Missing / empty</span>;
  if (Array.isArray(value)) {
    return (
      <ul className="summation-source-list">
        {value.filter(hasValue).map((item, index) => (
          <li key={`${index}-${cleanText(item?.id || item?.label || item?.type || item)}`}>{displayInlineValue(item)}</li>
        ))}
      </ul>
    );
  }
  if (isPlainObject(value)) {
    return (
      <dl className="summation-source-subgrid">
        {Object.entries(value).filter(([, entryValue]) => hasValue(entryValue)).map(([key, entryValue]) => (
          <div key={key}>
            <dt>{humanizeKey(key)}</dt>
            <dd>{displayInlineValue(entryValue)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return <span>{String(value)}</span>;
}

function displayInlineValue(value) {
  if (!hasValue(value)) return <span className="summation-missing-value">Missing / empty</span>;
  if (Array.isArray(value)) return value.filter(hasValue).map(displayInlineValue).reduce((nodes, node, index) => [...nodes, index ? ', ' : '', node], []);
  if (isPlainObject(value)) {
    const labelParts = [value.time, value.type, value.label, value.word, value.current, value.left, value.status].filter(hasValue).map(String);
    const text = cleanText(value.text || value.answer || value.answerText || value.definition || value.summary || value.macroText || value.sourceValue);
    const compact = [...labelParts, text].filter(Boolean).join(' · ');
    if (compact) return <span>{compact}</span>;
    return <span>{JSON.stringify(value)}</span>;
  }
  return <span>{String(value)}</span>;
}

function humanizeKey(key) {
  return String(key).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toUpperCase();
}

function SourceTruthRow({ label, value }) {
  return (
    <div className="summation-source-row">
      <dt>{label}</dt>
      <dd>{displayValue(value)}</dd>
    </div>
  );
}


function SourceTruthPanel({ draft }) {
  const sourceTruth = draft?.sourceTruth || {};
  const dayIdentity = draft?.dayIdentity || sourceTruth.dayIdentity || {};
  const titleFallback = dayIdentity.titleOfDay || sourceTruth.titleOfDay || sourceTruth.title || draft?.titleOfDay || draft?.title || (draft?.displayDate ? `Summation for ${draft.displayDate}` : '');
  const rows = [
    ['Display date', dayIdentity.displayDate || sourceTruth.displayDate || draft?.displayDate],
    ['Day of week', dayIdentity.dayOfWeek || sourceTruth.dayOfWeek || draft?.dayOfWeek],
    ['Source date', dayIdentity.sourceDate || sourceTruth.sourceDate || draft?.sourceDate],
    ['Chaotica day number', dayIdentity.chaoticaDayNumber || sourceTruth.chaoticaDayNumber || draft?.chaoticaDayNumber],
    ['Title of the day', titleFallback],
    ['Mood', sourceTruth.mood],
    ['Era', sourceTruth.era],
    ['Singleness', sourceTruth.singlenessLevel || sourceTruth.singleness],
    ['Head hummer', sourceTruth.headHummer],
    ['Word of the day', sourceTruth.wordOfDay],
    ['Assured thoughts', sourceTruth.assuredThoughts],
    ['Penny questions / answers', sourceTruth.pennyQuestions || sourceTruth.pennyAnswers || sourceTruth.pennyForYourThoughts],
    ['THICC.TIME signals', sourceTruth.weekSignal || sourceTruth.thiccTimeSignals || sourceTruth.thiccTime],
    ['REMEMBER.ME moments', sourceTruth.moments || sourceTruth.timelineHighlights || sourceTruth.rememberMeMoments],
    ['THICC.FITT signals', sourceTruth.workoutHighlights || sourceTruth.thiccFittSignals],
    ['DA.EATER signals', sourceTruth.macroHighlights || sourceTruth.mealHighlights || sourceTruth.daEaterSignals],
    ['Source metadata', draft?.sourceMetadata || sourceTruth.sourceMetadata || sourceTruth.sourceAvailability || draft?.availableSourceSignals],
  ];
  return <dl className="summation-source-truth-list">{rows.map(([label, value]) => <SourceTruthRow key={label} label={label} value={value} />)}</dl>;
}


export default function TheSummationSection() {
  const [bundle, setBundle] = useState(null);
  const [activeVersionId, setActiveVersionId] = useState('');
  const [versionDraft, setVersionDraft] = useState({ title: '', body: '' });
  const [annotationDraft, setAnnotationDraft] = useState('');
  const [bootstrapStatus, setBootstrapStatus] = useState('');

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

  const dayIdentity = draft?.dayIdentity || {};
  const title = dayIdentity.titleOfDay || draft?.titleOfDay || draft?.title || (draft?.displayDate ? `Summation for ${draft.displayDate}` : 'No draft loaded');

  return (
    <main className="summation-shell" style={{ '--summation-bg': `url(${BACKGROUND_URL})` }}>
      <div className="summation-background-plate" aria-hidden="true" />
      <section className="summation-stage" aria-label="THE.SUMMATION visual layout shell">
        <ShellPanel className="summation-identity-panel" eyebrow="Day Identity / Header Zone" title="THE.SUMMATION">
          <h1>{title}</h1>
          <div className="summation-day-identity-strip" aria-label={draft ? "Locked Day Identity Clump" : "Empty draft identity"}>
            {draft ? (<>
              <DetailPill label="Title of Day" value={dayIdentity.titleOfDay || title} />
              <DetailPill label="Display Date" value={dayIdentity.displayDate || draft.displayDate} />
              <DetailPill label="Day of Week" value={dayIdentity.dayOfWeek || draft.dayOfWeek} />
              <DetailPill label="Chaotica" value={(dayIdentity.chaoticaDayNumber ?? draft.chaoticaDayNumber) ? `Day #${dayIdentity.chaoticaDayNumber ?? draft.chaoticaDayNumber}` : ''} />
            </>) : <span className="summation-detail-pill"><strong>Status</strong>No draft loaded</span>}
          </div>
          {!draft ? (
            <div className="summation-bootstrap-actions" aria-label="Real-data bootstrap actions">
              <button type="button" onClick={handleLoadActiveAssurerDay}>Load Active Assurer Day</button>
              <button type="button" onClick={handleOpenEye}>Open Eye of Truth</button>
              <p>Use Crystal Wand / Summate from the right-side rail when an active Assurer day is ready. No duplicate Wand glyph is placed here.</p>
              {bootstrapStatus ? <p role="status">{bootstrapStatus}</p> : null}
            </div>
          ) : null}
        </ShellPanel>

        <ShellPanel className="summation-workspace-panel" eyebrow="Source Truth Panel" title="Source Truth">
          {draft ? <SourceTruthPanel draft={draft} /> : <p className="summation-empty-copy">No active day loaded yet.</p>}
        </ShellPanel>


        <ShellPanel className="summation-version-panel" eyebrow="Version Selector" title="Version Selector">
          <div className="summation-version-list">
            {!versions.length ? <p className="summation-empty-copy">Summate a day to generate versions.</p> : null}
            {versions.map((version) => (
              <button key={version.id} type="button" className={`summation-version-card ${activeVersion?.id === version.id ? 'is-active' : ''}`} onClick={() => setActiveVersionId(version.id)}>
                <strong>{version.label}</strong>
                <span>{version.styleLabel}</span>
                <em>{sketchStatusFor(version)}</em>
              </button>
            ))}
          </div>
        </ShellPanel>

        <ShellPanel className="summation-preview-panel" eyebrow="Active Version Preview" title="Active Version Preview">
          {activeVersion ? (
            <article className="summation-active-preview">
              <h3>{activeVersion.title}</h3>
              <p>{activeVersion.body || activeVersion.content}</p>
            </article>
          ) : <p className="summation-empty-copy">No active version selected.</p>}
        </ShellPanel>

        <ShellPanel className="summation-sketch-panel" eyebrow="Sketch / Doodle Artifact Zone" title="Sketch / Doodle Artifact">
          {!draft ? <p className="summation-empty-copy">Create a draft before sketching.</p> : null}
          {draft ? <div className="summation-sketch-zone">
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
                  <p className="summation-sketch-date">{activeSketch.dayIdentity?.displayDate || activeSketch.displayDate} · {activeSketch.dayIdentity?.dayOfWeek || activeSketch.dayOfWeek} · Chaotica Day #{activeSketch.dayIdentity?.chaoticaDayNumber ?? activeSketch.chaoticaDayNumber}</p>
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
          </div> : null}
        </ShellPanel>

        <ShellPanel className="summation-seal-panel" eyebrow="Reserved Panel" title="Seal Readiness">
          <p className="summation-empty-copy">{draft && activeVersion && activeSketch ? 'Ready for version/sketch selection. Hopewood sealing remains untouched for later passes.' : 'Not seal-ready. Missing draft, version, and sketch.'}</p>
        </ShellPanel>
      </section>
    </main>
  );
}
