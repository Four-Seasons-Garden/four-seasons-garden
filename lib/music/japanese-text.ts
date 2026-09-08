import type {
  JapaneseGrammar,
  JapanesePart,
  JapaneseSentence,
  JapaneseWord,
} from "@/lib/music/learning";

export type JapaneseTextLink = {
  label: string;
  onClick: () => void;
};

/* Dictionary form plus the stems a conjugated hit is likely to share, longest
   first so the most specific form wins. */
export function wordSearchForms(word: string) {
  const forms = [word];
  if (word.endsWith("する")) forms.push(word.slice(0, -2));
  if (word.endsWith("い")) forms.push(`${word.slice(0, -1)}く`, word.slice(0, -1));
  if (/[うくぐすつぬぶむる]$/.test(word)) forms.push(word.slice(0, -1));
  return [...new Set(forms)].sort((first, second) => second.length - first.length);
}

/* Which part indexes a term covers. Parts are matched by character offset, so a
   term may span several parts (kanji + okurigana + particle). Falls back to
   progressively shorter prefixes when no whole form matches. */
export function partIndexesForTerm(parts: JapanesePart[], forms: string[]) {
  const sentenceText = parts.map((part) => part.text).join("");
  const partRanges: Array<{ start: number; end: number }> = [];
  let offset = 0;
  for (const part of parts) {
    partRanges.push({ start: offset, end: offset + part.text.length });
    offset += part.text.length;
  }

  let matchStart = -1;
  let matchLength = 0;
  for (const form of forms) {
    const start = sentenceText.indexOf(form);
    if (start >= 0) {
      matchStart = start;
      matchLength = form.length;
      break;
    }
  }

  if (matchStart < 0) {
    for (const form of forms) {
      for (let length = form.length - 1; length >= 2; length -= 1) {
        const start = sentenceText.indexOf(form.slice(0, length));
        if (start >= 0) {
          matchStart = start;
          matchLength = length;
          break;
        }
      }
      if (matchStart >= 0) break;
    }
  }

  if (matchStart < 0) return [];
  const matchEnd = matchStart + matchLength;
  return partRanges.reduce<number[]>((indexes, range, index) => {
    if (range.start < matchEnd && range.end > matchStart) indexes.push(index);
    return indexes;
  }, []);
}

export function grammarSearchForms(item: JapaneseGrammar) {
  const example = item.example.map((part) => part.text).join("").replace(/[「」。、「，,]/g, "");
  return example ? [example] : [];
}

export function japaneseWordKey(word: JapaneseWord) {
  return word.id ?? word.word;
}

export function japaneseGrammarKey(item: JapaneseGrammar) {
  return item.id ?? item.title;
}

/* Map part index → study links. Explicit wordIds/grammarIds on a part always
   win; text matching only fills in for entries a part did not claim. */
export function sentencePartLinks(
  sentence: JapaneseSentence,
  words: JapaneseWord[],
  grammar: JapaneseGrammar[],
  onWordClick: (word: JapaneseWord) => void,
  onGrammarClick: (item: JapaneseGrammar) => void,
) {
  const links: Record<number, JapaneseTextLink[]> = {};
  const wordsById = new Map(words.filter((word) => word.id).map((word) => [word.id, word]));
  const grammarById = new Map(grammar.filter((item) => item.id).map((item) => [item.id, item]));
  const explicitWordIds = new Set(sentence.parts.flatMap((part) => part.wordIds ?? []));
  const explicitGrammarIds = new Set(sentence.parts.flatMap((part) => part.grammarIds ?? []));
  const addLinks = (indexes: number[], link: JapaneseTextLink) => {
    for (const index of indexes) {
      links[index] = [...(links[index] ?? []), link];
    }
  };

  sentence.parts.forEach((part, index) => {
    for (const wordId of part.wordIds ?? []) {
      const word = wordsById.get(wordId);
      if (word) addLinks([index], { label: `Vocabulary: ${word.word}`, onClick: () => onWordClick(word) });
    }
    for (const grammarId of part.grammarIds ?? []) {
      const item = grammarById.get(grammarId);
      if (item) addLinks([index], { label: `Grammar: ${item.title}`, onClick: () => onGrammarClick(item) });
    }
  });

  words.forEach((word) => {
    if (word.id && explicitWordIds.has(word.id)) return;
    addLinks(
      partIndexesForTerm(sentence.parts, wordSearchForms(word.word)),
      { label: `Vocabulary: ${word.word}`, onClick: () => onWordClick(word) },
    );
  });
  grammar.forEach((item) => {
    if (item.id && explicitGrammarIds.has(item.id)) return;
    addLinks(
      partIndexesForTerm(sentence.parts, grammarSearchForms(item)),
      { label: `Grammar: ${item.title}`, onClick: () => onGrammarClick(item) },
    );
  });

  return links;
}

/* ─────────── 五十音順 sorting ─────────── */

const GOJUON_MORA = [
  "あ", "い", "う", "え", "お",
  "か", "き", "く", "け", "こ", "が", "ぎ", "ぐ", "げ", "ご",
  "さ", "し", "しゃ", "しゅ", "しょ", "す", "せ", "そ", "ざ", "じ", "じゃ", "じゅ", "じょ", "ず", "ぜ", "ぞ",
  "た", "ち", "ちゃ", "ちゅ", "ちょ", "つ", "て", "と", "だ", "ぢ", "づ", "で", "ど",
  "な", "に", "ぬ", "ね", "の",
  "は", "ひ", "ふ", "へ", "ほ", "ば", "び", "ぶ", "べ", "ぼ", "ぱ", "ぴ", "ぷ", "ぺ", "ぽ",
  "ま", "み", "む", "め", "も", "や", "ゆ", "よ",
  "ら", "り", "る", "れ", "ろ", "わ", "を", "ん",
];

const GOJUON_INDEX = new Map(GOJUON_MORA.map((mora, index) => [mora, index]));

/* Sortable key for a kana reading. Digraphs (きゃ, しゅ …) are read as one mora
   so they sort after their base kana rather than between unrelated rows. */
export function kanaToGojuonKey(kana: string) {
  const key: string[] = [];
  for (let index = 0; index < kana.length; index += 1) {
    const pair = kana.slice(index, index + 2);
    const mora = GOJUON_INDEX.has(pair) ? pair : kana[index];
    key.push(String(GOJUON_INDEX.get(mora) ?? GOJUON_MORA.length).padStart(3, "0"));
    if (mora === pair) index += 1;
  }
  return key.join("");
}
