const pad = (value) => String(value).padStart(2, '0');

const dateKey = (year, monthIndex, day) => `${year}-${pad(monthIndex + 1)}-${pad(day)}`;

const nthWeekday = (year, monthIndex, weekday, occurrence) => {
  const firstWeekday = new Date(year, monthIndex, 1, 12).getDay();
  return 1 + ((weekday - firstWeekday + 7) % 7) + (occurrence - 1) * 7;
};

const lastWeekday = (year, monthIndex, weekday) => {
  const last = new Date(year, monthIndex + 1, 0, 12);
  return last.getDate() - ((last.getDay() - weekday + 7) % 7);
};

const observedDate = (year, monthIndex, day) => {
  const actual = new Date(year, monthIndex, day, 12);
  if (actual.getDay() === 6) actual.setDate(actual.getDate() - 1);
  if (actual.getDay() === 0) actual.setDate(actual.getDate() + 1);
  return actual;
};

const toDateKey = (date) => dateKey(date.getFullYear(), date.getMonth(), date.getDate());

const createObservance = ({ id, date, label, layer, detail, rank }) => ({
  id,
  date_key: date,
  date,
  label,
  detail,
  description: detail,
  layer,
  rank,
  readOnly: true,
  schedule_kind: 'observance',
  _source: `${layer}-observance`,
});

export const REMEMBER_ME_MONTH_IDENTITIES = [
  { key: 'january', title: 'NEW YEAR. SEXIER ME.', story: 'Reinvention, fresh-year bravado, and seductive new-start energy.' },
  { key: 'february', title: 'BLACK HISTORY. BLACK LOVE.', story: 'Black history and the celebration of love share the center of the room.' },
  { key: 'march', title: 'SPRING IS IN THE AIR. SO ARE MY ALLERGIES.', story: 'Beautiful spring suffering, performed with maximum drama.' },
  { key: 'april', title: 'APRIL SHOWERS. ATTITUDE FLOWERS.', story: 'The rain keeps coming, but the joke and the look are entirely April.' },
  { key: 'may', title: 'MAY FLOWERS. MAYHEM. MAIN CHARACTER.', story: 'Full bloom, warmer air, and a distinct late-spring main-character turn.' },
  { key: 'june', title: 'PRIDE HAS MANY CITIES. I HAVE ONE WORLD.', story: 'DC, Atlanta, San Francisco, New York City, and the wider Pride universe.' },
  { key: 'july', title: 'FIREWORKS AND AUDACITY.', story: 'Loud summer spectacle with an explosive visual personality.' },
  { key: 'august', title: 'TRANSFORMATION IS PERSONAL.', story: 'Mista.Thicc evolution: intimate, deliberate, and visibly becoming.' },
  {
    key: 'september',
    title: 'SOMETHING IN THE UNIVERSE IS COOKING.',
    story: 'A mystery revealed in clues that can actually be solved.',
    riddle: 'Nine doors wait. Three lights turn. What is becoming before the leaves confess?',
    answer: 'Transformation.',
  },
  { key: 'october', title: 'HALLOWEEN. SEXY. DARK. WITH TEETH.', story: 'Favorite-month theater, danger, and a costume worthy of the night.' },
  { key: 'november', title: 'HARVEST, SWEETS, AND SECONDS.', story: 'Abundance, food, dessert, and unapologetic autumn indulgence.' },
  { key: 'december', title: 'BIRTHDAY MONTH. DECEMBER 22 OWNS THE SKY.', story: 'The holidays may visit, but the month belongs to Mista.Thicc first.' },
];

export const getRememberMeMonthIdentity = (monthIndex) => (
  REMEMBER_ME_MONTH_IDENTITIES[Number.isInteger(monthIndex) ? monthIndex : 0]
  || REMEMBER_ME_MONTH_IDENTITIES[0]
);

const federalHolidayDefinitions = (year) => [
  ['new-years-day', 0, 1, "NEW YEAR'S DAY"],
  ['mlk-day', 0, nthWeekday(year, 0, 1, 3), 'MARTIN LUTHER KING JR. DAY'],
  ['washington-birthday', 1, nthWeekday(year, 1, 1, 3), "WASHINGTON'S BIRTHDAY"],
  ['memorial-day', 4, lastWeekday(year, 4, 1), 'MEMORIAL DAY'],
  ['juneteenth', 5, 19, 'JUNETEENTH NATIONAL INDEPENDENCE DAY'],
  ['independence-day', 6, 4, 'INDEPENDENCE DAY'],
  ['labor-day', 8, nthWeekday(year, 8, 1, 1), 'LABOR DAY'],
  ['columbus-day', 9, nthWeekday(year, 9, 1, 2), 'COLUMBUS DAY'],
  ['veterans-day', 10, 11, 'VETERANS DAY'],
  ['thanksgiving', 10, nthWeekday(year, 10, 4, 4), 'THANKSGIVING DAY'],
  ['christmas', 11, 25, 'CHRISTMAS DAY'],
];

const buildFederalObservances = (year) => {
  const rows = [];
  [year - 1, year, year + 1].forEach((holidayYear) => {
    federalHolidayDefinitions(holidayYear).forEach(([slug, monthIndex, day, label]) => {
      const actualKey = dateKey(holidayYear, monthIndex, day);
      const observedKey = toDateKey(observedDate(holidayYear, monthIndex, day));
      if (actualKey.startsWith(`${year}-`)) {
        rows.push(createObservance({
          id: `official-${slug}-${holidayYear}`,
          date: actualKey,
          label,
          layer: 'official',
          rank: 10,
          detail: 'UNITED STATES FEDERAL HOLIDAY.',
        }));
      }
      if (observedKey !== actualKey && observedKey.startsWith(`${year}-`)) {
        rows.push(createObservance({
          id: `official-${slug}-observed-${holidayYear}`,
          date: observedKey,
          label: `${label} · OBSERVED`,
          layer: 'official',
          rank: 11,
          detail: 'FEDERAL OBSERVED DATE FOR A MONDAY–FRIDAY WORK SCHEDULE.',
        }));
      }
    });
  });

  if ((year - 2021) % 4 === 0) {
    rows.push(createObservance({
      id: `official-inauguration-${year}`,
      date: dateKey(year, 0, 20),
      label: 'INAUGURATION DAY',
      layer: 'official',
      rank: 12,
      detail: 'FEDERAL HOLIDAY FOR ELIGIBLE EMPLOYEES IN THE WASHINGTON, DC AREA.',
    }));
  }
  return rows;
};

const majorObservances = (year) => [
  [0, 1, 'NEW YEAR · NEW ERA', 'A new year and a new personal chapter.'],
  [1, 1, 'BLACK HISTORY MONTH BEGINS', 'Black history, culture, achievement, and future.'],
  [1, 14, "VALENTINE'S DAY", 'Love in every form, including the love that begins with you.'],
  [2, 1, "WOMEN'S HISTORY MONTH BEGINS", 'A month recognizing the history and contributions of women.'],
  [2, 8, "INTERNATIONAL WOMEN'S DAY", 'Celebrate the social, economic, cultural, and political achievements of women.'],
  [2, 31, 'TRANSGENDER DAY OF VISIBILITY', 'Celebrate trans people and recognize the work still ahead.'],
  [3, 22, 'EARTH DAY', 'Care for the world that holds every version of us.'],
  [4, 1, 'AANHPI HERITAGE MONTH BEGINS', 'Celebrate Asian American, Native Hawaiian, and Pacific Islander heritage.'],
  [4, 17, 'INTERNATIONAL DAY AGAINST HOMOPHOBIA, BIPHOBIA & TRANSPHOBIA', 'Visibility, dignity, and freedom belong everywhere.'],
  [5, 1, 'PRIDE MONTH BEGINS', 'DC, Atlanta, San Francisco, New York City, and the wider Pride world.'],
  [5, 28, 'STONEWALL ANNIVERSARY', 'Honor the resistance that helped ignite the modern LGBTQ+ rights movement.'],
  [6, 14, "INTERNATIONAL NON-BINARY PEOPLE'S DAY", 'Celebrate non-binary people and expansive gender expression.'],
  [7, 26, "WOMEN'S EQUALITY DAY", 'Commemorate progress toward equal rights and the work still required.'],
  [8, 4, 'WORLD SEXUAL HEALTH DAY', 'Pleasure, consent, information, and whole-person health.'],
  [8, 11, 'PATRIOT DAY', 'A day of remembrance for those lost and affected on September 11.'],
  [8, 15, 'HISPANIC HERITAGE MONTH BEGINS', 'Celebrate Hispanic and Latino histories, cultures, and contributions.'],
  [8, 23, 'BISEXUAL VISIBILITY DAY', 'Celebrate bisexual people, history, and community.'],
  [9, 1, 'LGBTQ+ HISTORY MONTH BEGINS', 'Remember the people and movements that shaped queer history.'],
  [9, 11, 'NATIONAL COMING OUT DAY', 'Honor every honest reveal and every person moving at their own pace.'],
  [9, 26, 'INTERSEX AWARENESS DAY', 'Celebrate intersex people and support bodily autonomy.'],
  [9, 31, 'HALLOWEEN', 'The favorite month gets its crown: dark, theatrical, and unapologetically sexy.'],
  [10, 1, 'NATIVE AMERICAN HERITAGE MONTH BEGINS', 'Honor Native histories, cultures, communities, and living nations.'],
  [11, 1, 'WORLD AIDS DAY', 'Remember, support, educate, and fight stigma.'],
].map(([monthIndex, day, label, detail], index) => createObservance({
  id: `major-${year}-${index}`,
  date: dateKey(year, monthIndex, day),
  label,
  layer: 'official',
  rank: 20,
  detail: detail.toUpperCase(),
}));

const funObservances = (year) => [
  [0, nthWeekday(year, 0, 5, 3), 'INTERNATIONAL FETISH DAY', 'Consensual kink, curiosity, and zero shame.'],
  [0, 21, 'NATIONAL HUGGING DAY', 'Ask first. Then hold on properly.'],
  [1, 13, 'SELF-LOVE EVE', 'A TruthInStyle warm-up for loving yourself on purpose.'],
  [2, 20, 'INTERNATIONAL DAY OF HAPPINESS', 'Joy counts, even when it arrives wearing chaos.'],
  [3, 14, 'NATIONAL EX-SPOUSE DAY', 'Closure, comedy, or silence. Choose the healthy one.'],
  [4, 6, 'INTERNATIONAL NO DIET DAY', 'Bodies deserve dignity, nourishment, and peace.'],
  [4, 13, 'WORLD COCKTAIL DAY', 'Hydrate first. Then make it pretty.'],
  [5, 21, 'NATIONAL SELFIE DAY', 'Evidence that the face card remains operational.'],
  [6, 7, 'WORLD CHOCOLATE DAY', 'A very reasonable reason to be decadent.'],
  [6, 14, 'NATIONAL NUDE DAY', 'Body confidence, consent, and climate control.'],
  [7, 5, 'NATIONAL UNDERWEAR DAY', 'Supportive garments and unsupported decisions.'],
  [7, 15, 'NATIONAL RELAXATION DAY', 'Rest is part of the transformation.'],
  [8, 13, 'INTERNATIONAL CHOCOLATE DAY', 'September reveals at least one sweet answer.'],
  [9, 13, 'NO BRA DAY', 'Comfort, awareness, and letting the body breathe.'],
  [9, 14, 'NATIONAL DESSERT DAY', 'October has room for treats before the tricks.'],
  [10, 3, 'NATIONAL SANDWICH DAY', 'Stack it high enough to require a strategy.'],
  [10, 6, 'NATIONAL NACHOS DAY', 'Harvest season, but make it covered in cheese.'],
  [10, 23, 'NATIONAL ESPRESSO DAY', 'Tiny cup. Large consequences.'],
  [11, 4, 'NATIONAL COOKIE DAY', 'Birthday month begins with baked evidence.'],
  [11, 8, 'NATIONAL BROWNIE DAY', 'A second dessert observance was clearly necessary.'],
  [11, 20, 'NATIONAL SANGRIA DAY', 'Birthday-week fruit counts as fruit.'],
].map(([monthIndex, day, label, detail], index) => createObservance({
  id: `fun-${year}-${index}`,
  date: dateKey(year, monthIndex, day),
  label,
  layer: 'fun',
  rank: 30,
  detail: detail.toUpperCase(),
}));

const personalObservances = (year) => [
  createObservance({
    id: `personal-birthday-${year}`,
    date: dateKey(year, 11, 22),
    label: 'MISTA.THICC BIRTHDAY',
    layer: 'personal',
    rank: 40,
    detail: 'DECEMBER 22 OWNS THE SKY. BIRTHDAY MONTH REACHES ITS CENTER.',
  }),
];

export const buildRememberMeObservances = (year) => {
  const safeYear = Number.isInteger(year) ? year : new Date().getFullYear();
  return [
    ...buildFederalObservances(safeYear),
    ...majorObservances(safeYear),
    ...funObservances(safeYear),
    ...personalObservances(safeYear),
  ].sort((left, right) => left.date_key.localeCompare(right.date_key) || left.rank - right.rank || left.label.localeCompare(right.label));
};

export const groupRememberMeObservancesByDate = (year) => buildRememberMeObservances(year).reduce((grouped, observance) => {
  grouped[observance.date_key] = [...(grouped[observance.date_key] || []), observance];
  return grouped;
}, {});
