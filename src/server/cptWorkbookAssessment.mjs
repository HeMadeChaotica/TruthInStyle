import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CPT_WORKBOOK_CONTEXT } from './cptWorkbookContext.mjs';
import { getVerifiedModuleSource } from '../../lib/thiccSchool/sourceCurriculum.mjs';
import { expandPageRange } from '../../lib/thiccSchool/workbookAssignments.mjs';
import { getNutritionWorkbookField } from '../../lib/thiccSchool/nutritionWorkbook.mjs';

const MODEL = process.env.OPENAI_WORKBOOK_MODEL || 'gpt-5-mini';
const ACCEPTED_SCORE = 80;

const tokenize = (value) => [...new Set(String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, ' ')
  .split(/\s+/)
  .filter((token) => token.length > 3))];

export function parseWorkbookAssessment(payload) {
  const accepted = payload?.accepted === true && Number(payload?.score || 0) >= ACCEPTED_SCORE;
  return {
    accepted,
    score: Math.max(0, Math.min(100, Math.round(Number(payload?.score || 0)))),
    feedback: String(payload?.feedback || '').trim().slice(0, 500),
    missingConcepts: Array.isArray(payload?.missingConcepts)
      ? payload.missingConcepts.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
      : [],
    assessedAt: new Date().toISOString(),
  };
}

export function getWorkbookFieldContext(courseId, sectionId, pageNumber, fieldId) {
  const sourcePlan = getVerifiedModuleSource(courseId, sectionId);
  if (!sourcePlan) throw Object.assign(new Error('COURSE MODULE NOT FOUND'), { status: 404 });
  if (courseId === 'nutrition') {
    const match = getNutritionWorkbookField(sourcePlan, fieldId);
    if (!match || Number(match.chapter.number) !== Number(pageNumber)) {
      throw Object.assign(new Error('NUTRITION WORKBOOK RESPONSE FIELD NOT FOUND'), { status: 404 });
    }
    return {
      sourcePlan,
      page: { text: match.field.prompt },
      field: match.field,
      chapters: [match.chapter],
    };
  }
  const pageAllowed = sourcePlan.chapters.some((chapter) => expandPageRange(chapter.workbookPages).includes(pageNumber));
  if (!pageAllowed) throw Object.assign(new Error('WORKBOOK PAGE IS NOT ASSIGNED TO THIS MODULE'), { status: 400 });
  const page = CPT_WORKBOOK_CONTEXT[String(pageNumber)];
  const field = page?.fields?.[fieldId];
  if (!page || !field) throw Object.assign(new Error('WORKBOOK RESPONSE FIELD NOT FOUND'), { status: 404 });
  const chapters = sourcePlan.chapters.filter((chapter) => expandPageRange(chapter.workbookPages).includes(pageNumber));
  return { sourcePlan, page, field, chapters };
}

async function loadTextbookExcerpts(courseId, chapters, query) {
  const queryTokens = tokenize(query);
  const candidates = [];
  for (const chapter of chapters) {
    const sourceDirectory = courseId === 'nutrition' ? 'nutrition-textbook' : 'cpt11-textbook';
    const file = path.join(process.cwd(), 'private', 'issa', sourceDirectory, `chapter-${String(chapter.number).padStart(2, '0')}.json`);
    const source = JSON.parse(await readFile(file, 'utf8'));
    for (const page of source.pages || []) {
      const sentences = String(page.text || '').split(/(?<=[.!?])\s+/);
      sentences.forEach((sentence, index) => {
        const lowered = sentence.toLowerCase();
        const score = queryTokens.reduce((total, token) => total + (lowered.includes(token) ? 1 : 0), 0);
        if (score) candidates.push({ score, page: page.page, index, sentence: sentence.trim() });
      });
    }
  }
  return candidates
    .sort((a, b) => b.score - a.score || a.page - b.page || a.index - b.index)
    .slice(0, 18)
    .map((item) => `[Textbook p. ${item.page}] ${item.sentence}`)
    .join('\n')
    .slice(0, 12000);
}

function responseText(payload) {
  return (payload?.output || [])
    .flatMap((item) => item?.content || [])
    .find((item) => item?.type === 'output_text')?.text || '';
}

export async function assessWorkbookAnswer({ courseId = 'cpt', sectionId, pageNumber, fieldId, answer }, fetchImpl = fetch) {
  const trimmedAnswer = String(answer || '').trim();
  if (!trimmedAnswer) throw Object.assign(new Error('ANSWER REQUIRED'), { status: 400 });
  if (trimmedAnswer.length > 1500) throw Object.assign(new Error('ANSWER IS TOO LONG'), { status: 400 });
  if (!['cpt', 'nutrition'].includes(courseId)) throw Object.assign(new Error('COURSE WORKBOOK NOT SUPPORTED'), { status: 400 });
  const apiKey = process.env.OPENAI_API_KEY || process.env.DAY_CAPSULE_RENDER_API_KEY;
  if (!apiKey) throw Object.assign(new Error('WORKBOOK ASSESSMENT IS NOT CONFIGURED'), { status: 503, code: 'openai_not_configured' });

  const { sourcePlan, page, field, chapters } = getWorkbookFieldContext(courseId, sectionId, pageNumber, fieldId);
  const excerpts = await loadTextbookExcerpts(courseId, chapters, `${field.prompt} ${trimmedAnswer}`);
  const workbookLabel = courseId === 'nutrition' ? 'custom Nutrition workbook' : `official CPT11 workbook page ${pageNumber}`;
  const source = [
    `Module: ${sourcePlan.chapters.map((chapter) => `Chapter ${chapter.number} ${chapter.title}`).join(' / ')}`,
    `${workbookLabel} directions: ${page.text}`,
    `Current response field: ${field.label}`,
    `Nearby workbook prompt: ${field.prompt}`,
    `Relevant attached ${courseId === 'nutrition' ? 'Nutrition Coach' : 'CPT11'} textbook excerpts:`,
    excerpts || 'No matching excerpt was found. Require a clearer answer rather than inventing support.',
  ].join('\n\n');

  const openAiResponse = await fetchImpl('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      reasoning: { effort: 'low' },
      max_output_tokens: 420,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: `You assess one answer in Eugene McClain's private ISSA ${courseId === 'nutrition' ? 'Nutrition Coach study workbook' : 'CPT11 workbook'}. Grade only against the supplied workbook directions and attached textbook excerpts. Accept an answer only when it directly responds, includes the essential source concepts, and names a usable page reference when requested. A score of 80 or higher is required for acceptance. Be concise, specific, encouraging, and never claim to reproduce an official ISSA exam answer.` }],
        },
        { role: 'user', content: [{ type: 'input_text', text: `${source}\n\nLearner answer:\n${trimmedAnswer}` }] },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'workbook_feedback',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['accepted', 'score', 'feedback', 'missingConcepts'],
            properties: {
              accepted: { type: 'boolean' },
              score: { type: 'integer', minimum: 0, maximum: 100 },
              feedback: { type: 'string' },
              missingConcepts: { type: 'array', items: { type: 'string' }, maxItems: 8 },
            },
          },
        },
      },
    }),
    cache: 'no-store',
  });
  const payload = await openAiResponse.json();
  if (!openAiResponse.ok) {
    const message = payload?.error?.message || 'OPENAI WORKBOOK ASSESSMENT FAILED';
    throw Object.assign(new Error(message), { status: openAiResponse.status >= 500 ? 502 : openAiResponse.status });
  }
  const output = responseText(payload);
  if (!output) throw Object.assign(new Error('ASSESSMENT RESPONSE WAS EMPTY'), { status: 502 });
  try {
    return parseWorkbookAssessment(JSON.parse(output));
  } catch {
    throw Object.assign(new Error('ASSESSMENT RESPONSE COULD NOT BE READ'), { status: 502 });
  }
}

export const assessCptWorkbookAnswer = assessWorkbookAnswer;

