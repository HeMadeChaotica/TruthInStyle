'use client';

import { useEffect, useMemo, useState } from 'react';
import { createDefaultSchoolState, getCourseQuestions } from '../../lib/thiccSchool/schoolEngine.mjs';
import { THICC_SCHOOL_MASTERY_SCORE } from '../../lib/thiccSchool/catalog.mjs';
import {
  editThiccSchoolSection,
  getThiccSchoolSummary,
  initializeThiccSchool,
  markThiccSchoolSection,
  readThiccSchoolState,
  submitThiccSchoolPractice,
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

  const persistSection = async (section, complete) => {
    const next = markThiccSchoolSection(activeCourse.id, section.id, complete);
    setSchool(next);
    setStatus(complete ? `${section.title} RECORDED COMPLETE.` : `${section.title} REOPENED.`);
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
    setPracticeQuestions(questions);
    setPracticeAnswers({});
    setPracticeResult(null);
    setStatus(questions.length ? `PRACTICE FORM ${attemptIndex + 1} READY.` : 'PRACTICE QUESTIONS ARE PENDING VERIFIED COURSE ACCESS.');
  };

  const gradePractice = async () => {
    if (practiceQuestions.some((question) => practiceAnswers[question.id] == null)) {
      setStatus('ANSWER EVERY QUESTION BEFORE SCORING.');
      return;
    }
    const recorded = submitThiccSchoolPractice(activeCourse.id, practiceQuestions, practiceAnswers);
    setSchool(recorded.state);
    setPracticeResult(recorded.result);
    setStatus(recorded.result.passed ? `MASTERY ACHIEVED: ${recorded.result.score}%.` : `${recorded.result.score}% — REVIEW WEAK TOPICS AND RETAKE UNTIL ${THICC_SCHOOL_MASTERY_SCORE}%+.`);
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
      {courses.map((course) => <button type="button" key={course.id} className={activeCourseId === course.id ? 'active' : ''} onClick={() => { setActiveCourseId(course.id); setPracticeQuestions([]); setPracticeResult(null); setEditingId(''); setOpenGuideId(''); }}>{course.short}</button>)}
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
        return <article key={item.id} className={`thicc-school-section ${complete ? 'complete' : ''} ${item.rolloverCount ? 'rolled' : ''}`}>
          <div className="thicc-school-section-main">
            <button type="button" className="thicc-school-complete" onClick={() => persistSection(item, !complete)} aria-pressed={complete}>{complete ? 'COMPLETE' : 'MARK COMPLETE'}</button>
            <div>
              <small>{displayDate(item.assignedDate)} · {minutesLabel(item.minutes)}{item.rolloverCount ? ` · MOVED ${item.rolloverCount}X` : ''}</small>
              <strong>{item.title}</strong>
              <span>{item.source}</span>
            </div>
            <div className="thicc-school-section-actions">
              <button
                type="button"
                aria-expanded={guideOpen}
                aria-controls={`thicc-school-guide-${item.id}`}
                onClick={() => setOpenGuideId((current) => current === item.id ? '' : item.id)}
              >{guideOpen ? 'CLOSE GUIDE' : 'STUDY GUIDE'}</button>
              <button type="button" onClick={() => openEditor(item)}>EDIT</button>
            </div>
          </div>
          {guideOpen ? <div id={`thicc-school-guide-${item.id}`} className="thicc-school-guide" role="region" aria-label={`${item.title} study guide`}><strong>STUDY GUIDE</strong><p>{item.guide}</p><strong>FOCUS TERMS</strong><p>{(item.focus || []).join(' · ') || 'ADD FOCUS TERMS WHEN THE COURSE UNLOCKS.'}</p></div> : null}
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
        <div><small>ORIGINAL QUESTIONS · NO COPIED ISSA EXAM ITEMS</small><h4>95% MASTERY LAB</h4><p>BEST {bestAttempt}%{latestAttempt ? ` · LATEST ${latestAttempt.score}%` : ' · NO ATTEMPTS YET'}</p></div>
        <button type="button" onClick={startPractice}>{practiceQuestions.length ? 'NEW PRACTICE FORM' : 'START PRACTICE'}</button>
      </header>
      {practiceQuestions.map((question, index) => <fieldset key={question.id} className={practiceResult?.results?.find((result) => result.id === question.id)?.correct === false ? 'missed' : ''}>
        <legend>{index + 1}. {question.prompt}</legend>
        {question.options.map((option, optionIndex) => <label key={option}><input type="radio" name={question.id} value={optionIndex} checked={Number(practiceAnswers[question.id]) === optionIndex} onChange={() => setPracticeAnswers((current) => ({ ...current, [question.id]: optionIndex }))} />{option}</label>)}
        {practiceResult ? <p>{practiceResult.results.find((result) => result.id === question.id)?.correct ? 'CORRECT.' : `REVIEW: ${question.rationale}`}</p> : null}
      </fieldset>)}
      {practiceQuestions.length ? <button type="button" className="thicc-school-grade" onClick={gradePractice}>SCORE PRACTICE</button> : null}
      {practiceResult ? <div className={`thicc-school-result ${practiceResult.passed ? 'pass' : 'retry'}`}><strong>{practiceResult.score}%</strong><p>{practiceResult.passed ? 'MASTERY GATE PASSED.' : `RETAKE REQUIRED. REVIEW: ${practiceResult.weakTopics.join(' · ')}`}</p></div> : null}
    </section>
  </div>;
}
