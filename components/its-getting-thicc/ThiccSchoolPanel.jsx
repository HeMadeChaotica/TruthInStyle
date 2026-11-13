'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createDefaultSchoolState,
  getCourseQuestions,
  getSectionMasteryGates,
  getSectionQuestions,
} from '../../lib/thiccSchool/schoolEngine.mjs';
import { THICC_SCHOOL_MASTERY_SCORE } from '../../lib/thiccSchool/catalog.mjs';
import {
  editThiccSchoolSection,
  getThiccSchoolSummary,
  initializeThiccSchool,
  readThiccSchoolState,
  saveThiccSchoolStudyProgress,
  submitThiccSchoolPractice,
  submitThiccSchoolSectionPractice,
  THICC_SCHOOL_UPDATED_EVENT,
} from '../../src/services/thiccSchoolService';
import { flushAllPendingSaves } from '../../lib/state/autosaveRegistry';
import CptWorkbookAssignment from './CptWorkbookAssignment';
import NutritionWorkbookAssignment from './NutritionWorkbookAssignment';

const minutesLabel = (minutes) => {
  const hours = Math.floor(Number(minutes || 0) / 60);
  const remainder = Number(minutes || 0) % 60;
  if (!hours) return `${remainder} MIN`;
  return remainder ? `${hours} HR ${remainder} MIN` : `${hours} HR`;
};

const displayDate = (dateKey) => {
  if (!dateKey) return 'UNSCHEDULED';
  const [year, month, day] = dateKey.split('-');
  return `${month}/${day}/${year}`;
};

export default function ThiccSchoolPanel() {
  // Keep the server and first browser render identical. Reading localStorage in
  // the state initializer can leave this panel unhydrated, so its controls look
  // active while none of their React handlers run.
  const [school, setSchool] = useState(() => createDefaultSchoolState());
  const [activeCourseId, setActiveCourseId] = useState('cpt');
  const [openGuideId, setOpenGuideId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editDraft, setEditDraft] = useState({ assignedDate: '', minutes: 0 });
  const [studyDraft, setStudyDraft] = useState({ issaCompleted: false, textbookCompleted: false });
  const [practiceSectionId, setPracticeSectionId] = useState('');
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [practiceResult, setPracticeResult] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const initialize = () => {
      const initialized = initializeThiccSchool();
      setSchool(initialized.state);
      if (initialized.moved.length) setStatus(`${initialized.moved.length} UNFINISHED SECTION${initialized.moved.length === 1 ? '' : 'S'} MOVED FORWARD.`);
    };
    const refreshFromStorage = () => setSchool(readThiccSchoolState());
    initialize();
    window.addEventListener('truthinstyle-cloud-state-hydrated', initialize);
    window.addEventListener(THICC_SCHOOL_UPDATED_EVENT, refreshFromStorage);
    return () => {
      window.removeEventListener('truthinstyle-cloud-state-hydrated', initialize);
      window.removeEventListener(THICC_SCHOOL_UPDATED_EVENT, refreshFromStorage);
    };
  }, []);

  const courses = useMemo(() => Object.values(school.courses || {}).filter((course) => course.verifiedMaterial), [school]);
  const activeCourse = school.courses?.[activeCourseId] || courses[0];
  const sections = useMemo(() => Object.values(activeCourse?.sections || {}).sort((a, b) => a.assignedDate.localeCompare(b.assignedDate)), [activeCourse]);
  const summary = useMemo(() => getThiccSchoolSummary(school), [school]);
  const courseComplete = sections.filter((item) => item.status === 'complete').length;
  const coursePercent = sections.length ? Math.round((courseComplete / sections.length) * 100) : 0;
  const latestAttempt = activeCourse?.attempts?.[activeCourse.attempts.length - 1];
  const bestAttempt = activeCourse?.attempts?.reduce((best, attempt) => Math.max(best, Number(attempt.score || 0)), 0) || 0;

  const toggleGuide = (item) => {
    const nextId = openGuideId === item.id ? '' : item.id;
    setOpenGuideId(nextId);
    setPracticeSectionId('');
    setPracticeQuestions([]);
    setPracticeAnswers({});
    setPracticeResult(null);
    if (nextId) setStudyDraft({
      issaCompleted: Boolean(item.issaCompleted),
      textbookCompleted: Boolean(item.textbookCompleted),
    });
  };

  const saveStudyWork = async (item, updates = studyDraft) => {
    const next = saveThiccSchoolStudyProgress(activeCourse.id, item.id, updates);
    const saved = next.courses?.[activeCourse.id]?.sections?.[item.id];
    setSchool(next);
    setStudyDraft({
      issaCompleted: Boolean(saved?.issaCompleted),
      textbookCompleted: Boolean(saved?.textbookCompleted),
    });
    setStatus(saved?.status === 'complete'
      ? `${item.title} MASTERED AND ADDED TO CUMULATIVE PROGRESS.`
      : `${item.title} STUDY WORK SAVED. FINISH EVERY MASTERY GATE.`);
    await flushAllPendingSaves();
  };

  const saveWorkbookWork = async (item, updates) => {
    const next = saveThiccSchoolStudyProgress(activeCourse.id, item.id, updates);
    const saved = next.courses?.[activeCourse.id]?.sections?.[item.id];
    setSchool(next);
    setStatus(saved?.workbookCompleted
      ? `${item.title} WORKBOOK ASSIGNMENT COMPLETED AUTOMATICALLY.`
      : `${item.title} WORKBOOK RESPONSE SAVED.`);
    await flushAllPendingSaves();
  };

  const openEditor = (item) => {
    setEditingId(item.id);
    setEditDraft({ assignedDate: item.assignedDate, minutes: item.minutes });
  };

  const saveEditor = async () => {
    const next = editThiccSchoolSection(activeCourse.id, editingId, editDraft);
    setSchool(next);
    setEditingId('');
    setStatus('COURSE MAP UPDATED.');
    await flushAllPendingSaves();
  };

  const startPractice = () => {
    const attemptIndex = activeCourse?.attempts?.length || 0;
    const questions = getCourseQuestions(activeCourse.id, attemptIndex, 20);
    setPracticeSectionId('cumulative');
    setPracticeQuestions(questions);
    setPracticeAnswers({});
    setPracticeResult(null);
    setStatus(questions.length ? `PRACTICE FORM ${attemptIndex + 1} READY.` : 'PRACTICE QUESTIONS ARE PENDING VERIFIED COURSE ACCESS.');
  };

  const startSectionPractice = (item) => {
    const gates = getSectionMasteryGates(item);
    if (!gates.practiceReady) {
      setStatus('COMPLETE THE READING, ISSA, AND WORKBOOK STAGES IN ORDER BEFORE MODULE PRACTICE.');
      return;
    }
    const attemptIndex = item.practiceAttempts?.length || 0;
    const questions = getSectionQuestions(activeCourse.id, item.id, attemptIndex, 15);
    setPracticeSectionId(item.id);
    setPracticeQuestions(questions);
    setPracticeAnswers({});
    setPracticeResult(null);
    setStatus(questions.length
      ? `${item.title} PRACTICE FORM ${attemptIndex + 1} READY.`
      : 'MODULE-SPECIFIC PRACTICE IS PENDING VERIFIED COURSE CONTENT.');
  };

  const gradePractice = async () => {
    if (practiceQuestions.some((question) => practiceAnswers[question.id] == null)) {
      setStatus('ANSWER EVERY QUESTION BEFORE SCORING.');
      return;
    }
    const recorded = practiceSectionId && practiceSectionId !== 'cumulative'
      ? submitThiccSchoolSectionPractice(activeCourse.id, practiceSectionId, practiceQuestions, practiceAnswers)
      : submitThiccSchoolPractice(activeCourse.id, practiceQuestions, practiceAnswers);
    setSchool(recorded.state);
    setPracticeResult(recorded.result);
    const masteredItem = practiceSectionId && practiceSectionId !== 'cumulative'
      ? recorded.state.courses?.[activeCourse.id]?.sections?.[practiceSectionId]
      : null;
    setStatus(recorded.result.passed
      ? (masteredItem?.status === 'complete' ? `MODULE MASTERED: ${recorded.result.score}%. CUMULATIVE PROGRESS UPDATED.` : `PRACTICE MASTERED: ${recorded.result.score}%. COMPLETE THE REMAINING MODULE GATES.`)
      : `${recorded.result.score}% — REVIEW WEAK TOPICS AND RETAKE UNTIL ${THICC_SCHOOL_MASTERY_SCORE}%+.`);
    await flushAllPendingSaves();
  };

  if (!activeCourse) return <p>THICC.SCHOOL IS LOADING.</p>;

  return <div className="thicc-school">
    <header className="thicc-school-hero">
      <div>
        <small>ITS.GETTING.THICC · PROFESSIONAL DEVELOPMENT</small>
        <h3>THICC.SCHOOL</h3>
      </div>
      <div className="thicc-school-score-grid">
        <span><strong>{summary.completionPercent}%</strong> PROGRAM COMPLETE</span>
        <span><strong>{minutesLabel(summary.remainingMinutes)}</strong> REMAINING</span>
        <span><strong>{summary.bestScore}%</strong> BEST PRACTICE</span>
        <span><strong>{THICC_SCHOOL_MASTERY_SCORE}%</strong> REQUIRED MASTERY</span>
      </div>
    </header>

    {status ? <p className="thicc-school-status" role="status">{status}</p> : null}

    <nav className="thicc-school-course-tabs" aria-label="THICC.SCHOOL courses">
      {courses.map((course) => <button type="button" key={course.id} className={activeCourseId === course.id ? 'active' : ''} onClick={() => { setActiveCourseId(course.id); setPracticeSectionId(''); setPracticeQuestions([]); setPracticeResult(null); setEditingId(''); setOpenGuideId(''); }}>{course.short}</button>)}
    </nav>

    <section className="thicc-school-course-head">
      <div>
        <small>{activeCourse.portalStatus}</small>
        <h4>{activeCourse.title}</h4>
        <p>{activeCourse.sourceSummary}</p>
        <p>DEADLINE {displayDate(activeCourse.deadline)} · {courseComplete}/{sections.length} MODULES · {coursePercent}%</p>
      </div>
      {activeCourse.portalCourseId ? <a href={`https://www.issalearn.com/d2l/le/lessons/${activeCourse.portalCourseId}`} target="_blank" rel="noreferrer">OPEN ISSA COURSE</a> : null}
    </section>

    <div className="thicc-school-progress" aria-label={`${activeCourse.title} completion ${coursePercent}%`}><span style={{ width: `${coursePercent}%` }} /></div>

    <section className="thicc-school-map" aria-label={`${activeCourse.title} mastery map`}>
      {sections.map((item) => {
        const complete = item.status === 'complete';
        const guideOpen = openGuideId === item.id;
        const gates = getSectionMasteryGates(item);
        const isFinalSection = item.id === `${activeCourse.id}-final`;
        const sourcePlan = item.sourcePlan;
        const gateCount = 2 + Number(gates.textbookRequired) + Number(gates.workbookRequired);
        return <article key={item.id} className={`thicc-school-section ${complete ? 'complete' : ''} ${item.rolloverCount ? 'rolled' : ''}`}>
          <div className="thicc-school-section-main">
            <div className={`thicc-school-mastery-state ${complete ? 'complete' : ''}`}><strong>{complete ? 'MASTERED' : `${Number(item.practiceBestScore || 0)}% BEST`}</strong><small>{complete ? 'CUMULATIVE CREDITED' : `${gateCount} GATES REQUIRED`}</small></div>
            <div>
              <small>{displayDate(item.assignedDate)} · {minutesLabel(item.minutes)}{item.rolloverCount ? ` · MOVED ${item.rolloverCount}X` : ''}</small>
              <strong>{item.title}</strong>
              <span>{sourcePlan ? `${sourcePlan.sourceTitle} · ${sourcePlan.sourceEdition}` : item.source}</span>
              <div className="thicc-school-gates" aria-label={`${item.title} mastery gates`}>
                {gates.textbookRequired ? <span className={gates.textbook ? 'done' : ''}>{gates.textbook ? '✓' : '○'} TEXTBOOK</span> : null}
                {gates.workbookRequired ? <span className={gates.workbook ? 'done' : ''}>{gates.workbook ? '✓' : '○'} WORKBOOK</span> : null}
                <span className={gates.issa ? 'done' : ''}>{gates.issa ? '✓' : '○'} ISSA COMPLETE</span>
                <span className={gates.practice ? 'done' : ''}>{gates.practice ? '✓' : '○'} 95%+ PRACTICE</span>
              </div>
            </div>
            <div className="thicc-school-section-actions">
              <button
                type="button"
                aria-expanded={guideOpen}
                aria-controls={`thicc-school-guide-${item.id}`}
                onClick={() => toggleGuide(item)}
              >{guideOpen ? 'CLOSE' : isFinalSection ? 'FINAL REQUIREMENTS' : 'OPEN ASSIGNMENT'}</button>
              <button type="button" onClick={() => openEditor(item)}>EDIT</button>
            </div>
          </div>
          {guideOpen ? <div id={`thicc-school-guide-${item.id}`} className="thicc-school-guide" role="region" aria-label={`${item.title} study guide`}>
            {sourcePlan ? <>
              <strong>VERIFIED SOURCE ASSIGNMENT</strong>
              <p className="thicc-school-source-line">{sourcePlan.sourceTitle} · {sourcePlan.sourceEdition}</p>
              <div className="thicc-school-chapters">
                {sourcePlan.chapters.map((chapter) => <section key={chapter.number} className="thicc-school-chapter">
                  <header><strong>CHAPTER {chapter.number} · {chapter.title}</strong><span>TEXTBOOK PAGES {chapter.pages}{chapter.workbookPages ? ` · WORKBOOK PAGES ${chapter.workbookPages}` : ''}</span></header>
                  <ul>{chapter.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
                </section>)}
              </div>
            </> : <><strong>FINAL REQUIREMENTS</strong><p>{item.guide}</p></>}
            {sourcePlan ? <div className="thicc-school-sequence" aria-label="Required module learning sequence">
              <section className={`thicc-school-sequence-step ${gates.textbook ? 'done' : ''}`}>
                <header><b>1</b><div><strong>READ THE REQUIRED TEXTBOOK PAGES</strong><small>READ FIRST · USE THE PAGE RANGES ABOVE</small></div></header>
                <label className="thicc-school-issa-check"><input type="checkbox" checked={studyDraft.textbookCompleted} onChange={(event) => setStudyDraft((current) => ({ ...current, textbookCompleted: event.target.checked }))} />I COMPLETED EVERY ASSIGNED TEXTBOOK PAGE ABOVE</label>
                <button type="button" onClick={() => saveStudyWork(item, { textbookCompleted: studyDraft.textbookCompleted })}>SAVE READING PROGRESS</button>
              </section>
              <section className={`thicc-school-sequence-step ${gates.issa ? 'done' : ''} ${!gates.issaReady ? 'locked' : ''}`}>
                <header><b>2</b><div><strong>COMPLETE THE MATCHING ISSA LESSON</strong><small>{gates.issaReady ? 'READING SAVED · ISSA STAGE UNLOCKED' : 'LOCKED UNTIL REQUIRED READING IS SAVED'}</small></div></header>
                <label className="thicc-school-issa-check"><input type="checkbox" disabled={!gates.issaReady} checked={studyDraft.issaCompleted} onChange={(event) => setStudyDraft((current) => ({ ...current, issaCompleted: event.target.checked }))} />ISSA PORTAL SHOWS THIS MODULE COMPLETED</label>
                <button type="button" disabled={!gates.issaReady} onClick={() => saveStudyWork(item, { issaCompleted: studyDraft.issaCompleted })}>SAVE ISSA COMPLETION</button>
              </section>
              <section className={`thicc-school-sequence-step ${gates.workbookReady && gates.workbook ? 'done' : ''} ${!gates.workbookReady ? 'locked' : ''}`}>
                <header><b>3</b><div><strong>COMPLETE THE STUDY GUIDE + WORKBOOK</strong><small>{gates.workbookReady ? 'ISSA SAVED · WORKBOOK STAGE UNLOCKED' : 'LOCKED UNTIL READING AND ISSA ARE SAVED'}</small></div></header>
                {!gates.workbookReady ? <p className="thicc-school-lock-note">FINISH STAGES 1 AND 2 TO OPEN THIS SOURCE WORK.</p> : gates.workbookRequired ? (activeCourse.id === 'nutrition'
                  ? <NutritionWorkbookAssignment item={item} onPersist={(updates) => saveWorkbookWork(item, updates)} />
                  : <CptWorkbookAssignment item={item} onPersist={(updates) => saveWorkbookWork(item, updates)} />) : <p className="thicc-school-lock-note done">NO SEPARATE WORKBOOK PAGES ARE ASSIGNED TO THIS MODULE.</p>}
              </section>
            </div> : <div className="thicc-school-study-work">
              <label className="thicc-school-issa-check"><input type="checkbox" checked={studyDraft.issaCompleted} onChange={(event) => setStudyDraft((current) => ({ ...current, issaCompleted: event.target.checked }))} />ISSA PORTAL SHOWS THIS EXAM COMPLETED</label>
              <button type="button" onClick={() => saveStudyWork(item, { issaCompleted: studyDraft.issaCompleted })}>SAVE EXAM COMPLETION</button>
            </div>}
            {isFinalSection ? <p className="thicc-school-final-direction">PASS THE CUMULATIVE FINAL PRACTICE BELOW, THEN CONFIRM THE ISSA EXAM SHOWS COMPLETED.</p> : <div className="thicc-school-module-practice">
              <header><div><strong>4 · MODULE PRACTICE</strong><small>{gates.practiceReady ? `SOURCE WORK COMPLETE · ${THICC_SCHOOL_MASTERY_SCORE}% REQUIRED` : 'LOCKED UNTIL READING, ISSA, AND WORKBOOK ARE COMPLETE'}</small></div><button type="button" disabled={!gates.practiceReady} onClick={() => startSectionPractice(item)}>{practiceSectionId === item.id && practiceQuestions.length ? 'NEW MODULE FORM' : 'START MODULE PRACTICE'}</button></header>
              {practiceSectionId === item.id ? <>
                {practiceQuestions.map((question, index) => <fieldset key={question.id} className={practiceResult?.results?.find((result) => result.id === question.id)?.correct === false ? 'missed' : ''}>
                  <legend>{index + 1}. {question.prompt}</legend>
                  {question.options.map((option, optionIndex) => <label key={option}><input type="radio" name={question.id} value={optionIndex} checked={Number(practiceAnswers[question.id]) === optionIndex} onChange={() => setPracticeAnswers((current) => ({ ...current, [question.id]: optionIndex }))} />{option}</label>)}
                  {practiceResult ? <p>{practiceResult.results.find((result) => result.id === question.id)?.correct ? 'CORRECT.' : `REVIEW: ${question.rationale}`}</p> : null}
                </fieldset>)}
                {practiceQuestions.length ? <button type="button" className="thicc-school-grade" onClick={gradePractice}>SCORE MODULE PRACTICE</button> : null}
                {practiceResult ? <div className={`thicc-school-result ${practiceResult.passed ? 'pass' : 'retry'}`}><strong>{practiceResult.score}%</strong><p>{practiceResult.passed ? 'MODULE PRACTICE GATE PASSED.' : `RETAKE REQUIRED. REVIEW: ${practiceResult.weakTopics.join(' · ')}`}</p></div> : null}
              </> : null}
            </div>}
            {item.passedPracticeReview?.rows?.length ? <section className="thicc-school-open-book-source">
              <header><strong>OPEN-BOOK PRACTICE SOURCE</strong><small>PASSED {displayDate(String(item.passedPracticeReview.takenAt).slice(0, 10))} · SAVED FOR EXAM REVIEW</small></header>
              {item.passedPracticeReview.rows.map((row, index) => <details key={`${row.id}-${index}`}>
                <summary>{index + 1}. {row.prompt}</summary>
                <p><b>CORRECT ANSWER:</b> {row.correctAnswer}</p>
                <p><b>WHY:</b> {row.rationale}</p>
                <p><b>SOURCE TOPIC:</b> {row.topic}</p>
              </details>)}
            </section> : null}
          </div> : null}
          {editingId === item.id ? <div className="thicc-school-editor">
            <label>ASSIGNED DATE<input type="date" value={editDraft.assignedDate} onChange={(event) => setEditDraft((current) => ({ ...current, assignedDate: event.target.value }))} /></label>
            <label>MINUTES<input type="number" min="15" step="15" value={editDraft.minutes} onChange={(event) => setEditDraft((current) => ({ ...current, minutes: event.target.value }))} /></label>
            <div><button type="button" onClick={saveEditor}>SAVE SECTION</button><button type="button" onClick={() => setEditingId('')}>CANCEL</button></div>
          </div> : null}
        </article>;
      })}
    </section>

    <section className="thicc-school-practice">
      <header>
        <div><small>AFTER EVERY MODULE · ORIGINAL QUESTIONS · NO COPIED ISSA EXAM ITEMS</small><h4>CUMULATIVE FINAL PRACTICE</h4><p>BEST {bestAttempt}%{latestAttempt ? ` · LATEST ${latestAttempt.score}%` : ' · NO ATTEMPTS YET'}</p></div>
        <button type="button" onClick={startPractice}>{practiceSectionId === 'cumulative' && practiceQuestions.length ? 'NEW CUMULATIVE FORM' : 'START CUMULATIVE PRACTICE'}</button>
      </header>
      {practiceSectionId === 'cumulative' ? practiceQuestions.map((question, index) => <fieldset key={question.id} className={practiceResult?.results?.find((result) => result.id === question.id)?.correct === false ? 'missed' : ''}>
        <legend>{index + 1}. {question.prompt}</legend>
        {question.options.map((option, optionIndex) => <label key={option}><input type="radio" name={question.id} value={optionIndex} checked={Number(practiceAnswers[question.id]) === optionIndex} onChange={() => setPracticeAnswers((current) => ({ ...current, [question.id]: optionIndex }))} />{option}</label>)}
        {practiceResult ? <p>{practiceResult.results.find((result) => result.id === question.id)?.correct ? 'CORRECT.' : `REVIEW: ${question.rationale}`}</p> : null}
      </fieldset>) : null}
      {practiceSectionId === 'cumulative' && practiceQuestions.length ? <button type="button" className="thicc-school-grade" onClick={gradePractice}>SCORE CUMULATIVE PRACTICE</button> : null}
      {practiceSectionId === 'cumulative' && practiceResult ? <div className={`thicc-school-result ${practiceResult.passed ? 'pass' : 'retry'}`}><strong>{practiceResult.score}%</strong><p>{practiceResult.passed ? 'CUMULATIVE MASTERY GATE PASSED.' : `RETAKE REQUIRED. REVIEW: ${practiceResult.weakTopics.join(' · ')}`}</p></div> : null}
    </section>
  </div>;
}
