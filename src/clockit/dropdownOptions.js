const DEFAULT_DROPDOWNS = {
  assessmentMood: [
    'Horny for Peace',
    'Feral & Focused',
    'Violently Calm',
    'Sexually Frustrated but Contained',
    'Plotting With a Semi',
    'Muscle Memory and Trauma',
    'Built Like a Threat',
    'Calm Like a Loaded Weapon',
    'Hard Body, Closed Heart',
    'Wanting Touch, Refusing Attachment',
    'Desire Without Permission',
    'Attracted but Unavailable',
    'Crushing Quietly',
    'Sexually Awake, Emotionally Armed',
    'Detached for My Own Safety',
    'Heart Locked, Body Open',
    'Missing Someone I Shouldn’t',
    'Grief With Good Posture',
    'Sad, Not Weak',
    'Petty but Correct',
    'Annoyed by Everyone',
    'Do Not Test Me',
    'Observing Before Engaging',
    'Silence Is Strategic',
    'Hyperfocused and Unreachable',
    'Overstimulated but Managing',
    'Brain on Fire',
    'Mask On, Emotions Offline',
    'Unmasked and Exposed',
    'Indifferent and Relieved',
    'Regulated Enough',
    'Resting in My Body',
    'Safe for Now',
    'Still Standing'
  ],
  assessmentEra: [
    'Villain Era',
    'Whore4More',
    'Horny for Peace',
    'Muscle Memory and Trauma',
    'Plotting Season',
    'Built, Not Broken',
    'Hard Body, Harder Boundaries',
    'Flesh and Willpower',
    'Dangerous Crush Season',
    'Attachment Without Illusions',
    'Wanting Without Chasing',
    'Letting Someone Matter (Carefully)',
    'Post-Heartbreak Control Phase',
    'Emotional Scar Tissue',
    'Grief Without Collapse',
    'Detachment Training',
    'Gym God Ascension',
    'Strength Without Apology',
    'Discipline Over Desire',
    'Power Stabilization',
    'Hyperfocus Arc',
    'Manic Clarity Window',
    'Burnout Containment',
    'Re-Regulation Protocol',
    'Silence as Strategy',
    'No Negotiation Period',
    'Energy Preservation Mode',
    'Nothing to Prove',
    'Knowing Exactly Who I Am',
    'but like that FUCKIN HURT',
    'Pardon 🥴',
    'When I say damsel… i mean 🗣️DADDY'
  ],
  assessmentSingleness: [
    'Single and Self-Controlled',
    'Single, Not Looking',
    'Single but Curious',
    'Crushing Quietly',
    'Mutual Tension, No Labels',
    'Attracted but Guarded',
    'Emotionally Involved',
    'Physically Attached, Emotionally Cautious',
    'Letting Someone In (Slowly)',
    'Complicated on Purpose',
    'Unavailable by Design',
    'Attached Against My Will',
    'Heart Closed for Maintenance',
    'Recovering From Someone',
    'Detaching With Intent',
    'Indifferent and Relieved',
    'Choosing Myself',
    'My Man My Man My MAN',
    'Oh So You Doing the Bending',
    'Wees Be Married Now',
    'Delulu by Moni Long',
    'Damnit I Like Him… Shit!',
    'How did we get here',
    'For the plot',
    'But did you see his dick though',
    'Someone is for sure pissed with me',
    'Imma be his villain origins'
  ],
  lobitoCheckIn: [
    'Hunting season.',
    'Quiet killer.',
    'Soft but dangerous.',
    'Feral focus.',
    'Potent',
    'for sure going on sniffies today',
    'diamond nipples',
    '🗣️DEAD DICK *in Katya’s voice*',
    'I’m just cold',
    'fold me like a pretzel',
    'Wet Dawg',
    'I smell Him'
  ],
  psTypes: ['Something New Day', 'Appointment', 'Reminder', 'Job Interview', 'Birthday', 'Anniversary', 'Meeting Deadline', 'Event', 'Travel', 'Call', 'Workout', 'Social', 'Personal', 'Health', 'Finance'],
  momentTypes: ['WOW', 'WTF', 'PLOT TWIST'],
  roidPromptedNotes: [
    'I WON’T SUM MO COACH GIMME THAT',
    'THAT WAS DEFINITELY NOT A FART',
    'OK TEAM LET’S CALL IT… TIME OF DEATH IS 🫪',
    'SHE ATE BUT SHE IS SEEING STARS',
    'I NEED A STRETCH, A SNACK, AND A MAN',
    'I FEAR I HAVE LEFT MY SOUL ON THE LEG PRESS',
    'GAGGED, SWEATY, AND STILL EMPLOYED',
    'I LOOK INSANE BUT THE PUMP IS CORRECT',
    'SOMEBODY HOLD MY PURSE AND MY VISION',
    'I COULD CRY BUT MY GLUTES WON’T LET ME',
    'THIS WAS HOTTER THAN IT WAS HEALTHY',
    'I AM BOTH GOD’S STRONGEST AND WEAKEST SOLDIER',
    'BABY I AM COOKED BUT NOT DONE',
    'MY BODY SAID NO BUT MY EGO SAID AGAIN',
    'IF I SIT DOWN IT IS OVER',
    'I NEED WATER, CARBS, AND QUIET',
    'THAT CARDIO WAS AN ACT OF VIOLENCE',
    'I SURVIVED BUT LET’S NOT ROMANTICIZE IT',
    'PUMPED, FILTHY, AND SPIRITUALLY REARRANGED',
    'PUT ME IN THE VAULT AND SEAL THE DOOR'
  ],
  roidSeason: ['BULLKING SEASON👑', 'LEANING SEASON', 'MODEL CAMPAIGN SEASON', 'SKINNY LEGEND SEASON', 'LOOK I AM HERE RIGHT NOW SEASON', 'ADONIS SEASON', 'I JUST ATE FOUR CRUMBL COOKIES SEASON'],
  roidWorkoutDuration: ['20 MIN', '30 MIN', '45 MIN', '90 MIN', '120 MIN'],
  roidCardioType: ['RUN', 'BRISK WALK', 'CYCLE CLASS', 'ORANGETHEORY', 'PILATES', 'SOLIDCORE', 'POLE DANCING', 'SEX', 'DANCE FITNESS CLASS', 'CROSSFIT', 'YOGA', 'STAIRMASTER', 'SCREAMING INTO THE WIND', 'CUSTOM / FILL-IN'],
  roidCardioDuration: ['20 MIN', '30 MIN', '45 MIN', '90 MIN', '120 MIN'],
  roidCompound: ['TESTOSTERONE', 'TRENBOLONE', 'WINSTROL / STANOZOLOL', 'DECA / NANDROLONE DECANOATE', 'NPP / NANDROLONE PHENYLPROPIONATE', 'ANAVAR / OXANDROLONE', 'ANADROL / OXYMETHOLONE', 'DIANABOL / METHANDIENONE / METHANDROSTENOLONE', 'EQUIPOISE / BOLDENONE UNDECYLENATE', 'PRIMOBOLAN / METHENOLONE ENANTHATE', 'HALOTESTIN / FLUOXYMESTERONE', 'PROVIRON / MESTEROLONE', 'METHYLTESTOSTERONE'],
  roidEster: ['CYPIONATE', 'ENANTHATE', 'PROPIONATE', 'ACETATE', 'UNDECYLENATE', 'DECANOATE', 'PHENYLPROPIONATE', 'ORAL', 'INJECTABLE'],
  roidAmount: ['.5 CC', '.75 CC', '1 CC', '1.25 CC', '1.5 CC'],
  roidSensitivity: ['HIGHLY SENSITIVE', 'I FEEL IT SOMETIMES', 'ONLY WHEN AROUSED'],
  cheatType: ['Sweet', 'Salty', 'Both', 'Liquid calories', 'I blacked out (lol)'],
  cheatDamage: ['Light', 'Moderate', 'Nuclear'],
  proteinHit: ['Yes', 'No']
};

const registry = new Map(
  Object.entries(DEFAULT_DROPDOWNS).map(([familyKey, values]) => [familyKey, values.map((label) => ({ label, active: true }))])
);
const listeners = new Set();

export const OPTION_SET_FAMILY_KEYS = Object.keys(DEFAULT_DROPDOWNS);

export function getOptionsForFamily(familyKey) {
  return (registry.get(familyKey) ?? []).filter((option) => option.active).map((option) => option.label);
}

export function getOptionRecordsForFamily(familyKey) {
  return (registry.get(familyKey) ?? []).map((option) => ({ ...option }));
}

export function addOptionToFamily(familyKey, label) {
  if (!registry.has(familyKey) || !label?.trim()) return;
  registry.get(familyKey).push({ label: label.trim(), active: true });
  emitDropdownChanged(familyKey);
}

export function renameOptionInFamily(familyKey, index, label) {
  if (!registry.has(familyKey) || !label?.trim()) return;
  const option = registry.get(familyKey)[index];
  if (!option) return;
  option.label = label.trim();
  emitDropdownChanged(familyKey);
}

export function setOptionActiveState(familyKey, index, active) {
  const option = registry.get(familyKey)?.[index];
  if (!option) return;
  option.active = active;
  emitDropdownChanged(familyKey);
}

export function reorderOptionInFamily(familyKey, index, direction) {
  const family = registry.get(familyKey);
  if (!family || !family[index]) return;
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= family.length) return;
  [family[index], family[targetIndex]] = [family[targetIndex], family[index]];
  emitDropdownChanged(familyKey);
}

export function restoreDefaultFamily(familyKey) {
  if (!DEFAULT_DROPDOWNS[familyKey]) return;
  registry.set(
    familyKey,
    DEFAULT_DROPDOWNS[familyKey].map((label) => ({ label, active: true }))
  );
  emitDropdownChanged(familyKey);
}

export function onDropdownOptionsChanged(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitDropdownChanged(familyKey) {
  listeners.forEach((listener) => listener({ familyKey, values: getOptionsForFamily(familyKey) }));
}

export function getClockItRegistrySnapshot() {
  return OPTION_SET_FAMILY_KEYS.map((familyKey) => ({
    familyKey,
    values: getOptionRecordsForFamily(familyKey)
  }));
}
