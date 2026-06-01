'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  generateSummationSketchStory,
  getChaoticaDayNumber,
  getSummationRemixPresets,
  readAssurerDayForSummation,
  sealSummationVariation,
} from '../../src/services/summationService';
import '../../styles/sections/the-summation.css';

const BACKGROUND_URL = '/backgrounds/THE-SUMMATION/the-summation-masquerade-official.png';

const WRAP_QUESTIONS = [
  { key: 'defined', label: 'What defined today?' },
  { key: 'taught', label: 'What did today teach you?' },
  { key: 'remember', label: 'What do you want future you to remember?' },
  { key: 'truth', label: 'What truth are you sealing?' },
  { key: 'release', label: 'What needs to be released before tomorrow?' },
];

const VARIATIONS = getSummationRemixPresets();
const EMPTY_ANSWERS = Object.fromEntries(WRAP_QUESTIONS.map((question) => [question.key, '']));

function RemixText({ item, index }) {
  return (
    <p className={`summation-remix-text text-${index + 1} role-${item.role || 'line'}`}>
      {item.text}
    </p>
  );
}

function RemixMark({ item, index, className }) {
  return (
    <span className={`${className} mark-${index + 1}`} title={`${item.source}: ${item.form}`}>
      <em>{item.form}</em>
      <strong>{item.text}</strong>
    </span>
  );
}

export default function TheSummationSection() {
  const today = useMemo(() => new Date(), []);
  const [assurerDay, setAssurerDay] = useState(null);
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [selectedVariation, setSelectedVariation] = useState(VARIATIONS[0].selectorLabel);
  const [chaoticaDayNumber, setChaoticaDayNumber] = useState(1);
  const [sealStatus, setSealStatus] = useState('');
  const [loadingState, setLoadingState] = useState('SUMMONING THE ASSURER DAY');

  useEffect(() => {
    let active = true;

    readAssurerDayForSummation(today)
      .then((dayPayload) => {
        if (!active) return;
        setAssurerDay(dayPayload);
        setChaoticaDayNumber(getChaoticaDayNumber(dayPayload.sourceDate));
        setLoadingState('READY');
      })
      .catch(() => {
        if (!active) return;
        setLoadingState('THE ASSURER DAY COULD NOT BE READ');
      });

    return () => {
      active = false;
    };
  }, [today]);

  const activeStory = useMemo(() => (
    generateSummationSketchStory(assurerDay, selectedVariation, answers)
  ), [answers, assurerDay, selectedVariation]);

  const titleOfDay = activeStory.hasAssurerTitle ? activeStory.title : activeStory.emptyTitleText;
  const activeNumber = selectedVariation.match(/\d+/)?.[0] || '1';

  const updateAnswer = (key, value) => {
    setAnswers((current) => ({ ...current, [key]: value }));
  };

  const sealPage = () => {
    if (!assurerDay || !activeStory) return;
    const sealed = sealSummationVariation(
      { ...assurerDay, chaoticaDayNumber },
      {
        id: activeStory.id,
        name: activeStory.name,
        renderedStoryPayload: activeStory,
        wrapAnswers: answers,
      },
    );

    if (sealed) {
      setChaoticaDayNumber(sealed.chaoticaDayNumber);
      setSealStatus(`SEALED AS CHAOTICA DAY # ${sealed.chaoticaDayNumber}`);
    }
  };

  return (
    <main className="summation-shell" style={{ '--summation-bg': `url(${BACKGROUND_URL})` }}>
      <div className="summation-background-plate" aria-hidden="true" />

      <div className="summation-landscape-warning" role="status">
        <strong>LANDSCAPE ONLY.</strong>
        <span>Turn the portal sideways. THE.SUMMATION only opens as a fixed masquerade board.</span>
      </div>

      <section className="summation-stage" aria-label="THE.SUMMATION landscape 5-way Assurer remix renderer">
        <article className="summation-board-zone" aria-label="Single Active Summation Board">
          <header className="summation-identity-line">
            <span className={`summation-identity-title${activeStory.hasAssurerTitle ? '' : ' is-empty'}`}>{titleOfDay}</span>
            <span>{assurerDay?.displayDate || activeStory.displayDate}</span>
            <span>{assurerDay?.dayOfWeek || activeStory.dayOfWeek}</span>
            <span>Chaotica Day # {chaoticaDayNumber}</span>
          </header>

          <div className={`summation-sketch-board variation-${activeNumber}`} data-preset={activeStory.id}>
            <div className="summation-board-wash" aria-hidden="true" />
            <div className="summation-orbit summation-orbit-one" />
            <div className="summation-orbit summation-orbit-two" />
            <div className="summation-orbit summation-orbit-three" />
            <div className="summation-arrow summation-arrow-one">↝</div>
            <div className="summation-arrow summation-arrow-two">↜</div>
            <div className="summation-arrow summation-arrow-three">↬</div>

            <section className="summation-preset-focus" aria-label="Active remix preset">
              <span>{activeStory.name}</span>
              <p>{activeStory.visualFocus}</p>
            </section>

            <section className="summation-focal-phrase" aria-label="Sourced emotional focal point">
              <span className="summation-story-glyph">✦</span>
              {activeStory.focalPhrase ? <strong>{activeStory.focalPhrase}</strong> : <strong className="is-empty">Awaiting THE.ASSURER source text</strong>}
              <small>{activeStory.emotionalArc}</small>
            </section>

            <div className="summation-text-layer" aria-label="Text retained from THE.ASSURER">
              {activeStory.textItems.map((item, index) => <RemixText key={`${item.source}-${item.text}`} item={item} index={index} />)}
            </div>

            <div className="summation-drawing-layer" aria-label="Signals transformed into drawings">
              {activeStory.drawingItems.map((item, index) => <RemixMark key={`${item.source}-${item.text}`} item={item} index={index} className="summation-drawing-mark" />)}
            </div>

            <div className="summation-animation-layer" aria-label="Signals transformed into subtle animation">
              {activeStory.animatedItems.map((item, index) => <RemixMark key={`${item.source}-${item.text}`} item={item} index={index} className="summation-animated-mark" />)}
            </div>

            <div className="summation-icon-layer" aria-label="Signals transformed into small icons">
              {activeStory.iconItems.map((item, index) => <RemixMark key={`${item.source}-${item.text}`} item={item} index={index} className="summation-icon-mark" />)}
            </div>

            <div className="summation-texture-layer" aria-hidden="true">
              {activeStory.textureItems.map((item, index) => <span key={`${item.source}-${item.text}`} className={`summation-texture-mark texture-${index + 1}`}>{item.text}</span>)}
            </div>
          </div>
        </article>

        <aside className="summation-support-zone" aria-label="End of Day Support">
          <form className="summation-wrap-zone">
            <h2>End of Day Wrap</h2>
            {WRAP_QUESTIONS.map((question) => (
              <label key={question.key}>
                <span>{question.label}</span>
                <textarea
                  value={answers[question.key]}
                  onChange={(event) => updateAnswer(question.key, event.target.value)}
                  rows={2}
                />
              </label>
            ))}
          </form>

          <div className="summation-variation-zone">
            <h2>Assurer Remix Engine</h2>
            <div className="summation-variation-list" role="radiogroup" aria-label="Choose the single active final design variation">
              {VARIATIONS.map((variation) => (
                <label key={variation.id} className={selectedVariation === variation.selectorLabel ? 'is-selected' : ''}>
                  <input
                    type="radio"
                    name="summation-variation"
                    value={variation.selectorLabel}
                    checked={selectedVariation === variation.selectorLabel}
                    onChange={() => setSelectedVariation(variation.selectorLabel)}
                  />
                  <span>{variation.selectorLabel}</span>
                </label>
              ))}
            </div>
            <p className="summation-active-preset">{activeStory.name}</p>
            <button type="button" onClick={sealPage} disabled={!assurerDay || loadingState !== 'READY'}>
              Seal Selected Remix
            </button>
            {sealStatus ? <p className="summation-seal-status">{sealStatus}</p> : null}
          </div>
        </aside>
      </section>
    </main>
  );
}
