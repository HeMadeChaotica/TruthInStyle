'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getNutritionWorkbookCompletion } from '../../lib/thiccSchool/nutritionWorkbook.mjs';

export default function NutritionWorkbookAssignment({ item, onPersist }) {
  const assignment = useMemo(() => getNutritionWorkbookCompletion(
    item.sourcePlan,
    item.workbookAnswers || {},
    item.workbookAssessments || {},
  ), [item]);
  const [chapterNumber, setChapterNumber] = useState(assignment.chapters[0]?.number || 0);
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
    setChapterNumber((current) => assignment.chapters.some((chapter) => chapter.number === current) ? current : assignment.chapters[0]?.number || 0);
  }, [item.id, item.workbookAnswers, item.workbookAssessments, assignment.chapters]);

  const progress = useMemo(
    () => getNutritionWorkbookCompletion(item.sourcePlan, answers, assessments),
    [item.sourcePlan, answers, assessments],
  );
  const chapter = progress.chapters.find((candidate) => candidate.number === chapterNumber) || progress.chapters[0];
  const activeAssessment = activeFieldId ? assessments[activeFieldId] : null;

  const changeAnswer = (id, value) => {
    const nextAnswers = { ...answersRef.current, [id]: value };
    const nextAssessments = { ...assessmentsRef.current };
    delete nextAssessments[id];
    answersRef.current = nextAnswers;
    assessmentsRef.current = nextAssessments;
    setAnswers(nextAnswers);
    setAssessments(nextAssessments);
    setActiveFieldId(id);
    setMessage('ANSWER CHANGED · FEEDBACK WILL RUN WHEN YOU LEAVE THIS RESPONSE.');
  };

  const assessAnswer = async (field) => {
    const answer = String(answersRef.current[field.id] || '').trim();
    if (assessmentsRef.current[field.id]) return;
    await onPersist({ workbookAnswers: answersRef.current, workbookAssessments: assessmentsRef.current });
    if (!answer) {
      setMessage('BLANK RESPONSE SAVED. COMPLETE IT WHEN YOU RETURN.');
      return;
    }
    setAssessingFieldId(field.id);
    setActiveFieldId(field.id);
    setMessage('CHECKING THIS ANSWER AGAINST YOUR ATTACHED NUTRITION TEXTBOOK…');
    try {
      const response = await fetch('/api/thicc-school/workbook/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: 'nutrition', sectionId: item.id, pageNumber: chapter.number, fieldId: field.id, answer }),
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

  if (!chapter) return null;

  return <section className="thicc-school-workbook thicc-school-nutrition-workbook" aria-label="Interactive Nutrition Coach workbook assignment">
    <header className="thicc-school-workbook-head">
      <div>
        <strong>YOUR NUTRITION COACH WORKBOOK</strong>
        <small>{progress.acceptedCount} OF {progress.totalCount} RESPONSES ACCEPTED · BUILT FROM YOUR ATTACHED TEXTBOOK</small>
      </div>
      <div className="thicc-school-workbook-progress" aria-label={`${progress.acceptedCount} of ${progress.totalCount} workbook responses accepted`}>
        <span style={{ width: `${progress.totalCount ? (progress.acceptedCount / progress.totalCount) * 100 : 0}%` }} />
      </div>
    </header>

    <label className="thicc-school-nutrition-chapter">WORKBOOK CHAPTER
      <select value={chapter.number} onChange={(event) => setChapterNumber(Number(event.target.value))}>
        {progress.chapters.map((candidate) => <option key={candidate.number} value={candidate.number}>CHAPTER {candidate.number} · {candidate.title}</option>)}
      </select>
    </label>
    <p className="thicc-school-workbook-message" role="status">{message || `READ TEXTBOOK PAGES ${chapter.pages}, THEN COMPLETE EACH SOURCE-BASED RESPONSE.`}</p>

    <div className="thicc-school-nutrition-prompts">
      {chapter.fields.map((field) => {
        const assessment = assessments[field.id];
        return <label key={field.id} className={assessment?.accepted ? 'accepted' : assessment ? 'needs-revision' : ''}>
          <strong>{field.label}</strong>
          <span>{field.prompt}</span>
          <textarea
            value={answers[field.id] || ''}
            maxLength={1500}
            disabled={assessingFieldId === field.id}
            onFocus={() => setActiveFieldId(field.id)}
            onChange={(event) => changeAnswer(field.id, event.target.value)}
            onBlur={() => assessAnswer(field)}
          />
          {assessment ? <small>{assessment.accepted ? `ACCEPTED · ${assessment.score}%` : `REVISE · ${assessment.score}%`} · {assessment.feedback}</small> : null}
        </label>;
      })}
    </div>

    {activeFieldId ? <aside className={`thicc-school-workbook-feedback ${activeAssessment?.accepted ? 'accepted' : activeAssessment ? 'needs-revision' : ''}`}>
      <strong>{assessingFieldId === activeFieldId ? 'CHECKING…' : activeAssessment?.accepted ? `ACCEPTED · ${activeAssessment.score}%` : activeAssessment ? `REVISE · ${activeAssessment.score}%` : 'RESPONSE NOT CHECKED YET'}</strong>
      {activeAssessment?.missingConcepts?.length ? <p><b>ADD OR REPAIR:</b> {activeAssessment.missingConcepts.join(' · ')}</p> : null}
    </aside> : null}
  </section>;
}
