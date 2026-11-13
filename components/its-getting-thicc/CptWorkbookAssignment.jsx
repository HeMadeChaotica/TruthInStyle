'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getCptWorkbookCompletion } from '../../lib/thiccSchool/workbookAssignments.mjs';

export default function CptWorkbookAssignment({ item, onPersist }) {
  const assignment = useMemo(() => getCptWorkbookCompletion(
    item.sourcePlan,
    item.workbookAnswers || {},
    item.workbookAssessments || {},
  ), [item]);
  const [pageNumber, setPageNumber] = useState(assignment.pageNumbers[0] || 0);
  const [answers, setAnswers] = useState(item.workbookAnswers || {});
  const [assessments, setAssessments] = useState(item.workbookAssessments || {});
  const [activeFieldId, setActiveFieldId] = useState('');
  const [assessingFieldId, setAssessingFieldId] = useState('');
  const [message, setMessage] = useState('');
  const answersRef = useRef(answers);
  const assessmentsRef = useRef(assessments);

  useEffect(() => {
    const nextAnswers = item.workbookAnswers || {};
    const nextAssessments = item.workbookAssessments || {};
    setAnswers(nextAnswers);
    setAssessments(nextAssessments);
    answersRef.current = nextAnswers;
    assessmentsRef.current = nextAssessments;
    setPageNumber((current) => assignment.pageNumbers.includes(current) ? current : assignment.pageNumbers[0] || 0);
  }, [item.id, item.workbookAnswers, item.workbookAssessments, assignment.pageNumbers]);

  const progress = useMemo(
    () => getCptWorkbookCompletion(item.sourcePlan, answers, assessments),
    [item.sourcePlan, answers, assessments],
  );
  const page = progress.pages.find((candidate) => candidate.number === pageNumber) || progress.pages[0];
  const pageIndex = progress.pageNumbers.indexOf(page?.number);
  const activeAssessment = activeFieldId ? assessments[activeFieldId] : null;

  const changeAnswer = (fieldId, value) => {
    const nextAnswers = { ...answersRef.current, [fieldId]: value };
    const nextAssessments = { ...assessmentsRef.current };
    delete nextAssessments[fieldId];
    answersRef.current = nextAnswers;
    assessmentsRef.current = nextAssessments;
    setAnswers(nextAnswers);
    setAssessments(nextAssessments);
    setActiveFieldId(fieldId);
    setMessage('ANSWER CHANGED · FEEDBACK WILL RUN WHEN YOU LEAVE THIS RESPONSE.');
  };

  const assessAnswer = async (field) => {
    const answer = String(answersRef.current[field.id] || '').trim();
    if (assessmentsRef.current[field.id]) return;
    const cleanAssessments = { ...assessmentsRef.current };
    delete cleanAssessments[field.id];
    assessmentsRef.current = cleanAssessments;
    setAssessments(cleanAssessments);
    await onPersist({ workbookAnswers: answersRef.current, workbookAssessments: cleanAssessments });
    if (!answer) {
      setMessage('BLANK RESPONSE SAVED. COMPLETE IT WHEN YOU RETURN.');
      return;
    }

    setAssessingFieldId(field.id);
    setActiveFieldId(field.id);
    setMessage('CHECKING THIS ANSWER AGAINST YOUR ATTACHED CPT11 MATERIAL…');
    try {
      const response = await fetch('/api/thicc-school/workbook/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: 'cpt', sectionId: item.id, pageNumber: page.number, fieldId: field.id, answer }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'ANSWER CHECK FAILED');
      const nextAssessments = { ...assessmentsRef.current, [field.id]: result };
      assessmentsRef.current = nextAssessments;
      setAssessments(nextAssessments);
      await onPersist({ workbookAnswers: answersRef.current, workbookAssessments: nextAssessments });
      setMessage(result.accepted ? 'ANSWER ACCEPTED AND ADDED TO MODULE PROGRESS.' : 'ANSWER SAVED · USE THE FEEDBACK BELOW AND TRY AGAIN.');
    } catch (error) {
      setMessage(error?.message || 'ANSWER SAVED, BUT FEEDBACK IS TEMPORARILY UNAVAILABLE.');
    } finally {
      setAssessingFieldId('');
    }
  };

  if (!page) return null;

  return <section className="thicc-school-workbook" aria-label="Interactive CPT11 workbook assignment">
    <header className="thicc-school-workbook-head">
      <div>
        <strong>YOUR CPT11 WORKBOOK ASSIGNMENT</strong>
        <small>{progress.acceptedCount} OF {progress.totalCount} RESPONSES ACCEPTED · SAVES CUMULATIVELY</small>
      </div>
      <div className="thicc-school-workbook-progress" aria-label={`${progress.acceptedCount} of ${progress.totalCount} workbook responses accepted`}>
        <span style={{ width: `${progress.totalCount ? (progress.acceptedCount / progress.totalCount) * 100 : 0}%` }} />
      </div>
    </header>

    <div className="thicc-school-workbook-nav">
      <button type="button" disabled={pageIndex <= 0} onClick={() => setPageNumber(progress.pageNumbers[pageIndex - 1])}>PREVIOUS PAGE</button>
      <label>WORKBOOK PAGE
        <select value={page.number} onChange={(event) => setPageNumber(Number(event.target.value))}>
          {progress.pageNumbers.map((number) => <option key={number} value={number}>{number}</option>)}
        </select>
      </label>
      <button type="button" disabled={pageIndex >= progress.pageNumbers.length - 1} onClick={() => setPageNumber(progress.pageNumbers[pageIndex + 1])}>NEXT PAGE</button>
    </div>

    <p className="thicc-school-workbook-message" role="status">{message || 'TYPE DIRECTLY ON THE WORKBOOK PAGE. EACH RESPONSE IS CHECKED WHEN YOU LEAVE ITS BOX.'}</p>

    <div className="thicc-school-workbook-page" style={{ aspectRatio: `${page.width} / ${page.height}` }}>
      <img src={`/api/thicc-school/workbook/page/${page.number}`} alt={`ISSA CPT11 workbook page ${page.number}`} />
      {(page.fields || []).map((field) => {
        const assessment = assessments[field.id];
        return <textarea
          key={field.id}
          className={assessment?.accepted ? 'accepted' : assessment ? 'needs-revision' : ''}
          aria-label={`${field.label} on workbook page ${page.number}`}
          title={field.label}
          value={answers[field.id] || ''}
          maxLength={1500}
          disabled={assessingFieldId === field.id}
          onFocus={() => setActiveFieldId(field.id)}
          onChange={(event) => changeAnswer(field.id, event.target.value)}
          onBlur={() => assessAnswer(field)}
          style={{ left: `${field.x}%`, top: `${field.y}%`, width: `${field.width}%`, height: `${field.height}%` }}
        />;
      })}
    </div>

    {page.fields?.length ? <p className="thicc-school-workbook-page-count">PAGE {page.number} · {page.fields.length} RESPONSE {page.fields.length === 1 ? 'BOX' : 'BOXES'}</p> : <p className="thicc-school-workbook-page-count">PAGE {page.number} · CHAPTER INTRODUCTION</p>}

    {activeFieldId ? <aside className={`thicc-school-workbook-feedback ${activeAssessment?.accepted ? 'accepted' : activeAssessment ? 'needs-revision' : ''}`}>
      <strong>{assessingFieldId === activeFieldId ? 'CHECKING…' : activeAssessment?.accepted ? `ACCEPTED · ${activeAssessment.score}%` : activeAssessment ? `REVISE · ${activeAssessment.score}%` : 'RESPONSE NOT CHECKED YET'}</strong>
      {activeAssessment?.feedback ? <p>{activeAssessment.feedback}</p> : null}
      {activeAssessment?.missingConcepts?.length ? <p><b>ADD OR REPAIR:</b> {activeAssessment.missingConcepts.join(' · ')}</p> : null}
    </aside> : null}
  </section>;
}
