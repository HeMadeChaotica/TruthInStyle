import { sourceInputs, dayRecord } from '../data/scaffoldData.js';

export function buildSummationPayload(promptAnswers) {
  const fragments = [
    { bucket: 'assessment', text: `${sourceInputs.assurer_assessment.mood} | ${sourceInputs.assurer_assessment.era}` },
    { bucket: 'writer', text: sourceInputs.assurer_writer.freewrite },
    { bucket: 'intake', text: `Meals: ${sourceInputs.da_eater_day.meals}` },
    { bucket: 'work', text: sourceInputs.work_feed.signal }
  ];

  return {
    dayDate: dayRecord.dayDate,
    titleOfDay: dayRecord.titleOfDay,
    renderedPage: {
      preservePresent: fragments,
      rememberPast: promptAnswers
    },
    searchableTextSnapshot: [...fragments.map((f) => f.text), ...promptAnswers].join(' | '),
    qualifiers: {
      mood: sourceInputs.assurer_assessment.mood,
      era: sourceInputs.assurer_assessment.era,
      dropdowns: ['assessment_mood', 'assessment_era', 'moment_types']
    }
  };
}

export function buildYearlyTrendScaffold(hopewoodEntries, normalizedSourceMeta) {
  return {
    year: '2026',
    repeatedMoods: ['Focused'],
    repeatedEras: ['Rebuild'],
    repeatedDropdownClusters: ['assessment_mood:Focused'],
    repeatedTypedPhrases: ['structure clean and true'],
    workSignals: normalizedSourceMeta.map((m) => m.workSignal),
    hopewoodCollectorSize: hopewoodEntries.length
  };
}
