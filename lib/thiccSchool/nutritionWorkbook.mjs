const fieldId = (chapterNumber, kind, index = 0) => `nutrition-ch${chapterNumber}-${kind}${index ? `-${index}` : ''}`;

export function getNutritionWorkbookAssignment(sourcePlan) {
  const chapters = (sourcePlan?.chapters || []).map((chapter) => {
    const fields = [
      ...(chapter.objectives || []).map((objective, index) => ({
        id: fieldId(chapter.number, 'objective', index + 1),
        chapterNumber: chapter.number,
        pages: chapter.pages,
        label: objective,
        prompt: `Explain ${objective.toLowerCase()} in your own words. Give one nutrition-coaching application and record the exact textbook page or page range you would reopen during an exam.`,
      })),
      {
        id: fieldId(chapter.number, 'reference'),
        chapterNumber: chapter.number,
        pages: chapter.pages,
        label: `Chapter ${chapter.number} open-book reference`,
        prompt: `Build a quick-reference for Chapter ${chapter.number}: list the essential definitions, decision rules, coaching scope or referral boundary when applicable, and the exact textbook pages to consult.`,
      },
    ];
    return { ...chapter, fields };
  });
  const fields = chapters.flatMap((chapter) => chapter.fields);
  return { chapters, fields, fieldIds: fields.map((field) => field.id) };
}

export function getNutritionWorkbookField(sourcePlan, requestedFieldId) {
  const assignment = getNutritionWorkbookAssignment(sourcePlan);
  const field = assignment.fields.find((candidate) => candidate.id === requestedFieldId);
  if (!field) return null;
  const chapter = assignment.chapters.find((candidate) => candidate.number === field.chapterNumber);
  return { assignment, chapter, field };
}

export function getNutritionWorkbookCompletion(sourcePlan, answers = {}, assessments = {}) {
  const assignment = getNutritionWorkbookAssignment(sourcePlan);
  const completed = assignment.fieldIds.filter((id) => String(answers?.[id] || '').trim() && assessments?.[id]?.accepted === true);
  return {
    ...assignment,
    acceptedCount: completed.length,
    totalCount: assignment.fieldIds.length,
    complete: assignment.fieldIds.length > 0 && completed.length === assignment.fieldIds.length,
  };
}
