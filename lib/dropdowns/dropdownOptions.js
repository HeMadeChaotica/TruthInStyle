import { useEffect, useState } from 'react';
import { readSettings } from '../mmocStore';

export const DROPDOWN_KEYS = {
  assessmentMood: 'assessmentMood',
  assessmentEra: 'assessmentEra',
  assessmentSingleness: 'assessmentSingleness',
  lobitoCheckIn: 'lobitoCheckIn',
  psTypes: 'psTypes',
  momentTypes: 'momentTypes',
  roidSeason: 'roidSeason',
  roidWorkoutDuration: 'roidWorkoutDuration',
  roidCardioType: 'roidCardioType',
  roidCardioDuration: 'roidCardioDuration',
  roidCompound: 'roidCompound',
  roidEster: 'roidEster',
  roidAmount: 'roidAmount',
  roidSensitivity: 'roidSensitivity',
};

export const DEFAULT_DROPDOWNS = {
  [DROPDOWN_KEYS.assessmentMood]: [
    'Select…','Horny for Peace','Feral & Focused','Violently Calm','Sexually Frustrated but Contained','Plotting With a Semi','Muscle Memory and Trauma','Built Like a Threat','Calm Like a Loaded Weapon','Hard Body, Closed Heart','Wanting Touch, Refusing Attachment','Desire Without Permission','Attracted but Unavailable','Crushing Quietly','Sexually Awake, Emotionally Armed','Detached for My Own Safety','Heart Locked, Body Open','Missing Someone I Shouldn’t','Grief With Good Posture','Sad, Not Weak','Petty but Correct','Annoyed by Everyone','Do Not Test Me','Observing Before Engaging','Silence Is Strategic','Hyperfocused and Unreachable','Overstimulated but Managing','Brain on Fire','Mask On, Emotions Offline','Unmasked and Exposed','Indifferent and Relieved','Regulated Enough','Resting in My Body','Safe for Now','Still Standing',
  ],
  [DROPDOWN_KEYS.assessmentEra]: [
    '(optional)','Villain Era','Whore4More','Horny for Peace','Muscle Memory and Trauma','Plotting Season','Built, Not Broken','Hard Body, Harder Boundaries','Flesh and Willpower','Dangerous Crush Season','Attachment Without Illusions','Wanting Without Chasing','Letting Someone Matter (Carefully)','Post-Heartbreak Control Phase','Emotional Scar Tissue','Grief Without Collapse','Detachment Training','Gym God Ascension','Strength Without Apology','Discipline Over Desire','Power Stabilization','Hyperfocus Arc','Manic Clarity Window','Burnout Containment','Re-Regulation Protocol','Silence as Strategy','No Negotiation Period','Energy Preservation Mode','Nothing to Prove','Knowing Exactly Who I Am',
  ],
  [DROPDOWN_KEYS.assessmentSingleness]: [
    'Select…','Single and Self-Controlled','Single, Not Looking','Single but Curious','Crushing Quietly','Mutual Tension, No Labels','Attracted but Guarded','Emotionally Involved','Physically Attached, Emotionally Cautious','Letting Someone In (Slowly)','Complicated on Purpose','Unavailable by Design','Attached Against My Will','Heart Closed for Maintenance','Recovering From Someone','Detaching With Intent','Indifferent and Relieved','Choosing Myself','My Man My Man My MAN','Oh So You Doing the Bending','Wees Be Married Now','Delulu by Moni Long','Damnit I Like Him… Shit!','How did we get here',
  ],
  [DROPDOWN_KEYS.lobitoCheckIn]: ['Hunting season.','Quiet killer.','dead dick DEAD DICK.','Feral focus.','I smell bussy 😈','Needs music + rage.','High discipline / low feelings.','I will not fold.','Recovery wolf.','its giving sister Mary Clarence','blue days... bluer balls','Flesh - Miguel'],
  [DROPDOWN_KEYS.psTypes]: ['Something New Day','Appointment','Reminder','Job Interview','Birthday','Anniversary','Meeting Deadline','Event','Travel','Call','Workout','Social','Personal','Health','Finance'],
  [DROPDOWN_KEYS.momentTypes]: ['WOW','WTF','PLOT TWIST'],
  [DROPDOWN_KEYS.roidSeason]: ['BULLKING  SEASON👑','LEANING SEASON','MODEL CAMPAIGN SEASON','SKINNY LEGEND SEASON','LOOK I AM HERE RIGHT NOW SEASON','ADONIS SEASON','I JUST ATE FOUR CRUMBL COOKIES SEASON'],
  [DROPDOWN_KEYS.roidWorkoutDuration]: ['20 MIN','30 MIN','45 MIN','90 MIN','120 MIN'],
  [DROPDOWN_KEYS.roidCardioType]: ['RUN','BRISK WALK','CYCLE CLASS','ORANGETHEORY','PILATES','SOLIDCORE','POLE DANCING','SEX','DANCE FITNESS CLASS','CROSSFIT','YOGA','STAIRMASTER','SCREAMING INTO THE WIND','CUSTOM / FILL-IN'],
  [DROPDOWN_KEYS.roidCardioDuration]: ['20 MIN','30 MIN','45 MIN','90 MIN','120 MIN'],
  [DROPDOWN_KEYS.roidCompound]: ['TESTOSTERONE','TRENBOLONE','WINSTROL / STANOZOLOL','DECA / NANDROLONE DECANOATE','NPP / NANDROLONE PHENYLPROPIONATE','ANAVAR / OXANDROLONE','ANADROL / OXYMETHOLONE','DIANABOL / METHANDIENONE / METHANDROSTENOLONE','EQUIPOISE / BOLDENONE UNDECYLENATE','PRIMOBOLAN / METHENOLONE ENANTHATE','HALOTESTIN / FLUOXYMESTERONE','PROVIRON / MESTEROLONE','METHYLTESTOSTERONE'],
  [DROPDOWN_KEYS.roidEster]: ['CYPIONATE','ENANTHATE','PROPIONATE','ACETATE','UNDECYLENATE','DECANOATE','PHENYLPROPIONATE','ORAL','INJECTABLE'],
  [DROPDOWN_KEYS.roidAmount]: ['.5 CC','.75 CC','1 CC','1.25 CC','1.5 CC'],
  [DROPDOWN_KEYS.roidSensitivity]: ['HIGHLY SENSITIVE','I FEEL IT SOMETIMES','ONLY WHEN AROUSED'],
};

export const ASSESSMENT_MOODS = DEFAULT_DROPDOWNS[DROPDOWN_KEYS.assessmentMood];
export const ASSESSMENT_ERAS = DEFAULT_DROPDOWNS[DROPDOWN_KEYS.assessmentEra];
export const ASSESSMENT_SINGLENESS = DEFAULT_DROPDOWNS[DROPDOWN_KEYS.assessmentSingleness];
export const LOBITO_CHECK_IN = DEFAULT_DROPDOWNS[DROPDOWN_KEYS.lobitoCheckIn];
export const MOMENT_TYPES = DEFAULT_DROPDOWNS[DROPDOWN_KEYS.momentTypes];
export const PS_TYPES = DEFAULT_DROPDOWNS[DROPDOWN_KEYS.psTypes];
export const ROID_SEASONS = DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidSeason];
export const DURATION_OPTIONS = DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidWorkoutDuration];
export const CARDIO_TYPES = DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidCardioType];
export const CARDIO_DURATION_OPTIONS = DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidCardioDuration];
export const ROID_COMPOUNDS = DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidCompound];
export const ROID_ESTERS = DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidEster];
export const ROID_AMOUNTS = DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidAmount];
export const ROID_SENSITIVITY = DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidSensitivity];

export function getDropdownOptions(key) {
  const settings = readSettings();
  const override = settings?.optionOverrides?.[key];
  return Array.isArray(override) && override.length ? override : (DEFAULT_DROPDOWNS[key] || []);
}

export function emitDropdownSettingsChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('chaotica:dropdowns-changed'));
}

export function useDropdownOptions(key) {
  const [options, setOptions] = useState(() => getDropdownOptions(key));
  useEffect(() => {
    const refresh = () => setOptions(getDropdownOptions(key));
    refresh();
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('chaotica:dropdowns-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('chaotica:dropdowns-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [key]);
  return options;
}

export const SETTINGS_GROUPS = [
  { title: 'ASSESSMENT', items: [
    { key: DROPDOWN_KEYS.assessmentMood, label: 'MOOD' },
    { key: DROPDOWN_KEYS.assessmentEra, label: 'ERA' },
    { key: DROPDOWN_KEYS.assessmentSingleness, label: 'SINGLENESS LEVEL' },
  ]},
  { title: 'ROIDBOY', items: [
    { key: DROPDOWN_KEYS.lobitoCheckIn, label: 'LOBITO CHECK-IN' },
    { key: DROPDOWN_KEYS.roidSeason, label: 'SEASON' },
    { key: DROPDOWN_KEYS.roidWorkoutDuration, label: 'WORKOUT LENGTH' },
    { key: DROPDOWN_KEYS.roidCardioType, label: 'CARDIO TYPE' },
    { key: DROPDOWN_KEYS.roidCardioDuration, label: 'CARDIO DURATION' },
    { key: DROPDOWN_KEYS.roidCompound, label: 'COMPOUND' },
    { key: DROPDOWN_KEYS.roidEster, label: 'ESTER / FORM' },
    { key: DROPDOWN_KEYS.roidAmount, label: 'AMOUNT' },
    { key: DROPDOWN_KEYS.roidSensitivity, label: 'ESTROGEN SENSITIVITY' },
  ]},
  { title: 'P.S. + MOMENTS', items: [
    { key: DROPDOWN_KEYS.psTypes, label: 'P.S. TYPES' },
    { key: DROPDOWN_KEYS.momentTypes, label: 'MOMENT TYPES' },
  ]},
];
