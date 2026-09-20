/* Four Seasons Garden — lib/japanese/grammar.ts
   The explanations that sit behind the conjugation tables: one rule per
   (group × politeness × form), one worked example per form, one example per
   verb, and the two pattern tables that hang off the て-form.

   Rules resolve most-specific-first, so a shared rule can be written once under
   an `any` key and overridden only where a group actually behaves differently. */

import type { JapanesePart } from "@/lib/japanese/lesson";
import type { FormId, Politeness, Verb, VerbGroup } from "@/lib/japanese/verbs";

export type Example = { parts: JapanesePart[]; translation: string };

export type Rule = {
  title: string;
  formula: string;
  body: string;
  warnings?: string[];
};

/* ─────────── Rules ─────────── */

const MASU_SET = "ます / ません / ました / ませんでした";

const RULES: Record<string, Rule> = {
  /* — shared across every group — */
  "any:polite:te": {
    title: "There is no polite て-form",
    formula: "て-form is always plain",
    body:
      "This column is character-for-character identical to the plain one. て is a connector, not a finished verb, so it carries no politeness of its own. Politeness lands on whatever verb ends the sentence.",
    warnings: ["待っています is polite, 待っている is plain — the difference is います vs いる, never the て."],
  },
  "any:polite:conditional": {
    title: "ば has no polite form",
    formula: "plain stem + ば",
    body:
      "Conditional ば attaches to plain forms only. A polite ば does not exist and never has.",
    warnings: ["Put the politeness on the main clause instead: 早く起きれば、間に合います。"],
  },
  "any:polite:imperative": {
    title: "Polite speech has no imperative",
    formula: "て-form + ください  ·  お + い-stem + ください",
    body:
      "Japanese will not let you give a bare order politely — the two ideas cancel out. Requests are built from the て-form instead.",
    warnings: ["待ってください is the everyday request. お待ちください is the service-industry register."],
  },

  /* — godan, plain — */
  "godan:plain:nonpast": {
    title: "The dictionary form is the う base",
    formula: "stem + う-row kana",
    body:
      "Every godan verb ends in an う-row kana: く ぐ す む ぬ ぶ つ る う. That final kana is the whole verb's engine — it decides which of the five bases each other form reaches for.",
  },
  "godan:plain:negative": {
    title: "Negatives use the あ base",
    formula: "あ base + ない",
    body:
      "Slide the final kana down to its あ-row partner, then add ない. 書く → 書か → 書かない.",
    warnings: ["う-verbs take わ, not あ: 買う → 買わない. This is the single most-missed cell in the system."],
  },
  "godan:plain:past": {
    title: "Past uses a sound change, not a base",
    formula: "stem + いた / いだ / した / んだ / った",
    body:
      "The past tense is where godan verbs earn their reputation. The ending is not swapped for another kana in its row — it collapses into one of three euphonic changes, decided by which family the verb belongs to.",
    warnings: [
      "く→いた ・ ぐ→いだ ・ す→した",
      "む・ぬ・ぶ→んだ ・ つ・る・う→った",
      "行く is the exception: 行った, never 行いた.",
    ],
  },
  "godan:plain:pastNegative": {
    title: "Past negative is just ない in the past",
    formula: "あ base + なかった",
    body:
      "ない behaves like an い-adjective, and い-adjectives go past by swapping い → かった. No sound change is involved, so this cell is far easier than the plain past beside it.",
  },
  "godan:plain:te": {
    title: "て-form is the past form with た swapped for て",
    formula: "stem + いて / いで / して / んで / って",
    body:
      "The sound changes are identical to the past. Learn one and you have both: swap た→て and だ→で. This is the single highest-leverage fact in Japanese conjugation.",
    warnings: [
      "Negative て-form: ない → なくて (書かなくて), or 〜ないで for “without doing” (書かないで).",
    ],
  },
  "godan:plain:potential": {
    title: "Potential uses the え base",
    formula: "え base + る",
    body:
      "Slide the ending to its え-row partner and add る. 書く → 書け → 書ける, “can write”.",
    warnings: [
      "The result is a new ichidan verb. Conjugate it again: 書ける → 書けます / 書けない / 書けた / 書けて.",
      "Potential verbs mark their object with が, not を: 日本語が話せる。",
    ],
  },
  "godan:plain:volitional": {
    title: "Volitional uses the お base",
    formula: "お base + う",
    body:
      "The only form that reaches for the お row. 書く → 書こ → 書こう, “let's write / I think I'll write”.",
  },
  "godan:plain:conditional": {
    title: "Conditional shares the え base",
    formula: "え base + ば",
    body:
      "Same base as the potential and the imperative — three forms, one stem. 書く → 書け → 書けば, “if one writes”.",
  },
  "godan:plain:imperative": {
    title: "The imperative is the bare え base",
    formula: "え base, nothing added",
    body:
      "No suffix at all. The え-row kana on its own is already a command: 書け, 待て, 帰れ.",
    warnings: ["This is harsh — shouting, road signs, coaches, manga. Do not use it in conversation."],
  },
  "godan:plain:passive": {
    title: "Passive uses the あ base",
    formula: "あ base + れる",
    body:
      "Same base as the negative. 読む → 読ま → 読まれる, “is read”. Japanese also uses the passive to mark something done *to* you and against your interest, which has no clean English equivalent.",
    warnings: ["う-verbs take わ: 買う → 買われる.", "The result is a new ichidan verb and conjugates again."],
  },
  "godan:plain:causative": {
    title: "Causative uses the あ base",
    formula: "あ base + せる",
    body:
      "One form covers both “make someone do” and “let someone do”. Which one it means comes from context and from the particle on the person: を leans coercive, に leans permissive.",
    warnings: ["The result is a new ichidan verb and conjugates again."],
  },
  "godan:plain:causativePassive": {
    title: "Causative-passive stacks the two",
    formula: "あ base + される  ·  す-verbs: あ base + せられる",
    body:
      "Causative せ plus passive られる: “to be made to do”. Godan verbs contract せられる down to される, and the contraction is what people actually say.",
    warnings: ["す-verbs refuse to contract — 話さされる does not exist, because the さ sounds would collide. Only 話させられる."],
  },

  /* — godan, polite — */
  "godan:polite:nonpast": {
    title: "Polite forms live on the い base",
    formula: `い base + ${MASU_SET}`,
    body:
      "Slide the final kana to its い-row partner to get the polite stem, then add the ます set. 書く → 書き → 書きます. There are no exceptions, no sound changes, and no irregular verbs in this cell.",
  },
  "godan:polite:negative": {
    title: "Polite forms live on the い base",
    formula: `い base + ${MASU_SET}`,
    body:
      "Same い-row stem, different ending. 書き + ません. Notice that the polite negative needs no あ base at all — ない never appears in polite speech.",
  },
  "godan:polite:past": {
    title: "Polite forms live on the い base",
    formula: `い base + ${MASU_SET}`,
    body:
      "The polite past sidesteps the sound changes entirely: 書きました, not 書いました. All the euphonic trouble of the plain past simply does not exist here.",
  },
  "godan:polite:pastNegative": {
    title: "Polite forms live on the い base",
    formula: `い base + ${MASU_SET}`,
    body:
      "ません plus でした. Long, but completely regular for every verb in the language including する and 来る.",
  },
  "godan:polite:potential": {
    title: "Build the plain form first, then make it polite",
    formula: "え base + ます",
    body:
      "The potential 書ける is itself an ichidan verb, so it takes ます the way any ichidan verb does: drop る, add ます. 書ける → 書け → 書けます.",
  },
  "godan:polite:volitional": {
    title: "Volitional is the exception to the exception",
    formula: "い base + ましょう",
    body:
      "Every other polite form is built by conjugating the plain form — the volitional is not. It ignores the お base completely and uses the い-row polite stem plus ましょう.",
    warnings: ["書きましょう. Never 書こうます — that form does not exist."],
  },
  "godan:polite:passive": {
    title: "Build the plain form first, then make it polite",
    formula: "あ base + れます",
    body: "書かれる is an ichidan verb, so: drop る, add ます. 書かれる → 書かれ → 書かれます.",
  },
  "godan:polite:causative": {
    title: "Build the plain form first, then make it polite",
    formula: "あ base + せます",
    body: "書かせる is an ichidan verb, so: drop る, add ます. 書かせる → 書かせ → 書かせます.",
  },
  "godan:polite:causativePassive": {
    title: "Build the plain form first, then make it polite",
    formula: "あ base + されます  ·  す-verbs: あ base + せられます",
    body: "Take the contracted 書かされる and conjugate it as the ichidan verb it is.",
    warnings: ["す-verbs still refuse to contract: 話させられます."],
  },

  /* — ichidan — */
  "ichidan:plain:nonpast": {
    title: "Ichidan verbs end in る and drop it",
    formula: "stem + る",
    body:
      "Every ichidan verb ends in る preceded by an い-row or え-row kana — 見る, 起きる, 食べる, 寝る. Drop the る and you have a stem that never changes for any form in the language.",
    warnings: ["Some godan verbs look identical: 帰る, 入る, 走る, 知る, 切る, 要る. Those are learned, not deduced."],
  },
  "ichidan:plain:negative": { title: "Drop る, add ない", formula: "stem + ない", body: "見る → 見 → 見ない. No base swap, no sound change." },
  "ichidan:plain:past": {
    title: "Drop る, add た",
    formula: "stem + た",
    body:
      "Zero sound changes. This is the entire reason ichidan verbs are the easy group — た attaches directly to the same stem everything else uses.",
  },
  "ichidan:plain:pastNegative": { title: "Drop る, add なかった", formula: "stem + なかった", body: "ない going past as an い-adjective: ない → なかった." },
  "ichidan:plain:te": {
    title: "Drop る, add て",
    formula: "stem + て",
    body: "た and て attach to the same stem, so the past form and the て-form differ by exactly one character.",
    warnings: ["Negative て-form: 見なくて, or 見ないで for “without looking”."],
  },
  "ichidan:plain:potential": {
    title: "Potential and passive are the same form",
    formula: "stem + られる",
    body:
      "食べられる means both “can eat” and “is eaten”. Context decides, and native speakers live with the ambiguity rather than resolving it.",
    warnings: [
      "ら抜き言葉: casual speech drops the ら — 見れる, 食べれる — which conveniently separates potential from passive. Very common in speech, still marked wrong in writing and on tests.",
    ],
  },
  "ichidan:plain:volitional": { title: "Drop る, add よう", formula: "stem + よう", body: "食べる → 食べ → 食べよう, “let's eat”." },
  "ichidan:plain:conditional": { title: "Drop る, add れば", formula: "stem + れば", body: "見る → 見 → 見れば, “if one looks”." },
  "ichidan:plain:imperative": {
    title: "Drop る, add ろ",
    formula: "stem + ろ",
    body: "見ろ, 食べろ. As blunt as the godan imperative.",
    warnings: ["見よ / 食べよ are the literary variants — you will meet them in writing, not in conversation."],
  },
  "ichidan:plain:passive": {
    title: "Potential and passive are the same form",
    formula: "stem + られる",
    body:
      "Identical to the potential, with the same ambiguity. 弟にケーキを食べられた reads as “my brother ate my cake on me” — the passive doing the work of marking a nuisance.",
  },
  "ichidan:plain:causative": { title: "Drop る, add させる", formula: "stem + させる", body: "食べる → 食べ → 食べさせる, “make / let eat”." },
  "ichidan:plain:causativePassive": {
    title: "Drop る, add させられる",
    formula: "stem + させられる",
    body: "Causative させ plus passive られる.",
    warnings: ["Ichidan verbs never contract — 食べさされる does not exist."],
  },
  "ichidan:polite:nonpast": { title: "Drop る, add ます", formula: `stem + ${MASU_SET}`, body: "Same stem as every other ichidan form. 食べる → 食べ → 食べます." },
  "ichidan:polite:negative": { title: "Drop る, add ません", formula: `stem + ${MASU_SET}`, body: "食べ + ません. ない never appears in polite speech." },
  "ichidan:polite:past": { title: "Drop る, add ました", formula: `stem + ${MASU_SET}`, body: "食べ + ました." },
  "ichidan:polite:pastNegative": { title: "Drop る, add ませんでした", formula: `stem + ${MASU_SET}`, body: "食べ + ませんでした." },
  "ichidan:polite:potential": { title: "Build the plain form first", formula: "stem + られます", body: "食べられる is itself ichidan: drop る, add ます." },
  "ichidan:polite:volitional": {
    title: "Volitional uses the polite stem",
    formula: "stem + ましょう",
    body: "食べましょう, not 食べようます. Same exception as the godan group.",
  },
  "ichidan:polite:passive": { title: "Build the plain form first", formula: "stem + られます", body: "Identical to the polite potential, with the same ambiguity." },
  "ichidan:polite:causative": { title: "Build the plain form first", formula: "stem + させます", body: "食べさせる → 食べさせ → 食べさせます." },
  "ichidan:polite:causativePassive": { title: "Build the plain form first", formula: "stem + させられます", body: "食べさせられる conjugated politely." },

  /* — irregular — */
  "irregular:plain:nonpast": {
    title: "Memorise these two",
    formula: "する ・ 来る (くる)",
    body:
      "Japanese has exactly two irregular verbs, and they are the two most common verbs in the language. Everything you conjugate irregularly, you conjugate here.",
  },
  "irregular:plain:potential": {
    title: "する's potential is a different word",
    formula: "できる ・ 来られる (こられる)",
    body:
      "しられる does not exist. する borrows できる, which is why 日本語ができる means “can speak Japanese” and why できる is worth learning as vocabulary in its own right.",
  },
  "irregular:plain:imperative": {
    title: "しろ / せよ ・ 来い (こい)",
    formula: "しろ in speech, せよ in writing",
    body: "しろ is the spoken command; せよ survives in written instructions, exam papers and set phrases. 来い is a single syllable and correspondingly blunt.",
  },
  "irregular:any:any": {
    title: "Memorise these two",
    formula: "する ・ 来る",
    body:
      "There is no derivation to show. 来る shifts through こ / き / く across the paradigm while the kanji stays 来, so the furigana is the only thing telling you which reading a form takes.",
  },
};

export function ruleFor(group: VerbGroup, politeness: Politeness, formId: FormId): Rule {
  return (
    RULES[`${group}:${politeness}:${formId}`] ??
    RULES[`${group}:any:${formId}`] ??
    RULES[`any:${politeness}:${formId}`] ??
    RULES[`${group}:any:any`] ??
    RULES["irregular:any:any"]
  );
}

/* ─────────── One worked example per form ─────────── */

const jp = (...parts: Array<[string, string?]>): JapanesePart[] =>
  parts.map(([text, reading]) => (reading ? { text, reading } : { text }));

export const FORM_EXAMPLES: Record<FormId, Record<Politeness, Example>> = {
  nonpast: {
    plain: { parts: jp(["毎朝", "まいあさ"], ["　"], ["六時", "ろくじ"], ["に"], ["起", "お"], ["きる。"]), translation: "I get up at six every morning." },
    polite: { parts: jp(["毎朝", "まいあさ"], ["　"], ["六時", "ろくじ"], ["に"], ["起", "お"], ["きます。"]), translation: "I get up at six every morning." },
  },
  negative: {
    plain: { parts: jp(["今日", "きょう"], ["は"], ["学校", "がっこう"], ["に"], ["行", "い"], ["かない。"]), translation: "I'm not going to school today." },
    polite: { parts: jp(["今日", "きょう"], ["は"], ["学校", "がっこう"], ["に"], ["行", "い"], ["きません。"]), translation: "I'm not going to school today." },
  },
  past: {
    plain: { parts: jp(["昨日", "きのう"], ["　"], ["手紙", "てがみ"], ["を"], ["書", "か"], ["いた。"]), translation: "I wrote a letter yesterday." },
    polite: { parts: jp(["昨日", "きのう"], ["　"], ["手紙", "てがみ"], ["を"], ["書", "か"], ["きました。"]), translation: "I wrote a letter yesterday." },
  },
  pastNegative: {
    plain: { parts: jp(["週末", "しゅうまつ"], ["は　どこにも　"], ["行", "い"], ["かなかった。"]), translation: "I didn't go anywhere over the weekend." },
    polite: { parts: jp(["週末", "しゅうまつ"], ["は　どこにも　"], ["行", "い"], ["きませんでした。"]), translation: "I didn't go anywhere over the weekend." },
  },
  te: {
    plain: { parts: jp(["起", "お"], ["きて、"], ["顔", "かお"], ["を"], ["洗", "あら"], ["って、"], ["家", "いえ"], ["を"], ["出", "で"], ["た。"]), translation: "I got up, washed my face, and left the house." },
    polite: { parts: jp(["駅", "えき"], ["で"], ["友", "とも"], ["だちを"], ["待", "ま"], ["っています。"]), translation: "I'm waiting for a friend at the station. — the て is plain; います carries the politeness." },
  },
  potential: {
    plain: { parts: jp(["日本語", "にほんご"], ["が"], ["少", "すこ"], ["し"], ["話", "はな"], ["せる。"]), translation: "I can speak a little Japanese. — note が, not を." },
    polite: { parts: jp(["日本語", "にほんご"], ["が"], ["少", "すこ"], ["し"], ["話", "はな"], ["せます。"]), translation: "I can speak a little Japanese." },
  },
  volitional: {
    plain: { parts: jp(["そろそろ"], ["帰", "かえ"], ["ろう。"]), translation: "Let's head home soon." },
    polite: { parts: jp(["そろそろ"], ["帰", "かえ"], ["りましょう。"]), translation: "Shall we head home soon?" },
  },
  conditional: {
    plain: { parts: jp(["早", "はや"], ["く"], ["起", "お"], ["きれば、"], ["間", "ま"], ["に"], ["合", "あ"], ["う。"]), translation: "If you get up early, you'll make it." },
    polite: { parts: jp(["早", "はや"], ["く"], ["起", "お"], ["きれば、"], ["間", "ま"], ["に"], ["合", "あ"], ["います。"]), translation: "If you get up early, you'll make it. — the ば clause stays plain; only the final verb is polite." },
  },
  imperative: {
    plain: { parts: jp(["ちょっと"], ["待", "ま"], ["て。"]), translation: "Hold it. — blunt; fine between close friends, rude otherwise." },
    polite: { parts: jp(["ちょっと"], ["待", "ま"], ["ってください。"]), translation: "Please wait a moment. — the て-form request that replaces the imperative." },
  },
  passive: {
    plain: { parts: jp(["弟", "おとうと"], ["に"], ["ケーキを"], ["食", "た"], ["べられた。"]), translation: "My little brother ate my cake on me. — the passive marking a nuisance." },
    polite: { parts: jp(["弟", "おとうと"], ["に"], ["ケーキを"], ["食", "た"], ["べられました。"]), translation: "My little brother ate my cake on me." },
  },
  causative: {
    plain: { parts: jp(["先生", "せんせい"], ["は"], ["学生", "がくせい"], ["に"], ["本", "ほん"], ["を"], ["読", "よ"], ["ませた。"]), translation: "The teacher had the students read the book." },
    polite: { parts: jp(["先生", "せんせい"], ["は"], ["学生", "がくせい"], ["に"], ["本", "ほん"], ["を"], ["読", "よ"], ["ませました。"]), translation: "The teacher had the students read the book." },
  },
  causativePassive: {
    plain: { parts: jp(["母", "はは"], ["に"], ["野菜", "やさい"], ["を"], ["食", "た"], ["べさせられた。"]), translation: "I was made to eat vegetables by my mother." },
    polite: { parts: jp(["母", "はは"], ["に"], ["野菜", "やさい"], ["を"], ["食", "た"], ["べさせられました。"]), translation: "I was made to eat vegetables by my mother." },
  },
};

/* ─────────── One example per verb ─────────── */

export const VERB_EXAMPLES: Record<string, Example> = {
  kaku: { parts: jp(["毎日", "まいにち"], ["　"], ["日記", "にっき"], ["を"], ["書", "か"], ["きます。"]), translation: "I write in my diary every day." },
  oyogu: { parts: jp(["夏", "なつ"], ["は"], ["海", "うみ"], ["で"], ["泳", "およ"], ["ぎます。"]), translation: "In summer I swim in the sea." },
  hanasu: { parts: jp(["姉", "あね"], ["は"], ["英語", "えいご"], ["を"], ["話", "はな"], ["します。"]), translation: "My older sister speaks English." },
  yomu: { parts: jp(["寝", "ね"], ["る"], ["前", "まえ"], ["に"], ["本", "ほん"], ["を"], ["読", "よ"], ["みます。"]), translation: "I read a book before going to bed." },
  shinu: { parts: jp(["金魚", "きんぎょ"], ["が"], ["死", "し"], ["んでしまった。"]), translation: "The goldfish died — and I wish it hadn't." },
  asobu: { parts: jp(["子", "こ"], ["どもたちが"], ["公園", "こうえん"], ["で"], ["遊", "あそ"], ["んでいます。"]), translation: "The children are playing in the park." },
  matsu: { parts: jp(["駅", "えき"], ["で"], ["友", "とも"], ["だちを"], ["待", "ま"], ["っています。"]), translation: "I'm waiting for a friend at the station." },
  kaeru: { parts: jp(["六時", "ろくじ"], ["に"], ["家", "いえ"], ["に"], ["帰", "かえ"], ["ります。"]), translation: "I go home at six." },
  kau: { parts: jp(["コンビニで　お"], ["茶", "ちゃ"], ["を"], ["買", "か"], ["いました。"]), translation: "I bought tea at the convenience store." },
  iku: { parts: jp(["先週", "せんしゅう"], ["　"], ["京都", "きょうと"], ["に"], ["行", "い"], ["きました。"]), translation: "I went to Kyoto last week." },
  miru: { parts: jp(["週末", "しゅうまつ"], ["に"], ["映画", "えいが"], ["を"], ["見", "み"], ["ました。"]), translation: "I watched a film at the weekend." },
  okiru: { parts: jp(["今朝", "けさ"], ["は"], ["早", "はや"], ["く"], ["起", "お"], ["きました。"]), translation: "I got up early this morning." },
  kariru: { parts: jp(["図書館", "としょかん"], ["で"], ["本", "ほん"], ["を"], ["借", "か"], ["ります。"]), translation: "I borrow books at the library." },
  taberu: { parts: jp(["朝", "あさ"], ["ごはんを"], ["食", "た"], ["べませんでした。"]), translation: "I didn't eat breakfast." },
  neru: { parts: jp(["昨日", "きのう"], ["は"], ["十二時", "じゅうにじ"], ["に"], ["寝", "ね"], ["ました。"]), translation: "I went to bed at twelve last night." },
  oshieru: { parts: jp(["母", "はは"], ["は"], ["日本語", "にほんご"], ["を"], ["教", "おし"], ["えています。"]), translation: "My mother teaches Japanese." },
  suru: { parts: jp(["明日", "あした"], ["　"], ["買", "か"], ["い"], ["物", "もの"], ["を　します。"]), translation: "I'll go shopping tomorrow." },
  kuru: { parts: jp(["友", "とも"], ["だちが"], ["家", "いえ"], ["に"], ["来", "き"], ["ました。"]), translation: "A friend came to my house." },
};

/* ─────────── What the て-form unlocks ─────────── */

export type TePattern = {
  id: string;
  pattern: string;
  meaning: string;
  note: string;
  example: Example;
};

export const TE_PATTERNS: TePattern[] = [
  {
    id: "teiru",
    pattern: "〜ている",
    meaning: "ongoing action, or a resulting state",
    note:
      "The most common pattern in the language and the one that trips up English speakers: with action verbs it is a progressive (“is waiting”), but with change-of-state verbs it describes the state that followed (知っている = “knows”, not “is knowing”). Contracts to 〜てる in speech.",
    example: { parts: jp(["駅", "えき"], ["で"], ["待", "ま"], ["っています。"]), translation: "I'm waiting at the station." },
  },
  {
    id: "tekudasai",
    pattern: "〜てください",
    meaning: "please do",
    note: "The polite request that fills the hole where a polite imperative would be. Drop ください among friends and 待って on its own is still a request.",
    example: { parts: jp(["ちょっと"], ["待", "ま"], ["ってください。"]), translation: "Please wait a moment." },
  },
  {
    id: "temoii",
    pattern: "〜てもいい",
    meaning: "may do, is allowed to",
    note: "Literally “even if you do, it's fine”. As a question it asks permission: 帰ってもいいですか。",
    example: { parts: jp(["もう"], ["帰", "かえ"], ["ってもいいです。"]), translation: "You may go home now." },
  },
  {
    id: "tewaikenai",
    pattern: "〜てはいけない",
    meaning: "must not",
    note: "The prohibition counterpart of 〜てもいい. Contracts to 〜ちゃいけない in speech. Signs prefer the blunter 〜てはいけません or a bare noun.",
    example: { parts: jp(["ここに"], ["入", "はい"], ["ってはいけません。"]), translation: "You must not enter here." },
  },
  {
    id: "tekara",
    pattern: "〜てから",
    meaning: "after doing",
    note: "Marks strict sequence — B only happens once A is finished. Stronger than a plain て chain, which merely lists events in order.",
    example: { parts: jp(["食", "た"], ["べてから"], ["出", "で"], ["かけます。"]), translation: "I'll go out after I eat." },
  },
  {
    id: "temiru",
    pattern: "〜てみる",
    meaning: "try doing, do and see",
    note: "From 見る, “to see”. It means attempting something to find out what happens — not trying hard, which is 〜ようとする.",
    example: { parts: jp(["この"], ["本", "ほん"], ["を"], ["読", "よ"], ["んでみます。"]), translation: "I'll give this book a read." },
  },
  {
    id: "teshimau",
    pattern: "〜てしまう",
    meaning: "do completely, or do regrettably",
    note: "Two senses that share one form: finishing something off, or doing something you wish you hadn't. Contracts hard in speech — 〜ちゃう / 〜じゃう.",
    example: { parts: jp(["宿題", "しゅくだい"], ["を"], ["忘", "わす"], ["れてしまった。"]), translation: "I went and forgot my homework." },
  },
  {
    id: "teoku",
    pattern: "〜ておく",
    meaning: "do in advance, leave done",
    note: "Preparation for something later. Contracts to 〜とく in speech: 買っとく.",
    example: { parts: jp(["切符", "きっぷ"], ["を"], ["買", "か"], ["っておきます。"]), translation: "I'll buy the tickets in advance." },
  },
  {
    id: "techain",
    pattern: "A て、B",
    meaning: "and then — the plain chain",
    note: "Strings clauses together. Only the final verb carries tense and politeness, which is why the て-form itself never needs either.",
    example: { parts: jp(["起", "お"], ["きて、"], ["食", "た"], ["べて、"], ["出", "で"], ["かけた。"]), translation: "I got up, ate, and went out." },
  },
];

/* ─────────── Causative-passive ─────────── */

export function causativePassivePair(verb: Verb): { full: string; contracted: string | null; note: string } | null {
  if (verb.group === "ichidan") {
    return {
      full: `${verb.head}${verb.tail.slice(0, -1)}させられる`,
      contracted: null,
      note: "Ichidan verbs never contract.",
    };
  }
  if (verb.group === "irregular") {
    return verb.id === "suru"
      ? { full: "させられる", contracted: null, note: "Irregular — no contraction." }
      : { full: "来させられる", contracted: null, note: "Irregular — no contraction." };
  }
  const ending = verb.tail.slice(-1);
  const rows: Record<string, string> = {
    く: "か", ぐ: "が", す: "さ", む: "ま", ぬ: "な", ぶ: "ば", つ: "た", る: "ら", う: "わ",
  };
  const stem = verb.head + verb.tail.slice(0, -1) + rows[ending];
  return ending === "す"
    ? { full: `${stem}せられる`, contracted: null, note: "す-verbs cannot contract — 話さされる would collide with its own さ." }
    : { full: `${stem}せられる`, contracted: `${stem}される`, note: "The contracted form is the one people actually say." };
}
