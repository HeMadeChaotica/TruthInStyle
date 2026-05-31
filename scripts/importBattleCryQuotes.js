const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_CANDIDATES = [
  path.join(ROOT, 'data', 'theAssurer', 'battle-cry-quotes.txt'),
  path.join(ROOT, 'data', 'TheAssurer', 'battle-cry-quotes.txt'),
];
const OUTPUT_PATH = path.join(ROOT, 'lib', 'theAssurer', 'battleCryQuoteData.js');

function getSourcePath() {
  return SOURCE_CANDIDATES.find((candidate) => fs.existsSync(candidate));
}

function stripEntryNumber(line) {
  return line.replace(/^\s*\d+\.\s*/, '').trim();
}

function stripOuterQuotes(text) {
  return text
    .replace(/^[\uFEFF\u200B\u200C\u200D\s]+/, '')
    .replace(/[\uFEFF\u200B\u200C\u200D\s]+$/, '')
    .replace(/^[“”"]/, '')
    .replace(/[“”"]$/, '')
    .trim();
}

function splitQuoteAndAttribution(entry) {
  const cleanedEntry = entry.replace(/\s+/g, ' ').trim();
  const separators = [' —', ' –', ' ―', ' -'];
  const match = separators
    .map((separator) => ({ separator, index: cleanedEntry.lastIndexOf(separator) }))
    .filter(({ index }) => index > 0)
    .sort((left, right) => right.index - left.index)[0];

  if (!match) {
    return {
      text: stripOuterQuotes(cleanedEntry),
      attribution: 'USER PROVIDED',
    };
  }

  return {
    text: stripOuterQuotes(cleanedEntry.slice(0, match.index)),
    attribution: cleanedEntry.slice(match.index + match.separator.length).trim() || 'USER PROVIDED',
  };
}

function getCategory({ sourceLine, text }) {
  const normalizedText = text.toLowerCase();

  if (sourceLine <= 72) {
    return 'BLACK EXCELLENCE';
  }

  if (sourceLine <= 147) {
    return 'SEXY / SPICY';
  }

  if (sourceLine <= 269) {
    return 'MOVIE / TV';
  }

  if (sourceLine <= 356) {
    return 'FUNNY';
  }

  if (sourceLine <= 397) {
    return 'WORK / DISCIPLINE';
  }

  if (/\b(life|family|mother|father|daughter|children|child|home|death|dead|age)\b/.test(normalizedText)) {
    return 'LIFE / AGE / FAMILY';
  }

  return 'CRIMINAL MINDS / TRUTH';
}

function parseQuotes(sourceText) {
  const seenTexts = new Set();
  let duplicateCount = 0;

  const quotes = sourceText.split(/\r?\n/).reduce((items, rawLine, lineIndex) => {
    const sourceLine = lineIndex + 1;
    const entry = stripEntryNumber(rawLine);

    if (!entry) {
      return items;
    }

    const { text, attribution } = splitQuoteAndAttribution(entry);

    if (!text) {
      return items;
    }

    if (seenTexts.has(text)) {
      duplicateCount += 1;
      return items;
    }

    seenTexts.add(text);
    items.push({
      id: `battle-${String(items.length + 1).padStart(3, '0')}`,
      text,
      attribution,
      category: getCategory({ sourceLine, text }),
    });

    return items;
  }, []);

  return { quotes, duplicateCount };
}

function writeQuoteData(quotes) {
  const serializedQuotes = JSON.stringify(quotes, null, 2);

  fs.writeFileSync(
    OUTPUT_PATH,
    `export const BATTLE_CRY_QUOTES = ${serializedQuotes};\n`,
  );
}


function main() {
  const sourcePath = getSourcePath();

  if (!sourcePath) {
    console.error('SOURCE FILE MISSING');
    process.exit(1);
  }

  const sourceText = fs.readFileSync(sourcePath, 'utf8');
  const { quotes, duplicateCount } = parseQuotes(sourceText);
  writeQuoteData(quotes);

  const categories = [...new Set(quotes.map((quote) => quote.category))];
  console.log(`SOURCE FILE FOUND: ${path.relative(ROOT, sourcePath)}`);
  console.log(`QUOTES PARSED COUNT: ${quotes.length}`);
  console.log(`DUPLICATES SKIPPED COUNT: ${duplicateCount}`);
  console.log(`CATEGORIES CREATED: ${categories.join(', ')}`);
}

main();
