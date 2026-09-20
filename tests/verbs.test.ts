import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VERBS,
  VERB_BY_ID,
  conjugate,
  glossFor,
  type FormId,
  type Politeness,
} from "../lib/japanese/verbs.ts";
import { causativePassivePair } from "../lib/japanese/grammar.ts";

const CORE: FormId[] = ["nonpast", "negative", "past", "pastNegative", "te"];
const EXTENDED: FormId[] = ["potential", "volitional", "conditional", "imperative", "passive", "causative"];

function check(politeness: Politeness, forms: FormId[], table: Record<string, string[]>) {
  for (const [verbId, expected] of Object.entries(table)) {
    const verb = VERB_BY_ID.get(verbId);
    assert.ok(verb, `unknown verb ${verbId}`);
    forms.forEach((formId, index) => {
      const cell = conjugate(verb, formId, politeness);
      assert.equal(cell.text, expected[index], `${verbId} · ${politeness} · ${formId}`);
    });
  }
}

/* Every expected string below is transcribed from the reference tables the
   page was built to teach, so a conjugator regression fails here first. */

test("godan · polite · core forms", () => {
  check("polite", CORE, {
    kaku:    ["書きます", "書きません", "書きました", "書きませんでした", "書いて"],
    oyogu:   ["泳ぎます", "泳ぎません", "泳ぎました", "泳ぎませんでした", "泳いで"],
    hanasu:  ["話します", "話しません", "話しました", "話しませんでした", "話して"],
    yomu:    ["読みます", "読みません", "読みました", "読みませんでした", "読んで"],
    shinu:   ["死にます", "死にません", "死にました", "死にませんでした", "死んで"],
    asobu:   ["遊びます", "遊びません", "遊びました", "遊びませんでした", "遊んで"],
    matsu:   ["待ちます", "待ちません", "待ちました", "待ちませんでした", "待って"],
    kaeru:   ["帰ります", "帰りません", "帰りました", "帰りませんでした", "帰って"],
    kau:     ["買います", "買いません", "買いました", "買いませんでした", "買って"],
  });
});

test("godan · plain · core forms", () => {
  check("plain", CORE, {
    kaku:    ["書く", "書かない", "書いた", "書かなかった", "書いて"],
    oyogu:   ["泳ぐ", "泳がない", "泳いだ", "泳がなかった", "泳いで"],
    hanasu:  ["話す", "話さない", "話した", "話さなかった", "話して"],
    yomu:    ["読む", "読まない", "読んだ", "読まなかった", "読んで"],
    shinu:   ["死ぬ", "死なない", "死んだ", "死ななかった", "死んで"],
    asobu:   ["遊ぶ", "遊ばない", "遊んだ", "遊ばなかった", "遊んで"],
    matsu:   ["待つ", "待たない", "待った", "待たなかった", "待って"],
    kaeru:   ["帰る", "帰らない", "帰った", "帰らなかった", "帰って"],
    kau:     ["買う", "買わない", "買った", "買わなかった", "買って"],
  });
});

test("godan · plain · remaining forms", () => {
  check("plain", EXTENDED, {
    kaku:   ["書ける", "書こう", "書けば", "書け", "書かれる", "書かせる"],
    oyogu:  ["泳げる", "泳ごう", "泳げば", "泳げ", "泳がれる", "泳がせる"],
    hanasu: ["話せる", "話そう", "話せば", "話せ", "話される", "話させる"],
    yomu:   ["読める", "読もう", "読めば", "読め", "読まれる", "読ませる"],
    shinu:  ["死ねる", "死のう", "死ねば", "死ね", "死なれる", "死なせる"],
    asobu:  ["遊べる", "遊ぼう", "遊べば", "遊べ", "遊ばれる", "遊ばせる"],
    matsu:  ["待てる", "待とう", "待てば", "待て", "待たれる", "待たせる"],
    kaeru:  ["帰れる", "帰ろう", "帰れば", "帰れ", "帰られる", "帰らせる"],
    kau:    ["買える", "買おう", "買えば", "買え", "買われる", "買わせる"],
  });
});

test("godan · polite · remaining forms", () => {
  check("polite", ["potential", "volitional", "passive", "causative"], {
    kaku:   ["書けます", "書きましょう", "書かれます", "書かせます"],
    oyogu:  ["泳げます", "泳ぎましょう", "泳がれます", "泳がせます"],
    hanasu: ["話せます", "話しましょう", "話されます", "話させます"],
    yomu:   ["読めます", "読みましょう", "読まれます", "読ませます"],
    shinu:  ["死ねます", "死にましょう", "死なれます", "死なせます"],
    asobu:  ["遊べます", "遊びましょう", "遊ばれます", "遊ばせます"],
    matsu:  ["待てます", "待ちましょう", "待たれます", "待たせます"],
    kaeru:  ["帰れます", "帰りましょう", "帰られます", "帰らせます"],
    kau:    ["買えます", "買いましょう", "買われます", "買わせます"],
  });
});

test("ichidan · polite and plain · core forms", () => {
  check("polite", CORE, {
    miru:    ["見ます", "見ません", "見ました", "見ませんでした", "見て"],
    okiru:   ["起きます", "起きません", "起きました", "起きませんでした", "起きて"],
    kariru:  ["借ります", "借りません", "借りました", "借りませんでした", "借りて"],
    taberu:  ["食べます", "食べません", "食べました", "食べませんでした", "食べて"],
    neru:    ["寝ます", "寝ません", "寝ました", "寝ませんでした", "寝て"],
    oshieru: ["教えます", "教えません", "教えました", "教えませんでした", "教えて"],
  });
  check("plain", CORE, {
    miru:    ["見る", "見ない", "見た", "見なかった", "見て"],
    okiru:   ["起きる", "起きない", "起きた", "起きなかった", "起きて"],
    kariru:  ["借りる", "借りない", "借りた", "借りなかった", "借りて"],
    taberu:  ["食べる", "食べない", "食べた", "食べなかった", "食べて"],
    neru:    ["寝る", "寝ない", "寝た", "寝なかった", "寝て"],
    oshieru: ["教える", "教えない", "教えた", "教えなかった", "教えて"],
  });
});

test("ichidan · remaining forms", () => {
  check("plain", EXTENDED, {
    miru:    ["見られる", "見よう", "見れば", "見ろ", "見られる", "見させる"],
    okiru:   ["起きられる", "起きよう", "起きれば", "起きろ", "起きられる", "起きさせる"],
    kariru:  ["借りられる", "借りよう", "借りれば", "借りろ", "借りられる", "借りさせる"],
    taberu:  ["食べられる", "食べよう", "食べれば", "食べろ", "食べられる", "食べさせる"],
    neru:    ["寝られる", "寝よう", "寝れば", "寝ろ", "寝られる", "寝させる"],
    oshieru: ["教えられる", "教えよう", "教えれば", "教えろ", "教えられる", "教えさせる"],
  });
  check("polite", ["potential", "volitional", "passive", "causative"], {
    miru:    ["見られます", "見ましょう", "見られます", "見させます"],
    okiru:   ["起きられます", "起きましょう", "起きられます", "起きさせます"],
    kariru:  ["借りられます", "借りましょう", "借りられます", "借りさせます"],
    taberu:  ["食べられます", "食べましょう", "食べられます", "食べさせます"],
    neru:    ["寝られます", "寝ましょう", "寝られます", "寝させます"],
    oshieru: ["教えられます", "教えましょう", "教えられます", "教えさせます"],
  });
});

test("ichidan potential and passive are the same form", () => {
  for (const verbId of ["miru", "taberu", "oshieru"]) {
    const verb = VERB_BY_ID.get(verbId)!;
    assert.equal(
      conjugate(verb, "potential", "plain").text,
      conjugate(verb, "passive", "plain").text,
    );
  }
});

test("irregular · する and 来る", () => {
  check("polite", CORE, {
    suru: ["します", "しません", "しました", "しませんでした", "して"],
    kuru: ["来ます", "来ません", "来ました", "来ませんでした", "来て"],
  });
  check("plain", CORE, {
    suru: ["する", "しない", "した", "しなかった", "して"],
    kuru: ["来る", "来ない", "来た", "来なかった", "来て"],
  });
  check("plain", EXTENDED, {
    suru: ["できる", "しよう", "すれば", "しろ", "される", "させる"],
    kuru: ["来られる", "来よう", "来れば", "来い", "来られる", "来させる"],
  });
  check("polite", ["potential", "volitional", "passive", "causative"], {
    suru: ["できます", "しましょう", "されます", "させます"],
    kuru: ["来られます", "来ましょう", "来られます", "来させます"],
  });
});

test("来る tracks its reading through こ・き・く", () => {
  const kuru = VERB_BY_ID.get("kuru")!;
  const readings: [FormId, Politeness, string][] = [
    ["nonpast", "plain", "くる"],
    ["negative", "plain", "こない"],
    ["past", "plain", "きた"],
    ["te", "plain", "きて"],
    ["conditional", "plain", "くれば"],
    ["imperative", "plain", "こい"],
    ["nonpast", "polite", "きます"],
    ["volitional", "polite", "きましょう"],
    ["potential", "polite", "こられます"],
  ];
  for (const [formId, politeness, expected] of readings) {
    assert.equal(conjugate(kuru, formId, politeness).reading, expected, `来る ${politeness} ${formId}`);
  }
});

test("行く takes the っ sound change despite ending in く", () => {
  const iku = VERB_BY_ID.get("iku")!;
  assert.equal(conjugate(iku, "te", "plain").text, "行って");
  assert.equal(conjugate(iku, "past", "plain").text, "行った");
  /* Everything else about 行く is regular. */
  assert.equal(conjugate(iku, "negative", "plain").text, "行かない");
  assert.equal(conjugate(iku, "nonpast", "polite").text, "行きます");
});

test("the polite て column is identical to the plain one", () => {
  for (const verb of VERB_BY_ID.values()) {
    const plain = conjugate(verb, "te", "plain");
    const polite = conjugate(verb, "te", "polite");
    assert.equal(polite.text, plain.text, `${verb.head}${verb.tail} て-form`);
    assert.equal(polite.sameAsPlain, true);
  }
});

test("polite conditional and imperative do not exist", () => {
  for (const verb of VERB_BY_ID.values()) {
    for (const formId of ["conditional", "imperative"] as FormId[]) {
      const cell = conjugate(verb, formId, "polite");
      assert.equal(cell.available, false, `${verb.head}${verb.tail} polite ${formId}`);
      assert.ok(cell.unavailable?.instead);
    }
  }
});

test("causative-passive contracts except after す and outside godan", () => {
  const expected: Record<string, [string, string | null]> = {
    kaku:   ["書かせられる", "書かされる"],
    yomu:   ["読ませられる", "読まされる"],
    matsu:  ["待たせられる", "待たされる"],
    kau:    ["買わせられる", "買わされる"],
    hanasu: ["話させられる", null],
    taberu: ["食べさせられる", null],
    suru:   ["させられる", null],
    kuru:   ["来させられる", null],
  };
  for (const [verbId, [full, contracted]] of Object.entries(expected)) {
    const pair = causativePassivePair(VERB_BY_ID.get(verbId)!);
    assert.equal(pair?.full, full, `${verbId} full`);
    assert.equal(pair?.contracted, contracted, `${verbId} contracted`);
  }
  /* The table column and the conjugator must not drift apart. */
  assert.equal(conjugate(VERB_BY_ID.get("kaku")!, "causativePassive", "plain").text, "書かされる");
  assert.equal(conjugate(VERB_BY_ID.get("hanasu")!, "causativePassive", "plain").text, "話させられる");
  assert.equal(conjugate(VERB_BY_ID.get("taberu")!, "causativePassive", "polite").text, "食べさせられます");
});

test("every cell's segments reassemble into the rendered form", () => {
  const forms: FormId[] = [...CORE, ...EXTENDED, "causativePassive"];
  for (const verb of VERB_BY_ID.values()) {
    for (const politeness of ["plain", "polite"] as Politeness[]) {
      for (const formId of forms) {
        const cell = conjugate(verb, formId, politeness);
        if (!cell.available) continue;
        assert.equal(
          cell.segments.map((segment) => segment.text).join(""),
          cell.text,
          `${verb.head}${verb.tail} ${politeness} ${formId} segments`,
        );
        assert.equal(
          cell.parts.map((part) => part.text).join(""),
          cell.text,
          `${verb.head}${verb.tail} ${politeness} ${formId} parts`,
        );
        const readingFromSegments = cell.segments.map((segment) => segment.reading).join("");
        assert.equal(readingFromSegments, cell.reading, `${verb.head}${verb.tail} ${politeness} ${formId} reading`);
      }
    }
  }
});

test("every form carries an English gloss", () => {
  const forms: FormId[] = [...CORE, ...EXTENDED, "causativePassive"];
  for (const verb of VERBS) {
    for (const formId of forms) {
      const gloss = glossFor(verb, formId);
      assert.ok(gloss && gloss.trim().length > 0, `${verb.id} ${formId}`);
      assert.ok(!gloss.includes("undefined"), `${verb.id} ${formId} → ${gloss}`);
    }
  }
});

test("glosses do not depend on politeness", () => {
  /* 書きます and 書く mean the same thing in English; only the register differs,
     and English does not mark it. */
  for (const verb of VERBS) {
    assert.equal(glossFor(verb, "nonpast"), verb.english.third);
  }
});

test("the passive gloss respects transitivity", () => {
  /* A naive "is <participle>" template turns 死なれる into "is died". */
  assert.equal(glossFor(VERB_BY_ID.get("kaku")!, "passive"), "is written");
  assert.equal(glossFor(VERB_BY_ID.get("taberu")!, "passive"), "is eaten");
  assert.equal(glossFor(VERB_BY_ID.get("matsu")!, "passive"), "is waited for");
  assert.equal(glossFor(VERB_BY_ID.get("shinu")!, "passive"), "have … die");
  assert.equal(glossFor(VERB_BY_ID.get("kuru")!, "passive"), "have … come");
  assert.equal(glossFor(VERB_BY_ID.get("kaeru")!, "passive"), "have … go home");
});

test("gloss templates read correctly for multi-word verbs", () => {
  const kaeru = VERB_BY_ID.get("kaeru")!;
  assert.equal(glossFor(kaeru, "negative"), "does not go home");
  assert.equal(glossFor(kaeru, "potential"), "can go home");
  assert.equal(glossFor(kaeru, "volitional"), "let's go home");
  assert.equal(glossFor(kaeru, "past"), "went home");
  assert.equal(glossFor(kaeru, "causativePassive"), "be made to go home");

  const okiru = VERB_BY_ID.get("okiru")!;
  assert.equal(glossFor(okiru, "nonpast"), "gets up");
  assert.equal(glossFor(okiru, "conditional"), "if … gets up");

  /* する borrows できる for the potential, and the gloss follows the meaning
     rather than the form. */
  assert.equal(glossFor(VERB_BY_ID.get("suru")!, "potential"), "can do");
});
