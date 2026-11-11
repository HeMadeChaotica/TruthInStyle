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
  markThiccSchoolSection,
  readThiccSchoolState,
  saveThiccSchoolStudyProgress,
  submitThiccSchoolPractice,
  submitThiccSchoolSectionPractice,
  THICC_SCHOOL_UPDATED_EVENT,
} from '../../src/services/thiccSchoolService';
import { flushAllPendingSaves } from '../../lib/state/autosaveRegistry';

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
  const [editDraft, setEditDraft] = useState({ title: '', assignedDate: '', minutes: 0, guide: '' });
  const [studyDraft, setStudyDraft] = useState({ studyNotes: '', recallNotes: '', issaCompleted: false });
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

  const courses = useMemo(() => Object.values(school.courses || {}), [school]);
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
      studyNotes: item.studyNotes || '',
      recallNotes: item.recallNotes || '',
      issaCompleted: Boolean(item.issaCompleted),
    });
  };

  const persistSection = async (section, complete) => {
    const next = markThiccSchoolSection(activeCourse.id, section.id, complete);
    setSchool(next);
    setStatus(complete ? `${section.title} RECORDED COMPLETE.` : `${section.title} REOPENED.`);
    await flushAllPendingSaves();
  };

  const saveStudyWork = async (item, updates = studyDraft) => {
    const next = saveThiccSchoolStudyProgress(activeCourse.id, item.id, updates);
    const saved = next.courses?.[activeCourse.id]?.sections?.[item.id];
    setSchool(next);
    setStudyDraft({
      studyNotes: saved?.studyNotes || '',
      recallNotes: saved?.recallNotes || '',
      issaCompleted: Boolean(saved?.issaCompleted),
    });
    setStatus(saved?.status === 'complete'
      ? `${item.title} MASTERED AND ADDED TO CUMULATIVE PROGRESS.`
      : `${item.title} STUDY WORK SAVED. FINISH EVERY MASTERY GATE.`);
    await flushAllPendingSaves();
  };

  const openEditor = (item) => {
    setEditingId(item.id);
    setEditDraft({ title: item.title, assignedDate: item.assignedDate, minutes: item.minutes, guide: item.guide });
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
        <p>DEADLINE {displayDate(activeCourse.deadline)} · {courseComplete}/{sections.length} SECTIONS · {coursePercent}%</p>
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
        const usesAutomatedMastery = activeCourse.id === 'cpt';
        return <article key={item.id} className={`thicc-school-section ${complete ? 'complete' : ''} ${item.rolloverCount ? 'rolled' : ''}`}>
          <div className="thicc-school-section-main">
            {usesAutomatedMastery ? <div className={`thicc-school-mastery-state ${complete ? 'complete' : ''}`}><strong>{complete ? 'MASTERED' : `${Number(item.practiceBestScore || 0)}% BEST`}</strong><small>{complete ? 'CUMULATIVE CREDITED' : '3 GATES REQUIRED'}</small></div> : <button type="button" className="thicc-school-complete" onClick={() => persistSection(item, !complete)} aria-pressed={complete}>{complete ? 'COMPLETE' : 'MARK COMPLETE'}</button>}
            <div>
              <small>{displayDate(item.assignedDate)} · {minutesLabel(item.minutes)}{item.rolloverCount ? ` · MOVED ${item.rolloverCount}X` : ''}</small>
              <strong>{item.title}</strong>
              <span>{item.source}</span>
              {usesAutomatedMastery ? <div className="thicc-school-gates" aria-label={`${item.title} mastery gates`}>
                <span className={gates.issa ? 'done' : ''}>{gates.issa ? '✓' : '○'} ISSA COMPLETE</span>
                <span className={gates.notes ? 'done' : ''}>{gates.notes ? '✓' : '○'} STUDY WORK</span>
                <span className={gates.practice ? 'done' : ''}>{gates.practice ? '✓' : '○'} 95%+ PRACTICE</span>
              </div> : null}
            </div>
            <div className="thicc-school-section-actions">
              <button
                type="button"
                aria-expanded={guideOpen}
                aria-controls={`thicc-school-guide-${item.id}`}
                onClick={() => toggleGuide(item)}
              >{guideOpen ? 'CLOSE GUIDE' : 'STUDY GUIDE'}</button>
              <button type="button" onClick={() => openEditor(item)}>EDIT</button>
            </div>
          </div>
          {guideOpen ? <div id={`thicc-school-guide-${item.id}`} className="thicc-school-guide" role="region" aria-label={`${item.title} study guide`}>
            <strong>STUDY GUIDE</strong>
            <p>{item.guide}</p>
            <strong>FOCUS TERMS</strong>
            <p>{(item.focus || []).join(' · ') || 'ADD FOCUS TERMS WHEN THE COURSE UNLOCKS.'}</p>
            {usesAutomatedMastery ? <><div className="thicc-school-study-work">
              <label className="thicc-school-issa-check"><input type="checkbox" checked={studyDraft.issaCompleted} onChange={(event) => setStudyDraft((current) => ({ ...current, issaCompleted: event.target.checked }))} />ISSA PORTAL SHOWS THIS {isFinalSection ? 'EXAM' : 'MODULE'} COMPLETED</label>
              <label>MY STUDY NOTES<textarea value={studyDraft.studyNotes} onChange={(event) => setStudyDraft((current) => ({ ...current, studyNotes: event.target.value }))} placeholder="CAPTURE THE CONCEPTS, EXAMPLES, AND COACHING APPLICATIONS YOU COMPLETED." /></label>
              <label>WHAT I MUST REMEMBER<textarea value={studyDraft.recallNotes} onChange={(event) => setStudyDraft((current) => ({ ...current, recallNotes: event.target.value }))} placeholder="WRITE THE KEY TERMS, RULES, AND EXAM TRAPS IN YOUR OWN WORDS." /></label>
              <button type="button" onClick={() => saveStudyWork(item)}>SAVE STUDY WORK</button>
            </div>
            {isFinalSection ? <p className="thicc-school-final-direction">PASS THE CUMULATIVE FINAL PRACTICE BELOW, THEN CONFIRM THE ISSA EXAM SHOWS COMPLETED.</p> : <div className="thicc-school-module-practice">
              <header><div><strong>MODULE PRACTICE</strong><small>15 ORIGINAL QUESTIONS · 95% GATE REQUIRES 15/15</small></div><button type="button" onClick={() => startSectionPractice(item)}>{practiceSectionId === item.id && practiceQuestions.length ? 'NEW MODULE FORM' : 'START MODULE PRACTICE'}</button></header>
              {practiceSectionId === item.id ? <>
                {practiceQuestions.map((question, index) => <fieldset key={question.id} className={practiceResult?.results?.find((result) => result.id === question.id)?.correct === false ? 'missed' : ''}>
                  <legend>{index + 1}. {question.prompt}</legend>
                  {question.options.map((option, optionIndex) => <label key={option}><input type="radio" name={question.id} value={optionIndex} checked={Number(practiceAnswers[question.id]) === optionIndex} onChange={() => setPracticeAnswers((current) => ({ ...current, [question.id]: optionIndex }))} />{option}</label>)}
                  {practiceResult ? <p>{practiceResult.results.find((result) => result.id === question.id)?.correct ? 'CORRECT.' : `REVIEW: ${question.rationale}`}</p> : null}
                </fieldset>)}
                {practiceQuestions.length ? <button type="button" className="thicc-school-grade" onClick={gradePractice}>SCORE MODULE PRACTICE</button> : null}
                {practiceResult ? <div className={`thicc-school-result ${practiceResult.passed ? 'pass' : 'retry'}`}><strong>{practiceResult.score}%</strong><p>{practiceResult.passed ? 'MODULE PRACTICE GATE PASSED.' : `RETAKE REQUIRED. REVIEW: ${practiceResult.weakTopics.join(' · ')}`}</p></div> : null}
              </> : null}
            </div>}</> : null}
          </div> : null}
          {editingId === item.id ? <div className="thicc-school-editor">
            <label>SECTION TITLE<input value={editDraft.title} onChange={(event) => setEditDraft((current) => ({ ...current, title: event.target.value }))} /></label>
            <label>ASSIGNED DATE<input type="date" value={editDraft.assignedDate} onChange={(event) => setEditDraft((current) => ({ ...current, assignedDate: event.target.value }))} /></label>
            <label>MINUTES<input type="number" min="15" step="15" value={editDraft.minutes} onChange={(event) => setEditDraft((current) => ({ ...current, minutes: event.target.value }))} /></label>
            <label>STUDY GUIDE<textarea value={editDraft.guide} onChange={(event) => setEditDraft((current) => ({ ...current, guide: event.target.value }))} /></label>
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
