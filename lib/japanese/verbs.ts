/* Four Seasons Garden — lib/japanese/verbs.ts
   The Japanese verb system as data plus a conjugator.

   Every cell the Pond renders is derived here rather than transcribed, so a
   cell can always explain itself: `conjugate()` returns the finished form AND
   the pieces it was built from (stem, kana base, suffix), which is what the
   detail view shows. Irregulars are the only hand-written paradigms. */

import type { JapanesePart } from "@/lib/japanese/lesson";

export type VerbGroup = "godan" | "ichidan" | "irregular";
export type Politeness = "plain" | "polite";

export type FormId =
  | "nonpast"
  | "negative"
  | "past"
  | "pastNegative"
  | "te"
  | "potential"
  | "volitional"
  | "conditional"
  | "imperative"
  | "passive"
  | "causative"
  | "causativePassive";

/* stem = the part that never moves · base = the kana row swap godan verbs make
   · sound = the euphonic change that drives て/た · suffix = what is bolted on */
export type SegmentRole = "stem" | "base" | "sound" | "suffix";

export type Segment = {
  text: string;
  reading: string;
  role: SegmentRole;
  label: string;
};

/* English principal parts, so a gloss can be built for any form instead of
   hand-writing one per verb per form. `intransitive` is here because the
   passive is the one template that lies without it: 死なれる is not "is died",
   it is the adversative "have someone die on you". */
export type EnglishVerb = {
  base: string;
  third: string;
  past: string;
  participle: string;
  intransitive?: boolean;
};

export type Verb = {
  id: string;
  /* dict === head + tail, reading === headReading + tail. Conjugation only ever
     rewrites `tail`, which keeps kanji and furigana in sync for free. */
  head: string;
  headReading: string;
  tail: string;
  meaning: string;
  english: EnglishVerb;
  group: VerbGroup;
  /* 行く is the one godan verb whose て/た ignores its ending. */
  soundException?: { te: string; ta: string };
  notes?: string[];
};

export type Cell = {
  formId: FormId;
  politeness: Politeness;
  available: boolean;
  text: string;
  reading: string;
  parts: JapanesePart[];
  segments: Segment[];
  /* Set when a form simply does not exist at this politeness level. */
  unavailable?: { reason: string; instead: string };
  /* True for the polite て column, which is the plain column character for
     character — worth saying out loud rather than letting it look coincidental. */
  sameAsPlain?: boolean;
};

/* ─────────── Forms ─────────── */

export type FormMeta = {
  id: FormId;
  label: string;
  japanese: string;
  column: string;
  gloss: string;
  tier: "core" | "extended";
};

export const FORMS: FormMeta[] = [
  { id: "nonpast", label: "Non-past", japanese: "辞書形", column: "now", gloss: "do / will do", tier: "core" },
  { id: "negative", label: "Negative", japanese: "否定", column: "negative", gloss: "does not do", tier: "core" },
  { id: "past", label: "Past", japanese: "過去", column: "past", gloss: "did", tier: "core" },
  { id: "pastNegative", label: "Past negative", japanese: "過去否定", column: "past neg.", gloss: "did not do", tier: "core" },
  { id: "te", label: "て-form", japanese: "て形", column: "て-form", gloss: "connector — no meaning alone", tier: "core" },
  { id: "potential", label: "Potential", japanese: "可能形", column: "potential", gloss: "can do", tier: "extended" },
  { id: "volitional", label: "Volitional", japanese: "意向形", column: "volitional", gloss: "let's / shall we", tier: "extended" },
  { id: "conditional", label: "Conditional ば", japanese: "条件形", column: "if …ば", gloss: "if one does", tier: "extended" },
  { id: "imperative", label: "Imperative", japanese: "命令形", column: "imperative", gloss: "do it — blunt", tier: "extended" },
  { id: "passive", label: "Passive", japanese: "受身形", column: "passive", gloss: "is done to", tier: "extended" },
  { id: "causative", label: "Causative", japanese: "使役形", column: "causative", gloss: "make / let do", tier: "extended" },
  { id: "causativePassive", label: "Causative-passive", japanese: "使役受身形", column: "made to", gloss: "be made to do", tier: "extended" },
];

export const FORM_BY_ID = new Map(FORMS.map((form) => [form.id, form]));
export const CORE_FORMS = FORMS.filter((form) => form.tier === "core").map((form) => form.id);
export const EXTENDED_FORMS = FORMS.filter((form) => form.tier === "extended").map((form) => form.id);

/* ─────────── Kana tables ─────────── */

type Row = { a: string; i: string; u: string; e: string; o: string };

/* The five bases, keyed by dictionary ending. う takes わ in the あ base — the
   single most-missed cell in the whole system. */
export const GODAN_ROWS: Record<string, Row> = {
  く: { a: "か", i: "き", u: "く", e: "け", o: "こ" },
  ぐ: { a: "が", i: "ぎ", u: "ぐ", e: "げ", o: "ご" },
  す: { a: "さ", i: "し", u: "す", e: "せ", o: "そ" },
  む: { a: "ま", i: "み", u: "む", e: "め", o: "も" },
  ぬ: { a: "な", i: "に", u: "ぬ", e: "ね", o: "の" },
  ぶ: { a: "ば", i: "び", u: "ぶ", e: "べ", o: "ぼ" },
  つ: { a: "た", i: "ち", u: "つ", e: "て", o: "と" },
  る: { a: "ら", i: "り", u: "る", e: "れ", o: "ろ" },
  う: { a: "わ", i: "い", u: "う", e: "え", o: "お" },
};

/* て and た are the same change with the last kana swapped. */
const GODAN_SOUND: Record<string, { te: string; ta: string }> = {
  く: { te: "いて", ta: "いた" },
  ぐ: { te: "いで", ta: "いだ" },
  す: { te: "して", ta: "した" },
  む: { te: "んで", ta: "んだ" },
  ぬ: { te: "んで", ta: "んだ" },
  ぶ: { te: "んで", ta: "んだ" },
  つ: { te: "って", ta: "った" },
  る: { te: "って", ta: "った" },
  う: { te: "って", ta: "った" },
};

export type FamilyId = "i" | "n" | "tsu";

export type Family = {
  id: FamilyId;
  endings: string[];
  label: string;
  change: string;
  blurb: string;
};

/* Godan verbs split into exactly three て/た families. Nothing else about a
   godan verb varies, so this is the only grouping worth memorising. */
export const FAMILIES: Family[] = [
  {
    id: "i",
    endings: ["く", "ぐ", "す"],
    label: "い・し family",
    change: "く→いて ・ ぐ→いで ・ す→して",
    blurb: "The ending softens to い (and す keeps its し). ぐ drags its voicing onto the て, giving で.",
  },
  {
    id: "n",
    endings: ["む", "ぬ", "ぶ"],
    label: "ん family",
    change: "む・ぬ・ぶ → んで",
    blurb: "All three nasal endings collapse to ん, and the voicing turns て into で.",
  },
  {
    id: "tsu",
    endings: ["つ", "る", "う"],
    label: "っ family",
    change: "つ・る・う → って",
    blurb: "The ending clips into a glottal stop. Three different endings, one identical result.",
  },
];

export const FAMILY_BY_ENDING = new Map<string, Family>(
  FAMILIES.flatMap((family) => family.endings.map((ending) => [ending, family] as const)),
);

export function familyOf(verb: Verb) {
  if (verb.group !== "godan") return undefined;
  return FAMILY_BY_ENDING.get(verb.tail.slice(-1));
}

export function endingOf(verb: Verb) {
  return verb.tail.slice(-1);
}

/* ─────────── The verbs ─────────── */

export const VERBS: Verb[] = [
  { id: "kaku", head: "書", headReading: "か", tail: "く", meaning: "to write", english: { base: "write", third: "writes", past: "wrote", participle: "written" }, group: "godan" },
  { id: "oyogu", head: "泳", headReading: "およ", tail: "ぐ", meaning: "to swim", english: { base: "swim", third: "swims", past: "swam", participle: "swum", intransitive: true }, group: "godan" },
  { id: "hanasu", head: "話", headReading: "はな", tail: "す", meaning: "to speak", english: { base: "speak", third: "speaks", past: "spoke", participle: "spoken" }, group: "godan",
    notes: ["す-verbs are the one godan family whose causative-passive never contracts."] },
  { id: "yomu", head: "読", headReading: "よ", tail: "む", meaning: "to read", english: { base: "read", third: "reads", past: "read", participle: "read" }, group: "godan" },
  { id: "shinu", head: "死", headReading: "し", tail: "ぬ", meaning: "to die", english: { base: "die", third: "dies", past: "died", participle: "died", intransitive: true }, group: "godan",
    notes: ["死ぬ is the only ぬ verb left in modern Japanese. Learn it and you have learned the entire ぬ row."] },
  { id: "asobu", head: "遊", headReading: "あそ", tail: "ぶ", meaning: "to play", english: { base: "play", third: "plays", past: "played", participle: "played", intransitive: true }, group: "godan" },
  { id: "matsu", head: "待", headReading: "ま", tail: "つ", meaning: "to wait", english: { base: "wait", third: "waits", past: "waited", participle: "waited for" }, group: "godan" },
  { id: "kaeru", head: "帰", headReading: "かえ", tail: "る", meaning: "to go home", english: { base: "go home", third: "goes home", past: "went home", participle: "gone home", intransitive: true }, group: "godan",
    notes: ["Ends in る but is godan: 帰らない, never 帰ない. The other common impostors are 入る, 走る, 知る, 切る, 要る."] },
  { id: "kau", head: "買", headReading: "か", tail: "う", meaning: "to buy", english: { base: "buy", third: "buys", past: "bought", participle: "bought" }, group: "godan" },
  { id: "iku", head: "行", headReading: "い", tail: "く", meaning: "to go", english: { base: "go", third: "goes", past: "went", participle: "gone", intransitive: true }, group: "godan",
    soundException: { te: "って", ta: "った" },
    notes: ["The one irregular godan verb. Its ending is く but its sound change is the っ one: 行って / 行った, never 行いて."] },

  { id: "miru", head: "見", headReading: "み", tail: "る", meaning: "to see, to watch", english: { base: "see", third: "sees", past: "saw", participle: "seen" }, group: "ichidan" },
  { id: "okiru", head: "起", headReading: "お", tail: "きる", meaning: "to get up", english: { base: "get up", third: "gets up", past: "got up", participle: "gotten up", intransitive: true }, group: "ichidan" },
  { id: "kariru", head: "借", headReading: "か", tail: "りる", meaning: "to borrow", english: { base: "borrow", third: "borrows", past: "borrowed", participle: "borrowed" }, group: "ichidan" },
  { id: "taberu", head: "食", headReading: "た", tail: "べる", meaning: "to eat", english: { base: "eat", third: "eats", past: "ate", participle: "eaten" }, group: "ichidan" },
  { id: "neru", head: "寝", headReading: "ね", tail: "る", meaning: "to sleep", english: { base: "sleep", third: "sleeps", past: "slept", participle: "slept", intransitive: true }, group: "ichidan" },
  { id: "oshieru", head: "教", headReading: "おし", tail: "える", meaning: "to teach", english: { base: "teach", third: "teaches", past: "taught", participle: "taught" }, group: "ichidan" },

  { id: "suru", head: "", headReading: "", tail: "する", meaning: "to do", english: { base: "do", third: "does", past: "did", participle: "done" }, group: "irregular",
    notes: ["Fuses with nouns to make verbs: 勉強する, 待ち合わせする, 電話する. Conjugate the する and the noun rides along."] },
  { id: "kuru", head: "来", headReading: "く", tail: "る", meaning: "to come", english: { base: "come", third: "comes", past: "came", participle: "come", intransitive: true }, group: "irregular",
    notes: ["The reading shifts between こ, き and く across the paradigm while the kanji stays 来 — the writing hides the change, so track the furigana."] },
];

export const VERB_BY_ID = new Map(VERBS.map((verb) => [verb.id, verb]));

/* ─────────── Conjugator ─────────── */

type Piece = { kana: string; role: SegmentRole; label: string };

const p = (kana: string, role: SegmentRole, label: string): Piece => ({ kana, role, label });

function assemble(
  verb: Verb,
  formId: FormId,
  politeness: Politeness,
  pieces: Piece[],
  headReading = verb.headReading,
): Cell {
  const tail = pieces.map((piece) => piece.kana).join("");
  const text = verb.head + tail;
  const reading = headReading + tail;
  const parts: JapanesePart[] = verb.head
    ? [{ text: verb.head, reading: headReading }, { text: tail }]
    : [{ text: tail }];

  /* The first piece always carries the stem, so the kanji head rides with it
     and the breakdown reads left to right as the written word does. */
  const segments = pieces.map((piece, index) =>
    index === 0
      ? { text: verb.head + piece.kana, reading: headReading + piece.kana, role: piece.role, label: piece.label }
      : { text: piece.kana, reading: piece.kana, role: piece.role, label: piece.label },
  );

  return { formId, politeness, available: true, text, reading, parts, segments };
}

function blocked(formId: FormId, politeness: Politeness, reason: string, instead: string): Cell {
  return {
    formId,
    politeness,
    available: false,
    text: "—",
    reading: "",
    parts: [{ text: "—" }],
    segments: [],
    unavailable: { reason, instead },
  };
}

const NO_POLITE_CONDITIONAL = {
  reason: "ば attaches to plain forms only. There is no polite conditional.",
  instead: "Keep the ば clause plain and let the final verb carry the politeness: 早く起きれば、間に合います。",
};

const NO_POLITE_IMPERATIVE = {
  reason: "Polite speech has no imperative. Ordering someone around politely is a contradiction the grammar refuses to make.",
  instead: "Use て-form + ください, or the more formal お + い-row stem + ください: 待ってください / お待ちください。",
};

function godanCell(verb: Verb, formId: FormId, politeness: Politeness): Cell {
  const ending = endingOf(verb);
  const stemKana = verb.tail.slice(0, -1);
  const row = GODAN_ROWS[ending];
  const sound = verb.soundException ?? GODAN_SOUND[ending];
  const stem = p(stemKana, "stem", "unchanging stem");
  const a = p(row.a, "base", `あ base — ${ending} → ${row.a}`);
  const i = p(row.i, "base", `い base — ${ending} → ${row.i}`);
  const e = p(row.e, "base", `え base — ${ending} → ${row.e}`);
  const o = p(row.o, "base", `お base — ${ending} → ${row.o}`);
  const teSound = p(sound.te, "sound", `sound change — ${ending} → ${sound.te}`);
  const taSound = p(sound.ta, "sound", `sound change — ${ending} → ${sound.ta}`);
  const make = (pieces: Piece[]) => assemble(verb, formId, politeness, pieces);

  if (politeness === "plain") {
    switch (formId) {
      case "nonpast": return make([stem, p(row.u, "base", "う base — the dictionary form itself")]);
      case "negative": return make([stem, a, p("ない", "suffix", "plain negative")]);
      case "past": return make([stem, taSound]);
      case "pastNegative": return make([stem, a, p("なかった", "suffix", "negative ない → past なかった")]);
      case "te": return make([stem, teSound]);
      case "potential": return make([stem, e, p("る", "suffix", "potential — becomes a new ichidan verb")]);
      case "volitional": return make([stem, o, p("う", "suffix", "volitional")]);
      case "conditional": return make([stem, e, p("ば", "suffix", "conditional")]);
      case "imperative": return make([stem, p(row.e, "base", `え base — bare, nothing is added`)]);
      case "passive": return make([stem, a, p("れる", "suffix", "passive — becomes a new ichidan verb")]);
      case "causative": return make([stem, a, p("せる", "suffix", "causative — becomes a new ichidan verb")]);
      case "causativePassive":
        return ending === "す"
          ? make([stem, a, p("せられる", "suffix", "causative せ + passive られる — す-verbs never contract")])
          : make([stem, a, p("される", "suffix", "contracted from せられる — this is what people say")]);
    }
  }

  switch (formId) {
    case "nonpast": return make([stem, i, p("ます", "suffix", "polite non-past")]);
    case "negative": return make([stem, i, p("ません", "suffix", "polite negative")]);
    case "past": return make([stem, i, p("ました", "suffix", "polite past")]);
    case "pastNegative": return make([stem, i, p("ませんでした", "suffix", "polite past negative")]);
    case "te": return { ...make([stem, teSound]), sameAsPlain: true };
    case "potential": return make([stem, e, p("ます", "suffix", "built on the plain potential 〜える")]);
    case "volitional": return make([stem, i, p("ましょう", "suffix", "い base, not お — the one polite form that breaks the pattern")]);
    case "conditional": return blocked(formId, politeness, NO_POLITE_CONDITIONAL.reason, NO_POLITE_CONDITIONAL.instead);
    case "imperative": return blocked(formId, politeness, NO_POLITE_IMPERATIVE.reason, NO_POLITE_IMPERATIVE.instead);
    case "passive": return make([stem, a, p("れます", "suffix", "built on the plain passive 〜あれる")]);
    case "causative": return make([stem, a, p("せます", "suffix", "built on the plain causative 〜あせる")]);
    case "causativePassive":
      return ending === "す"
        ? make([stem, a, p("せられます", "suffix", "す-verbs never contract")])
        : make([stem, a, p("されます", "suffix", "contracted from せられます")]);
  }
}

function ichidanCell(verb: Verb, formId: FormId, politeness: Politeness): Cell {
  const stemKana = verb.tail.slice(0, -1);
  const stem = p(stemKana, "stem", "drop る — everything attaches here");
  const make = (suffix: string, label: string) => assemble(verb, formId, politeness, [stem, p(suffix, "suffix", label)]);

  if (politeness === "plain") {
    switch (formId) {
      case "nonpast": return assemble(verb, formId, politeness, [stem, p("る", "base", "dictionary る")]);
      case "negative": return make("ない", "plain negative");
      case "past": return make("た", "plain past — no sound change, ever");
      case "pastNegative": return make("なかった", "negative ない → past なかった");
      case "te": return make("て", "て-form — same stem as た");
      case "potential": return make("られる", "potential — identical to the passive");
      case "volitional": return make("よう", "volitional");
      case "conditional": return make("れば", "conditional");
      case "imperative": return make("ろ", "imperative — 〜よ is the literary variant");
      case "passive": return make("られる", "passive — identical to the potential");
      case "causative": return make("させる", "causative");
      case "causativePassive": return make("させられる", "causative させ + passive られる — ichidan never contracts");
    }
  }

  switch (formId) {
    case "nonpast": return make("ます", "polite non-past");
    case "negative": return make("ません", "polite negative");
    case "past": return make("ました", "polite past");
    case "pastNegative": return make("ませんでした", "polite past negative");
    case "te": return { ...make("て", "て-form — unchanged by politeness"), sameAsPlain: true };
    case "potential": return make("られます", "built on the plain potential 〜られる");
    case "volitional": return make("ましょう", "stem + ましょう");
    case "conditional": return blocked(formId, politeness, NO_POLITE_CONDITIONAL.reason, NO_POLITE_CONDITIONAL.instead);
    case "imperative": return blocked(formId, politeness, NO_POLITE_IMPERATIVE.reason, NO_POLITE_IMPERATIVE.instead);
    case "passive": return make("られます", "built on the plain passive 〜られる");
    case "causative": return make("させます", "built on the plain causative 〜させる");
    case "causativePassive": return make("させられます", "causative させ + passive られます");
  }
}

/* する and 来る are written out rather than derived: there is no rule to encode,
   which is the whole point of calling them irregular. */
const SURU: Record<Politeness, Partial<Record<FormId, [string, string, string]>>> = {
  plain: {
    nonpast: ["す", "る", "dictionary form"],
    negative: ["し", "ない", "し stem"],
    past: ["し", "た", "し stem"],
    pastNegative: ["し", "なかった", "し stem"],
    te: ["し", "て", "し stem — follows した"],
    potential: ["でき", "る", "a different word entirely — not しられる"],
    volitional: ["し", "よう", "し stem"],
    conditional: ["す", "れば", "す stem"],
    imperative: ["し", "ろ", "しろ in speech, せよ in writing"],
    passive: ["さ", "れる", "さ stem"],
    causative: ["さ", "せる", "さ stem"],
    causativePassive: ["さ", "せられる", "さ stem"],
  },
  polite: {
    nonpast: ["し", "ます", "し stem"],
    negative: ["し", "ません", "し stem"],
    past: ["し", "ました", "し stem"],
    pastNegative: ["し", "ませんでした", "し stem"],
    te: ["し", "て", "て-form — unchanged by politeness"],
    potential: ["でき", "ます", "できる conjugated politely"],
    volitional: ["し", "ましょう", "し stem"],
    passive: ["さ", "れます", "さ stem"],
    causative: ["さ", "せます", "さ stem"],
    causativePassive: ["さ", "せられます", "さ stem"],
  },
};

const KURU: Record<Politeness, Partial<Record<FormId, [string, string]>>> = {
  plain: {
    nonpast: ["く", "る"],
    negative: ["こ", "ない"],
    past: ["き", "た"],
    pastNegative: ["こ", "なかった"],
    te: ["き", "て"],
    potential: ["こ", "られる"],
    volitional: ["こ", "よう"],
    conditional: ["く", "れば"],
    imperative: ["こ", "い"],
    passive: ["こ", "られる"],
    causative: ["こ", "させる"],
    causativePassive: ["こ", "させられる"],
  },
  polite: {
    nonpast: ["き", "ます"],
    negative: ["き", "ません"],
    past: ["き", "ました"],
    pastNegative: ["き", "ませんでした"],
    te: ["き", "て"],
    potential: ["こ", "られます"],
    volitional: ["き", "ましょう"],
    passive: ["こ", "られます"],
    causative: ["こ", "させます"],
    causativePassive: ["こ", "させられます"],
  },
};

function irregularCell(verb: Verb, formId: FormId, politeness: Politeness): Cell {
  if (verb.id === "suru") {
    const entry = SURU[politeness][formId];
    if (!entry) {
      const gap = formId === "conditional" ? NO_POLITE_CONDITIONAL : NO_POLITE_IMPERATIVE;
      return blocked(formId, politeness, gap.reason, gap.instead);
    }
    const [stem, suffix, label] = entry;
    const cell = assemble(verb, formId, politeness, [
      p(stem, "stem", label),
      p(suffix, "suffix", FORM_BY_ID.get(formId)?.label ?? ""),
    ]);
    return formId === "te" && politeness === "polite" ? { ...cell, sameAsPlain: true } : cell;
  }

  const entry = KURU[politeness][formId];
  if (!entry) {
    const gap = formId === "conditional" ? NO_POLITE_CONDITIONAL : NO_POLITE_IMPERATIVE;
    return blocked(formId, politeness, gap.reason, gap.instead);
  }
  const [reading, suffix] = entry;
  const cell = assemble(
    verb,
    formId,
    politeness,
    [
      p("", "stem", `来 reads ${reading} here`),
      p(suffix, "suffix", FORM_BY_ID.get(formId)?.label ?? ""),
    ],
    reading,
  );
  return formId === "te" && politeness === "polite" ? { ...cell, sameAsPlain: true } : cell;
}

/* One template per form. Politeness is not a semantic difference in English —
   書きます and 書く both gloss as "writes" — so a gloss depends only on the verb
   and the form. */
const GLOSS: Record<FormId, (english: EnglishVerb) => string> = {
  nonpast: (e) => e.third,
  negative: (e) => `does not ${e.base}`,
  past: (e) => e.past,
  pastNegative: (e) => `did not ${e.base}`,
  te: (e) => `${e.base} and …`,
  potential: (e) => `can ${e.base}`,
  volitional: (e) => `let's ${e.base}`,
  conditional: (e) => `if … ${e.third}`,
  imperative: (e) => `${e.base}!`,
  passive: (e) => (e.intransitive ? `have … ${e.base}` : `is ${e.participle}`),
  causative: (e) => `make … ${e.base}`,
  causativePassive: (e) => `be made to ${e.base}`,
};

export function glossFor(verb: Verb, formId: FormId) {
  return GLOSS[formId](verb.english);
}

export function conjugate(verb: Verb, formId: FormId, politeness: Politeness): Cell {
  if (verb.group === "godan") return godanCell(verb, formId, politeness);
  if (verb.group === "ichidan") return ichidanCell(verb, formId, politeness);
  return irregularCell(verb, formId, politeness);
}
