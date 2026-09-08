import { NextResponse } from 'next/server';
import { CHAOTICA_DAILY_WORDS } from '../../../lib/theAssurer/chaoticaDailyLexicon';

const VERIFIED_WORDS = new Set(CHAOTICA_DAILY_WORDS);
const DICTIONARY_SOURCE = 'DATAMUSE / WIKTIONARY + WORDNET';

const EXAMPLE_OVERRIDES = Object.freeze({
  callipygian: 'The callipygian statue made everyone suddenly appreciate classical art.',
  queer: 'The queer cabaret filled the room with wit, sequins, and unapologetic joy.',
  twink: 'The twink arrived in a crop top and immediately stole the spotlight.',
  bear: 'The bear at the end of the bar had a warm smile and spectacular shoulders.',
  otter: 'The self-described otter danced like the DJ owed him money.',
  butch: 'Her butch swagger made the leather jacket look ceremonial.',
  drag: 'His drag persona entered five minutes late and exactly on time.',
  ballroom: 'Ballroom gave the night its strut, spectacle, and chosen-family electricity.',
  voguing: 'Voguing turned the dance floor into a runway.',
  nonbinary: 'Their nonbinary identity was one honest part of a much larger story.',
  genderqueer: 'The genderqueer artist made self-definition part of the performance.',
  intersex: 'The intersex advocate spoke with clarity, humor, and hard-earned confidence.',
});

function cleanDefinition(rawDefinition) {
  const [partOfSpeech = '', ...definitionParts] = String(rawDefinition || '').split('\t');
  return {
    partOfSpeech: partOfSpeech.trim().toLowerCase(),
    definition: definitionParts.join(' ').replace(/\s+/g, ' ').trim(),
  };
}

function chooseDefinition(definitions) {
  const cleaned = (Array.isArray(definitions) ? definitions : [])
    .map(cleanDefinition)
    .filter((entry) => entry.definition);
  const current = cleaned.filter((entry) => !/^\((?:archaic|dated|obsolete|rare)\b/i.test(entry.definition));
  return (current.length ? current : cleaned)[0] || null;
}

function usageExample(word, partOfSpeech) {
  if (EXAMPLE_OVERRIDES[word]) return EXAMPLE_OVERRIDES[word];
  if (partOfSpeech === 'adj') return `His ${word} look made half the room stare and the other half pretend not to.`;
  if (partOfSpeech === 'adv') return `He moved ${word}, leaving every head turned in his direction.`;
  if (partOfSpeech === 'v') return `He chose to ${word}, and the room immediately paid attention.`;
  return `A little ${word} turned the quiet night into a story worth repeating.`;
}

export async function GET(request) {
  const word = String(new URL(request.url).searchParams.get('word') || '').trim().toLowerCase();
  if (!VERIFIED_WORDS.has(word)) {
    return NextResponse.json({ verified: false, error: 'WORD IS NOT IN THE CURATED DAILY BANK.' }, { status: 400 });
  }

  try {
    const dictionaryResponse = await fetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=dp&max=3`,
      { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 } },
    );
    if (!dictionaryResponse.ok) throw new Error(`DICTIONARY RETURNED ${dictionaryResponse.status}`);

    const rows = await dictionaryResponse.json();
    const exactEntry = (Array.isArray(rows) ? rows : []).find((entry) => String(entry?.word || '').toLowerCase() === word);
    const selectedDefinition = chooseDefinition(exactEntry?.defs);
    if (!selectedDefinition) {
      return NextResponse.json({ verified: false, error: 'DICTIONARY COULD NOT VERIFY THIS WORD.' }, { status: 404 });
    }

    return NextResponse.json({
      word,
      definition: selectedDefinition.definition,
      example: usageExample(word, selectedDefinition.partOfSpeech),
      partOfSpeech: selectedDefinition.partOfSpeech,
      source: DICTIONARY_SOURCE,
      verified: true,
    });
  } catch (error) {
    return NextResponse.json({
      verified: false,
      error: error?.message || 'DICTIONARY VERIFICATION IS TEMPORARILY UNAVAILABLE.',
    }, { status: 503 });
  }
}
