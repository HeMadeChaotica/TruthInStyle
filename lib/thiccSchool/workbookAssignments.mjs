import { CPT_WORKBOOK_PAGES } from './cptWorkbookLayout.mjs';
import { getNutritionWorkbookCompletion } from './nutritionWorkbook.mjs';

export function expandPageRange(value = '') {
  const match = String(value).trim().match(/^(\d+)(?:-(\d+))?$/);
  if (!match) return [];
  const start = Number(match[1]);
  const end = Number(match[2] || match[1]);
  if (!Number.isInteger(start) || !Number.isInteger(end) || end < start) return [];
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function getCptWorkbookAssignment(sourcePlan) {
  const pageNumbers = [...new Set((sourcePlan?.chapters || [])
    .flatMap((chapter) => expandPageRange(chapter.workbookPages)))]
    .filter((pageNumber) => CPT_WORKBOOK_PAGES[String(pageNumber)]);
  const pages = pageNumbers.map((pageNumber) => CPT_WORKBOOK_PAGES[String(pageNumber)]);
  const fields = pages.flatMap((page) => page.fields || []);
  return { pageNumbers, pages, fields, fieldIds: fields.map((field) => field.id) };
}

export function getCptWorkbookCompletion(sourcePlan, answers = {}, assessments = {}) {
  const assignment = getCptWorkbookAssignment(sourcePlan);
  const completed = assignment.fieldIds.filter((fieldId) => {
    const answer = String(answers?.[fieldId] || '').trim();
    return answer && assessments?.[fieldId]?.accepted === true;
  });
  return {
    ...assignment,
    acceptedCount: completed.length,
    totalCount: assignment.fieldIds.length,
    complete: assignment.fieldIds.length > 0 && completed.length === assignment.fieldIds.length,
  };
}

export function getSourceWorkbookCompletion(sourcePlan, answers = {}, assessments = {}) {
  if (sourcePlan?.workbookType === 'generated') return getNutritionWorkbookCompletion(sourcePlan, answers, assessments);
  return getCptWorkbookCompletion(sourcePlan, answers, assessments);
}
