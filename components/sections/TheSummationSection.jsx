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

function normalizePennyAnswerRows(draft) {
  const sourceTruth = draft?.sourceTruth || {};
  const pools = [
    draft?.pennyForYourThoughts?.answers,
    sourceTruth?.pennyForYourThoughts?.answers,
    sourceTruth?.pennyAnswers,
    draft?.pennyAnswers,
    sourceTruth?.wrapAnswers,
  ].filter(Array.isArray);

  return pools.flatMap((answers, poolIndex) => answers.map((answer, index) => {
    if (!isPlainObject(answer)) {
      return {
        id: `penny-${poolIndex}-${index}`,
        question: '',
        answerText: String(answer),
        metadata: {},
      };
    }
    return {
      id: cleanText(answer.id || answer.questionId || answer.sourceQuestionId || `penny-${poolIndex}-${index}`),
      question: cleanText(answer.questionText || answer.question || answer.prompt || answer.sourceQuestionText),
      answerText: answer.answerText ?? answer.answer ?? answer.value ?? answer.sourceValue ?? '',
      metadata: {
        sourceSection: answer.sourceSection,
        sourceArea: answer.sourceArea,
        sourceQuestionId: answer.sourceQuestionId || answer.questionId,
        sourceDate: answer.sourceDate || sourceTruth.sourceDate || draft?.sourceDate,
        displayDate: answer.displayDate || sourceTruth.displayDate || draft?.displayDate,
      },
    };
  })).filter((answer, index, all) => hasValue(answer.answerText) && all.findIndex((candidate) => candidate.id === answer.id && cleanText(candidate.answerText) === cleanText(answer.answerText)) === index);
}

function SourceTruthPanel({ draft }) {
  const sourceTruth = draft?.sourceTruth || {};
  const titleFallback = sourceTruth.titleOfDay || sourceTruth.title || draft?.titleOfDay || draft?.title || (draft?.displayDate ? `Summation for ${draft.displayDate}` : '');
  const rows = [
    ['Display date', sourceTruth.displayDate || draft?.displayDate],
    ['Day of week', sourceTruth.dayOfWeek || draft?.dayOfWeek],
    ['Source date', sourceTruth.sourceDate || draft?.sourceDate],
    ['Chaotica day number', sourceTruth.chaoticaDayNumber || draft?.chaoticaDayNumber],
    ['Title of the day', titleFallback],
    ['Mood', sourceTruth.mood],
    ['Era', sourceTruth.era],
    ['Singleness', sourceTruth.singlenessLevel || sourceTruth.singleness],
    ['Head hummer', sourceTruth.headHummer],
    ['Word of the day', sourceTruth.wordOfDay],
    ['Assured thoughts', sourceTruth.assuredThoughts],
    ['THICC.TIME signals', sourceTruth.weekSignal || sourceTruth.thiccTimeSignals || sourceTruth.thiccTime],
    ['REMEMBER.ME moments', sourceTruth.moments || sourceTruth.timelineHighlights || sourceTruth.rememberMeMoments],
    ['THICC.FITT signals', sourceTruth.workoutHighlights || sourceTruth.thiccFittSignals],
    ['DA.EATER signals', sourceTruth.macroHighlights || sourceTruth.mealHighlights || sourceTruth.daEaterSignals],
    ['Source metadata', draft?.sourceMetadata || sourceTruth.sourceMetadata || sourceTruth.sourceAvailability || draft?.availableSourceSignals],
  ];
  return <dl className="summation-source-truth-list">{rows.map(([label, value]) => <SourceTruthRow key={label} label={label} value={value} />)}</dl>;
}

function PennyPanel({ draft }) {
  const answers = normalizePennyAnswerRows(draft);
  if (!answers.length) return <p className="summation-empty-copy">No Penny answers saved for this day yet.</p>;
  return (
    <div className="summation-penny-answer-list">
      {answers.map((answer, index) => (
        <article className="summation-penny-answer" key={`${answer.id}-${index}`}>
          {answer.question ? <h3>{answer.question}</h3> : <h3>Penny answer</h3>}
          <p>{String(answer.answerText)}</p>
          <dl>
            {Object.entries(answer.metadata).filter(([, value]) => hasValue(value)).map(([key, value]) => (
              <div key={key}><dt>{humanizeKey(key)}</dt><dd>{String(value)}</dd></div>
            ))}
          </dl>
        </article>
      ))}
    </div>
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

  const title = draft.titleOfDay || draft.title || (draft.displayDate ? `Summation for ${draft.displayDate}` : 'THE.SUMMATION');

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

        <ShellPanel className="summation-workspace-panel" eyebrow="Source Truth Panel" title="Source Truth">
          <SourceTruthPanel draft={draft} />
        </ShellPanel>

        <ShellPanel className="summation-penny-panel" eyebrow="Source Answers" title="Penny for Your Thoughts">
          <PennyPanel draft={draft} />
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
