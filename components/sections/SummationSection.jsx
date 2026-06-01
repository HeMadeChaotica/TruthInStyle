'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  generateSummationVariations,
  readAssurerDayForSummation,
  sealSummationVariation,
} from '../../src/services/summationService';
import '../../styles/sections/summation.css';

function TruthPill({ label, value }) {
  if (!value) return null;
  return (
    <span className="summation-truth-pill">
      <strong>{label}</strong>
      {value}
    </span>
  );
}

function Cluster({ cluster }) {
  return (
    <article className="summation-cluster">
      <div className="summation-cluster-heading">
        <span aria-hidden="true">✦</span>
        <strong>{cluster.label}</strong>
        <small>{cluster.icon}</small>
      </div>
      <ul>
        {cluster.fragments.map((fragment) => (
          <li key={fragment}>{fragment}</li>
        ))}
      </ul>
    </article>
  );
}

function VariationSheet({ variation, selected, onSelect, onSeal, disabled }) {
  const sealLabel = selected ? 'SEAL THIS STORY TO HOPEWOOD' : 'SELECT TO SEAL';

  return (
    <article className={`summation-variation ${selected ? 'summation-variation-selected' : ''}`.trim()}>
      <header className="summation-variation-header">
        <div>
          <span className="summation-variation-kicker">{variation.name}</span>
          <h2>{variation.focalPhrase}</h2>
        </div>
        <button type="button" onClick={onSelect} className="summation-select-button">
          {selected ? 'SELECTED' : 'CHOOSE'}
        </button>
      </header>

      <div className="summation-sketch-page" data-flow={variation.flowDirection}>
        <div className="summation-hero-doodle" aria-hidden="true">
          <span className="summation-loop summation-loop-one" />
          <span className="summation-loop summation-loop-two" />
          <strong>{variation.focalPhrase}</strong>
          <small>CHAOTICA #{variation.sourceTruth.chaoticaDayNumber}</small>
        </div>

        <div className="summation-flow-line" aria-hidden="true">↝ ↬ ↝</div>

        <section className="summation-story-meta" aria-label="Story arrangement notes">
          <p><strong>FLOW:</strong> {variation.flowDirection}</p>
          <p><strong>ARC:</strong> {variation.emotionalArc}</p>
          <p><strong>LAYOUT:</strong> {variation.arrangement}</p>
        </section>

        <section className="summation-word-ribbons" aria-label="Source-truth word ribbons">
          {variation.wordRibbons.map((ribbon) => (
            <span key={ribbon}>{ribbon}</span>
          ))}
        </section>

        <section className="summation-doodle-stack" aria-label="Doodle hierarchy">
          {variation.doodleHierarchy.map((doodle) => (
            <span key={doodle}>☉ {doodle}</span>
          ))}
        </section>

        <section className="summation-cluster-grid" aria-label="Story clusters">
          {variation.clusters.map((cluster) => <Cluster key={cluster.label} cluster={cluster} />)}
        </section>

        <footer className="summation-instructions">
          {variation.sketchInstructions.map((instruction) => (
            <span key={instruction}>{instruction}</span>
          ))}
        </footer>
      </div>

      <button type="button" className="summation-seal-button" onClick={onSeal} disabled={!selected || disabled}>
        {sealLabel}
      </button>
    </article>
  );
}

function SourceStatus({ availability }) {
  const rows = [
    ['TITLE', availability?.title],
    ['WORD', availability?.word],
    ['THICC.FITT', availability?.thiccFitt],
    ['MEALS', availability?.mealLog],
    ['MACROS', availability?.macroSnapshot],
    ['REMEMBER.ME EVENTS', availability?.rememberMeEvents],
    ['MOMENT CARDS', availability?.momentCards],
    ['THICC.TIME WEEK', availability?.thiccTimeWeek],
    ['WRAP ANSWERS', availability?.wrapAnswers],
  ];

  return (
    <div className="summation-source-status" aria-label="Assurer source availability">
      {rows.map(([label, present]) => (
        <span key={label} className={present ? 'summation-source-present' : 'summation-source-quiet'}>
          {present ? 'INKED' : 'QUIET'} · {label}
        </span>
      ))}
    </div>
  );
}

export default function SummationSection() {
  const [assurerDay, setAssurerDay] = useState(null);
  const [variations, setVariations] = useState([]);
  const [selectedVariationId, setSelectedVariationId] = useState('');
  const [sealedRecord, setSealedRecord] = useState(null);
  const [loadingState, setLoadingState] = useState('LOADING THE ASSURER DAY');

  useEffect(() => {
    let active = true;

    readAssurerDayForSummation(new Date())
      .then((dayPayload) => {
        if (!active) return;
        const nextVariations = generateSummationVariations(dayPayload);
        setAssurerDay(dayPayload);
        setVariations(nextVariations);
        setSelectedVariationId(nextVariations[0]?.id || '');
        setLoadingState('READY');
      })
      .catch(() => {
        if (!active) return;
        setLoadingState('THE ASSURER DAY COULD NOT BE READ');
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedVariation = useMemo(
    () => variations.find((variation) => variation.id === selectedVariationId) || variations[0] || null,
    [selectedVariationId, variations],
  );

  const handleSeal = () => {
    if (!assurerDay || !selectedVariation) return;
    const sealed = sealSummationVariation(assurerDay, selectedVariation);
    setSealedRecord(sealed);
  };

  if (loadingState !== 'READY') {
    return (
      <section className="summation-shell">
        <div className="summation-loading">{loadingState}</div>
      </section>
    );
  }

  return (
    <section className="summation-shell" aria-labelledby="summation-title">
      <header className="summation-hero">
        <span className="summation-kicker">THE.SUMMATION · DATA-TO-SKETCH STORY RENDERER</span>
        <h1 id="summation-title">{assurerDay.titleOfDay || 'THE DAY SKETCHES ITSELF'}</h1>
        <p>
          Five stretch-doodle story renders from the same THE.ASSURER day. No raw JSON, no source overwrites,
          just interpreted visual truth waiting to be sealed.
        </p>
        <div className="summation-truth-strip" aria-label="Preserved source truth">
          <TruthPill label="DATE" value={assurerDay.displayDate} />
          <TruthPill label="DAY" value={assurerDay.dayOfWeek} />
          <TruthPill label="CHAOTICA" value={`#${assurerDay.chaoticaDayNumber}`} />
          <TruthPill label="WORD" value={assurerDay.wordOfDay?.word} />
          <TruthPill label="BATTLE CRY" value={assurerDay.battleCry?.text} />
        </div>
        <SourceStatus availability={assurerDay.sourceAvailability} />
        {sealedRecord ? (
          <div className="summation-sealed-notice" role="status">
            SEALED {sealedRecord.selectedVariationName} · SENT TO HOPEWOOD · {sealedRecord.sourceDate}
          </div>
        ) : null}
      </header>

      <div className="summation-variation-grid">
        {variations.map((variation) => (
          <VariationSheet
            key={variation.id}
            variation={variation}
            selected={variation.id === selectedVariationId}
            onSelect={() => setSelectedVariationId(variation.id)}
            onSeal={handleSeal}
            disabled={Boolean(sealedRecord)}
          />
        ))}
      </div>
    </section>
  );
}
