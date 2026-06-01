'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  generateSummationSketchStory,
  getChaoticaDayNumber,
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

const VARIATIONS = ['Variation 1', 'Variation 2', 'Variation 3', 'Variation 4', 'Variation 5'];
const EMPTY_ANSWERS = Object.fromEntries(WRAP_QUESTIONS.map((question) => [question.key, '']));

function StoryGlyph({ children, className = '' }) {
  return <span className={`summation-story-glyph ${className}`}>{children}</span>;
}

function PhraseRibbon({ children, className = '' }) {
  return <span className={`summation-phrase-ribbon ${className}`}>{children}</span>;
}

export default function TheSummationSection() {
  const today = useMemo(() => new Date(), []);
  const [assurerDay, setAssurerDay] = useState(null);
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [selectedVariation, setSelectedVariation] = useState(VARIATIONS[0]);
  const [chaoticaDayNumber, setChaoticaDayNumber] = useState(1);
  const [sealStatus, setSealStatus] = useState('');
  const [loadingState, setLoadingState] = useState('SUMMONING THE DAY STORY');

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

  const dayTitle = activeStory.title || 'UNTITLED CHAOTICA TRUTH';

  const updateAnswer = (key, value) => {
    setAnswers((current) => ({ ...current, [key]: value }));
  };

  const sealPage = () => {
    if (!assurerDay || !activeStory) return;
    const sealed = sealSummationVariation(
      { ...assurerDay, chaoticaDayNumber },
      {
        id: selectedVariation.toLowerCase().replaceAll(' ', '-'),
        name: selectedVariation,
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

      <section className="summation-stage" aria-label="THE.SUMMATION landscape sketch story board">
        <article className="summation-board-zone" aria-label="Active Summation Board">
          <header className="summation-identity-line">
            <span className="summation-identity-title">{dayTitle}</span>
            <span>{assurerDay?.displayDate || activeStory.displayDate}</span>
            <span>{assurerDay?.dayOfWeek || activeStory.dayOfWeek}</span>
            <span>Chaotica Day # {chaoticaDayNumber}</span>
          </header>

          <div className={`summation-sketch-board variation-${selectedVariation.slice(-1)}`}>
            <div className="summation-orbit summation-orbit-one" />
            <div className="summation-orbit summation-orbit-two" />
            <div className="summation-orbit summation-orbit-three" />
            <div className="summation-arrow summation-arrow-one">↝</div>
            <div className="summation-arrow summation-arrow-two">↜</div>
            <div className="summation-arrow summation-arrow-three">↬</div>

            <section className="summation-focal-phrase" aria-label="Daily focal phrase">
              <StoryGlyph>✦</StoryGlyph>
              <strong>{activeStory.focalPhrase}</strong>
              <small>{activeStory.wordDefinition}</small>
            </section>

            <div className="summation-visual-cluster summation-cluster-moon">
              <StoryGlyph>☾</StoryGlyph>
              <PhraseRibbon>{activeStory.emotionalArc}</PhraseRibbon>
            </div>

            <div className="summation-visual-cluster summation-cluster-mask">
              <StoryGlyph>◐</StoryGlyph>
              <PhraseRibbon>{activeStory.theatreCue}</PhraseRibbon>
            </div>

            <div className="summation-story-stream" aria-label="Flowing day story phrases">
              {activeStory.storyPhrases.map((phrase, index) => (
                <p key={`${phrase}-${index}`} className={`summation-story-note note-${index + 1}`}>
                  <span>{activeStory.symbols[index % activeStory.symbols.length]}</span>
                  {phrase}
                </p>
              ))}
            </div>

            <div className="summation-answer-stream" aria-label="Wrap answers woven into active story">
              {activeStory.answerRibbons.length ? activeStory.answerRibbons.map((answer, index) => (
                <PhraseRibbon key={`${answer}-${index}`} className={`answer-${index + 1}`}>{answer}</PhraseRibbon>
              )) : (
                <PhraseRibbon className="answer-empty">End-of-day answers will curl through this sketch story.</PhraseRibbon>
              )}
            </div>
          </div>
        </article>

        <aside className="summation-support-zone" aria-label="End of Day Support">
          <form className="summation-wrap-zone">
            <h2>Special End of Day Wrap Questions</h2>
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
            <h2>Final Design Variation Selector</h2>
            <div className="summation-variation-list" role="radiogroup" aria-label="Choose the single active final design variation">
              {VARIATIONS.map((variation) => (
                <label key={variation} className={selectedVariation === variation ? 'is-selected' : ''}>
                  <input
                    type="radio"
                    name="summation-variation"
                    value={variation}
                    checked={selectedVariation === variation}
                    onChange={() => setSelectedVariation(variation)}
                  />
                  <span>{variation}</span>
                </label>
              ))}
            </div>
            <button type="button" onClick={sealPage} disabled={!assurerDay || loadingState !== 'READY'}>
              Seal Selected Design
            </button>
            {sealStatus ? <p className="summation-seal-status">{sealStatus}</p> : null}
          </div>
        </aside>
      </section>
    </main>
  );
}
