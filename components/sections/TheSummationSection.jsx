'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PENNY_FOR_YOUR_THOUGHTS_QUESTIONS,
  buildSummationSealPayload,
  generateSummationSketchStory,
  getChaoticaDayNumber,
  getSummationRemixPresets,
  isSummationSketchSealable,
  readAssurerDayForSummation,
  sealSummationVariation,
} from '../../src/services/summationService';
import '../../styles/sections/the-summation.css';

const BACKGROUND_URL = '/backgrounds/THE-SUMMATION/the-summation-bg.png';

const PENNY_LIMIT = 2;

const VARIATIONS = getSummationRemixPresets();


export default function TheSummationSection() {
  const today = useMemo(() => new Date(), []);
  const [assurerDay, setAssurerDay] = useState(null);
  const [selectedPennyQuestionIds, setSelectedPennyQuestionIds] = useState([]);
  const [pennyAnswerTextById, setPennyAnswerTextById] = useState({});
  const [selectedVariation] = useState(VARIATIONS[0].selectorLabel);
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

  const pennyForYourThoughts = useMemo(() => {
    const selectedQuestionIds = PENNY_FOR_YOUR_THOUGHTS_QUESTIONS
      .filter((question) => selectedPennyQuestionIds.includes(question.id))
      .map((question) => question.id);

    return {
      selectedQuestionIds,
      answers: PENNY_FOR_YOUR_THOUGHTS_QUESTIONS
        .filter((question) => selectedQuestionIds.includes(question.id))
        .map((question) => ({
          questionId: question.id,
          questionText: question.text,
          answerText: pennyAnswerTextById[question.id] || '',
        })),
    };
  }, [pennyAnswerTextById, selectedPennyQuestionIds]);

  const activeStory = useMemo(() => (
    generateSummationSketchStory(assurerDay, selectedVariation, pennyForYourThoughts)
  ), [assurerDay, pennyForYourThoughts, selectedVariation]);

  const titleOfDay = activeStory.hasAssurerTitle ? activeStory.title : activeStory.emptyTitleText;
  const activeNumber = '1';

  const sealableStoryPayload = useMemo(
    () => buildSummationSealPayload(activeStory, pennyForYourThoughts),
    [activeStory, pennyForYourThoughts],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isSummationSketchSealable(sealableStoryPayload)) {
      window.localStorage.removeItem('completed_summation_sketch');
      return;
    }
    window.localStorage.setItem('completed_summation_sketch', JSON.stringify(sealableStoryPayload));
  }, [sealableStoryPayload]);

  const handlePennyQuestionToggle = useCallback((questionId) => {
    setSelectedPennyQuestionIds((currentIds) => {
      if (currentIds.includes(questionId)) {
        return currentIds.filter((id) => id !== questionId);
      }
      if (currentIds.length >= PENNY_LIMIT) return currentIds;
      return [...currentIds, questionId];
    });
  }, []);

  const handlePennyAnswerChange = useCallback((questionId, answerText) => {
    setPennyAnswerTextById((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: answerText,
    }));
  }, []);

  const sealPage = useCallback(() => {
    if (!assurerDay || !isSummationSketchSealable(sealableStoryPayload)) {
      console.warn('THE.SUMMATION seal blocked: exactly two answered Pennies are required.');
      return;
    }
    const sealed = sealSummationVariation(
      { ...assurerDay, chaoticaDayNumber },
      sealableStoryPayload,
    );

    if (sealed) {
      setChaoticaDayNumber(sealed.chaoticaDayNumber);
      setSealStatus(`SEALED AS CHAOTICA DAY # ${sealed.chaoticaDayNumber}`);
    }
  }, [assurerDay, chaoticaDayNumber, sealableStoryPayload]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('so-let-it-be-done', sealPage);
    return () => window.removeEventListener('so-let-it-be-done', sealPage);
  }, [sealPage]);

  return (
    <main className="summation-shell" style={{ '--summation-bg': `url(${BACKGROUND_URL})` }}>
      <div className="summation-background-plate" aria-hidden="true" />

      <div className="summation-landscape-warning" role="status">
        <strong>LANDSCAPE ONLY.</strong>
        <span>Turn the portal sideways. THE.SUMMATION only opens as a fixed masquerade board.</span>
      </div>

      <section className="summation-stage" aria-label="THE.SUMMATION landscape masquerade map">
        <article className="summation-board-zone" aria-label="Single Active Summation Board">
          <header className="summation-identity-line">
            <span className={`summation-identity-title${activeStory.hasAssurerTitle ? '' : ' is-empty'}`}>{titleOfDay}</span>
            <span>{assurerDay?.displayDate || activeStory.displayDate}</span>
            <span>{assurerDay?.dayOfWeek || activeStory.dayOfWeek}</span>
            <span>Chaotica Day # {chaoticaDayNumber}</span>
          </header>

          <div className={`summation-sketch-board variation-${activeNumber}`} data-theme={activeStory.id}>
            <div className="summation-board-wash" aria-hidden="true" />
            <svg className="summation-ballroom-route" viewBox="0 0 1000 620" aria-hidden="true" focusable="false">
              <path className="summation-route-shadow" d="M80 418 C180 306 248 300 318 214 S478 118 572 210 706 352 848 258" />
              <path className="summation-route-main" d="M80 418 C180 306 248 300 318 214 S478 118 572 210 706 352 848 258" />
              <path className="summation-route-branch" d="M318 214 C356 288 414 348 498 372 S648 402 732 504" />
              <path className="summation-route-branch" d="M572 210 C548 288 540 352 498 372" />
              <circle className="summation-route-stop stop-one" cx="80" cy="418" r="8" />
              <circle className="summation-route-stop stop-two" cx="318" cy="214" r="8" />
              <circle className="summation-route-stop stop-three" cx="572" cy="210" r="8" />
              <circle className="summation-route-stop stop-four" cx="848" cy="258" r="8" />
              <circle className="summation-route-stop stop-five" cx="498" cy="372" r="8" />
              <circle className="summation-route-stop stop-six" cx="732" cy="504" r="8" />
            </svg>
            <div className="summation-route-arrow summation-route-arrow-one" aria-hidden="true">MASK</div>
            <div className="summation-route-arrow summation-route-arrow-two" aria-hidden="true">TURN</div>
            <div className="summation-route-arrow summation-route-arrow-three" aria-hidden="true">AFTERGLOW</div>

            <section className="summation-theme-label" aria-label="Active theme">
              <span>{activeStory.name}</span>
              <p>{activeStory.visualFocus}</p>
            </section>

            <section className="summation-word-keepsake" aria-label="Readable source text retained from THE.ASSURER">
              {activeStory.textItems.map((item, index) => (
                <p
                  key={`${item.sourceField || item.sourceKey}-${item.text}`}
                  className={`summation-remix-text text-${index + 1} role-${item.role || 'line'}`}
                  data-source-section={item.sourceSection}
                  data-source-field={item.sourceField || item.sourceKey}
                  data-used-as={item.usedAs}
                >
                  <small>{item.source}</small>
                  {item.text}
                </p>
              ))}
            </section>

            <section className="summation-mask-cluster" aria-label="Mood, era, and singleness transformed into masquerade drawings">
              {activeStory.maskCluster.map((item) => (
                <figure
                  key={item.id}
                  className={`summation-map-symbol ${item.id}`}
                  data-source-section={item.sourceSection}
                  data-source-field={item.sourceField}
                  data-used-as={item.usedAs}
                >
                  <span className="summation-symbol-sketch" aria-hidden="true">{item.glyph}</span>
                  <figcaption>
                    <em>{item.form}</em>
                    <strong>{item.text}</strong>
                  </figcaption>
                </figure>
              ))}
            </section>

            <section className="summation-moment-pins" aria-label="WOW, WTF, and PLOT TWIST scene pins">
              {activeStory.momentPins.map((item) => (
                <figure
                  key={item.id}
                  className={`summation-scene-pin ${item.id}`}
                  data-source-section={item.sourceSection}
                  data-source-field={item.sourceField}
                  data-used-as={item.usedAs}
                >
                  <span className="summation-pin-glint" aria-hidden="true" />
                  <span className="summation-pin-doodle" aria-hidden="true">{item.glyph}</span>
                  <figcaption>
                    <em>{item.label}</em>
                    <strong>{item.text}</strong>
                  </figcaption>
                </figure>
              ))}
            </section>

            <section className="summation-motion-layer" aria-label="Battle Cry ribbon and Head Hummer notes">
              {activeStory.animatedItems.map((item) => (
                <div
                  key={`${item.sourceField || item.sourceKey}-${item.text}`}
                  className={`summation-motion-mark ${item.kind || ''}`}
                  data-source-section={item.sourceSection}
                  data-source-field={item.sourceField || item.sourceKey}
                  data-used-as={item.usedAs}
                >
                  <span aria-hidden="true">{item.glyph}</span>
                  <strong>{item.text}</strong>
                </div>
              ))}
            </section>

            <section className="summation-support-glyphs" aria-label="Supporting source glyphs">
              {activeStory.iconItems.map((item) => (
                <figure
                  key={`${item.sourceField || item.sourceKey}-${item.text}`}
                  className={`summation-source-glyph ${item.kind || ''}`}
                  data-source-section={item.sourceSection}
                  data-source-field={item.sourceField || item.sourceKey}
                  data-used-as={item.usedAs}
                >
                  <span aria-hidden="true">{item.glyph}</span>
                  <figcaption>{item.text}</figcaption>
                </figure>
              ))}
            </section>

            <section className="summation-penny-alcove" aria-label="PENNY FOR YOUR THOUGHTS two chosen answers">
              <h2>PENNY FOR YOUR THOUGHTS?</h2>
              {activeStory.pennyAnswers.length ? activeStory.pennyAnswers.map((item) => (
                <article
                  key={item.sourceQuestionId}
                  data-source-section={item.sourceSection}
                  data-source-area={item.sourceArea}
                  data-source-question-id={item.sourceQuestionId}
                  data-used-as={item.usedAs}
                >
                  <span>{item.sourceQuestionText}</span>
                  <p>{item.sourceValue}</p>
                </article>
              )) : <p className="summation-quiet-empty">No chosen Penny answers are present in THE.ASSURER.</p>}
            </section>

            <details className="summation-proof-drawer">
              <summary>source proof</summary>
              <div>
                {activeStory.proofRows.map((row) => (
                  <p key={`${row.sourceField}-${row.usedAs}`}>
                    <span>{row.sourceSection}</span>
                    <strong>{row.sourceField}</strong>
                    <em>{row.usedAs}</em>
                    <small>{row.sourceValue}</small>
                  </p>
                ))}
              </div>
            </details>
          </div>
        </article>

        <aside className="summation-support-zone" aria-label="Masquerade Map Source Preview">
          <section className="summation-source-preview">
            <h2>{activeStory.name}</h2>
            <p>{loadingState === 'READY' ? 'THE.ASSURER source signals are mapped into one ballroom floor.' : loadingState}</p>
            <dl>
              <div><dt>Readable text</dt><dd>Title, date, day, Chaotica number, word, thoughts excerpt, Penny answers.</dd></div>
              <div><dt>Sketch art</dt><dd>Mood mask, era posture, singleness orbit, three moment pins, location, weather, meal, workout.</dd></div>
              <div><dt>Quiet proof</dt><dd>Exact raw values stay inside the proof drawer on the map.</dd></div>
            </dl>
            <section className="summation-penny-picker" aria-label="Choose exactly two Penny questions">
              <h3>PENNY FOR YOUR THOUGHTS?</h3>
              <p>Choose exactly 2 and answer both before the Control Panel can seal.</p>
              {PENNY_FOR_YOUR_THOUGHTS_QUESTIONS.map((question) => {
                const selected = selectedPennyQuestionIds.includes(question.id);
                const disabled = !selected && selectedPennyQuestionIds.length >= PENNY_LIMIT;
                return (
                  <label key={question.id}>
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={disabled}
                      onChange={() => handlePennyQuestionToggle(question.id)}
                    />
                    <span>{question.text}</span>
                    {selected ? (
                      <textarea
                        value={pennyAnswerTextById[question.id] || ''}
                        onChange={(event) => handlePennyAnswerChange(question.id, event.target.value)}
                        aria-label={`Answer for ${question.text}`}
                      />
                    ) : null}
                  </label>
                );
              })}
            </section>
            {sealStatus ? <p className="summation-seal-status">{sealStatus}</p> : null}
          </section>
        </aside>
      </section>
    </main>
  );
}
