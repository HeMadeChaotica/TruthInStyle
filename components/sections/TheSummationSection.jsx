'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getChaoticaDayNumber,
  getSummationDateParts,
  readAssurerStoryInput,
  readSummationDraft,
  saveSummationDraft,
  sealSummationPage,
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

const emptyAnswers = Object.fromEntries(WRAP_QUESTIONS.map((question) => [question.key, '']));

function StoryGlyph({ className = '', children }) {
  return <span className={`summation-glyph ${className}`}>{children}</span>;
}

function StoryPhrase({ children, className = '' }) {
  return <span className={`summation-phrase ${className}`}>{children}</span>;
}

export default function TheSummationSection() {
  const today = useMemo(() => new Date(), []);
  const dateParts = useMemo(() => getSummationDateParts(today), [today]);
  const [storyInput, setStoryInput] = useState({ title: '', dailyWord: null, feed: [], sparks: [] });
  const [answers, setAnswers] = useState(emptyAnswers);
  const [selectedVariation, setSelectedVariation] = useState(VARIATIONS[0]);
  const [chaoticaDayNumber, setChaoticaDayNumber] = useState(1);
  const [sealStatus, setSealStatus] = useState('');

  useEffect(() => {
    const draft = readSummationDraft(dateParts.isoDate);
    setStoryInput(readAssurerStoryInput(today));
    setChaoticaDayNumber(getChaoticaDayNumber(today));
    if (draft?.answers) setAnswers({ ...emptyAnswers, ...draft.answers });
    if (draft?.selectedVariation && VARIATIONS.includes(draft.selectedVariation)) {
      setSelectedVariation(draft.selectedVariation);
    }
  }, [dateParts.isoDate, today]);

  useEffect(() => {
    saveSummationDraft(dateParts.isoDate, { answers, selectedVariation });
  }, [answers, dateParts.isoDate, selectedVariation]);

  const dayTitle = storyInput.title?.trim() || 'UNTITLED DISCO TRUTH';
  const dailyWord = storyInput.dailyWord?.word || 'VELVET RUCKUS';
  const dailyDefinition = storyInput.dailyWord?.definition || 'THE DAY IS WAITING FOR ITS FINAL SHAPE.';
  const storySparks = storyInput.sparks.length
    ? storyInput.sparks.slice(0, 6)
    : [
      { id: 'fallback-1', tone: 'signal', text: 'the evidence gathered itself' },
      { id: 'fallback-2', tone: 'motion', text: 'small choices made a loud orbit' },
      { id: 'fallback-3', tone: 'memory', text: 'future you gets the clean version' },
    ];

  const answeredRibbons = WRAP_QUESTIONS.map((question) => ({
    ...question,
    answer: answers[question.key]?.trim(),
  })).filter((question) => question.answer);

  const updateAnswer = (key, value) => {
    setAnswers((current) => ({ ...current, [key]: value }));
  };

  const sealPage = () => {
    const sealedPage = sealSummationPage({
      dateKey: dateParts.isoDate,
      title: dayTitle,
      weekday: dateParts.weekday,
      selectedVariation,
      answers,
      storySparks,
    });
    if (sealedPage) {
      setChaoticaDayNumber(sealedPage.chaoticaDayNumber);
      setSealStatus(`SEALED AS CHAOTICA DAY # ${sealedPage.chaoticaDayNumber}`);
    }
  };

  return (
    <main className="summation-shell" style={{ '--summation-bg': `url(${BACKGROUND_URL})` }}>
      <div className="summation-landscape-warning" role="status">
        <strong>LANDSCAPE ONLY.</strong>
        <span>TURN THE PORTAL SIDEWAYS SO THE DAY STORY CAN BREATHE.</span>
      </div>

      <section className="summation-stage" aria-label="THE.SUMMATION LANDSCAPE STORY BOARD">
        <div className="summation-board-zone">
          <header className="summation-identity-line">
            <div>
              <span className="summation-kicker">THE.SUMMATION</span>
              <h1>{dayTitle}</h1>
            </div>
            <dl>
              <div><dt>DATE</dt><dd>{dateParts.displayDate}</dd></div>
              <div><dt>DAY</dt><dd>{dateParts.weekday}</dd></div>
              <div><dt>CHAOTICA DAY #</dt><dd>{chaoticaDayNumber}</dd></div>
            </dl>
          </header>

          <div className={`summation-sketch-floor variation-${selectedVariation.slice(-1)}`}>
            <div className="summation-orbit orbit-one" />
            <div className="summation-orbit orbit-two" />
            <div className="summation-arrow arrow-one">↝</div>
            <div className="summation-arrow arrow-two">↜</div>

            <div className="summation-word-burst">
              <StoryGlyph>✦</StoryGlyph>
              <span>{dailyWord}</span>
              <small>{dailyDefinition}</small>
            </div>

            <div className="summation-story-cloud cloud-a">
              <StoryPhrase>DATA BECAME A MOOD</StoryPhrase>
              <StoryGlyph>☾</StoryGlyph>
            </div>
            <div className="summation-story-cloud cloud-b">
              <StoryGlyph>♡</StoryGlyph>
              <StoryPhrase>THE DAY TOLD ON ITSELF</StoryPhrase>
            </div>

            <div className="summation-spark-field" aria-label="DAY STORY SKETCH NOTES">
              {storySparks.map((spark, index) => (
                <p key={spark.id} className={`summation-spark spark-${index + 1} tone-${spark.tone}`}>
                  <span>{index + 1}</span>
                  {spark.text}
                </p>
              ))}
            </div>

            <div className="summation-ribbon-field" aria-label="WRAP ANSWERS BECOMING STORY">
              {answeredRibbons.length ? answeredRibbons.map((ribbon, index) => (
                <p key={ribbon.key} className={`summation-answer-ribbon ribbon-${index + 1}`}>
                  {ribbon.answer}
                </p>
              )) : (
                <p className="summation-answer-ribbon ribbon-empty">ANSWER THE WRAP QUESTIONS, THEN WATCH THEM BECOME THE FINAL SKETCH-STORY.</p>
              )}
            </div>
          </div>
        </div>

        <aside className="summation-support-zone" aria-label="END OF DAY SUPPORT CONTROLS">
          <form className="summation-wrap-zone">
            <h2>SPECIAL END OF DAY WRAP QUESTIONS</h2>
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
            <h2>FINAL DESIGN VARIATION SELECTOR</h2>
            <div className="summation-variation-list" role="radiogroup" aria-label="Choose final design variation">
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
            <button type="button" onClick={sealPage}>SEAL SELECTED DESIGN</button>
            {sealStatus ? <p className="summation-seal-status">{sealStatus}</p> : null}
          </div>
        </aside>
      </section>
    </main>
  );
}
