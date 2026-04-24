// Rehoused controlled vocab inventory.
// If an uploaded source dropdownOptions.js is provided later, replace item labels only,
// keeping these set keys stable for DB + filters.

export const OPTION_SET_REGISTRY = [
  { key: 'assessment_mood', label: 'Assessment Mood', homeSection: 'the.assurer', active: true, displayOrder: 1 },
  { key: 'assessment_era', label: 'Assessment Era', homeSection: 'the.assurer', active: true, displayOrder: 2 },
  { key: 'assessment_singleness', label: 'Assessment Singleness', homeSection: 'the.assurer', active: true, displayOrder: 3 },
  { key: 'lobito_check_in', label: 'Lobito Check-In', homeSection: 'the.assurer', active: true, displayOrder: 4 },
  { key: 'ps_types', label: 'P.S. Types', homeSection: 'remember.me', active: true, displayOrder: 5 },
  { key: 'moment_types', label: 'Moment Types', homeSection: 'remember.me', active: true, displayOrder: 6 },
  { key: 'roid_season', label: 'Roid Season', homeSection: 'thicc.fitt', active: true, displayOrder: 7 },
  { key: 'workout_duration', label: 'Workout Duration', homeSection: 'thicc.fitt', active: true, displayOrder: 8 },
  { key: 'cardio_type', label: 'Cardio Type', homeSection: 'thicc.fitt', active: true, displayOrder: 9 },
  { key: 'cardio_duration', label: 'Cardio Duration', homeSection: 'thicc.fitt', active: true, displayOrder: 10 },
  { key: 'compound', label: 'Compound', homeSection: 'thicc.fitt', active: true, displayOrder: 11 },
  { key: 'ester_form', label: 'Ester/Form', homeSection: 'thicc.fitt', active: true, displayOrder: 12 },
  { key: 'amount', label: 'Amount', homeSection: 'thicc.fitt', active: true, displayOrder: 13 },
  { key: 'estrogen_sensitivity', label: 'Estrogen Sensitivity', homeSection: 'thicc.fitt', active: true, displayOrder: 14 }
];

export const OPTION_ITEMS = {
  assessment_mood: ['Focused', 'Unsteady', 'Lit', 'Tender', 'Ferocious'],
  assessment_era: ['Rebuild', 'Expansion', 'Recovery', 'Chaos', 'Glow-Up'],
  assessment_singleness: ['Single', 'Dating', 'Seeing Someone', 'Complicated'],
  lobito_check_in: ['Quiet', 'Flirty', 'Hungry', 'Wild'],
  ps_types: ['Reminder', 'Anchor', 'Micro-Note'],
  moment_types: ['WOW', 'WTF', 'PLOT TWIST'],
  roid_season: ['Cruise', 'Blast', 'Bridge', 'Off'],
  workout_duration: ['20m', '40m', '60m', '90m+'],
  cardio_type: ['Walk', 'Run', 'Cycle', 'Stair'],
  cardio_duration: ['10m', '20m', '30m', '45m+'],
  compound: ['Testosterone', 'Nandrolone', 'Primobolan', 'Masteron'],
  ester_form: ['Enanthate', 'Cypionate', 'Propionate', 'Acetate'],
  amount: ['Low', 'Medium', 'High'],
  estrogen_sensitivity: ['Low', 'Moderate', 'High']
};
