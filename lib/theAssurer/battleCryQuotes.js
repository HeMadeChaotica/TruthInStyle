export const BATTLE_CRY_QUOTES = [
  {
    id: 'battle-001',
    text: 'JUST DON’T GIVE UP WHAT YOU’RE TRYING TO DO. WHERE THERE IS LOVE AND INSPIRATION, I DON’T THINK YOU CAN GO WRONG.',
    attribution: 'ELLA FITZGERALD, AMERICAN JAZZ SINGER',
    category: 'USER PROVIDED',
  },
  {
    id: 'battle-002',
    text: 'DON’T ASPIRE TO MAKE A LIVING, ASPIRE TO MAKE A DIFFERENCE.',
    attribution: 'DENZEL WASHINGTON, AMERICAN ACTOR AND FILMMAKER',
    category: 'USER PROVIDED',
  },
  {
    id: 'battle-003',
    text: 'THE FUTURE REWARDS THOSE WHO PRESS ON. I DON’T HAVE TIME TO FEEL SORRY FOR MYSELF. I DON’T HAVE TIME TO COMPLAIN. I’M GOING TO PRESS ON.',
    attribution: 'BARACK OBAMA, 44TH US PRESIDENT',
    category: 'USER PROVIDED',
  },
  {
    id: 'battle-004',
    text: 'HOLD FAST TO DREAMS, FOR IF DREAMS DIE, LIFE IS A BROKEN WINGED BIRD THAT CANNOT FLY.',
    attribution: 'LANGSTON HUGHES, POET, SOCIAL ACTIVIST, NOVELIST, AND PLAYWRIGHT',
    category: 'USER PROVIDED',
  },
  {
    id: 'battle-005',
    text: 'THE TIME IS ALWAYS RIGHT TO DO WHAT IS RIGHT.',
    attribution: 'DR. MARTIN LUTHER KING, JR., BAPTIST MINISTER AND ACTIVIST',
    category: 'USER PROVIDED',
  },
  {
    id: 'battle-006',
    text: 'IMPOSSIBLE IS JUST A BIG WORD THROWN AROUND BY SMALL MEN WHO FIND IT EASIER TO LIVE IN THE WORLD THEY’VE BEEN GIVEN THAN TO EXPLORE THE POWER THEY HAVE TO CHANGE IT.',
    attribution: 'MUHAMMAD ALI, PROFESSIONAL BOXER AND ACTIVIST',
    category: 'USER PROVIDED',
  },
  {
    id: 'battle-007',
    text: 'I CAN ACCEPT FAILURE. EVERYONE FAILS AT SOMETHING. BUT I CAN’T ACCEPT NOT TRYING.',
    attribution: 'MICHAEL JORDAN, FORMER PROFESSIONAL BASKETBALL PLAYER',
    category: 'USER PROVIDED',
  },
  {
    id: 'battle-008',
    text: 'IF THERE IS NO STRUGGLE, THERE IS NO PROGRESS.',
    attribution: 'FREDERICK DOUGLASS, AMERICAN SOCIAL REFORMER, ABOLITIONIST, AND WRITER',
    category: 'USER PROVIDED',
  },
  {
    id: 'battle-009',
    text: 'CHARACTER IS POWER.',
    attribution: 'BOOKER T. WASHINGTON, AMERICAN EDUCATOR, AUTHOR, ORATOR, AND ADVISER TO SEVERAL US PRESIDENTS',
    category: 'USER PROVIDED',
  },
  {
    id: 'battle-010',
    text: 'TRUTH IS POWERFUL AND IT PREVAILS.',
    attribution: 'SOJOURNER TRUTH, AMERICAN ABOLITIONIST',
    category: 'USER PROVIDED',
  },
];

function getSafeDate(date) {
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return date;
  }

  if (typeof date === 'string') {
    const dateOnlyMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
  }

  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? new Date(1970, 0, 1) : parsedDate;
}

function getLocalDayNumber(date) {
  const safeDate = getSafeDate(date);
  return Math.floor(Date.UTC(
    safeDate.getFullYear(),
    safeDate.getMonth(),
    safeDate.getDate(),
  ) / 86400000);
}

export function getBattleCryForDate(date = new Date()) {
  return BATTLE_CRY_QUOTES[getLocalDayNumber(date) % BATTLE_CRY_QUOTES.length];
}

export function getBattleCryById(id) {
  return BATTLE_CRY_QUOTES.find((quote) => quote.id === id) || null;
}
